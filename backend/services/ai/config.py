"""Environment-driven AI limits, models, and Groq budget settings."""

from __future__ import annotations

import os


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or str(raw).strip() == "":
        return default
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or str(raw).strip() == "":
        return default
    try:
        return float(str(raw).strip())
    except (TypeError, ValueError):
        return default


def _env_str(name: str, default: str) -> str:
    raw = os.getenv(name)
    if raw is None or str(raw).strip() == "":
        return default
    return str(raw).strip()


DEFAULT_DAILY_LIMIT = max(1, _env_int("AI_DEFAULT_DAILY_LIMIT", 15))
MAX_DAILY_LIMIT = max(DEFAULT_DAILY_LIMIT, _env_int("AI_MAX_DAILY_LIMIT", 20))
MAX_INPUT_TOKENS = max(256, _env_int("AI_MAX_INPUT_TOKENS", 4000))
MAX_OUTPUT_TOKENS = max(64, _env_int("AI_MAX_OUTPUT_TOKENS", 2000))

GROQ_MONTHLY_BUDGET_USD = max(0.0, _env_float("GROQ_MONTHLY_BUDGET_USD", 30.0))
GROQ_WARNING_THRESHOLD = min(1.0, max(0.0, _env_float("GROQ_WARNING_THRESHOLD", 0.50)))
GROQ_HIGH_THRESHOLD = min(1.0, max(0.0, _env_float("GROQ_HIGH_THRESHOLD", 0.75)))
GROQ_CRITICAL_THRESHOLD = min(1.0, max(0.0, _env_float("GROQ_CRITICAL_THRESHOLD", 0.90)))

GROQ_MODEL = _env_str("GROQ_MODEL", "openai/gpt-oss-120b")
GEMINI_MODEL = _env_str("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_FALLBACK_MODEL = _env_str("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite")

GROQ_INPUT_USD_PER_MILLION = _env_float("GROQ_INPUT_USD_PER_MILLION", 0.15)
GROQ_CACHED_INPUT_USD_PER_MILLION = _env_float("GROQ_CACHED_INPUT_USD_PER_MILLION", 0.075)
GROQ_OUTPUT_USD_PER_MILLION = _env_float("GROQ_OUTPUT_USD_PER_MILLION", 0.60)

THROTTLE_SECONDS = max(0.2, _env_float("AI_THROTTLE_SECONDS", 1.0))
BURST_LIMIT = max(1, _env_int("AI_BURST_LIMIT", 8))
BURST_WINDOW_SECONDS = max(10, _env_int("AI_BURST_WINDOW_SECONDS", 60))
IDEMPOTENCY_TTL_SECONDS = max(30, _env_int("AI_IDEMPOTENCY_TTL_SECONDS", 900))

STATIC_SYSTEM_PROMPT = (
    "You are Smart Assistant for INNOCEAN Tracker, an internal project-management tool. "
    "Follow the user's task instructions exactly. Be concise. Do not invent Tracker data. "
    "Do not mention underlying AI vendors, model names, or internal routing."
)


def chars_for_tokens(tokens: int) -> int:
    return max(1, int(tokens) * 4)


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, (len(text) + 3) // 4)


def clip_text(text: str, max_tokens: int) -> str:
    raw = text or ""
    max_chars = chars_for_tokens(max_tokens)
    if len(raw) <= max_chars:
        return raw
    keep_head = int(max_chars * 0.72)
    keep_tail = max_chars - keep_head - 24
    if keep_tail < 80:
        return raw[: max_chars - 16] + "\n[truncated]"
    return raw[:keep_head] + "\n[...truncated...]\n" + raw[-keep_tail:]
