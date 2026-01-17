// src/Components/Display.jsx

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"
import { posterFromTraktMovieSlug } from "../utils/getPoster"
// import supabase from "../utils/supabase.js"

export default function Display() {
  const { results, isTesting } = useAuth()
  const navigate = useNavigate()
  const [postersByImdb, setPostersByImdb] = useState({})

  const resultDisplay = results?.data?.recommendations
  if (results?.length === 0 || resultDisplay?.length === 0) navigate("/form")

  useEffect(() => {
    if (!resultDisplay?.length) {
      navigate("/form")
      return
    }
    let cancelled = false

    ;(async () => {
      // setIsLoading(true)
      try {
        const entries = await Promise.all(
          resultDisplay.map(async (r) => {
            const traktId = `${r.trakt_slug}-${r.year}`
            const url = await posterFromTraktMovieSlug(traktId)
            return [r.imdb_id, url]
          })
        )

        if (!cancelled) {
          setPostersByImdb(Object.fromEntries(entries))
        }
      } finally {
        // if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resultDisplay, navigate])

  return (
    <div>
      <div className="row">
        <div className="col">
          <Link to="/form">Search Again</Link>
        </div>
      </div>
      <div>
        <ul className="list-group">
          {resultDisplay?.map((result) => {
            // const traktId = `${result.trakt_slug}-${result.year}`
            const posterUrl =
              postersByImdb[result.imdb_id] || "/poster-fallback.png"

            return (
              <li key={result.imdb_id} className="list-group-item json-display">
                <div className="row mb-2">
                  <div className="col-2 d-flex justify-content-center align-items-center">
                    <img
                      className="rounded poster"
                      src={posterUrl}
                      alt={`${result.title} poster`}
                    />
                  </div>

                  <div className="col-10">
                    {/* <small>
                      {`posterUrl: ${posterUrl}`}
                      <br />
                      {`traktId: ${traktId}`}
                      <br />
                    </small> */}
                    {result.title} ({result.year})
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
      {isTesting && (
        <div>
          <pre className="signature-display">
            {resultDisplay ? JSON.stringify(resultDisplay, null, 2) : ""}
          </pre>
        </div>
      )}
    </div>
  )
}
