"""
HYT ATS - Atomic Disk Cache Manager
===================================
Implements deterministic, persistent caching for LLM extractions, embeddings,
and explanations to guarantee the hard constraint: at most 2 LLM calls per candidate.

Implements key strategy defined in master.md Section 5:
  - JD structured JSON: hash(raw_jd_text)
  - JD embeddings: hash(raw_jd_text)
  - Resume structured JSON: candidate_id
  - Explanation output: candidate_id + hash(raw_jd_text)
  - Eval judge output: batch_id
"""

import os
import json
import hashlib
from typing import Optional, Any, Union, Dict
from pydantic import BaseModel


def compute_sha256(content: str) -> str:
    """Computes a 64-char hex SHA-256 hash of arbitrary string content."""
    return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()


class CacheManager:
    """Thread-safe, atomic disk caching manager."""

    def __init__(self, cache_dir: str = "./cache"):
        self.cache_dir = os.path.abspath(cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)
        # Subdirectories per cache namespace
        self.namespaces = ["jds", "resumes", "embeddings", "explanations", "eval"]
        for ns in self.namespaces:
            os.makedirs(os.path.join(self.cache_dir, ns), exist_ok=True)

    def _get_path(self, namespace: str, key: str, ext: str = "json") -> str:
        safe_key = "".join(c for c in key if c.isalnum() or c in ("-", "_", "."))
        ns_dir = os.path.join(self.cache_dir, namespace)
        os.makedirs(ns_dir, exist_ok=True)
        return os.path.join(ns_dir, f"{safe_key}.{ext}")

    def get(self, namespace: str, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves cached JSON object.
        Returns None on cache miss or corrupted file. Never raises exceptions.
        """
        path = self._get_path(namespace, key, "json")
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def get_model(self, namespace: str, key: str, model_cls: type[BaseModel]) -> Optional[Any]:
        """Retrieves cached JSON and deserializes into a Pydantic model."""
        data = self.get(namespace, key)
        if data is None:
            return None
        try:
            return model_cls.model_validate(data)
        except Exception:
            return None

    def set_model(self, namespace: str, key: str, model: BaseModel) -> bool:
        """Serializes and writes a Pydantic model atomically to disk."""
        return self.set(namespace, key, model)

    def set(self, namespace: str, key: str, value: Union[Dict[str, Any], BaseModel, list]) -> bool:
        """
        Serializes and writes an object atomically to disk using a temp file.
        Returns True on success, False on failure.
        """
        path = self._get_path(namespace, key, "json")
        temp_path = f"{path}.tmp_{os.getpid()}"
        try:
            if isinstance(value, BaseModel):
                data = value.model_dump(mode="json")
            else:
                data = value

            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Atomic replacement on POSIX and Windows (replace)
            os.replace(temp_path, path)
            return True
        except Exception:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
            return False

    def has(self, namespace: str, key: str) -> bool:
        """Checks if a cache entry exists."""
        return os.path.exists(self._get_path(namespace, key, "json"))

    def delete(self, namespace: str, key: str) -> bool:
        """Removes a cache entry if it exists."""
        path = self._get_path(namespace, key, "json")
        if os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception:
                return False
        return False

    def clear(self, namespace: Optional[str] = None):
        """Clears all entries in a namespace, or entire cache."""
        target_dirs = [os.path.join(self.cache_dir, namespace)] if namespace else [
            os.path.join(self.cache_dir, ns) for ns in self.namespaces
        ]
        for d in target_dirs:
            if os.path.exists(d):
                for f in os.listdir(d):
                    fp = os.path.join(d, f)
                    if os.path.isfile(fp):
                        try:
                            os.remove(fp)
                        except Exception:
                            pass


# Global cache manager instance
_CACHE_INSTANCE: Optional[CacheManager] = None


def get_cache_manager(cache_dir: Optional[str] = None) -> CacheManager:
    """Returns singleton CacheManager."""
    global _CACHE_INSTANCE
    if _CACHE_INSTANCE is None:
        _CACHE_INSTANCE = CacheManager(cache_dir or "./cache")
    return _CACHE_INSTANCE
