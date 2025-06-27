import express from 'express';
import { FailedEvent } from '../middlewares/EventMiddleware.js';

const router = express.Router();

router.post('/nifi/falha/:Queue', FailedEvent);

export default router;
