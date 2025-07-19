import request from 'supertest';
import app from '../server';
import { supabase, supabaseAdmin } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      admin: {
        signOut: jest.fn(),
      },
    },
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'John Doe',
      businessName: 'Doe Consulting',
    };

    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
        token_type: 'bearer',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validSignupData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          session: mockSession,
        },
        message: 'User account created successfully',
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validSignupData.email,
        password: validSignupData.password,
        options: {
          data: {
            full_name: validSignupData.fullName,
            business_name: validSignupData.businessName,
          },
        },
      });
    });

    it('should return validation error for invalid email', async () => {
      const invalidData = {
        ...validSignupData,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid signup data',
          details: [
            { field: 'email', message: 'Invalid email format' },
          ],
        },
      });

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should return validation error for weak password', async () => {
      const invalidData = {
        ...validSignupData,
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid signup data',
          details: [
            { 
              field: 'password', 
              message: 'Password must be at least 8 characters long and contain at least one letter and one number' 
            },
          ],
        },
      });

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should return error when user already exists', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' } as any,
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validSignupData)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this email already exists',
        },
      });
    });

    it('should handle Supabase signup errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Signup failed' } as any,
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(validSignupData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: 'Signup failed',
        },
      });
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
        token_type: 'bearer',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          session: mockSession,
        },
        message: 'Login successful',
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validLoginData.email,
        password: validLoginData.password,
      });
    });

    it('should return validation error for missing email', async () => {
      const invalidData = {
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login data',
          details: [
            { field: 'email', message: 'Email is required' },
          ],
        },
      });

      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return error for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' } as any,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    });

    it('should return error for unconfirmed email', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' } as any,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'EMAIL_NOT_CONFIRMED',
          message: 'Please confirm your email address before logging in',
        },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      mockSupabase.auth.admin.signOut.mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'Logout successful',
      });

      expect(mockSupabase.auth.admin.signOut).toHaveBeenCalledWith('valid-token');
    });

    it('should return error when no token provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });

      expect(mockSupabase.auth.admin.signOut).not.toHaveBeenCalled();
    });

    it('should handle logout with invalid token gracefully', async () => {
      mockSupabase.auth.admin.signOut.mockResolvedValue({
        error: { message: 'invalid token' } as any,
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'Logout successful',
      });
    });
  });

  describe('GET /api/auth/user', () => {
    it('should return user data successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'John Doe',
        business_name: 'Doe Consulting',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any);

      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          profile: mockProfile,
        },
        message: 'User data retrieved successfully',
      });

      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token');
    });

    it('should return error when no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });

      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should return error for invalid token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' } as any,
      });

      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    });

    it('should return user data without profile if profile not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' },
            }),
          }),
        }),
      } as any);

      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: mockUser,
          profile: null,
        },
        message: 'User data retrieved successfully',
      });
    });
  });
});