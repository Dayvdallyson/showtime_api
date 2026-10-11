import { randomUUID } from "node:crypto"

import { pinoHttp } from "pino-http"

import type { Logger } from "../logger.ts"

const REQUEST_ID_HEADER = "x-request-id"
const REQUEST_ID_MAX_LENGTH = 128

// Reaproveita o id que chegou (ex.: de um proxy) para seguir a requisição de ponta a ponta
export function createRequestLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId(req, res) {
      const incoming = req.headers[REQUEST_ID_HEADER]
      const id =
        typeof incoming === "string" && incoming.length <= REQUEST_ID_MAX_LENGTH
          ? incoming
          : randomUUID()

      res.setHeader(REQUEST_ID_HEADER, id)
      return id
    },
  })
}
