// src/routes/add.js

import express from "express"
import { sendError } from "../utils/sendError.js"
// import { validateInsert } from "../middleware/validators.js"
import { normalizeCondition, normalizeMoods, buildRecoInsertRows } from "../utils/helpers.js"
import { requestId } from "../middleware/requestId.js"
import supabase from "../utils/supabase.js"
import { dummyAddDataSets } from "../data/dummy-add-data/data-add-sets.js"

const router = express.Router()

const SETS_TABLE = "lv4_cap_recommendation_sets"
const RECOMMENDATIONS_TABLE = "lv4_cap_recommendations"

router.post("/add", requestId, async (req, res, next) => {
  const req_id = req.req_id
  console.log("POST /add")
  const newItem = req.body

  req.log.info({ req_id: req_id, route: "/add", file: "add.js", req_body: newItem, step: "bk-add route, req.body" }, "parameters")

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
  req.log.info({ req_id: req_id, route: "/add", file: "add.js", setsPayload: setsPayload, step: "bk-add" }, "variable")

  let newPayload, recommendations_data_out, message

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

  const sendData = {
    ok: true,
    records: recommendations_data_out.length,
    message: message,
    data: {
      recommendations: recommendations_data_out
    }
  }

  req.log.info({ req_id: req_id, route: "/add", file: "add.js", sendData: sendData, message: message, step: "sbmt: sendData" }, "variable")
  res.status(201).json(sendData)
})

export default router

