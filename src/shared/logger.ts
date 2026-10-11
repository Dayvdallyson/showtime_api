import { pino, type Logger } from "pino"

import type { Env } from "../config/env.ts"

export type { Logger }

export function createLogger({ NODE_ENV, LOG_LEVEL }: Pick<Env, "NODE_ENV" | "LOG_LEVEL">): Logger {
  return pino({
    level: LOG_LEVEL,
    redact: ["req.headers.authorization", "req.headers.cookie"],
    transport: NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
  })
}
