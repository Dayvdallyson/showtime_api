import { randomUUID } from "node:crypto"

import type {
  Movie,
  MovieChanges,
  MovieListFilter,
  MovieListResult,
  MovieRepository,
  NewMovie,
} from "../../src/modules/movies/movie.repository.ts"

// Implementação da porta só para testes: mesmo contrato, sem banco
export class InMemoryMovieRepository implements MovieRepository {
  readonly movies: Movie[] = []

  async list({ search, skip, take }: MovieListFilter): Promise<MovieListResult> {
    const term = search?.toLowerCase()
    const matching = term
      ? this.movies.filter((movie) => movie.title.toLowerCase().includes(term))
      : this.movies

    return { movies: matching.slice(skip, skip + take), total: matching.length }
  }

  async findById(id: string): Promise<Movie | null> {
    return this.movies.find((movie) => movie.id === id) ?? null
  }

  async create(data: NewMovie): Promise<Movie> {
    const now = new Date()
    const movie: Movie = {
      id: randomUUID(),
      synopsis: null,
      posterUrl: null,
      accent: null,
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    this.movies.push(movie)

    return movie
  }

  async update(id: string, changes: MovieChanges): Promise<Movie | null> {
    const movie = await this.findById(id)
    if (!movie) return null

    Object.assign(movie, changes, { updatedAt: new Date() })

    return movie
  }

  async delete(id: string): Promise<boolean> {
    const index = this.movies.findIndex((movie) => movie.id === id)
    if (index === -1) return false

    this.movies.splice(index, 1)

    return true
  }
}
