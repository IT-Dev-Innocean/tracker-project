from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import GroqTokenLedger, User


def current_period(now=None) -> str:
    now = now or datetime.now(timezone.utc)
    return now.strftime("%Y-%m")


def groq_usage(db: Session, username: str, period: str = None) -> int:
    period = period or current_period()
    return int(
        db.query(func.coalesce(func.sum(GroqTokenLedger.total_tokens), 0))
        .filter(
            GroqTokenLedger.username == username,
            GroqTokenLedger.period == period,
        )
        .scalar()
        or 0
    )


def quota_snapshot(db: Session, user: User, period: str = None) -> dict:
    period = period or current_period()
    allowance = max(0, int(user.groq_monthly_token_allowance or 0))
    used = groq_usage(db, user.username, period)
    return {
        "period": period,
        "allowance": allowance,
        "used": used,
        "remaining": max(0, allowance - used),
        "exhausted": used >= allowance,
    }


def require_groq_quota(db: Session, username: str) -> dict:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists")
    snapshot = quota_snapshot(db, user)
    if snapshot["exhausted"]:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "groq_quota_exhausted",
                "message": "Monthly Groq token allowance exhausted.",
                **snapshot,
            },
        )
    return snapshot


def record_groq_usage(
    db: Session,
    username: str,
    usage: dict,
    model: str,
    endpoint: str,
) -> GroqTokenLedger:
    prompt_tokens = int(usage.get("prompt_tokens") or 0)
    completion_tokens = int(usage.get("completion_tokens") or 0)
    total_tokens = int(usage.get("total_tokens") or prompt_tokens + completion_tokens)
    entry = GroqTokenLedger(
        username=username,
        period=current_period(),
        prompt_tokens=max(0, prompt_tokens),
        completion_tokens=max(0, completion_tokens),
        total_tokens=max(0, total_tokens),
        model=model,
        endpoint=endpoint,
    )
    db.add(entry)
    db.commit()
    return entry
