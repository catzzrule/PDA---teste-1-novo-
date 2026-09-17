# Sistema PDA (MESP)

Portal de Dados Abertos do MESP. Frontend em React + TypeScript + Tailwind,
backend em FastAPI + PostgreSQL.

## Opção 1 — Docker (mais simples)

Requer apenas [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

```bash
docker compose up -d                              # sobe postgres + backend + frontend
docker compose exec backend alembic upgrade head  # após clonar ou mudar o schema
docker compose exec backend python -m app.seed    # cria o 1º usuário (master CGTI)
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## Opção 2 — Sem Docker (tudo nativo)

Para quem não tem Docker instalado. Requer instalar 3 coisas na máquina:

- [Python 3.12+](https://www.python.org/downloads/)
- [Node 22+](https://nodejs.org/)
- [PostgreSQL 16+](https://www.postgresql.org/download/)

### 1. Banco de dados

Crie o usuário e o banco que o projeto espera (mesmos nomes usados no
`docker-compose.yml`, então as configurações padrão dos `.env.example`
funcionam sem editar nada):

```sql
-- via psql (psql -U postgres)
CREATE USER pda WITH PASSWORD 'pda';
CREATE DATABASE pda OWNER pda;
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows — no Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

copy .env.example .env       # Windows — no Linux/Mac: cp .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

Backend disponível em http://localhost:8000 (`/health` deve responder `{"status": "ok"}`).

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
copy .env.example .env       # Windows — no Linux/Mac: cp .env.example .env
npm run dev
```

Frontend disponível em http://localhost:5173.

## Login padrão (seed)

Criado por `python -m app.seed` (ou `docker compose exec backend python -m app.seed`):

- E-mail: `admin.cgti@esporte.gov.br`
- Senha provisória: `TrocarSenha123` (troca obrigatória no primeiro login)

Configurável via `SEED_MASTER_EMAIL` / `SEED_MASTER_PASSWORD` antes de rodar o seed.

## Deploy em produção

Há um `render.yaml` na raiz do projeto pronto para deploy no [Render](https://render.com)
(Blueprint: New + → Blueprint → selecionar este repositório). Ele sobe frontend,
backend e um PostgreSQL gerenciado. Veja os comentários no arquivo para as
variáveis de ambiente que precisam ser conferidas após o primeiro deploy
(URLs geradas pelo Render podem levar um sufixo aleatório).
