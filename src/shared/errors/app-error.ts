// Categoria diz o tipo de falha sem amarrar o domínio ao HTTP.
// A camada HTTP traduz categoria em status, então um erro novo de uma categoria
// existente não exige mexer no error handler.
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
