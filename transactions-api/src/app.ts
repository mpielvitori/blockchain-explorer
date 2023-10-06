import config from 'config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { Worker, isMainThread, parentPort } from 'worker_threads';
import { transactionsRouter, addressesRouter } from './routes';
import { indexerProcess, initializeEnvironment } from './batch';
import { logger } from './logger';

function startServer() {
  const port = 8080;
  const swaggerDocument = yaml.load(readFileSync(`${__dirname}/swagger.yaml`, 'utf8'));
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true,
  }));

  app.use('/api/addresses', addressesRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(port, () => {
    logger.debug(`Transactions Servers is up and running on port number ${port}`);
  });
}

if (isMainThread) {
  // Main thread
  // Start batch process in a worker thread
  const worker = new Worker(__filename, {
    workerData: {},
  });

  worker.on('message', (message) => {
    if (message === 'workerReady') {
      // The worker is ready
      startServer();
    }
  });

  worker.on('error', (error) => {
    logger.error(`Worker error: ${error.message}`);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      logger.error(`Worker stopped with exit code ${code}`);
      logger.warn('The API still works without the batch process...');
    }
  });
} else {
  // Worker thread
  logger.info('****** Start worker ******');
  if (config.RESET_ENVIRONMENT === 'true') {
    initializeEnvironment().then(() => {
      logger.debug('Environment initialized successfully');
    }).catch((error) => {
      logger.error(`Error initializing the environment: ${error.message}`);
    });
  }
  if (config.ENABLE_BATCH_INDEXER === 'true') {
    indexerProcess();
  }
  parentPort.postMessage('workerReady');
}
