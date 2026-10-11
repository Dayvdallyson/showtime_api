import { Router } from "express"
import swaggerUi from "swagger-ui-express"
import { createDocument } from "zod-openapi"

import { moviePaths } from "../modules/movies/movie.openapi.ts"

const OPENAPI_VERSION = "3.1.0"

export function createOpenApiDocument() {
  return createDocument({
    openapi: OPENAPI_VERSION,
    info: {
      title: "Showtime API",
      version: "1.0.0",
      description: "CRUD de filmes do app Showtime",
    },
    paths: {
      "/health": {
        get: {
          tags: ["Operação"],
          summary: "Verifica a API e a conexão com o banco",
          responses: {
            "200": { description: "API e banco de pé" },
            "503": { description: "Banco fora do ar" },
          },
        },
      },
      ...moviePaths,
    },
  })
}

export function createDocsRouter(): Router {
  const document = createOpenApiDocument()
  const router = Router()

  router.get("/openapi.json", (_req, res) => {
    res.json(document)
  })
  router.use("/", swaggerUi.serve, swaggerUi.setup(document))

  return router
}
