# FleetSync — POC

Incrementally-built backend for FleetSync. Currently at **increment 2**:
real users, households, and JWT auth on top of the atomic checkout/checkin
locking core from increment 1.

## What's here

```
fleetsync-poc/
└── backend/
    ├── requirements.txt
    ├── config.py                # JWT settings
    ├── database.py               # SQLAlchemy engine (SQLite for now)
    ├── locking.py                 # Redis distributed lock (the concurrency core)
    ├── main.py                     # App entrypoint -- just wiring, logic lives in routers/
    ├── models/
    │   ├── household.py
    │   ├── user.py
    │   └── vehicle.py             # now FK'd to household + holder user
    ├── core/
    │   ├── security.py            # password hashing + JWT create/verify
    │   └── deps.py                 # get_current_user / get_current_admin_user
    ├── routers/
    │   ├── auth.py                 # bootstrap-household, login, /me
    │   ├── admin.py                 # admin adds roommate accounts
    │   └── vehicles.py              # list/get/checkout/checkin (auth + household scoped)
    ├── test_race_condition.py     # 10 concurrent authenticated checkouts, exactly 1 wins
    └── test_auth_flow.py           # auth + household isolation proof
```

## Prerequisites

- Python 3.10+
- Redis running locally on port 6379
  - macOS: `brew install redis && brew services start redis`
  - Ubuntu/Debian: `sudo apt install redis-server && sudo systemctl start redis-server`
  - Or Docker: `docker run -d -p 6379:6379 redis:7-alpine`

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

Unlike increment 1, **no vehicle is auto-seeded**. You create a household
(and its first vehicle) via `/api/auth/bootstrap-household`.

### Try it manually

```bash
# 1. Bootstrap a household (creates admin user + one vehicle)
curl -X POST http://localhost:8000/api/auth/bootstrap-household \
  -H "Content-Type: application/json" \
  -d '{
    "household_name": "Maple St House",
    "admin_name": "Alex",
    "admin_email": "alex@example.com",
    "admin_password": "hunter22",
    "vehicle_name": "The Subaru"
  }'
# -> { "access_token": "...", "token_type": "bearer" }

# 2. Admin adds a roommate
curl -X POST http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email": "sam@example.com", "name": "Sam", "temporary_password": "tempPass1"}'

# 3. Roommate logs in
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=sam@example.com&password=tempPass1"
# -> { "access_token": "...", "token_type": "bearer" }

# 4. Roommate checks out the vehicle
curl -X POST http://localhost:8000/api/vehicles/1/checkout \
  -H "Authorization: Bearer <ROOMMATE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"destination_note": "Costco run"}'

# 5. Check in
curl -X POST http://localhost:8000/api/vehicles/1/checkin \
  -H "Authorization: Bearer <ROOMMATE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"parking_note": "Parked on 24th St", "mileage": 45210.5, "fuel_pct": 62}'
```

## Prove it works

With the server running in one terminal:

```bash
# Auth + household isolation
python test_auth_flow.py

# Concurrency: 10 real authenticated roommates race for the same car
python test_race_condition.py
```

Both should end in ✅. `test_race_condition.py` creates 10 real accounts,
logs each one in, and fires all 10 checkout requests simultaneously --
exactly one succeeds, the rest get a clean `409`.

## What changed since increment 1

- `held_by` (free-text string) → `held_by_user_id` (real FK to `User`)
- Every vehicle endpoint requires a valid JWT and is scoped to
  `current_user.household_id` — cross-household access returns 404
- `models.py` split into `models/household.py`, `models/user.py`,
  `models/vehicle.py`
- Endpoint logic moved out of `main.py` into `routers/auth.py`,
  `routers/admin.py`, `routers/vehicles.py`
- Password hashing (`core/security.py`) uses stdlib PBKDF2 for the POC to
  avoid native-dependency friction — swap for `passlib[bcrypt]` or
  `argon2-cffi` before this holds real user passwords

## What's NOT here yet

- `TripHistory` audit table (only latest state is stored)
- PostgreSQL (SQLite for now — same models, connection string swap later)
- WebSocket live updates
- React frontend
- Docker Compose

## Next increment

Add the `TripHistory` audit table so every checkout/checkin becomes a
permanent row (not just overwritten current-state fields on `Vehicle`) —
this unlocks the activity feed from the original spec.
