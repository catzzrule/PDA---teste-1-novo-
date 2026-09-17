import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.deps import get_current_user_any, get_usuario_by_email
from app.core.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_opaque_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.auditoria import PasswordResetToken
from app.models.usuario import Usuario
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.usuario import UsuarioOut
from app.services.audit import record_audit
from app.services.notification import notification_service

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_refresh_cookie(response: Response, user: Usuario) -> None:
    refresh_token = create_refresh_token(str(user.id), user.perfil, str(user.area_id) if user.area_id else None)
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/auth",
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await get_usuario_by_email(db, payload.email)
    if user is None or not user.ativo or not verify_password(payload.senha, user.senha_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou senha incorretos.")

    access_token = create_access_token(str(user.id), user.perfil, str(user.area_id) if user.area_id else None)
    _set_refresh_cookie(response, user)

    await record_audit(db, entidade="usuario", entidade_id=user.id, acao="login", usuario_id=user.id)
    await db.commit()

    return TokenResponse(access_token=access_token, usuario=UsuarioOut.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_cookie: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
) -> TokenResponse:
    if refresh_cookie is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão expirada, faça login novamente.")

    try:
        payload = decode_token(refresh_cookie)
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão expirada, faça login novamente.") from exc

    if payload.get("type") != TokenType.REFRESH.value:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido.")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido.") from exc

    user = await db.get(Usuario, user_id, options=[selectinload(Usuario.area)])
    if user is None or not user.ativo:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário não encontrado ou inativo.")

    access_token = create_access_token(str(user.id), user.perfil, str(user.area_id) if user.area_id else None)
    _set_refresh_cookie(response, user)  # rotate refresh token

    return TokenResponse(access_token=access_token, usuario=UsuarioOut.model_validate(user))


@router.post("/logout")
async def logout(response: Response) -> dict:
    response.delete_cookie(settings.refresh_cookie_name, path="/auth")
    return {"ok": True}


@router.get("/me", response_model=UsuarioOut)
async def me(user: Usuario = Depends(get_current_user_any)) -> UsuarioOut:
    return UsuarioOut.model_validate(user)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    user: Usuario = Depends(get_current_user_any),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not user.senha_provisoria:
        if not payload.senha_atual or not verify_password(payload.senha_atual, user.senha_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Senha atual incorreta.")

    user.senha_hash = hash_password(payload.nova_senha)
    user.senha_provisoria = False
    await record_audit(db, entidade="usuario", entidade_id=user.id, acao="troca_senha", usuario_id=user.id)
    await db.commit()
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    user = await get_usuario_by_email(db, payload.email)
    generic_message = {"message": "Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha."}

    if user is None or not user.ativo:
        return generic_message

    token = generate_opaque_token()
    db.add(
        PasswordResetToken(
            usuario_id=user.id,
            token=token,
            expira_em=datetime.now(timezone.utc) + timedelta(hours=2),
        )
    )
    reset_link = f"{settings.frontend_base_url}/redefinir-senha?token={token}"
    await notification_service.send(
        db,
        to=user.email,
        subject="Redefinição de senha — Sistema PDA MESP",
        body=(
            f"Olá, {user.nome}.\n\nRecebemos um pedido para redefinir sua senha no "
            f"Sistema PDA do MESP. Acesse o link abaixo (válido por 2 horas):\n\n{reset_link}\n\n"
            "Se você não solicitou isso, ignore este e-mail."
        ),
        tipo="reset_senha",
    )
    await db.commit()
    return generic_message


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    token_row = (
        await db.execute(select(PasswordResetToken).where(PasswordResetToken.token == payload.token))
    ).scalar_one_or_none()

    if (
        token_row is None
        or token_row.usado
        or token_row.expira_em.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Link de redefinição inválido ou expirado.")

    user = await db.get(Usuario, token_row.usuario_id)
    if user is None or not user.ativo:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Link de redefinição inválido ou expirado.")

    user.senha_hash = hash_password(payload.nova_senha)
    user.senha_provisoria = False
    token_row.usado = True

    await record_audit(db, entidade="usuario", entidade_id=user.id, acao="redefinicao_senha", usuario_id=user.id)
    await db.commit()
    return {"ok": True}
