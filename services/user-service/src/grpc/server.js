'use strict';

const grpc       = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path       = require('path');
const userService = require('../services/userService');
const logger     = require('../logger');

// Load the proto definition at runtime.
// proto-loader reads the .proto file and produces a JavaScript object
// that grpc-js uses to create a server — no code generation step needed.
const PROTO_PATH = path.join(__dirname, '../../proto/users.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase:    true,
  longs:       String,
  enums:       String,
  defaults:    true,
  oneofs:      true,
});

const proto = grpc.loadPackageDefinition(packageDef).users;

// gRPC status codes — these map to HTTP status codes conceptually.
// ALREADY_EXISTS → 409, UNAUTHENTICATED → 401, NOT_FOUND → 404
const STATUS = grpc.status;

// Each handler function receives (call, callback).
// call.request = the incoming proto message (already deserialized)
// callback(error, response) = send back the response

async function register(call, callback) {
  try {
    const { token, user } = await userService.register(call.request);
    callback(null, { token, user });
  } catch (err) {
    logger.error('Register error', { error: err.message });
    callback({ code: STATUS[err.code] || STATUS.INTERNAL, message: err.message });
  }
}

async function login(call, callback) {
  try {
    const { token, user } = await userService.login(call.request);
    callback(null, { token, user });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    callback({ code: STATUS[err.code] || STATUS.INTERNAL, message: err.message });
  }
}

async function getUser(call, callback) {
  try {
    const user = await userService.getUser({ userId: call.request.user_id });
    callback(null, user);
  } catch (err) {
    logger.error('GetUser error', { error: err.message });
    callback({ code: STATUS[err.code] || STATUS.INTERNAL, message: err.message });
  }
}

async function validateToken(call, callback) {
  try {
    const result = userService.validateToken({ token: call.request.token });
    callback(null, result);
  } catch (err) {
    logger.error('ValidateToken error', { error: err.message });
    callback({ code: STATUS.INTERNAL, message: err.message });
  }
}

function createServer() {
  const server = new grpc.Server();
  server.addService(proto.UserService.service, {
    register,
    login,
    getUser,
    validateToken,
  });
  return server;
}

module.exports = { createServer };
