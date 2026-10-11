import request from "supertest"
import { describe, expect, it } from "vitest"

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../src/modules/movies/movie.schemas.ts"
import { setupTestApp } from "../support/test-app.ts"

const { app, prisma } = setupTestApp()

const validMovie = { title: "Maré Alta", genre: "Drama", year: 2026 }
const unknownId = "0199d1f2-0000-7000-8000-000000000000"

function createMovie(data: Partial<typeof validMovie> = {}) {
  return prisma.movie.create({ data: { ...validMovie, ...data } })
}

function createMoviesInOrder(titles: string[]) {
  const start = Date.now()

  return prisma.movie.createMany({
    data: titles.map((title, index) => ({
      ...validMovie,
      title,
      createdAt: new Date(start + index),
    })),
  })
}

describe("GET /movies", () => {
  it("lista os filmes em ordem de criação", async () => {
    await createMoviesInOrder(["Primeiro", "Segundo"])

    const response = await request(app).get("/movies")

    expect(response.status).toBe(200)
    expect(response.body.data.map((movie: { title: string }) => movie.title)).toEqual([
      "Primeiro",
      "Segundo",
    ])
    expect(response.body.meta).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 2 })
  })

  it("pagina o resultado", async () => {
    await createMoviesInOrder(["A", "B", "C"])

    const response = await request(app).get("/movies").query({ page: 2, pageSize: 2 })

    expect(response.body.data.map((movie: { title: string }) => movie.title)).toEqual(["C"])
    expect(response.body.meta).toEqual({ page: 2, pageSize: 2, total: 3 })
  })

  it("desempata pelo id filmes criados no mesmo instante", async () => {
    const { genre, year } = validMovie
    const createdAt = new Date()
    const ids = ["03", "02", "01"].map((suffix) => `0199d1f2-0000-7000-8000-0000000000${suffix}`)
    await prisma.movie.createMany({
      data: ids.map((id) => ({ id, title: id, genre, year, createdAt })),
    })

    const response = await request(app).get("/movies")

    expect(response.body.data.map((movie: { id: string }) => movie.id)).toEqual(ids.toReversed())
  })

  it("responde 400 quando pageSize passa do máximo", async () => {
    const response = await request(app)
      .get("/movies")
      .query({ pageSize: MAX_PAGE_SIZE + 1 })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
    expect(response.body.error.details).toHaveProperty("pageSize")
  })

  it("filtra pelo título sem diferenciar maiúsculas", async () => {
    await createMovie({ title: "Sertão" })
    await createMovie({ title: "Órbita" })

    const response = await request(app).get("/movies").query({ search: "SERT" })

    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].title).toBe("Sertão")
    expect(response.body.meta.total).toBe(1)
  })
})

describe("GET /movies/:id", () => {
  it("devolve o filme", async () => {
    const movie = await createMovie()

    const response = await request(app).get(`/movies/${movie.id}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: movie.id,
      ...validMovie,
      synopsis: null,
      posterUrl: null,
      accent: null,
      createdAt: movie.createdAt.toISOString(),
      updatedAt: movie.updatedAt.toISOString(),
    })
  })

  it("responde 404 para id inexistente", async () => {
    const response = await request(app).get(`/movies/${unknownId}`)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Filme não encontrado" },
    })
  })

  it("responde 404 para id que não é UUID", async () => {
    const response = await request(app).get("/movies/abc")

    expect(response.status).toBe(404)
  })
})

describe("POST /movies", () => {
  it("cria o filme e devolve 201 com Location", async () => {
    const response = await request(app).post("/movies").send(validMovie)

    expect(response.status).toBe(201)
    expect(response.headers.location).toBe(`/movies/${response.body.id}`)
    expect(response.body).toMatchObject(validMovie)
    expect(await prisma.movie.count()).toBe(1)
  })

  it("responde 400 quando os dados são inválidos", async () => {
    const response = await request(app).post("/movies").send({ title: "", year: 1500 })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
    })
    expect(Object.keys(response.body.error.details).toSorted()).toEqual(["genre", "title", "year"])
  })

  it("responde 400 quando o JSON está malformado", async () => {
    const response = await request(app)
      .post("/movies")
      .set("Content-Type", "application/json")
      .send('{"title":')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: { code: "BAD_REQUEST", message: "Requisição inválida" },
    })
  })

  it("responde 413 quando o corpo passa do limite", async () => {
    const response = await request(app)
      .post("/movies")
      .send({ ...validMovie, synopsis: "x".repeat(200_000) })

    expect(response.status).toBe(413)
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE")
  })
})

describe("PATCH /movies/:id", () => {
  it("altera só os campos enviados", async () => {
    const movie = await createMovie()

    const response = await request(app).patch(`/movies/${movie.id}`).send({ year: 2025 })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ ...validMovie, year: 2025 })
  })

  it("responde 400 quando os dados são inválidos", async () => {
    const movie = await createMovie()

    const response = await request(app).patch(`/movies/${movie.id}`).send({ accent: "azul" })

    expect(response.status).toBe(400)
  })

  it("responde 404 para id inexistente", async () => {
    const response = await request(app).patch(`/movies/${unknownId}`).send({ year: 2025 })

    expect(response.status).toBe(404)
  })
})

describe("DELETE /movies/:id", () => {
  it("apaga o filme e responde 204", async () => {
    const movie = await createMovie()

    const response = await request(app).delete(`/movies/${movie.id}`)

    expect(response.status).toBe(204)
    expect(await prisma.movie.count()).toBe(0)
  })

  it("responde 404 para id inexistente", async () => {
    const response = await request(app).delete(`/movies/${unknownId}`)

    expect(response.status).toBe(404)
  })
})

describe("rota desconhecida", () => {
  it("responde 404", async () => {
    const response = await request(app).get("/nao-existe")

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Rota não encontrada" },
    })
  })
})
