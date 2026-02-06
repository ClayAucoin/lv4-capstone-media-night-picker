// src/index.js

import app from "./app.js"
import { config } from "./config.js"

const port = config.port

const server = app.listen(port, () => {
  console.log(`Weather Microservice running on port ${port}`);
});

server.on('error', (e) => {
  console.error(e)
})
