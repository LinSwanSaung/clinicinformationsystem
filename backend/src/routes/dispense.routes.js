import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ROLES } from '../constants/roles.js';
import DispensesService from '../services/Dispenses.service.js';
import { successResponse } from '../utils/responseHelper.js';

const router = express.Router();

/**
 * @route GET /api/dispenses
 * @desc List dispensed medicines with filters
 * @access Private (Cashier, Pharmacist, Admin)
 */
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.PHARMACIST),
  asyncHandler(async (req, res) => {
    const { from, to, search, page, pageSize, sortBy, sortDir } = req.query;
    const result = await DispensesService.list({
      from,
      to,
      search,
      page,
      pageSize,
      sortBy,
      sortDir,
    });
    return successResponse(
      res,
      {
        items: result.items,
        total: result.total,
        summary: result.summary,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 25,
      },
      'Success'
    );
  })
);

/**
 * @route GET /api/dispenses/export
 * @desc Export dispensed medicines as CSV (same filters)
 * @access Private (Cashier, Pharmacist, Admin)
 */
router.get(
  '/export',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.CASHIER, ROLES.PHARMACIST),
  asyncHandler(async (req, res) => {
    const { from, to, search, sortBy, sortDir } = req.query;
    const csv = await DispensesService.exportCsv({ from, to, search, sortBy, sortDir });
    const filename = `dispenses_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  })
);

export default router;
