// src/routes/read-ai.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateAIAPIKey } from "../middleware/validator-keys.js"
import { validateMoodBucket, validateLengthBucket, validateWxBucket } from "../middleware/validator-ai.js"
import { config } from "../config.js"

const router = express.Router()

router.post("/ai", validateAIAPIKey, validateMoodBucket, validateLengthBucket, validateWxBucket, async (req, res, next) => {

  const is_testing = parseBoolean(req.query.t)
  const local = parseBoolean(req.query.l)

  let url
  let where
  if (!local) {
    url = `https://lv4.ai.clayaucoin.foo/api/v1/ai?t=${is_testing}`
    where = "online"
  } else {
    url = `http://localhost:3105/api/v1/ai?t=${is_testing}`
    where = "local"
  }

  const apiHeader = config.ai_api_key
  // const baseUrl = url + "t=" + is_testing

  const moods = req.moods
  const len_bkt = req.len_bkt
  const wx_bkt = req.wx_bkt

  try {
    const response = await fetch(url, {
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
    console.log("POST /ai")
    res.status(200).json({
      ok: true,
      testing: is_testing,
      where: where,
      data: data,
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
