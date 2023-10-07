import { ADDRESS } from './mock_constants';

module.exports = {
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      scan: jest.fn().mockImplementation((params) => ({
        promise: jest.fn().mockResolvedValue({
          Items: [
            ADDRESS,
          ],
        }),
      }))
    }))
  }
};
