// src/utils/validators-keys.js

import { sendError } from "../utils/sendError.js"
import { config } from "../config.js"

export function validateWxAPIKey(req, _res, next) {
  // wsk = Weather App Key
  const w_s_k = config.wx_api_key
  const wskQuery = req.query?.key
  const wskHeaders = req.headers['x-api-key']

  const isValid = wskQuery === w_s_k || wskHeaders === w_s_k
  if (!wskQuery && !wskHeaders) { return next(sendError(401, "Not authorized.", "MISSING_API_TOKEN")) }
  if (!isValid) { return next(sendError(401, "Not authorized.", "INVALID_API_TOKEN")) }
  next()
}

export function validateAIAPIKey(req, _res, next) {
  // aisk = AI App Key
  const ai_s_k = config.ai_api_key
  const aiskQuery = req.query?.key
  const aiskHeaders = req.headers['x-api-key']

  const isValid = aiskQuery === ai_s_k || aiskHeaders === ai_s_k
  if (!aiskQuery && !aiskHeaders) { return next(sendError(401, "Not authorized.", "MISSING_API_TOKEN")) }
  if (!isValid) { return next(sendError(401, "Not authorized.", "INVALID_API_TOKEN")) }
  next()
}

