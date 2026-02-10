const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true,
  },
  bookedSlotId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['1_hour_before', '15_min_before', 'appointment_time'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isSent: {
    type: Boolean,
    default: false,
  },
  scheduledFor: {
    type: Date,
    required: true,
  },
  sentAt: {
    type: Date,
  },
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1, isSent: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
