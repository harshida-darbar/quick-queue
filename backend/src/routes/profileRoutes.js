// quick-queue/backend/src/routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getProfileImage, upload } = require('../controllers/profileController');

// Get user profile
router.get('/', protect, getProfile);

// Update user profile (with optional image upload)
router.put('/', protect, upload.single('profileImage'), updateProfile);

// Serve profile image
router.get('/image/:filename', getProfileImage);

module.exports = router;