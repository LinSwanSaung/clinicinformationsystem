import jwt from 'jsonwebtoken';
import config from '../config/app.config.js';
import { supabase } from '../config/database.js';
import { AppError, asyncHandler } from './errorHandler.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Development bypass disabled - use real authentication
  if (false && (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true')) {
    console.log('DEV MODE: Bypassing authentication');
    req.user = {
      id: 'ff9ca1bf-4964-4703-9212-a2feadc2cbd2', // Use real admin user ID
      email: 'minswanpyae@gmail.com',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      is_active: true
    };
    return next();
  }

  // Extract token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Access token required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active, patient_id')
      .eq('id', decoded.userId)
      .single();

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
    // Development bypass for testing
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      console.log('DEV MODE: Bypassing authorization for roles:', roles);
      return next();
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(`Access denied. Required role: ${roles.join(',').replace(/,/g, ',')}`, 403);
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
