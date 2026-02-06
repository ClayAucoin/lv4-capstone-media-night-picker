// src/routes/root.js

import express from "express"

const router = express.Router()

// ---- root route ----
// app.get('/', validateAPIKey, (req, res) => {
router.get('/', (req, res) => {
  console.log('GET /')
  res.json({
    title: 'Media Night Planner Weather Express Backend Running.',
    message: 'This endpoint returns the weather for a specific date.',
    requiredParameters: {
      zip: '5-digit US ZIP code',
      date: 'Date in YYY-MM-DD format',
      key: 'Valid API key provided as a query parameter'
    },
    format: '/api/v1/weather?zip={zip}&year={YYY-MM-DD}&key={api_key}',
    example: '/api/v1/weather?zip=70123&date=2024-12-25&key=your_api_key'
  })
})

export default router