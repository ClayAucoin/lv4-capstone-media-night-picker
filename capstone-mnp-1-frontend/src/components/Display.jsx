// src/Components/Display.jsx

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"
import { posterFromTraktMovieSlug } from "../utils/getPoster.js"
import posterFallback from "../assets/poster-fallback.png"

function posterKeyFor(r) {
  const slug = r?.trakt_slug
  const year = r?.year

  if (!slug) return null

  // if slug already ends with -YYYY, keep it
  if (/-\d{4}$/.test(slug)) return slug

  // otherwise append year if present
  return year ? `${slug}-${year}` : slug
}

export default function Display() {
  const { results, payload } = useAuth()
  const navigate = useNavigate()
  const [postersByImdb, setPostersByImdb] = useState({})
  const [showRaw, setShowRaw] = useState(false)

  const resultDisplay = results?.data?.recommendations

  useEffect(() => {
    if (!Array.isArray(resultDisplay) || resultDisplay.length === 0) {
      navigate("/form", { replace: true })
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const settled = await Promise.allSettled(
          resultDisplay.map(async (r) => {
            const key = posterKeyFor(r)
            if (!key) return null // skip null trakt_slug

            const url = await posterFromTraktMovieSlug(key)
            return [key, url ?? posterFallback]
          }),
        )

        const entries = settled
          .filter((x) => x.status === "fulfilled" && x.value)
          .map((x) => x.value)

        if (!cancelled) {
          setPostersByImdb(Object.fromEntries(entries))
        }
      } catch (e) {
        console.error(e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resultDisplay, navigate])

  return (
    <div>
      <div className="row">
        <div className="col-12 text-center">
          <h4>
            <Link to="/form">Search Again</Link>
          </h4>
        </div>
      </div>
      <div>
        <ul className="list-group">
          {resultDisplay?.map((result) => {
            const key = posterKeyFor(result) || `${result.title}-${result.year}`
            const posterUrl = postersByImdb[key] || posterFallback

            return (
              <li
                key={key}
                className="list-group-item list-group-item-light json-display"
              >
                <div className="row mb-2 border border-0">
                  <div className="col-2 d-flex justify-content-center align-items-center">
                    <img
                      className="rounded poster"
                      src={posterUrl}
                      alt={`${result.title} poster`}
                    />
                  </div>

                  <div className="col-10">
                    <h1 className="fs-5 fw-semibold inline-block">
                      {result.title}{" "}
                    </h1>
                    <h3 className="fs-5 fw-semibold text-muted inline-block">
                      <small>({result.year})</small>
                    </h3>
                    <br />
                    <ul>
                      <li>{result.reason}</li>
                    </ul>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="form-check mt-0">
        <input
          className="form-check-input"
          type="checkbox"
          id="showRawJson"
          checked={showRaw}
          onChange={(e) => setShowRaw(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="showRawJson">
          Show raw JSON
        </label>
      </div>
      {showRaw && payload && resultDisplay && (
        <div>
          <div className=" mt-3 p-3 bg-light border rounded">
            <h6>
              <small>payload</small>
            </h6>
            <pre className="signature-display">
              {payload ? JSON.stringify(payload, null, 2) : ""}
            </pre>
          </div>
          <div className=" mt-3 p-3 bg-light border rounded">
            <h6>
              <small>movie data</small>
            </h6>
            <pre className="signature-display">
              {resultDisplay ? JSON.stringify(resultDisplay, null, 2) : ""}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
