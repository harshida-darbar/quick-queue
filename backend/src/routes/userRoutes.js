const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Save FCM token
router.post('/save-fcm-token', protect, userController.saveFcmToken);

module.exports = router;
