// quick-queue/backend/src/routes/wishlistRoutes.js

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  updatePreferredTimeSlot,
} = require("../controllers/wishlistController");

// All routes require authentication
router.post("/", protect, addToWishlist);
router.get("/", protect, getWishlist);
router.get("/check/:serviceId", protect, checkWishlist);
router.delete("/:serviceId", protect, removeFromWishlist);
router.patch("/:serviceId/time-slot", protect, updatePreferredTimeSlot);

module.exports = router;
