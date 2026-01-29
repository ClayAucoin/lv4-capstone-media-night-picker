// src/context/AuthProvider.jsx

import { useState } from "react"
import { AuthContext } from "./authContext.js"

export function AuthProvider({ children }) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [payload, setPayload] = useState([])

  const formTesting = import.meta.env.VITE_FORM_TESTING === "true"

  const params = new URLSearchParams(window.location.search)
  const isTesting = params.get("t") === "true"
  const useLocal = params.get("l") === "true"

  if (isLoading) return <p>Loading...</p>

  const value = {
    results,
    setResults,
    isLoading,
    setIsLoading,
    isTesting,
    useLocal,
    formTesting,
    payload,
    setPayload,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
