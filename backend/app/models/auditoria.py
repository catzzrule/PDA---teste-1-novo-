import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class LogAuditoria(Base):
    __tablename__ = "logs_auditoria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidade: Mapped[str] = mapped_column(String(50), nullable=False)
    entidade_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    acao: Mapped[str] = mapped_column(String(100), nullable=False)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    detalhes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destinatario_email: Mapped[str] = mapped_column(String(255), nullable=False)
    assunto: Mapped[str] = mapped_column(String(500), nullable=False)
    corpo: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    enviado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    entregue: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
