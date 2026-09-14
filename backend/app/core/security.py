import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum

import bcrypt
import jwt

from app.core.config import get_settings

settings = get_settings()


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def _create_token(subject: str, perfil: str, area_id: str | None, token_type: TokenType, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "perfil": perfil,
        "area_id": area_id,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, perfil: str, area_id: str | None) -> str:
    return _create_token(
        user_id, perfil, area_id, TokenType.ACCESS,
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(user_id: str, perfil: str, area_id: str | None) -> str:
    return _create_token(
        user_id, perfil, area_id, TokenType.REFRESH,
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def generate_opaque_token() -> str:
    """Used for permanent publication links and password-reset tokens."""
    return uuid.uuid4().hex + uuid.uuid4().hex
