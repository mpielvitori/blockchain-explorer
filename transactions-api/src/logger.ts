import { createLogger, format, transports } from 'winston';
import config from 'config';

// create logger with timestamp and line number
export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new transports.Console({
      level: config.LOG_LEVEL,
    }),
  ],
});
