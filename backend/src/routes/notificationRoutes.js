const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for user
router.get('/', protect, notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Get scheduled notifications (for debugging)
router.get('/scheduled', protect, notificationController.getScheduledNotifications);

// Send test notification
router.post('/test', protect, notificationController.sendTestNotification);

// Mark single notification as read
router.put('/:id/read', protect, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', protect, notificationController.markAllAsRead);

// Delete all notifications
router.delete('/delete-all', protect, notificationController.deleteAllNotifications);

module.exports = router;
