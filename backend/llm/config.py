"""Configuration settings for LLM providers and resilience layer."""

import os
from typing import Optional
from dotenv import load_dotenv

# Ensure .env in root directory is loaded
_root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(_root_env):
    load_dotenv(_root_env, override=True)
else:
    load_dotenv()


class LLMConfig:
    """Settings loaded from environment variables."""
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Models
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.2-3b-instruct:free")

    # Timeouts & Retries
    TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "15.0"))
    MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "3"))

    # Circuit Breaker
    CIRCUIT_BREAKER_MAX_FAILURES: int = int(os.getenv("CIRCUIT_BREAKER_MAX_FAILURES", "3"))
    CIRCUIT_BREAKER_COOLDOWN_SECONDS: float = float(os.getenv("CIRCUIT_BREAKER_COOLDOWN_SECONDS", "60.0"))

    # Cache
    CACHE_DIR: str = os.getenv(
        "CACHE_DIR",
        os.path.join(os.path.dirname(__file__), "..", ".cache")
    )


config = LLMConfig()
