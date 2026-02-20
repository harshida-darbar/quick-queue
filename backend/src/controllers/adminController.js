// quick-queue/backend/src/controllers/adminController.js

const User = require("../models/User");
const Queue = require("../models/Queue");
const QueueEntry = require("../models/QueueEntry");
const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

// Get dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setDate(now.getDate() - 30));

    // Total bookings
    const totalBookings = await QueueEntry.countDocuments();
    const todayBookings = await QueueEntry.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const weekBookings = await QueueEntry.countDocuments({
      createdAt: { $gte: weekStart },
    });
    const monthBookings = await QueueEntry.countDocuments({
      createdAt: { $gte: monthStart },
    });

    // Booking status breakdown
    const completedBookings = await QueueEntry.countDocuments({
      status: "complete",
    });
    const servingBookings = await QueueEntry.countDocuments({
      status: "serving",
    });
    const waitingBookings = await QueueEntry.countDocuments({
      status: "waiting",
    });

    // Revenue calculation
    const revenueData = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$paymentAmount" },
        },
      },
    ]);

    const todayRevenue = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$paymentAmount" },
        },
      },
    ]);

    const weekRevenue = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$paymentAmount" },
        },
      },
    ]);

    const monthRevenue = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$paymentAmount" },
        },
      },
    ]);

    // Average rating
    const avgRatingData = await Queue.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$averageRating" },
          totalReviews: { $sum: "$totalReviews" },
        },
      },
    ]);

    // User statistics
    const totalUsers = await User.countDocuments({ role: 3 });
    const totalOrganizers = await User.countDocuments({ role: 2 });
    const totalServices = await Queue.countDocuments();

    // Revenue by day (last 7 days)
    const revenueByDay = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$paymentAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Revenue by week (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const revenueByWeek = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: twelveWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" },
          },
          revenue: { $sum: "$paymentAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
    ]);

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const revenueByMonth = await QueueEntry.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          revenue: { $sum: "$paymentAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Bookings by service type
    const bookingsByServiceType = await QueueEntry.aggregate([
      {
        $lookup: {
          from: "queues",
          localField: "queue",
          foreignField: "_id",
          as: "serviceData",
        },
      },
      {
        $unwind: "$serviceData",
      },
      {
        $group: {
          _id: "$serviceData.serviceType",
          count: { $sum: 1 },
          revenue: { $sum: "$paymentAmount" },
        },
      },
    ]);

    res.json({
      bookings: {
        total: totalBookings,
        today: todayBookings,
        week: weekBookings,
        month: monthBookings,
        completed: completedBookings,
        serving: servingBookings,
        waiting: waitingBookings,
      },
      revenue: {
        total: revenueData[0]?.totalRevenue || 0,
        today: todayRevenue[0]?.revenue || 0,
        week: weekRevenue[0]?.revenue || 0,
        month: monthRevenue[0]?.revenue || 0,
        byDay: revenueByDay,
        byWeek: revenueByWeek,
        byMonth: revenueByMonth,
      },
      ratings: {
        average: avgRatingData[0]?.averageRating || 0,
        totalReviews: avgRatingData[0]?.totalReviews || 0,
      },
      users: {
        total: totalUsers,
        organizers: totalOrganizers,
      },
      services: {
        total: totalServices,
      },
      bookingsByServiceType,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (![1, 2, 3].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all services with pagination
exports.getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Queue.find()
      .populate("organizer", "name email")
      .sort({ createdAt: -1 });

    // Add computed fields and map database fields to frontend expectations
    const servicesWithExtras = services.map(service => {
      const serviceObj = service.toObject();
      return {
        ...serviceObj,
        photoUrl: serviceObj.photo || serviceObj.photoUrl, // Map photo to photoUrl
        location: serviceObj.address || serviceObj.location, // Map address to location
        totalBookings: serviceObj.bookedSlots?.length || 0,
      };
    });

    res.json(servicesWithExtras);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Queue.findByIdAndDelete(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Also delete related queue entries and reviews
    await QueueEntry.deleteMany({ queue: serviceId });
    await Review.deleteMany({ queue: serviceId });

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all reviews with pagination
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("queue", "title serviceType")
      .sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformedReviews = reviews.map(review => ({
      _id: review._id,
      user: review.user,
      service: review.queue, // Map queue to service
      rating: review.rating,
      reviewText: review.review, // Map review to reviewText
      createdAt: review.createdAt,
    }));

    res.json(transformedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update queue rating
    const reviews = await Review.find({ queue: review.queue });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    await Queue.findByIdAndUpdate(review.queue, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all payments/transactions
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await QueueEntry.find({ paymentStatus: "completed" })
      .populate("user", "name email")
      .populate("queue", "title serviceType price")
      .sort({ paymentDate: -1 });

    // Transform data to include service info and price per person
    const transformedPayments = payments.map((payment) => {
      const pricePerPerson = payment.groupSize > 0 
        ? Math.round(payment.paymentAmount / payment.groupSize) 
        : payment.paymentAmount;
      
      return {
        _id: payment._id,
        user: payment.user,
        service: payment.queue,
        paymentAmount: payment.paymentAmount,
        pricePerPerson: pricePerPerson,
        paymentStatus: payment.paymentStatus,
        paymentMethod: payment.paymentMethod === "dummy" ? "Online" : payment.paymentMethod,
        paymentDate: payment.paymentDate || payment.createdAt,
        invoiceNumber: payment.invoiceNumber,
        groupSize: payment.groupSize,
        createdAt: payment.createdAt,
      };
    });

    res.json(transformedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("user", "name email profileImage")
      .populate({
        path: "queue",
        select: "title serviceType address price",
        populate: {
          path: "organizer",
          select: "name email"
        }
      })
      .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};
