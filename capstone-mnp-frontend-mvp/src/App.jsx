// src/App.jsx

import "./App.css"
import FormFields from "./Components/FormFields"

function Page() {
  return (
    <>
      <div className="mainContainer">
        <div className="card border" style={{ width: "28rem" }}>
          <div className="card-body">
            <h5 className="card-title">Movie Night Planner</h5>
            <FormFields />
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
