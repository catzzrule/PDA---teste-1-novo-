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

Para quem não tem Docker instalado. Requer instalar 2 coisas na máquina —
[Python 3.12+](https://www.python.org/downloads/) e [Node 22+](https://nodejs.org/)
— mais um banco Postgres, que pode ser local ou hospedado (não precisa instalar
Postgres também se usar a opção B abaixo).

### 1. Banco de dados

**Opção A — Postgres local:**

```sql
-- via psql (psql -U postgres), depois de instalar o PostgreSQL 16+
CREATE USER pda WITH PASSWORD 'pda';
CREATE DATABASE pda OWNER pda;
```

Isso já bate com os valores padrão do `.env.example`, então não precisa editar nada.

**Opção B — Supabase (banco hospedado, sem instalar nada):**

Crie um projeto grátis em [supabase.com](https://supabase.com), depois vá em
**Project Settings → Database → Connection string → URI** (use a "Direct
connection", porta 5432 — não a pooled/porta 6543) e copie a URL. Cole ela em
`DATABASE_URL` no `.env` do backend (passo seguinte), trocando o prefixo
`postgresql://` por `postgresql+asyncpg://` (o driver assíncrono que o
projeto usa) — ou deixe como veio: o backend já normaliza isso sozinho.
Essa mesma URL pode ser reaproveitada em produção (ver "Deploy em produção").

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

## Deploy em produção — acesso de qualquer máquina, sem depender do Docker de ninguém

Três peças, cada uma resolvendo uma parte (nenhuma depende do PC de quem
configurou estar ligado ou ter Docker instalado):

1. **Banco — Supabase.** Crie um projeto grátis em [supabase.com](https://supabase.com)
   e copie a connection string (Direct connection, porta 5432) em
   **Project Settings → Database → Connection string**.
2. **Backend — Render.** Há um `render.yaml` na raiz pronto pra isso: no
   [Render](https://render.com), **New + → Blueprint** → selecione este
   repositório. Ele builda o backend (`backend/Dockerfile`) e roda migrations
   + seed sozinho. Depois do primeiro deploy, cole a connection string do
   Supabase na variável `DATABASE_URL` do serviço (fica marcada como
   "secret"/manual no blueprint de propósito, pra não ir pro git) e defina
   `SEED_MASTER_EMAIL`/`SEED_MASTER_PASSWORD` com as credenciais reais do
   primeiro login.
3. **Frontend — GitHub Pages.** Já configurado via
   `.github/workflows/deploy-pages.yml` — só falta ativar em
   **Settings → Pages → Source: GitHub Actions** neste repositório, uma vez.
   Fica em `https://<usuário>.github.io/<repositório>/`.

Depois desses 3 passos, qualquer pessoa com o link do GitHub Pages consegue
logar de qualquer máquina, sem instalar nada e sem depender do computador de
quem fez o deploy estar ligado.

Veja os comentários em `render.yaml` para as variáveis (`CORS_ORIGINS`,
`PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`) que precisam bater com as URLs reais
geradas pelo Render/GitHub — elas podem levar um sufixo diferente do
esperado se o nome já estiver em uso.
