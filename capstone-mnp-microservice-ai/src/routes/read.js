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
  const wx_bucket = "SUNNY"
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

Input (user request):
- requested_moods: ${JSON.stringify(moods)}   (must be from allowed moods; lowercase)
- length_requirement: ${len_bucket}  (use this exact enum in output)
- weather_context: ${wx_bucket}      (use this exact enum in output)
- count: ${count}

Rules:
- Return exactly ${count} recommendations.
- Prefer widely-known real movies. If unsure, pick mainstream titles. Do not invent runtimes or plot facts.
- Every recommendation MUST set:
  - "length_bucket" exactly as "${len_bucket}"
  - "weather_bucket" exactly as "${wx_bucket}"
- The "moods" array must contain 1 or 2 values ONLY from requested_moods (no other moods).
- "reason" must be 1-2 practical sentences connecting mood + weather vibe + runtime.
- Do NOT output any enum value outside the allowed lists. If you cannot comply, return:
  {"prompt_version":"v1","recommendations":[]}

Self-check before output:
- length_bucket is exactly "${len_bucket}" for every item
- weather_bucket is exactly "${wx_bucket}" for every item
- moods are only from requested_moods

Output JSON schema EXACTLY:
{
  "prompt_version": "v1",
  "recommendations": [
    {
      "title": "string",
      "year": 2000,
      "length_bucket": "LT_90",
      "moods": ["chill"],
      "weather_bucket": "RAIN",
      "reason": "string"
    }
  ]
}
`.trim();


  // Rules:
  // - Return exactly ${count} recommendations.
  // - Each recommendation must be an actual movie. Do not use fictional information.
  // - Each recommendation must be ${LENGTH_BUCKET_LABELS[len_bucket]}.
  // - Each recommendation must fit the ${moods} vibe for a ${wx_bucket} day.
  // - Keep reasons short (1-2 sentences), practical, not cheesy.
  // - No markdown. No extra keys.

  // Return STRICT JSON only with this example shape:
  // {
  //   "prompt_version": "v1",
  //   "recommendations": [
  //     {
  //       "title": "string",
  //       "year": 2000,
  //       "length_bucket": "LT_90",
  //       "moods": ["chill", "funny"],
  //       "weather_bucket": "RAIN",
  //       "reason": "string"
  //     }
  //   ]
  // }`.trim()

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
      raw: data,
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