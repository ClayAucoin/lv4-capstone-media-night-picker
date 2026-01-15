// src/routes/read-wx.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateWxAPIKey } from "../middleware/validator-keys.js"
import { validateWeatherVars } from "../middleware/validator-wx.js"
import { config } from "../config.js"

const router = express.Router()

router.post("/wx", validateWxAPIKey, validateWeatherVars, async (req, res, next) => {

  const local = parseBoolean(req.query.l)

  let url
  if (!local) {
    url = "https://weather.clayaucoin.foo/api/v1/weather?"
  } else {
    url = "http://localhost:3100/api/v1/weather?"
  }

  const { zip, dateString } = req.weatherParams

  const apiHeader = config.wx_api_key
  const baseUrl = url + "t=" + true

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiHeader,
      },
      body: JSON.stringify({
        "zip": zip,
        "date": dateString
      }),
    })
    const data = await response.json()
    console.log("GET /read-wx")
    res.status(200).json({
      ok: true,
      local: local,
      data: data,
      conditions: data.conditions
    })
  } catch (err) {
    next(sendError(500, "Internal server error", "INTERNAL_ERROR"))
  }
})

export default router

function parseBoolean(value = "true") {
  const v = value.toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return value
}
