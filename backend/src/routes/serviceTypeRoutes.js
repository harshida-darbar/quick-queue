// quick-queue/backend/src/routes/serviceTypeRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const {
  getAllServiceTypes,
  getAllServiceTypesAdmin,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} = require("../controllers/serviceTypeController");

// Public/Organizer routes
router.get("/", protect, getAllServiceTypes);

// Admin routes
router.get("/admin", protect, adminOnly, getAllServiceTypesAdmin);
router.post("/", protect, adminOnly, createServiceType);
router.put("/:id", protect, adminOnly, updateServiceType);
router.delete("/:id", protect, adminOnly, deleteServiceType);

module.exports = router;
