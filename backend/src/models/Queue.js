// quick-queue/backend/src/models/Queue.js
const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
