import cors from "cors"
import express, { type ErrorRequestHandler } from "express"

import { Prisma } from "./generated/prisma/client.ts"
import { moviesRouter } from "./movies.ts"

const PORT = Number(process.env.PORT ?? 3333)
const WEB_ORIGINS = (process.env.WEB_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()

app.disable("x-powered-by")
app.use(cors({ origin: WEB_ORIGINS }))
app.use(express.json({ limit: "100kb" }))

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})
app.use("/movies", moviesRouter)

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" })
})

const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    res.status(404).json({ error: "Não encontrado" })
    return
  }

  if (typeof error?.status === "number" && error.status >= 400 && error.status < 500) {
    res.status(400).json({ error: "Requisição inválida" })
    return
  }

  console.error(error)
  res.status(500).json({ error: "Erro interno" })
}
app.use(handleError)

app.listen(PORT, (error) => {
  if (error) throw error
  console.log(`API rodando em http://localhost:${PORT}`)
})
