// src/routes/items.js

import express from "express";

// routes
import readRouter from "./read.js"
import readWxRouter from "./read-wx.js"
import readAIRouter from "./read-ai.js"
import findRouter from "./find.js"
import addRouter from "./add.js"
import delRouter from "./del.js"

const itemsRouter = express.Router()

itemsRouter.use("/", readRouter)      // GET /items/
itemsRouter.use("/", readWxRouter)      // GET /items/
itemsRouter.use("/", readAIRouter)      // GET /items/
itemsRouter.use("/", findRouter)      // GET /items/:id
itemsRouter.use("/", addRouter)       // POST /items/
itemsRouter.use("/", delRouter)       // DELETE /items/:id

export default itemsRouter
