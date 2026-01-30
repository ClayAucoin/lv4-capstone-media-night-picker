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
  const apiHeader = config.core_api_key
  REQ_ID = req.req_id

  const isTesting = parseBoolean(req.query.t)
  const useLocal = parseBoolean(req.query.l)
  const { pv, zip, date, len_bkt, moods } = req.body

  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", req_body: req.body, step: "bk-core: req.body" }, "parameters")

  const wxPayload = { zip: zip, date: date }
  const aiBase = { len_bkt: len_bkt, moods: moods }

  // get wx condition
  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", wxPayload: wxPayload, step: "b4 getWxCondition success response" }, "wxPayload")

  const data = await getWxCondition(wxPayload, isTesting, useLocal)
  const wx_condition = data.conditions
  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", wx_condition: data, step: "getWxCondition success response" }, "function response")
  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", WX_URL: WX_URL, step: "bk-core: WX_URL" }, "URL")

  // console.log("data.conditions:", data.conditions)

  // build signature for query_signature lookup
  QUERY_SIG = buildQuerySignature({
    moods: moods,
    length: len_bkt,
    weather: normalizeCondition(wx_condition),
    pv: pv,
  })

  // query_signature check
  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", query_string: QUERY_SIG, step: "bk-core: query_signature, before query_signature_ck" }, "query_signature")

  const { data: ck_qs, error: ck_err } = await supabase
    .from(SETS_TABLE)
    .select("id, query_signature")
    .eq("query_signature", QUERY_SIG)
    .limit(1)

  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", ck_qs: ck_qs, step: "bk-core: ck_qs, query_signature_ck response" }, "query_signature_ck")

  if (ck_err) {
    return next(sendError(500, "Failed to read data", "READ_ERROR", { underlying: ck_err.message }))
  }

  let sendData, aiPayload, aiResponse, addPayload, data_out, message
  if (ck_qs.length === 0) {
    // get ai response
    aiPayload = { wx_bkt: wx_condition, ...aiBase }
    req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", aiPayload: aiPayload, step: "bk-core: aiPayload" }, "aiPayload")

    aiResponse = await getAiSuggestions(aiPayload, isTesting, useLocal)
    req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", data_ai: aiResponse, step: "bk-core: getAiSuggestions success" }, "function response")
    req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", AI_URL: AI_URL, step: "bk-core: AI_URL" }, "URL")

    console.log("aiResponse:", aiResponse)

    addPayload = {
      "ok": true,
      "req_id": REQ_ID,
      "isTesting": isTesting,
      "useLocal": useLocal,
      "inputParameters": {
        "count": 5,
        "len_bkt": len_bkt,
        "wx_bkt": wx_condition,
        "prompt_version": pv,
        "moods": moods,
      },
      "data": {
        "recommendations": aiResponse.data.recommendations
      }
    }
    req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", addPayload: addPayload, step: "bk-core: addPayload, before addAiSuggestions" }, "addPayload")

    sendData = await addAiSuggestions(addPayload, isTesting, useLocal)

    console.log("aft addAiSuggestions:", sendData)
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
  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", ADD_AI_URL: ADD_AI_URL, step: "bk-core: ADD_AI_URL" }, "URL")

  req.log.info({ req_id: REQ_ID, route: "/submit", file: "core.js", data_existing: sendData, message: message, step: "bk-core: sendData" }, "sendData")
  console.log(`POST /read-submit testing: ${isTesting}, local: ${useLocal}`)
  res.status(200).json(sendData)
})

export default router

async function getWxCondition(wxPayload, isTesting = true, useLocal = true) {
  if (!useLocal) {
    WX_URL = `https://api.clayaucoin.foo/api/v1/weather?t=${isTesting}&l=${useLocal}`
  } else {
    WX_URL = `http://localhost:3000/api/v1/weather?t=${isTesting}&l=${useLocal}`
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

async function getAiSuggestions(aiPayload, isTesting = true, useLocal = true) {

  if (!useLocal) {
    AI_URL = `https://api.clayaucoin.foo/api/v1/ai?t=${isTesting}`
  } else {
    AI_URL = `http://localhost:3000/api/v1/ai?t=${isTesting}`
  }
  const apiHeader = config.ai_api_key
  const baseUrl = AI_URL

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiHeader,
      "x-request-id": REQ_ID
    },
    body: JSON.stringify(aiPayload),
  })
  const data = await response.json()

  return data
}

async function addAiSuggestions(addPayload, isTesting = true, useLocal = true) {

  if (!useLocal) {
    ADD_AI_URL = `http://api.clayaucoin.foo/api/v1/add?t=${isTesting}&l=${useLocal}`
    // ADD_AI_URL = `http://api.clayaucoin.foo/api/v1/add`
  } else {
    ADD_AI_URL = `http://localhost:3000/api/v1/add?t=${isTesting}&l=${useLocal}`
    // ADD_AI_URL = `http://localhost:3000/api/v1/add`
  }
  const apiHeader = config.ai_api_key

  console.log("baseUrl:", ADD_AI_URL)

  const response = await fetch(ADD_AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiHeader, "x-request-id": REQ_ID, "x-query-sig": QUERY_SIG },
    body: JSON.stringify(addPayload),
  })
  const data = await response.json()
  // console.log("data:", data)

  return data
}
