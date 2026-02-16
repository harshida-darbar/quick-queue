// quick-queue/backend/src/models/Review.js

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "appointmentModel",
    },
    appointmentModel: {
      type: String,
      enum: ["QueueEntry", "Queue"],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Ensure one review per user per appointment
reviewSchema.index({ user: 1, appointment: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
