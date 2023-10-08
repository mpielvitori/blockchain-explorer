import { logger } from '../logger';
import {
  getTransactionsByAddressDB,
  countByAddressDB,
  getAllTransactionsOrderByValueDB,
  TxDirection,
  TxOrder,
} from '../models';

export const getTransactionsByAddress = async (req, res) => {
  logger.debug(`Get transactions by address ${req.params.address}`);
  try {
    const dbTransactions = await getTransactionsByAddressDB(
      req.params.address,
      req.query.direction ? req.query.direction.toUpperCase() : TxDirection.ALL,
    );
    res.send(dbTransactions);
  } catch (error) {
    logger.error('Error getting transactions by address', error);
    res.status(
      500,
    ).send({
      exception: error,
      message: 'Error getting transactions by address',
    });
  }
};

export const countByAddress = async (req, res) => {
  logger.debug(`Count transactions by address ${req.params.address}`);
  try {
    const dbTransactionsCount = await countByAddressDB(
      req.params.address,
      req.query.direction ? req.query.direction.toUpperCase() : TxDirection.ALL,
    );
    res.send(dbTransactionsCount);
  } catch (error) {
    logger.error('Error getting transactions count', error);
    res.status(
      500,
    ).send({
      exception: error,
      message: 'Error getting transactions count',
    });
  }
};

export const getAllTransactionsOrderByValue = async (req, res) => {
  logger.debug('Get all transactions ordered by value');
  try {
    const dbTransactions = await getAllTransactionsOrderByValueDB(
      req.query.order ? req.query.order.toUpperCase() : TxOrder.DESC,
    );
    res.send(dbTransactions);
  } catch (error) {
    logger.error('Error getting transactions ordered by value', error);
    res.status(
      500,
    ).send({
      exception: error,
      message: 'Error getting transactions ordered by value',
    });
  }
};
