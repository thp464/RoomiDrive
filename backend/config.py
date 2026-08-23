"""
App configuration.

POC NOTE: jwt_secret has a dev default so the app runs out of the box.
Before this goes anywhere near production, set JWT_SECRET as a real env
var/secret -- never ship the default.
"""
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h -- generous for POC convenience

    # Required to call /auth/bootstrap-household -- otherwise anyone who finds
    # the site can create their own household. Not a login password, just a
    # shared "you're allowed to set up a household here" secret. min_length=1
    # so an accidentally-empty env var (e.g. unset in docker-compose, which
    # substitutes "" rather than leaving it unset) fails startup loudly
    # instead of silently accepting an empty secret.
    bootstrap_secret: str = Field(min_length=1)


settings = Settings()
