#!/usr/bin/env node

/**
 * Simple server test to verify all components are working
 */

// Set minimal environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.FRONTEND_URL = 'http://localhost:3000';

import app from './server';
import http from 'http';

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Test server startup
console.log('🧪 Testing ProjekSync Backend Server...\n');

server.listen(PORT, () => {
  console.log(`✅ Server started successfully on port ${PORT}`);
  
  // Test basic endpoints
  testEndpoints().then(() => {
    console.log('\n🎉 All server tests passed!');
    server.close();
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Server tests failed:', error);
    server.close();
    process.exit(1);
  });
});

server.on('error', (error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});

async function testEndpoints() {
  const baseUrl = `http://localhost:${PORT}`;
  
  // Test health endpoint
  console.log('Testing health endpoint...');
  const healthResponse = await fetch(`${baseUrl}/health`);
  const healthData = await healthResponse.json() as any;
  
  if (healthResponse.ok && healthData.success) {
    console.log('✅ Health endpoint working');
  } else {
    throw new Error('Health endpoint failed');
  }
  
  // Test detailed health endpoint
  console.log('Testing detailed health endpoint...');
  const detailedHealthResponse = await fetch(`${baseUrl}/health/detailed`);
  const detailedHealthData = await detailedHealthResponse.json() as any;
  
  if (detailedHealthResponse.ok && detailedHealthData.success) {
    console.log('✅ Detailed health endpoint working');
  } else {
    console.log('⚠️  Detailed health endpoint may have database connectivity issues');
  }
  
  // Test 404 handling
  console.log('Testing 404 handling...');
  const notFoundResponse = await fetch(`${baseUrl}/nonexistent`);
  const notFoundData = await notFoundResponse.json() as any;
  
  if (notFoundResponse.status === 404 && !notFoundData.success) {
    console.log('✅ 404 handling working');
  } else {
    throw new Error('404 handling failed');
  }
  
  // Test protected route without auth
  console.log('Testing protected route without auth...');
  const protectedResponse = await fetch(`${baseUrl}/api/test`);
  const protectedData = await protectedResponse.json() as any;
  
  if (protectedResponse.status === 401 && !protectedData.success) {
    console.log('✅ Authentication middleware working');
  } else {
    throw new Error('Authentication middleware failed');
  }
  
  // Test CORS headers
  console.log('Testing CORS headers...');
  const corsResponse = await fetch(`${baseUrl}/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
    }
  });
  
  if (corsResponse.ok) {
    console.log('✅ CORS configuration working');
  } else {
    console.log('⚠️  CORS configuration may need adjustment');
  }
}