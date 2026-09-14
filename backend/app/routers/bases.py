import json
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.enums import Perfil, StatusVersao, TipoArquivo
from app.models.base_dados import Arquivo, BaseDados, VersaoBase
from app.models.usuario import Usuario
from app.schemas.base_dados import BaseDetailOut, BaseListOut, VersaoBaseOut
from app.schemas.usuario import AreaOut
from app.services.audit import record_audit
from app.services.storage import UploadRejected, storage_backend

router = APIRouter(prefix="/bases", tags=["bases"])

_LOAD_OPTIONS = (
    selectinload(BaseDados.area),
    selectinload(BaseDados.versoes).selectinload(VersaoBase.arquivos),
)


def _to_list_out(base: BaseDados) -> BaseListOut:
    return BaseListOut(
        id=base.id,
        area=AreaOut.model_validate(base.area),
        titulo=base.titulo,
        status_atual=base.status_atual,
        criado_em=base.criado_em,
        atualizado_em=base.atualizado_em,
        versao_atual=VersaoBaseOut.model_validate(base.versoes[-1]),
    )


def _to_detail_out(base: BaseDados) -> BaseDetailOut:
    return BaseDetailOut(
        id=base.id,
        area=AreaOut.model_validate(base.area),
        titulo=base.titulo,
        status_atual=base.status_atual,
        criado_em=base.criado_em,
        atualizado_em=base.atualizado_em,
        versao_atual=VersaoBaseOut.model_validate(base.versoes[-1]),
        versoes=[VersaoBaseOut.model_validate(v) for v in base.versoes],
    )


def _parse_dados_formulario(raw: str) -> dict:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "dados_formulario inválido (JSON malformado).") from exc

    if not isinstance(data, dict):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "dados_formulario deve ser um objeto JSON.")

    titulo = (data.get("q2_titulo_base") or "").strip()
    if not titulo:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "O título da base (pergunta 2) é obrigatório.")

    return data


async def _save_arquivo(
    db: AsyncSession, *, versao_id: uuid.UUID, tipo: TipoArquivo, file: UploadFile, subpath: str
) -> None:
    try:
        path, size = await storage_backend.save(file, subpath=subpath)
    except UploadRejected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, exc.message) from exc

    db.add(
        Arquivo(
            versao_base_id=versao_id,
            tipo=tipo.value,
            nome_original=file.filename or "arquivo",
            caminho_armazenamento=path,
            tamanho_bytes=size,
            content_type=file.content_type,
        )
    )


@router.get("", response_model=list[BaseListOut])
async def list_bases(
    area_id: uuid.UUID | None = None,
    status_atual: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(Perfil.AREA, Perfil.OUV_ANALISTA, Perfil.ADM_OUV)),
) -> list[BaseListOut]:
    query = select(BaseDados).options(*_LOAD_OPTIONS).order_by(BaseDados.atualizado_em.desc())
    if area_id is not None:
        query = query.where(BaseDados.area_id == area_id)
    if status_atual is not None:
        query = query.where(BaseDados.status_atual == status_atual)

    result = await db.execute(query)
    return [_to_list_out(b) for b in result.scalars().all()]


@router.get("/{base_id}", response_model=BaseDetailOut)
async def get_base(
    base_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(Perfil.AREA, Perfil.OUV_ANALISTA, Perfil.ADM_OUV)),
) -> BaseDetailOut:
    result = await db.execute(select(BaseDados).options(*_LOAD_OPTIONS).where(BaseDados.id == base_id))
    base = result.scalar_one_or_none()
    if base is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Base não encontrada.")
    return _to_detail_out(base)


@router.post("", response_model=BaseDetailOut, status_code=status.HTTP_201_CREATED)
async def create_base(
    dados_formulario: str = Form(...),
    arquivo_recurso: UploadFile | None = File(None),
    arquivo_dicionario: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(require_roles(Perfil.AREA)),
) -> BaseDetailOut:
    if current.area_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Seu usuário não está vinculado a uma área.")

    data = _parse_dados_formulario(dados_formulario)

    base = BaseDados(
        area_id=current.area_id,
        titulo=data["q2_titulo_base"].strip(),
        status_atual=StatusVersao.EM_ANALISE.value,
        criado_por=current.id,
    )
    db.add(base)
    await db.flush()

    versao = VersaoBase(
        base_id=base.id,
        numero_versao=1,
        dados_formulario=data,
        enviado_por=current.id,
        status=StatusVersao.EM_ANALISE.value,
    )
    db.add(versao)
    await db.flush()

    if arquivo_recurso is not None and arquivo_recurso.filename:
        await _save_arquivo(
            db, versao_id=versao.id, tipo=TipoArquivo.RECURSO, file=arquivo_recurso,
            subpath=f"{base.id}/v1",
        )
    if arquivo_dicionario is not None and arquivo_dicionario.filename:
        await _save_arquivo(
            db, versao_id=versao.id, tipo=TipoArquivo.DICIONARIO, file=arquivo_dicionario,
            subpath=f"{base.id}/v1",
        )

    await record_audit(
        db, entidade="base", entidade_id=base.id, acao="criada",
        usuario_id=current.id, detalhes={"numero_versao": 1},
    )
    await db.commit()

    result = await db.execute(
        select(BaseDados)
        .options(*_LOAD_OPTIONS)
        .where(BaseDados.id == base.id)
        .execution_options(populate_existing=True)
    )
    return _to_detail_out(result.scalar_one())


@router.put("/{base_id}/reenviar", response_model=BaseDetailOut)
async def reenviar_base(
    base_id: uuid.UUID,
    dados_formulario: str = Form(...),
    arquivo_recurso: UploadFile | None = File(None),
    arquivo_dicionario: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current: Usuario = Depends(require_roles(Perfil.AREA)),
) -> BaseDetailOut:
    result = await db.execute(select(BaseDados).options(*_LOAD_OPTIONS).where(BaseDados.id == base_id))
    base = result.scalar_one_or_none()
    if base is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Base não encontrada.")
    if base.area_id != current.area_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Esta base pertence a outra área.")

    ultima_versao = base.versoes[-1]
    if ultima_versao.status != StatusVersao.REJEITADA.value:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Só é possível reenviar uma base cuja última versão foi rejeitada.",
        )

    data = _parse_dados_formulario(dados_formulario)

    nova_versao = VersaoBase(
        base_id=base.id,
        numero_versao=ultima_versao.numero_versao + 1,
        dados_formulario=data,
        enviado_por=current.id,
        status=StatusVersao.EM_ANALISE.value,
    )
    db.add(nova_versao)
    await db.flush()

    if arquivo_recurso is not None and arquivo_recurso.filename:
        await _save_arquivo(
            db, versao_id=nova_versao.id, tipo=TipoArquivo.RECURSO, file=arquivo_recurso,
            subpath=f"{base.id}/v{nova_versao.numero_versao}",
        )
    else:
        anterior = next((a for a in ultima_versao.arquivos if a.tipo == TipoArquivo.RECURSO.value), None)
        if anterior is not None:
            db.add(Arquivo(
                versao_base_id=nova_versao.id, tipo=TipoArquivo.RECURSO.value,
                nome_original=anterior.nome_original, caminho_armazenamento=anterior.caminho_armazenamento,
                tamanho_bytes=anterior.tamanho_bytes, content_type=anterior.content_type,
            ))

    if arquivo_dicionario is not None and arquivo_dicionario.filename:
        await _save_arquivo(
            db, versao_id=nova_versao.id, tipo=TipoArquivo.DICIONARIO, file=arquivo_dicionario,
            subpath=f"{base.id}/v{nova_versao.numero_versao}",
        )
    else:
        anterior = next((a for a in ultima_versao.arquivos if a.tipo == TipoArquivo.DICIONARIO.value), None)
        if anterior is not None:
            db.add(Arquivo(
                versao_base_id=nova_versao.id, tipo=TipoArquivo.DICIONARIO.value,
                nome_original=anterior.nome_original, caminho_armazenamento=anterior.caminho_armazenamento,
                tamanho_bytes=anterior.tamanho_bytes, content_type=anterior.content_type,
            ))

    base.titulo = data["q2_titulo_base"].strip()
    base.status_atual = StatusVersao.EM_ANALISE.value

    await record_audit(
        db, entidade="base", entidade_id=base.id, acao="reenviada",
        usuario_id=current.id, detalhes={"numero_versao": nova_versao.numero_versao},
    )
    await db.commit()

    result = await db.execute(
        select(BaseDados)
        .options(*_LOAD_OPTIONS)
        .where(BaseDados.id == base.id)
        .execution_options(populate_existing=True)
    )
    return _to_detail_out(result.scalar_one())
