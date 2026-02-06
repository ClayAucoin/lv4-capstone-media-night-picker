// src/lib/logger.js
import pino from "pino"

// IMPORTANT:
// If your app runs on the Ubuntu VM (PM2), this can be 127.0.0.1:3110.
// If your app runs on Windows, this must be http://<ubuntu-vm-ip>:3110.
const lokiHost = process.env.LOKI_HOST

const service = process.env.SERVICE_NAME || "unknown-service"
const env = process.env.NODE_ENV || "dev"

let logger

if (lokiHost) {
  // pino-loki transport (recommended)
  const transport = pino.transport({
    target: "pino-loki",
    options: {
      host: lokiHost,                         // required :contentReference[oaicite:1]{index=1}
      labels: { service, env },        // adds labels to all logs :contentReference[oaicite:2]{index=2}
      // batching is on by default; you can tune if you want :contentReference[oaicite:3]{index=3}
      batching: { interval: 5, maxBufferSize: 10000 },
    },
  })

  logger = pino(
    {
      level: process.env.LOG_LEVEL || "info",
      base: { service, env },
    },
    transport
  )
} else {
  // Fallback to console if LOKI_HOST isn't set
  logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { service, env },
  })
}

export default logger
