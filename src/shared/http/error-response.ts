import { z } from "zod"

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: "NOT_FOUND" }),
      message: z.string().meta({ example: "Filme não encontrado" }),
      details: z.unknown().optional().meta({ description: "Erros por campo, quando houver" }),
    }),
  })
  .meta({ id: "Error" })

export type ErrorResponse = z.infer<typeof errorResponseSchema>

export function toErrorResponse(code: string, message: string, details?: unknown): ErrorResponse {
  return { error: { code, message, ...(details !== undefined && { details }) } }
}
