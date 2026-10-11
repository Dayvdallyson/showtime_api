import { AppError } from "./app-error.ts"

export class ValidationError extends AppError {
  readonly category = "validation"
  readonly code = "VALIDATION_ERROR"

  constructor(details: Record<string, string[] | undefined>, message = "Dados inválidos") {
    super(message, details)
  }
}
