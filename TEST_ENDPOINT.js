// TEST ENDPOINT - Add this to queueController.js temporarily for testing

// Add this function to test notifications immediately
exports.testNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { queueId } = req.body;
    
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Create a test notification scheduled for NOW
    const Notification = require('../models/Notification');
    const testNotification = await Notification.create({
      user: userId,
      queue: queueId,
      bookedSlotId: null,
      type: 'appointment_time',
      message: `TEST: Your appointment at ${queue.title} is starting now!`,
      scheduledFor: new Date(), // NOW
      isSent: false
    });

    res.json({ 
      success: true, 
      message: 'Test notification created. It will be sent within 1 minute by the cron job.',
      notification: testNotification 
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this route to queueRoutes.js:
// router.post('/test-notification', authMiddleware, queueController.testNotification);
