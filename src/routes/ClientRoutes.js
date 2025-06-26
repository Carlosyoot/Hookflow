import express from "express";
import { Client } from "../security/UserRoles.js"
import { AddEvent } from "../middlewares/EventMiddleware.js";

const router = express.Router();

router.post('/webhook', Client, AddEvent );

export default router;