# RoomiDrive

A household vehicle-sharing app: roommates check a shared car in and out,
reserve future time slots, and see a live activity feed — without a group
chat trying to track who has the keys.

**Live at [roomidrive.work](https://roomidrive.work)**, self-hosted on a
home server behind a Cloudflare Tunnel (no exposed ports).

## The interesting part: concurrency safety

Two roommates hitting "Check out" at the same instant must not both
succeed. This is solved with a layered lock:

1. **Redis distributed lock** (`locking.py`) — `SET lock:vehicle:{id}
   {token} NX EX 10`. `NX` makes the claim atomic; `EX` auto-expires it so
   a crashed request can't hold it forever; the token means a release
   only ever removes a lock the requester still owns (checked via an
   atomic Lua script), so a slow request can never release a lock that
   expired and was already re-acquired by someone else.
2. **Database row lock** (`SELECT ... FOR UPDATE`) underneath, as a second
   line of defense at the SQL level.

This isn't just asserted — [`test_race_condition.py`](backend/test_race_condition.py)
bootstraps 10 real roommate accounts and fires 10 simultaneous
authenticated checkout requests at the same vehicle, then asserts exactly
one succeeds and the other nine get a clean `409`.

The same lock is reused for the reservation system's overlap check, so
two people can't book conflicting time slots for the same vehicle either.

## Features

- **Auth & household scoping** — JWT-based; every vehicle/trip/reservation
  lookup is scoped to `household_id`, so a user from another household
  gets a 404 (not a 403 — no confirming the resource even exists).
- **Checkout / check-in** — real-time status (available / in use), parking
  location (floor + elevator, garage-specific), miles left, destination
  notes.
- **Reservations** — hard-block time-slot booking: a reservation prevents
  anyone but its owner from checking the vehicle out during that window,
  even if it's sitting physically available. Conflicts are rejected at
  creation time.
- **Trip history** — an audit log of every completed and in-progress trip.
- **Admin panel** — household admins add roommates with a temporary
  password; new accounts are hard-blocked (403 at the API level, not just
  hidden in the UI) from every action until they set their own password.
- **Live-ish updates** — the dashboard polls every 15s, so a roommate's
  checkout/checkin/reservation shows up without everyone needing to hit
  refresh.

## Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis, JWT auth (PyJWT)
- **Frontend**: React, TypeScript, Vite, Tailwind v4
- **Deploy**: Docker Compose (Postgres + Redis + backend + nginx-served
  frontend + Cloudflare Tunnel), fully environment-variable driven —
  verified portable by migrating the whole deployment to a second machine
  from a clean `git clone`.

## Running it locally (no Docker)

**Prerequisites**: Python 3.10+, Node 18+, Redis on port 6379
(`docker run -d -p 6379:6379 redis:7-alpine`).

**Terminal 1 — backend** (defaults to local SQLite, no Postgres needed):
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
rm -f roomidrive_poc.db   # start clean
uvicorn main:app --reload
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to
the backend on port 8000.

**First run**: click **New household** (you'll need a `BOOTSTRAP_SECRET` —
see `backend/config.py`; defaults to a dev value locally), then use the
admin panel (top-right icon) to add roommates.

## Running it with Docker (production-style)

```bash
cp .env.example .env   # fill in real secrets -- see comments in the file
docker compose up -d --build
```

This runs the full stack: Postgres, Redis, the FastAPI backend, and nginx
serving the built frontend while reverse-proxying `/api/*` to the backend
(one origin, no CORS setup needed). Add a `cloudflared` tunnel token to
`.env` to expose it publicly with zero open inbound ports — see
[`docker-compose.yml`](docker-compose.yml).

## Design notes

The status card is the app's signature element: an instrument-cluster
treatment where the status color (mint = available, amber = in use)
washes through the card as an ambient glow rather than a small badge.
Display type is Space Grotesk, body is Inter, and anything numeric
(mileage, timestamps) renders in JetBrains Mono. Colors and fonts are
design tokens in `frontend/src/index.css` via Tailwind v4's `@theme`
block.

## What's not here (yet)

- Self-service password recovery for existing users (only new-user
  temp-password reset is handled)
- Multi-vehicle UI (the backend already scopes everything by
  `vehicle_id`; the frontend currently just shows the household's first
  vehicle)
- Automated Postgres backups
