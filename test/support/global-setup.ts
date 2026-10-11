import { execFileSync } from "node:child_process"

export default function setup() {
  const databaseUrl = process.env.TEST_DATABASE_URL

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL não definida. Copie de .env.example para .env")
  }

  if (databaseUrl === process.env.DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL não pode ser igual a DATABASE_URL: os testes apagam os dados",
    )
  }

  execFileSync("node_modules/.bin/prisma", ["migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  })
}
