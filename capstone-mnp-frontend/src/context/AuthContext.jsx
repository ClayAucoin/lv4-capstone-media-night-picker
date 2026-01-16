// src/context/AuthContext.jsx

import { createContext, useContext, useState } from "react"
// import { useNavigate } from "react-router-dom"

// import supabase from "../utils/supabase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [results, setResults] = useState([])

  const value = { results, setResults }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
