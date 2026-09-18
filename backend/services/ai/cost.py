"""Groq token cost estimation and monthly budget status."""

from __future__ import annotations

from services.ai.config import (
    GROQ_CACHED_INPUT_USD_PER_MILLION,
    GROQ_CRITICAL_THRESHOLD,
    GROQ_HIGH_THRESHOLD,
    GROQ_INPUT_USD_PER_MILLION,
    GROQ_MONTHLY_BUDGET_USD,
    GROQ_OUTPUT_USD_PER_MILLION,
    GROQ_WARNING_THRESHOLD,
)


def estimate_groq_cost(
    input_tokens: int = 0,
    output_tokens: int = 0,
    cached_input_tokens: int = 0,
) -> float:
    inp = max(0, int(input_tokens or 0))
    cached = max(0, int(cached_input_tokens or 0))
    uncached = max(0, inp - cached)
    out = max(0, int(output_tokens or 0))
    input_cost = uncached / 1_000_000 * GROQ_INPUT_USD_PER_MILLION
    cached_cost = cached / 1_000_000 * GROQ_CACHED_INPUT_USD_PER_MILLION
    output_cost = out / 1_000_000 * GROQ_OUTPUT_USD_PER_MILLION
    return round(input_cost + cached_cost + output_cost, 8)


def budget_threshold(spent_usd: float, budget_usd: float = None) -> str:
    budget = GROQ_MONTHLY_BUDGET_USD if budget_usd is None else float(budget_usd)
    if budget <= 0:
        return "hard_limit"
    ratio = max(0.0, float(spent_usd or 0)) / budget
    if ratio >= 1.0:
        return "hard_limit"
    if ratio >= GROQ_CRITICAL_THRESHOLD:
        return "critical"
    if ratio >= GROQ_HIGH_THRESHOLD:
        return "high"
    if ratio >= GROQ_WARNING_THRESHOLD:
        return "warning"
    return "ok"


def groq_allowed_for_request(threshold: str, is_primary_groq: bool, is_fallback: bool) -> bool:
    """Admission rule for Groq given the current monthly spend threshold."""
    if threshold == "hard_limit":
        return False
    if threshold == "critical" and is_fallback:
        return False
    if threshold == "critical" and not is_primary_groq:
        return False
    return True
