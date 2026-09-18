"""Daily Smart Assistant quota, usage logging, and admin overview."""

from __future__ import annotations

import json
from calendar import monthrange
from datetime import datetime, timedelta

import pytz
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import AIUsageDailyStat, AIUsageLog, AIUserDailyUsage, AppSetting, User
from services.ai.config import (
    DEFAULT_DAILY_LIMIT,
    GROQ_MODEL,
    MAX_DAILY_LIMIT,
)
from services.ai.cost import budget_threshold
from services.ai.router import engines_for_task, gemini_engine_order
from services.ai.types import DEFAULT_TASK_TYPE, normalize_task_type

WIB = pytz.timezone("Asia/Jakarta")

AI_DEFAULT_LIMIT_KEY = "ai_default_daily_limit"
AI_USER_LIMITS_KEY = "ai_user_daily_limits"
AI_ENGINE_PLANS_KEY = "ai_engine_plans"

GEMINI_35_MODEL = "gemini-3.5-flash-lite"
GEMINI_31_MODEL = "gemini-3.1-flash-lite"

# Lightweight-first documented order. Complex tasks reverse Groq to the front in the router.
ENGINE_FALLBACK_ORDER = tuple(engines_for_task(DEFAULT_TASK_TYPE))

LEGACY_PROVIDER_MAP = {"gemini": "gemini_35"}

ENGINE_PLAN_CATALOG = {
    "gemini_35": {
        "model": GEMINI_35_MODEL,
        "label": "Gemini 3.5 Flash-Lite",
        "plans": {
            "free": {
                "id": "free",
                "label": "Free",
                "rpd": 500,
                "rpm": 15,
                "tpm": 250000,
            },
            "tier1": {
                "id": "tier1",
                "label": "Tier 1",
                "rpd": 10000,
                "rpm": 1000,
                "tpm": 1000000,
            },
        },
        "default_plan": "free",
    },
    "gemini_31": {
        "model": GEMINI_31_MODEL,
        "label": "Gemini 3.1 Flash-Lite",
        "plans": {
            "free": {
                "id": "free",
                "label": "Free",
                "rpd": 500,
                "rpm": 15,
                "tpm": 250000,
            },
            "tier1": {
                "id": "tier1",
                "label": "Tier 1",
                "rpd": 10000,
                "rpm": 1000,
                "tpm": 1000000,
            },
        },
        "default_plan": "free",
    },
    "groq": {
        "model": GROQ_MODEL,
        "label": "Groq GPT-OSS 120B",
        "plans": {
            "free": {
                "id": "free",
                "label": "Free",
                "rpd": 1000,
                "rpm": 30,
                "tpm": 8000,
                "tpd": 200000,
            },
            "developer": {
                "id": "developer",
                "label": "Developer (pay-as-you-go)",
                "rpd": None,
                "rpm": 1000,
                "tpm": 250000,
            },
        },
        "default_plan": "developer",
    },
}

PUBLIC_PROVIDER = "Smart Assistant"

AI_MESSAGES = {
    "daily_limit": {
        "en": (
            "Daily AI limit reached. You have used all of your available AI prompts "
            "for today. Your limit will reset tomorrow."
        ),
        "id": (
            "Batas AI harian tercapai. Anda telah memakai semua prompt AI yang tersedia "
            "hari ini. Limit akan direset besok."
        ),
    },
    "wait_one_second": {
        "en": "Please wait 1 second before generating another AI response.",
        "id": "Tunggu 1 detik sebelum mengirim permintaan Smart Assistant lagi.",
    },
    "too_many_requests": {
        "en": "You are sending AI requests too quickly. Please wait a moment and try again.",
        "id": "Anda mengirim permintaan AI terlalu cepat. Tunggu sebentar lalu coba lagi.",
    },
    "unavailable": {
        "en": "Smart Assistant is temporarily unavailable. Please try again in a moment.",
        "id": "Smart Assistant sedang tidak tersedia. Silakan coba lagi sebentar lagi.",
    },
    "not_configured": {
        "en": "Smart Assistant is not configured. Please contact your administrator.",
        "id": "Smart Assistant belum dikonfigurasi. Silakan hubungi administrator.",
    },
    "usage_limit": {
        "en": "AI service usage limit has been reached. Please try again later.",
        "id": "Batas pemakaian layanan AI telah tercapai. Silakan coba lagi nanti.",
    },
    "prompt_too_large": {
        "en": "This request is too large for Smart Assistant. Please shorten the content and try again.",
        "id": "Permintaan ini terlalu besar untuk Smart Assistant. Persingkat konten lalu coba lagi.",
    },
}

GENERIC_UNAVAILABLE = AI_MESSAGES["unavailable"]["en"]
GENERIC_NOT_CONFIGURED = AI_MESSAGES["not_configured"]["en"]
DAILY_LIMIT_MESSAGE = AI_MESSAGES["daily_limit"]["en"]


def normalize_ai_language(language) -> str:
    raw = str(language or "").strip().lower()
    if raw.startswith("id") or raw in {"in", "indonesia", "indonesian", "bahasa"}:
        return "id"
    return "en"


def ai_message(key: str, language=None) -> str:
    lang = normalize_ai_language(language)
    bundle = AI_MESSAGES.get(key) or {}
    return bundle.get(lang) or bundle.get("en") or ""


def remaining_message(remaining: int, language=None) -> str:
    lang = normalize_ai_language(language)
    n = max(0, int(remaining or 0))
    if n <= 0:
        return ai_message("daily_limit", lang)
    if lang == "id":
        return f"Anda memiliki {n} prompt AI tersisa hari ini."
    return f"You have {n} AI prompts remaining today."


def wib_today_start_naive_utc() -> datetime:
    now = datetime.now(WIB)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.astimezone(pytz.UTC).replace(tzinfo=None)


def wib_today_date_str() -> str:
    return datetime.now(WIB).strftime("%Y-%m-%d")


def wib_month_start_naive_utc() -> datetime:
    now = datetime.now(WIB)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return start.astimezone(pytz.UTC).replace(tzinfo=None)


def wib_month_key() -> str:
    return datetime.now(WIB).strftime("%Y-%m")


def wib_tomorrow_iso() -> str:
    now = datetime.now(WIB)
    nxt = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return nxt.isoformat()


def _setting_row(db: Session, key: str):
    return db.query(AppSetting).filter(AppSetting.key == key).first()


def clamp_daily_limit(value) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return DEFAULT_DAILY_LIMIT
    if parsed <= 0:
        return DEFAULT_DAILY_LIMIT
    return max(1, min(parsed, MAX_DAILY_LIMIT))


def get_default_daily_limit(db: Session) -> int:
    row = _setting_row(db, AI_DEFAULT_LIMIT_KEY)
    if not row or row.value is None or str(row.value).strip() == "":
        return DEFAULT_DAILY_LIMIT
    return clamp_daily_limit(str(row.value).strip())


def set_default_daily_limit(db: Session, limit: int) -> int:
    value = clamp_daily_limit(limit)
    payload = str(value)
    row = _setting_row(db, AI_DEFAULT_LIMIT_KEY)
    if row:
        row.value = payload
        row.updated_at = datetime.utcnow()
    else:
        db.add(AppSetting(key=AI_DEFAULT_LIMIT_KEY, value=payload))
    db.commit()
    return value


def get_user_limit_overrides(db: Session) -> dict:
    row = _setting_row(db, AI_USER_LIMITS_KEY)
    if not row or not row.value:
        return {}
    try:
        stored = json.loads(row.value)
    except Exception:
        return {}
    if not isinstance(stored, dict):
        return {}
    cleaned = {}
    for username, raw in stored.items():
        if not username or raw is None:
            continue
        try:
            cleaned[str(username)] = clamp_daily_limit(raw)
        except (TypeError, ValueError):
            continue
    return cleaned


def save_user_limit_overrides(db: Session, overrides: dict) -> dict:
    payload = json.dumps(overrides)
    row = _setting_row(db, AI_USER_LIMITS_KEY)
    if row:
        row.value = payload
        row.updated_at = datetime.utcnow()
    else:
        db.add(AppSetting(key=AI_USER_LIMITS_KEY, value=payload))
    db.commit()
    return overrides


def merge_user_limit_overrides(db: Session, updates: dict) -> dict:
    current = get_user_limit_overrides(db)
    for username, value in (updates or {}).items():
        key = str(username or "").strip()
        if not key:
            continue
        if value is None:
            current.pop(key, None)
            continue
        current[key] = clamp_daily_limit(value)
    return save_user_limit_overrides(db, current)


def effective_daily_limit(db: Session, username: str) -> int:
    overrides = get_user_limit_overrides(db)
    if username in overrides:
        return clamp_daily_limit(overrides[username])
    return get_default_daily_limit(db)


def count_successful_today(db: Session, username: str) -> int:
    start = wib_today_start_naive_utc()
    counted = (
        db.query(func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.username == username,
            AIUsageLog.created_at >= start,
            AIUsageLog.status == "ok",
            or_(AIUsageLog.counts_as_prompt == 1, AIUsageLog.counts_as_prompt.is_(None)),
        )
        .scalar()
        or 0
    )
    daily = (
        db.query(AIUserDailyUsage.prompt_count)
        .filter(
            AIUserDailyUsage.username == username,
            AIUserDailyUsage.usage_date == wib_today_date_str(),
        )
        .scalar()
    )
    return max(int(counted), int(daily or 0))


def has_reached_daily_limit(db: Session, username: str) -> bool:
    limit = effective_daily_limit(db, username)
    return count_successful_today(db, username) >= limit


def _daily_row(db: Session, username: str, date_str: str) -> AIUserDailyUsage:
    row = (
        db.query(AIUserDailyUsage)
        .filter(
            AIUserDailyUsage.username == username,
            AIUserDailyUsage.usage_date == date_str,
        )
        .with_for_update()
        .first()
    )
    if row:
        return row
    row = AIUserDailyUsage(username=username, usage_date=date_str, prompt_count=0)
    db.add(row)
    db.flush()
    return row


def try_consume_daily_prompt(db: Session, username: str) -> bool:
    """Atomically reserve one daily prompt. Returns False when the user is at the limit."""
    limit = effective_daily_limit(db, username)
    date_str = wib_today_date_str()
    used = count_successful_today(db, username)
    if used >= limit:
        return False
    row = _daily_row(db, username, date_str)
    if (row.prompt_count or 0) >= limit:
        db.commit()
        return False
    row.prompt_count = int(row.prompt_count or 0) + 1
    row.updated_at = datetime.utcnow()
    db.commit()
    return True


def release_daily_prompt(db: Session, username: str) -> None:
    date_str = wib_today_date_str()
    row = (
        db.query(AIUserDailyUsage)
        .filter(
            AIUserDailyUsage.username == username,
            AIUserDailyUsage.usage_date == date_str,
        )
        .first()
    )
    if not row:
        return
    row.prompt_count = max(0, int(row.prompt_count or 0) - 1)
    row.updated_at = datetime.utcnow()
    db.commit()


def get_engine_plan_selections(db: Session) -> dict:
    row = _setting_row(db, AI_ENGINE_PLANS_KEY)
    stored = {}
    if row and row.value:
        try:
            parsed = json.loads(row.value)
            if isinstance(parsed, dict):
                stored = parsed
        except Exception:
            stored = {}
    selections = {}
    for engine, catalog in ENGINE_PLAN_CATALOG.items():
        raw = stored.get(engine) if isinstance(stored.get(engine), dict) else {}
        plan_id = str((raw or {}).get("plan") or catalog["default_plan"]).strip().lower()
        if plan_id not in catalog["plans"]:
            plan_id = catalog["default_plan"]
        custom_rpd = None
        if (raw or {}).get("rpd") is not None:
            try:
                custom_rpd = max(0, int((raw or {}).get("rpd")))
            except (TypeError, ValueError):
                custom_rpd = None
        selections[engine] = {"plan": plan_id, "rpd": custom_rpd}
    return selections


def save_engine_plan_selections(db: Session, updates: dict) -> dict:
    current = get_engine_plan_selections(db)
    for engine, payload in (updates or {}).items():
        if engine not in ENGINE_PLAN_CATALOG:
            continue
        catalog = ENGINE_PLAN_CATALOG[engine]
        raw = payload if isinstance(payload, dict) else {"plan": payload}
        plan_id = str(raw.get("plan") or current[engine]["plan"]).strip().lower()
        if plan_id not in catalog["plans"]:
            plan_id = catalog["default_plan"]
        next_row = {"plan": plan_id}
        if raw.get("rpd") is not None:
            next_row["rpd"] = max(0, int(raw["rpd"]))
        current[engine] = next_row
    payload = json.dumps(current)
    row = _setting_row(db, AI_ENGINE_PLANS_KEY)
    if row:
        row.value = payload
        row.updated_at = datetime.utcnow()
    else:
        db.add(AppSetting(key=AI_ENGINE_PLANS_KEY, value=payload))
    db.commit()
    return get_engine_plan_selections(db)


def _resolve_engine_plan(engine: str, selection: dict) -> dict:
    catalog = ENGINE_PLAN_CATALOG.get(engine) or {}
    plans = catalog.get("plans") or {}
    plan_id = (selection or {}).get("plan") or catalog.get("default_plan")
    spec = dict(plans.get(plan_id) or plans.get(catalog.get("default_plan")) or {})
    return {
        "engine": engine,
        "label": catalog.get("label") or engine,
        "model": catalog.get("model"),
        "plan": spec.get("id") or plan_id,
        "plan_label": spec.get("label") or plan_id,
        "rpd": spec.get("rpd"),
        "rpm": spec.get("rpm"),
        "tpm": spec.get("tpm"),
        "tpd": spec.get("tpd"),
        "available_plans": [
            {
                "id": item["id"],
                "label": item["label"],
                "rpd": item.get("rpd"),
                "rpm": item.get("rpm"),
                "tpm": item.get("tpm"),
                "tpd": item.get("tpd"),
            }
            for item in plans.values()
        ],
    }


def _build_engine_usage(engine_counts: dict, db: Session) -> dict:
    selections = get_engine_plan_selections(db)
    engines = {}
    for engine in ENGINE_PLAN_CATALOG:
        used = int(engine_counts.get(engine) or 0)
        resolved = _resolve_engine_plan(engine, selections.get(engine) or {})
        rpd = resolved.get("rpd")
        unlimited = rpd is None or rpd == 0
        remaining = None if unlimited else max(0, rpd - used)
        engines[engine] = {
            **resolved,
            "used_today": used,
            "unlimited": unlimited,
            "remaining": remaining,
            "at_limit": (not unlimited) and used >= rpd,
        }
    return engines


def normalize_provider_used(provider_used: str) -> str:
    raw = str(provider_used or "none").strip().lower()
    return LEGACY_PROVIDER_MAP.get(raw, raw or "none")


def count_engine_success_today(db: Session, engine: str) -> int:
    start = wib_today_start_naive_utc()
    aliases = [engine]
    for legacy, mapped in LEGACY_PROVIDER_MAP.items():
        if mapped == engine:
            aliases.append(legacy)
    return (
        db.query(func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.created_at >= start,
            AIUsageLog.status == "ok",
            AIUsageLog.provider_used.in_(aliases),
        )
        .scalar()
        or 0
    )


def engine_has_remaining_quota(db: Session, engine: str) -> bool:
    if engine not in ENGINE_PLAN_CATALOG:
        return False
    selections = get_engine_plan_selections(db)
    resolved = _resolve_engine_plan(engine, selections.get(engine) or {})
    rpd = resolved.get("rpd")
    if rpd is None or rpd == 0:
        return True
    return count_engine_success_today(db, engine) < rpd


def combined_provider_rpd(db: Session, engine_counts: dict = None) -> dict:
    selections = get_engine_plan_selections(db)
    total = 0
    unlimited = False
    used = 0
    remaining = 0
    order = list(gemini_engine_order()) + ["groq"]
    for engine in order:
        resolved = _resolve_engine_plan(engine, selections.get(engine) or {})
        if engine_counts is None:
            engine_used = count_engine_success_today(db, engine)
        else:
            engine_used = int(engine_counts.get(engine) or 0)
        used += engine_used
        rpd = resolved.get("rpd")
        if rpd is None or rpd == 0:
            unlimited = True
            continue
        total += rpd
        remaining += max(0, rpd - engine_used)
    return {
        "order": order,
        "lightweight_order": list(engines_for_task("SIMPLE_QA")),
        "complex_order": list(engines_for_task("PROJECT_ANALYSIS")),
        "rpd_total": None if unlimited else total,
        "used_today": used,
        "remaining": None if unlimited else remaining,
        "unlimited": unlimited,
    }


def groq_month_spend(db: Session) -> dict:
    month_start = wib_month_start_naive_utc()
    month_key = wib_month_key()
    year, month = [int(part) for part in month_key.split("-")]
    prefix = f"{month_key}-"
    agg = (
        db.query(
            func.coalesce(func.sum(AIUsageDailyStat.estimated_cost), 0.0),
            func.coalesce(func.sum(AIUsageDailyStat.input_tokens), 0),
            func.coalesce(func.sum(AIUsageDailyStat.output_tokens), 0),
            func.coalesce(func.sum(AIUsageDailyStat.cached_input_tokens), 0),
            func.coalesce(func.sum(AIUsageDailyStat.request_count), 0),
        )
        .filter(
            AIUsageDailyStat.provider == "groq",
            AIUsageDailyStat.usage_date.like(f"{prefix}%"),
        )
        .first()
    )
    spent = float(agg[0] or 0) if agg else 0.0
    input_tokens = int(agg[1] or 0) if agg else 0
    output_tokens = int(agg[2] or 0) if agg else 0
    cached_tokens = int(agg[3] or 0) if agg else 0
    requests = int(agg[4] or 0) if agg else 0

    if spent <= 0 and requests <= 0:
        raw = (
            db.query(
                func.coalesce(func.sum(AIUsageLog.estimated_cost), 0.0),
                func.coalesce(func.sum(AIUsageLog.input_tokens), 0),
                func.coalesce(func.sum(AIUsageLog.output_tokens), 0),
                func.coalesce(func.sum(AIUsageLog.cached_input_tokens), 0),
                func.count(AIUsageLog.id),
            )
            .filter(
                AIUsageLog.provider_used == "groq",
                AIUsageLog.created_at >= month_start,
            )
            .first()
        )
        spent = float(raw[0] or 0) if raw else 0.0
        input_tokens = int(raw[1] or 0) if raw else 0
        output_tokens = int(raw[2] or 0) if raw else 0
        cached_tokens = int(raw[3] or 0) if raw else 0
        requests = int(raw[4] or 0) if raw else 0

    from services.ai.config import GROQ_MONTHLY_BUDGET_USD

    budget = GROQ_MONTHLY_BUDGET_USD
    remaining = max(0.0, budget - spent)
    ratio = 0.0 if budget <= 0 else spent / budget
    days = monthrange(year, month)[1]
    return {
        "monthly_budget_usd": round(budget, 2),
        "spent_usd": round(spent, 4),
        "remaining_usd": round(remaining, 4),
        "usage_ratio": round(ratio, 4),
        "threshold": budget_threshold(spent, budget),
        "month": month_key,
        "model": GROQ_MODEL,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cached_input_tokens": cached_tokens,
        "requests": requests,
        "days_in_month": days,
    }


def bump_daily_stats(
    db: Session,
    provider: str,
    task_type: str,
    *,
    request_count: int = 1,
    prompt_count: int = 0,
    input_tokens: int = 0,
    output_tokens: int = 0,
    cached_input_tokens: int = 0,
    estimated_cost: float = 0.0,
    error_count: int = 0,
    rate_limit_count: int = 0,
) -> None:
    date_str = wib_today_date_str()
    provider_key = normalize_provider_used(provider) or "none"
    task_key = normalize_task_type(task_type)
    row = (
        db.query(AIUsageDailyStat)
        .filter(
            AIUsageDailyStat.usage_date == date_str,
            AIUsageDailyStat.provider == provider_key,
            AIUsageDailyStat.task_type == task_key,
        )
        .first()
    )
    if not row:
        row = AIUsageDailyStat(
            usage_date=date_str,
            provider=provider_key,
            task_type=task_key,
            request_count=0,
            prompt_count=0,
            input_tokens=0,
            output_tokens=0,
            cached_input_tokens=0,
            estimated_cost=0.0,
            error_count=0,
            rate_limit_count=0,
        )
        db.add(row)
        db.flush()
    row.request_count = int(row.request_count or 0) + request_count
    row.prompt_count = int(row.prompt_count or 0) + prompt_count
    row.input_tokens = int(row.input_tokens or 0) + int(input_tokens or 0)
    row.output_tokens = int(row.output_tokens or 0) + int(output_tokens or 0)
    row.cached_input_tokens = int(row.cached_input_tokens or 0) + int(cached_input_tokens or 0)
    row.estimated_cost = float(row.estimated_cost or 0) + float(estimated_cost or 0)
    row.error_count = int(row.error_count or 0) + error_count
    row.rate_limit_count = int(row.rate_limit_count or 0) + rate_limit_count


def log_ai_usage(
    db: Session,
    username: str,
    success: bool,
    status: str,
    provider_used: str = "none",
    *,
    request_id: str = None,
    task_type: str = None,
    model: str = None,
    input_tokens: int = 0,
    output_tokens: int = 0,
    cached_input_tokens: int = 0,
    estimated_cost: float = 0.0,
    error_type: str = None,
    latency_ms: int = 0,
    counts_as_prompt: bool = False,
):
    provider = normalize_provider_used(provider_used)
    task_key = normalize_task_type(task_type) if task_type else None
    db.add(
        AIUsageLog(
            username=username,
            success=1 if success else 0,
            status=status,
            provider_used=provider or "none",
            request_id=request_id,
            task_type=task_key,
            model=model,
            input_tokens=int(input_tokens or 0),
            output_tokens=int(output_tokens or 0),
            cached_input_tokens=int(cached_input_tokens or 0),
            estimated_cost=float(estimated_cost or 0),
            error_type=error_type,
            latency_ms=int(latency_ms or 0),
            counts_as_prompt=1 if counts_as_prompt else 0,
        )
    )
    bump_daily_stats(
        db,
        provider,
        task_key or DEFAULT_TASK_TYPE,
        request_count=1,
        prompt_count=1 if counts_as_prompt and success else 0,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cached_input_tokens=cached_input_tokens,
        estimated_cost=estimated_cost,
        error_count=0 if success else 1,
        rate_limit_count=1 if error_type in ("rate_limit", "quota_exceeded") else 0,
    )
    db.commit()


def build_user_usage(db: Session, username: str, language=None) -> dict:
    used = count_successful_today(db, username)
    limit = effective_daily_limit(db, username)
    remaining = max(0, limit - used)
    lang = normalize_ai_language(language)
    payload = {
        "used": used,
        "limit": limit,
        "remaining": remaining,
        "resets_at": wib_tomorrow_iso(),
        "approaching": 0 < remaining <= 3,
        "at_limit": remaining <= 0,
    }
    if remaining <= 0:
        payload["message"] = ai_message("daily_limit", lang)
    elif remaining <= 3:
        payload["message"] = remaining_message(remaining, lang)
    else:
        payload["message"] = None
    return payload


def build_overview(db: Session) -> dict:
    start = wib_today_start_naive_utc()
    default_limit = get_default_daily_limit(db)
    overrides = get_user_limit_overrides(db)
    today = wib_today_date_str()

    daily_user_rows = (
        db.query(AIUserDailyUsage)
        .filter(AIUserDailyUsage.usage_date == today)
        .all()
    )
    used_by_user = {row.username: int(row.prompt_count or 0) for row in daily_user_rows}

    ok_prompt_rows = (
        db.query(AIUsageLog.username, func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.created_at >= start,
            AIUsageLog.status == "ok",
            or_(AIUsageLog.counts_as_prompt == 1, AIUsageLog.counts_as_prompt.is_(None)),
        )
        .group_by(AIUsageLog.username)
        .all()
    )
    for username, count in ok_prompt_rows:
        used_by_user[username] = max(used_by_user.get(username, 0), int(count or 0))

    last_ok_by_user = {}
    last_ok_rows = (
        db.query(AIUsageLog.username, func.max(AIUsageLog.created_at))
        .filter(AIUsageLog.status == "ok")
        .group_by(AIUsageLog.username)
        .all()
    )
    for username, last_at in last_ok_rows:
        last_ok_by_user[username] = last_at

    last_any = dict(
        db.query(AIUsageLog.username, func.max(AIUsageLog.created_at))
        .group_by(AIUsageLog.username)
        .all()
    )

    engine_counts = {engine: 0 for engine in ENGINE_PLAN_CATALOG}
    engine_rows = (
        db.query(AIUsageLog.provider_used, func.count(AIUsageLog.id))
        .filter(AIUsageLog.created_at >= start, AIUsageLog.status == "ok")
        .group_by(AIUsageLog.provider_used)
        .all()
    )
    for provider, count in engine_rows:
        key = normalize_provider_used(provider)
        if key in engine_counts:
            engine_counts[key] += int(count or 0)

    task_counts = {}
    task_rows = (
        db.query(AIUsageLog.task_type, func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.created_at >= start,
            AIUsageLog.status == "ok",
            or_(AIUsageLog.counts_as_prompt == 1, AIUsageLog.counts_as_prompt.is_(None)),
        )
        .group_by(AIUsageLog.task_type)
        .all()
    )
    for task_type, count in task_rows:
        label = task_type or "UNSPECIFIED"
        task_counts[label] = int(count or 0)

    error_count = (
        db.query(func.count(AIUsageLog.id))
        .filter(AIUsageLog.created_at >= start, AIUsageLog.status == "error")
        .scalar()
        or 0
    )
    rate_limit_count = (
        db.query(func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.created_at >= start,
            or_(
                AIUsageLog.error_type.in_(["rate_limit", "quota_exceeded"]),
                AIUsageLog.status == "limit",
            ),
        )
        .scalar()
        or 0
    )

    users = db.query(User).order_by(User.username.asc()).all()
    user_payload = []
    users_at_limit = 0
    for user in users:
        username = user.username
        used = used_by_user.get(username, 0)
        has_override = username in overrides
        limit = clamp_daily_limit(overrides[username]) if has_override else default_limit
        remaining = max(0, limit - used)
        at_limit = used >= limit
        if at_limit:
            users_at_limit += 1
        last_used = last_ok_by_user.get(username) or last_any.get(username)
        user_payload.append(
            {
                "username": username,
                "full_name": user.full_name or "",
                "used_today": used,
                "limit": limit,
                "unlimited": False,
                "remaining": remaining,
                "override": overrides[username] if has_override else None,
                "last_used_at": last_used.isoformat() if last_used else None,
                "at_limit": at_limit,
            }
        )

    capacity = combined_provider_rpd(db, engine_counts)
    app_need_100 = default_limit * 100
    gemini_rpd = 0
    gemini_unlimited = False
    selections = get_engine_plan_selections(db)
    for engine in gemini_engine_order():
        resolved = _resolve_engine_plan(engine, selections.get(engine) or {})
        rpd = resolved.get("rpd")
        if rpd is None or rpd == 0:
            gemini_unlimited = True
        else:
            gemini_rpd += rpd
    enough_for_100 = gemini_unlimited or gemini_rpd >= app_need_100
    groq_budget = groq_month_spend(db)
    gemini_used = engine_counts.get("gemini_31", 0) + engine_counts.get("gemini_35", 0)
    groq_used = engine_counts.get("groq", 0)
    provider_total = gemini_used + groq_used
    provider_distribution = {
        "gemini": round((gemini_used / provider_total) * 100, 1) if provider_total else 0,
        "groq": round((groq_used / provider_total) * 100, 1) if provider_total else 0,
        "gemini_count": gemini_used,
        "groq_count": groq_used,
    }

    return {
        "default_daily_limit": default_limit,
        "max_daily_limit": MAX_DAILY_LIMIT,
        "today": {
            "date": today,
            "total_prompts": sum(used_by_user.values()),
            "active_users": len([u for u, n in used_by_user.items() if n > 0]),
            "users_at_limit": users_at_limit,
            "by_engine": engine_counts,
            "by_task_type": task_counts,
            "errors": int(error_count),
            "rate_limits": int(rate_limit_count),
        },
        "capacity": {
            **capacity,
            "app_need_100_users": app_need_100,
            "enough_for_100_users": enough_for_100,
        },
        "engines": _build_engine_usage(engine_counts, db),
        "groq_budget": groq_budget,
        "gemini": {
            "provider": "Google Gemini",
            "used_today": gemini_used,
            "rpd_total": None if gemini_unlimited else gemini_rpd,
            "quota_note": "Subject to provider quota and rate limits. Not treated as unlimited.",
        },
        "provider_distribution": provider_distribution,
        "users": user_payload,
    }
