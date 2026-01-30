// src/routes/read.js

import express from "express"
import { validateAPIKey, validateMoodBucket, validateLengthBucket, validateWxBucket } from "../middleware/validator-ai.js"
import { parseModelJson, parseBoolean, randomInt } from "../utils/helpers.js"
import { buildMoviePrompt } from "../prompts/aiPrompt.js"
import { requestId } from "../middleware/requestId.js"
import { config } from "../config.js"
import { dummyDataSets } from "../data/data-sets.js"
import { sendError } from "../utils/sendError.js"
import { OpenAI } from "openai"

const router = express.Router()

// ---- POST /api/v1/ai?t=true route ----
router.post('/ai', validateAPIKey, requestId, validateMoodBucket, validateLengthBucket, validateWxBucket, async (req, res, next) => {
  const isTesting = parseBoolean(req.query.t)
  const useLocal = parseBoolean(req.query.l)

  const req_id = req.req_id
  console.log(`POST /api/v1/ai testing: ${isTesting}`)

  const count = 5
  const moods = req.moods
  const len_bkt = req.len_bkt
  const wx_bkt = req.wx_bkt
  const prompt_version = "v2"

  const inputParameters = {
    count,
    len_bkt,
    wx_bkt,
    prompt_version,
    moods
  }

  const aiPrompt = buildMoviePrompt({
    len_bkt,
    wx_bkt,
    moods,
    count,
    prompt_version,
  })

  req.log.info({ req_id: req_id, route: "/ai", file: "ms-ai.js", req: req, inputParameters: inputParameters, aiPrompt: aiPrompt, step: "ms-ai: req" }, "parameters")

  let data
  if (!isTesting) {
    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: process.env.HF_TOKEN,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b:groq",
      // model: "openai/gpt-oss-120b:fireworks-ai",
      messages: [
        {
          role: "user",
          content: aiPrompt,
        },
      ],
    })
    data = chatCompletion.choices[0].message
  }

  const picked = isTesting
    ? dummyDataSets[randomInt(0, dummyDataSets.length - 1)]
    : parseModelJson(data.content)

  const pickedData =
    picked?.data?.[0]?.data ??
    picked?.data ??
    picked

  const sendData = {
    ok: true,
    isTesting: isTesting,
    useLocal,
    inputParameters,
    data: pickedData
  }
  req.log.info({ req_id: req_id, route: "/ai", file: "ms-ai.js", sendData: sendData, step: "ms-ai: full huggingface response" }, "sendData")

  try {
    res.json(sendData)
  } catch (err) {
    console.error(err)
    return next(sendError(500, "Internal server error", "INTERNAL_ERROR_MS_AI", { underlying: err.message }))
  }
})

export default router
