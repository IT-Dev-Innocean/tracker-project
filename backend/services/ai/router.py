"""Deterministic provider routing for AI task types."""

from __future__ import annotations

from typing import List

from services.ai.config import GEMINI_FALLBACK_MODEL, GEMINI_MODEL
from services.ai.types import is_lightweight_task, normalize_task_type

ENGINE_GROQ = "groq"
ENGINE_GEMINI_31 = "gemini_31"
ENGINE_GEMINI_35 = "gemini_35"


def gemini_engine_order() -> tuple:
    primary = (GEMINI_MODEL or "").lower()
    fallback = (GEMINI_FALLBACK_MODEL or "").lower()
    if "3.5" in primary and "3.1" in fallback:
        return (ENGINE_GEMINI_35, ENGINE_GEMINI_31)
    if "3.5" in primary:
        return (ENGINE_GEMINI_35, ENGINE_GEMINI_31)
    return (ENGINE_GEMINI_31, ENGINE_GEMINI_35)


def engines_for_task(task_type: str) -> List[str]:
    """Preferred engine chain for a canonical task type (before live quota filters)."""
    normalized = normalize_task_type(task_type)
    gemini = list(gemini_engine_order())
    if is_lightweight_task(normalized):
        return gemini + [ENGINE_GROQ]
    return [ENGINE_GROQ] + gemini


def is_gemini_compatible(task_type: str) -> bool:
    """Current task types are all text-completion compatible with Gemini."""
    return True


def is_groq_compatible(task_type: str) -> bool:
    return True
