import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import Perfil
from app.models.usuario import Area, Usuario
from app.schemas.usuario import AreaCreate, AreaOut, AreaUpdate
from app.services.audit import record_audit

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaOut])
async def list_areas(db: AsyncSession = Depends(get_db), _: Usuario = Depends(get_current_user)) -> list[AreaOut]:
    result = await db.execute(select(Area).order_by(Area.nome))
    return [AreaOut.model_validate(a) for a in result.scalars().all()]


@router.post("", response_model=AreaOut, status_code=status.HTTP_201_CREATED)
async def create_area(
    payload: AreaCreate,
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(require_roles(Perfil.MASTER_CGTI)),
) -> AreaOut:
    existing = await db.execute(select(Area).where(Area.nome == payload.nome))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma área com este nome.")

    area = Area(nome=payload.nome, sigla=payload.sigla)
    db.add(area)
    await db.flush()
    await record_audit(db, entidade="area", entidade_id=area.id, acao="criada", usuario_id=current.id)
    await db.commit()
    return AreaOut.model_validate(area)


@router.patch("/{area_id}", response_model=AreaOut)
async def update_area(
    area_id: uuid.UUID,
    payload: AreaUpdate,
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(require_roles(Perfil.MASTER_CGTI)),
) -> AreaOut:
    area = await db.get(Area, area_id)
    if area is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Área não encontrada.")

    if payload.nome is not None and payload.nome != area.nome:
        existing = await db.execute(select(Area).where(Area.nome == payload.nome))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma área com este nome.")
        area.nome = payload.nome

    if payload.sigla is not None:
        area.sigla = payload.sigla

    await record_audit(
        db, entidade="area", entidade_id=area.id, acao="atualizada",
        usuario_id=current.id, detalhes=payload.model_dump(exclude_none=True),
    )
    await db.commit()
    await db.refresh(area)
    return AreaOut.model_validate(area)
