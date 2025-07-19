import { Request, Response, NextFunction } from 'express';

// Standard error interface
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Standard API response interfaces
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

/**
 * Global error handling middleware
 * Catches all errors and returns standardized error responses
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error details for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id || 'anonymous',
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid input data';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (err.message?.includes('duplicate key')) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  } else if (err.message?.includes('foreign key')) {
    statusCode = 400;
    errorCode = 'INVALID_REFERENCE';
    message = 'Referenced resource does not exist';
  }

  // Prepare error response
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { details: err.details }),
    },
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create standardized API error
 */
export const createApiError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Create standardized success response
 */
export const createSuccessResponse = <T>(
  data: T,
  message?: string
): ApiSuccessResponse<T> => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};