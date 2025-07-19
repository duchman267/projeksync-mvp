import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authentication middleware for protected routes
 * Validates JWT token from Authorization header and sets req.user
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authorization token format',
        },
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await req.supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }

    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_MIDDLEWARE_ERROR',
        message: 'Authentication verification failed',
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't block request if invalid
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const { data: { user }, error } = await req.supabase.auth.getUser(token);
        
        if (!error && user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Log error but don't block request
    console.error('Optional auth middleware error:', error);
    next();
  }
};