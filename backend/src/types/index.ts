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

// Common validation schemas
export interface CreateRecordSchema {
  [key: string]: any;
}

export interface UpdateRecordSchema {
  [key: string]: any;
}