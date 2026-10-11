import type { ErrorRequestHandler } from "express"

import { AppError, type ErrorCategory } from "../errors/app-error.ts"
import { toErrorResponse } from "./error-response.ts"

const STATUS_BY_CATEGORY: Record<ErrorCategory, number> = {
  not_found: 404,
  validation: 400,
}

const PAYLOAD_TOO_LARGE = 413

type HttpClientError = { status: number; expose: true }

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res
      .status(STATUS_BY_CATEGORY[error.category])
      .json(toErrorResponse(error.code, error.message, error.details))
    return
  }

  if (isHttpClientError(error)) {
    res.status(error.status).json(describeHttpClientError(error))
    return
  }

  req.log.error({ err: error }, "Erro não tratado")
  res.status(500).json(toErrorResponse("INTERNAL_ERROR", "Erro interno"))
}

function isHttpClientError(error: unknown): error is HttpClientError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500 &&
    "expose" in error &&
    error.expose === true
  )
}

function describeHttpClientError(error: HttpClientError) {
  if (error.status === PAYLOAD_TOO_LARGE) {
    return toErrorResponse("PAYLOAD_TOO_LARGE", "Corpo da requisição grande demais")
  }

  return toErrorResponse("BAD_REQUEST", "Requisição inválida")
}
