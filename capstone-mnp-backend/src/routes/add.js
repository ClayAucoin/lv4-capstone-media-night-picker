// src/routes/add.js

import express from "express"
import { sendError } from "../utils/sendError.js"
// import { validateInsert } from "../middleware/validators.js"
import { parseBoolean, normalizeCondition, normalizeMoods, buildRecordInsertRows } from "../utils/helpers.js"
import { requestId } from "../middleware/requestId.js"
import supabase from "../utils/supabase.js"

const router = express.Router()

const SETS_TABLE = "lv4_cap_recommendation_sets"
const RECOMMENDATIONS_TABLE = "lv4_cap_recommendations"

router.post("/add", requestId, async (req, res, next) => {
  const req_id = req.req_id
  const useLocal = parseBoolean(req.query.l)
  const isTesting = parseBoolean(req.query.t)
  const newItem = req.body

  console.log(`POST /add testing: ${isTesting}, local: ${useLocal}`)

  req.log.info({ req_id: req_id, route: "/add", file: "add.js", req_body: newItem, step: "bk-add route, req.body" }, "parameters")

  const inputParameters = newItem.inputParameters
  const incoming_recs = newItem.data.recommendations

  // payload for insert
  const setsPayload = {
    length_bucket: inputParameters.len_bkt,
    weather_bucket: normalizeCondition(inputParameters.wx_bkt),
    moods: inputParameters.moods,
    prompt_version: inputParameters.prompt_version,
    variant: "default",
    inputParameters,
    req_id: req_id,
  }
  req.log.info({ req_id: req_id, route: "/add", file: "add.js", setsPayload: setsPayload, step: "bk-add setsPayload" }, "setsPayload")

  let newPayload, rec_data_out, message

  // insert set payload
  const { data: sets_data, error: ins_err } = await supabase
    .from(SETS_TABLE)
    .insert(setsPayload)
    .select("id, query_signature")
    .maybeSingle()

  if (ins_err) return next(sendError(500, "Failed to add sets data", "INSERT_ERROR", { underlying: ins_err.message }))

  message = "Recommendation set added."
  req.log.info({ req_id: req_id, route: "/add", file: "add.js", sets_inserted: sets_data, records: sets_data.length, step: "bk-add: recommendation set added" }, "DB_ADD")

  // build new payload with set id added
  newPayload = buildRecordInsertRows(incoming_recs, sets_data.id)

  // insert recommendation payload
  const { data: rec_data, error: rec_err } = await supabase
    .from(RECOMMENDATIONS_TABLE)
    .insert(newPayload)
    .select()

  if (rec_err) return next(sendError(500, "Failed to add recommendations", "INSERT_ERROR", { underlying: rec_err.message }))

  message = message + " Recommendations added successfully."
  rec_data_out = rec_data
  req.log.info({ req_id: req_id, route: "/add", file: "add.js", records_inserted: rec_data, records: rec_data.length, step: "bk-add: recommendations added successfully" }, "DB_ADD")

  const sendData = {
    ok: true,
    req_id,
    isTesting: isTesting,
    useLocal,
    records: rec_data_out.length,
    message,
    data: {
      recommendations: rec_data_out
    }
  }
  console.log("sendData:", sendData)

  req.log.info({ req_id: req_id, route: "/add", file: "add.js", sendData: sendData, message: message, step: "add: sendData" }, "sendData")
  res.status(201).json(sendData)
})

export default router

