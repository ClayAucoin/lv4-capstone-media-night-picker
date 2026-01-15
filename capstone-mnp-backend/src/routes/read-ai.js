// src/routes/read-ai.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateAIAPIKey } from "../middleware/validators.js"
import { config } from "../config.js"

const router = express.Router()

router.get("/ai", validateAIAPIKey, async (req, res, next) => {

  const url = "https://lv4.ai.clayaucoin.foo/"
  // const url = "http://localhost:3105/api/v1/ai?"
  const t = "false" // t = testing

  const apiHeader = config.ai_api_key
  const baseUrl = url + "t=" + t

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiHeader,
      },
      body: JSON.stringify({
        "len_bkt": "LT_90",
        "wx_bkt": "Partially cloudy",
        "moods": [
          "uplifting",
          "action"
        ]
      }),
    })
    const data = await response.json()
    console.log("GET /read-ai")
    res.status(200).json({
      ok: true,
      data: data,
    })
  } catch (err) {
    next(sendError(500, "Internal server error", "INTERNAL_ERROR"))
  }
})

export default router