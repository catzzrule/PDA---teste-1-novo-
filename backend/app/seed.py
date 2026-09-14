"""Bootstraps the very first account so someone can log in and start
provisioning everyone else through the admin UI. Run once per environment:

    docker compose exec backend python -m app.seed

Intentionally does NOT invent official MESP area names — those get created
by the Master CGTI account through the "Cadastrar Área" screen once real
values are confirmed with the business area.
"""

import asyncio
import os

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import Perfil
from app.models.usuario import Usuario

SEED_MASTER_EMAIL = os.environ.get("SEED_MASTER_EMAIL", "admin.cgti@esporte.gov.br")
SEED_MASTER_PASSWORD = os.environ.get("SEED_MASTER_PASSWORD", "TrocarSenha123")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(Usuario).where(Usuario.email == SEED_MASTER_EMAIL))
        if existing.scalar_one_or_none() is not None:
            print(f"Usuário master '{SEED_MASTER_EMAIL}' já existe — nada a fazer.")
            return

        user = Usuario(
            nome="Administrador CGTI",
            email=SEED_MASTER_EMAIL,
            senha_hash=hash_password(SEED_MASTER_PASSWORD),
            perfil=Perfil.MASTER_CGTI.value,
            area_id=None,
            senha_provisoria=True,
            ativo=True,
        )
        db.add(user)
        await db.commit()

    print("Usuário master CGTI criado com sucesso.")
    print(f"  E-mail:          {SEED_MASTER_EMAIL}")
    print(f"  Senha provisória: {SEED_MASTER_PASSWORD}")
    print("  (será exigida troca de senha no primeiro login)")


if __name__ == "__main__":
    asyncio.run(main())
