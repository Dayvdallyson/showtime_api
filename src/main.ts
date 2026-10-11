import { createApp } from "./app.ts"
import { loadEnv } from "./config/env.ts"
import { MovieController } from "./modules/movies/movie.controller.ts"
import { MovieService } from "./modules/movies/movie.service.ts"
import { PrismaMovieRepository } from "./modules/movies/prisma-movie.repository.ts"
import { createDatabaseHealthCheck } from "./shared/database/database-health.ts"
import { createPrismaClient } from "./shared/database/prisma.ts"
import { createLogger } from "./shared/logger.ts"

const SHUTDOWN_TIMEOUT_MS = 10_000

const env = loadEnv()
const logger = createLogger(env)
const prisma = createPrismaClient(env.DATABASE_URL)
const movieController = new MovieController(new MovieService(new PrismaMovieRepository(prisma)))

const app = createApp({
  config: env,
  logger,
  checkDatabase: createDatabaseHealthCheck(prisma),
  movieController,
})

const server = app.listen(env.PORT, (error) => {
  if (error) throw error
  logger.info(`API rodando em http://localhost:${env.PORT}`)
})

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, "Encerrando a API")

  // Se algo travar, não deixa o processo pendurado para sempre
  setTimeout(() => {
    logger.error("Desligamento demorou demais, forçando a saída")
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS).unref()

  server.close()
  await prisma.$disconnect()
  logger.info("API encerrada")
}

process.once("SIGINT", (signal) => void shutdown(signal))
process.once("SIGTERM", (signal) => void shutdown(signal))
