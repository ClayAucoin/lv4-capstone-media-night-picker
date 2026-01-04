// src/routes/del-item.js

import express from "express"
import movies from "../data.js"
import { validateId } from "../middleware/validators.js";
import { sendError } from "../utils/sendError.js";

const router = express.Router()
router.use(express.json());

router.get("/", (req, res) => {
  try {
    console.log("GET /del-item")
    res.status(200).json({
      ok: true,
      message: "Nothing deleted",
      data: movies
    })
  } catch (err) {
    next(sendError(500, "Failed to read data", "READ_ERROR"))
  }
})

router.delete("/", (req, res, next) => {
  try {
    console.log("DELTE /del-item")
    return next(sendError(400, "'id' parameter is required", 'MISSING_ID'))
  } catch (err) {
    next(sendError(500, "Failed to read data", "READ_ERROR"))
  }
})

router.delete("/:id", validateId, (req, res, next) => {
  try {
    console.log("DELETE /del-item")
    const id = Number(req.params.id)

    const removed = deleteMovieById(id)

    if (!removed) {
      return next(sendError(404, "Movie not found", "NOT_FOUND"))
    }

    res.status(200).json({
      ok: true,
      message: "Movie deleted successfully",
      data: removed
    })
  } catch (err) {
    next(sendError(500, "Failed to delete movie", "REMOVE_ERROR"))
  }
})

// helper: delete movie
export function deleteMovieById(id) {
  const index = movies.findIndex((movie) => movie.id === id)

  if (index === -1) {
    return null
  }

  const [removed] = movies.splice(index, 1)
  return removed
}

export default router