// src/Components/FormFields.jsx

const SET_TABLE = "lv4_cap_recommendation_sets"
const WX_CONDITION = "Rain, Partially cloudy"

import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/useAuth.js"
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
  const { results, setResults, isTesting, formTesting } = useAuth()
  // const { results, setResults, isLoading, setIsLoading } = useAuth()

  const navigate = useNavigate()

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
  const zipOk = /^\d{5}$/.test(zip)

  // date
  const today = todayLocalYYYYMMDD()
  const [date, setDate] = useState(today)
  const disableDateUntilZip = true
  const dateDisabled = disableDateUntilZip && !zipOk

  // moods (pills)
  const [selectedMoods, setSelectedMoods] = useState([])

  function toggleMood(value) {
    setSelectedMoods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    )
  }

  // length
  const [length, setLength] = useState("")

  async function handleSubmit() {
    // setIsLoading(true)

    // get values from form
    const payload = {
      pv: "v1",
      zip: String(zip).trim(),
      date: date,
      len_bkt: length,
      moods: selectedMoods,
    }
    // console.log("payload:", payload)

    const local = false
    const baseUrl = `http://localhost:3000/api/v1/submit?t=${isTesting}&l=${local}`

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error("Backend returned non-JSON")
    }

    if (!response.ok) {
      throw new Error(data?.error?.message ?? "Request failed")
    }

    setResults(data)
    setSets(await getSets())

    navigate("/display")
  }

  return (
    <>
      <div className="container py-3" style={{ maxWidth: 1000 }}>
        <div className="row">
          <div className="col-8">
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
                onChange={(e) => {
                  const digitsOnly = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 5)
                  setZip(digitsOnly)
                }}
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
                disabled={dateDisabled}
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
                className="form-select form-select-sm"
                value={length}
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
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleSubmit}
              >
                Get Movies
              </button>
            </div>

            {/* json output */}
            <pre className="bg-light p-2 rounded small">
              <small>
                {JSON.stringify(
                  { zip, date, length, moods: selectedMoods },
                  null,
                  2
                )}
              </small>
            </pre>

            <div>
              <pre className="json-display">
                {results ? JSON.stringify(results, null, 2) : ""}
              </pre>
            </div>
          </div>
          <div className="col-4">
            <div>
              <ul>
                {sets.length === 0 ? (
                  <p>No sets yet.</p>
                ) : (
                  sets.map((set) => (
                    <li key={set.id} className="signature-display">
                      {normalizeMoods(set.moods)}, {set.length_bucket},{" "}
                      {set.weather_bucket}
                    </li>
                  ))
                )}
              </ul>
            </div>
            {/* <div>
              <pre className="signature-display">
                {result ? JSON.stringify(result, null, 2) : ""}
              </pre>
            </div> */}
          </div>
        </div>
      </div>
    </>
  )
}

// query_signature
// moods=chill,mystery|len=B90_120|wx=STORM|pv=v1|var=default

// format moods for signature
function normalizeMoods(moods = []) {
  return moods
    .map((m) => m.toLowerCase().trim())
    .sort()
    .join(",")
}
