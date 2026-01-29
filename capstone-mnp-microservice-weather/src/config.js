// src/config.js

import dotenv from "dotenv"

dotenv.config()
dotenv.config({ path: ".env.local" })

export const config = {
  port: process.env.PORT || 999999,                             // 3100,
  nodeEnv: process.env.NODE_ENV || "development",
  weather_key: process.env.WEATHER_KEY || "",
  weather_service_key: process.env.WEATHER_SERVICE_KEY || "",
  loki_host: process.env.LOKI_HOST,
}