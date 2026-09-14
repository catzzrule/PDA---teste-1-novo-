import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class LinkPublicacao(Base):
    __tablename__ = "links_publicacao"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    base_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bases.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    gerado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    gerado_por: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    enviado_ao_portal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enviado_ao_portal_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enviado_ao_portal_por: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True,
    )

    base: Mapped["BaseDados"] = relationship(back_populates="link_publicacao")  # noqa: F821
