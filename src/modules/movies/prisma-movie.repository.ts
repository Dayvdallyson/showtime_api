import { Prisma } from "../../generated/prisma/client.ts"
import type { PrismaClient } from "../../shared/database/prisma.ts"
import type {
  Movie,
  MovieChanges,
  MovieListFilter,
  MovieListResult,
  MovieRepository,
  NewMovie,
} from "./movie.repository.ts"

const RECORD_NOT_FOUND = "P2025"

const LIST_ORDER = [{ createdAt: "asc" }, { id: "asc" }] as const

export class PrismaMovieRepository implements MovieRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async list({ search, skip, take }: MovieListFilter): Promise<MovieListResult> {
    const where = search ? { title: { contains: search, mode: "insensitive" as const } } : {}

    const [movies, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({ where, orderBy: [...LIST_ORDER], skip, take }),
      this.prisma.movie.count({ where }),
    ])

    return { movies, total }
  }

  findById(id: string): Promise<Movie | null> {
    return this.prisma.movie.findUnique({ where: { id } })
  }

  create(data: NewMovie): Promise<Movie> {
    return this.prisma.movie.create({ data })
  }

  async update(id: string, changes: MovieChanges): Promise<Movie | null> {
    try {
      return await this.prisma.movie.update({ where: { id }, data: changes })
    } catch (error) {
      if (isRecordNotFound(error)) return null
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.movie.delete({ where: { id } })
      return true
    } catch (error) {
      if (isRecordNotFound(error)) return false
      throw error
    }
  }
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND
}
