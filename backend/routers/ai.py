from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime
import json
import logging
import os
import re
import time
import requests
from google import genai
from google.genai import types

from database import AIConversation, get_db, get_security_log, set_security_log
from schemas import *
from dependencies import *
from ai_usage import (
    PUBLIC_PROVIDER,
    ai_message,
    has_reached_daily_limit,
    log_ai_usage,
)

logger = logging.getLogger(__name__)
router = APIRouter()

GROQ_MAX_PROMPT_CHARS = 24000
_HTML_TAG_RE = re.compile(r"<[^>]*>")
_DEFAULT_TITLE = "New chat"


def _parse_json(value, default):
    if not value:
        return default
    try:
        parsed = json.loads(value)
        return parsed if parsed is not None else default
    except (TypeError, ValueError, json.JSONDecodeError):
        return default


def _plain_text(value):
    text = _HTML_TAG_RE.sub("", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _preview_from_messages(messages):
    if not isinstance(messages, list):
        return ""
    for msg in reversed(messages):
        if not isinstance(msg, dict):
            continue
        if msg.get("sender") in ("user", "bot"):
            preview = _plain_text(msg.get("text"))
            if preview:
                return preview[:160]
    return ""


def _title_from_messages(messages, fallback=_DEFAULT_TITLE):
    if not isinstance(messages, list):
        return fallback
    for msg in messages:
        if isinstance(msg, dict) and msg.get("sender") == "user":
            title = _plain_text(msg.get("text"))
            if title:
                return title[:80]
    return fallback


def _iso(dt):
    return dt.isoformat() if dt else None


def _serialize_conversation(row, include_body=False):
    messages = _parse_json(row.messages, [])
    data = {
        "id": row.id,
        "title": row.title or _DEFAULT_TITLE,
        "created_at": _iso(row.created_at),
        "updated_at": _iso(row.updated_at),
        "preview": _preview_from_messages(messages),
    }
    if include_body:
        data["messages"] = messages if isinstance(messages, list) else []
        state = _parse_json(row.state, {})
        data["state"] = state if isinstance(state, dict) else {}
    return data


def _owned_conversation(db: Session, username: str, conversation_id: int):
    row = (
        db.query(AIConversation)
        .filter(
            AIConversation.id == conversation_id,
            AIConversation.username == username,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return row


def _public_result(text: str):
    return {"text": text, "provider": PUBLIC_PROVIDER}


def _extract_gemini_text(response) -> str:
    text = (getattr(response, "text", None) or "").strip()
    if text:
        return text
    parts = []
    for candidate in getattr(response, "candidates", None) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", None) or []:
            if getattr(part, "thought", False):
                continue
            piece = getattr(part, "text", None)
            if piece:
                parts.append(piece)
    text = "\n".join(parts).strip()
    if text:
        return text
    raise Exception("empty_response")


@router.post("/api/ai/generate")
def generate_ai_text(
    payload: AIGenerateModel, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)
):
    lang = getattr(payload, "language", None)
    if has_reached_daily_limit(db, current_user):
        log_ai_usage(db, current_user, success=False, status="limit", provider_used="none")
        raise HTTPException(status_code=429, detail=ai_message("daily_limit", lang))

    now_time = time.time()
    last_generate_time = get_security_log(db, f"ai_generate:{current_user}", 0) or 0
    try:
        last_generate_time = float(last_generate_time)
    except (TypeError, ValueError):
        last_generate_time = 0
    if (now_time - last_generate_time) < 1:
        raise HTTPException(
            status_code=429,
            detail=ai_message("wait_one_second", lang),
        )
    set_security_log(db, f"ai_generate:{current_user}", now_time)

    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    final_prompt = payload.prompt or ""

    def call_gemini():
        if not gemini_api_key:
            raise Exception("missing_key")
        client = genai.Client(api_key=gemini_api_key.strip())
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=final_prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            return {"text": _extract_gemini_text(response), "engine": "gemini"}
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                raise Exception("rate_limited") from e
            raise

    def call_llama():
        if not groq_api_key:
            raise Exception("missing_key")
        if len(final_prompt) > GROQ_MAX_PROMPT_CHARS:
            raise Exception("prompt_too_large")
        headers = {
            "Authorization": f"Bearer {groq_api_key.strip()}",
            "Content-Type": "application/json",
        }
        data = {
            "model": "openai/gpt-oss-120b",
            "messages": [{"role": "user", "content": final_prompt}],
        }
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=45,
        )
        if response.status_code == 429:
            raise Exception("rate_limited")
        if response.status_code in (400, 413):
            raise Exception("prompt_too_large")
        response.raise_for_status()
        content = (
            response.json().get("choices") or [{}]
        )[0].get("message", {}).get("content")
        text = (content or "").strip()
        if not text:
            raise Exception("empty_response")
        return {"text": text, "engine": "groq"}

    if not gemini_api_key and not groq_api_key:
        log_ai_usage(db, current_user, success=False, status="error", provider_used="none")
        raise HTTPException(status_code=400, detail=ai_message("not_configured", lang))

    last_error = None
    if gemini_api_key:
        try:
            result = call_gemini()
            log_ai_usage(db, current_user, success=True, status="ok", provider_used="gemini")
            return _public_result(result["text"])
        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            logger.warning("Primary AI engine failed: %s", e)

    if groq_api_key:
        try:
            result = call_llama()
            log_ai_usage(db, current_user, success=True, status="ok", provider_used="groq")
            return _public_result(result["text"])
        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            logger.warning("Fallback AI engine failed: %s", e)

    log_ai_usage(db, current_user, success=False, status="error", provider_used="none")
    logger.error("AI generation failed for %s: %s", current_user, last_error)
    raise HTTPException(status_code=503, detail=ai_message("unavailable", lang))


@router.get("/api/ai/conversations")
def list_ai_conversations(
    q: str = Query("", max_length=200),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AIConversation).filter(AIConversation.username == current_user)
    term = (q or "").strip()
    if term:
        like = f"%{term.lower()}%"
        query = query.filter(
            or_(
                func.lower(AIConversation.title).like(like),
                func.lower(func.coalesce(AIConversation.messages, "")).like(like),
            )
        )
    rows = query.order_by(AIConversation.updated_at.desc()).limit(200).all()
    return {"conversations": [_serialize_conversation(row) for row in rows]}


@router.get("/api/ai/conversations/{conversation_id}")
def get_ai_conversation(
    conversation_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _owned_conversation(db, current_user, conversation_id)
    return _serialize_conversation(row, include_body=True)


@router.post("/api/ai/conversations")
def create_ai_conversation(
    payload: AIConversationCreateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = payload.messages if isinstance(payload.messages, list) else []
    state = payload.state if isinstance(payload.state, dict) else {}
    title = (payload.title or "").strip() or _title_from_messages(messages)
    now = datetime.utcnow()
    row = AIConversation(
        username=current_user,
        title=title[:120],
        messages=json.dumps(messages),
        state=json.dumps(state),
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_conversation(row, include_body=True)


@router.patch("/api/ai/conversations/{conversation_id}")
def update_ai_conversation(
    conversation_id: int,
    payload: AIConversationUpdateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _owned_conversation(db, current_user, conversation_id)
    if payload.messages is not None:
        if not isinstance(payload.messages, list):
            raise HTTPException(status_code=400, detail="messages must be a list")
        row.messages = json.dumps(payload.messages)
        if not (payload.title or "").strip():
            current_title = (row.title or "").strip()
            if not current_title or current_title == _DEFAULT_TITLE:
                row.title = _title_from_messages(payload.messages)
    if payload.state is not None:
        if not isinstance(payload.state, dict):
            raise HTTPException(status_code=400, detail="state must be an object")
        row.state = json.dumps(payload.state)
    if payload.title is not None:
        title = payload.title.strip() or _DEFAULT_TITLE
        row.title = title[:120]
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _serialize_conversation(row, include_body=True)


@router.delete("/api/ai/conversations/{conversation_id}")
def delete_ai_conversation(
    conversation_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _owned_conversation(db, current_user, conversation_id)
    db.delete(row)
    db.commit()
    return {"ok": True}
