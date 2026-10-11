import type { RequestHandler } from "express"

import { NotFoundError } from "../errors/not-found-error.ts"

export const notFoundHandler: RequestHandler = () => {
  throw new NotFoundError("Rota não encontrada")
}
