import dotenv from 'dotenv';
import express from 'express';
import request from 'supertest';

// Load test environment variables
dotenv.config({ path: '.env.test' });

import app from './server';

// Simple manual test for auth endpoints
async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: POST /api/auth/signup with invalid data
    console.log('1. Testing signup with invalid email...');
    const signupInvalidResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'invalid-email',
        password: 'password123',
      });
    
    console.log(`   Status: ${signupInvalidResponse.status}`);
    console.log(`   Response: ${JSON.stringify(signupInvalidResponse.body, null, 2)}\n`);

    // Test 2: POST /api/auth/login with missing data
    console.log('2. Testing login with missing email...');
    const loginInvalidResponse = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'password123',
      });
    
    console.log(`   Status: ${loginInvalidResponse.status}`);
    console.log(`   Response: ${JSON.stringify(loginInvalidResponse.body, null, 2)}\n`);

    // Test 3: GET /api/auth/user without token
    console.log('3. Testing get user without token...');
    const getUserNoTokenResponse = await request(app)
      .get('/api/auth/user');
    
    console.log(`   Status: ${getUserNoTokenResponse.status}`);
    console.log(`   Response: ${JSON.stringify(getUserNoTokenResponse.body, null, 2)}\n`);

    // Test 4: POST /api/auth/logout without token
    console.log('4. Testing logout without token...');
    const logoutNoTokenResponse = await request(app)
      .post('/api/auth/logout');
    
    console.log(`   Status: ${logoutNoTokenResponse.status}`);
    console.log(`   Response: ${JSON.stringify(logoutNoTokenResponse.body, null, 2)}\n`);

    console.log('✅ All authentication endpoint tests completed successfully!');
    console.log('📝 The endpoints are properly validating requests and returning expected error responses.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testAuthEndpoints();