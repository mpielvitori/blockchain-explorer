jest.mock('aws-sdk');
import { getAddressesByBalance } from '../../src/controllers';
import { ADDRESS } from '../../__mocks__/mock_constants';

describe('getAddressesByBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return top 100 addresses', async () => {
    // Given
    const req = { query: {} };
    const res = { 
      send: jest.fn(),
    };

    // When
    await getAddressesByBalance(req, res);

    // Then
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith([ADDRESS]);
  });
});
