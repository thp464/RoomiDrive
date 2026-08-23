"""
Auth endpoints: bootstrap a household + admin, log in, check who you are.

POC NOTE: `/bootstrap-household` is intentionally open (no auth required)
so you can spin up a fresh household from a clean DB for testing. In
production this would be locked down -- e.g. a one-time setup token, or
invite-only -- since right now it can be called repeatedly to create
unlimited households.
"""
import hmac

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import User, Household, Vehicle
from core.security import hash_password, verify_password, create_access_token
from core.deps import get_current_user
from config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


class BootstrapRequest(BaseModel):
    household_name: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str
    vehicle_name: str = "Household Car"
    setup_secret: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    is_household_admin: bool
    household_id: int
    must_reset_password: bool

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/bootstrap-household", response_model=TokenResponse)
def bootstrap_household(req: BootstrapRequest, db: Session = Depends(get_db)):
    """Creates a new household + its first admin user + one vehicle, all in one call."""
    if not hmac.compare_digest(req.setup_secret, settings.bootstrap_secret):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid setup secret")

    if db.query(User).filter(User.email == req.admin_email).first():
        raise HTTPException(400, "Email already registered")

    household = Household(name=req.household_name)
    db.add(household)
    db.flush()  # assigns household.id without committing yet

    admin = User(
        email=req.admin_email,
        hashed_password=hash_password(req.admin_password),
        name=req.admin_name,
        is_household_admin=True,
        household_id=household.id,
        must_reset_password=False,
    )
    db.add(admin)

    vehicle = Vehicle(household_id=household.id, name=req.vehicle_name)
    db.add(vehicle)

    db.commit()
    db.refresh(admin)

    token = create_access_token(admin.id, admin.household_id, admin.is_household_admin)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Standard OAuth2 password flow -- form_data.username is actually the
    email address. This shape is what makes the Swagger UI "Authorize"
    button work out of the box.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

    token = create_access_token(user.id, user.household_id, user.is_household_admin)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password", response_model=UserOut)
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Works even while must_reset_password is set -- uses get_current_user
    directly (not require_password_set) since this is the one action a
    user with a temporary password needs to be able to take.
    """
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")

    current_user.hashed_password = hash_password(req.new_password)
    current_user.must_reset_password = False
    db.commit()
    db.refresh(current_user)
    return current_user
