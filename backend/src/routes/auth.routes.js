import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import AuthService from '../services/Auth.service.js';
import { validateLogin, validateRegister } from '../validators/auth.validator.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', 
  authRateLimiter,
  validateLogin,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const result = await AuthService.login(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  })
);

/**
 * @route   POST /api/auth/register
 * @desc    User registration (Admin only)
 * @access  Private (Admin)
 */
router.post('/register',
  authenticate,
  authorize('admin'),
  validateRegister,
  asyncHandler(async (req, res) => {
    const userData = req.body;
    
    const result = await AuthService.register(userData, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting logic here if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  })
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

export default router;
