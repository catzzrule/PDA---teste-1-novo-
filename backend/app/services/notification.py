import asyncio
import logging
import smtplib
from email.mime.text import MIMEText

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.auditoria import Notificacao

logger = logging.getLogger("pda.notifications")
settings = get_settings()


class NotificationService:
    """Decoupled notification layer. The MESP has not confirmed an institutional
    SMTP provider yet, so every notification is always persisted to the
    `notificacoes` table (visible to Adm Ouvidoria) and logged to the console.
    When SMTP_HOST is configured, it is also actually delivered by e-mail —
    swapping providers later only means changing env vars, not this code."""

    async def send(self, db: AsyncSession, *, to: str, subject: str, body: str, tipo: str) -> None:
        entregue = False
        if settings.smtp_host:
            try:
                await asyncio.to_thread(self._send_smtp, to, subject, body)
                entregue = True
            except Exception:  # noqa: BLE001 - notification failures must never break the caller's flow
                logger.exception("Falha ao enviar e-mail via SMTP para %s", to)

        logger.info("[NOTIFICACAO:%s] para=%s assunto=%s\n%s", tipo, to, subject, body)
        db.add(
            Notificacao(
                destinatario_email=to,
                assunto=subject,
                corpo=body,
                tipo=tipo,
                entregue=entregue,
            )
        )

    def _send_smtp(self, to: str, subject: str, body: str) -> None:
        message = MIMEText(body, "plain", "utf-8")
        message["Subject"] = subject
        message["From"] = settings.smtp_from
        message["To"] = to

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to], message.as_string())


notification_service = NotificationService()
