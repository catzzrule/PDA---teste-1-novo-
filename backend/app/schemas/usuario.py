import uuid

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import Perfil


class AreaOut(BaseModel):
    id: uuid.UUID
    nome: str
    sigla: str | None = None

    model_config = {"from_attributes": True}


class AreaCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=255)
    sigla: str | None = Field(default=None, max_length=20)


class AreaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=255)
    sigla: str | None = Field(default=None, max_length=20)


class UsuarioOut(BaseModel):
    id: uuid.UUID
    nome: str
    email: EmailStr
    perfil: Perfil
    area: AreaOut | None = None
    senha_provisoria: bool
    ativo: bool

    model_config = {"from_attributes": True}


class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=255)
    email: EmailStr
    senha_provisoria_valor: str = Field(min_length=6, max_length=255)
    perfil: Perfil
    area_id: uuid.UUID | None = None


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=255)
    ativo: bool | None = None
    area_id: uuid.UUID | None = None
