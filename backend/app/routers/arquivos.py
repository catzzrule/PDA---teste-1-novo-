import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.base_dados import Arquivo, VersaoBase
from app.models.enums import Perfil
from app.models.usuario import Usuario
from app.services.storage import storage_backend

router = APIRouter(prefix="/arquivos", tags=["arquivos"])


@router.get("/{arquivo_id}/download")
async def download_arquivo(
    arquivo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(require_roles(Perfil.AREA, Perfil.OUV_ANALISTA, Perfil.ADM_OUV)),
) -> FileResponse:
    result = await db.execute(
        select(Arquivo)
        .options(selectinload(Arquivo.versao).selectinload(VersaoBase.base))
        .where(Arquivo.id == arquivo_id)
    )
    arquivo = result.scalar_one_or_none()
    if arquivo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Arquivo não encontrado.")

    base = arquivo.versao.base
    if current.perfil == Perfil.AREA.value and base.area_id != current.area_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Você não tem acesso a este arquivo.")

    full_path = await storage_backend.open_path(arquivo.caminho_armazenamento)
    if not full_path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Arquivo não encontrado no armazenamento.")

    return FileResponse(path=full_path, filename=arquivo.nome_original, media_type=arquivo.content_type)
