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

A API sobe em `http://localhost:3333` e a documentação interativa em `http://localhost:3333/docs`.

O `pnpm install` já roda o `prisma generate`, que gera o client em `src/generated/prisma`.

## Dia a dia

```bash
pnpm db:up
pnpm dev
```

## Scripts

| Script                  | O que faz                                              |
| ----------------------- | ------------------------------------------------------ |
| `pnpm dev`              | Sobe a API e reinicia quando um arquivo muda           |
| `pnpm start`            | Sobe a API sem watch                                   |
| `pnpm typecheck`        | Checa os tipos com o TypeScript (sem gerar arquivos)   |
| `pnpm lint`             | Roda o oxlint, incluindo as regras que usam tipos      |
| `pnpm format`           | Formata o código com o Prettier                        |
| `pnpm format:check`     | Só confere a formatação (usado no CI)                  |
| `pnpm test`             | Roda todos os testes (unitários e integração)          |
| `pnpm test:unit`        | Só os testes unitários (não precisam de banco)         |
| `pnpm test:integration` | Só os testes de integração (precisam do banco de pé)   |
| `pnpm test:watch`       | Testes em modo watch                                   |
| `pnpm db:up`            | Sobe o PostgreSQL no Docker e espera ele ficar pronto  |
| `pnpm db:migrate`       | Cria e aplica migrations (`--name <nome>` para nomear) |
| `pnpm db:seed`          | Insere 8 filmes se a tabela estiver vazia              |
| `pnpm db:studio`        | Abre o Prisma Studio para ver os dados                 |

Para parar o banco: `docker compose down`. Os dados ficam no volume `pgdata`.

## Variáveis de ambiente

Todas são validadas com Zod em `src/config/env.ts`. Se alguma estiver faltando ou inválida, a API não sobe e diz qual é.

| Variável               | Padrão                  | Uso                                                            |
| ---------------------- | ----------------------- | -------------------------------------------------------------- |
| `NODE_ENV`             | `development`           | `development`, `test` ou `production`                          |
| `PORT`                 | `3333`                  | Porta da API                                                   |
| `WEB_ORIGIN`           | `http://localhost:5173` | Origens liberadas no CORS, separadas por vírgula               |
| `LOG_LEVEL`            | `info`                  | Nível do log (`fatal` … `trace`, ou `silent`)                  |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min)       | Janela do rate limit                                           |
| `RATE_LIMIT_MAX`       | `100`                   | Requisições por IP dentro da janela                            |
| `TRUST_PROXY`          | `0`                     | Proxies confiáveis na frente da API (ex.: `1` atrás do Render) |
| `DATABASE_URL`         | obrigatória             | Conexão usada pelo Prisma                                      |
| `TEST_DATABASE_URL`    | só para testes          | Database separada usada pelos testes de integração             |
| `POSTGRES_USER`        | `showtime`              | Usuário do container (só o `docker-compose.yml` usa)           |
| `POSTGRES_PASSWORD`    | `showtime`              | Senha do container (só o `docker-compose.yml` usa)             |
| `POSTGRES_DB`          | `showtime`              | Banco do container (só o `docker-compose.yml` usa)             |

## Arquitetura

Módulos por feature, cada um dividido em camadas. Cada camada tem um motivo para mudar:

```
src/
├── main.ts              composition root: lê o env, monta as dependências, sobe e desliga o servidor
├── app.ts               createApp(): middlewares, rotas, 404 e error handler (os testes usam sem abrir porta)
├── config/env.ts        variáveis de ambiente validadas
├── docs/openapi.ts      documento OpenAPI e Swagger UI em /docs
├── shared/
│   ├── errors/          AppError, NotFoundError, ValidationError (não conhecem HTTP)
│   ├── http/            validate(), error handler, 404, health, rate limit, log de requisições
│   ├── database/        criação do PrismaClient e health check do banco
│   └── logger.ts        logger estruturado (pino)
└── modules/movies/
    ├── movie.schemas.ts            schemas Zod de entrada e resposta, e os tipos derivados
    ├── movie.repository.ts         porta: interface do repositório, sem tipos do Prisma
    ├── prisma-movie.repository.ts  adaptador: implementação com Prisma
    ├── movie.service.ts            regras de negócio
    ├── movie.controller.ts         só HTTP
    ├── movie.routes.ts             liga rota → validação → controller
    ├── movie.mapper.ts             modelo do banco → JSON da API
    └── movie.openapi.ts            documentação das rotas
```

Por que cada peça existe:

- **Repositório como interface (porta) + adaptador Prisma**: o service depende só da interface, injetada pelo construtor. Assim ele é testado com um repositório em memória, sem banco. O adaptador também traduz o erro `P2025` do Prisma ("registro não existe") em `null`, e o Prisma não vaza para fora dele.
- **Service**: concentra as regras (paginação, busca vazia ignorada, `NotFoundError` quando o filme não existe). Não importa Express nem Prisma. É uma classe só, sem um use case por ação: para um CRUD, separar mais seria cerimônia.
- **Controller fino**: lê a entrada que o `validate()` já validou, chama o service e escolhe o status. Não tem try/catch: o Express 5 repassa os erros de handlers async para o error handler.
- **Erros por categoria**: cada erro de domínio declara uma categoria (`not_found`, `validation`). A tabela categoria → status fica no error handler, então um erro novo de uma categoria existente não exige mexer nele.
- **Mapper**: a API não expõe o modelo do banco. Uma coluna nova no banco não aparece na resposta sem querer.
- **Schemas Zod como fonte única**: validam a entrada, geram os tipos do TypeScript e geram o OpenAPI (com `zod-openapi`).

## Rotas

Documentação completa e interativa em `/docs`. O JSON do OpenAPI fica em `/docs/openapi.json`.

| Método | Rota          | Resposta                                               |
| ------ | ------------- | ------------------------------------------------------ |
| GET    | `/health`     | `200` com o banco de pé, `503` se o banco não responde |
| GET    | `/movies`     | `200` com a página de filmes, ou `400`                 |
| GET    | `/movies/:id` | `200` ou `404`                                         |
| POST   | `/movies`     | `201` com cabeçalho `Location`, ou `400`               |
| PATCH  | `/movies/:id` | `200` alterando só os campos enviados, `400` ou `404`  |
| DELETE | `/movies/:id` | `204` ou `404`                                         |

Query de `GET /movies`:

| Parâmetro  | Padrão | Uso                                           |
| ---------- | ------ | --------------------------------------------- |
| `search`   |        | Filtra pelo título sem diferenciar maiúsculas |
| `page`     | `1`    | Página, começando em 1                        |
| `pageSize` | `20`   | Itens por página, no máximo `100`             |

Resposta da listagem:

```json
{
  "data": [{ "id": "…", "title": "Maré Alta", "…": "…" }],
  "meta": { "page": 1, "pageSize": 20, "total": 8 }
}
```

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

Todo erro tem o mesmo formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": { "year": ["…"] }
  }
}
```

| Status | `code`              | Quando                                                  |
| ------ | ------------------- | ------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`  | Corpo ou query inválidos; `details` traz os campos      |
| 400    | `BAD_REQUEST`       | JSON malformado                                         |
| 404    | `NOT_FOUND`         | Filme não existe, id não é UUID ou rota desconhecida    |
| 413    | `PAYLOAD_TOO_LARGE` | Corpo maior que 100kb                                   |
| 429    | `TOO_MANY_REQUESTS` | Passou do rate limit                                    |
| 500    | `INTERNAL_ERROR`    | Erro inesperado (detalhes só no log, nunca na resposta) |

Toda resposta traz o cabeçalho `X-Request-Id`. Se a requisição já chegar com ele, o valor é reaproveitado. O mesmo id aparece nos logs.

## Testes

```bash
pnpm db:up
pnpm test
```

- **Unitários** (`test/unit`): testam o `MovieService` com um repositório em memória (`test/support/in-memory-movie.repository.ts`). Não precisam de banco.
- **Integração** (`test/integration`): testam as rotas com Supertest contra a database `showtime_test`, no mesmo container do compose. O setup cria essa database se ela não existir, aplica as migrations e limpa a tabela antes de cada teste. A database `showtime` de desenvolvimento nunca é tocada. Se `TEST_DATABASE_URL` for igual a `DATABASE_URL`, o setup se recusa a rodar.

## Testando com curl

```bash
curl http://localhost:3333/health
curl "http://localhost:3333/movies?search=sertão&page=1&pageSize=5"
curl -i -X POST http://localhost:3333/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Novo","genre":"Drama","year":2026}'
curl -X PATCH http://localhost:3333/movies/<id> \
  -H "Content-Type: application/json" \
  -d '{"year":2025}'
curl -i -X DELETE http://localhost:3333/movies/<id>
```

## Problemas comuns

- **`Variáveis de ambiente inválidas`**: falta o `.env` ou alguma variável. Rode `cp .env.example .env`. A mensagem diz qual campo falhou.
- **Erro de conexão com o banco**: o container não está de pé. Rode `pnpm db:up`.
- **Porta 5432 ocupada**: outro PostgreSQL está rodando na máquina. Pare esse outro ou mude a porta no `docker-compose.yml`, no `DATABASE_URL` e no `TEST_DATABASE_URL`.
- **Scripts de instalação bloqueados**: o `pnpm-workspace.yaml` libera só `prisma` e `@prisma/engines` em `allowBuilds` (e bloqueia a telemetria `@scarf/scarf` do Swagger UI). Se outro pacote precisar, adicione ali.
- **Use só pnpm**: o `pnpm-workspace.yaml` da pasta torna a API uma raiz própria, separada do workspace em `~`. Não rode `npm install` aqui.
- **Não instale o Prisma sem versão**: `pnpm add prisma` instala a 8 (release candidate). Use `pnpm add -D prisma@7` e `pnpm add @prisma/client@7`.

## CI/CD

O workflow `.github/workflows/ci-cd.yml` roda no GitHub Actions:

- **CI** (push e pull request na `main`): sobe um PostgreSQL 18 e roda typecheck, lint, checagem de formatação e a suíte completa de testes. Depois aplica as migrations, roda o seed e faz um smoke test na API de pé.
- **CD** (push na `main`, depois do CI passar): gera a imagem Docker e publica em `ghcr.io/dayvdallyson/showtime_api` com as tags `latest` e `sha-<commit>`.

Rodando a imagem:

```bash
docker run -p 3333:3333 \
  -e DATABASE_URL="postgresql://usuario:senha@host:5432/showtime?schema=public" \
  -e WEB_ORIGIN="https://seu-front.com" \
  ghcr.io/dayvdallyson/showtime_api:latest
```

O container aplica as migrations pendentes (`prisma migrate deploy`) antes de subir a API. No `SIGTERM` (ex.: um deploy novo), ele para de aceitar conexões, fecha a conexão com o banco e sai.
