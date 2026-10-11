import request from "supertest"
import { describe, expect, it } from "vitest"

import { setupTestApp } from "../support/test-app.ts"

const { app } = setupTestApp()

describe("documentação", () => {
  it("serve o OpenAPI gerado a partir dos schemas", async () => {
    const response = await request(app).get("/docs/openapi.json")

    expect(response.status).toBe(200)
    expect(response.body.openapi).toBe("3.1.0")
    expect(Object.keys(response.body.paths)).toEqual(["/health", "/movies", "/movies/{id}"])
    expect(response.body.components.schemas).toHaveProperty("Movie")
  })

  it("serve o Swagger UI em /docs", async () => {
    const response = await request(app).get("/docs/")

    expect(response.status).toBe(200)
    expect(response.headers["content-type"]).toContain("text/html")
  })
})
