import { loadEnv } from "../src/config/env.ts"
import { createPrismaClient } from "../src/shared/database/prisma.ts"
import { createLogger } from "../src/shared/logger.ts"

const env = loadEnv()
const logger = createLogger(env)
const prisma = createPrismaClient(env.DATABASE_URL)

const total = await prisma.movie.count()

if (total > 0) {
  logger.info(`Banco já tem ${total} filmes, nada a fazer.`)
} else {
  const { count } = await prisma.movie.createMany({
    data: [
      { title: "Maré Alta", genre: "Drama", year: 2026, accent: "#0ea5e9" },
      { title: "Neon Cidade", genre: "Sci-fi", year: 2025, accent: "#d946ef" },
      { title: "Última Sessão", genre: "Suspense", year: 2026, accent: "#f43f5e" },
      { title: "Sertão", genre: "Western", year: 2024, accent: "#f59e0b" },
      { title: "Floresta Viva", genre: "Documentário", year: 2026, accent: "#22c55e" },
      { title: "Órbita", genre: "Aventura", year: 2025, accent: "#8b5cf6" },
      { title: "Café às 6", genre: "Comédia", year: 2026, accent: "#f97316" },
      { title: "Inverno", genre: "Romance", year: 2024, accent: "#14b8a6" },
    ],
  })
  logger.info(`${count} filmes inseridos.`)
}

await prisma.$disconnect()
