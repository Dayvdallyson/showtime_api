import { AppError } from "./app-error.ts"

export class NotFoundError extends AppError {
  readonly category = "not_found"
  readonly code = "NOT_FOUND"

  constructor(message = "Não encontrado") {
    super(message)
  }
}
