"""Provider error classification for retry/fallback decisions."""

from __future__ import annotations

from typing import Optional


AUTH = "authentication"
INVALID_REQUEST = "invalid_request"
RATE_LIMIT = "rate_limit"
QUOTA_EXCEEDED = "quota_exceeded"
UNAVAILABLE = "provider_unavailable"
TIMEOUT = "timeout"
INTERNAL = "internal_error"
BUDGET = "budget_exceeded"

FALLBACK_TYPES = {RATE_LIMIT, QUOTA_EXCEEDED, UNAVAILABLE, TIMEOUT}


class ProviderError(Exception):
    def __init__(
        self,
        error_type: str,
        message: str = "",
        status_code: Optional[int] = None,
    ):
        super().__init__(message or error_type)
        self.error_type = error_type
        self.status_code = status_code
        self.retryable = error_type in FALLBACK_TYPES
        self.fallback_allowed = error_type in FALLBACK_TYPES


def classify_http_status(status_code: int, body: str = "") -> str:
    text = (body or "").lower()
    if status_code in (401, 403):
        return AUTH
    if status_code in (400, 413, 422):
        return INVALID_REQUEST
    if status_code == 429:
        if any(token in text for token in ("quota", "billing", "insufficient", "spend")):
            return QUOTA_EXCEEDED
        return RATE_LIMIT
    if status_code in (408, 504):
        return TIMEOUT
    if status_code in (500, 502, 503):
        return UNAVAILABLE
    return INTERNAL


def classify_exception(exc: Exception) -> str:
    text = str(exc or "").lower()
    if "timeout" in text or "timed out" in text:
        return TIMEOUT
    if "429" in text or "rate" in text and "limit" in text:
        if "quota" in text or "resource_exhausted" in text:
            return QUOTA_EXCEEDED
        return RATE_LIMIT
    if "resource_exhausted" in text or "quota" in text:
        return QUOTA_EXCEEDED
    if any(token in text for token in ("401", "403", "unauthenticated", "permission_denied", "api key")):
        return AUTH
    if any(token in text for token in ("400", "invalid_argument", "invalid request")):
        return INVALID_REQUEST
    if any(token in text for token in ("unavailable", "503", "502", "connection")):
        return UNAVAILABLE
    return INTERNAL
