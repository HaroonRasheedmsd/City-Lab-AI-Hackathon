"""Tests for LLM client resilience: fallback chain, retries, circuit breaker, and caching."""

import json
import pytest
import httpx
from unittest.mock import MagicMock, patch
from backend.llm.cache import LLMCache
from backend.llm.circuit_breaker import ProviderCircuitBreaker
from backend.llm.client import LLMClient
from backend.llm.config import LLMConfig


def test_retry_on_429_then_succeed():
    # Setup mock client that returns 429 twice, then 200
    mock_resp_429 = MagicMock()
    mock_resp_429.status_code = 429
    mock_resp_429.text = "Rate limit reached"
    error_429 = httpx.HTTPStatusError("Rate limited", request=MagicMock(), response=mock_resp_429)

    mock_resp_200 = MagicMock()
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Success from Gemini"}]}}]
    }

    mock_http = MagicMock()
    mock_http.post.side_effect = [error_429, error_429, mock_resp_200]

    with patch.object(LLMConfig, "GEMINI_API_KEY", "dummy_gemini_key"):
        client = LLMClient(http_client=mock_http)
        provider, text, latency = client.generate("system", "hello", patient_id="P001")
        assert provider == "gemini"
        assert text == "Success from Gemini"
        assert mock_http.post.call_count == 3


def test_fallback_gemini_fails_then_groq_succeeds():
    # Gemini fails with 500 across all 3 retries, then Groq succeeds
    mock_resp_500 = MagicMock()
    mock_resp_500.status_code = 500
    mock_resp_500.text = "Internal Server Error"
    error_500 = httpx.HTTPStatusError("Server Error", request=MagicMock(), response=mock_resp_500)

    mock_resp_groq = MagicMock()
    mock_resp_groq.status_code = 200
    mock_resp_groq.json.return_value = {
        "choices": [{"message": {"content": "Success from Groq"}}]
    }

    mock_http = MagicMock()
    mock_http.post.side_effect = [error_500, error_500, error_500, mock_resp_groq]

    with patch.object(LLMConfig, "GEMINI_API_KEY", "dummy_gemini"), \
         patch.object(LLMConfig, "GROQ_API_KEY", "dummy_groq"):
        client = LLMClient(http_client=mock_http)
        provider, text, latency = client.generate("system", "hello", patient_id="P001")
        assert provider == "groq"
        assert text == "Success from Groq"


def test_all_providers_down_falls_back_to_template():
    mock_resp_500 = MagicMock()
    mock_resp_500.status_code = 500
    mock_resp_500.text = "Server Error"
    error_500 = httpx.HTTPStatusError("Server Error", request=MagicMock(), response=mock_resp_500)

    mock_http = MagicMock()
    mock_http.post.side_effect = error_500

    with patch.object(LLMConfig, "GEMINI_API_KEY", "key1"), \
         patch.object(LLMConfig, "GROQ_API_KEY", "key2"), \
         patch.object(LLMConfig, "OPENROUTER_API_KEY", "key3"):
        client = LLMClient(http_client=mock_http)
        provider, text, latency = client.generate("system", "hello", patient_id="P001")
        assert provider == "fallback_template"
        assert text is None


def test_circuit_breaker_skips_after_max_failures():
    cb = ProviderCircuitBreaker(max_failures=3, cooldown_seconds=60.0)
    assert cb.can_attempt("gemini") is True

    # Record 3 failures
    cb.record_failure("gemini")
    cb.record_failure("gemini")
    cb.record_failure("gemini")

    # Now circuit should be OPEN
    assert cb.can_attempt("gemini") is False

    # Success on another provider does not affect gemini
    cb.record_success("groq")
    assert cb.can_attempt("gemini") is False
    assert cb.can_attempt("groq") is True

    # Reset allows retry
    cb.reset("gemini")
    assert cb.can_attempt("gemini") is True


def test_cache_hit_avoids_recomputation(tmp_path):
    cache = LLMCache(cache_dir=str(tmp_path))
    key = cache.compute_key("P001", {"res": 123}, "v1", "explain")

    assert cache.get(key) is None
    payload = {"result": "Plain language explanation"}
    cache.set(key, payload)

    # In-memory and disk hit
    hit = cache.get(key)
    assert hit == payload
