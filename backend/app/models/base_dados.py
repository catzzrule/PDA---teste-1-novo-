import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import StatusVersao, TipoArquivo


class BaseDados(Base):
    """A "base" (dataset) tracked through the approval workflow. Table name kept
    in Portuguese (`bases`) to match the domain vocabulary from the spec."""

    __tablename__ = "bases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    area_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=False)
    titulo: Mapped[str] = mapped_column(String(500), nullable=False)
    status_atual: Mapped[str] = mapped_column(String(20), nullable=False, default=StatusVersao.EM_ANALISE.value)
    criado_por: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    area: Mapped["Area"] = relationship()  # noqa: F821
    versoes: Mapped[list["VersaoBase"]] = relationship(
        back_populates="base", order_by="VersaoBase.numero_versao", cascade="all, delete-orphan",
    )
    link_publicacao: Mapped["LinkPublicacao | None"] = relationship(  # noqa: F821
        back_populates="base", uselist=False, cascade="all, delete-orphan",
    )


class VersaoBase(Base):
    __tablename__ = "versoes_base"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    base_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bases.id", ondelete="CASCADE"), nullable=False)
    numero_versao: Mapped[int] = mapped_column(Integer, nullable=False)
    dados_formulario: Mapped[dict] = mapped_column(JSONB, nullable=False)
    enviado_por: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    enviado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=StatusVersao.EM_ANALISE.value)
    analisado_por: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    analisado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    motivo_rejeicao_categoria: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo_rejeicao_detalhe: Mapped[str | None] = mapped_column(Text, nullable=True)

    base: Mapped["BaseDados"] = relationship(back_populates="versoes")
    arquivos: Mapped[list["Arquivo"]] = relationship(back_populates="versao", cascade="all, delete-orphan")


class Arquivo(Base):
    __tablename__ = "arquivos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    versao_base_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("versoes_base.id", ondelete="CASCADE"), nullable=False,
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    nome_original: Mapped[str] = mapped_column(String(500), nullable=False)
    caminho_armazenamento: Mapped[str] = mapped_column(String(1000), nullable=False)
    tamanho_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    enviado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    versao: Mapped["VersaoBase"] = relationship(back_populates="arquivos")
