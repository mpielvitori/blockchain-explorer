import { TxModel, ReceiptStatus } from '../src/models/transaction.model';
import { AddressModel } from '../src/models/address.model';

export const FROM_ADDRESS = '0xe5eb65f9f977d788262e3dedb11c1239cd8f9cb7';
export const TO_ADDRESS = '0x696187cd9920e355c257ee6847e13ffab487ccde';

export const TRANSACTION: TxModel = {
  transactionId: '0x6e0641c01f266db70437316eb80d66636325e2cc4b9e2fb5ca1116908cc76246',
  fromAddress: FROM_ADDRESS,
  toAddress: TO_ADDRESS,
  transactionIndex: 1,
  blockNumber: 26551004,
  etherValue: 0.3,
  receiptStatus: ReceiptStatus.SUCCESS,
};

export const ADDRESS: AddressModel = {
  address: FROM_ADDRESS,
  balance: 123.34,
};
