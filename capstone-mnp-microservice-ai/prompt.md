## OpenAI fectch

```js
// microservice/src/routes/ai.js
import express from "express"
import OpenAI from "openai"

const router = express.Router()
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.post("/api/v1/ai/recommendations", async (req, res, next) => {
  try {
    const {
      moods,
      length_bucket,
      weather_bucket,
      prompt_version = "v1",
      variant = "default",
      count = 8,
    } = req.body

    // Build prompt (keep it deterministic)
    const prompt = `
Generate ${count} movie-night recommendations.

Preferences:
- moods: ${JSON.stringify(moods)}
- length_bucket: ${length_bucket}
- weather_bucket: ${weather_bucket}

Return STRICT JSON only with this shape:
{
  "prompt_version": "${prompt_version}",
  "variant": "${variant}",
  "recommendations": [
    { "title": "string", "year": 2000, "reason": "string" }
  ]
}
No markdown. No extra keys.
`.trim()

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: prompt,
    })

    // The SDK returns a structured object; easiest is to extract text and JSON.parse it.
    // In production you’d add more guardrails, but this is capstone-appropriate.
    const text = response.output_text
    const data = JSON.parse(text)

    return res.json(data)
  } catch (err) {
    return next(err)
  }
})

export default router
```

Generate movie night recommendations.

User preferences:

- moods: ["chill", "funny"]
- length_bucket: "LT_90" (under 90 minutes)
- weather_bucket: "RAIN"
- date_local: "2026-01-03" (for flavor only; do not mention forecasts)
  Rules:
- Return exactly 5 recommendations.
- Each recommendation must match the length_bucket.
- Each recommendation must fit the weather_bucket vibe.
- Keep reasons short (1-2 sentences), practical, not cheesy.
- Output MUST be valid JSON with this exact shape:

{
"prompt_version": "v1",
"recommendations": [
{
"title": "string",
"year": 2000,
"length_bucket": "LT_90",
"moods": ["chill", "funny"],
"weather_bucket": "RAIN",
"reason": "string"
}
]
}
