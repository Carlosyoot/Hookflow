import { Router } from 'express';
import { FailedEvent } from '../middlewares/EventMiddleware.js';

const router = Router();

router.post('/nifi/falha/:Queue', FailedEvent);

export default router;
