// src/server.js

import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

const PORT = Number(process.env.PORT || 3080);
const HOST = process.env.HOST || "0.0.0.0";

// serve static assets
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback (Express 5-safe)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`README Prompt Builder: http://${HOST}:${PORT}`);
});
