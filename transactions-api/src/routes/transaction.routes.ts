import { Router } from 'express';
import {
  getTransactionsByAddress,
  countByAddress,
  getAllTransactionsOrderByValue,
} from '../controllers';

export const transactionsRouter = Router();

transactionsRouter.get('/', getAllTransactionsOrderByValue);
transactionsRouter.get('/address/:address', getTransactionsByAddress);
transactionsRouter.get('/count/address/:address', countByAddress);
