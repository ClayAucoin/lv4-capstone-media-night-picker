// src/routes/read.js

import express from "express"
import { validateAPIKey, validateWeatherQuery } from "../middleware/validators.js"
import { config } from "../config.js"
import { sendError } from "../utils/sendError.js"

const router = express.Router()

// ---- GET /api/v1/weather route ----
router.get('/', validateAPIKey, validateWeatherQuery, async (req, res, next) => {
  console.log('GET /api/v1/weather')
  const { zip, dateString } = req.weatherParams

  // console.log("date:", dateString)

  const apiKey = config.weather_key
  const baseUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${zip}/${dateString}`;
  const fetchUrl = `${baseUrl}?unitGroup=us&include=current&contentType=json&key=${apiKey}`;

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

    res.json({
      reqDate: dateString,
      temp: source.temp,
      precipitation: source.precip,
      conditions: source.conditions,
      icon: source.icon,
      sunrise: source.sunrise,
      sunset: source.sunset,
      description: dayData?.description || source.conditions,
      // raw: data,
    })
  } catch (err) {
    console.error(err)
    return next(sendError(500, "Internal server error", "INTERNAL_ERROR", {
      underlying: err.message
    }))
  }
})

export default router