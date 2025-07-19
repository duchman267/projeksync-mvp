import request from 'supertest';
import express from 'express';
import clientRoutes from '../routes/clients';

// Mock Supabase before importing anything that uses it
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
};

const mockClient = {
  id: 'client-123',
  user_id: 'user-123',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  address: '123 Test Street',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockClients = [
  mockClient,
  {
    id: 'client-456',
    user_id: 'user-123',
    name: 'Another Client',
    email: 'another@example.com',
    phone: '+0987654321',
    address: '456 Another Street',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock middleware
  app.use((req, res, next) => {
    req.supabase = mockSupabaseClient as any;
    next();
  });
  
  app.use((req, res, next) => {
    req.user = mockUser as any;
    next();
  });
  
  app.use('/api/clients', clientRoutes);
  return app;
};

describe('Clients API', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/clients', () => {
    it('should return clients for authenticated user', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: mockClients,
        error: null,
        count: 2,
      });

      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clients');
    });

    it('should handle search parameter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: [mockClient],
        error: null,
        count: 1,
      });

      const response = await request(app)
        .get('/api/clients?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%Test%,email.ilike.%Test%');
    });

    it('should handle pagination parameters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: mockClients,
        error: null,
        count: 2,
      });

      const response = await request(app)
        .get('/api/clients?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockQuery.range).toHaveBeenCalledWith(5, 9); // offset 5, limit 5
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      const response = await request(app)
        .get('/api/clients')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /api/clients', () => {
    const validClientData = {
      name: 'New Client',
      email: 'new@example.com',
      phone: '+1234567890',
      address: '789 New Street',
    };

    it('should create a new client with valid data', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: { ...mockClient, ...validClientData },
        error: null,
      });

      const response = await request(app)
        .post('/api/clients')
        .send(validClientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validClientData.name);
      expect(response.body.message).toBe('Client created successfully');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...validClientData,
        user_id: mockUser.id,
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual({
        field: 'name',
        message: 'Client name is required',
      });
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          name: 'Test Client',
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should validate phone format', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          name: 'Test Client',
          phone: 'invalid-phone',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toContainEqual({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await request(app)
        .post('/api/clients')
        .send(validClientData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /api/clients/:id', () => {
    const clientId = 'client-123';
    const updateData = {
      name: 'Updated Client',
      email: 'updated@example.com',
    };

    it('should update an existing client', async () => {
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);
      
      mockSelectQuery.single.mockResolvedValue({
        data: { id: clientId },
        error: null,
      });
      
      mockUpdateQuery.single.mockResolvedValue({
        data: { ...mockClient, ...updateData },
        error: null,
      });

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.message).toBe('Client updated successfully');
    });

    it('should validate client ID format', async () => {
      const response = await request(app)
        .put('/api/clients/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ID');
    });

    it('should return 404 for non-existent client', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_NOT_FOUND');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    const clientId = 'client-123';

    it('should delete an existing client', async () => {
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      const mockProjectsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockProjectsQuery)
        .mockReturnValueOnce(mockDeleteQuery);
      
      mockSelectQuery.single.mockResolvedValue({
        data: { id: clientId, name: 'Test Client' },
        error: null,
      });
      
      mockProjectsQuery.eq.mockResolvedValue({
        data: [],
        error: null,
      });
      
      mockDeleteQuery.eq.mockResolvedValue({
        error: null,
      });

      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Client deleted successfully');
    });

    it('should validate client ID format', async () => {
      const response = await request(app)
        .delete('/api/clients/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ID');
    });

    it('should return 404 for non-existent client', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_NOT_FOUND');
    });

    it('should prevent deletion of client with projects', async () => {
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      
      const mockProjectsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockProjectsQuery);
      
      mockSelectQuery.single.mockResolvedValue({
        data: { id: clientId, name: 'Test Client' },
        error: null,
      });
      
      mockProjectsQuery.eq.mockResolvedValue({
        data: [{ id: 'project-1' }, { id: 'project-2' }],
        error: null,
      });

      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CLIENT_HAS_PROJECTS');
      expect(response.body.error.details.projectCount).toBe(2);
    });
  });
});

describe('Client Validation Utils', () => {
  const { validateCreateClient, validateUpdateClient, sanitizeClientData } = require('../utils/validation');

  describe('validateCreateClient', () => {
    it('should validate valid client data', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Test Street',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name field', () => {
      const result = validateCreateClient({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Client name is required',
      });
    });

    it('should validate email format', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        email: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should validate phone format', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        phone: 'abc123',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    });
  });

  describe('validateUpdateClient', () => {
    it('should validate valid update data', () => {
      const result = validateUpdateClient({
        name: 'Updated Client',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require at least one field', () => {
      const result = validateUpdateClient({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'general',
        message: 'At least one field must be provided for update',
      });
    });
  });

  describe('sanitizeClientData', () => {
    it('should sanitize string inputs', () => {
      const result = sanitizeClientData({
        name: '  Test Client  ',
        email: '  test@example.com  ',
        phone: '  +1234567890  ',
        address: '  123 Test Street  ',
      });

      expect(result.name).toBe('Test Client');
      expect(result.email).toBe('test@example.com');
      expect(result.phone).toBe('+1234567890');
      expect(result.address).toBe('123 Test Street');
    });

    it('should handle undefined values', () => {
      const result = sanitizeClientData({
        name: 'Test Client',
      });

      expect(result.name).toBe('Test Client');
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();
    });
  });
});