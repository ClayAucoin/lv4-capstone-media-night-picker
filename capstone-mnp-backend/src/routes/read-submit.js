// src/routes/read-wx.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateWxAPIKey } from "../middleware/validator-keys.js"
import { validateWeatherVars } from "../middleware/validator-wx.js"
import { config } from "../config.js"

const router = express.Router()

router.post("/submit", async (req, res, next) => {

  const local = parseBoolean(req.query.l)
  const is_testing = parseBoolean(req.query.t)
  const { pv, zip, date, len_bkt, moods } = req.body

  const inputParameters = {
    pv,
    date,
    zip,
    len_bkt,
    // wx_bkt,
    moods
  }

  const wxPayload = {
    zip: zip,
    date: date
  }

  const aiBase = {
    len_bkt: len_bkt,
    moods: moods
  }

  const doFetch = true
  try {
    if (doFetch) {
      // get wx condition
      const data = await getWxCondition(wxPayload, local)

      // get ai response
      const aiPayload = { wx_bkt: data.conditions, ...aiBase }
      console.log("aiPayload:", aiPayload)

      const aiResponse = await getAiSuggestions(aiPayload, is_testing, local)


      console.log("POST /read-submit")
      res.status(200).json({
        ok: true,
        wxPayload: wxPayload,
        // wxResponse: data.conditions,
        aiPayload: aiPayload,
        aiResponse: aiResponse,
      })
    } else {
      res.status(200).json({
        ok: true,
        payload: wxPayload,
        data: inputParameters,
      })
    }
  } catch (err) {
    next(sendError(500, "Internal server error", "INTERNAL_ERROR"))
  }
})

export default router

async function getWxCondition(wxPayload, local = true) {
  const wxUrl = "https://api.clayaucoin.foo/api/v1/wx?l=false&"
  const apiHeader = config.wx_api_key
  const baseUrl = wxUrl + "t=" + true

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader },
    body: JSON.stringify(wxPayload),
  })
  const data = await response.json()

  return data
}

async function getAiSuggestions(aiPayload, t = true, local = true) {
  const aiUrl = `https://api.clayaucoin.foo/api/v1/ai?t=${t}&l=${local}`
  const apiHeader = config.ai_api_key
  const baseUrl = aiUrl

  console.log("baseUrl:", baseUrl)
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader },
    body: JSON.stringify(aiPayload),
  })
  const data = await response.json()

  return data
}

function parseBoolean(value = "true") {
  const v = value.toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return value
}
