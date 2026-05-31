'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('./config');

// Structured JSON logging — Loki (our log aggregator) can parse
// JSON logs automatically and index every field for querying.
const logger = createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
