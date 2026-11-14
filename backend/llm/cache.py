"""Two-tier (in-memory + disk) cache for LLM responses."""

import hashlib
import json
import logging
import os
from typing import Any, Dict, Optional
from backend.llm.config import config

logger = logging.getLogger(__name__)


class LLMCache:
    """In-memory and file-system cache keyed by canonical hash."""

    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = cache_dir or config.CACHE_DIR
        self._memory_cache: Dict[str, Any] = {}
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
        except Exception as err:
            logger.warning("Failed to create disk cache directory %s: %s", self.cache_dir, err)

    @staticmethod
    def compute_key(patient_id: str, results_data: Any, prompt_version: str, task: str) -> str:
        """Create a deterministic SHA-256 hash for caching."""
        serialized = json.dumps({
            "patient_id": patient_id.strip().upper(),
            "results": results_data,
            "prompt_version": prompt_version,
            "task": task,
        }, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Lookup cached result in memory, then on disk."""
        # 1. In-memory check
        if key in self._memory_cache:
            return self._memory_cache[key]

        # 2. Disk check
        disk_path = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(disk_path):
            try:
                with open(disk_path, "r", encoding="utf-8") as f:
                    val = json.load(f)
                    self._memory_cache[key] = val
                    return val
            except Exception as err:
                logger.warning("Error reading disk cache %s: %s", disk_path, err)
        return None

    def set(self, key: str, value: Any) -> None:
        """Store result in memory and on disk."""
        self._memory_cache[key] = value
        disk_path = os.path.join(self.cache_dir, f"{key}.json")
        try:
            with open(disk_path, "w", encoding="utf-8") as f:
                json.dump(value, f, default=str, indent=2)
        except Exception as err:
            logger.warning("Error writing to disk cache %s: %s", disk_path, err)

    def clear(self) -> None:
        """Clear memory cache."""
        self._memory_cache.clear()


# Global singleton cache instance
llm_cache = LLMCache()
