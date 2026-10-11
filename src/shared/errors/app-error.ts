export type ErrorCategory = "not_found" | "validation"

export abstract class AppError extends Error {
  abstract readonly category: ErrorCategory
  abstract readonly code: string
  readonly details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = new.target.name
    this.details = details
  }
}
