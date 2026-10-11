import { z } from "zod"

z.config(z.locales.pt())

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

const FIRST_FILM_YEAR = 1888
const MAX_YEAR = 2100
const TITLE_MAX_LENGTH = 200
const GENRE_MAX_LENGTH = 50
const SYNOPSIS_MAX_LENGTH = 2000

export const createMovieSchema = z
  .object({
    title: z.string().trim().min(1).max(TITLE_MAX_LENGTH).meta({ example: "Maré Alta" }),
    genre: z.string().trim().min(1).max(GENRE_MAX_LENGTH).meta({ example: "Drama" }),
    year: z.int().min(FIRST_FILM_YEAR).max(MAX_YEAR).meta({ example: 2026 }),
    synopsis: z.string().trim().max(SYNOPSIS_MAX_LENGTH).nullish(),
    posterUrl: z
      .url({ protocol: /^https?$/ })
      .nullish()
      .meta({ example: "https://exemplo.com/poster.jpg" }),
    accent: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, "Use uma cor hex, ex.: #0ea5e9")
      .nullish()
      .meta({ description: "Cor de destaque em hex", example: "#0ea5e9" }),
  })
  .meta({ id: "CreateMovie" })

export const updateMovieSchema = createMovieSchema
  .partial()
  .meta({ id: "UpdateMovie", description: "Só os campos enviados são alterados" })

export const movieIdParamsSchema = z.object({
  id: z.uuid().meta({ description: "Id do filme (UUID)" }),
})

export const listMoviesQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .meta({ description: "Filtra pelo título, sem diferenciar maiúsculas" }),
  page: z.coerce.number().int().min(1).default(1).meta({ description: "Página, começando em 1" }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .meta({ description: `Itens por página, no máximo ${MAX_PAGE_SIZE}` }),
})

export const movieResponseSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    genre: z.string(),
    year: z.int(),
    synopsis: z.string().nullable(),
    posterUrl: z.string().nullable(),
    accent: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Movie" })

export const movieListResponseSchema = z
  .object({
    data: z.array(movieResponseSchema),
    meta: z.object({
      page: z.int(),
      pageSize: z.int(),
      total: z.int(),
    }),
  })
  .meta({ id: "MovieList" })

export type CreateMovieInput = z.infer<typeof createMovieSchema>
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>
export type MovieIdParams = z.infer<typeof movieIdParamsSchema>
export type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema>
export type MovieResponse = z.infer<typeof movieResponseSchema>
