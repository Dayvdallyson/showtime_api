import { beforeEach, describe, expect, it } from "vitest"

import { MovieService } from "../../src/modules/movies/movie.service.ts"
import { NotFoundError } from "../../src/shared/errors/not-found-error.ts"
import { InMemoryMovieRepository } from "../support/in-memory-movie.repository.ts"

const validMovie = { title: "Maré Alta", genre: "Drama", year: 2026 }
const unknownId = "0199d1f2-0000-7000-8000-000000000000"

describe("MovieService", () => {
  let repository: InMemoryMovieRepository
  let service: MovieService

  beforeEach(() => {
    repository = new InMemoryMovieRepository()
    service = new MovieService(repository)
  })

  describe("list", () => {
    it("converte página e tamanho em deslocamento", async () => {
      await Promise.all(
        ["A", "B", "C", "D", "E"].map((title) => repository.create({ ...validMovie, title })),
      )

      const result = await service.list({ page: 2, pageSize: 2 })

      expect(result.movies.map((movie) => movie.title)).toEqual(["C", "D"])
      expect(result).toMatchObject({ page: 2, pageSize: 2, total: 5 })
    })

    it("ignora busca vazia ou só com espaços", async () => {
      await repository.create(validMovie)

      const result = await service.list({ search: "   ", page: 1, pageSize: 10 })

      expect(result.total).toBe(1)
    })

    it("filtra pela busca", async () => {
      await repository.create({ ...validMovie, title: "Sertão" })
      await repository.create({ ...validMovie, title: "Órbita" })

      const result = await service.list({ search: " sert ", page: 1, pageSize: 10 })

      expect(result.movies.map((movie) => movie.title)).toEqual(["Sertão"])
    })
  })

  describe("getById", () => {
    it("devolve o filme", async () => {
      const movie = await repository.create(validMovie)

      await expect(service.getById(movie.id)).resolves.toEqual(movie)
    })

    it("lança NotFoundError quando não existe", async () => {
      await expect(service.getById(unknownId)).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe("create", () => {
    it("salva e devolve o filme", async () => {
      const movie = await service.create(validMovie)

      expect(movie).toMatchObject(validMovie)
      expect(repository.movies).toHaveLength(1)
    })
  })

  describe("update", () => {
    it("altera só os campos enviados", async () => {
      const movie = await repository.create(validMovie)

      const updated = await service.update(movie.id, { year: 2025 })

      expect(updated).toMatchObject({ ...validMovie, year: 2025 })
    })

    it("lança NotFoundError quando não existe", async () => {
      await expect(service.update(unknownId, { year: 2025 })).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe("delete", () => {
    it("apaga o filme", async () => {
      const movie = await repository.create(validMovie)

      await service.delete(movie.id)

      expect(repository.movies).toHaveLength(0)
    })

    it("lança NotFoundError quando não existe", async () => {
      await expect(service.delete(unknownId)).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
