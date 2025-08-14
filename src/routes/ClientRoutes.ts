import { Router, type RequestHandler } from 'express';
import { Client } from '../security/UserRoles.js';
import { AddEvent } from '../middlewares/EventMiddleware.ts';

const router = Router();

const ClientMiddleware = Client as unknown as RequestHandler;

router.post('/webhook', ClientMiddleware, AddEvent);

export default router;
