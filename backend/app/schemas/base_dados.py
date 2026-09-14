import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.schemas.usuario import AreaOut


class ArquivoOut(BaseModel):
    id: uuid.UUID
    tipo: str
    nome_original: str
    tamanho_bytes: int
    content_type: str | None = None
    enviado_em: datetime

    model_config = {"from_attributes": True}


class VersaoBaseOut(BaseModel):
    id: uuid.UUID
    numero_versao: int
    dados_formulario: dict[str, Any]
    enviado_por: uuid.UUID
    enviado_em: datetime
    status: str
    analisado_por: uuid.UUID | None = None
    analisado_em: datetime | None = None
    motivo_rejeicao_categoria: str | None = None
    motivo_rejeicao_detalhe: str | None = None
    arquivos: list[ArquivoOut] = []

    model_config = {"from_attributes": True}


class BaseListOut(BaseModel):
    id: uuid.UUID
    area: AreaOut
    titulo: str
    status_atual: str
    criado_em: datetime
    atualizado_em: datetime
    versao_atual: VersaoBaseOut

    model_config = {"from_attributes": True}


class BaseDetailOut(BaseListOut):
    versoes: list[VersaoBaseOut] = []

    model_config = {"from_attributes": True}
