from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User
from core.security import decode_access_token

# tokenUrl is just what shows up in the /docs "Authorize" button -- it
# doesn't affect how tokens are actually validated here.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    return user


def require_password_set(current_user: User = Depends(get_current_user)) -> User:
    """
    Blocks everything except /auth/me and /auth/change-password (which use
    get_current_user directly) until a user with a temporary password has
    set their own. Prevents someone from using an admin-issued temp
    password to check out a car (or anything else) before it's changed.
    """
    if current_user.must_reset_password:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Password reset required")
    return current_user


def get_current_admin_user(current_user: User = Depends(require_password_set)) -> User:
    if not current_user.is_household_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin privileges required")
    return current_user
