import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auditoria import LogAuditoria


async def record_audit(
    db: AsyncSession,
    *,
    entidade: str,
    entidade_id: uuid.UUID,
    acao: str,
    usuario_id: uuid.UUID | None,
    detalhes: dict | None = None,
) -> None:
    """Appends an audit trail entry. Callers still need to commit the session
    (kept out of here so it can share the transaction with the calling action)."""
    db.add(
        LogAuditoria(
            entidade=entidade,
            entidade_id=entidade_id,
            acao=acao,
            usuario_id=usuario_id,
            detalhes=detalhes,
        )
    )
