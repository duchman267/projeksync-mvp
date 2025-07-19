import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';

// Extend Express Request interface to include Supabase clients
declare global {
  namespace Express {
    interface Request {
      supabase: typeof supabase;
      supabaseAdmin: typeof supabaseAdmin;
    }
  }
}

/**
 * Middleware to attach Supabase clients to the request object
 * This makes the clients available throughout the request lifecycle
 */
export const supabaseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Attach both regular and admin Supabase clients to request
    req.supabase = supabase;
    req.supabaseAdmin = supabaseAdmin;
    
    next();
  } catch (error) {
    console.error('Supabase middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUPABASE_CONNECTION_ERROR',
        message: 'Failed to initialize database connection',
      },
    });
  }
};