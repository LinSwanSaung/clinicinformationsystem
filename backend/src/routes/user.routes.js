import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import userModel from '../models/User.model.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (employees)
 * @access  Private (Admin only)
 */
router.get('/',
  authenticate,
  authorize('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { role } = req.query;
    
    const filters = {};
    if (role) {
      filters.role = role;
    }

    // For receptionists, only allow viewing doctors or active employees
    if (req.user.role === 'receptionist') {
      if (role && role !== 'doctor') {
        filters.is_active = true;
      }
    }
    
    const result = await userModel.findAll({ 
      filters,
      select: 'id, first_name, last_name, phone, role, specialty, is_active'
    });
    
    // Ensure we have a proper data structure
    const users = result?.data || result || [];
    
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    });
  })
);

/**
 * @route   POST /api/users
 * @desc    Create new user (employee)
 * @access  Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone, 
      role, 
      specialty, 
      license_number 
    } = req.body;
    
    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, and role are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user using model (password will be hashed automatically)
    const newUser = await userModel.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role,
      specialty,
      license_number,
      is_active: true
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await userModel.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (employee)
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, password_hash, id: bodyId, created_at, ...allowedFields } = updateData;
    
    // Validate required fields
    if (!allowedFields.first_name || !allowedFields.last_name || !allowedFields.email || !allowedFields.role) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and role are required'
      });
    }
    
    // Check if email is already taken by another user
    const existingUser = await userModel.findByEmail(allowedFields.email);
    if (existingUser && existingUser.id !== id) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }
    
    const updatedUser = await userModel.updateById(id, allowedFields);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  })
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.patch('/:id/status',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Don't allow deactivating your own account
    if (id === req.user.id && is_active === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }
    
    const updatedUser = await userModel.updateById(id, {
      is_active: is_active
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete - set is_active to false)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Don't allow deleting the current user
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    const deletedUser = await userModel.softDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

export default router;
