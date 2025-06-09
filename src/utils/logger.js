const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFormat = format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
  ],
});

module.exports = logger;
