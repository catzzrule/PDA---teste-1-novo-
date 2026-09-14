import uuid
from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import TokenType, decode_token
from app.db.session import get_db
from app.models.enums import Perfil
from app.models.usuario import Usuario

bearer_scheme = HTTPBearer(auto_error=False)


async def _load_user_from_token(
    credentials: HTTPAuthorizationCredentials | None, db: AsyncSession
) -> Usuario:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Não autenticado.")

    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão expirada.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido.") from exc

    if payload.get("type") != TokenType.ACCESS.value:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tipo de token inválido.")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido.") from exc

    user = await db.get(Usuario, user_id, options=[selectinload(Usuario.area)])
    if user is None or not user.ativo:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário não encontrado ou inativo.")

    return user


async def get_current_user_any(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Loads the authenticated user regardless of pending forced password change.
    Only use this for /auth/me and /auth/change-password."""
    return await _load_user_from_token(credentials, db)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    """Loads the authenticated user and blocks access until they have replaced
    their provisional password, mirroring the rule enforced on the frontend."""
    user = await _load_user_from_token(credentials, db)
    if user.senha_provisoria:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "É necessário definir uma nova senha antes de continuar.",
        )
    return user


def require_roles(*roles: Perfil) -> Callable[[Usuario], Usuario]:
    async def checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.perfil not in {r.value for r in roles}:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Perfil sem permissão para esta ação.")
        return user

    return checker


async def get_usuario_by_email(db: AsyncSession, email: str) -> Usuario | None:
    result = await db.execute(
        select(Usuario).where(Usuario.email == email).options(selectinload(Usuario.area))
    )
    return result.scalar_one_or_none()
