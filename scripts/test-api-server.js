#!/usr/bin/env node

/**
 * API 服务器测试脚本
 * 用于验证 API 服务器是否正常运行
 */

const http = require('http');

const API_BASE = 'http://localhost:3001';

function testApi() {
  console.log('Testing API server...\n');

  // 测试健康检查端点
  console.log('1. Testing /api/health endpoint...');
  testEndpoint('/api/health', (success, data) => {
    if (success) {
      console.log('   ✓ Health check passed:', JSON.stringify(data));
    } else {
      console.log('   ✗ Health check failed');
    }
  });

  // 测试获取学生列表
  console.log('\n2. Testing /api/students endpoint...');
  testEndpoint('/api/students', (success, data) => {
    if (success) {
      console.log(`   ✓ Students endpoint passed, count: ${Array.isArray(data) ? data.length : 0}`);
    } else {
      console.log('   ✗ Students endpoint failed');
    }
  });

  // 测试获取小组列表
  console.log('\n3. Testing /api/groups endpoint...');
  testEndpoint('/api/groups', (success, data) => {
    if (success) {
      console.log(`   ✓ Groups endpoint passed, count: ${Array.isArray(data) ? data.length : 0}`);
    } else {
      console.log('   ✗ Groups endpoint failed');
    }
  });

  // 测试获取规则
  console.log('\n4. Testing /api/rules endpoint...');
  testEndpoint('/api/rules', (success, data) => {
    if (success) {
      console.log(`   ✓ Rules endpoint passed, count: ${Array.isArray(data) ? data.length : 0}`);
    } else {
      console.log('   ✗ Rules endpoint failed');
    }
  });

  // 测试获取设置
  console.log('\n5. Testing /api/settings endpoint...');
  testEndpoint('/api/settings', (success, data) => {
    if (success) {
      console.log('   ✓ Settings endpoint passed');
    } else {
      console.log('   ✗ Settings endpoint failed');
    }
  });

  console.log('\n✅ API server tests completed!');
}

function testEndpoint(path, callback) {
  const url = new URL(path, API_BASE);

  const req = http.request(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const jsonData = JSON.parse(data);
          callback(true, jsonData);
        } catch (e) {
          callback(true, data);
        }
      } else {
        callback(false, null);
      }
    });
  });

  req.on('error', (error) => {
    callback(false, null);
  });

  req.setTimeout(2000, () => {
    req.destroy();
    callback(false, null);
  });

  req.end();
}

// 等待一会儿让服务器启动
setTimeout(() => {
  testApi();
}, 1000);
