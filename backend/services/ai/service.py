"""AI admission control, generation, fallback, and usage recording."""

from __future__ import annotations

import logging
import os
import time
import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import get_security_log, set_security_log
from services.ai.config import (
    BURST_LIMIT,
    BURST_WINDOW_SECONDS,
    IDEMPOTENCY_TTL_SECONDS,
    MAX_INPUT_TOKENS,
    THROTTLE_SECONDS,
    clip_text,
    estimate_tokens,
)
from services.ai.cost import groq_allowed_for_request
from services.ai.errors import BUDGET, ProviderError
from services.ai.providers.gemini import call_gemini
from services.ai.providers.groq import call_groq
from services.ai.router import engines_for_task
from services.ai.types import DEFAULT_TASK_TYPE, normalize_task_type

from ai_usage import (
    PUBLIC_PROVIDER,
    ai_message,
    build_user_usage,
    engine_has_remaining_quota,
    groq_month_spend,
    has_reached_daily_limit,
    log_ai_usage,
    release_daily_prompt,
    try_consume_daily_prompt,
)

logger = logging.getLogger(__name__)


def _public_result(text: str, usage: dict) -> dict:
    return {"text": text, "provider": PUBLIC_PROVIDER, "usage": usage}


def _idempotency_key_name(username: str, key: str) -> str:
    return f"ai_idemp:{username}:{key}"


def _sanitize_idempotency_key(value: Optional[str]) -> Optional[str]:
    raw = str(value or "").strip()
    if not raw:
        return None
    cleaned = "".join(ch for ch in raw if ch.isalnum() or ch in "-_.:")
    return cleaned[:128] or None


def _load_idempotent(db: Session, username: str, key: Optional[str]):
    if not key:
        return None
    stored = get_security_log(db, _idempotency_key_name(username, key), None)
    if not isinstance(stored, dict):
        return None
    created = float(stored.get("created_at") or 0)
    if created and (time.time() - created) > IDEMPOTENCY_TTL_SECONDS:
        return None
    if stored.get("text"):
        return stored
    return None


def _store_idempotent(db: Session, username: str, key: Optional[str], payload: dict) -> None:
    if not key:
        return
    set_security_log(
        db,
        _idempotency_key_name(username, key),
        {
            "text": payload.get("text"),
            "provider": PUBLIC_PROVIDER,
            "usage": payload.get("usage"),
            "created_at": time.time(),
        },
    )


def _enforce_rate_limit(db: Session, username: str, language) -> None:
    now_time = time.time()
    last_generate_time = get_security_log(db, f"ai_generate:{username}", 0) or 0
    try:
        last_generate_time = float(last_generate_time)
    except (TypeError, ValueError):
        last_generate_time = 0
    if (now_time - last_generate_time) < THROTTLE_SECONDS:
        raise HTTPException(status_code=429, detail=ai_message("wait_one_second", language))

    burst_key = f"ai_burst:{username}"
    stamps = get_security_log(db, burst_key, []) or []
    if not isinstance(stamps, list):
        stamps = []
    window_start = now_time - BURST_WINDOW_SECONDS
    stamps = [float(ts) for ts in stamps if _is_number(ts) and float(ts) >= window_start]
    if len(stamps) >= BURST_LIMIT:
        raise HTTPException(status_code=429, detail=ai_message("too_many_requests", language))
    stamps.append(now_time)
    set_security_log(db, burst_key, stamps[-BURST_LIMIT:])
    set_security_log(db, f"ai_generate:{username}", now_time)


def _is_number(value) -> bool:
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def _configured_engines() -> dict:
    callers = {}
    if (os.getenv("GEMINI_API_KEY") or "").strip():
        callers["gemini_35"] = lambda prompt: call_gemini("gemini_35", prompt)
        callers["gemini_31"] = lambda prompt: call_gemini("gemini_31", prompt)
    if (os.getenv("GROQ_API_KEY") or "").strip():
        callers["groq"] = call_groq
    return callers


def _call_engine(engine: str, prompt: str):
    if engine == "groq":
        return call_groq(prompt)
    return call_gemini(engine, prompt)


def generate_ai(
    db: Session,
    username: str,
    prompt: str,
    *,
    task_type: str = DEFAULT_TASK_TYPE,
    language: str = "en",
    idempotency_key: Optional[str] = None,
    request_id: Optional[str] = None,
) -> dict:
    lang = language
    task_key = normalize_task_type(task_type)
    req_id = (request_id or "").strip() or str(uuid.uuid4())
    idemp = _sanitize_idempotency_key(idempotency_key)

    cached = _load_idempotent(db, username, idemp)
    if cached:
        usage = cached.get("usage") or build_user_usage(db, username, lang)
        return _public_result(cached.get("text") or "", usage)

    if has_reached_daily_limit(db, username):
        log_ai_usage(
            db,
            username,
            success=False,
            status="limit",
            provider_used="none",
            request_id=req_id,
            task_type=task_key,
            error_type="daily_limit",
        )
        raise HTTPException(status_code=429, detail=ai_message("daily_limit", lang))

    _enforce_rate_limit(db, username, lang)

    callers = _configured_engines()
    if not callers:
        log_ai_usage(
            db,
            username,
            success=False,
            status="error",
            provider_used="none",
            request_id=req_id,
            task_type=task_key,
            error_type="not_configured",
        )
        raise HTTPException(status_code=400, detail=ai_message("not_configured", lang))

    if not try_consume_daily_prompt(db, username):
        log_ai_usage(
            db,
            username,
            success=False,
            status="limit",
            provider_used="none",
            request_id=req_id,
            task_type=task_key,
            error_type="daily_limit",
        )
        raise HTTPException(status_code=429, detail=ai_message("daily_limit", lang))

    clipped = clip_text(prompt or "", MAX_INPUT_TOKENS)
    if estimate_tokens(clipped) > MAX_INPUT_TOKENS * 1.15:
        release_daily_prompt(db, username)
        log_ai_usage(
            db,
            username,
            success=False,
            status="error",
            provider_used="none",
            request_id=req_id,
            task_type=task_key,
            error_type="invalid_request",
        )
        raise HTTPException(status_code=400, detail=ai_message("prompt_too_large", lang))

    chain = [engine for engine in engines_for_task(task_key) if engine in callers]
    groq_status = groq_month_spend(db)
    groq_threshold = groq_status.get("threshold") or "ok"
    groq_is_payg = groq_status.get("billing_mode") == "payg"
    primary_is_groq = bool(chain and chain[0] == "groq")

    last_error = None
    last_error_type = None
    budget_blocked_all = True
    for index, engine in enumerate(chain):
        is_fallback = index > 0
        if (
            engine == "groq"
            and groq_is_payg
            and not groq_allowed_for_request(
                groq_threshold, primary_is_groq, is_fallback
            )
        ):
            last_error_type = BUDGET
            last_error = ProviderError(BUDGET, "groq_budget")
            logger.warning(
                "ai_skip request_id=%s user=%s engine=groq reason=budget threshold=%s",
                req_id,
                username,
                groq_threshold,
            )
            continue
        if not engine_has_remaining_quota(db, engine):
            last_error_type = "quota_exceeded"
            last_error = ProviderError("quota_exceeded", "engine_rpd")
            logger.warning(
                "ai_skip request_id=%s user=%s engine=%s reason=rpd",
                req_id,
                username,
                engine,
            )
            continue

        budget_blocked_all = False
        started = time.perf_counter()
        try:
            result = _call_engine(engine, clipped)
            latency_ms = int((time.perf_counter() - started) * 1000)
            log_ai_usage(
                db,
                username,
                success=True,
                status="ok",
                provider_used=result.engine,
                request_id=req_id,
                task_type=task_key,
                model=result.model,
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
                cached_input_tokens=result.cached_input_tokens,
                estimated_cost=result.estimated_cost,
                latency_ms=latency_ms,
                counts_as_prompt=True,
            )
            usage = build_user_usage(db, username, lang)
            payload = _public_result(result.text, usage)
            _store_idempotent(db, username, idemp, payload)
            logger.info(
                "ai_ok request_id=%s user=%s engine=%s model=%s task=%s in=%s out=%s cached=%s cost=%s latency_ms=%s",
                req_id,
                username,
                result.engine,
                result.model,
                task_key,
                result.input_tokens,
                result.output_tokens,
                result.cached_input_tokens,
                result.estimated_cost,
                latency_ms,
            )
            return payload
        except ProviderError as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            last_error = exc
            last_error_type = exc.error_type
            log_ai_usage(
                db,
                username,
                success=False,
                status="error",
                provider_used=engine,
                request_id=req_id,
                task_type=task_key,
                error_type=exc.error_type,
                latency_ms=latency_ms,
                counts_as_prompt=False,
            )
            logger.warning(
                "ai_fail request_id=%s user=%s engine=%s task=%s error=%s latency_ms=%s",
                req_id,
                username,
                engine,
                task_key,
                exc.error_type,
                latency_ms,
            )
            if not exc.fallback_allowed:
                break
            continue
        except Exception as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            last_error = exc
            last_error_type = "internal_error"
            log_ai_usage(
                db,
                username,
                success=False,
                status="error",
                provider_used=engine,
                request_id=req_id,
                task_type=task_key,
                error_type="internal_error",
                latency_ms=latency_ms,
            )
            logger.warning(
                "ai_fail request_id=%s user=%s engine=%s task=%s error=internal latency_ms=%s",
                req_id,
                username,
                engine,
                task_key,
                latency_ms,
            )
            continue

    release_daily_prompt(db, username)
    if budget_blocked_all or last_error_type == BUDGET:
        log_ai_usage(
            db,
            username,
            success=False,
            status="error",
            provider_used="none",
            request_id=req_id,
            task_type=task_key,
            error_type=BUDGET,
        )
        raise HTTPException(status_code=503, detail=ai_message("usage_limit", lang))

    logger.error("ai_unavailable request_id=%s user=%s last_error=%s", req_id, username, last_error)
    raise HTTPException(status_code=503, detail=ai_message("unavailable", lang))


def get_user_usage(db: Session, username: str, language=None) -> dict:
    return build_user_usage(db, username, language)
