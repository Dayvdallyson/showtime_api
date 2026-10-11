import { existsSync } from "node:fs"

import { defineConfig } from "vitest/config"

if (existsSync(".env")) process.loadEnvFile(".env")

const testDatabaseUrl = process.env.TEST_DATABASE_URL

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["test/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["test/support/global-setup.ts"],
          // Os arquivos compartilham o mesmo banco, então rodam um de cada vez
          fileParallelism: false,
          env: {
            NODE_ENV: "test",
            LOG_LEVEL: "silent",
            // Alto o bastante para a suíte não esbarrar no limite; o 429 tem teste próprio
            RATE_LIMIT_MAX: "10000",
            ...(testDatabaseUrl && { DATABASE_URL: testDatabaseUrl }),
          },
        },
      },
    ],
  },
})
