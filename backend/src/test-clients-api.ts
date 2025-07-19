#!/usr/bin/env tsx

import express from 'express';
import request from 'supertest';
import clientRoutes from './routes/clients';

// Mock user for testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
};

// Mock Supabase client
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns?: string, options?: any) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options?: any) => ({
          range: (from: number, to: number) => Promise.resolve({
            data: [],
            error: null,
            count: 0,
          }),
        }),
        or: (filter: string) => ({
          order: (column: string, options?: any) => ({
            range: (from: number, to: number) => Promise.resolve({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
      }),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { id: 'new-client-id', ...data, user_id: mockUser.id },
          error: null,
        }),
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: value, ...data },
            error: null,
          }),
        }),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({
        error: null,
      }),
    }),
  }),
};

// Create test app
const app = express();
app.use(express.json());

// Mock Supabase middleware
app.use((req, res, next) => {
  req.supabase = mockSupabaseClient as any;
  next();
});

// Mock auth middleware for testing
app.use((req, res, next) => {
  req.user = mockUser as any;
  next();
});

app.use('/api/clients', clientRoutes);

async function testClientsAPI() {
  console.log('🧪 Testing Clients API...\n');

  try {
    // Test GET /api/clients
    console.log('1. Testing GET /api/clients');
    const getResponse = await request(app)
      .get('/api/clients')
      .expect(200);
    
    console.log('✅ GET /api/clients - Success');
    console.log('Response:', JSON.stringify(getResponse.body, null, 2));
    console.log('');

    // Test POST /api/clients with valid data
    console.log('2. Testing POST /api/clients with valid data');
    const validClientData = {
      name: 'Test Client',
      email: 'client@example.com',
      phone: '+1234567890',
      address: '123 Test Street',
    };

    const postResponse = await request(app)
      .post('/api/clients')
      .send(validClientData)
      .expect(201);

    console.log('✅ POST /api/clients - Success');
    console.log('Response:', JSON.stringify(postResponse.body, null, 2));
    console.log('');

    // Test POST /api/clients with invalid data
    console.log('3. Testing POST /api/clients with invalid data');
    const invalidResponse = await request(app)
      .post('/api/clients')
      .send({})
      .expect(400);

    console.log('✅ POST /api/clients validation - Success');
    console.log('Response:', JSON.stringify(invalidResponse.body, null, 2));
    console.log('');

    // Test PUT /api/clients/:id with invalid ID format
    console.log('4. Testing PUT /api/clients/:id with invalid ID');
    const putInvalidResponse = await request(app)
      .put('/api/clients/invalid-id')
      .send({ name: 'Updated Name' })
      .expect(400);

    console.log('✅ PUT /api/clients/:id validation - Success');
    console.log('Response:', JSON.stringify(putInvalidResponse.body, null, 2));
    console.log('');

    // Test DELETE /api/clients/:id with invalid ID format
    console.log('5. Testing DELETE /api/clients/:id with invalid ID');
    const deleteInvalidResponse = await request(app)
      .delete('/api/clients/invalid-id')
      .expect(400);

    console.log('✅ DELETE /api/clients/:id validation - Success');
    console.log('Response:', JSON.stringify(deleteInvalidResponse.body, null, 2));
    console.log('');

    console.log('🎉 All Clients API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testClientsAPI();