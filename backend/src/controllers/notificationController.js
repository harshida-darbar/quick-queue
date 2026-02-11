
// quick-queue/backend/src/controllers/notificationController.js

const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// TEST ENDPOINT - Send immediate test notification
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const io = req.app.get('io');
    
    // Create a test notification that's due immediately
    const testNotification = await Notification.create({
      user: userId,
      queue: '000000000000000000000000', // Dummy queue ID
      bookedSlotId: 'test-slot',
      type: '15_min_before',
      scheduledFor: new Date(), // Due now
      isSent: false,
    });

    console.log('notification created:', testNotification._id);

    // Manually trigger the notification check
    const sentCount = await notificationService.checkAndSendNotifications(io);
    
    res.json({ 
      success: true, 
      message: 'notification sent! Check your notification bell.',
      notificationId: testNotification._id,
      sentCount 
    });
  } catch (error) {
    console.error('notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all scheduled notifications (for debugging)
exports.getScheduledNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('queue', 'title')
      .sort({ scheduledFor: 1 });
    
    const now = new Date();
    const pending = notifications.filter(n => !n.isSent && n.scheduledFor > now);
    const sent = notifications.filter(n => n.isSent);
    const missed = notifications.filter(n => !n.isSent && n.scheduledFor <= now);
    
    res.json({ 
      success: true, 
      summary: {
        total: notifications.length,
        pending: pending.length,
        sent: sent.length,
        missed: missed.length,
      },
      notifications: {
        pending,
        sent,
        missed,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete all notifications for current user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
