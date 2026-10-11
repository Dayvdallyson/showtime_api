export type Movie = {
  id: string
  title: string
  genre: string
  year: number
  synopsis: string | null
  posterUrl: string | null
  accent: string | null
  createdAt: Date
  updatedAt: Date
}

export type NewMovie = {
  title: string
  genre: string
  year: number
  synopsis?: string | null
  posterUrl?: string | null
  accent?: string | null
}

export type MovieChanges = Partial<NewMovie>

export type MovieListFilter = {
  search?: string
  skip: number
  take: number
}

export type MovieListResult = {
  movies: Movie[]
  total: number
}

// Porta: o service só conhece este contrato, nunca o Prisma
export interface MovieRepository {
  list(filter: MovieListFilter): Promise<MovieListResult>
  findById(id: string): Promise<Movie | null>
  create(data: NewMovie): Promise<Movie>
  update(id: string, changes: MovieChanges): Promise<Movie | null>
  delete(id: string): Promise<boolean>
}
