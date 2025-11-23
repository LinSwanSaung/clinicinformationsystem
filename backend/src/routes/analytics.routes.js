import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import AnalyticsService from '../services/Analytics.service.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/revenue-trends
 * @desc    Get revenue trends for date range
 * @access  Private (Admin only)
 */
router.get(
  '/revenue-trends',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const analyticsService = new AnalyticsService();
    const result = await analyticsService.getRevenueTrends({ startDate, endDate });

    res.json(result);
  })
);

/**
 * @route   GET /api/analytics/visit-status
 * @desc    Get visit status breakdown
 * @access  Private (Admin only)
 */
router.get(
  '/visit-status',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const analyticsService = new AnalyticsService();
    const result = await analyticsService.getVisitStatusBreakdown({ startDate, endDate });

    res.json(result);
  })
);

/**
 * @route   GET /api/analytics/top-doctors
 * @desc    Get top doctors by visits and revenue
 * @access  Private (Admin only)
 */
router.get(
  '/top-doctors',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { limit = 5, startDate, endDate } = req.query;

    const analyticsService = new AnalyticsService();
    const result = await analyticsService.getTopDoctors({
      limit: parseInt(limit),
      startDate,
      endDate,
    });

    res.json(result);
  })
);

/**
 * @route   GET /api/analytics/payment-methods
 * @desc    Get payment methods breakdown
 * @access  Private (Admin only)
 */
router.get(
  '/payment-methods',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const analyticsService = new AnalyticsService();
    const result = await analyticsService.getPaymentMethodsBreakdown({ startDate, endDate });

    res.json(result);
  })
);

/**
 * @route   GET /api/analytics/dhis2-export
 * @desc    Export DHIS2 CSV data for a month
 * @access  Private (Admin only)
 */
router.get(
  '/dhis2-export',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
      });
    }

    const analyticsService = new AnalyticsService();
    const result = await analyticsService.exportDHIS2CSV({
      year: parseInt(year),
      month: parseInt(month),
    });

    res.json(result);
  })
);

export default router;
