// src/Components/FormFields.jsx

const SET_TABLE = "lv4_cap_recommendation_sets"
const WX_CONDITION = "Rain, Partially cloudy"

import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"
import { normalizeMoods } from "../utils/helpers.js"
import supabase from "../utils/supabase.js"

const MOODS = [
  { value: "chill", label: "Chill" },
  { value: "funny", label: "Funny" },
  { value: "intense", label: "Intense" },
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "uplifting", label: "Uplifting" },
  { value: "mystery", label: "Mystery" },
  { value: "action", label: "Action" },
]

const LENGTH = [
  { label: "Under 90 minutes", value: "LT_90" },
  { label: "90 to 120 minutes", value: "B90_120" },
  { label: "120 to 150 minutes", value: "B120_150" },
  { label: "Over 150 minutes", value: "GT_150" },
]

function todayLocalYYYYMMDD() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function FormFields() {
  const [sets, setSets] = useState([])
  const {
    setResults,
    formTesting,
    setPayload,
    isTesting,
    useLocal,
    setIsTesting,
    isLocalhost,
  } = useAuth()

  const navigate = useNavigate()
  const [showRaw, setShowRaw] = useState(false)
  const [showSets, setShowSets] = useState(false)

  // loading state for spinner + disabling
  const [isLoading, setIsLoading] = useState(false)

  // // check if localhost or remote
  // const isLocalhost = ["localhost", "127.0.0.1"].includes(
  //   window.location.hostname,
  // )
  // const [isTesting, setIsTesting] = useState(isLocalhost)
  // const [useLocal, setUseLocal] = useState(isLocalhost)

  // useEffect(() => {
  //   setIsTesting(true)
  //   setUseLocal(true)
  // }, [])

  console.log("form:t:", isTesting, "l:", useLocal)

  // get sets from table
  const getSets = useCallback(async () => {
    const { data, error } = await supabase.from(SET_TABLE).select()

    if (error) {
      console.error("getSets error:", error.message)
      return []
    }

    return data ?? []
  }, [])

  useEffect(() => {
    let isMounted = true

    getSets().then((rows) => {
      if (isMounted) {
        setSets(rows)
      }
    })

    return () => {
      isMounted = false
    }
  }, [getSets])

  // zip
  const [zip, setZip] = useState(formTesting ? "70003" : "")
  const zipOk = /^\d{5}$/.test(zip.trim())

  // date
  const today = todayLocalYYYYMMDD()
  const [date, setDate] = useState(today)
  const disableDateUntilZip = true
  const dateDisabled = disableDateUntilZip && !zipOk

  // moods (pills)
  const [selectedMoods, setSelectedMoods] = useState([])

  function toggleMood(value) {
    setSelectedMoods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    )
  }

  // length
  const [length, setLength] = useState("")

  // disable button until all fields filled
  const moodsOk = selectedMoods.length > 0
  const lengthOk = length.trim().length > 0
  const dateOk = !!date
  const canSubmit = zipOk && dateOk && moodsOk && lengthOk
  const submitDisabled = !canSubmit || isLoading

  async function handleSubmit() {
    if (submitDisabled) return

    setIsLoading(true)

    try {
      // get values from form
      const formPayload = {
        pv: "v2",
        zip: String(zip).trim(),
        date: date,
        len_bkt: length,
        moods: selectedMoods,
      }

      let baseUrl
      if (!useLocal) {
        baseUrl = `https://api.clayaucoin.foo/api/v1/core?t=${isTesting}&l=${useLocal}`
      } else {
        baseUrl = `http://localhost:3000/api/v1/core?t=${isTesting}&l=${useLocal}`
      }

      const reqId = crypto.randomUUID()
      console.log("reqId:", reqId)
      console.log("t:", isTesting, "l:", useLocal)

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
          "x-request-id": reqId,
        },
        body: JSON.stringify(formPayload),
      })

      const text = await response.text()

      let data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { raw: text }
        }
      }
      // console.log("data:", data)

      if (!response?.ok) {
        throw new Error(data?.error?.message ?? "Request failed")
      }

      setResults(data)
      setSets(await getSets())
      setPayload(formPayload)

      navigate("/display")
    } finally {
      setIsLoading(false)
    }
  }

  function zipValidation(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 5)
    setZip(digitsOnly)
  }

  return (
    <>
      {/* start bootstrap spinner overlay */}
      {isLoading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,0.35)",
            zIndex: 2000,
          }}
        >
          <div
            className="bg-white rounded p-3 d-flex flex-column align-items-center"
            style={{ minWidth: 220 }}
          >
            <div className="spinner-border" role="status" aria-hidden="true" />
            <div className="mt-2 small">Getting movies...</div>
          </div>
        </div>
      )}
      {/* end bootstrap spinner overlay */}

      <div className="container py-3" style={{ maxWidth: 1000 }}>
        <div className="row">
          <div className="col">
            {/* zip */}
            <div className="mb-3">
              <label htmlFor="zip" className="form-label">
                ZIP code
              </label>

              <input
                id="zip"
                name="zip"
                type="text"
                inputMode="numeric"
                className={`form-control form-control-sm ${
                  zip.length ? (zipOk ? "is-valid" : "is-invalid") : ""
                }`}
                placeholder="ZIP code (e.g., 70112)"
                value={zip}
                disabled={isLoading}
                onChange={(e) => zipValidation(e)}
              />

              <div className="form-text">
                We use this to look up the weather.
              </div>

              {!zipOk && zip.length > 0 && (
                <div className="invalid-feedback d-block">
                  Enter a 5-digit ZIP code.
                </div>
              )}
            </div>

            {/* date */}
            <div className="mb-3">
              <label htmlFor="watchDate" className="form-label">
                What day are you watching? ({date})
              </label>

              <input
                id="watchDate"
                name="watchDate"
                type="date"
                className="form-control form-control-sm cursor-pointer"
                style={{ cursor: zipOk ? "pointer" : "not-allowed" }}
                value={date}
                min={today}
                disabled={dateDisabled || isLoading}
                onChange={(e) => setDate(e.target.value)}
              />

              <div className="form-text">
                {dateDisabled
                  ? "Enter your ZIP code to enable date selection."
                  : "Used to match the weather for that day."}
              </div>
            </div>

            {/* moods */}
            <div className="mb-3">
              <div className="form-label mb-2">
                What kind of vibe are you in the mood for?
              </div>

              <div className="d-flex justify-content-center">
                <div className="d-flex justify-content-around flex-wrap gap-2">
                  {MOODS.map((m) => {
                    const active = selectedMoods.includes(m.value)
                    return (
                      <button
                        key={m.value}
                        type="button"
                        className={`btn btn-sm rounded-pill btn-pill-sm ${
                          active ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => toggleMood(m.value)}
                        aria-pressed={active}
                        disabled={isLoading}
                      >
                        {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="form-text">Pick one or more moods.</div>
            </div>

            {/* length */}
            <div className="mb-3">
              <label htmlFor="length" className="form-label">
                How long do you want the movie to be?
              </label>

              <select
                id="length"
                name="length"
                className="form-select form-select-sm"
                value={length}
                disabled={isLoading}
                onChange={(e) => setLength(e.target.value)}
              >
                <option value="">Any length</option>

                {LENGTH.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="form-text">
                Pick a time range that fits your schedule.
              </div>
            </div>

            <div className="text-center mb-2">
              <button
                className="btn btn-primary btn-lg"
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Getting Movies...
                  </>
                ) : (
                  "Get Movies"
                )}
              </button>
              {!isLoading && !canSubmit && (
                <div className="form-text mt-1">
                  Fill ZIP, date, at least one mood, and length to enable.
                </div>
              )}
            </div>

            {/* admin switches start */}
            {isLocalhost && (
              <div>
                <div className="text-center my-2">
                  <div className="d-flex justify-content-center">
                    <div className="d-flex justify-content-evenly w-75">
                      <div className="align-middle form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="isTesting"
                          checked={isTesting}
                          onChange={() => setIsTesting((p) => !p)}
                        />
                        <label className="form-check-label" htmlFor="isTesting">
                          <small>is testing</small>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* admin switches end */}

                <div className="row">
                  <div className="col-7">
                    {/* show sets */}
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="showSets"
                        checked={showSets}
                        onChange={(e) => setShowSets(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="showSets">
                        Show Sets
                      </label>
                    </div>
                    {showSets && (
                      <div className="row">
                        <div>
                          <ul>
                            {sets.length === 0 ? (
                              <p>No sets yet.</p>
                            ) : (
                              sets.map((set) => (
                                <li key={set.id} className="signature-display">
                                  {normalizeMoods(set.moods)},{" "}
                                  {set.length_bucket}, {set.weather_bucket}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-5">
                    {/* show json */}
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

                    {showRaw && (
                      <pre className="bg-light p-2 rounded small">
                        <small>
                          {JSON.stringify(
                            { zip, date, length, moods: selectedMoods },
                            null,
                            2,
                          )}
                        </small>
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// // format moods for signature
// function normalizeMoods(moods = []) {
//   return moods
//     .map((m) => m.toLowerCase().trim())
//     .sort()
//     .join(",")
// }
