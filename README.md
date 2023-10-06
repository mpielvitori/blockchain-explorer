# Avalanche blockchain explorer PoC
PoC of a process that keeps all the transactions injected into Avalanche C-chain updated in a suitable database.
## Usage
### Start local environment
Build and run docker containers locally. 
```
docker-compose up --build --remove-orphans
```
_Note:_ Configuration file: `.env`
### Development mode 
Build and run docker containers locally with hot reload, debug logger, using tesnet and with `in memory` database

```
docker-compose -f docker-compose-dev.yml up --build --remove-orphans
```
_Note:_ Configuration file: `.env.dev`

### Util commands
- Install local _DynamoDB GUI_: `npm install -g dynamodb-admin`
- Start local _DynamoDB GUI_: `DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin`
- _DynamoDB GUI_: http://localhost:8001/
- Run test coverage inside the container `docker exec -it avascan.transactions-api npm run testCoverage`
- [PoC Postman collection](./Avascan.postman_collection.json)

##### PoC endpoints
- Swagger UI: http://localhost:8080/api/docs/
- Transactions by address: http://localhost:8080/api/transactions/address/<*address*>
- Transactions count by address: http://localhost:8080/api/transactions/count/address/<*address*>
- All transactions by AVAX: http://localhost:8080/api/transactions
- Top 100 addresses: http://localhost:8080/api/addresses

### Pending improvements
- Update swagger.
- Enable testing and linting.
- Add husky.
- Increase test coverage.
- Make requests with web3-eth-extended and set timeout then handle not processed.
- Keep the balance up-to-date by the transactions instead of getting it from the blockchain.
- Parallelize scan of all documents by partition key on get All transactions and get top addresses endpoints.
- Pagination.

### Resources
- [RPC C-chain](https://api.avax.network/ext/bc/C/rpc)
- [JSON-RPC C-chain](https://docs.infura.io/infura/networks/ethereum/json-rpc-methods)
