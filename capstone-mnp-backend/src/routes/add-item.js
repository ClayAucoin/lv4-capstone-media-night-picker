// src/routes/add-item.js

import express from "express"
import data from "../data.js"
import { validateMovieBody } from "../middleware/validators.js"
import { sendError } from "../utils/sendError.js";

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }))

router.get("/", (req, res, next) => {
  try {
    console.log("GET /add-item")
    res.status(200).json({
      ok: true,
      message: "Nothing added",
      data: data
    })
  } catch (err) {
    next(sendError(500, "Failed to read data", "READ_ERROR"))
  }
})

router.post("/", validateMovieBody, (req, res, next) => {
  try {
    console.log("POST /add-item", req.body)
    const newMovie = req.body
    data.push(newMovie)

    res.status(200).json({
      ok: true,
      message: "Movie added successfuly",
      data: newMovie
    })
  } catch (err) {
    next(sendError(500, "Failed to add data", "WRITE_ERROR"))
  }
})

export default router