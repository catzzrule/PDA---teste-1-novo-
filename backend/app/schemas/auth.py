from pydantic import BaseModel, EmailStr, Field

from app.schemas.usuario import UsuarioOut


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut


class ChangePasswordRequest(BaseModel):
    # senha_atual is only required when the user is voluntarily changing an
    # already-active password; the forced first-login flow skips it because
    # the user just proved ownership of the provisional password at login.
    senha_atual: str | None = None
    nova_senha: str = Field(min_length=6, max_length=255)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    nova_senha: str = Field(min_length=6, max_length=255)
