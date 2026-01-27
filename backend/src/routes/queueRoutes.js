const express = require("express");
const router = express.Router();

const Queue = require("../models/Queue"); // ✅ IMPORTANT FIX

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createQueue,
  startQueue,
  pauseQueue,
  closeQueue,
  joinQueue,
  nextToken,
  getMyToken,
} = require("../controllers/queueController");

// ===============================
// ORGANIZER ROUTES (role = 2)
// ===============================

// ✅ MUST COME BEFORE :id routes
router.get("/my", protect, authorize(2), async (req, res) => {
  const queues = await Queue.find({ organizer: req.user.id });
  res.json(queues);
});

router.post("/create", protect, authorize(2), createQueue);
router.patch("/:id/start", protect, authorize(2), startQueue);
router.patch("/:id/pause", protect, authorize(2), pauseQueue);
router.patch("/:id/close", protect, authorize(2), closeQueue);
router.patch("/:id/next", protect, authorize(2), nextToken);

// ===============================
// USER ROUTES (role = 3)
// ===============================
router.post("/:id/join", protect, authorize(3), joinQueue);
router.get("/:id/my-token", protect, authorize(3), getMyToken);

module.exports = router;
