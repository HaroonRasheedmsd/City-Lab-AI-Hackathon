"""Provider abstraction with fallback chain, exponential backoff, and circuit breaker."""

import logging
import random
import time
from typing import Optional, Tuple
import httpx
from backend.llm.circuit_breaker import circuit_breaker
from backend.llm.config import config

logger = logging.getLogger(__name__)


class LLMClient:
    """Manages the fallback chain: Gemini -> Groq -> OpenRouter -> Fallback Template."""

    def __init__(self, http_client: Optional[httpx.Client] = None):
        self.http_client = http_client or httpx.Client(timeout=config.TIMEOUT_SECONDS)

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        patient_id: Optional[str] = None,
    ) -> Tuple[str, Optional[str], float]:
        """
        Execute fallback chain across configured providers.
        
        Returns:
            (provider_used, raw_response_text, latency_ms)
        """
        chain = ["gemini", "groq", "openrouter"]
        total_start = time.time()

        for provider in chain:
            # 1. Check API key configuration
            if not self._is_provider_configured(provider):
                logger.debug("Provider %s has no API key configured. Skipping.", provider)
                continue

            # 2. Check circuit breaker status
            if not circuit_breaker.can_attempt(provider):
                logger.warning("Provider %s circuit is OPEN. Skipping.", provider)
                continue

            # 3. Retry loop with exponential backoff + jitter
            for attempt in range(1, config.MAX_RETRIES + 1):
                start_req = time.time()
                try:
                    logger.info("Attempting provider %s (attempt %d/%d) for patient_id=%s", provider, attempt, config.MAX_RETRIES, patient_id)
                    raw_text = self._call_provider(provider, system_prompt, user_prompt)
                    latency = round((time.time() - start_req) * 1000, 2)
                    circuit_breaker.record_success(provider)
                    logger.info("Provider %s succeeded in %.2fms", provider, latency)
                    return provider, raw_text, latency

                except httpx.HTTPStatusError as err:
                    latency = round((time.time() - start_req) * 1000, 2)
                    status_code = err.response.status_code
                    logger.warning(
                        "Provider %s HTTP error %d: %s (latency: %.2fms)",
                        provider,
                        status_code,
                        err.response.text[:200],
                        latency,
                    )

                    # 429 (Rate Limit) or 5xx (Server Error) -> retryable
                    if status_code in (429, 500, 502, 503, 504) and attempt < config.MAX_RETRIES:
                        backoff = (0.5 * (2 ** (attempt - 1))) + random.uniform(0.05, 0.25)
                        logger.info("Retrying provider %s in %.2fs...", provider, backoff)
                        time.sleep(backoff)
                        continue

                    # Terminal failure for this provider
                    circuit_breaker.record_failure(provider)
                    break

                except (httpx.TimeoutException, httpx.RequestError) as err:
                    latency = round((time.time() - start_req) * 1000, 2)
                    logger.warning("Provider %s network error: %s (latency: %.2fms)", provider, err, latency)
                    if attempt < config.MAX_RETRIES:
                        backoff = (0.5 * (2 ** (attempt - 1))) + random.uniform(0.05, 0.25)
                        logger.info("Retrying provider %s in %.2fs...", provider, backoff)
                        time.sleep(backoff)
                        continue

                    circuit_breaker.record_failure(provider)
                    break

                except Exception as err:
                    logger.error("Unexpected error with provider %s: %s", provider, err)
                    circuit_breaker.record_failure(provider)
                    break

        total_latency = round((time.time() - total_start) * 1000, 2)
        logger.warning("All LLM providers in fallback chain failed. Triggering graceful template degradation.")
        return "fallback_template", None, total_latency

    def _is_provider_configured(self, provider: str) -> bool:
        if provider == "gemini":
            return bool(config.GEMINI_API_KEY and config.GEMINI_API_KEY.strip())
        if provider == "groq":
            return bool(config.GROQ_API_KEY and config.GROQ_API_KEY.strip())
        if provider == "openrouter":
            return bool(config.OPENROUTER_API_KEY and config.OPENROUTER_API_KEY.strip())
        return False

    def _call_provider(self, provider: str, system_prompt: str, user_prompt: str) -> str:
        if provider == "gemini":
            return self._call_gemini(system_prompt, user_prompt)
        elif provider == "groq":
            return self._call_groq(system_prompt, user_prompt)
        elif provider == "openrouter":
            return self._call_openrouter(system_prompt, user_prompt)
        raise ValueError(f"Unknown provider: {provider}")

    def _call_gemini(self, system_prompt: str, user_prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.GEMINI_MODEL}:generateContent"
        params = {"key": config.GEMINI_API_KEY}
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\n---\n\n{user_prompt}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048,
            },
        }
        res = self.http_client.post(url, params=params, json=payload)
        res.raise_for_status()
        data = res.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("Gemini returned empty candidates")
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return text

    def _call_groq(self, system_prompt: str, user_prompt: str) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {config.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": config.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        res = self.http_client.post(url, headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("Groq returned empty choices")
        return choices[0].get("message", {}).get("content", "")

    def _call_openrouter(self, system_prompt: str, user_prompt: str) -> str:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": config.OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        res = self.http_client.post(url, headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("OpenRouter returned empty choices")
        return choices[0].get("message", {}).get("content", "")
