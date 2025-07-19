import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { 
  validateSignup, 
  validateLogin, 
  sanitizeAuthData 
} from '../utils/validation';
import { 
  SignupRequest, 
  LoginRequest, 
  ApiSuccessResponse, 
  ApiErrorResponse,
  AuthResponse,
  UserProfile 
} from '../types';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validation = validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid signup data',
          details: validation.errors,
        },
      } as ApiErrorResponse);
    }

    // Sanitize data
    const sanitizedData = sanitizeAuthData(req.body as SignupRequest);
    const { email, password, fullName, businessName } = sanitizedData;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
        },
      },
    });

    if (authError) {
      console.error('Signup error:', authError);
      
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'A user with this email already exists',
          },
        } as ApiErrorResponse);
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: authError.message || 'Failed to create user account',
        },
      } as ApiErrorResponse);
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: 'Failed to create user account',
        },
      } as ApiErrorResponse);
    }

    // Create user profile if additional data provided
    if (fullName || businessName) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          business_name: businessName,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the signup if profile creation fails
      }
    }

    // Prepare response
    const response: AuthResponse = {
      user: authData.user,
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
      } : null as any,
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'User account created successfully',
    } as ApiSuccessResponse<AuthResponse>);

  } catch (error) {
    console.error('Signup endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during signup',
      },
    } as ApiErrorResponse);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login data',
          details: validation.errors,
        },
      } as ApiErrorResponse);
    }

    // Sanitize data
    const sanitizedData = sanitizeAuthData(req.body as LoginRequest);
    const { email, password } = sanitizedData;

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Login error:', authError);
      
      // Handle specific authentication errors
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        } as ApiErrorResponse);
      }

      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'EMAIL_NOT_CONFIRMED',
            message: 'Please confirm your email address before logging in',
          },
        } as ApiErrorResponse);
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: authError.message || 'Authentication failed',
        },
      } as ApiErrorResponse);
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Authentication failed',
        },
      } as ApiErrorResponse);
    }

    // Prepare response
    const response: AuthResponse = {
      user: authData.user,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
      },
    };

    res.status(200).json({
      success: true,
      data: response,
      message: 'Login successful',
    } as ApiSuccessResponse<AuthResponse>);

  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during login',
      },
    } as ApiErrorResponse);
  }
});

/**
 * POST /api/auth/logout
 * Logout current user and invalidate session
 */
router.post('/logout', async (req: Request, res: Response) => {
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
      } as ApiErrorResponse);
    }

    const token = authHeader.substring(7);

    // Sign out with Supabase Auth
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout error:', error);
      // Don't fail logout if token is already invalid
      if (!error.message.includes('invalid') && !error.message.includes('expired')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: error.message || 'Failed to logout',
          },
        } as ApiErrorResponse);
      }
    }

    res.status(200).json({
      success: true,
      data: null,
      message: 'Logout successful',
    } as ApiSuccessResponse<null>);

  } catch (error) {
    console.error('Logout endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during logout',
      },
    } as ApiErrorResponse);
  }
});

/**
 * GET /api/auth/user
 * Get current authenticated user data
 */
router.get('/user', async (req: Request, res: Response) => {
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
      } as ApiErrorResponse);
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      } as ApiErrorResponse);
    }

    // Get user profile data
    let userProfile: UserProfile | null = null;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileError && profileData) {
      userProfile = profileData as UserProfile;
    }

    // Prepare response with user and profile data
    const responseData = {
      user,
      profile: userProfile,
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'User data retrieved successfully',
    } as ApiSuccessResponse<typeof responseData>);

  } catch (error) {
    console.error('Get user endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while retrieving user data',
      },
    } as ApiErrorResponse);
  }
});

export default router;