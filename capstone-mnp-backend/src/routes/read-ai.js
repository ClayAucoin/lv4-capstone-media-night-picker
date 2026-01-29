// src/routes/read-ai.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateAIAPIKey } from "../middleware/validator-keys.js"
import { validateMoodBucket, validateLengthBucket, validateWxBucket } from "../middleware/validator-ai.js"
import { parseBoolean } from '../utils/helpers.js'
import { requestId } from "../middleware/requestId.js"
import { config } from "../config.js"

const router = express.Router()

router.post("/ai", requestId, validateAIAPIKey, validateMoodBucket, validateLengthBucket, validateWxBucket, async (req, res, next) => {
  const req_id = req.req_id
  const is_testing = parseBoolean(req.query.t)
  const useLocal = parseBoolean(req.query.l)

  let baseUrl
  let where
  if (!useLocal) {
    baseUrl = `https://lv4.ai.clayaucoin.foo/api/v1/ai?t=${is_testing}&l=${useLocal}`
    where = "online"
  } else {
    baseUrl = `http://localhost:3105/api/v1/ai?t=${is_testing}&l=${useLocal}`
    where = "useLocal"
  }
  req.log.info({ route: "/ai", file: "read-ai.js", baseUrl: baseUrl, step: "bk-ai: baseUrl" }, "variable")

  const apiHeader = config.ai_api_key
  const moods = req.moods
  const len_bkt = req.len_bkt
  const wx_bkt = req.wx_bkt

  // try {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiHeader,
    },
    body: JSON.stringify({
      "len_bkt": len_bkt,
      "wx_bkt": wx_bkt,
      "moods": moods
    }),
  })
  const data = await response.json()
  console.log(`POST /ai testing: ${is_testing}, local: ${useLocal}`)

  const sendData = {
    ok: true,
    testing: is_testing,
    where: where,
    data: data,
  }
  req.log.info({ route: "/ai", file: "read-ai.js", sendData: sendData, step: "bk-ai: sendData" }, "variable")

  res.status(200).json(sendData)
  // } catch (err) {
  //   next(sendError(500, "Internal server error", "INTERNAL_ERROR_BKEND_AI"))
  // }
})

export default router

