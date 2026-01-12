// src/config.js

import dotenv from "dotenv"

dotenv.config()

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  apiKey: process.env.API_KEY || "",
  wx_api_key: process.env.WEATHER_API_KEY || "",
  ai_api_key: process.env.AI_API_KEY || "",

  dbUrl: process.env.DB_URL || ""
}