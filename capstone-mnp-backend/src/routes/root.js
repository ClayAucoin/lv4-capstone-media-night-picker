// src/routes/root.js

import express from "express"
import { sendError } from "../utils/sendError.js"

const router = express.Router()

router.get("/", (req, res, next) => {
  console.log("GET /root")
  let response = "<h1>MNP Backend Express Server Running</h1>"
  // console.log(response)

  res.status(200).send(response)
})

export default router