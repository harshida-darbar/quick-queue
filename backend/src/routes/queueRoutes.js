// quick-queue/backend/src/routes/queueRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { createQueue, startQueue, pauseQueue, closeQueue, joinQueue, nextToken, getMyToken  } = require("../controllers/queueController");

// Organizer = role 2

console.log("QUEUE ROUTES FILE LOADED");

router.post("/create", protect, authorize(2), createQueue);
router.patch("/:id/start", protect, authorize(2), startQueue);
router.patch("/:id/pause", protect, authorize(2), pauseQueue);
router.patch("/:id/close", protect, authorize(2), closeQueue);
router.post("/:id/join", protect, authorize(3), joinQueue);
router.patch("/:id/next", protect, authorize(2), nextToken);
router.get("/:id/my-token", protect, authorize(3), getMyToken);

module.exports = router;
