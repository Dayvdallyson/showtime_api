import { NotFoundError } from "../../shared/errors/not-found-error.ts"
import type { Movie, MovieChanges, MovieRepository, NewMovie } from "./movie.repository.ts"

export type MovieListOptions = {
  search?: string
  page: number
  pageSize: number
}

export type MoviePage = {
  movies: Movie[]
  page: number
  pageSize: number
  total: number
}

const MOVIE_NOT_FOUND = "Filme não encontrado"

export class MovieService {
  private readonly repository: MovieRepository

  constructor(repository: MovieRepository) {
    this.repository = repository
  }

  async list({ search, page, pageSize }: MovieListOptions): Promise<MoviePage> {
    const { movies, total } = await this.repository.list({
      search: search?.trim() || undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return { movies, page, pageSize, total }
  }

  async getById(id: string): Promise<Movie> {
    const movie = await this.repository.findById(id)

    if (!movie) throw new NotFoundError(MOVIE_NOT_FOUND)

    return movie
  }

  create(data: NewMovie): Promise<Movie> {
    return this.repository.create(data)
  }

  async update(id: string, changes: MovieChanges): Promise<Movie> {
    const movie = await this.repository.update(id, changes)

    if (!movie) throw new NotFoundError(MOVIE_NOT_FOUND)

    return movie
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id)

    if (!deleted) throw new NotFoundError(MOVIE_NOT_FOUND)
  }
}
