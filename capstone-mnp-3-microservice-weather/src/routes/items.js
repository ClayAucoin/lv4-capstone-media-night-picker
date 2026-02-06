// src/routes/items.js

import express from "express";

// routes
import msWxRouter from "./ms-wx.js"

const itemsRouter = express.Router()

itemsRouter.use("/", msWxRouter)      // POST /items/

export default itemsRouter
