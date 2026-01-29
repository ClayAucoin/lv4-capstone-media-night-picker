// src/routes/items.js

import express from "express";

// routes
import readRouter from "./wx-ms.js"

const itemsRouter = express.Router()

itemsRouter.use("/", readRouter)      // POST /items/

export default itemsRouter
