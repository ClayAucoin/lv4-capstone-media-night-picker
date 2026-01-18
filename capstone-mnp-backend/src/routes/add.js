// src/routes/add.js

import express from "express"
import { sendError } from "../utils/sendError.js"
// import { validateInsert } from "../middleware/validators.js"
import supabase from "../utils/supabase.js"
import { dummyAddDataSets } from "../data/dummy-add-data/data-add-sets.js"

const router = express.Router()

const SETS_TABLE = "lv4_cap_recommendation_sets"
const RECOMMENDATIONS_TABLE = "lv4_cap_recommendations"

router.post("/add", async (req, res, next) => {
  console.log("POST /add")
  const newItem = req.body

  // console.log("newItem:", newItem)

  const inputParameters = newItem.inputParameters
  const incomingData = newItem.data.recommendations


  // payload for insert
  const setsPayload = {
    length_bucket: inputParameters.len_bkt,
    weather_bucket: normalizeCondition(inputParameters.wx_bkt),
    moods: inputParameters.moods,
    prompt_version: inputParameters.prompt_version,
    variant: "default",
    inputParameters
  }

  // build signature for query_signature lookup
  const query_signature = buildQuerySignature({
    moods: inputParameters.moods,
    length: inputParameters.len_bkt,
    weather: normalizeCondition(inputParameters.wx_bkt),
    pv: inputParameters.prompt_version,

  })

  // query_signature check
  const { data: ck_qs, error: ck_err } = await supabase
    .from(SETS_TABLE)
    .select("id, query_signature")
    .eq("query_signature", query_signature)
    .limit(1)

  if (ck_err) {
    console.error("checkQuerySignature error:", ck_err.message)
    return next(sendError(500, "Failed to read data", "READ_ERROR", { underlying: error.message }))
  }

  let newPayload, recommendations_data_out, message
  if (ck_qs.length === 0) {
    // insert set payload
    const { data: sets_data, error: ins_err } = await supabase
      .from(SETS_TABLE)
      .insert(setsPayload)
      .select("id, query_signature")
      .maybeSingle()

    if (ins_err) return next(sendError(500, "Failed to add sets data", "INSERT_ERROR", { underlying: ins_err.message }))

    message = "Recommendation set added."

    // build new payload with set id added
    newPayload = buildRecoInsertRows(incomingData, sets_data.id)

    // insert recommendation payload
    const { data: recommendations_data, error: recommendations_err } = await supabase
      .from(RECOMMENDATIONS_TABLE)
      .insert(newPayload)
      .select()

    if (recommendations_err) return next(sendError(500, "Failed to add recommendations", "INSERT_ERROR", { underlying: recommendations_err.message }))

    message = message + " Movies added successfully."
    recommendations_data_out = recommendations_data
  } else {
    const { data: existing_recs_data, error: existing_recs_err } = await supabase
      .from(RECOMMENDATIONS_TABLE)
      .select()
      .eq("set_id", ck_qs[0].id)

    if (existing_recs_err) return next(sendError(500, "Failed to read recommendations", "READ_ERROR", { underlying: existing_recs_err.message }))

    message = "Movies retrieved successfully."
    recommendations_data_out = existing_recs_data
  }

  res.status(201).json({
    ok: true,
    records: recommendations_data_out.length,
    message: message,
    data: {
      recommendations: recommendations_data_out
    }
  })
})

export default router

function normalizeCondition(string) {
  const wx_bucket = (string ?? "").trim().toUpperCase().replace(/\s+/g, "_")

  return wx_bucket
}

// format moods for signature
function normalizeMoods(moods = []) {
  return moods
    .map((m) => m.toLowerCase().trim())
    .sort()
    .join(",")
}

// format signature for lookup
function buildQuerySignature({ moods = [], length, weather, pv = "v0", variant = "default", }) {
  const parts = []
  if (moods.length) parts.push(`moods=${normalizeMoods(moods)}`)
  if (length) parts.push(`len=${length}`)
  if (weather) parts.push(`wx=${weather}`)
  parts.push(`pv=${pv}`)
  parts.push(`var=${variant}`)
  return parts.join("|")
}

// build payload of movies to insert
function buildRecoInsertRows(aiMovies, setId) {
  if (!Array.isArray(aiMovies)) throw new Error("movies must be an array")
  if (!setId) throw new Error("setId is required")

  return aiMovies.map((m, i) => ({
    set_id: setId,

    title: typeof m.title === "string" ? m.title.trim() : null,
    year: Number.isFinite(Number(m.year)) ? Number(m.year) : null,
    reason: typeof m.reason === "string" ? m.reason.trim() : null,

    trakt_type: typeof m.trakt_type === "string" ? m.trakt_type.trim() : null,
    trakt_slug: typeof m.trakt_slug === "string" ? m.trakt_slug.trim() : null,

    tmdb_id: m.tmdb_id ?? null,
    imdb_id: typeof m.imdb_id === "string" ? m.imdb_id.trim() : null,
  }))
}