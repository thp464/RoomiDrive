"""
FleetSync backend entrypoint.

Increment 2: real User/Household models + JWT auth landed. Endpoint logic
now lives in routers/ (auth, admin, vehicles) -- this file is just app
setup and router wiring, per the original architecture plan.

Run with: uvicorn main:app --reload
Docs at:  http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models  # noqa: F401 -- import so every model registers on Base before create_all
from routers import auth, admin, vehicles

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FleetSync")

# POC NOTE: wide open for local dev since the frontend runs on a different
# port (5173) than the API (8000). Lock this down to real origins before
# deploying anywhere.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(vehicles.router)


@app.get("/health")
def health():
    return {"status": "ok"}
