"""
Database setup for RoomiDrive.

Defaults to local SQLite for zero-setup dev. Set DATABASE_URL (e.g. in
docker-compose) to point at Postgres instead -- same SQLAlchemy model
code either way, only the connection URL changes.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./roomidrive_poc.db")

# check_same_thread=False is required for SQLite when used with FastAPI's
# threaded request handling. Not needed (or valid) for Postgres.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
