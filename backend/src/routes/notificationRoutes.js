const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for user
router.get('/', protect, notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Mark single notification as read
router.put('/:id/read', protect, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', protect, notificationController.markAllAsRead);

module.exports = router;
