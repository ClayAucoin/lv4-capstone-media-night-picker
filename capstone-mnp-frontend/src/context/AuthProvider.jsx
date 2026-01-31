// src/context/AuthProvider.jsx

import { useState } from "react"
import { AuthContext } from "./authContext.js"

export function AuthProvider({ children }) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [payload, setPayload] = useState([])

  const formTesting = import.meta.env.VITE_FORM_TESTING === "true"

  const params = new URLSearchParams(window.location.search)
  const tParam = params.get("t")
  const lParam = params.get("l")

  // check if localhost or remote
  const isLocalhost = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  )

  const t = tParam === "true" ? true : tParam === "false" ? false : null
  const l = lParam === "true" ? true : lParam === "false" ? false : null

  const [isTesting, setIsTesting] = useState(
    () => t === true || (t === null && isLocalhost),
  )
  const [useLocal, setUseLocal] = useState(
    () => l === true || (l === null && isLocalhost),
  )

  if (isLoading) return <p>Loading...</p>

  const value = {
    results,
    setResults,
    isLoading,
    setIsLoading,
    isTesting,
    setIsTesting,
    useLocal,
    setUseLocal,
    formTesting,
    payload,
    setPayload,
    isLocalhost,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
