import Web3 from 'web3';
import config from 'config';
import { logger } from '../logger';

const provider = config.AVAX_RPC_NETWORK;
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

export class TooManyBlocksToCheck extends Error {
  constructor(message) {
    super(message);
    this.name = 'TooManyBlocksToCheck';
  }
}

export const getAddressBalance = async (address: string) => {
  const balance = await web3.eth.getBalance(address);
  return parseFloat(web3.utils.fromWei(balance, 'ether'));
};

export const getTransactionDetails = async (transactionHash) => {
  const [transaction, transactionReceipt] = await Promise.all([
    web3.eth.getTransaction(transactionHash),
    web3.eth.getTransactionReceipt(transactionHash),
  ]);
  // eslint-disable-next-line max-len
  // logger.debug(`************ TRANSACTION: ${transaction.hash} - VALUE: ${transaction.value.toString()} - ${web3.utils.fromWei(transaction.value, 'ether')} ************`);
  return {
    transactionId: transaction.hash,
    fromAddress: transaction.from,
    toAddress: transaction.to,
    transactionIndex: Number(transaction.transactionIndex),
    blockNumber: Number(transaction.blockNumber),
    etherValue: parseFloat(web3.utils.fromWei(transaction.value, 'ether')),
    receiptStatus: transactionReceipt.status ? 'success' : 'failed',
  };
};

export const getLatestBlockNumber = async () => web3.eth.getBlockNumber();

// get latest transactions
export const getLatestTransactions = async (fromBlockNumber: number) => {
  logger.debug('Getting latest transactions');

  // get the block previous to the latest
  const latestBlockNumber: bigint = await getLatestBlockNumber();
  logger.debug(`Current block number: ${latestBlockNumber}, from block number: ${fromBlockNumber}`);
  // Create an array with block numbers from fromBlockNumber to latestBlockNumber
  const blockNumbers = [];
  for (let i = BigInt(fromBlockNumber); i <= latestBlockNumber; i += 1n) {
    blockNumbers.push(Number(i));
  }
  logger.debug(`Blocks to check: ${blockNumbers.length}`);
  if (blockNumbers.length > Number(config.MAX_BLOCKS_TO_CHECK)) {
    const errorMessage = `Too many blocks to check: ${blockNumbers.length}. `
                          + `Max allowed: ${config.MAX_BLOCKS_TO_CHECK}`;
    logger.warn(errorMessage);
    throw new TooManyBlocksToCheck(errorMessage);
  }
  // Get the block details
  const blocks = await Promise.all(
    blockNumbers.map((block) => web3.eth.getBlock(block)),
  );
  logger.debug(`Blocks checked: ${blocks.length}`);
  // Create an array with all transactions
  const transactions = blocks
    .filter((block) => block?.transactions?.length > 0)
    .map((block) => block.transactions)
    .flat();
  logger.debug(`Transactions to check: ${transactions.length}`);
  // Create an array with transactions details
  const transactionsDetails = await Promise.all(
    transactions.map((transaction) => getTransactionDetails(transaction)),
  );

  return transactionsDetails;
};
