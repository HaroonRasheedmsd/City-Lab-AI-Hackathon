"""Circuit breaker tracking provider health and cooling down failing endpoints."""

import logging
import time
from typing import Dict
from backend.llm.config import config

logger = logging.getLogger(__name__)


class ProviderCircuitBreaker:
    """Per-provider circuit breaker skipping failing providers for 60s."""

    def __init__(
        self,
        max_failures: int = config.CIRCUIT_BREAKER_MAX_FAILURES,
        cooldown_seconds: float = config.CIRCUIT_BREAKER_COOLDOWN_SECONDS,
    ):
        self.max_failures = max_failures
        self.cooldown_seconds = cooldown_seconds
        self._failures: Dict[str, int] = {}
        self._last_failure_time: Dict[str, float] = {}

    def can_attempt(self, provider: str) -> bool:
        """Return True if provider circuit is closed or cooldown has expired."""
        failures = self._failures.get(provider, 0)
        if failures < self.max_failures:
            return True

        last_fail = self._last_failure_time.get(provider, 0.0)
        elapsed = time.time() - last_fail
        if elapsed >= self.cooldown_seconds:
            logger.info("Circuit breaker cooldown expired for %s (%.1fs elapsed). Allowing retry.", provider, elapsed)
            return True

        logger.warning(
            "Circuit breaker OPEN for %s (%d consecutive failures). Skipping provider for %.1fs.",
            provider,
            failures,
            self.cooldown_seconds - elapsed,
        )
        return False

    def record_success(self, provider: str) -> None:
        """Reset failure counter on successful response."""
        if self._failures.get(provider, 0) > 0:
            logger.info("Provider %s recovered; resetting circuit breaker.", provider)
        self._failures[provider] = 0
        self._last_failure_time.pop(provider, None)

    def record_failure(self, provider: str) -> None:
        """Increment failure counter and update timestamp."""
        curr = self._failures.get(provider, 0) + 1
        self._failures[provider] = curr
        self._last_failure_time[provider] = time.time()
        logger.warning("Provider %s failure count: %d/%d", provider, curr, self.max_failures)

    def reset(self, provider: str = None) -> None:
        """Reset state for a provider or all providers."""
        if provider:
            self._failures.pop(provider, None)
            self._last_failure_time.pop(provider, None)
        else:
            self._failures.clear()
            self._last_failure_time.clear()


# Global singleton circuit breaker
circuit_breaker = ProviderCircuitBreaker()
