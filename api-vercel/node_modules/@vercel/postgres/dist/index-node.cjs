"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }







var _chunkPKSWROYWcjs = require('./chunk-PKSWROYW.cjs');

// src/index-node.ts
var _serverless = require('@neondatabase/serverless');
var _ws = require('ws'); var _ws2 = _interopRequireDefault(_ws);
if (_serverless.neonConfig) {
  _serverless.neonConfig.webSocketConstructor = _ws2.default;
}








exports.VercelClient = _chunkPKSWROYWcjs.VercelClient; exports.VercelPool = _chunkPKSWROYWcjs.VercelPool; exports.createClient = _chunkPKSWROYWcjs.createClient; exports.createPool = _chunkPKSWROYWcjs.createPool; exports.db = _chunkPKSWROYWcjs.db; exports.postgresConnectionString = _chunkPKSWROYWcjs.postgresConnectionString; exports.sql = _chunkPKSWROYWcjs.sql;
//# sourceMappingURL=index-node.cjs.map