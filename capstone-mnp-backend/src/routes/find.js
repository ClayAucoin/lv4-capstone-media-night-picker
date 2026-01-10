// src/routes/find.js

import express from "express"
import data from "../data.js"
import { sendError } from "../utils/sendError.js"
import { validateId } from "../middleware/validators.js"

const router = express.Router()
router.use(express.json());

router.get("/:id", validateId, (req, res, next) => {
  console.log("GET /find/id")

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
})

export default router