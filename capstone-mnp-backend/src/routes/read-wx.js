// src/routes/read-wx.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateWxAPIKey } from "../middleware/validators.js"
import { config } from "../config.js"

const router = express.Router()

router.get("/wx", validateWxAPIKey, async (req, res, next) => {

  const url = "http://localhost:3100/api/v1/weather?"
  const zip = "70123"
  const date = "2026-03-13"

  const apiHeader = config.wx_api_key
  const baseUrl = url + "zip=" + zip + "&date=" + date

  try {
    const response = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiHeader,
      },
    })
    const data = await response.json()
    console.log("GET /read-wx")
    res.status(200).json({
      ok: true,
      data: data,
      conditions: data.conditions
    })
  } catch (err) {
    next(sendError(500, "Internal server error", "INTERNAL_ERROR"))
  }
})

export default router