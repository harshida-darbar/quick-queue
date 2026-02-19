// quick-queue/backend/src/models/QueueEntry.js

const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema(
  {
    queue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    groupSize: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },
    memberNames: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["waiting", "serving", "complete", "cancelled"],
      default: "waiting",
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "dummy",
    },
    paymentDate: {
      type: Date,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    cancelledAt: {
      type: Date,
    },
    refundPercentage: {
      type: Number,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueEntry", queueEntrySchema);
