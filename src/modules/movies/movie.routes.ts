import { Router } from "express"

import { validate } from "../../shared/http/validate.middleware.ts"
import type { MovieController } from "./movie.controller.ts"
import {
  createMovieSchema,
  listMoviesQuerySchema,
  movieIdParamsSchema,
  updateMovieSchema,
} from "./movie.schemas.ts"

export function createMovieRoutes(controller: MovieController): Router {
  const router = Router()

  router.get("/", validate({ query: listMoviesQuerySchema }), controller.list)
  router.post("/", validate({ body: createMovieSchema }), controller.create)
  router.get("/:id", validate({ params: movieIdParamsSchema }), controller.getById)
  router.patch(
    "/:id",
    validate({ params: movieIdParamsSchema, body: updateMovieSchema }),
    controller.update,
  )
  router.delete("/:id", validate({ params: movieIdParamsSchema }), controller.delete)

  return router
}
