import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import userModel from '../models/User.model.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (employees)
 * @access  Private (Admin, Receptionist, Nurse - nurses can view doctors)
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE),
  asyncHandler(async (req, res) => {
    const { role, is_active, includeDeleted } = req.query;

    const filters = {};
    if (role) {
      filters.role = role;
    }

    // Respect explicit is_active filter if provided ("true"/"false")
    if (typeof is_active === 'string') {
      if (is_active.toLowerCase() === 'true') filters.is_active = true;
      else if (is_active.toLowerCase() === 'false') filters.is_active = false;
    }

    // Exclude deleted by default unless includeDeleted=true
    if (includeDeleted !== 'true') {
      filters.deleted_at = null;
    }

    // For receptionists, only allow viewing doctors or active employees
    if (req.user.role === 'receptionist') {
      if (role && role !== 'doctor') {
        filters.is_active = true;
      }
    }

    const result = await userModel.findAll({
      filters,
      // Include meta fields used by the UI (created_at, last_login, deleted_at)
      select:
        'id, email, first_name, last_name, phone, role, specialty, is_active, created_at, last_login, deleted_at',
    });

    // Ensure we have a proper data structure
    const users = result?.data || result || [];

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length,
    });
  })
);

/**
 * @route   POST /api/users
 * @desc    Create new user (employee)
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { email, password, first_name, last_name, phone, role, specialty, license_number } =
      req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, and role are required',
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
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
      is_active: true,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
    // Log admin user creation
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'CREATE',
        entity: 'users',
        recordId: newUser?.id || null,
        result: 'success',
        meta: { role: newUser?.role },
        ip: req.ip,
      });
    } catch (e) {}
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (employee)
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Fetch to ensure not deleted
    const current = await userModel.findById(id, 'id, deleted_at, role');
    if (!current) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (current.deleted_at) {
      return res
        .status(410)
        .json({ success: false, message: 'User was deleted and cannot be modified' });
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    // But allow password updates for admins
    const { password_hash, id: bodyId, created_at, deleted_at, ...allowedFields } = updateData;

    // Handle password separately if provided
    if (updateData.password) {
      // Validate password length
      if (typeof updateData.password !== 'string' || updateData.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }
    }

    // Validate required fields
    if (
      !allowedFields.first_name ||
      !allowedFields.last_name ||
      !allowedFields.email ||
      !allowedFields.role
    ) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and role are required',
      });
    }

    // Check if email is already taken by another user
    const existingUser = await userModel.findByEmail(allowedFields.email);
    if (existingUser && existingUser.id !== id) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user',
      });
    }

    // Update password if provided
    if (updateData.password) {
      await userModel.updatePassword(id, updateData.password);
    }

    const updatedUser = await userModel.updateById(id, allowedFields);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Log user update (role changes)
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'UPDATE',
        entity: 'users',
        recordId: id,
        result: 'success',
        meta: {
          old_role: current?.role || null,
          new_role: updatedUser?.role || null,
          changed_fields: Object.keys(allowedFields),
          password_changed: !!updateData.password,
        },
        ip: req.ip,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  })
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (admin initiated)
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reset-password',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { new_password: newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const targetUser = await userModel.findById(id, 'id, deleted_at');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.deleted_at) {
      return res
        .status(410)
        .json({ success: false, message: 'User was deleted and cannot be modified' });
    }

    await userModel.updatePassword(id, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  })
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    // Don't allow deactivating your own account
    if (id === req.user.id && is_active === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    // Block re-activating or deactivating deleted users
    const current = await userModel.findById(id, 'id, deleted_at');
    if (!current) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (current.deleted_at) {
      return res
        .status(410)
        .json({ success: false, message: 'User was deleted and cannot be modified' });
    }

    const updatedUser = await userModel.updateById(id, { is_active });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser,
    });

    // Log activation/deactivation
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: is_active ? 'ACTIVATE' : 'DEACTIVATE',
        entity: 'users',
        recordId: id,
        result: 'success',
        meta: { previous_status: !is_active },
        ip: req.ip,
      });
    } catch (e) {}
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Permanently soft delete user (tombstone: set deleted_at and is_active=false)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Don't allow deleting the current user
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Get user to check role
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user is a doctor, check for active visits
    if (user.role === 'doctor') {
      const VisitModel = (await import('../models/Visit.model.js')).default;
      const visitModel = new VisitModel();
      const activeVisits = await visitModel.getDoctorActiveVisits(id);

      if (activeVisits && activeVisits.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete doctor. Doctor has ${activeVisits.length} active visit(s). Please complete or cancel the visits first.`,
          activeVisits: activeVisits.map(v => ({ id: v.id, patient_id: v.patient_id })),
        });
      }
    }

    // Mark tombstone: cannot be edited/activated again
    const updated = await userModel.updateById(id, {
      is_active: false,
      deleted_at: new Date().toISOString(),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(204).send();
    // Log deletion/tombstone
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'DELETE',
        entity: 'users',
        recordId: id,
        result: 'success',
        ip: req.ip,
      });
    } catch (e) {}
  })
);

export default router;
