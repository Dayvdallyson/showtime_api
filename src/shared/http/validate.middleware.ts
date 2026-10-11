import type { Request, RequestHandler } from "express"
import { z } from "zod"

import { NotFoundError } from "../errors/not-found-error.ts"
import { ValidationError } from "../errors/validation-error.ts"

const REQUEST_PARTS = ["params", "query", "body"] as const

type RequestPart = (typeof REQUEST_PARTS)[number]

export type ValidationSchemas = Partial<Record<RequestPart, z.ZodType>>

type Parsed<Schema, Fallback> = Schema extends z.ZodType ? z.output<Schema> : Fallback

type ValidatedHandler<S extends ValidationSchemas> = RequestHandler<
  Parsed<S["params"], Request["params"]>,
  unknown,
  Parsed<S["body"], unknown>,
  Parsed<S["query"], Request["query"]>
>

export function validate<S extends ValidationSchemas>(schemas: S): ValidatedHandler<S> {
  return (req, _res, next) => {
    for (const part of REQUEST_PARTS) {
      const schema = schemas[part]
      if (!schema) continue

      const result = schema.safeParse(req[part])
      if (!result.success) throw toRequestError(part, result.error)

      Object.defineProperty(req, part, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }

    next()
  }
}

function toRequestError(part: RequestPart, error: z.ZodError) {
  if (part === "params") return new NotFoundError()

  return new ValidationError(z.flattenError(error).fieldErrors)
}
