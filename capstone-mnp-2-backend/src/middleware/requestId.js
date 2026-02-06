// src/middleware/guarantee-id.js

import { randomUUID } from "crypto"

export function requestId(req, res, next) {
  const incoming = req.get("x-request-id")
  req.req_id = incoming || randomUUID()
  res.setHeader("x-request-id", req.req_id)
  next()
}
