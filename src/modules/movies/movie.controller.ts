import type { Request, Response } from "express"

import { toMovieResponse } from "./movie.mapper.ts"
import type {
  CreateMovieInput,
  ListMoviesQuery,
  MovieIdParams,
  UpdateMovieInput,
} from "./movie.schemas.ts"
import type { MovieService } from "./movie.service.ts"

// Os tipos de Request batem com os schemas aplicados pelo validate() em movie.routes.ts
type ListRequest = Request<unknown, unknown, unknown, ListMoviesQuery>
type IdRequest = Request<MovieIdParams>
type CreateRequest = Request<unknown, unknown, CreateMovieInput>
type UpdateRequest = Request<MovieIdParams, unknown, UpdateMovieInput>

// Só HTTP: lê a entrada já validada, chama o service e escolhe o status
export class MovieController {
  private readonly service: MovieService

  constructor(service: MovieService) {
    this.service = service
  }

  list = async (req: ListRequest, res: Response) => {
    const { movies, page, pageSize, total } = await this.service.list(req.query)

    res.json({ data: movies.map(toMovieResponse), meta: { page, pageSize, total } })
  }

  getById = async (req: IdRequest, res: Response) => {
    const movie = await this.service.getById(req.params.id)

    res.json(toMovieResponse(movie))
  }

  create = async (req: CreateRequest, res: Response) => {
    const movie = await this.service.create(req.body)

    res.status(201).location(`/movies/${movie.id}`).json(toMovieResponse(movie))
  }

  update = async (req: UpdateRequest, res: Response) => {
    const movie = await this.service.update(req.params.id, req.body)

    res.json(toMovieResponse(movie))
  }

  delete = async (req: IdRequest, res: Response) => {
    await this.service.delete(req.params.id)

    res.status(204).end()
  }
}
