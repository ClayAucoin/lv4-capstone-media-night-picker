// src/routes/items.js

import express from "express";

// routes
import readRouter from "./read.js"

const itemsRouter = express.Router()

itemsRouter.use("/", readRouter)      // POST /items/

export default itemsRouter
