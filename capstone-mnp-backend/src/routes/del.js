// src/routes/del.js

import express from "express"
import movies from "../data.js"
import { validateId } from "../middleware/validators.js";
import { sendError } from "../utils/sendError.js";

const router = express.Router()
router.use(express.json());

router.delete("/:id", validateId, (req, res, next) => {
  console.log("DELETE /items")
  const id = Number(req.params.id)

  const removed = deleteItemById(id)

  if (!removed) {
    return next(sendError(404, "Movie not found", "NOT_FOUND"))
  }

  res.status(200).json({
    ok: true,
    message: "Movie deleted successfully",
    data: removed
  })
})

// helper: delete movie
export function deleteItemById(id) {
  const index = movies.findIndex((movie) => movie.id === id)

  if (index === -1) {
    return null
  }

  const [removed] = movies.splice(index, 1)
  return removed
}

export default router