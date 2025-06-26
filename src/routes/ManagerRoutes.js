import express from "express";
import { Manager } from "../security/UserRoles.js";
import {
        AddClientMiddleware, 
        GetAllClientsMiddleware, 
        GetClientByCNPJMiddleware, 
        DeleteClientMiddleware 
        } 
from "../middlewares/ClientMiddleware.js";


const router = express.Router();

router.post('/add-client', Manager, AddClientMiddleware)
router.get('/clients', Manager, GetAllClientsMiddleware)
router.get('/clients/:cnpj', Manager, GetClientByCNPJMiddleware)
router.delete('/clients/:cnpj', Manager, DeleteClientMiddleware)


export default router;
