// src/routes/read-wx.js

import express from "express"
import { sendError } from "../utils/sendError.js"
import { validateWxAPIKey } from "../middleware/validator-keys.js"
import { validateWeatherVars } from "../middleware/validator-wx.js"
import { parseBoolean } from '../utils/helpers.js'
import { requestId } from "../middleware/requestId.js"
import { config } from "../config.js"

const router = express.Router()

router.post("/wx", requestId, validateWxAPIKey, validateWeatherVars, async (req, res, next) => {
  const req_id = req.req_id
  const local = parseBoolean(req.query.l)

  let baseUrl
  if (!local) {
    baseUrl = "https://weather.clayaucoin.foo/api/v1/weather?"
  } else {
    baseUrl = "http://localhost:3100/api/v1/weather?"
  }
  req.log.info({ req_id: req_id, route: "/wx", file: "read-ws.js", baseUrl: baseUrl, step: "bk-wx: baseUrl" }, "URL")

  const { zip, dateString } = req.weatherParams
  req.log.info({ req_id: req_id, route: "/wx", file: "read-ws.js", req_weatherParams: req.weatherParams, step: "bk-wx: req.weatherParams" }, "parameters")

  const apiHeader = config.wx_api_key

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiHeader,
      },
      body: JSON.stringify({
        "zip": zip,
        "date": dateString
      }),
    })
    const data = await response.json()
    console.log("POST /read-wx")

    const sendData = {
      ok: true,
      local: local,
      data: data,
      conditions: data.conditions
    }

    req.log.info({ req_id: req_id, route: "/wx", file: "read-ws.js", sendData: sendData, step: "bk-wx: sendData" }, "variable")

    res.status(200).json(sendData)
  } catch (err) {
    next(sendError(500, "Internal server error", "INTERNAL_ERROR_BKEND_WX", { underlying: err.stack }))
  }
})

export default router

