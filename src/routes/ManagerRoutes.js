import express from "express";
import Manager from "../security/UserRoles.js";
import { AddClientMiddleware, GetAllClientsMiddleware, GetClientByCNPJMiddleware, DeleteClientMiddleware } from "../middlewares/ClientMiddleware.js";


const router = express.Router();

router.post('/add-client', Manager, AddClientMiddleware, (req,res) =>{
    return res.end(200);
})

router.get('/clients', Manager, GetAllClientsMiddleware, (req,res) => {
    return res.end(200);
})

router.get('/clients/:cnpj', Manager, GetClientByCNPJMiddleware, (req,res) => {
    return res.end(200);
})

router.delete('/clients/:cnpj', Manager, DeleteClientMiddleware, (req,res) => {
    return res.end(200);
})


export default router;
