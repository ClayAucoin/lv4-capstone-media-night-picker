// src/routes/read-wx.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateWxAPIKey } from "../middleware/validator-keys.js"
import { validateWeatherVars } from "../middleware/validator-wx.js"
import { config } from "../config.js"
import { dummyDataSets } from "../data/dummy-data/data-sets.js"
import supabase from "../utils/supabase.js"

const router = express.Router()

const SETS_TABLE = "lv4_cap_recommendation_sets"
const RECOMMENDATIONS_TABLE = "lv4_cap_recommendations"

router.post("/submit", async (req, res, next) => {
  const apiHeader = config.api_key

  const local = parseBoolean(req.query.l)
  const is_testing = parseBoolean(req.query.t)
  const { pv, zip, date, len_bkt, moods } = req.body

  const inputParameters = { pv, date, zip, len_bkt, moods }
  const wxPayload = { zip: zip, date: date }
  const aiBase = { len_bkt: len_bkt, moods: moods }

  // try {
  // get wx condition
  const data = await getWxCondition(wxPayload, local)

  // build signature for query_signature lookup
  const query_signature = buildQuerySignature({
    moods: moods,
    length: len_bkt,
    weather: normalizeCondition(data.conditions),
    pv: "v2",

  })
  console.log("sbmt: query_signature:", query_signature)

  // query_signature check
  const { data: ck_qs, error: ck_err } = await supabase
    .from(SETS_TABLE)
    .select("id, query_signature")
    .eq("query_signature", query_signature)
    .limit(1)

  if (ck_err) {
    // console.error("checkQuerySignature error:", ck_err.message)
    return next(sendError(500, "Failed to read data", "READ_ERROR", { underlying: ck_err.message }))
  }

  let sendData, aiPayload, aiResponse, addPayload, data_out, message
  if (ck_qs.length === 0) {
    // console.log("new data")
    // get ai response
    aiPayload = { wx_bkt: data.conditions, ...aiBase }

    console.log("sbmt: ai sugestions: start")
    aiResponse = await getAiSuggestions(aiPayload, is_testing, local)
    console.log("sbmt: ai sugestions: back")

    addPayload = {
      "ok": true,
      "inputParameters": {
        "count": 5,
        "len_bkt": len_bkt,
        "wx_bkt": data.conditions,
        "prompt_version": pv,
        "moods": moods,
      },
      "data": {
        "recommendations": aiResponse.data.data.recommendations
      }
    }
    sendData = await addAiSuggestions(addPayload)

  } else {
    // console.log("existing data")

    // get existing data
    const { data: recs_data, error: recs_err } = await supabase
      .from(RECOMMENDATIONS_TABLE)
      .select()
      .eq("set_id", ck_qs[0].id)

    if (recs_err) return next(sendError(500, "Failed to read recommendations", "READ_ERROR", { underlying: recs_err.message }))

    message = "Movies retrieved successfully."

    // sendData = recs_data
    sendData = {
      ok: true,
      records: recs_data.length,
      message: message,
      data: {
        recommendations: recs_data
      }
    }
  }

  // console.log(sendData)

  console.log("POST /read-submit")
  res.status(200).json(sendData)
  // } catch (err) {
  //   next(sendError(500, "Internal server error", "INTERNAL_ERROR_BKEND_SBMT"))
  // }
})

export default router

async function getWxCondition(wxPayload, local = true) {
  // const wxUrl = "https://api.clayaucoin.foo/api/v1/wx?l=false&"
  const wxUrl = "http://localhost:3000/api/v1/wx?l=false&"
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

async function getAiSuggestions(aiPayload, is_testing = true) {
  // const aiUrl = `https://api.clayaucoin.foo/api/v1/ai?t=${is_testing}`
  const aiUrl = `http://localhost:3000/api/v1/ai?t=${is_testing}`
  const apiHeader = config.ai_api_key
  const baseUrl = aiUrl

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader },
    body: JSON.stringify(aiPayload),
  })
  const data = await response.json()

  return data
}

async function addAiSuggestions(addPayload, is_testing = true) {
  const aiUrl = `http://localhost:3000/api/v1/add`
  const apiHeader = config.ai_api_key
  const baseUrl = aiUrl

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader },
    body: JSON.stringify(addPayload),
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

function normalizeCondition(string) {
  const wx_bucket = (string ?? "").trim().toUpperCase().replace(/\s+/g, "_")

  return wx_bucket
}

// format moods for signature
function normalizeMoods(moods = []) {
  return moods
    .map((m) => m.toLowerCase().trim())
    .sort()
    .join(",")
}

// format signature for lookup
function buildQuerySignature({
  moods = [],
  length,
  weather,
  pv = "v0",
  variant = "default",
}) {
  const parts = []

  if (moods.length) {
    parts.push(`moods=${normalizeMoods(moods)}`)
  }

  if (length) {
    parts.push(`len=${length}`)
  }

  if (weather) {
    parts.push(`wx=${weather}`)
  }

  parts.push(`pv=${pv}`)
  parts.push(`var=${variant}`)

  return parts.join("|")
}

