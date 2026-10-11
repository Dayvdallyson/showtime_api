import { z } from "zod"

const DEFAULT_PORT = 3333
const DEFAULT_WEB_ORIGIN = "http://localhost:5173"
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const DEFAULT_RATE_LIMIT_MAX = 100

const originList = z
  .string()
  .transform((value) => value.split(",").map((origin) => origin.trim()))
  .pipe(z.array(z.url()).min(1))

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(DEFAULT_PORT),
  WEB_ORIGIN: originList.default([DEFAULT_WEB_ORIGIN]),
  DATABASE_URL: z.url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(FIFTEEN_MINUTES_MS),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(DEFAULT_RATE_LIMIT_MAX),
  // Quantos proxies confiáveis ficam na frente da API (0 = acesso direto)
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
})

export type Env = z.infer<typeof envSchema>

// Falha na inicialização: melhor não subir do que subir com configuração errada
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`)
  }

  return result.data
}
