// src/Components/Display.jsx

const IS_TESTING = true
const SET_TABLE = "lv4_cap_recommendation_sets"
const WX_CONDITION = "Rain, Partially cloudy"

// import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
// import supabase from "../utils/supabase.js"

export default function Display() {
  const { results } = useAuth()

  return (
    <div>
      <div className="row">
        <div className="col">
          <Link to="/form">Search Again</Link>
        </div>
      </div>
      <div>
        <pre className="json-display">
          {results ? JSON.stringify(results, null, 2) : ""}
        </pre>
      </div>
    </div>
  )
}
