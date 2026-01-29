// src/routes/read.js

import express from "express"
import { validateAPIKey, validateMoodBucket, validateLengthBucket, validateWxBucket } from "../middleware/validators.js"
import { config } from "../config.js"
import { dummyDataSets } from "../data/data-sets.js"
import { sendError } from "../utils/sendError.js"
import { OpenAI } from "openai"

const router = express.Router()

// ---- POST /api/v1/ai?t=true route ----
router.post('/', validateAPIKey, validateMoodBucket, validateLengthBucket, validateWxBucket, async (req, res, next) => {
  const is_testing = parseBoolean(req.query.t)
  const local = parseBoolean(req.query.l)
  console.log(`POST /api/v1/ai testing: ${is_testing}`)

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

  let data
  if (!is_testing) {
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
    });

    data = chatCompletion.choices[0].message
  }

  const picked = is_testing
    ? dummyDataSets[randomInt(0, dummyDataSets.length - 1)]
    : parseModelJson(data.content)

  const dataOut =
    picked?.data?.[0]?.data ??
    picked?.data ??
    picked

  try {
    res.json({
      ok: true,
      testing: is_testing,
      inputParameters,
      data: dataOut
    })
  } catch (err) {
    console.error(err)
    return next(sendError(500, "Internal server error", "INTERNAL_ERROR_MS_AI", {
      underlying: err.message
    }))
  }
})

export default router

function parseModelJson(contentString) {
  if (typeof contentString !== "string") {
    throw new Error("Model content is not a string");
  }

  // strip ```json fences if present
  let s = contentString.trim();
  s = s.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  s = s.replace(/```$/i, "").trim();

  // try to extract the first JSON object if there’s extra text
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model output");
  }

  const jsonSlice = s.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}

function parseBoolean(value = "true") {
  const v = value.toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return value
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

