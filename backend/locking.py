"""
Redis distributed locking for vehicle state changes.

This is THE core piece of the whole app: it's what prevents two roommates
who click "Check Out" at the same instant from both succeeding.

How it works:
  1. acquire() does `SET lock:vehicle:{id} {token} NX EX {ttl}`.
     - NX = only set if the key does NOT already exist -> atomic "claim".
     - EX = auto-expire after `ttl` seconds, so a crashed request can't
       hold the lock forever.
     - `token` is a random value unique to this request, so we can prove
       later that WE are the one who owns the lock.
  2. If acquire() returns False, someone else already holds the lock ->
     caller should immediately return 409 Conflict. No DB call needed.
  3. release() only deletes the key if the stored value still matches our
     token (via a Lua script, so the check+delete is atomic). This stops
     us from ever releasing a lock that isn't ours anymore -- e.g. if our
     request was slow, the lock expired, and someone else already
     acquired it in the meantime.

This is the classic "Redlock-lite" single-instance pattern. It's not as
bulletproof as a multi-node Redlock, but it's the industry-standard
starting point and is exactly what's asked for in the spec (SET NX EX).
"""
import uuid
from contextlib import contextmanager

import redis

redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

_RELEASE_LUA = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""
_release_script = redis_client.register_script(_RELEASE_LUA)


class LockNotAcquired(Exception):
    """Raised when we fail to acquire the lock -- caller should return 409."""
    pass


def _lock_key(vehicle_id: int) -> str:
    return f"lock:vehicle:{vehicle_id}"


@contextmanager
def vehicle_lock(vehicle_id: int, ttl_seconds: int = 10):
    """
    Usage:
        with vehicle_lock(vehicle_id):
            ... do the checkout/checkin DB transaction ...

    Raises LockNotAcquired immediately (no blocking/retry) if another
    request already holds the lock -- for this use case we want the loser
    of the race to get a fast, clear 409, not to wait around.
    """
    token = str(uuid.uuid4())
    key = _lock_key(vehicle_id)

    acquired = redis_client.set(key, token, nx=True, ex=ttl_seconds)
    if not acquired:
        raise LockNotAcquired(f"Vehicle {vehicle_id} is currently locked by another request")

    try:
        yield
    finally:
        # Only releases if we still own it (token matches) -- see docstring.
        _release_script(keys=[key], args=[token])
