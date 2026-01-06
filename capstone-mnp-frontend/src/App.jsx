// src/App.jsx

import { useState, useEffect } from "react"
import supabase from "./utils/supabase.js"

function Page() {
  const [sets, setSets] = useState([])

  useEffect(() => {
    async function getSets() {
      const { data: todos } = await supabase
        .from("lv4_cap_recommendations")
        .select()

      if (todos.length > 1) {
        setSets(todos)
      }
    }

    getSets()
  }, [])

  return (
    <>
      <div className="card" style={{ width: "18rem" }}>
        {/* <img src="..." class="card-img-top" alt="..." /> */}
        <div className="card-body">
          <h5 className="card-title">Card title</h5>
          <div>
            {sets.map((set) => (
              <li key={set.id}>{set.title}</li>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
