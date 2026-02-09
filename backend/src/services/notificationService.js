const Queue = require('../models/Queue');
const Notification = require('../models/Notification');

// Create notifications when appointment is booked
exports.createAppointmentNotifications = async (userId, queueId, bookedSlotId, appointmentDateTime) => {
  try {
    const queue = await Queue.findById(queueId);
    if (!queue) return;

    const notifications = [];
    
    // 1 hour before notification
    const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > new Date()) {
      notifications.push({
        user: userId,
        queue: queueId,
        bookedSlotId,
        type: '1_hour_before',
        message: `Reminder: Your appointment at ${queue.title} starts in 1 hour`,
        scheduledFor: oneHourBefore,
      });
    }

    // 15 minutes before notification
    const fifteenMinBefore = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    if (fifteenMinBefore > new Date()) {
      notifications.push({
        user: userId,
        queue: queueId,
        bookedSlotId,
        type: '15_min_before',
        message: `Reminder: Your appointment at ${queue.title} starts in 15 minutes`,
        scheduledFor: fifteenMinBefore,
      });
    }

    // At appointment time notification
    if (appointmentDateTime > new Date()) {
      notifications.push({
        user: userId,
        queue: queueId,
        bookedSlotId,
        type: 'appointment_time',
        message: `Your appointment at ${queue.title} is starting now!`,
        scheduledFor: appointmentDateTime,
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.error('Error creating appointment notifications:', error);
    throw error;
  }
};

// Check and send due notifications
exports.checkAndSendNotifications = async (io) => {
  try {
    const now = new Date();
    
    // Find notifications that are due and not sent yet
    const dueNotifications = await Notification.find({
      scheduledFor: { $lte: now },
      isSent: false,
    }).populate('user', 'name email').populate('queue', 'title serviceType');

    for (const notification of dueNotifications) {
      // Emit socket notification to user
      if (io && notification.user) {
        io.to(notification.user._id.toString()).emit('notification', {
          id: notification._id,
          message: notification.message,
          type: notification.type,
          queue: notification.queue,
          createdAt: notification.createdAt,
        });
      }

      // Mark as sent
      notification.isSent = true;
      notification.sentAt = new Date();
      await notification.save();
    }

    return dueNotifications.length;
  } catch (error) {
    console.error('Error checking notifications:', error);
    return 0;
  }
};

// Get user notifications
exports.getUserNotifications = async (userId, limit = 20) => {
  try {
    const notifications = await Notification.find({ user: userId })
      .populate('queue', 'title serviceType photo')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Get unread count
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
      isSent: true,
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Mark notification as read
exports.markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all as read
exports.markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};
