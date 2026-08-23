"""
Admin-only household management.

Matches the "admin manually adds users" model: there's no public
self-signup. The household admin creates an account (with a temporary
password) for each roommate, who then logs in themselves.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import User
from core.security import hash_password
from core.deps import get_current_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AddUserRequest(BaseModel):
    email: EmailStr
    name: str
    temporary_password: str
    is_household_admin: bool = False


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    is_household_admin: bool
    household_id: int
    must_reset_password: bool

    class Config:
        from_attributes = True


@router.post("/users", response_model=UserOut)
def add_user(
    req: AddUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")

    new_user = User(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.temporary_password),
        is_household_admin=req.is_household_admin,
        household_id=admin.household_id,  # always the admin's own household -- no cross-household adds
        must_reset_password=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/users", response_model=list[UserOut])
def list_household_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(User).filter(User.household_id == admin.household_id).all()
