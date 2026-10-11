import type { ZodOpenApiPathsObject, ZodOpenApiResponsesObject } from "zod-openapi"

import { errorResponseSchema } from "../../shared/http/error-response.ts"
import {
  createMovieSchema,
  listMoviesQuerySchema,
  movieIdParamsSchema,
  movieListResponseSchema,
  movieResponseSchema,
  updateMovieSchema,
} from "./movie.schemas.ts"

const TAG = "Filmes"

function errorResponse(description: string) {
  return { description, content: { "application/json": { schema: errorResponseSchema } } }
}

function movieResponse(description: string) {
  return { description, content: { "application/json": { schema: movieResponseSchema } } }
}

const notFound: ZodOpenApiResponsesObject = { "404": errorResponse("Filme não encontrado") }
const invalidData: ZodOpenApiResponsesObject = { "400": errorResponse("Dados inválidos") }
const rateLimited: ZodOpenApiResponsesObject = {
  "429": errorResponse("Limite de requisições atingido"),
}

export const moviePaths: ZodOpenApiPathsObject = {
  "/movies": {
    get: {
      tags: [TAG],
      summary: "Lista filmes com busca e paginação",
      requestParams: { query: listMoviesQuerySchema },
      responses: {
        "200": {
          description: "Página de filmes",
          content: { "application/json": { schema: movieListResponseSchema } },
        },
        ...invalidData,
        ...rateLimited,
      },
    },
    post: {
      tags: [TAG],
      summary: "Cria um filme",
      requestBody: { content: { "application/json": { schema: createMovieSchema } } },
      responses: {
        "201": {
          ...movieResponse("Filme criado"),
          headers: { Location: { description: "URL do filme criado", schema: { type: "string" } } },
        },
        ...invalidData,
        ...rateLimited,
      },
    },
  },
  "/movies/{id}": {
    get: {
      tags: [TAG],
      summary: "Busca um filme pelo id",
      requestParams: { path: movieIdParamsSchema },
      responses: { "200": movieResponse("Filme encontrado"), ...notFound, ...rateLimited },
    },
    patch: {
      tags: [TAG],
      summary: "Altera os campos enviados de um filme",
      requestParams: { path: movieIdParamsSchema },
      requestBody: { content: { "application/json": { schema: updateMovieSchema } } },
      responses: {
        "200": movieResponse("Filme alterado"),
        ...invalidData,
        ...notFound,
        ...rateLimited,
      },
    },
    delete: {
      tags: [TAG],
      summary: "Apaga um filme",
      requestParams: { path: movieIdParamsSchema },
      responses: { "204": { description: "Filme apagado" }, ...notFound, ...rateLimited },
    },
  },
}
