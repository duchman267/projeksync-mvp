import { User } from '@supabase/supabase-js';

// Re-export Supabase types
export { User } from '@supabase/supabase-js';

// API Response types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Request types with user context
export interface AuthenticatedRequest extends Request {
  user: User;
}

// Common database record types
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface UserOwnedRecord extends BaseRecord {
  user_id: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface SearchFilter {
  search?: string;
}

// Client types
export interface Client extends UserOwnedRecord {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ClientsQueryParams extends PaginationParams, SearchFilter {
  sortBy?: 'name' | 'email' | 'created_at' | 'updated_at';
}

// Authentication types
export interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
  businessName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

export interface UserProfile {
  id: string;
  full_name?: string;
  business_name?: string;
  created_at: string;
  updated_at: string;
}

// Common validation schemas
export interface CreateRecordSchema {
  [key: string]: any;
}

export interface UpdateRecordSchema {
  [key: string]: any;
}