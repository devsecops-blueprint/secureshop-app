'use strict';

const grpc   = require('@grpc/grpc-js');
const config = require('./config');
const logger = require('./logger');
const { migrate } = require('./db');
const { createServer } = require('./grpc/server');

async function main() {
  // Run database migrations before accepting traffic
  await migrate();

  const server = createServer();

  server.bindAsync(
    `0.0.0.0:${config.port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        logger.error('Failed to bind gRPC server', { error: err.message });
        process.exit(1);
      }
      logger.info(`user-service gRPC server listening on port ${port}`);
    }
  );

  // Graceful shutdown — same concept as the Go gateway
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    server.tryShutdown(() => {
      logger.info('user-service stopped');
      process.exit(0);
    });
  });
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: err.message });
  process.exit(1);
});
