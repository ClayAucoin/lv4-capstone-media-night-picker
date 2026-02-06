// src/routes/items.js

import express from "express";

// routes
import msAiRouter from "./ms-ai.js"

const itemsRouter = express.Router()

itemsRouter.use("/", msAiRouter)      // GET /items/

export default itemsRouter
