// notificationService.js

const Queue = require('../models/Queue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

// Send FCM push notification
const sendFCMNotification = async (fcmToken, message) => {
  try {
    const result = await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Quick Queue',
        body: message,
      },
      webpush: {
        fcmOptions: {
          link: 'http://localhost:3000/user/appointments'
        },
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          requireInteraction: true,
        }
      }
    });
    return result;
  } catch (error) {
    console.error(' FCM Error:', error.code, error.message);
    throw error;
  }
};

// Create notifications when appointment is booked - ONLY 30 minutes before
exports.createAppointmentNotifications = async (userId, queueId, bookedSlotId, appointmentDate, startTime, serviceTitle) => {
  try {
    const queue = await Queue.findById(queueId);
    if (!queue) return;

    let dateStr;
    if (typeof appointmentDate === 'string') {
      dateStr = appointmentDate;
    } else {
      dateStr = appointmentDate.toISOString().split('T')[0];
    }

    const [hours, minutes] = startTime.split(':');
    const [year, month, day] = dateStr.split('-');
    const appointmentDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      0,
      0
    );

    const now = new Date();
    const notifications = [];
    
    // Only 30 minutes before notification
    const thirtyMinBefore = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
    
    if (thirtyMinBefore > now) {
      notifications.push({
        user: userId,
        queue: queueId,
        bookedSlotId,
        type: '30_min_before',
        message: `Reminder: Your appointment at ${queue.title} starts in 30 minutes at ${startTime}`,
        scheduledFor: thirtyMinBefore,
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
    

    
    const dueNotifications = await Notification.find({
      scheduledFor: { $lte: now },
      isSent: false,
    }).populate('user', 'name email fcmToken').populate('queue', 'title serviceType');

    if (dueNotifications.length > 0) {
      console.log(`Sending ${dueNotifications.length} notification(s)`);
    }

    for (const notification of dueNotifications) {
      if (notification.user) {
        const userId = notification.user._id.toString();
        const roomName = userId;
        
        // Check if user is online (has active socket connection)
        const socketsInRoom = io ? await io.in(roomName).fetchSockets() : [];
        const isUserOnline = socketsInRoom.length > 0;
        
        
        if (isUserOnline && io) {
          // User is online - send via Socket.IO
          io.to(roomName).emit('notification', {
            id: notification._id,
            message: notification.message,
            type: notification.type,
            queue: notification.queue,
            createdAt: notification.createdAt,
          });
          console.log(`✅ Sent to ${notification.user.name} via Socket.IO`);
        } else if (notification.user.fcmToken) {
          // User is offline - send via FCM push
          await sendFCMNotification(notification.user.fcmToken, notification.message);
          console.log(`✅ Sent to ${notification.user.name} via FCM`);
        }
      }

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
