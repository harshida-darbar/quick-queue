// quick-queue/backend/src/controler/userController.js

const User = require('../models/User');

// Save FCM token
exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { fcmToken });

    res.json({ success: true, message: 'FCM token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
