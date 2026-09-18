"""Groq GPT-OSS 120B provider."""

from __future__ import annotations

import os

import requests

from services.ai.config import GROQ_MODEL, MAX_OUTPUT_TOKENS, STATIC_SYSTEM_PROMPT, estimate_tokens
from services.ai.cost import estimate_groq_cost
from services.ai.errors import ProviderError, classify_exception, classify_http_status
from services.ai.providers.base import ProviderResult

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _usage_from_payload(payload: dict) -> tuple[int, int, int]:
    usage = (payload or {}).get("usage") or {}
    input_tokens = int(usage.get("prompt_tokens") or 0)
    output_tokens = int(usage.get("completion_tokens") or 0)
    details = usage.get("prompt_tokens_details") or {}
    cached = int(details.get("cached_tokens") or usage.get("cached_tokens") or 0)
    return input_tokens, output_tokens, cached


def call_groq(prompt: str) -> ProviderResult:
    api_key = (os.getenv("GROQ_API_KEY") or "").strip()
    if not api_key:
        raise ProviderError("authentication", "missing_key")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    data = {
        "model": GROQ_MODEL,
        "max_tokens": MAX_OUTPUT_TOKENS,
        "messages": [
            {"role": "system", "content": STATIC_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    }
    try:
        response = requests.post(GROQ_URL, headers=headers, json=data, timeout=45)
    except requests.Timeout as exc:
        raise ProviderError("timeout", "timeout") from exc
    except requests.RequestException as exc:
        raise ProviderError(classify_exception(exc), str(exc)) from exc

    if response.status_code >= 400:
        body = ""
        try:
            body = response.text or ""
        except Exception:
            body = ""
        raise ProviderError(
            classify_http_status(response.status_code, body),
            body[:300] or f"http_{response.status_code}",
            status_code=response.status_code,
        )

    payload = response.json() if response.content else {}
    content = ((payload.get("choices") or [{}])[0].get("message") or {}).get("content")
    text = (content or "").strip()
    if not text:
        raise ProviderError("internal_error", "empty_response")

    input_tokens, output_tokens, cached = _usage_from_payload(payload)
    if input_tokens <= 0:
        input_tokens = estimate_tokens(STATIC_SYSTEM_PROMPT) + estimate_tokens(prompt)
    if output_tokens <= 0:
        output_tokens = estimate_tokens(text)

    cost = estimate_groq_cost(input_tokens, output_tokens, cached)
    return ProviderResult(
        text=text,
        engine="groq",
        model=GROQ_MODEL,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cached_input_tokens=cached,
        raw_usage=payload.get("usage") or {},
        estimated_cost=cost,
    )
