// src/utils/resolvePosters.js

import supabase from "../utils/supabaseClient.js"
import { config } from "../config.js"

const TRAKT_CLIENT_ID = config.trakt_client_id
const TMDB_API_KEY = config.tmdb_api_key

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p" // sizes: w185, w342, w500, w780, original

function posterUrlFromPath(path, size = "w500") {
  if (!path) return null
  return `${TMDB_IMG_BASE}/${size}${path}`
}

async function fetchTmdbMovieDetails(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
  const res = await fetch(url)
  const body = await res.text()
  if (!res.ok) throw new Error(`TMDB details failed (${res.status}): ${body.slice(0, 200)}`)
  return JSON.parse(body)
}

async function fetchTraktMovieBySlug(slug) {
  const url = `https://api.trakt.tv/movies/${encodeURIComponent(slug)}?extended=full`
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": TRAKT_CLIENT_ID,
      // Authorization: `Bearer ${process.env.TRAKT_ACCESS_TOKEN}`, // only if needed
    },
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Trakt movie fetch failed (${res.status}): ${body.slice(0, 200)}`)
  return JSON.parse(body)
}

/**
 * Resolve poster_path + ids for one recommendation.
 * Returns: { ...rec, tmdb_id, imdb_id, trakt_slug, poster_path, poster_url }
 */
export async function resolveOneRecommendation(rec, { posterSize = "w500" } = {}) {
  let tmdbId = rec.tmdb_id && rec.tmdb_id !== 0 ? rec.tmdb_id : null
  let imdbId = rec.imdb_id && rec.imdb_id !== "" ? rec.imdb_id : null
  let traktSlug = rec.trakt_slug || null

  // 1) If tmdb_id missing but trakt_slug present, resolve ids from Trakt
  if (!tmdbId && traktSlug) {
    const traktMovie = await fetchTraktMovieBySlug(traktSlug)
    tmdbId = traktMovie?.ids?.tmdb ?? null
    imdbId = traktMovie?.ids?.imdb ?? imdbId
  }

  // 2) If we have tmdb_id, pull poster_path from TMDB
  let posterPath = null
  if (tmdbId) {
    const tmdbDetails = await fetchTmdbMovieDetails(tmdbId)
    posterPath = tmdbDetails?.poster_path ?? null
  }

  const posterUrl = posterUrlFromPath(posterPath, posterSize)

  return {
    ...rec,
    trakt_slug: traktSlug,
    tmdb_id: tmdbId ?? 0,
    imdb_id: imdbId ?? "",
    poster_path: posterPath,
    poster_url: posterUrl,
  }
}

export async function resolveAndCacheRecommendations(recommendations, { posterSize = "w500" } = {}) {
  const resolved = []

  for (const rec of recommendations) {
    const out = await resolveOneRecommendation(rec, { posterSize })
    resolved.push(out)

    // Cache in Supabase if you have a movies table row to update.
    // You need a stable key to find the row. tmdb_id is great once you have it.
    if (out.tmdb_id && out.tmdb_id !== 0) {
      await supabase
        .from("movies")
        .upsert(
          {
            tmdb_id: out.tmdb_id,
            imdb_id: out.imdb_id || null,
            trakt_slug: out.trakt_slug,
            poster_path: out.poster_path,
            poster_source: "tmdb",
            poster_updated_at: new Date().toISOString(),
            // optionally title/year too if you're maintaining a canonical cache table
            title: out.title,
            year: out.year,
          },
          { onConflict: "tmdb_id" }
        )
    }
  }

  return resolved
}
