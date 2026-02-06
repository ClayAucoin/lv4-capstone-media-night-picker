// src/utils/sanitize.js

const DEFAULT_REDACT_KEYS = new Set([
  "password", "pass", "token", "access_token", "refresh_token",
  "api_key", "apikey", "authorization", "cookie", "set-cookie",
  "client_secret", "secret"
])

export function sanitize(value, opts = {}) {
  const {
    redactKeys = DEFAULT_REDACT_KEYS,
    maxString = 300,
    maxArray = 20,
    maxDepth = 4,
  } = opts

  function walk(v, depth) {
    if (depth > maxDepth) return "[truncated:depth]"

    if (v == null) return v

    if (typeof v === "string") {
      return v.length > maxString ? v.slice(0, maxString) + "…[truncated]" : v
    }

    if (typeof v === "number" || typeof v === "boolean") return v

    if (Array.isArray(v)) {
      const out = v.slice(0, maxArray).map((item) => walk(item, depth + 1))
      if (v.length > maxArray) out.push(`…[+${v.length - maxArray} more]`)
      return out
    }

    if (typeof v === "object") {
      const out = {}
      for (const [k, val] of Object.entries(v)) {
        if (redactKeys.has(k.toLowerCase())) out[k] = "[REDACTED]"
        else out[k] = walk(val, depth + 1)
      }
      return out
    }

    return String(v)
  }

  return walk(value, 0)
}
