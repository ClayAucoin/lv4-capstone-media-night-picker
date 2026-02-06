// src/utils/sendError.js

export function sendError(
  status,
  message,
  code = "ERROR",
  details = undefined
) {
  const err = new Error(message)
  err.status = status
  err.code = code

  if (details !== undefined) {
    err.details = details
  }

  return err
}

