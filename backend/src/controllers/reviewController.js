const Review = require("../models/Review");
const Queue = require("../models/Queue");
const QueueEntry = require("../models/QueueEntry");

const submitReview = async (req, res) => {
  try {
    const { queueId, appointmentId, rating, review } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    let appointment = await QueueEntry.findById(appointmentId);
    let appointmentModel = "QueueEntry";
    
    if (!appointment) {
      const queue = await Queue.findOne({ "bookedSlots._id": appointmentId });
      if (queue) {
        appointment = queue.bookedSlots.id(appointmentId);
        appointmentModel = "Queue";
      }
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointmentUserId = appointmentModel === "QueueEntry" 
      ? appointment.user.toString() 
      : appointment.bookedBy.toString();
    
    if (appointmentUserId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (appointment.status !== "complete" && appointment.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed appointments" });
    }

    const existingReview = await Review.findOne({ user: userId, appointment: appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this appointment" });
    }

    const newReview = await Review.create({
      queue: queueId,
      user: userId,
      appointment: appointmentId,
      appointmentModel,
      rating,
      review: review || "",
    });

    await updateQueueRating(queueId);

    res.status(201).json({
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getQueueReviews = async (req, res) => {
  try {
    const { queueId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ queue: queueId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ queue: queueId });

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const canReview = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const existingReview = await Review.findOne({ user: userId, appointment: appointmentId });
    if (existingReview) {
      return res.json({ canReview: false, reason: "Already reviewed" });
    }

    let appointment = await QueueEntry.findById(appointmentId);
    if (!appointment) {
      const queue = await Queue.findOne({ "bookedSlots._id": appointmentId });
      if (queue) {
        appointment = queue.bookedSlots.id(appointmentId);
      }
    }

    if (!appointment) {
      return res.json({ canReview: false, reason: "Appointment not found" });
    }

    if (appointment.status !== "complete" && appointment.status !== "completed") {
      return res.json({ canReview: false, reason: "Appointment not completed" });
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({ message: "Server error" });
  }
};

async function updateQueueRating(queueId) {
  const reviews = await Review.find({ queue: queueId });
  
  if (reviews.length === 0) {
    await Queue.findByIdAndUpdate(queueId, {
      averageRating: 0,
      totalReviews: 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await Queue.findByIdAndUpdate(queueId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
  });
}

module.exports = {
  submitReview,
  getQueueReviews,
  canReview,
};
