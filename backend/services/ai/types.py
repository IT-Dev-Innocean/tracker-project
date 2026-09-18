"""AI task categories used for deterministic provider routing."""

from __future__ import annotations

LIGHTWEIGHT_TASK_TYPES = {
    "REWRITE",
    "TRANSLATE",
    "SUMMARIZE_TASK",
    "GENERATE_DESCRIPTION",
    "SIMPLE_QA",
    "BASIC_TRANSFORM",
    "FORMAT",
    "SIMPLE_SUMMARY",
}

COMPLEX_TASK_TYPES = {
    "PROJECT_ANALYSIS",
    "COMPLEX_TASK_ANALYSIS",
    "MULTI_TASK_REASONING",
    "PROJECT_RECOMMENDATION",
    "AI_AGENT",
    "DEPENDENCY_ANALYSIS",
    "CROSS_PROJECT",
}

AI_TASK_TYPES = LIGHTWEIGHT_TASK_TYPES | COMPLEX_TASK_TYPES

DEFAULT_TASK_TYPE = "SIMPLE_QA"

# Client aliases / legacy labels → canonical task type.
TASK_TYPE_ALIASES = {
    "rewrite": "REWRITE",
    "translate": "TRANSLATE",
    "summarize": "SUMMARIZE_TASK",
    "summarize_task": "SUMMARIZE_TASK",
    "generate_description": "GENERATE_DESCRIPTION",
    "description": "GENERATE_DESCRIPTION",
    "simple_qa": "SIMPLE_QA",
    "qa": "SIMPLE_QA",
    "basic_transform": "BASIC_TRANSFORM",
    "format": "FORMAT",
    "simple_summary": "SIMPLE_SUMMARY",
    "project_analysis": "PROJECT_ANALYSIS",
    "analysis": "PROJECT_ANALYSIS",
    "complex_task_analysis": "COMPLEX_TASK_ANALYSIS",
    "task_analysis": "COMPLEX_TASK_ANALYSIS",
    "multi_task_reasoning": "MULTI_TASK_REASONING",
    "project_recommendation": "PROJECT_RECOMMENDATION",
    "recommendation": "PROJECT_RECOMMENDATION",
    "ai_agent": "AI_AGENT",
    "agent": "AI_AGENT",
    "dependency_analysis": "DEPENDENCY_ANALYSIS",
    "cross_project": "CROSS_PROJECT",
    "mom": "SUMMARIZE_TASK",
    "extract_tasks": "MULTI_TASK_REASONING",
    "planner": "MULTI_TASK_REASONING",
}


def normalize_task_type(value) -> str:
    raw = str(value or "").strip()
    if not raw:
        return DEFAULT_TASK_TYPE
    upper = raw.upper().replace("-", "_").replace(" ", "_")
    if upper in AI_TASK_TYPES:
        return upper
    alias = TASK_TYPE_ALIASES.get(raw.lower())
    if alias:
        return alias
    return DEFAULT_TASK_TYPE


def is_lightweight_task(task_type: str) -> bool:
    return normalize_task_type(task_type) in LIGHTWEIGHT_TASK_TYPES
