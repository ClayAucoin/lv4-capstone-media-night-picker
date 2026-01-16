// src/App.jsx

import "./App.css"
import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext.jsx"
import FormFields from "./components/FormFields"
import Display from "./components/Display"

function App() {
  return (
    <>
      <div className="container py-3" style={{ maxWidth: 1000 }}>
        {/* <div className="card border" style={{ width: "28rem" }}> */}
        <div className="card border">
          <div className="card-body">
            <h5 className="card-title">Movie Night Planner</h5>
            <AuthProvider>
              <Routes>
                {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
                <Route path="/form/" element={<FormFields />} />

                <Route path="/display/" element={<Display />} />

                <Route path="*" element={<FormFields />} />
              </Routes>
            </AuthProvider>
          </div>
        </div>
      </div>
    </>
  )
}
export default App
