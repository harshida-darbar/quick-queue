// quick-queue/backend/src/models/Wishlist.js

const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true,
    },
    preferredTimeSlot: {
      type: String,
      default: null, // e.g., "morning", "afternoon", "evening" or specific time
    },
  },
  { timestamps: true }
);

// Ensure a user can only add a service once to their wishlist
wishlistSchema.index({ user: 1, service: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
