// src/app.js

import express from 'express'
import cors from "cors"

// utils
import { sendError } from "./utils/sendError.js"
import { config } from "./config.js"

// routes
import rootRouter from "./routes/root.js"
import itemsRouter from "./routes/items.js"

// logging
import pinoHttp from "pino-http"
import logger from "./lib/logger.js"
import { requestId } from "./middleware/requestId.js"

const app = express();

app.use(cors())
app.use(express.json())

app.use(requestId)
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      req_id: req.req_id,
    }),
  })
)

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
  const status = err.status || 500

  if (config.nodeEnv !== "test") {
    // console.log("stack:", err.stack || err)
  }

  req.log.error(
    {
      req_id: req.req_id,
      status,
      code: err.code,
      details: err.details,
      route: req.originalUrl,
      method: req.method,
      err,
    },
    err.message || "Unhandled error"
  )

  const response = {
    ok: false,
    error: {
      status,
      message: err.message || "Server error",
      code: err.code || "INTERNAL_ERROR",
      req_id: req.req_id,
    },
  }

  if (status < 500 && err.details !== undefined) {
    response.error.details = err.details
  }

  res.status(status).json(response)
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