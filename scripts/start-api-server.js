#!/usr/bin/env node

/**
 * 独立启动 API 服务器
 * 用于开发和测试
 */

const { fork } = require('child_process');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'dist-electron', 'api-server.js');

console.log('Starting API server from:', apiPath);
console.log('API Server will run on http://localhost:3001\n');

const apiServer = fork(apiPath, [], { stdio: 'inherit' });

apiServer.on('error', (err) => {
  console.error('API Server error:', err);
  process.exit(1);
});

apiServer.on('exit', (code, signal) => {
  console.log(`\nAPI Server exited with code ${code} and signal ${signal}`);
  process.exit(code || 0);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  apiServer.kill();
});

process.on('SIGTERM', () => {
  console.log('\nShutting down API server...');
  apiServer.kill();
});
