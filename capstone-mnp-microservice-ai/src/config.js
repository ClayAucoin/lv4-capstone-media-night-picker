// src/config.js

import dotenv from "dotenv"

dotenv.config()
dotenv.config({ path: ".env.local" })

export const config = {
  port: process.env.PORT || 3105,
  nodeEnv: process.env.NODE_ENV || "development",
  trakt_client_id: process.env.TRAKT_CLIENT_ID || "",
  tmdb_api_key: process.env.TMDB_API_KEY || "",
  app_service_key: process.env.APP_SERVICE_KEY || "",
  hf_token: process.env.HF_TOKEN || "",
  loki_host: process.env.LOKI_HOST,
}