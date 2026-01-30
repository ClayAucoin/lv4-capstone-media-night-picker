// src/routes/items.js

import express from "express";

// routes
import coreRouter from "./core.js"
import toMsWxRouter from "./get-wx.js"
import toMsAIRouter from "./get-ai.js"
import addRouter from "./add.js"

// import msAIRouterOLD from "./ms-ai-OLD.js"
// import findRouter from "./find.js"
// import delRouter from "./del.js"

const itemsRouter = express.Router()

itemsRouter.use("/", coreRouter)      // POST /items/
itemsRouter.use("/", toMsWxRouter)      // POST /items/
itemsRouter.use("/", toMsAIRouter)      // POST /items/
itemsRouter.use("/", addRouter)       // POST /items/

// itemsRouter.use("/", findRouter)      // GET /items/:id
// itemsRouter.use("/", delRouter)       // DELETE /items/:id

export default itemsRouter
