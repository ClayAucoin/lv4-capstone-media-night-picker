// src/routes/find-item.js

import express from "express"
import data from "../data.js"
import { sendError } from "../utils/sendError.js"
import { validateId } from "../middleware/validators.js"

const router = express.Router()
router.use(express.json());

router.get("/", (req, res, next) => {
  try {
    console.log("GET /find-item")
    res.status(200).json({
      ok: true,
      data: data
    })
  } catch (err) {
    next(sendError(500, "Failed to read data", "READ_ERROR"))
  }
})

router.get("/:id", validateId, (req, res, next) => {
  try {
    console.log("GET /find-item/id")

    console.log("id:", req.params, "typeof:", typeof req.params)

    const id = Number(req.params.id)
    const movie = data.find((entry) => entry.id === id)

    if (!movie) {
      return next(sendError(404, "Movie not found", "NOT_FOUND"))
    }

    res.status(200).json({
      ok: true,
      data: movie
    })
  } catch (err) {
    next(sendError(500, "Failed to read data", "READ_ERROR"))
  }
})

export default router