import type { RequestHandler } from "express"

import type { DatabaseHealthCheck } from "../database/database-health.ts"

const SERVICE_UNAVAILABLE = 503

export function createHealthHandler(checkDatabase: DatabaseHealthCheck): RequestHandler {
  return async (_req, res) => {
    const databaseUp = await checkDatabase()

    if (!databaseUp) {
      res.status(SERVICE_UNAVAILABLE).json({ status: "error", database: "down" })
      return
    }

    res.json({ status: "ok", database: "up" })
  }
}
