// src/routes/items.js

import express from "express";

// routes
import readRouter from "./read.js"

const itemsRouter = express.Router()

itemsRouter.use("/", readRouter)      // GET /items/

export default itemsRouter
