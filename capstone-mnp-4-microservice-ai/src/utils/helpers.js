// src/utils/helpers.js

export function parseModelJson(contentString) {
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

export function parseBoolean(value = "true") {
  const v = value.toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return value
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

