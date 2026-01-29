// src utils/helpers.js

export function normalizeCondition(string) {
  const wx_bucket = (string ?? "").trim().toUpperCase().replace(/\s+/g, "_")

  return wx_bucket
}

// format moods for signature
export function normalizeMoods(moods = []) {
  return moods
    .map((m) => m.toLowerCase().trim())
    .sort()
    .join(",")
}

// format signature for lookup
export function buildQuerySignature({
  moods = [],
  length,
  weather,
  pv = "v0",
  variant = "default",
}) {
  const parts = []

  if (moods.length) {
    parts.push(`moods=${normalizeMoods(moods)}`)
  }

  if (length) {
    parts.push(`len=${length}`)
  }

  if (weather) {
    parts.push(`wx=${weather}`)
  }

  parts.push(`pv=${pv}`)
  parts.push(`var=${variant}`)

  return parts.join("|")
}

export function parseBoolean(value = "true") {
  const v = value.toLowerCase()
  if (v === "true") return true
  if (v === "false") return false
  return value
}

// build payload of movies to insert
export function buildRecoInsertRows(aiMovies, setId) {
  if (!Array.isArray(aiMovies)) throw new Error("movies must be an array")
  if (!setId) throw new Error("setId is required")

  return aiMovies.map((m, i) => ({
    set_id: setId,

    title: typeof m.title === "string" ? m.title.trim() : null,
    year: Number.isFinite(Number(m.year)) ? Number(m.year) : null,
    reason: typeof m.reason === "string" ? m.reason.trim() : null,

    trakt_type: typeof m.trakt_type === "string" ? m.trakt_type.trim() : null,
    trakt_slug: typeof m.trakt_slug === "string" ? m.trakt_slug.trim() : null,

    tmdb_id: m.tmdb_id ?? null,
    imdb_id: typeof m.imdb_id === "string" ? m.imdb_id.trim() : null,
  }))
}