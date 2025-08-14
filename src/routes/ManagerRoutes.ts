import { Router, type RequestHandler } from 'express';
import { Manager } from '../security/UserRoles.ts';
import {
  AddClientMiddleware,
  GetAllClientsMiddleware,
  GetClientByCNPJMiddleware,
  DeleteClientMiddleware,
  UpdateClientStatusMiddleware
} from '../middlewares/ClientMiddleware.ts';

const router = Router();

const ManagerMiddleware = Manager as unknown as RequestHandler;

router.post('/add-client', ManagerMiddleware, AddClientMiddleware);
router.get('/clients', ManagerMiddleware, GetAllClientsMiddleware);
router.get('/clients/:cnpj', ManagerMiddleware, GetClientByCNPJMiddleware);
router.delete('/clients/:cnpj', ManagerMiddleware, DeleteClientMiddleware);
router.patch('/clients/:cnpj', ManagerMiddleware, UpdateClientStatusMiddleware);

export default router;
