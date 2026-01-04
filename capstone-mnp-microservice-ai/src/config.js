// src/config.js

import dotenv from "dotenv"

dotenv.config()

export const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || "development",
  weather_key: process.env.WEATHER_KEY || "",
  weather_service_key: process.env.WEATHER_SERVICE_KEY || "",
}