/* eslint-disable no-unused-vars */
import AWS from 'aws-sdk';
import config from 'config';
import { logger } from '../logger';

const dbClient = new AWS.DynamoDB.DocumentClient({
  endpoint: config.AWS_ENDPOINT,
  region: config.AWS_DEFAULT_REGION,
});

export type AddressModel = {
  address: string,
  balance: number
}
// eslint-disable-next-line no-shadow
export enum AddressOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export async function deleteTable() {
  logger.debug(`Deleting ${config.ADDRESS_TABLE_NAME} table`);
  const dynamoDB = new AWS.DynamoDB({
    endpoint: config.AWS_ENDPOINT,
    region: config.AWS_DEFAULT_REGION,
  });
  try {
    await dynamoDB.deleteTable({ TableName: config.ADDRESS_TABLE_NAME }).promise();
    return true;
  } catch (error) {
    logger.warn(`Error deleting ${config.ADDRESS_TABLE_NAME} table ${error.message}`);
    return false;
  }
}

export async function createTable() {
  logger.debug(`Creating ${config.ADDRESS_TABLE_NAME} table`);
  const dynamoDB = new AWS.DynamoDB({
    endpoint: config.AWS_ENDPOINT,
    region: config.AWS_DEFAULT_REGION,
  });
  return dynamoDB.createTable({
    TableName: config.ADDRESS_TABLE_NAME,
    KeySchema: [
      {
        AttributeName: 'address',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'balance',
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
        AttributeName: 'address',
        AttributeType: 'S',
      },
      {
        AttributeName: 'balance',
        AttributeType: 'N',
      },
    ],
  }).promise();
}

export async function saveAll(addresses) {
  const batchSize = 25;
  const batchPromises = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batchItems = addresses.slice(i, i + batchSize);
    const batchRequest = {
      RequestItems: {
        [config.ADDRESS_TABLE_NAME]: batchItems.map((item) => ({
          PutRequest: {
            Item: {
              createdAt: Date.now(),
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
    logger.debug(`Saving ${addresses.length} addresses in batches`);
    await Promise.all(batchPromises);
    logger.info(`${addresses.length} addresses saved successfully`);
  } catch (error) {
    logger.error(`Error saving addresses data ${error.stack}`);
    throw error;
  }
}

export async function getAddressesByBalanceDB(limit: number, order: AddressOrder) {
  logger.debug(`Get top ${limit} addresses ordered by balance, order: ${order}`);
  try {
    const data: AddressModel[] = (await dbClient.scan({
      TableName: config.ADDRESS_TABLE_NAME,
      ProjectionExpression: 'address, balance',
    }).promise()).Items as AddressModel[];
    if (data.length < limit) {
      logger.warn(`Limit ${limit} is bigger than addresses count ${data.length}`);
    }
    if (order === AddressOrder.DESC) {
      return data.sort((a, b) => b.balance - a.balance).slice(0, limit);
    }
    return data.sort((a, b) => a.balance - b.balance).slice(0, limit);
  } catch (error) {
    logger.error(`Error getting addresses ordered by balance ${error}`);
    throw error;
  }
}
