FROM node:24-slim

ENV CI=true
WORKDIR /app

RUN corepack enable && apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3333
EXPOSE 3333

USER node
# exec: o Node vira o PID 1 e recebe o SIGTERM para o desligamento gracioso
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node src/main.ts"]
