from fastapi import APIRouter, HTTPException, Depends, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime
import json
import re
from typing import Optional

from database import AIConversation, get_db
from schemas import *
from dependencies import *
from ai_usage import build_user_usage
from services.ai.service import generate_ai

router = APIRouter()

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


@router.get("/api/ai/usage")
def get_ai_usage(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    language: Optional[str] = Query(None),
):
    return build_user_usage(db, current_user, language)


@router.post("/api/ai/generate")
def generate_ai_text(
    payload: AIGenerateModel,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_idempotency_key: Optional[str] = Header(default=None, alias="X-Idempotency-Key"),
):
    # Client-supplied provider/model is ignored. Routing is server-side only.
    return generate_ai(
        db,
        current_user,
        payload.prompt or "",
        task_type=getattr(payload, "task_type", None),
        language=getattr(payload, "language", None),
        idempotency_key=x_idempotency_key or getattr(payload, "request_id", None),
        request_id=getattr(payload, "request_id", None),
    )


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
