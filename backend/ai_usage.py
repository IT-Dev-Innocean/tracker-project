"""Daily Smart Assistant quota and usage logging."""

import json
from datetime import datetime

import pytz
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import AIUsageLog, AppSetting, User

WIB = pytz.timezone("Asia/Jakarta")

DEFAULT_DAILY_LIMIT = 15
AI_DEFAULT_LIMIT_KEY = "ai_default_daily_limit"
AI_USER_LIMITS_KEY = "ai_user_daily_limits"
AI_ENGINE_PLANS_KEY = "ai_engine_plans"

GEMINI_MODEL = "gemini-2.5-flash"
GROQ_MODEL = "openai/gpt-oss-120b"

# Documented request/day (RPD) and rate limits for the models we actually call.
ENGINE_PLAN_CATALOG = {
    "gemini": {
        "model": GEMINI_MODEL,
        "plans": {
            "free": {
                "id": "free",
                "label": "Free",
                "rpd": 250,
                "rpm": 10,
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
                "label": "Developer",
                "rpd": None,
                "rpm": 1000,
                "tpm": 250000,
            },
        },
        "default_plan": "free",
    },
}

PUBLIC_PROVIDER = "Smart Assistant"

AI_MESSAGES = {
    "daily_limit": {
        "en": (
            "You have reached today's Smart Assistant limit. "
            "Please try again tomorrow or contact an administrator."
        ),
        "id": (
            "Anda sudah mencapai batas Smart Assistant hari ini. "
            "Silakan coba lagi besok atau hubungi administrator."
        ),
    },
    "wait_one_second": {
        "en": "Please wait 1 second before generating another AI response.",
        "id": "Tunggu 1 detik sebelum mengirim permintaan Smart Assistant lagi.",
    },
    "unavailable": {
        "en": "Smart Assistant is temporarily unavailable. Please try again in a moment.",
        "id": "Smart Assistant sedang tidak tersedia. Silakan coba lagi sebentar lagi.",
    },
    "not_configured": {
        "en": "Smart Assistant is not configured. Please contact your administrator.",
        "id": "Smart Assistant belum dikonfigurasi. Silakan hubungi administrator.",
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


def wib_today_start_naive_utc() -> datetime:
    now = datetime.now(WIB)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.astimezone(pytz.UTC).replace(tzinfo=None)


def wib_today_date_str() -> str:
    return datetime.now(WIB).strftime("%Y-%m-%d")


def _setting_row(db: Session, key: str):
    return db.query(AppSetting).filter(AppSetting.key == key).first()


def get_default_daily_limit(db: Session) -> int:
    row = _setting_row(db, AI_DEFAULT_LIMIT_KEY)
    if not row or row.value is None or str(row.value).strip() == "":
        return DEFAULT_DAILY_LIMIT
    try:
        value = int(str(row.value).strip())
    except (TypeError, ValueError):
        return DEFAULT_DAILY_LIMIT
    return max(0, value)


def set_default_daily_limit(db: Session, limit: int) -> int:
    value = max(0, int(limit))
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
            cleaned[str(username)] = max(0, int(raw))
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
        current[key] = max(0, int(value))
    return save_user_limit_overrides(db, current)


def effective_daily_limit(db: Session, username: str) -> int:
    overrides = get_user_limit_overrides(db)
    if username in overrides:
        return overrides[username]
    return get_default_daily_limit(db)


def count_successful_today(db: Session, username: str) -> int:
    start = wib_today_start_naive_utc()
    return (
        db.query(func.count(AIUsageLog.id))
        .filter(
            AIUsageLog.username == username,
            AIUsageLog.created_at >= start,
            AIUsageLog.status == "ok",
        )
        .scalar()
        or 0
    )


def has_reached_daily_limit(db: Session, username: str) -> bool:
    limit = effective_daily_limit(db, username)
    if limit == 0:
        return False
    return count_successful_today(db, username) >= limit


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


def log_ai_usage(db: Session, username: str, success: bool, status: str, provider_used: str = "none"):
    db.add(
        AIUsageLog(
            username=username,
            success=1 if success else 0,
            status=status,
            provider_used=provider_used or "none",
        )
    )
    db.commit()


def build_overview(db: Session) -> dict:
    start = wib_today_start_naive_utc()
    default_limit = get_default_daily_limit(db)
    overrides = get_user_limit_overrides(db)

    ok_rows = (
        db.query(AIUsageLog)
        .filter(AIUsageLog.created_at >= start, AIUsageLog.status == "ok")
        .all()
    )
    used_by_user = {}
    last_ok_by_user = {}
    engine_counts = {"gemini": 0, "groq": 0}
    for row in ok_rows:
        used_by_user[row.username] = used_by_user.get(row.username, 0) + 1
        prev = last_ok_by_user.get(row.username)
        if not prev or (row.created_at and row.created_at > prev):
            last_ok_by_user[row.username] = row.created_at
        if row.provider_used in engine_counts:
            engine_counts[row.provider_used] += 1

    last_any = {}
    last_rows = (
        db.query(AIUsageLog.username, func.max(AIUsageLog.created_at))
        .group_by(AIUsageLog.username)
        .all()
    )
    for username, last_at in last_rows:
        last_any[username] = last_at

    users = db.query(User).order_by(User.username.asc()).all()
    user_payload = []
    users_at_limit = 0
    for user in users:
        username = user.username
        used = used_by_user.get(username, 0)
        has_override = username in overrides
        limit = overrides[username] if has_override else default_limit
        unlimited = limit == 0
        remaining = None if unlimited else max(0, limit - used)
        at_limit = (not unlimited) and used >= limit
        if at_limit:
            users_at_limit += 1
        last_used = last_ok_by_user.get(username) or last_any.get(username)
        user_payload.append(
            {
                "username": username,
                "full_name": user.full_name or "",
                "used_today": used,
                "limit": limit,
                "unlimited": unlimited,
                "remaining": remaining,
                "override": overrides[username] if has_override else None,
                "last_used_at": last_used.isoformat() if last_used else None,
                "at_limit": at_limit,
            }
        )

    return {
        "default_daily_limit": default_limit,
        "today": {
            "date": wib_today_date_str(),
            "total_prompts": len(ok_rows),
            "active_users": len(used_by_user),
            "users_at_limit": users_at_limit,
            "by_engine": engine_counts,
        },
        "engines": _build_engine_usage(engine_counts, db),
        "users": user_payload,
    }
