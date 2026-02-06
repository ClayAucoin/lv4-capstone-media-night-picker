// src/utils/listener.js

import app from "./app.js"
import { config } from "./config.js"

const port = config.port

// listen
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
});

