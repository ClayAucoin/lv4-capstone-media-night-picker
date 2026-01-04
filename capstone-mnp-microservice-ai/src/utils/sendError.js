// src/utils/sendError.js

export function sendError(status, message, code = "ERROR", details = null) {
  const err = new Error(message)
  err.status = status
  err.code = code
  if (details) { err.details = details }
  return err
}
