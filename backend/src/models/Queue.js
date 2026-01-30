// quick-queue/backend/src/models/Queue.js
const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true, // Format: "19:00" (7 PM)
  },
  endTime: {
    type: String,
    required: true, // Format: "20:00" (8 PM)
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: Date,
    required: true,
  },
});

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
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
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
    timeSlots: [timeSlotSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
