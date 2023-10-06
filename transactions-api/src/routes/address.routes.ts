import { Router } from 'express';
import { getAddressesByBalance } from '../controllers';

export const addressesRouter = Router();

addressesRouter.get('/', getAddressesByBalance);
