// src/routes/read-wx.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateAPIKey } from "../middleware/validator-keys.js"
import { validateWeatherVars } from "../middleware/validator-wx.js"
import { parseBoolean, normalizeCondition, buildQuerySignature } from '../utils/helpers.js'
import { requestId } from "../middleware/requestId.js"
import { config } from "../config.js"
import supabase from "../utils/supabase.js"

const router = express.Router()

const SETS_TABLE = "lv4_cap_recommendation_sets"
const RECOMMENDATIONS_TABLE = "lv4_cap_recommendations"
let REQ_ID, QUERY_SIG, WX_URL, AI_URL, ADD_AI_URL

router.post("/submit", validateAPIKey, requestId, async (req, res, next) => {
  const apiHeader = config.api_key
  REQ_ID = req.req_id

  const is_testing = parseBoolean(req.query.t)
  const useLocal = parseBoolean(req.query.l)
  const { pv, zip, date, len_bkt, moods } = req.body
  const req_body = req.body
  req.log.info({ route: "/submit", file: "read-submit.js", req_body: req.body, step: "bk-core: req.body" }, "parameters")

  // const inputParameters = { pv, date, zip, len_bkt, moods }
  const wxPayload = { zip: zip, date: date }
  const aiBase = { len_bkt: len_bkt, moods: moods }

  // get wx condition
  req.log.info({ route: "/submit", file: "read-submit.js", wxPayload: wxPayload, step: "b4 getWxCondition success response" }, "variable")

  const data = await getWxCondition(wxPayload, is_testing, useLocal)
  const wx_condition = data.conditions
  req.log.info({ route: "/submit", file: "read-submit.js", wx_condition: data, step: "getWxCondition success response" }, "function response")
  req.log.info({ route: "/submit", file: "read-submit.js", WX_URL: WX_URL, step: "bk-core: baseUrl" }, "WX URL")

  // console.log("data.conditions:", data.conditions)

  // build signature for query_signature lookup
  QUERY_SIG = buildQuerySignature({
    moods: moods,
    length: len_bkt,
    weather: normalizeCondition(wx_condition),
    pv: pv,
  })

  // query_signature check
  req.log.info({ route: "/submit", file: "read-submit.js", query_string: QUERY_SIG, step: "bk-core: query_signature, before query_signature_ck" }, "variable")

  const { data: ck_qs, error: ck_err } = await supabase
    .from(SETS_TABLE)
    .select("id, query_signature")
    .eq("query_signature", QUERY_SIG)
    .limit(1)

  req.log.info({ route: "/submit", file: "read-submit.js", ck_qs: ck_qs, step: "bk-core: ck_qs, query_signature_ck response" }, "variable")

  if (ck_err) {
    return next(sendError(500, "Failed to read data", "READ_ERROR", { underlying: ck_err.message }))
  }

  let sendData, aiPayload, aiResponse, addPayload, data_out, message
  if (ck_qs.length === 0) {
    // get ai response
    aiPayload = { wx_bkt: wx_condition, ...aiBase }
    aiResponse = await getAiSuggestions(aiPayload, is_testing, useLocal)
    req.log.info({ route: "/submit", file: "read-submit.js", data_ai: aiResponse, step: "bk-core: getAiSuggestions success" }, "function response")
    req.log.info({ route: "/submit", file: "read-submit.js", AI_URL: AI_URL, step: "bk-core: baseUrl" }, "AI URL")

    addPayload = {
      "ok": true,
      "req_id": REQ_ID,
      "is_testing": is_testing,
      "useLocal": useLocal,
      "inputParameters": {
        "count": 5,
        "len_bkt": len_bkt,
        "wx_bkt": wx_condition,
        "prompt_version": pv,
        "moods": moods,
      },
      "data": {
        "recommendations": aiResponse.data.data.recommendations
      }
    }
    req.log.info({ route: "/submit", file: "read-submit.js", addPayload: addPayload, step: "bk-core: addPayload, before addAiSuggestions" }, "variable")

    sendData = await addAiSuggestions(addPayload)

  } else {
    // get existing data
    const { data: recs_data, error: recs_err } = await supabase
      .from(RECOMMENDATIONS_TABLE)
      .select()
      .eq("set_id", ck_qs[0].id)

    if (recs_err) return next(sendError(500, "Failed to read recommendations", "READ_ERROR", { underlying: recs_err.message }))

    message = "Movies retrieved successfully."

    sendData = {
      ok: true,
      records: recs_data.length,
      message: message,
      data: {
        recommendations: recs_data
      }
    }
  }
  req.log.info({ route: "/submit", file: "read-submit.js", ADD_AI_URL: ADD_AI_URL, step: "bk-core: ADD_AI_URL" }, "ADD AI URL")

  req.log.info({ route: "/submit", file: "read-submit.js", data_existing: sendData, message: message, step: "bk-core: sendData" }, "sendData")
  console.log(`POST /read-submit testing: ${is_testing}, local: ${useLocal}`)
  res.status(200).json(sendData)
})

export default router

async function getWxCondition(wxPayload, is_testing = true, useLocal = true) {
  if (!useLocal) {
    WX_URL = `https://api.clayaucoin.foo/api/v1/weather?t=${is_testing}&l=${useLocal}&`
  } else {
    WX_URL = `http://localhost:3000/api/v1/weather?t=${is_testing}&l=${useLocal}&`
  }
  const apiHeader = config.wx_api_key
  const baseUrl = WX_URL

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
      "x-api-key": apiHeader,
      "x-request-id": REQ_ID,
      "x-query-sig": QUERY_SIG,
    },
    body: JSON.stringify(wxPayload),
  })
  const data = await response.json()

  return data
}

async function getAiSuggestions(aiPayload, is_testing = true, useLocal = true) {
  if (!useLocal) {
    AI_URL = `https://api.clayaucoin.foo/api/v1/ai?t=${is_testing}`
  } else {
    AI_URL = `http://localhost:3000/api/v1/ai?t=${is_testing}`
  }
  const apiHeader = config.ai_api_key
  const baseUrl = AI_URL

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader, "x-request-id": REQ_ID },
    body: JSON.stringify(aiPayload),
  })
  const data = await response.json()

  return data
}

async function addAiSuggestions(addPayload, is_testing = true, useLocal = true) {
  // const aiUrl = `http://localhost:3000/api/v1/add`

  if (!useLocal) {
    ADD_AI_URL = `http://api.clayaucoin.foo/api/v1/add`
  } else {
    ADD_AI_URL = `http://localhost:3000/api/v1/add`
  }
  const apiHeader = config.ai_api_key
  const baseUrl = ADD_AI_URL

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader, "x-request-id": REQ_ID, "x-query-sig": QUERY_SIG },
    body: JSON.stringify(addPayload),
  })
  const data = await response.json()

  return data
}
