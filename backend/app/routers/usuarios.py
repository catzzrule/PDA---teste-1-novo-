import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.enums import Perfil
from app.models.usuario import Area, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.services.audit import record_audit

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Only Master CGTI provisions logins for the other profiles — the spec leaves
# this as an open item but names CGTI as the most likely owner of user
# management (section 9).
_ONLY_MASTER = require_roles(Perfil.MASTER_CGTI)


@router.get("", response_model=list[UsuarioOut])
async def list_usuarios(
    db: AsyncSession = Depends(get_db), _: Usuario = Depends(_ONLY_MASTER)
) -> list[UsuarioOut]:
    result = await db.execute(
        select(Usuario).options(selectinload(Usuario.area)).order_by(Usuario.nome)
    )
    return [UsuarioOut.model_validate(u) for u in result.scalars().all()]


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    payload: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(_ONLY_MASTER),
) -> UsuarioOut:
    existing = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe um usuário com este e-mail.")

    if payload.perfil == Perfil.AREA and payload.area_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Usuários do perfil Área precisam de uma área vinculada.")

    if payload.area_id is not None:
        area = await db.get(Area, payload.area_id)
        if area is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Área informada não existe.")

    user = Usuario(
        nome=payload.nome,
        email=payload.email,
        senha_hash=hash_password(payload.senha_provisoria_valor),
        perfil=payload.perfil.value,
        area_id=payload.area_id if payload.perfil == Perfil.AREA else None,
        senha_provisoria=True,
        ativo=True,
    )
    db.add(user)
    await db.flush()
    await record_audit(
        db, entidade="usuario", entidade_id=user.id, acao="criado",
        usuario_id=current.id, detalhes={"perfil": payload.perfil.value},
    )
    await db.commit()
    await db.refresh(user, attribute_names=["area"])
    return UsuarioOut.model_validate(user)


@router.patch("/{usuario_id}", response_model=UsuarioOut)
async def update_usuario(
    usuario_id: uuid.UUID,
    payload: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(_ONLY_MASTER),
) -> UsuarioOut:
    user = await db.get(Usuario, usuario_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado.")

    if payload.nome is not None:
        user.nome = payload.nome
    if payload.ativo is not None:
        user.ativo = payload.ativo
    if payload.area_id is not None:
        area = await db.get(Area, payload.area_id)
        if area is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Área informada não existe.")
        user.area_id = payload.area_id

    await record_audit(
        db, entidade="usuario", entidade_id=user.id, acao="atualizado",
        usuario_id=current.id, detalhes=payload.model_dump(exclude_none=True, mode="json"),
    )
    await db.commit()
    await db.refresh(user, attribute_names=["area"])
    return UsuarioOut.model_validate(user)


@router.post("/{usuario_id}/resetar-senha")
async def resetar_senha(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(_ONLY_MASTER),
) -> dict:
    user = await db.get(Usuario, usuario_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado.")

    nova_senha_provisoria = secrets.token_urlsafe(9)
    user.senha_hash = hash_password(nova_senha_provisoria)
    user.senha_provisoria = True

    await record_audit(db, entidade="usuario", entidade_id=user.id, acao="senha_resetada_por_master", usuario_id=current.id)
    await db.commit()
    # Shown once, here, to whoever operates the master screen — the same
    # pattern as the current prototype's "Cadastrar Área" flow.
    return {"senha_provisoria": nova_senha_provisoria}
