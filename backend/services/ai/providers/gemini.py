"""Google Gemini provider."""

from __future__ import annotations

import os

from google import genai
from google.genai import types

from services.ai.config import GEMINI_FALLBACK_MODEL, GEMINI_MODEL, MAX_OUTPUT_TOKENS, STATIC_SYSTEM_PROMPT
from services.ai.errors import ProviderError, classify_exception
from services.ai.providers.base import ProviderResult

ENGINE_MODELS = {
    "gemini_31": GEMINI_MODEL if "3.1" in GEMINI_MODEL else "gemini-3.1-flash-lite",
    "gemini_35": GEMINI_FALLBACK_MODEL if "3.5" in GEMINI_FALLBACK_MODEL else "gemini-3.5-flash-lite",
}

# Keep catalog labels stable even if env overrides swap the primary model.
if "3.5" in (GEMINI_MODEL or "") and "3.1" in (GEMINI_FALLBACK_MODEL or ""):
    ENGINE_MODELS["gemini_35"] = GEMINI_MODEL
    ENGINE_MODELS["gemini_31"] = GEMINI_FALLBACK_MODEL
elif "3.5" in (GEMINI_MODEL or ""):
    ENGINE_MODELS["gemini_35"] = GEMINI_MODEL
elif "3.1" in (GEMINI_MODEL or ""):
    ENGINE_MODELS["gemini_31"] = GEMINI_MODEL


def _extract_text(response) -> str:
    text = (getattr(response, "text", None) or "").strip()
    if text:
        return text
    parts = []
    for candidate in getattr(response, "candidates", None) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", None) or []:
            if getattr(part, "thought", False):
                continue
            piece = getattr(part, "text", None)
            if piece:
                parts.append(piece)
    text = "\n".join(parts).strip()
    if text:
        return text
    raise ProviderError("internal_error", "empty_response")


def _usage_counts(response) -> tuple[int, int, int]:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return 0, 0, 0
    prompt_tokens = int(getattr(usage, "prompt_token_count", 0) or 0)
    output_tokens = int(getattr(usage, "candidates_token_count", 0) or 0)
    cached = int(getattr(usage, "cached_content_token_count", 0) or 0)
    return prompt_tokens, output_tokens, cached


def _content_config(engine: str):
    kwargs = {
        "system_instruction": STATIC_SYSTEM_PROMPT,
        "max_output_tokens": MAX_OUTPUT_TOKENS,
    }
    # gemini-3.5-flash-lite rejects thinking_budget=0 with 400 INVALID_ARGUMENT.
    if engine != "gemini_35":
        kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
    return types.GenerateContentConfig(**kwargs)


def call_gemini(engine: str, prompt: str) -> ProviderResult:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    model_id = ENGINE_MODELS.get(engine)
    if not api_key:
        raise ProviderError("authentication", "missing_key")
    if not model_id:
        raise ProviderError("invalid_request", "unknown_model")

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model=model_id,
            contents=prompt,
            config=_content_config(engine),
        )
        text = _extract_text(response)
        input_tokens, output_tokens, cached = _usage_counts(response)
        return ProviderResult(
            text=text,
            engine=engine,
            model=model_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cached_input_tokens=cached,
        )
    except ProviderError:
        raise
    except Exception as exc:
        raise ProviderError(classify_exception(exc), str(exc)) from exc
