"""
RoomiDrive backend entrypoint.

Increment 2: real User/Household models + JWT auth landed. Endpoint logic
now lives in routers/ (auth, admin, vehicles) -- this file is just app
setup and router wiring, per the original architecture plan.

Run with: uvicorn main:app --reload
Docs at:  http://localhost:8000/docs
"""
from fastapi import FastAPI

from database import Base, engine
import models  # noqa: F401 -- import so every model registers on Base before create_all
from routers import auth, admin, vehicles, reservations, gas_expenses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RoomiDrive")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(vehicles.router)
app.include_router(reservations.router)
app.include_router(gas_expenses.router)


@app.get("/health")
def health():
    return {"status": "ok"}
