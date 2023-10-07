import config from 'config';
import { ADDRESS, TRANSACTION } from './mock_constants';

module.exports = {
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      scan: jest.fn().mockImplementation((params) => {
        if (params.TableName === config.ADDRESS_TABLE_NAME) {
          return {
            promise: jest.fn().mockResolvedValue({
              Items: [
                ADDRESS,
              ],
            }),
          };
        }
        return {
          promise: jest.fn().mockResolvedValue({
            Items: [
              TRANSACTION,
            ],
          }),
        };
      }),
      query: jest.fn().mockImplementation((params) => {
        if (params.ExpressionAttributeValues[':fromAddress'] && 
            params.ExpressionAttributeValues[':fromAddress'] === TRANSACTION.fromAddress) {
              return {
                promise: jest.fn().mockResolvedValue({
                  Items: [
                    TRANSACTION,
                  ],
                }),
              };              
        }
        if (params.ExpressionAttributeValues[':toAddress'] && 
            params.ExpressionAttributeValues[':toAddress'] === TRANSACTION.toAddress) {
              return {
                promise: jest.fn().mockResolvedValue({
                  Items: [
                    TRANSACTION,
                  ],
                }),
              };              
        }
        return {
          promise: jest.fn().mockResolvedValue({
            Items: [],
          }),
        };
      }),
    }))
  }
};
