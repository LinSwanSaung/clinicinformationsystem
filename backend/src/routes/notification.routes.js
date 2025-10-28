import express from 'express';
import NotificationService from '../services/Notification.service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get current user's notifications
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await NotificationService.getUserNotifications(req.user.id, limit);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await NotificationService.deleteNotification(req.params.id);
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
