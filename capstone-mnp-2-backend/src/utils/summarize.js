// src/utils/summarize.js

import { sanitize } from "./sanitize.js"

export function summarize(value) {
  if (value == null) return { type: "null" }

  if (Array.isArray(value)) {
    return {
      type: "array",
      count: value.length,
      sample: sanitize(value.slice(0, 2)),
    }
  }

  if (typeof value === "object") {
    const keys = Object.keys(value)
    return {
      type: "object",
      keys: keys.slice(0, 12),
      keyCount: keys.length,
    }
  }

  if (typeof value === "string") {
    return { type: "string", length: value.length, sample: sanitize(value) }
  }

  return { type: typeof value, value }
}
