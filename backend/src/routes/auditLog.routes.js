import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import AuditLogService from '../services/AuditLog.service.js';

const router = express.Router();

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with optional filters (admin only)
 * @access  Private (Admin only)
 */
router.get('/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const {
      limit = 50,
      offset = 0,
      user_id,
      action,
      entity,
      start_date,
      end_date
    } = req.query;

    const options = {
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      offset: parseInt(offset, 10) || 0,
      userId: user_id || null,
      action: action || null,
      entity: entity || null,
      startDate: start_date || null,
      endDate: end_date || null
    };

    const result = await AuditLogService.getAuditLogs(options);

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: result.data,
      total: result.total,
      pagination: {
        limit: result.limit,
        offset: result.offset
      }
    });
  })
);

/**
 * @route   GET /api/audit-logs/filters
 * @desc    Get distinct actions and entities for filter dropdowns
 * @access  Private (Admin only)
 */
router.get('/filters',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const actions = await AuditLogService.getDistinctActions();
    const entities = await AuditLogService.getDistinctEntities();

    res.status(200).json({
      success: true,
      data: {
        actions,
        entities
      }
    });
  })
);

export default router;
