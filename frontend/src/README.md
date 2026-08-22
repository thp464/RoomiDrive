# FleetSync — POC

Incrementally-built full-stack app. Currently at **increment 3**: React
frontend on top of the auth + concurrency-safe backend from increments 1–2.

## What's here

```
fleetsync-poc/
├── backend/                    # FastAPI + SQLite + Redis (see increments 1-2)
│   └── ... (see backend section below)
└── frontend/                   # React + Vite + TypeScript + Tailwind v4
    ├── index.html
    ├── vite.config.ts           # dev proxy: /api -> localhost:8000
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css             # design tokens (colors, fonts) via Tailwind v4 @theme
        ├── types.ts               # mirrors backend Pydantic schemas
        ├── api/
        │   ├── client.ts           # axios instance, injects JWT from localStorage
        │   ├── auth.ts
        │   └── vehicles.ts
        ├── context/
        │   └── AuthContext.tsx     # React Context for auth state (per earlier decision)
        └── components/
            ├── AuthScreen.tsx      # login + "create household" toggle
            ├── Dashboard.tsx       # main screen, ties everything together
            ├── StatusCard.tsx      # the signature instrument-cluster status card
            ├── CheckoutModal.tsx
            └── CheckinModal.tsx
```

## Prerequisites

- Python 3.10+, Node 18+
- Redis running locally on port 6379 (`redis-server --daemonize yes`, or
  `docker run -d -p 6379:6379 redis:7-alpine`)

## Run it

**Terminal 1 — backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
rm -f fleetsync_poc.db   # start clean
uvicorn main:app --reload
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to
the backend on port 8000, so no CORS setup is needed for local dev beyond
what's already in `backend/main.py`.

### First run

1. Click **New household** — create a household, your admin account, and
   the shared vehicle in one step.
2. You're logged in immediately and land on the dashboard.
3. To add a roommate: use the `/api/admin/users` endpoint via
   `/docs` on the backend for now (no admin UI yet — see roadmap below).
   They then log in normally from the **Log in** tab.
4. Click **Check out** / **Check in** to exercise the full flow.

## Design notes

The status card is the app's signature element: an instrument-cluster
treatment where the status color (mint = available, amber = in use, red =
maintenance) washes through the card as an ambient glow rather than just
a small badge. Display type is Space Grotesk, body is Inter, and anything
numeric (mileage, fuel %, timestamps) renders in JetBrains Mono to read
like actual dashboard digits.

Colors and fonts are defined as design tokens in `src/index.css` via
Tailwind v4's `@theme` block (v4 doesn't use a `tailwind.config.js`).

## What's NOT here yet

- Admin UI for adding roommates (works via API/`/docs`, no frontend form)
- `TripHistory` audit table + activity feed
- PostgreSQL (still SQLite)
- WebSocket live updates — right now the dashboard needs a manual refresh
  (the refresh button) to see another roommate's changes
- Docker Compose

## Next increment

Two directions from here — either wire up WebSockets so the dashboard
updates live across roommates without refreshing, or add the
`TripHistory` audit table for a real activity feed. Worth deciding which
matters more for how you'll actually use this day-to-day.
