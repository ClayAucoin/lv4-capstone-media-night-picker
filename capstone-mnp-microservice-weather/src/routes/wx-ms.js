// src/routes/read.js

import express from "express"
import { validateAPIKey, validateWeatherVars } from "../middleware/validators.js"
import { requestId } from "../middleware/requestId.js"
import { config } from "../config.js"
import { sendError } from "../utils/sendError.js"

const router = express.Router()

// ---- POST /api/v1/weather route ----
router.post('/', validateAPIKey, requestId, validateWeatherVars, async (req, res, next) => {
  console.log('POST /api/v1/weather')
  const req_id = req.req_id

  const { zip, dateString } = req.weatherParams

  req.log.info({ req_id: req_id, route: "/weather", file: "wx-ms.js", req_weatherParams: req.weatherParams, step: "wx-ms: req.weatherParams" }, "parameters")

  const apiKey = config.weather_key
  const baseUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${zip}/${dateString}`;
  const fetchUrl = `${baseUrl}?unitGroup=us&include=current&contentType=json&key=${apiKey}`;

  req.log.info({ req_id: req_id, route: "/weather", file: "wx-ms.js", baseUrl: baseUrl, step: "wx-ms: baseUrl" }, "WX URL")

  try {
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
      return next(sendError(502, "Upstream returned non-JSON response", "UPSTREAM_NON_JSON", {
        upstreamStatus: result.status,
        upstreamBody: rawBody.slice(0, 300)
      }))
    }

    // const data = await result.json()
    const dayData = data.days && data.days[0]
    const current = data.currentConditions

    if (!dayData && !current) {
      return res.status(404).json({
        ok: true,
        message: "No weather data found for that date.",
        date: dateString
      })
    }
    const source = dayData || current

    const sendData = {
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
    req.log.info({ req_id: req_id, route: "/weather", file: "wx-ms.js", sendData: sendData, step: "wx-ms: sendData" }, "variable")

    res.json(sendData)
  } catch (err) {
    console.error(err)
    return next(sendError(500, "Internal server error", "INTERNAL_ERROR_MS_WX", {
      underlying: err.message
    }))
  }
})

export default router