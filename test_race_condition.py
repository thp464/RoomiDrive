"""
Race-condition proof (v2 -- now with real authenticated users).

Bootstraps a fresh household, has the admin create N real roommate
accounts, logs each one in, then fires N simultaneous checkout requests
(each with its own JWT) at the same vehicle and confirms exactly one
succeeds.

Run with the server already running:
    uvicorn main:app --reload
    python test_race_condition.py
"""
import asyncio
import time
import httpx

BASE_URL = "http://localhost:8000"
NUM_ROOMMATES = 10


async def bootstrap_household(client: httpx.AsyncClient, suffix: str) -> str:
    resp = await client.post(f"{BASE_URL}/api/auth/bootstrap-household", json={
        "household_name": f"RaceTest-{suffix}",
        "admin_name": "Admin",
        "admin_email": f"race-admin-{suffix}@example.com",
        "admin_password": "adminpass123",
        "vehicle_name": "Race Test Car",
    })
    resp.raise_for_status()
    return resp.json()["access_token"]


async def add_and_login_roommate(client: httpx.AsyncClient, admin_headers: dict, suffix: str, i: int) -> str:
    email = f"race-roommate-{suffix}-{i}@example.com"
    resp = await client.post(f"{BASE_URL}/api/admin/users", headers=admin_headers, json={
        "email": email, "name": f"Roommate-{i}", "temporary_password": "roompass123",
    })
    resp.raise_for_status()

    resp = await client.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": "roompass123"})
    resp.raise_for_status()
    return resp.json()["access_token"]


async def attempt_checkout(client: httpx.AsyncClient, name: str, token: str, vehicle_id: int):
    resp = await client.post(
        f"{BASE_URL}/api/vehicles/{vehicle_id}/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={"destination_note": "grocery run"},
    )
    return name, resp.status_code


async def main():
    suffix = str(int(time.time() * 1000))
    async with httpx.AsyncClient(timeout=10.0) as client:
        admin_token = await bootstrap_household(client, suffix)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        resp = await client.get(f"{BASE_URL}/api/vehicles", headers=admin_headers)
        resp.raise_for_status()
        vehicle_id = resp.json()[0]["id"]

        print(f"Creating {NUM_ROOMMATES} real roommate accounts...")
        tokens = await asyncio.gather(*[
            add_and_login_roommate(client, admin_headers, suffix, i) for i in range(NUM_ROOMMATES)
        ])

        print(f"Firing {NUM_ROOMMATES} simultaneous authenticated checkout requests...\n")
        results = await asyncio.gather(*[
            attempt_checkout(client, f"Roommate-{i}", tokens[i], vehicle_id)
            for i in range(NUM_ROOMMATES)
        ])

        successes = [r for r in results if r[1] == 200]
        for name, status in results:
            outcome = "WON checkout" if status == 200 else f"blocked ({status})"
            print(f"  {name:15s} -> {outcome}")

        print(f"\nSuccesses: {len(successes)}  Conflicts: {len(results) - len(successes)}")
        assert len(successes) == 1, f"RACE CONDITION BUG: {len(successes)} succeeded, expected 1!"
        print(f"\n✅ PASS: exactly one authenticated roommate ({successes[0][0]}) got the car.")


if __name__ == "__main__":
    asyncio.run(main())
