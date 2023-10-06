/* eslint-disable no-unused-vars */
import AWS from 'aws-sdk';
import config from 'config';
import { logger } from '../logger';

const dynamoDB = new AWS.DynamoDB({
  endpoint: config.AWS_ENDPOINT,
  region: config.AWS_DEFAULT_REGION,
});
const dbClient = new AWS.DynamoDB.DocumentClient({ service: dynamoDB });

export type TxModel = {
  transactionId: string,
  fromAddress: string,
  toAddress: string,
  transactionIndex: number,
  blockNumber: number,
  etherValue: number,
  receiptStatus: string
}
// eslint-disable-next-line no-shadow
export enum TxDirection {
  IN = 'IN',
  OUT = 'OUT',
  ALL = 'ALL',
}
// eslint-disable-next-line no-shadow
export enum TxOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
export async function deleteTable() {
  try {
    logger.debug(`Deleting ${config.TRX_TABLE_NAME} table`);
    await dynamoDB.deleteTable({
      TableName: config.TRX_TABLE_NAME,
    }).promise();
    return true;
  } catch (error) {
    logger.warn(`Error deleting ${config.TRX_TABLE_NAME} table ${error.message}`);
    return false;
  }
}

export async function createTable() {
  logger.debug(`Creating ${config.TRX_TABLE_NAME} table`);
  return dynamoDB.createTable({
    TableName: config.TRX_TABLE_NAME,
    KeySchema: [
      {
        AttributeName: 'blockNumber',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'transactionIndex',
        KeyType: 'RANGE',
      },
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 100,
      WriteCapacityUnits: 1000,
    },
    AttributeDefinitions: [
      {
        AttributeName: 'blockNumber',
        AttributeType: 'N',
      },
      {
        AttributeName: 'transactionIndex',
        AttributeType: 'N',
      },
      {
        AttributeName: 'fromAddress',
        AttributeType: 'S',
      },
      {
        AttributeName: 'toAddress',
        AttributeType: 'S',
      },
      {
        AttributeName: 'etherValue',
        AttributeType: 'N',
      },
      {
        AttributeName: 'receiptStatus',
        AttributeType: 'S',
      },
      {
        AttributeName: 'transactionId',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ToAddressIndex',
        KeySchema: [
          { AttributeName: 'toAddress', KeyType: 'HASH' },
          { AttributeName: 'blockNumber', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: ['transactionIndex', 'fromAddress', 'receiptStatus', 'etherValue', 'transactionId'],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'FromAddressIndex',
        KeySchema: [
          { AttributeName: 'fromAddress', KeyType: 'HASH' },
          { AttributeName: 'blockNumber', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: ['transactionIndex', 'toAddress', 'receiptStatus', 'etherValue', 'transactionId'],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'ValueIndex',
        KeySchema: [
          { AttributeName: 'blockNumber', KeyType: 'HASH' },
          { AttributeName: 'etherValue', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: ['transactionIndex', 'fromAddress', 'toAddress',
            'receiptStatus', 'etherValue', 'transactionId'],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'StatusIndex',
        KeySchema: [
          { AttributeName: 'receiptStatus', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'KEYS_ONLY',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'TransactionIdIndex',
        KeySchema: [
          { AttributeName: 'transactionId', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'KEYS_ONLY',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
    ],
  }).promise();
}

export async function saveAll(transactions) {
  const batchSize = 25;
  const batchPromises = [];
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batchItems = transactions.slice(i, i + batchSize);
    const batchRequest = {
      RequestItems: {
        [config.TRX_TABLE_NAME]: batchItems.map((item) => ({
          PutRequest: {
            Item: {
              ...item,
            },
          },
        })),
      },
    };
    const batchPromise = dbClient.batchWrite(batchRequest).promise();
    batchPromises.push(batchPromise);
  }

  try {
    logger.debug(`Saving ${transactions.length} transactions in batches`);
    await Promise.all(batchPromises);
    logger.info(`${transactions.length} transactions saved successfully`);
  } catch (error) {
    logger.error(`Error saving transaction data ${error.stack}`);
    throw error;
  }
}

export async function getBiggestDBBlockNumber() {
  logger.debug('Get the biggest block number');
  try {
    const data = await dbClient.scan({
      TableName: config.TRX_TABLE_NAME,
      ProjectionExpression: 'blockNumber',
    }).promise();
    if (data?.Items?.length > 0) {
      return Math.max(...data.Items.map((item) => item.blockNumber));
    }
    return 0;
  } catch (error) {
    logger.error(`Error getting the biggest block number ${error}`);
    throw error;
  }
}

async function getTransactionsByToAddress(address: string): Promise<TxModel[]> {
  try {
    const queryToAddress: TxModel[] = (await dbClient.query({
      TableName: config.TRX_TABLE_NAME,
      IndexName: 'ToAddressIndex',
      KeyConditionExpression: 'toAddress = :toAddress',
      ExpressionAttributeValues: {
        ':toAddress': address,
      },
      ScanIndexForward: true, // Sort in ascending order by blockNumber
    }).promise()).Items as TxModel[];

    return queryToAddress.map((transaction) => ({
      ...transaction,
      direction: TxDirection.IN,
    }));
  } catch (error) {
    logger.error(`Error getting transactions by toAddress ${error.stack}`);
    throw error;
  }
}

async function getTransactionsByFromAddress(address: string): Promise<TxModel[]> {
  try {
    const queryToAddress: TxModel[] = (await dbClient.query({
      TableName: config.TRX_TABLE_NAME,
      IndexName: 'FromAddressIndex',
      KeyConditionExpression: 'fromAddress = :fromAddress',
      ExpressionAttributeValues: {
        ':fromAddress': address,
      },
      ScanIndexForward: true, // Sort in ascending order by blockNumber
    }).promise()).Items as TxModel[];

    return queryToAddress.map((transaction) => ({
      ...transaction,
      direction: TxDirection.OUT,
    }));
  } catch (error) {
    logger.error(`Error getting transactions by fromAddress ${error.stack}`);
    throw error;
  }
}

export async function getTransactionsByAddressDB(address: string, direction: TxDirection) {
  logger.debug(`Get transactions by address ${address}, direction ${direction}`);
  try {
    let results: TxModel[] = [];
    if (direction === TxDirection.IN) {
      results = await getTransactionsByToAddress(address);
    }
    if (direction === TxDirection.OUT) {
      results = await getTransactionsByFromAddress(address);
    }
    if (direction === TxDirection.ALL) {
      const [resultToAddress, resultFromAddress]: TxModel[][] = await Promise.all([
        getTransactionsByToAddress(address),
        getTransactionsByFromAddress(address),
      ]);
      results = [...resultToAddress, ...resultFromAddress];
    }
    return results.sort((a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return a.transactionIndex - b.transactionIndex;
      }
      return a.blockNumber - b.blockNumber;
    });
  } catch (error) {
    logger.error(`Error getting transactions by address ${error.stack}`);
    throw error;
  }
}

export async function countByAddressDB(address: string, direction: TxDirection) {
  logger.debug(`Count transactions by address ${address}, direction ${direction}`);
  try {
    if (direction === TxDirection.IN) {
      const resultToAddress = await getTransactionsByToAddress(address);
      return {
        total: resultToAddress.length,
      };
    }
    if (direction === TxDirection.OUT) {
      const resultFromAddress = await getTransactionsByFromAddress(address);
      return {
        total: resultFromAddress.length,
      };
    }
    const [resultToAddress, resultFromAddress]: TxModel[][] = await Promise.all([
      getTransactionsByToAddress(address),
      getTransactionsByFromAddress(address),
    ]);
    return {
      total: resultToAddress.length + resultFromAddress.length,
    };
  } catch (error) {
    logger.error(`Error counting documents ${error}`);
    throw error;
  }
}

export async function getAllTransactionsOrderByValueDB(order: TxOrder) {
  logger.debug(`Get all transactions ordered by value, order: ${order}`);
  try {
    const data: TxModel[] = (await dbClient.scan({
      TableName: config.TRX_TABLE_NAME,
      IndexName: 'ValueIndex',
    }).promise()).Items as TxModel[];
    if (order === TxOrder.DESC) {
      return data.sort((a, b) => b.etherValue - a.etherValue);
    }
    return data.sort((a, b) => a.etherValue - b.etherValue);
  } catch (error) {
    logger.error(`Error getting transactions ordered by value ${error}`);
    throw error;
  }
}
