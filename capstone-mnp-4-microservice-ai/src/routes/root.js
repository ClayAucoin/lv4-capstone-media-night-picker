// src/routes/root.js

import express from "express"

const router = express.Router()

// ---- root route ----
// app.get('/', validateAPIKey, (req, res) => {
router.get('/', (req, res) => {
  console.log('GET /')
  res.json({
    title: 'Media Night Planner AI Express Backend Running.',
    message: 'This endpoint returns a list of movies matching the search parameters with AI reasoning for its picking.',
  })
})

export default router