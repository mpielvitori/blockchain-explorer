import { logger } from '../logger';
import { getAddressesByBalanceDB, AddressOrder } from '../models';

export const getAddressesByBalance = async (req, res) => {
  logger.debug('Get top addresses ordered by balance');
  try {
    const dbAddresses = await getAddressesByBalanceDB(
      req.query.limit ? req.query.limit : 100,
      req.query.order ? req.query.order.toUpperCase() : AddressOrder.DESC,
    );
    res.send(dbAddresses);
  } catch (error) {
    logger.error('Error getting addresses by balance', error);
    res.status(
      500,
    ).send({
      exception: error,
      message: 'Error getting addresses by balance',
    });
  }
};
