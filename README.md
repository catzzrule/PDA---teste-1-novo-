# Sistema PDA (MESP)

Portal de Dados Abertos do Ministério do Esporte. Cada área da MESP cadastra
e mantém suas bases de dados abertos através de um formulário guiado; a
Ouvidoria revisa e aprova o conteúdo antes da publicação; a CGTI administra
usuários/áreas e gera os links públicos finais.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind v4 (`frontend/`)
- **Backend:** FastAPI + SQLAlchemy async + Alembic (`backend/`)
- **Banco:** PostgreSQL 16
- **Infra local:** Docker Compose (único jeito suportado de rodar o projeto — não precisa instalar Python/Node/Postgres na máquina)

## Como rodar

Requer apenas [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up -d                              # sobe postgres + backend + frontend
docker compose exec backend alembic upgrade head  # roda migrations (após clonar ou puxar mudanças de schema)
docker compose exec backend python -m app.seed    # cria o 1º usuário (master CGTI), pula se já existir
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (`/health` → `{"status": "ok"}`)

### Login padrão (seed)

- E-mail: `admin.cgti@esporte.gov.br`
- Senha provisória: `TrocarSenha123` (troca obrigatória no primeiro login)

Configurável via `SEED_MASTER_EMAIL` / `SEED_MASTER_PASSWORD` (env vars) antes de rodar o seed.

### Rodando comandos pontuais

```bash
docker compose logs -f backend            # ver logs do backend
docker compose logs -f frontend           # ver logs do frontend (procure "hmr update" após editar)
docker compose exec backend alembic revision --autogenerate -m "descrição"  # nova migration
docker compose restart frontend           # se o Vite parar de refletir mudanças de arquivo (ver Troubleshooting)
docker compose exec db psql -U pda -d pda # acesso direto ao banco
```

## Perfis de usuário (RBAC)

| Perfil          | O que faz                                                             |
|------------------|------------------------------------------------------------------------|
| `area`           | Preenche/reenvia o formulário da própria área                          |
| `ouv_analista`   | Analisa e aprova/rejeita bases enviadas pelas áreas                    |
| `adm_ouv`        | Igual ao analista, mais administração da fila da Ouvidoria             |
| `master_cgti`    | Cadastra usuários/áreas, gera link permanente, acesso total            |

Definidos em [backend/app/models/enums.py](backend/app/models/enums.py).

## Estrutura do projeto

```
backend/
  app/
    routers/     auth, usuarios, areas, bases, arquivos — um arquivo por recurso da API
    models/      tabelas SQLAlchemy
    schemas/     schemas Pydantic de entrada/saída
    services/    regras que não são só CRUD (auditoria, notificação)
    core/        config (variáveis de ambiente), segurança (JWT, hash), deps do FastAPI
  alembic/       migrations do banco

frontend/
  src/
    pages/
      auth/       login, troca/recuperação de senha
      form/       wizard de cadastro de base (DatasetFormWizard, 25 perguntas em 3 etapas)
      dashboard/  listagem de bases e ficha detalhada (histórico de versões)
      admin/      telas do master CGTI (usuários, áreas)
    lib/          cliente da API, contexto de autenticação, schema do formulário
```

## Fluxo principal

1. Usuário da **área** preenche o wizard e envia uma versão da base.
2. A **Ouvidoria** (`ouv_analista`/`adm_ouv`) aprova ou rejeita, com motivo.
3. Se rejeitada, a área reenvia (formulário pré-preenchido, nova versão vinculada à mesma base).
4. Uma vez aprovada, a **CGTI** (`master_cgti`) gera o link permanente de publicação.
5. Toda ação relevante fica registrada em auditoria.

## Estado atual da implementação

- ✅ Fase 1 — Fundação: login, troca de senha obrigatória, RBAC, cookie de refresh
- ✅ Fase 2 — Cadastro: usuários e áreas pela tela do Master CGTI
- ✅ Fase 3 — Formulário: wizard completo, upload de arquivo, versionamento, dashboard
- ⬜ Fase 4 — Fila da Ouvidoria (aprovar/rejeitar pela UI — hoje testado via SQL direto)
- ⬜ Fase 5 — CGTI: link permanente + exportação
- ⬜ Fase 6 — Dashboards/métricas (baseado no modelo real da planilha da Ouvidoria)
- ⬜ Fase 7 — Notificações reais (hoje só gravam na tabela `notificacoes`)

## Troubleshooting

**Frontend não reflete mudanças de arquivo (sem erro nenhum):** eventos de
filesystem não atravessam de forma confiável o bind mount Windows → Docker
Desktop, então o watcher padrão do Vite às vezes fica "surdo". Já contornado
em `frontend/vite.config.ts` (`server.watch.usePolling = true`) — se
acontecer mesmo assim, rode `docker compose restart frontend` e confira
`docker compose logs frontend` procurando por `hmr update` a cada edição.

**Sem staging:** não existe ambiente de teste separado — testes manuais são
feitos direto no banco de dev. Ao criar contas de teste, use e-mails
`debug.*@example.com` e apague tudo ao final (usuário → base → log_auditoria,
nessa ordem, por causa das foreign keys) para não misturar com dados reais.
