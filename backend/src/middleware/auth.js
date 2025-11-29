import jwt from 'jsonwebtoken';
import config from '../config/app.config.js';
import { supabase, executeWithRetry } from '../config/database.js';
import { AppError, asyncHandler } from './errorHandler.js';
import { ROLES, isValidRole } from '../constants/roles.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Extract token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Access token required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // Development convenience: accept a fake token to unblock local UI
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.USE_DEV_TOKEN === 'true' &&
      token === 'test-token'
    ) {
      const roleHeader = req.headers['x-dev-role'];
      const role = roleHeader && isValidRole(roleHeader) ? roleHeader : ROLES.NURSE;
      req.user = {
        id: 'dev-user',
        email: 'dev@example.com',
        role,
        first_name: 'Dev',
        last_name: 'User',
        is_active: true,
        patient_id: null,
      };
      return next();
    }

    // Verify JWT token (support app-issued or Supabase-issued tokens)
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (primaryError) {
      const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
      if (!supabaseSecret) {
        throw primaryError;
      }
      decoded = jwt.verify(token, supabaseSecret);
    }

    // Get user from database with retry logic for network resilience
    const userId = decoded.userId || decoded.sub; // support both token payload and supabase subject
    let user, error;
    try {
      const result = await executeWithRetry(
        async () => {
          return supabase
            .from('users')
            .select('id, email, role, first_name, last_name, is_active, patient_id')
            .eq('id', userId)
            .single();
        },
        2, // 2 retries
        'User authentication lookup'
      );
      user = result.data;
      error = result.error;
    } catch (networkError) {
      // Handle network connectivity issues (e.g., VPN blocking Supabase)
      const errMsg = networkError?.message?.toLowerCase() || '';
      if (
        errMsg.includes('fetch failed') ||
        errMsg.includes('network') ||
        errMsg.includes('timeout') ||
        errMsg.includes('econnrefused') ||
        errMsg.includes('enotfound') ||
        errMsg.includes('abort')
      ) {
        throw new AppError(
          'Database connection failed. Please check your network connection or try disabling VPN.',
          503
        );
      }
      throw networkError;
    }

    if (error || !user) {
      throw new AppError('Invalid token', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }
    throw error;
  }
});

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // SECURITY: Do NOT bypass authorization - always check roles
    // Development bypass DISABLED for security

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Required role: ${roles.join(',')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await authenticate(req, res, next);
    } catch (error) {
      // Continue without authentication if token is invalid
      next();
    }
  } else {
    next();
  }
});
