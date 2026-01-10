// src/routes/add.js

import express from "express"
import data from "../data.js"
import { validateMovieBody } from "../middleware/validators.js"
import { sendError } from "../utils/sendError.js"
import { randomUUID } from 'node:crypto'

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }))

router.post("/", validateMovieBody, (req, res, next) => {
  console.log("POST /find", req.body)
  // to use randomUUID id 
  // const newMovie = req.body
  // const newItem = { ...req.body, id: randomUUID() }

  // to use incremental id
  const newId = data.length
  const newMovie = { ...req.body, id: newId }
  data.push(newMovie)

  res.status(200).json({
    ok: true,
    message: "Movie added successfuly",
    data: newMovie
  })
})

export default router