# SoundFlow

Player de música web com catálogo por usuário, fila FIFO e histórico LIFO. Monorepo com React, NestJS, PostgreSQL e Better Auth.

## Recursos

- Catálogo pessoal com busca, ordenação e CRUD de músicas.
- Player com play/pause, anterior/próxima, progresso e volume.
- Fila FIFO e histórico LIFO.
- Cadastro e login com e-mail e senha; cada usuário acessa apenas os próprios dados.
- Reprodução direta no navegador pela URL de áudio cadastrada.

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, CSS Modules, Vitest.
- **Backend:** NestJS 11, TypeScript, Jest e Supertest.
- **Banco:** PostgreSQL 16 e Drizzle ORM.
- **Autenticação:** Better Auth, com sessão em cookie HttpOnly.
- **Monorepo:** pnpm workspaces.

## Como executar

Pré-requisitos: Node.js 22.12+, pnpm 9 e Docker (ou PostgreSQL 16).

```bash
pnpm install
cp .env.example .env
# Configure BETTER_AUTH_SECRET e as demais variáveis
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Acesse http://localhost:5173.

Usuário de demonstração, após executar o seed:

- **E-mail:** `demo@pulse.local`
- **Senha:** `pulse-demo-123`

Gere um segredo para `BETTER_AUTH_SECRET` com:

```bash
openssl rand -base64 48
```

### Variáveis principais

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão com PostgreSQL |
| `BETTER_AUTH_SECRET` | Segredo da autenticação (mínimo de 32 caracteres) |
| `BETTER_AUTH_URL` | URL do backend, sem `/api` |
| `WEB_ORIGIN` | Origem do frontend |
| `VITE_API_URL` | URL da API para o navegador, com `/api` |
| `API_PORT` | Porta da API (padrão: `3000`) |

O arquivo `.env` fica na raiz do monorepo.

## Estruturas de dados

- **Lista:** o catálogo usa arrays nativos com os resultados ordenados pelo PostgreSQL.
- **Fila FIFO:** controla as próximas músicas.
- **Pilha LIFO:** mantém o histórico, com a reprodução mais recente primeiro.

A fila e a pilha usam `datastructures-js`, com adaptadores em `apps/api/src/playback/structures/`.

## API

Todas as rotas usam o prefixo `/api`. A autenticação é exigida, exceto em `/api/health` e nas rotas de autenticação.

| Método/rota | Descrição |
| --- | --- |
| `GET /api/health` | Verifica a API e o banco |
| `/api/auth/*` | Cadastro, login, logout e sessão |
| `GET /api/music` | Lista e pesquisa músicas |
| `POST /api/music` | Cadastra uma música |
| `/api/music/:id` | Consulta, edita ou exclui uma música |
| `/api/playback/*` | Estado e controles do player |
| `/api/queue` | Consulta, adiciona e limpa a fila |
| `/api/history` | Consulta e limpa o histórico |

Operações de reprodução retornam o estado atualizado do player. Erros seguem o formato `{ statusCode, message, error }`.

## Testes e scripts

```bash
pnpm test       # Testes unitários e de interface
pnpm db:up      # Inicia o PostgreSQL
pnpm test:e2e   # Testes de integração (exigem banco de testes)
pnpm build      # Compila os pacotes
pnpm lint       # Executa o ESLint
pnpm typecheck  # Verifica os tipos TypeScript
```

Outros comandos úteis: `pnpm db:seed`, `pnpm db:migrate`, `pnpm db:reset` e `pnpm format`.

## Segurança

- Senhas gerenciadas pelo Better Auth; sessões em cookies HttpOnly.
- Rotas protegidas por padrão e validação de entrada.
- Consultas do catálogo filtradas pelo usuário autenticado.
- CORS restrito à origem configurada.
- Em produção, configure URLs HTTPS e um segredo próprio.

## Limitações conhecidas

- Fila, histórico e faixa atual ficam na memória da API: são perdidos ao reiniciar e não são compartilhados entre instâncias.
- O estado inativo é descartado após seis horas.
- Não há verificação de e-mail nem recuperação de senha.
- O navegador precisa conseguir acessar e reproduzir as URLs de áudio cadastradas.