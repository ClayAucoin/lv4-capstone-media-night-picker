// src/context/AuthProvider.jsx

import { useState } from "react"
import { AuthContext } from "./authContext.js"

export function AuthProvider({ children }) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [payload, setPayload] = useState([])

  const isTesting = import.meta.env.VITE_IS_TESTING === "true"
  const formTesting = import.meta.env.VITE_FORM_TESTING === "true"
  const displayRaw = import.meta.env.VITE_DISPLAY_RAW === "true"

  if (isLoading) return <p>Loading...</p>

  const value = {
    results,
    setResults,
    isLoading,
    setIsLoading,
    isTesting,
    formTesting,
    payload,
    setPayload,
    displayRaw,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
