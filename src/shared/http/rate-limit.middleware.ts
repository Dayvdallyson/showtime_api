import { rateLimit } from "express-rate-limit"

import { toErrorResponse } from "./error-response.ts"

export type RateLimitOptions = {
  windowMs: number
  limit: number
}

export function createRateLimiter({ windowMs, limit }: RateLimitOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res
        .status(options.statusCode)
        .json(
          toErrorResponse("TOO_MANY_REQUESTS", "Muitas requisições, tente de novo em instantes"),
        )
    },
  })
}
