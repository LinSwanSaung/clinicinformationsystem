import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import ServiceService from '../services/Service.service.js';

const router = express.Router();

/**
 * @route   GET /api/services
 * @desc    Get all active services
 * @access  Private (All roles)
 */
router.get('/',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const services = await ServiceService.getActiveServices();
    
    res.status(200).json({
      success: true,
      data: services
    });
  })
);

/**
 * @route   GET /api/services/category/:category
 * @desc    Get services by category
 * @access  Private (All roles)
 */
router.get('/category/:category',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { category } = req.params;
    const services = await ServiceService.getServicesByCategory(category);
    
    res.status(200).json({
      success: true,
      data: services
    });
  })
);

/**
 * @route   GET /api/services/search
 * @desc    Search services
 * @access  Private (All roles)
 */
router.get('/search',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    const services = await ServiceService.searchServices(q || '');
    
    res.status(200).json({
      success: true,
      data: services
    });
  })
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Private (All roles)
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await ServiceService.getServiceById(id);
    
    res.status(200).json({
      success: true,
      data: service
    });
  })
);

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const service = await ServiceService.createService(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  })
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await ServiceService.updateService(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  })
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await ServiceService.deleteService(id);
    
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
      data: service
    });
  })
);

export default router;
