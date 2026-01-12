// src/utils/validators.js

import { sendError } from "../utils/sendError.js"
import { config } from "../config.js"

export function validateId(req, res, next) {
  // console.log("validateId: id:", req.params.id, "typeof:", typeof req.params.id)
  const rawId = req.params.id
  const numId = Number(rawId)

  // not integer
  if (!Number.isInteger(numId)) { return next(sendError(400, `'id' must be an integer`, "INVALID_ID", { value: rawId })) }

  // no negative or zero ids
  if (numId <= 0) { return next(sendError(400, `"id" must be greater than 0`, "INVALID_ID", { value: numId })) }

  next();
}

export function validateWxAPIKey(req, _res, next) {
  // wsk = Weather App Key
  const w_s_k = config.wx_api_key
  const wskQuery = req.query?.key
  const wskHeaders = req.headers['x-api-key']

  console.log("wskHeaders:", wskHeaders)

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

  console.log("wskHeaders:", aiskHeaders)

  const isValid = aiskQuery === ai_s_k || aiskHeaders === ai_s_k
  if (!aiskQuery && !aiskHeaders) { return next(sendError(401, "Not authorized.", "MISSING_API_TOKEN")) }
  if (!isValid) { return next(sendError(401, "Not authorized.", "INVALID_API_TOKEN")) }
  next()
}

export function validateMovieBody(req, res, next) {

  if (!req.body || Object.keys(req.body).length === 0) {
    return next(sendError(400, "Request body is required", "MISSING_BODY"))
  }

  // console.log("id:", id, "typeof:", typeof id)
  const { id, imdb_id, title, year } = req.body

  const missing = []
  // if (id === undefined) missing.push("id")
  if (!title) missing.push("title")
  if (!year) missing.push("year")

  if (missing.length > 0) { return next(sendError(422, "Missing required fields", "VALIDATION_ERROR", { missing })) }

  // id must be number, deactivated, using incremental for add
  // if (typeof id !== "number") { return next(sendError(422, `'id' must be a number`, "INVALID_TYPE", { field: "id", value: id })) }

  // year must be number
  if (typeof year !== "number") { return next(sendError(422, `'year' must be a number`, "INVALID_TYPE", { field: "year", value: year })) }

  // year > 1900
  if (year < 1900) { return next(sendError(422, `'year' must be greater than 1900`, "INVALID_VALUE", { field: "year", value: year })) }

  next()
}