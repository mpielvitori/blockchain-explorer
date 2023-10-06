import AWS from 'aws-sdk';
import { TRANSACTION } from './mock_constants';

const mockQuery = jest.fn().mockImplementation((params) => {
    return {
    promise: jest.fn().mockResolvedValue({
        Items: [
            TRANSACTION,
        ],
    }),
    };
});
AWS.DynamoDB.DocumentClient.prototype.query = mockQuery;

module.exports = AWS;