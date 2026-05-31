'use strict';

// Same pattern as the Go gateway — read from environment, fall back to dev defaults.
// In Kubernetes these come from Secrets and ConfigMaps.
module.exports = {
  port:        process.env.PORT         || '50051',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://secureshop:dev-password@localhost:5432/userdb',
  jwtSecret:   process.env.JWT_SECRET   || 'dev-secret-change-in-prod',
  jwtExpiry:   process.env.JWT_EXPIRY   || '24h',
  nodeEnv:     process.env.NODE_ENV     || 'development',
};
