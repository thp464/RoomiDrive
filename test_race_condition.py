"""
Proof-of-concept race condition test.

Fires N concurrent checkout requests at the exact same vehicle, all at
"the same instant" (asyncio.gather), and confirms EXACTLY ONE succeeds.

Run with the server already running:
    uvicorn main:app --reload &
    python test_race_condition.py
"""
import asyncio
import httpx

BASE_URL = "http://localhost:8000"
VEHICLE_ID = 1
NUM_CONCURRENT_REQUESTS = 10


async def attempt_checkout(client: httpx.AsyncClient, roommate_name: str):
    resp = await client.post(
        f"{BASE_URL}/api/vehicles/{VEHICLE_ID}/checkout",
        json={"held_by": roommate_name, "destination_note": "grocery run"},
    )
    return roommate_name, resp.status_code, resp.json()


async def reset_vehicle(client: httpx.AsyncClient):
    """Force vehicle back to AVAILABLE by checking in, ignoring errors if already available."""
    await client.post(
        f"{BASE_URL}/api/vehicles/{VEHICLE_ID}/checkin",
        json={"parking_note": "reset", "mileage": 0, "fuel_pct": 100},
    )


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        await reset_vehicle(client)

        roommates = [f"Roommate-{i}" for i in range(NUM_CONCURRENT_REQUESTS)]

        print(f"Firing {NUM_CONCURRENT_REQUESTS} simultaneous checkout requests...\n")
        results = await asyncio.gather(*[attempt_checkout(client, name) for name in roommates])

        successes = [r for r in results if r[1] == 200]
        conflicts = [r for r in results if r[1] == 409]

        for name, status, body in results:
            outcome = "WON checkout" if status == 200 else f"blocked ({status})"
            print(f"  {name:15s} -> {outcome}")

        print(f"\nSuccesses: {len(successes)}  Conflicts (409): {len(conflicts)}")

        assert len(successes) == 1, f"RACE CONDITION BUG: {len(successes)} requests succeeded, expected 1!"
        print(f"\n✅ PASS: exactly one roommate ({successes[0][0]}) got the car. No race condition.")


if __name__ == "__main__":
    asyncio.run(main())
