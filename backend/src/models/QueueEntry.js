// quick-queue/backend/src/models/queueentry.js

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
    status: {
      type: String,
      enum: ["waiting", "served", "cancelled"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueEntry", queueEntrySchema);
