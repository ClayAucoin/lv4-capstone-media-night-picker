// src/routes/items.js

import express from "express";

// routes
import readRouter from "./read.js"
import readWxRouter from "./archive/read-wx.js"
import weatherRouter from "./wx-ms.js"
import readAIRouter from "./read-ai.js"
import submitRouter from "./core.js"
import addRouter from "./add.js"
// import findRouter from "./find.js"
// import delRouter from "./del.js"

const itemsRouter = express.Router()

itemsRouter.use("/", readRouter)      // POST /items/
itemsRouter.use("/", readWxRouter)      // POST /items/
itemsRouter.use("/", weatherRouter)      // POST /items/
itemsRouter.use("/", readAIRouter)      // POST /items/
itemsRouter.use("/", submitRouter)      // POST /items/
itemsRouter.use("/", addRouter)       // POST /items/
// itemsRouter.use("/", findRouter)      // GET /items/:id
// itemsRouter.use("/", delRouter)       // DELETE /items/:id

export default itemsRouter
