// src/routes/ms-wx-3100.js
// MOVED BACK TO 3100

import express from "express"
import { validateVCAPIKey } from "../../middleware/validator-keys.js"
import { validateWeatherVars } from "../../middleware/validator-wx.js"
import { parseBoolean } from "../../utils/helpers.js"
import { requestId } from "../../middleware/requestId.js"
import { config } from "../../config.js"
import { sendError } from "../../utils/sendError.js"

const router = express.Router()

// ---- POST /api/v1/weather route ----
router.post('/weather', validateVCAPIKey, requestId, validateWeatherVars, async (req, res, next) => {
  const useLocal = parseBoolean(req.query.l)
  const isTesting = parseBoolean(req.query.t)

  console.log(`POST /api/v1/weather testing: ${isTesting}, local: ${useLocal}`)
  const req_id = req.req_id

  const { zip, dateString } = req.weatherParams

  req.log.info({ req_id: req_id, route: "/weather", file: "ms-wx.js", req_weatherParams: req.weatherParams, step: "ms-wx: req.weatherParams" }, "parameters")

  const apiKey = config.vc_weather_key
  const baseUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${zip}/${dateString}`;
  const fetchUrl = `${baseUrl}?unitGroup=us&include=current&contentType=json&key=${apiKey}`;

  req.log.info({ req_id: req_id, route: "/weather", file: "ms-wx.js", baseUrl: baseUrl, step: "ms-wx: baseUrl" }, "WX URL")

  const result = await fetch(fetchUrl)
  const rawBody = await result.text();

  if (!result.ok) {
    return next(sendError(502, "Upstream weather provider error", "UPSTREAM_ERROR", {
      upstreamStatus: result.status,
      upstreamStatusText: result.statusText,
      upstreamBody: rawBody.slice(0, 300)
    }))
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    return next(sendError(502, "Upstream returned non-JSON response", "UPSTREAM_NON_JSON", { upstreamStatus: result.status, upstreamBody: rawBody.slice(0, 300) }))
  }

  const dayData = data.days && data.days[0]
  const current = data.currentConditions

  if (!dayData && !current) return res.status(404).json({ ok: true, message: "No weather data found for that date.", date: dateString })

  const source = dayData || current

  const sendData = {
    req_id: req_id,
    reqDate: dateString,
    temp: source.temp,
    precipitation: source.precip,
    conditions: source.conditions,
    icon: source.icon,
    sunrise: source.sunrise,
    sunset: source.sunset,
    description: dayData?.description || source.conditions,
    // raw: data,
  }
  req.log.info({ req_id: req_id, route: "/weather", file: "ms-wx.js", sendData: sendData, step: "ms-wx: sendData" }, "sendData")

  res.json(sendData)
})

export default router