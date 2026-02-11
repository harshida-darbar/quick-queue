// quick-queue/backend/src/services/notificationService.js

const Queue = require('../models/Queue');
const Notification = require('../models/Notification');

// Create notifications when appointment is booked
exports.createAppointmentNotifications = async (userId, queueId, bookedSlotId, appointmentDate, startTime, serviceTitle) => {
  try {
    const queue = await Queue.findById(queueId);
    if (!queue) return;

    // Parse the date string properly to avoid timezone issues
    let dateStr;
    if (typeof appointmentDate === 'string') {
      dateStr = appointmentDate; // Already in YYYY-MM-DD format
    } else {
      dateStr = appointmentDate.toISOString().split('T')[0];
    }

    // Combine date and time to create full appointment datetime
    const [hours, minutes] = startTime.split(':');
    
    // Create date using local time to avoid timezone offset issues
    const [year, month, day] = dateStr.split('-');
    const appointmentDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      0,
      0
    );

    const now = new Date();
    console.log(' Current time:', now.toLocaleString());
    console.log(' Appointment time:', appointmentDateTime.toLocaleString());
    console.log(' Time difference (minutes):', Math.round((appointmentDateTime - now) / 60000));

    const notifications = [];
    
    // 1 hour before notification
    const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
    console.log('1 hour before:', oneHourBefore.toLocaleString(), '>', now.toLocaleString(), '=', oneHourBefore > now);
    if (oneHourBefore > now) {
      notifications.push({
        user: userId,
        queue: queueId,
        bookedSlotId,
        type: '1_hour_before',
        message: `Reminder: Your appointment at ${queue.title} starts in 1 hour at ${startTime}`,
        scheduledFor: oneHourBefore,
      });
    }

    // 30 minutes before notification
    const thirtyMinBefore = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
    console.log('30 min before:', thirtyMinBefore.toLocaleString(), '>', now.toLocaleString(), '=', thirtyMinBefore > now);
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

    // 15 minutes before notification
    const fifteenMinBefore = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    console.log('15 min before:', fifteenMinBefore.toLocaleString(), '>', now.toLocaleString(), '=', fifteenMinBefore > now);
    if (fifteenMinBefore > now) {
      notifications.push({
        user: userId,
        queue: queueId,
        bookedSlotId,
        type: '15_min_before',
        message: `Reminder: Your appointment at ${queue.title} starts in 15 minutes at ${startTime}`,
        scheduledFor: fifteenMinBefore,
      });
    }

    // At appointment time notification
    console.log('At appointment:', appointmentDateTime.toLocaleString(), '>', now.toLocaleString(), '=', appointmentDateTime > now);
    if (appointmentDateTime > now) {
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
      console.log(`Created ${notifications.length} notifications for appointment at ${startTime}`);
    } else {
      console.log(' No notifications created - all times are in the past');
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

    console.log(`Found ${dueNotifications.length} due notifications`);

    for (const notification of dueNotifications) {
      // Emit socket notification to user
      if (io && notification.user) {
        const userId = notification.user._id.toString();
        const roomName = userId;
        
        console.log(` Sending notification to user ${userId} (room: ${roomName}): ${notification.message}`);
        
        // Emit to the user's room
        io.to(roomName).emit('notification', {
          id: notification._id,
          message: notification.message,
          type: notification.type,
          queue: notification.queue,
          createdAt: notification.createdAt,
        });
        
        // Also check how many sockets are in this room
        const socketsInRoom = await io.in(roomName).fetchSockets();
        console.log(`   Room ${roomName} has ${socketsInRoom.length} connected socket(s)`);
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
