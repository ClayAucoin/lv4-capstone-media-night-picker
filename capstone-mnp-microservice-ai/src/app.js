// src/app.js

import express from 'express'
import cors from "cors"

// utils
import { sendError } from "./utils/sendError.js"
import { config } from "./config.js"

// routes
import rootRouter from "./routes/root.js"
import itemsRouter from "./routes/items.js"

const app = express()

app.use(cors())
app.use(express.json())

// use routes
app.use("/", rootRouter)
app.use("/api/v1/weather", itemsRouter)


// check for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return next(sendError(400, "Invalid JSON body", "INVALID_JSON"))
  }
  next(err)
})

export function globalErrorHandler(err, req, res, next) {

  if (config.nodeEnv !== "test") {
    // console.log("stack:", err.stack || err)
  }

  const status = err.status || 500
  const message = err.message || "Internal Server error"
  const code = err.code || "INTERNAL_ERROR"

  const payload = {
    ok: false,
    error: {
      status,
      message,
      code
    }
  }

  if (err.details) {
    payload.error.details = err.details
  }

  res.status(status).json(payload)
}

export function error404(req, res, next) {
  next(sendError(
    404,
    "Route not found",
    "NOT_FOUND",
    { path: req.path, method: req.method }
  ))
}

// routes error 404
app.use(error404)

// global error handling
app.use(globalErrorHandler)

export default app