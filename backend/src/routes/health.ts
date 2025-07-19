import { Router, Request, Response } from 'express';
import { createSuccessResponse, asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    message: 'ProjekSync Backend is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  res.json(createSuccessResponse(healthData));
}));

/**
 * Detailed health check endpoint with database connectivity
 * GET /health/detailed
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Test database connectivity
  let dbStatus = 'OK';
  let dbLatency = 0;
  
  try {
    const dbStartTime = Date.now();
    const { error } = await req.supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    dbLatency = Date.now() - dbStartTime;
    
    if (error) {
      dbStatus = 'ERROR';
      console.error('Database health check error:', error);
    }
  } catch (error) {
    dbStatus = 'ERROR';
    console.error('Database connectivity error:', error);
  }

  const healthData = {
    status: dbStatus === 'OK' ? 'OK' : 'DEGRADED',
    message: 'ProjekSync Backend health check',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    responseTime: Date.now() - startTime,
    services: {
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
  };

  const statusCode = dbStatus === 'OK' ? 200 : 503;
  res.status(statusCode).json(createSuccessResponse(healthData));
}));

/**
 * Readiness probe endpoint
 * GET /health/ready
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  // Check if all required environment variables are set
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Service not ready',
        details: {
          missingEnvironmentVariables: missingEnvVars,
        },
      },
    });
  }

  // Test basic database connectivity
  try {
    const { error } = await req.supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_NOT_READY',
          message: 'Database connection not ready',
        },
      });
    }
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connectivity error',
      },
    });
  }

  res.json(createSuccessResponse({
    status: 'READY',
    message: 'Service is ready to accept requests',
    timestamp: new Date().toISOString(),
  }));
}));

/**
 * Liveness probe endpoint
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  res.json(createSuccessResponse({
    status: 'ALIVE',
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));
});

export default router;