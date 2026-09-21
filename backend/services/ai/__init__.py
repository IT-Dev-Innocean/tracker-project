"""Centralized AI generation: routing, providers, limits, and cost control.

Import service functions from ``services.ai.service`` to avoid a circular
import with ``ai_usage`` (which loads this package via ``services.ai.config``).
"""

from services.ai.types import AI_TASK_TYPES, COMPLEX_TASK_TYPES, LIGHTWEIGHT_TASK_TYPES

__all__ = [
    "AI_TASK_TYPES",
    "LIGHTWEIGHT_TASK_TYPES",
    "COMPLEX_TASK_TYPES",
    "generate_ai",
    "get_user_usage",
]


def __getattr__(name):
    if name in {"generate_ai", "get_user_usage"}:
        from services.ai import service as _service

        return getattr(_service, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
