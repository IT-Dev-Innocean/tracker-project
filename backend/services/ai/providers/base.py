"""Shared provider result shape."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ProviderResult:
    text: str
    engine: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cached_input_tokens: int = 0
    raw_usage: dict = field(default_factory=dict)
    estimated_cost: float = 0.0
