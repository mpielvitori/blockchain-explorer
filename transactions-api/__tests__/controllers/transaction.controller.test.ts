jest.mock('aws-sdk');
import { 
  getAllTransactionsOrderByValue,
  getTransactionsByAddress,
  countByAddress,
} from '../../src/controllers';
import { TxDirection } from '../../src/models';
import { TRANSACTION, FROM_ADDRESS } from '../../__mocks__/mock_constants';

describe('Transaction tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Get all transactions sort by value', () => {
    it('should return top 100 addresses', async () => {
      // Given
      const req = { query: {} };
      const res = { 
        send: jest.fn(),
      };

      // When
      await getAllTransactionsOrderByValue(req, res);

      // Then
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith([TRANSACTION]);
    });
  });
  describe('Get all transactions by address', () => {
    it('It should returns all address transaction', async () => {
      // Given
      const req = { 
        params: {
          address: FROM_ADDRESS,
        },
        query: {},
      };
      const res = { 
        send: jest.fn(),
      };

      // When
      await getTransactionsByAddress(req, res);

      // Then
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith([{
        ...TRANSACTION,
        direction: TxDirection.OUT,
      }]);
    });
  });
  describe('Count transactions by address', () => {
    it('It should returns the total transactions count by address', async () => {
      // Given
      const req = { 
        params: {
          address: FROM_ADDRESS,
        },
        query: {},
      };
      const res = { 
        send: jest.fn(),
      };

      // When
      await countByAddress(req, res);

      // Then
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith({ total: 1});
    });
  });
});
