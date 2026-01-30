// src/middleware/validators.js

import { config } from '../config.js'
import { sendError } from "../utils/sendError.js"

export function validateAPIKey(req, _res, next) {
  // ask = App Service Key
  const a_s_k = config.app_service_key
  const askQuery = req.query?.key
  const askHeaders = req.headers['x-api-key']

  const isValid = askQuery === a_s_k || askHeaders === a_s_k
  if (!askQuery && !askHeaders) { return next(sendError(401, "Not authorized.", "MISSING_API_TOKEN")) }
  if (!isValid) { return next(sendError(401, "Not authorized.", "INVALID_API_TOKEN")) }
  next()
}

const ALLOWED_MOODS = new Set([
  "chill", "funny", "intense", "romantic",
  "family", "uplifting", "mystery", "action",
])

const ALLOWED_LENGTHS = new Set([
  "LT_90", "B90_120", "B120_150", "GT_150",
])

function normalizeMoodsInput(input) {
  const arr = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : []

  return arr
    .map(m => String(m).trim().toLowerCase())
    .filter(Boolean)
}

export function validateMoodBucket(req, _res, next) {
  try {
    const raw = req.body?.moods

    const isTesting = parseBoolean(req.query.t)

    if (!isTesting) {
      if (raw == null || String(raw).trim() === "") {
        return next(sendError(
          400,
          "Mood bucket can't be empty",
          "MOOD_BUCKET_EMPTY",
          { allowed: [...ALLOWED_MOODS] }
        ))
      }

      const normalized = normalizeMoodsInput(raw)
      const unique = [...new Set(normalized)]
      const invalid = unique.filter(m => !ALLOWED_MOODS.has(m))

      if (invalid.length) {
        return next(sendError(
          400,
          `Invalid moods: ${invalid.join(", ")}`,
          "INVALID_MOODS",
          { invalid, allowed: [...ALLOWED_MOODS] }
        ))
      }

      req = req || {}
      req.moods = unique.sort()
    } else {
      req.moods = req.body.moods
    }

    next()
  } catch (err) {
    next(err)
  }
}

export function validateLengthBucket(req, _res, next) {
  try {
    const raw = req.body?.len_bkt

    const isTesting = parseBoolean(req.query.t)

    if (!isTesting) {
      if (raw == null || String(raw).trim() === "") {
        return next(sendError(
          400,
          "Length bucket can't be empty",
          "LENGTH_BUCKET_EMPTY",
          { allowed: [...ALLOWED_LENGTHS] }
        ))
      }

      const v = String(raw).trim().toUpperCase()
      if (!ALLOWED_LENGTHS.has(v)) {
        return next(sendError(
          400,
          `Invalid length bucket: ${v}`,
          "INVALID_LENGTH_BUCKET",
          { invalid: v, allowed: [...ALLOWED_LENGTHS] }
        ))
      }

      req = req || {}
      req.len_bkt = v
    } else {
      req.len_bkt = req.body.len_bkt
    }

    next()
  } catch (err) {
    next(err)
  }
}

export function validateWxBucket(req, _res, next) {
  try {
    const raw = req.body?.wx_bkt

    const isTesting = parseBoolean(req.query.t)

    if (!isTesting) {
      if (raw == null || String(raw).trim() === "") {
        return next(sendError(
          400,
          "Weather bucket can't be empty",
          "WEATHER_BUCKET_EMPTY"
        ))
      }

      req = req || {}
      req.wx_bkt = raw.trim().toUpperCase().replace(/\s+/g, " ")
    } else {
      req.wx_bkt = req.body.wx_bkt
    }

    next()
  } catch (err) {
    next(err)
  }
}

function parseBoolean(value = "true") {
  const v = value.toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return value
}

