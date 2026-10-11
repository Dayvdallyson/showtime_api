import { Router } from "express"
import { z } from "zod"

import { prisma } from "./prisma.ts"

z.config(z.locales.pt())

const movieInput = z.object({
  title: z.string().trim().min(1).max(200),
  genre: z.string().trim().min(1).max(50),
  year: z.int().min(1888).max(2100),
  synopsis: z.string().trim().max(2000).nullish(),
  posterUrl: z.url({ protocol: /^https?$/ }).nullish(),
  accent: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Use uma cor hex, ex.: #0ea5e9")
    .nullish(),
})

const movieUpdate = movieInput.partial()

export const moviesRouter = Router()

moviesRouter.param("id", (req, res, next, id) => {
  if (!z.uuid().safeParse(id).success) {
    res.status(404).json({ error: "Não encontrado" })
    return
  }
  next()
})

moviesRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : ""

  const movies = await prisma.movie.findMany({
    where: search ? { title: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "asc" },
  })

  res.json(movies)
})

moviesRouter.get("/:id", async (req, res) => {
  const movie = await prisma.movie.findUnique({ where: { id: req.params.id } })

  if (!movie) {
    res.status(404).json({ error: "Não encontrado" })
    return
  }

  res.json(movie)
})

moviesRouter.post("/", async (req, res) => {
  const parsed = movieInput.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      error: "Dados inválidos",
      fields: z.flattenError(parsed.error).fieldErrors,
    })
    return
  }

  const movie = await prisma.movie.create({ data: parsed.data })

  res.status(201).location(`/movies/${movie.id}`).json(movie)
})

moviesRouter.patch("/:id", async (req, res) => {
  const parsed = movieUpdate.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      error: "Dados inválidos",
      fields: z.flattenError(parsed.error).fieldErrors,
    })
    return
  }

  const movie = await prisma.movie.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  res.json(movie)
})

moviesRouter.delete("/:id", async (req, res) => {
  await prisma.movie.delete({ where: { id: req.params.id } })

  res.status(204).end()
})
