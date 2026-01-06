// src/routes/read.js

import express from "express"
import { validateAPIKey, validateWeatherQuery } from "../middleware/validators.js"
import { config } from "../config.js"
import { sendError } from "../utils/sendError.js"
import { OpenAI } from "openai"

const router = express.Router()

// ---- GET /api/v1/ai route ----
router.get('/', async (req, res, next) => {
  console.log('GET /api/v1/ai')
  // const { zip, dateString } = req.weatherParams

  const LENGTH_BUCKET_LABELS = {
    LT_90: "Less than 90 minutes",
    B90_120: "Between 90 and 120 minutes",
    B120_150: "Between 120 and 150 minutes",
    GT_150: "Greater than 150 minutes",
  };

  const apiKey = config.weather_key

  const count = 5
  const moods = ["intense", "action"]
  const len_bucket = "GT_150"
  const wx_bucket = "CLEAR"
  const prompt_version = "v1"

  const prompt = `You are a movie recommendation engine.

Return STRICT JSON only.
- No markdown
- No backticks
- No commentary
- No extra keys

Allowed enums:
- length_bucket: ["LT_90","B90_120","B120_150","GT_150"]
- weather_bucket: ["CLEAR","RAIN","COLD","HOT","STORM"]
- moods: ["chill","funny","intense","romantic","family","uplifting","mystery","action"]

Definitions:
- LT_90 = runtime under 90 minutes
- B90_120 = runtime between 90 and 120 minutes (inclusive)
- B120_150 = runtime between 120 and 150 minutes (inclusive)
- GT_150 = runtime greater than 150 minutes

Weather vibe guide (use ONLY the enum values above):
- CLEAR: bright, upbeat, easy watch
- RAIN: cozy, indoors, comfort
- COLD: warm, comforting, low-stress
- HOT: light, fun, breezy
- STORM: tense, focused, high-energy (still respect the mood list)

Integration note:
- The system will try to resolve posters/slugs using Trakt.tv (VIP available).
- Therefore, if you know the Trakt slug for a movie, include it.
- If you do not know with high confidence, leave those fields blank as specified in the schema.

Input (user request):
- requested_moods: ${JSON.stringify(moods)}   (must be from allowed moods; lowercase)
- length_requirement: ${len_bucket}  (use this exact enum in output)
- weather_context: ${wx_bucket}      (use this exact enum in output)
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
  - "length_bucket" exactly as "${len_bucket}"
  - "weather_bucket" exactly as "${wx_bucket}"
- The "moods" array must contain 1 or 2 values ONLY from requested_moods (no other moods).
- "reason" must be 1-2 practical sentences connecting mood + weather vibe + runtime.
- Do NOT output any enum value outside the allowed lists. If you cannot comply, return:
{"prompt_version":"v2","recommendations":[]}

Self-check before output:
- length_bucket is exactly "${len_bucket}" for every item
- weather_bucket is exactly "${wx_bucket}" for every item
- moods are only from requested_moods
- trakt_type is "movie" for every item
- trakt_slug is either a string you are confident in or null
- tmdb_id is either a known correct integer or 0
- imdb_id is "" or matches ^tt\\d{7,8}$

Output JSON schema EXACTLY:
{
  "prompt_version": "v2",
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

  const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN,
  });

  const chatCompletion = await client.chat.completions.create({
    model: "openai/gpt-oss-20b:groq",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const data = chatCompletion.choices[0].message

  try {
    res.json({
      // raw: data,
      data: parseModelJson(data.content)
    })
  } catch (err) {
    console.error(err)
    return next(sendError(500, "Internal server error", "INTERNAL_ERROR", {
      underlying: err.message
    }))
  }
})

export default router

function parseModelJson(contentString) {
  if (typeof contentString !== "string") {
    throw new Error("Model content is not a string");
  }

  // Strip ```json fences if present
  let s = contentString.trim();
  s = s.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  s = s.replace(/```$/i, "").trim();

  // If there’s extra text, try to extract the first JSON object
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model output");
  }

  const jsonSlice = s.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}