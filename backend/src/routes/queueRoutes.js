const express = require("express");
const router = express.Router();

const Queue = require("../models/Queue");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const QueueEntry = require("../models/QueueEntry");

const {
  createQueue,
  startQueue,
  pauseQueue,
  closeQueue,
  joinQueue,
  nextToken,
  getMyToken,
  getActiveQueues,
} = require("../controllers/queueController");

// MUST be on top
router.get("/my", protect, authorize([2]), async (req, res) => {
  const queues = await Queue.find({ organizer: req.user.id });

  const data = await Promise.all(
    queues.map(async (q) => {
      const waitingCount = await QueueEntry.countDocuments({
        queue: q._id,
        status: "waiting",
      });

      return {
        ...q.toObject(),
        waitingCount,
      };
    }),
  );

  res.json(data);
});

// router.post("/create", protect, authorize(2), createQueue);
// router.patch("/:id/start", protect, authorize(2), startQueue);
// router.patch("/:id/pause", protect, authorize(2), pauseQueue);
// router.patch("/:id/close", protect, authorize(2), closeQueue);
// router.patch("/:id/next", protect, authorize(2), nextToken);

// // ===============================
// // USER ROUTES (role = 3)
// // ===============================

// // ✅ PLACE THIS BEFORE :id routes
// router.get("/active", protect, authorize(3), getActiveQueues);

// router.post("/:id/join", protect, authorize(3), joinQueue);
// router.get("/:id/my-token", protect, authorize(3), getMyToken);

// Organizer
router.post("/create", protect, authorize([2]), createQueue);
router.patch("/:id/start", protect, authorize([2]), startQueue);
router.patch("/:id/pause", protect, authorize([2]), pauseQueue);
router.patch("/:id/close", protect, authorize([2]), closeQueue);
router.patch("/:id/next", protect, authorize([2]), nextToken);

// User
router.get("/active", protect, authorize([3]), getActiveQueues);
router.post("/:id/join", protect, authorize([3]), joinQueue);
router.get("/:id/my-token", protect, authorize([3]), getMyToken);

module.exports = router;
