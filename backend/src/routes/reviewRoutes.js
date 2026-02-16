// quick-queue/backend/src/routes/reviewRoutes.js

const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

// Submit a review (protected)
router.post("/submit", protect, reviewController.submitReview);

// Get reviews for a queue
router.get("/queue/:queueId", reviewController.getQueueReviews);

// Check if user can review
router.get("/can-review/:appointmentId", protect, reviewController.canReview);

module.exports = router;
