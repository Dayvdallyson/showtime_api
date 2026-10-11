import request from "supertest"
import { describe, expect, it } from "vitest"

import { setupTestApp } from "../support/test-app.ts"

const ALLOWED_ORIGIN = "http://localhost:5173"
const RATE_LIMIT_MAX = 1

describe("GET /health", () => {
  it("responde 200 quando o banco está de pé", async () => {
    const { app } = setupTestApp()

    const response = await request(app).get("/health")

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: "ok", database: "up" })
  })

  it("responde 503 quando o banco não responde", async () => {
    const { app } = setupTestApp({ checkDatabase: async () => false })

    const response = await request(app).get("/health")

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: "error", database: "down" })
  })
})

describe("segurança", () => {
  const { app } = setupTestApp({ config: { WEB_ORIGIN: [ALLOWED_ORIGIN] } })

  it("envia cabeçalhos do helmet e esconde o x-powered-by", async () => {
    const response = await request(app).get("/health")

    expect(response.headers["x-content-type-options"]).toBe("nosniff")
    expect(response.headers["x-powered-by"]).toBeUndefined()
  })

  it("libera CORS só para a origem configurada", async () => {
    const allowed = await request(app).get("/health").set("Origin", ALLOWED_ORIGIN)
    const blocked = await request(app).get("/health").set("Origin", "https://outro.com")

    expect(allowed.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN)
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined()
  })

  it("devolve o request id recebido ou gera um", async () => {
    const forwarded = await request(app).get("/health").set("X-Request-Id", "abc-123")
    const generated = await request(app).get("/health")

    expect(forwarded.headers["x-request-id"]).toBe("abc-123")
    expect(generated.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe("rate limit", () => {
  const { app } = setupTestApp({ config: { RATE_LIMIT_MAX } })

  it("responde 429 depois do limite", async () => {
    await request(app).get("/movies")

    const response = await request(app).get("/movies")

    expect(response.status).toBe(429)
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS")
  })
})
