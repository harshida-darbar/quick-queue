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
      enum: ["waiting", "serving", "complete"],
      default: "waiting",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueEntry", queueEntrySchema);
