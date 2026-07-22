"""Simple in-process cache for date-plan candidate lists and LLM outputs."""
from __future__ import annotations

import time
from threading import Lock
from typing import Any, Optional

_lock = Lock()
_store: dict[str, tuple[float, Any]] = {}
DEFAULT_TTL = 3600


def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    with _lock:
        _store[key] = (time.time() + ttl, value)


def cache_get(key: str) -> Optional[Any]:
    with _lock:
        item = _store.get(key)
        if not item:
            return None
        expires, value = item
        if time.time() > expires:
            del _store[key]
            return None
        return value


def cache_delete(key: str) -> None:
    with _lock:
        _store.pop(key, None)


def candidates_key(plan_id: str) -> str:
    return f"date_plan:{plan_id}:candidates"


def ideas_key(plan_id: str, restaurant_id: str) -> str:
    return f"date_plan:{plan_id}:ideas:{restaurant_id}"
