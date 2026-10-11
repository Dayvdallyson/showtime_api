import type { Movie } from "./movie.repository.ts"
import type { MovieResponse } from "./movie.schemas.ts"

export function toMovieResponse(movie: Movie): MovieResponse {
  return {
    id: movie.id,
    title: movie.title,
    genre: movie.genre,
    year: movie.year,
    synopsis: movie.synopsis,
    posterUrl: movie.posterUrl,
    accent: movie.accent,
    createdAt: movie.createdAt.toISOString(),
    updatedAt: movie.updatedAt.toISOString(),
  }
}
