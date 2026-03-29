#!/usr/bin/env node

/**
 * 测试 API 服务器连接
 * 使用方法: node test-api.js
 */

const API_BASE = 'http://localhost:3001';

async function testApiConnection() {
  console.log('Testing API connection...');

  try {
    // 测试 GET /api/settings
    console.log('\n1. Testing GET /api/settings...');
    const settingsRes = await fetch(`${API_BASE}/api/settings`);
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      console.log('✓ API settings:', settings);
    } else {
      console.log('✗ Failed to get settings:', settingsRes.status);
      return false;
    }

    // 测试 GET /api/students
    console.log('\n2. Testing GET /api/students...');
    const studentsRes = await fetch(`${API_BASE}/api/students`);
    if (studentsRes.ok) {
      const students = await studentsRes.json();
      console.log(`✓ Found ${students.length} students`);
    } else {
      console.log('✗ Failed to get students:', studentsRes.status);
      return false;
    }

    // 测试 GET /api/groups
    console.log('\n3. Testing GET /api/groups...');
    const groupsRes = await fetch(`${API_BASE}/api/groups`);
    if (groupsRes.ok) {
      const groups = await groupsRes.json();
      console.log(`✓ Found ${groups.length} groups`);
    } else {
      console.log('✗ Failed to get groups:', groupsRes.status);
      return false;
    }

    // 测试 GET /api/rules
    console.log('\n4. Testing GET /api/rules...');
    const rulesRes = await fetch(`${API_BASE}/api/rules`);
    if (rulesRes.ok) {
      const rules = await rulesRes.json();
      console.log(`✓ Found ${rules.length} rules`);
    } else {
      console.log('✗ Failed to get rules:', rulesRes.status);
      return false;
    }

    console.log('\n✓ All API tests passed!');
    return true;
  } catch (error) {
    console.error('\n✗ API connection failed:', error.message);
    console.error('\nPlease make sure:');
    console.error('1. The API server is running (npm run dev)');
    console.error('2. The server is listening on port 3001');
    console.error('3. No firewall is blocking the connection');
    return false;
  }
}

testApiConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });
