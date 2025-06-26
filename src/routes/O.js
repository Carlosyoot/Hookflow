import express from 'express';
import ADMIN from '../security/UserRoles.js';

const router =  express.Router();

router.get('/inspect/:id', ADMIN, async(req,res) => {

    const {id} = req.params;

    try{
        return res.status(200).json({id});
    }
    catch(err){
        return res.status(403).json({error: "Erro"})
    };
})

export default router;