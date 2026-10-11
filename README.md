# Showtime API

Backend do app Showtime: um CRUD de filmes com Express 5, Zod 4, Prisma ORM 7 e PostgreSQL 18.

## Requisitos

- Node.js 24 LTS ou mais novo (roda `.ts` direto, sem build)
- pnpm 11 (`corepack enable` ou `npm i -g pnpm`)
- Docker com Docker Compose

## Primeira execução

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

A API sobe em `http://localhost:3333`.

O `pnpm install` já roda o `prisma generate`, que gera o client em `src/generated/prisma`.

## Dia a dia

```bash
pnpm db:up
pnpm dev
```

## Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | Sobe a API e reinicia quando um arquivo muda |
| `pnpm start` | Sobe a API sem watch |
| `pnpm typecheck` | Checa os tipos com o TypeScript (sem gerar arquivos) |
| `pnpm db:up` | Sobe o PostgreSQL no Docker e espera ele ficar pronto |
| `pnpm db:migrate` | Cria e aplica migrations (`--name <nome>` para nomear) |
| `pnpm db:seed` | Insere 8 filmes se a tabela estiver vazia |
| `pnpm db:studio` | Abre o Prisma Studio para ver os dados |

Para parar o banco: `docker compose down`. Os dados ficam no volume `pgdata`.

## Variáveis de ambiente

| Variável | Exemplo | Uso |
|---|---|---|
| `PORT` | `3333` | Porta da API |
| `WEB_ORIGIN` | `http://localhost:5173` | Única origem liberada no CORS |
| `POSTGRES_USER` | `showtime` | Usuário do container |
| `POSTGRES_PASSWORD` | `showtime` | Senha do container |
| `POSTGRES_DB` | `showtime` | Banco do container |
| `DATABASE_URL` | `postgresql://showtime:showtime@localhost:5432/showtime?schema=public` | Conexão usada pelo Prisma |

## Rotas

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `200 {"ok":true}` |
| GET | `/movies?search=` | `200` com a lista; `search` filtra pelo título sem diferenciar maiúsculas |
| GET | `/movies/:id` | `200` ou `404` |
| POST | `/movies` | `201` com cabeçalho `Location`, ou `400` |
| PATCH | `/movies/:id` | `200` alterando só os campos enviados, `400` ou `404` |
| DELETE | `/movies/:id` | `204` ou `404` |

Corpo de um filme:

```json
{
  "title": "Maré Alta",
  "genre": "Drama",
  "year": 2026,
  "synopsis": "Opcional",
  "posterUrl": "https://exemplo.com/poster.jpg",
  "accent": "#0ea5e9"
}
```

Erros:

- `400 {"error":"Dados inválidos","fields":{...}}` quando a validação falha
- `400 {"error":"Requisição inválida"}` quando o JSON está malformado
- `404 {"error":"Não encontrado"}` quando o id é inválido ou não existe

## Testando com curl

```bash
curl http://localhost:3333/movies
curl "http://localhost:3333/movies?search=sertão"
curl -i -X POST http://localhost:3333/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Novo","genre":"Drama","year":2026}'
curl -X PATCH http://localhost:3333/movies/<id> \
  -H "Content-Type: application/json" \
  -d '{"year":2025}'
curl -i -X DELETE http://localhost:3333/movies/<id>
```

## Estrutura

```
api/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── prisma.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    ├── server.ts
    ├── prisma.ts
    └── movies.ts
```

## Problemas comuns

- **`DATABASE_URL não definida`**: falta o `.env`. Rode `cp .env.example .env`.
- **Erro de conexão com o banco**: o container não está de pé. Rode `pnpm db:up`.
- **Porta 5432 ocupada**: outro PostgreSQL está rodando na máquina. Pare esse outro ou mude a porta no `docker-compose.yml` e no `DATABASE_URL`.
- **Scripts de instalação bloqueados**: o `pnpm-workspace.yaml` libera só `prisma` e `@prisma/engines` em `allowBuilds`. Se outro pacote precisar, adicione ali.
- **Use só pnpm**: o `pnpm-workspace.yaml` da pasta torna a API uma raiz própria, separada do workspace em `~`. Não rode `npm install` aqui.
- **Não instale o Prisma sem versão**: `pnpm add prisma` instala a 8 (release candidate). Use `pnpm add -D prisma@7` e `pnpm add @prisma/client@7`.

## CI/CD

O workflow `.github/workflows/ci-cd.yml` roda no GitHub Actions:

- **CI** (push e pull request na `main`): sobe um PostgreSQL 18, instala as dependências, roda `pnpm typecheck`, aplica as migrations, roda o seed e faz um smoke test nas rotas (`/health` e o CRUD de `/movies`).
- **CD** (push na `main`, depois do CI passar): gera a imagem Docker e publica em `ghcr.io/dayvdallyson/showtime_api` com as tags `latest` e `sha-<commit>`.

Rodando a imagem:

```bash
docker run -p 3333:3333 \
  -e DATABASE_URL="postgresql://usuario:senha@host:5432/showtime?schema=public" \
  -e WEB_ORIGIN="https://seu-front.com" \
  ghcr.io/dayvdallyson/showtime_api:latest
```

O container aplica as migrations pendentes (`prisma migrate deploy`) antes de subir a API.
