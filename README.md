# FleetSync — POC v1 (Concurrency Core)

This is the **first increment** of FleetSync: a minimal backend that proves
the atomic checkout/checkin locking mechanism actually prevents race
conditions. No auth, no households, no Postgres, no frontend yet — those
come in later increments once this core is validated.

## What's here

```
fleetsync-poc/
└── backend/
    ├── requirements.txt
    ├── database.py           # SQLAlchemy engine (SQLite for now)
    ├── models.py              # Vehicle model + VehicleStatus enum
    ├── locking.py             # Redis distributed lock (the important part)
    ├── main.py                 # FastAPI app: checkout/checkin endpoints
    └── test_race_condition.py # Fires 10 simultaneous checkouts, proves only 1 wins
```

## Prerequisites

- Python 3.10+
- Redis running locally on port 6379
  - macOS: `brew install redis && brew services start redis`
  - Ubuntu/Debian: `sudo apt install redis-server && sudo systemctl start redis-server`
  - Or just Docker: `docker run -d -p 6379:6379 redis:7-alpine`

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run the API

```bash
uvicorn main:app --reload
```

Visit **http://localhost:8000/docs** for interactive Swagger UI.

A single vehicle (id=1, status=AVAILABLE) is auto-seeded on startup.

### Try it manually

```bash
# Check status
curl http://localhost:8000/api/vehicles/1

# Check out
curl -X POST http://localhost:8000/api/vehicles/1/checkout \
  -H "Content-Type: application/json" \
  -d '{"held_by": "Alex", "destination_note": "Costco run"}'

# Check in
curl -X POST http://localhost:8000/api/vehicles/1/checkin \
  -H "Content-Type: application/json" \
  -d '{"parking_note": "Parked on 24th St", "mileage": 45210.5, "fuel_pct": 62}'
```

## Prove the concurrency fix works

With the server running in one terminal, run the race-condition test in another:

```bash
python test_race_condition.py
```

This fires **10 simultaneous checkout requests** via `asyncio.gather` and
asserts exactly one succeeds. Expected output:

```
Firing 10 simultaneous checkout requests...

  Roommate-0      -> WON checkout
  Roommate-1      -> blocked (409)
  ...
Successes: 1  Conflicts (409): 9

✅ PASS: exactly one roommate got the car. No race condition.
```

## How the locking works (short version)

1. **Redis `SET NX EX`** — first request to grab `lock:vehicle:{id}` wins;
   everyone else gets an instant `409` with no DB hit.
2. **DB transaction + status re-check** — inside the lock, we re-read the
   vehicle row and confirm `status == AVAILABLE` before mutating it. This
   is the actual correctness guarantee; the lock just keeps things fast
   and orderly.
3. **Safe release** — the lock is only released if we still own it
   (checked via a Lua script), so a slow request can never accidentally
   release someone else's lock.

See the docstrings in `locking.py` and `main.py` for the full explanation.

## What's NOT in this POC (coming in later increments)

- User accounts / JWT auth
- Household grouping (multiple vehicles, multiple households)
- PostgreSQL (SQLite is a drop-in swap — same SQLAlchemy models)
- `TripHistory` audit table (currently only the latest state is stored)
- WebSocket live updates
- React frontend
- Docker Compose

## Next increment

Once you're happy this core is solid, the next step is adding `User` +
`Household` models and swapping the free-text `held_by` field for a real
foreign key, then wiring up simple JWT auth.
