// quick-queue/backend/src/routes/adminRoutes.js

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getDashboardAnalytics,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllServicesAdmin,
  deleteService,
  getAllReviews,
  deleteReview,
  getAllPayments,
  getAllAppointments,
} = require("../controllers/adminController");

// All routes require admin authentication (role 1)
router.use(protect);
router.use(authorize(1));

// Analytics
router.get("/analytics", getDashboardAnalytics);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

// Service management
router.get("/services", getAllServicesAdmin);
router.delete("/services/:serviceId", deleteService);

// Review management
router.get("/reviews", getAllReviews);
router.delete("/reviews/:reviewId", deleteReview);

// Payment management
router.get("/payments", getAllPayments);

// Appointment management
router.get("/appointments", getAllAppointments);

module.exports = router;
