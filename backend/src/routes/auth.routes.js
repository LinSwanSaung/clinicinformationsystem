import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import AuthService from '../services/Auth.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import {
  validateLogin,
  validateRegister,
  validatePatientRegister,
  validatePatientBind,
} from '../validators/auth.validator.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await AuthService.login(email, password);

      // Log successful login (fire-and-forget)
      try {
        logAuditEvent({
          userId: result.user?.id || null,
          role: result.user?.role || null,
          action: 'LOGIN_SUCCESS',
          entity: 'auth',
          result: 'success',
          ip: req.ip,
        });
      } catch (e) {
        // ignore
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      // Log failed login attempt (avoid storing PHI)
      try {
        logAuditEvent({
          userId: null,
          role: null,
          action: 'LOGIN_FAILURE',
          entity: 'auth',
          result: 'failure',
          meta: { reason: err.message ? String(err.message).slice(0, 200) : 'unknown' },
          ip: req.ip,
        });
      } catch (e) {}

      throw err; // let asyncHandler handle response
    }
  })
);

/**
 * @route   POST /api/auth/register-patient
 * @desc    Patient self-registration
 * @access  Public
 */
router.post(
  '/register-patient',
  authRateLimiter,
  validatePatientRegister,
  asyncHandler(async (req, res) => {
    const result = await AuthService.registerPatient(req.body);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });
  })
);

/**
 * @route   GET /api/auth/patient-accounts
 * @desc    List patient portal accounts
 * @access  Private (Admin)
 */
router.get(
  '/patient-accounts',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { search = '', limit = 50, page = 1 } = req.query;
    const options = {
      search,
      limit: Math.min(parseInt(limit, 10) || 50, 100),
      offset: ((parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 50),
    };

    const result = await AuthService.getPatientAccounts(options);

    res.status(200).json({
      success: true,
      data: result.accounts,
      total: result.total,
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: Math.min(parseInt(limit, 10) || 50, 100),
      },
    });
  })
);

/**
 * @route   POST /api/auth/register
 * @desc    User registration (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/register',
  authenticate,
  authorize(ROLES.ADMIN),
  validateRegister,
  asyncHandler(async (req, res) => {
    const userData = req.body;

    const result = await AuthService.register(userData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting logic here if needed

    // Log logout
    try {
      logAuditEvent({
        userId: req.user?.id || null,
        role: req.user?.role || null,
        action: 'LOGOUT',
        entity: 'auth',
        result: 'success',
        ip: req.ip,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

/**
 * @route   POST /api/auth/bind-patient
 * @desc    Link patient account to clinical record
 * @access  Private (Patient)
 */
router.post(
  '/bind-patient',
  authenticate,
  authorize('patient'),
  validatePatientBind,
  asyncHandler(async (req, res) => {
    const { patient_number, date_of_birth } = req.body;

    const result = await AuthService.bindPatientAccount(req.user.id, patient_number, date_of_birth);

    res.status(200).json({
      success: true,
      message: 'Patient record linked successfully',
      data: result,
    });
  })
);

/**
 * @route   POST /api/auth/patient-accounts/:userId/bind
 * @desc    Admin bind patient account to patient record
 * @access  Private (Admin)
 */
router.post(
  '/patient-accounts/:userId/bind',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { patient_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'patient_id is required',
      });
    }

    const account = await AuthService.adminBindPatientAccount(req.params.userId, patient_id);

    res.status(200).json({
      success: true,
      message: 'Patient account linked successfully',
      data: account,
    });
  })
);

/**
 * @route   DELETE /api/auth/patient-accounts/:userId/bind
 * @desc    Admin unbind patient account
 * @access  Private (Admin)
 */
router.delete(
  '/patient-accounts/:userId/bind',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const account = await AuthService.adminUnbindPatientAccount(req.params.userId);

    res.status(200).json({
      success: true,
      message: 'Patient account unlinked successfully',
      data: account,
    });
  })
);

/**
 * @route   PUT /api/auth/patient-accounts/:userId/deactivate
 * @desc    Admin deactivate a patient account
 * @access  Private (Admin)
 */
router.put(
  '/patient-accounts/:userId/deactivate',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const account = await AuthService.adminSetPatientAccountActive(req.params.userId, false);

    try {
      logAuditEvent({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'PATIENT_ACCOUNT_DEACTIVATE',
        entity_type: 'user',
        entity_id: req.params.userId,
        new_values: { is_active: false },
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Patient account deactivated',
      data: account,
    });
  })
);

/**
 * @route   PUT /api/auth/patient-accounts/:userId/activate
 * @desc    Admin activate a patient account
 * @access  Private (Admin)
 */
router.put(
  '/patient-accounts/:userId/activate',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const account = await AuthService.adminSetPatientAccountActive(req.params.userId, true);

    try {
      logAuditEvent({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'PATIENT_ACCOUNT_ACTIVATE',
        entity_type: 'user',
        entity_id: req.params.userId,
        new_values: { is_active: true },
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Patient account activated',
      data: account,
    });
  })
);

/**
 * @route   DELETE /api/auth/patient-accounts/:userId
 * @desc    Admin delete a patient account (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/patient-accounts/:userId',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const result = await AuthService.adminDeletePatientAccount(req.params.userId);

    try {
      logAuditEvent({
        actor_id: req.user.id,
        actor_role: req.user.role,
        action: 'PATIENT_ACCOUNT_DELETE',
        entity_type: 'user',
        entity_id: req.params.userId,
        new_values: { is_active: false },
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Patient account deleted (soft)',
      data: result,
    });
  })
);

export default router;
