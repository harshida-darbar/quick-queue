// quick-queue/backend/src/models/Queue.js

const mongoose = require("mongoose");

// Availability window schema - organizer sets these
const availabilityWindowSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true, // Format: "16:00" (4 PM)
  },
  endTime: {
    type: String,
    required: true, // Format: "19:00" (7 PM)
  },
});

// Booked slot schema - user creates these by selecting from availability
const bookedSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true, // Format: "16:15" (4:15 PM)
  },
  endTime: {
    type: String,
    required: true, // Format: "16:45" (4:45 PM) - always +30min
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookedUserName: {
    type: String,
    required: true,
  },
  groupSize: {
    type: Number,
    required: true,
    min: 1,
  },
  memberNames: [{
    type: String,
    required: true,
  }],
  status: {
    type: String,
    enum: ['booked', 'completed', 'cancelled'],
    default: 'booked',
  },
  paymentAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    default: '',
  },
  paymentDate: {
    type: Date,
  },
}, { timestamps: true });

const queueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["inactive", "active", "paused", "closed"],
      default: "inactive",
    },
    currentServing: {
      type: Number,
      default: 0,
    },
    // New fields for appointment booking
    appointmentEnabled: {
      type: Boolean,
      default: false,
    },
    availabilityWindows: [availabilityWindowSchema],
    bookedSlots: [bookedSlotSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
