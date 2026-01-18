// src/config.js

import dotenv from "dotenv"

dotenv.config()

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  api_key: process.env.API_SERVICE_KEY || "",
  wx_api_key: process.env.WEATHER_API_KEY || "",
  ai_api_key: process.env.AI_API_KEY || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_ANON_KEY || "",

  dbUrl: process.env.DB_URL || ""
}