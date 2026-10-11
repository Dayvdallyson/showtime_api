import cors from "cors"
import express from "express"
import helmet from "helmet"

import type { Env } from "./config/env.ts"
import { createDocsRouter } from "./docs/openapi.ts"
import type { MovieController } from "./modules/movies/movie.controller.ts"
import { createMovieRoutes } from "./modules/movies/movie.routes.ts"
import type { DatabaseHealthCheck } from "./shared/database/database-health.ts"
import { errorHandler } from "./shared/http/error-handler.middleware.ts"
import { createHealthHandler } from "./shared/http/health.handler.ts"
import { notFoundHandler } from "./shared/http/not-found.middleware.ts"
import { createRateLimiter } from "./shared/http/rate-limit.middleware.ts"
import { createRequestLogger } from "./shared/http/request-logger.middleware.ts"
import type { Logger } from "./shared/logger.ts"

const JSON_BODY_LIMIT = "100kb"

export type AppConfig = Pick<
  Env,
  "WEB_ORIGIN" | "RATE_LIMIT_WINDOW_MS" | "RATE_LIMIT_MAX" | "TRUST_PROXY"
>

export type AppDependencies = {
  config: AppConfig
  logger: Logger
  checkDatabase: DatabaseHealthCheck
  movieController: MovieController
}

export function createApp({ config, logger, checkDatabase, movieController }: AppDependencies) {
  const app = express()

  app.set("trust proxy", config.TRUST_PROXY)
  app.disable("x-powered-by")

  app.use(createRequestLogger(logger))
  app.use(helmet())
  app.use(cors({ origin: config.WEB_ORIGIN }))

  // Antes do rate limit: monitoramento consulta o health check o tempo todo
  app.get("/health", createHealthHandler(checkDatabase))

  app.use(
    createRateLimiter({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_MAX }),
  )
  app.use(express.json({ limit: JSON_BODY_LIMIT }))

  app.use("/docs", createDocsRouter())
  app.use("/movies", createMovieRoutes(movieController))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
