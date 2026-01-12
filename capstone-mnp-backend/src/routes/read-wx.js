// src/routes/read.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateAPIKey } from "../middleware/validators.js"
import { config } from "../config.js"
import data from "../data.js"

const router = express.Router()

router.get("/wx", validateAPIKey, async (req, res, next) => {

  // http://localhost:3100/api/v1/weather?zip=70123&date=2025-12-25&key=3OnZ918Kq8x7J8CwCy61o0d81F1UCHyZ
  const url = "http://localhost:3100/api/v1/weather?"
  const zip = "70123"
  const date = "2026-03-13"

  const apiHeader = config.wx_api_key
  const baseUrl = url + "zip=" + zip + "&date=" + date

  console.log(".env:", config.wx_api_key)
  console.log("baseUrl:", baseUrl)

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
      data: data
    })
  } catch (err) {
    next(sendError(500,))
  }
})

export default router