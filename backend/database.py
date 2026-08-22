"""
Database setup for the FleetSync POC.

POC NOTE: uses SQLite for zero-setup local dev. In the full build this
becomes PostgreSQL (via docker-compose) with the exact same SQLAlchemy
model code -- only the connection URL changes.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = "sqlite:///./fleetsync_poc.db"

# check_same_thread=False is required for SQLite when used with FastAPI's
# threaded request handling. This restriction goes away entirely with Postgres.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
