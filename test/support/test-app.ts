import { afterAll, beforeEach } from "vitest"

import { type AppDependencies, createApp } from "../../src/app.ts"
import { loadEnv } from "../../src/config/env.ts"
import { MovieController } from "../../src/modules/movies/movie.controller.ts"
import { MovieService } from "../../src/modules/movies/movie.service.ts"
import { PrismaMovieRepository } from "../../src/modules/movies/prisma-movie.repository.ts"
import { createDatabaseHealthCheck } from "../../src/shared/database/database-health.ts"
import { createPrismaClient } from "../../src/shared/database/prisma.ts"
import { createLogger } from "../../src/shared/logger.ts"

type TestAppOverrides = {
  config?: Partial<AppDependencies["config"]>
  checkDatabase?: AppDependencies["checkDatabase"]
}

export function setupTestApp(overrides: TestAppOverrides = {}) {
  const env = loadEnv()
  const prisma = createPrismaClient(env.DATABASE_URL)

  const app = createApp({
    config: { ...env, ...overrides.config },
    logger: createLogger(env),
    checkDatabase: overrides.checkDatabase ?? createDatabaseHealthCheck(prisma),
    movieController: new MovieController(new MovieService(new PrismaMovieRepository(prisma))),
  })

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE movies`
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  return { app, prisma }
}
