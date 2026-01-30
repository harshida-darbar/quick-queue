const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
  createService,
  getAllServices,
  getServiceDetails,
  joinService,
  moveToServing,
  moveToWaiting,
  markComplete,
  getOrganizerServices,
  startService,
  getUserQueueStatus,
  bookAppointment,
  getServiceAppointments,
  addTimeSlot,
} = require("../controllers/queueController");

// Public routes (for users)
router.get("/services", protect, getAllServices);
router.get("/services/:id", protect, getServiceDetails);
router.post("/services/:id/join", protect, joinService);
router.get("/services/:id/status", protect, getUserQueueStatus);
router.get("/services/:id/appointments", protect, getServiceAppointments);
router.post("/appointments", protect, bookAppointment);

// Organizer routes
router.post("/services", protect, authorize([2]), createService);
router.get("/my-services", protect, authorize([2]), getOrganizerServices);
router.patch("/services/:id/start", protect, authorize([2]), startService);
router.patch("/services/:id/serving", protect, authorize([2]), moveToServing);
router.patch("/services/:id/waiting", protect, authorize([2]), moveToWaiting);
router.patch("/services/:id/complete", protect, authorize([2]), markComplete);
router.get("/appointments/:id", protect, authorize([2]), getServiceAppointments);
router.patch("/services/:id/timeslots", protect, authorize([2]), addTimeSlot);

module.exports = router;
