import { Router } from 'express';
import { FailedEvent } from '../middlewares/EventMiddleware.ts';

const router = Router();

router.post('/nifi/falha/:Queue', FailedEvent);

export default router;
