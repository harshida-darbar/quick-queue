// quick-queue/backend/src/controllers/wishlistController.js

const Wishlist = require("../models/Wishlist");
const Queue = require("../models/Queue");

// Add service to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId, preferredTimeSlot } = req.body;

    // Check if service exists
    const service = await Queue.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ user: userId, service: serviceId });
    if (existing) {
      return res.status(400).json({ message: "Service already in wishlist" });
    }

    const wishlistItem = await Wishlist.create({
      user: userId,
      service: serviceId,
      preferredTimeSlot: preferredTimeSlot || null,
    });

    res.status(201).json({
      message: "Service added to wishlist",
      wishlistItem,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove service from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId } = req.params;

    const wishlistItem = await Wishlist.findOneAndDelete({
      user: userId,
      service: serviceId,
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: "Service not found in wishlist" });
    }

    res.json({ message: "Service removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.find({ user: userId })
      .populate({
        path: "service",
        populate: {
          path: "organizer",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    res.json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if service is in wishlist
exports.checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      user: userId,
      service: serviceId,
    });

    res.json({ inWishlist: !!wishlistItem });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update preferred time slot
exports.updatePreferredTimeSlot = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceId } = req.params;
    const { preferredTimeSlot } = req.body;

    const wishlistItem = await Wishlist.findOneAndUpdate(
      { user: userId, service: serviceId },
      { preferredTimeSlot },
      { new: true }
    );

    if (!wishlistItem) {
      return res.status(404).json({ message: "Service not found in wishlist" });
    }

    res.json({
      message: "Preferred time slot updated",
      wishlistItem,
    });
  } catch (error) {
    console.error("Error updating preferred time slot:", error);
    res.status(500).json({ message: "Server error" });
  }
};
