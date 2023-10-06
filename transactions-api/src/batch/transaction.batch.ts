import config from 'config';
import { logger } from '../logger';
import {
  deleteTransactionTable,
  saveAllTransactions,
  createTransactionTable,
  getBiggestDBBlockNumber,
  createAddressTable,
  deleteAddressTable,
  saveAllAddresses,
} from '../models';
import {
  getLatestTransactions,
  getLatestBlockNumber,
  getAddressBalance,
  TooManyBlocksToCheck,
} from '../services';

const saveAllAddressesFromTransactions = async (transactions) => {
  try {
    // Get all addresses from the transactions
    const allAddresses = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.toAddress) {
        allAddresses.add(transaction.toAddress);
      }
      if (transaction.fromAddress) {
        allAddresses.add(transaction.fromAddress);
      }
    });
    logger.debug(`Addresses in transactions count ${allAddresses.size}`);
    // Get the balance for each address
    const addressBalances = [];
    await Promise.all(
      Array.from(allAddresses).map(async (address) => {
        const balance = await getAddressBalance(address);
        addressBalances.push({ address, balance });
      }),
    );
    // Save all addresses
    await saveAllAddresses(addressBalances);
  } catch (error) {
    logger.error(`Error saving all addresses from transactions ${error.stack}`);
  }
};

const getAndSaveTransactions = async () => {
  try {
    const biggestBlockNumber = await getBiggestDBBlockNumber();
    logger.debug(`biggestBlockNumber ${biggestBlockNumber}`);
    const latestTransactions = await getLatestTransactions(biggestBlockNumber);
    logger.debug(`Transactions count ${latestTransactions.length}`);
    await Promise.all([
      saveAllTransactions(latestTransactions),
      saveAllAddressesFromTransactions(latestTransactions),
    ]);
  } catch (error) {
    if (error instanceof TooManyBlocksToCheck) {
      throw error;
    }
    logger.error(`Error calling and saving transactions ${error.stack}`);
  }
};

export const initializeEnvironment = async () => {
  try {
    logger.info('****** Environment initialization enabled ******');
    await deleteTransactionTable();
    await deleteAddressTable();
    await createTransactionTable();
    await createAddressTable();
    logger.info('****** Tables created successfully ******');

    const latestBlockNumber = await getLatestBlockNumber();
    logger.debug(`Latest Block Number: ${latestBlockNumber}, init previous blocks: ${config.INITIAL_OLD_BLOCKS}`);
    const latestTransactions = await getLatestTransactions(
      Number(latestBlockNumber) - Number(config.INITIAL_OLD_BLOCKS),
    );
    logger.debug(`Transactions count ${latestTransactions.length}`);
    await Promise.all([
      await saveAllTransactions(latestTransactions),
      await saveAllAddressesFromTransactions(latestTransactions),
    ]);
  } catch (error) {
    logger.error(`Error initializing the environment: ${error.message}`);
    throw error;
  }
};

export const indexerProcess = async () => {
  // Wait 5 seconds to wait for environment initialization
  await new Promise((resolve) => { setTimeout(resolve, 5000); });
  logger.info('****** Start indexer batch process ******');
  // Call and save transactions every  CALL_INTERVAL_IN_SECONDS seconds
  const interval = Number(config.CALL_INTERVAL_IN_SECONDS) * 1000;
  logger.debug(`Call interval: ${interval / 1000} seconds`);
  setInterval(getAndSaveTransactions, interval);
};
