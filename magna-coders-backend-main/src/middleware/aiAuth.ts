import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}

/**
 * Middleware to authenticate AI backend requests using API key
 * Validates X-API-Key header against environment variable
 * Returns 401 for invalid/missing API keys and logs attempts
 */
export const authenticateAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const expectedApiKey = process.env.AI_API_KEY;

    // Log authentication attempt
    console.log('[AI Auth] Authentication attempt from:', req.ip);

    if (!apiKey) {
      console.warn('[AI Auth] Missing API key from:', req.ip);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'API key required'
      });
      return;
    }

    if (!expectedApiKey) {
      console.error('[AI Auth] AI_API_KEY not configured in environment');
      res.status(500).json({
        success: false,
        error: 'Configuration Error',
        message: 'Server configuration error'
      });
      return;
    }

    if (apiKey !== expectedApiKey) {
      console.warn('[AI Auth] Invalid API key attempt from:', req.ip);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
      return;
    }

    // Log successful authentication
    console.log('[AI Auth] Successful authentication from:', req.ip);
    next();
  } catch (error) {
    console.error('[AI Auth] Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to authorize user data access
 * Validates requested user ID matches authenticated user
 * Returns 403 for mismatched user IDs and creates audit logs
 */
export const authorizeUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user; // From JWT validation

    if (!authenticatedUserId) {
      console.warn('[AI Auth] No authenticated user in request');
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!requestedUserId) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User ID required'
      });
      return;
    }

    if (requestedUserId !== authenticatedUserId) {
      // Create audit log for unauthorized access attempt
      try {
        await prisma.ai_interactions.create({
          data: {
            user_id: authenticatedUserId,
            session_id: 'unauthorized_attempt',
            query_summary: `Unauthorized access attempt to user ${requestedUserId}`,
            tools_used: { event: 'unauthorized_access_attempt' },
            response_summary: 'Access denied',
            ip_address: req.ip || null,
            user_agent: req.headers['user-agent'] || null
          }
        });
      } catch (logError) {
        console.error('[AI Auth] Failed to create audit log:', logError);
      }

      console.warn(
        `[AI Auth] Unauthorized access attempt: user ${authenticatedUserId} tried to access user ${requestedUserId}`
      );

      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied to requested resource'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[AI Auth] Authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authorization error'
    });
  }
};

/**
 * Middleware to filter sensitive data from responses
 * Removes sensitive fields: password, email, apiKey, token, paymentInfo
 * Handles nested objects and arrays recursively
 */
export const filterSensitiveData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json.bind(res);

  res.json = function (data: any): Response {
    const filtered = removeSensitiveFields(data);
    return originalJson(filtered);
  };

  next();
};

/**
 * Recursively removes sensitive fields from objects and arrays
 */
function removeSensitiveFields(data: any): any {
  const sensitiveFields = [
    'password',
    'password_hash',
    'passwordHash',
    'email',
    'apiKey',
    'api_key',
    'token',
    'accessToken',
    'refreshToken',
    'paymentInfo',
    'payment_info',
    'cardNumber',
    'cvv',
    'ssn',
    'taxId'
  ];

  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => removeSensitiveFields(item));
  }

  if (typeof data === 'object') {
    const filtered: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field =>
          lowerKey.includes(field.toLowerCase())
        );

        if (!isSensitive) {
          filtered[key] = removeSensitiveFields(data[key]);
        }
      }
    }
    return filtered;
  }

  return data;
}
