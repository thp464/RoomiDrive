"""
App configuration.

POC NOTE: jwt_secret has a dev default so the app runs out of the box.
Before this goes anywhere near production, set JWT_SECRET as a real env
var/secret -- never ship the default.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h -- generous for POC convenience


settings = Settings()
