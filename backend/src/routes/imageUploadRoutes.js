// quick-queue/backend/src/routes/imageUploadRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  uploadSingleMiddleware,
  uploadMultipleMiddleware,
  handleSingleUpload,
  handleMultipleUpload,
  getServiceImage,
  deleteServiceImage,
} = require("../controllers/imageUploadController");

// Upload single image (for organizers)
router.post("/upload", protect, uploadSingleMiddleware, handleSingleUpload);

// Upload multiple images (for organizers)
router.post("/upload-multiple", protect, uploadMultipleMiddleware, handleMultipleUpload);

// Get service image (public)
router.get("/image/:filename", getServiceImage);

// Delete service image (for organizers/admin)
router.delete("/image/:filename", protect, deleteServiceImage);

module.exports = router;
