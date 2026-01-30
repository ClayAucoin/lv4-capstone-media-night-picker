// src/routes/read.js

import express from "express"
import { validateAPIKey, validateMoodBucket, validateLengthBucket, validateWxBucket } from "../middleware/validators.js"
import { parseModelJson, parseBoolean, randomInt } from "../utils/helpers.js"
import { requestId } from "../middleware/requestId.js"
import { config } from "../config.js"
import { dummyDataSets } from "../data/data-sets.js"
import { sendError } from "../utils/sendError.js"
import { OpenAI } from "openai"

const router = express.Router()

// ---- POST /api/v1/ai?t=true route ----
router.post('/', validateAPIKey, requestId, validateMoodBucket, validateLengthBucket, validateWxBucket, async (req, res, next) => {
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

  req.log.info({ req_id: req_id, route: "/ai", file: "ai-ms.js", req: req, step: "ai-ms: req" }, "parameters")
  req.log.info({ req_id: req_id, route: "/ai", file: "ai-ms.js", inputParameters: inputParameters, step: "ai-ms: var: inputParameters" }, "inputParameters")

  const prompt = `You are a movie recommendation engine.

Return STRICT JSON only.
- No markdown
- No backticks
- No commentary
- No extra keys

Allowed enums:
- length_bucket: ["LT_90","B90_120","B120_150","GT_150"]
- moods: ["chill","funny","intense","romantic","family","uplifting","mystery","action"]

Definitions:
- LT_90 = runtime under 90 minutes
- B90_120 = runtime between 90 and 120 minutes (inclusive)
- B120_150 = runtime between 120 and 150 minutes (inclusive)
- GT_150 = runtime greater than 150 minutes

Integration note:
- The system will try to resolve posters/slugs using Trakt.tv (VIP available).
- Therefore, if you know the Trakt slug for a movie, include it.
- If you do not know with high confidence, leave those fields blank as specified in the schema.

Input (user request):
- requested_moods: ${JSON.stringify(moods)}   (must be from allowed moods; lowercase)
- length_requirement: ${len_bkt}  (use this exact enum in output)
- weather_context: ${wx_bkt}
- count: ${count}

Rules:
- Return exactly ${count} recommendations.
- Prefer widely-known real movies. If unsure, pick mainstream titles. Do not invent runtimes or plot facts.
- If you are unsure a movie is real, do not include it.
- If a movie is commonly confused with remakes or same-title movies, prefer the most well-known version and ensure "year" matches that version.
- Add IDs only if confident:
  - trakt_slug may be provided if you are confident in the exact Trakt slug, otherwise null.
  - tmdb_id may be provided if you are confident it is correct, otherwise 0.
  - imdb_id may be provided if you are confident it is correct, otherwise "".
  - Prefer providing trakt_slug over tmdb_id/imdb_id. If unsure about tmdb/imdb, leave them blank; Trakt resolution will handle it.
- Never guess IDs. If unsure, leave them blank as specified above.
- imdb_id must be "" or match ^tt\\d{7,8}$.
- Always include "year" to help downstream ID resolution.
- Every recommendation MUST set:
  - "length_bucket" exactly as "${len_bkt}"
  - "weather_bucket" exactly as "${wx_bkt}"
- The "moods" array must contain 1 or 2 values ONLY from requested_moods (no other moods).
- "reason" must be 1-2 practical sentences connecting mood + weather vibe + runtime.
- Do NOT output any enum value outside the allowed lists. If you cannot comply, return this with a reason:
{"prompt_version":"${prompt_version}","recommendations":[{"status": "can't comply", "reason": "Reason you can't comply."}]}

Self-check before output:
- length_bucket is exactly "${len_bkt}" for every item
- weather_bucket is exactly "${wx_bkt}" for every item
- moods are only from requested_moods
- trakt_type is "movie" for every item
- trakt_slug is either a string you are confident in or null
- tmdb_id is either a known correct integer or 0
- imdb_id is "" or matches ^tt\\d{7,8}$

Output JSON schema EXACTLY:
{
  "prompt_version": "${prompt_version}",
  "recommendations": [
    {
      "title": "string",
      "year": 2000,
      "length_bucket": "LT_90",
      "moods": ["chill"],
      "weather_bucket": "RAIN",
      "reason": "string",
      "trakt_type": "movie",
      "trakt_slug": null,
      "tmdb_id": 0,
      "imdb_id": ""
    }
  ]
}`.trim();

  req.log.info({ req_id: req_id, route: "/ai", file: "ai-ms.js", prompt: prompt, step: "ai-ms: prompt" }, "prompt")

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
          content: prompt,
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
  req.log.info({ req_id: req_id, route: "/ai", file: "ai-ms.js", finalOutput: sendData, step: "ai-ms: full huggingface response" }, "sendData")

  try {
    res.json(sendData)
  } catch (err) {
    console.error(err)
    return next(sendError(500, "Internal server error", "INTERNAL_ERROR_MS_AI", { underlying: err.message }))
  }
})

export default router
