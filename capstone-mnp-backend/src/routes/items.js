// src/routes/items.js

import express from "express";

// routes
import weatherRouter from "./ms-wx.js"
import msAIRouter from "./ms-ai.js"
import coreRouter from "./core.js"
import addRouter from "./add.js"
// import findRouter from "./find.js"
// import delRouter from "./del.js"

const itemsRouter = express.Router()

itemsRouter.use("/", weatherRouter)      // POST /items/
itemsRouter.use("/", msAIRouter)      // POST /items/
itemsRouter.use("/", coreRouter)      // POST /items/
itemsRouter.use("/", addRouter)       // POST /items/
// itemsRouter.use("/", findRouter)      // GET /items/:id
// itemsRouter.use("/", delRouter)       // DELETE /items/:id

export default itemsRouter
