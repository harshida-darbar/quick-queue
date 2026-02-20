// quick-queue/backend/src/controllers/queueController.js

const Queue = require("../models/Queue");
const QueueEntry = require("../models/QueueEntry");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { title, description, serviceType, photo, photos, address, maxCapacity, price, appointmentEnabled, availabilityWindows } = req.body;
    
    console.log('Received service data:', req.body); // Debug log
    console.log('Availability windows received:', availabilityWindows); // Debug log

    if (!title || !description || !serviceType || !maxCapacity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Handle photos array - if photos array is provided, use it; otherwise use single photo
    let photoArray = [];
    if (photos && Array.isArray(photos) && photos.length > 0) {
      photoArray = photos;
    } else if (photo) {
      photoArray = [photo];
    }

    const service = await Queue.create({
      title,
      description,
      serviceType,
      photo: photoArray[0] || "", // Keep first photo as main photo for backward compatibility
      photos: photoArray, // Store all photos in array
      address: address || "",
      maxCapacity,
      price: price || 0,
      organizer: req.user.id,
      appointmentEnabled: appointmentEnabled || false,
      availabilityWindows: availabilityWindows || [],
      bookedSlots: [],
    });

    console.log('Created service:', service); // Debug log

    res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active services for user dashboard
exports.getAllServices = async (req, res) => {
  try {
    const { search, serviceType, available, page = 1, limit = 6 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build match conditions
    let matchConditions = { status: "active" };
    
    // Add search functionality
    if (search) {
      matchConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { serviceType: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add serviceType filter functionality
    if (serviceType && serviceType !== 'all' && serviceType !== 'available') {
      matchConditions.serviceType = { $regex: `^${serviceType}$`, $options: 'i' };
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: "queueentries",
          localField: "_id",
          foreignField: "queue",
          as: "entries",
        },
      },
      {
        $addFields: {
          servingCapacity: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$entries",
                    as: "e",
                    cond: { $eq: ["$$e.status", "serving"] },
                  },
                },
                as: "entry",
                in: "$$entry.groupSize",
              },
            },
          },
          servingCount: {
            $size: {
              $filter: {
                input: "$entries",
                as: "e",
                cond: { $eq: ["$$e.status", "serving"] },
              },
            },
          },
          waitingCount: {
            $size: {
              $filter: {
                input: "$entries",
                as: "e",
                cond: { $eq: ["$$e.status", "waiting"] },
              },
            },
          },
          isFull: { $gte: ["$servingCapacity", "$maxCapacity"] },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          serviceType: 1,
          photo: 1,
          photos: 1,
          address: 1,
          maxCapacity: 1,
          price: 1,
          servingCapacity: 1,
          servingCount: 1,
          waitingCount: 1,
          appointmentEnabled: 1,
          timeSlots: 1,
          isFull: 1,
          averageRating: 1,
          totalReviews: 1,
        },
      },
    ];

    // Apply availability filter in aggregation if needed
    if (available === 'true') {
      pipeline.push({ $match: { isFull: false } });
    }

    // Get total count before pagination
    const totalCountPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Queue.aggregate(totalCountPipeline);
    const totalServices = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination to pipeline
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const services = await Queue.aggregate(pipeline);
    const totalPages = Math.ceil(totalServices / limitNum);

    res.json({
      services,
      totalPages,
      currentPage: pageNum,
      totalServices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get service details
exports.getServiceDetails = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const service = await Queue.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const servingUsers = await QueueEntry.find({
      queue: serviceId,
      status: "serving",
    }).populate("user", "name email");

    const waitingUsers = await QueueEntry.find({
      queue: serviceId,
      status: "waiting",
    }).populate("user", "name email").sort({ tokenNumber: 1 });

    const completedUsers = await QueueEntry.find({
      queue: serviceId,
      status: "complete",
    }).populate("user", "name email").sort({ updatedAt: -1 });

    // Calculate serving capacity (sum of group sizes)
    const servingCapacity = servingUsers.reduce((sum, entry) => sum + entry.groupSize, 0);

    // Add servingCapacity to service object
    const serviceWithCapacity = {
      ...service.toObject(),
      servingCapacity
    };

    res.json({
      service: serviceWithCapacity,
      servingUsers,
      waitingUsers,
      completedUsers,
      servingCount: servingUsers.length,
      waitingCount: waitingUsers.length,
      completedCount: completedUsers.length,
      isFull: servingCapacity >= service.maxCapacity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Join a service queue
exports.joinService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    const { groupSize = 1, memberNames = [], paymentAmount, paymentStatus, paymentMethod } = req.body;

    // Validate group size
    if (groupSize < 1 || groupSize > 20) {
      return res.status(400).json({ message: "Group size must be between 1 and 20" });
    }

    // Validate member names
    if (memberNames.length !== groupSize) {
      return res.status(400).json({ message: "Number of names must match group size" });
    }

    if (memberNames.some(name => !name || name.trim() === '')) {
      return res.status(400).json({ message: "All member names are required" });
    }

    const service = await Queue.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.status !== "active") {
      return res.status(400).json({ message: "Service is not active" });
    }

    // Check if user already joined
    const existingEntry = await QueueEntry.findOne({
      queue: serviceId,
      user: userId,
      status: { $in: ["waiting", "serving"] },
    });

    if (existingEntry) {
      return res.status(400).json({ message: "You already joined this service" });
    }

    // Count current serving capacity (sum of group sizes)
    const servingEntries = await QueueEntry.find({
      queue: serviceId,
      status: "serving",
    });
    const currentServingCapacity = servingEntries.reduce((sum, entry) => sum + entry.groupSize, 0);

    // Generate token number
    const lastEntry = await QueueEntry.find({ queue: serviceId })
      .sort({ tokenNumber: -1 })
      .limit(1);
    const nextToken = lastEntry.length > 0 ? lastEntry[0].tokenNumber + 1 : 1;

    // Determine initial status based on available capacity
    let initialStatus = "waiting";
    let message = "You are in waiting list";
    
    if (currentServingCapacity + groupSize <= service.maxCapacity) {
      initialStatus = "serving";
      message = `Your group of ${groupSize} (${memberNames.join(', ')}) is now being served`;
    } else {
      const waitingCount = await QueueEntry.countDocuments({ queue: serviceId, status: "waiting" });
      message = `Service capacity exceeded. Your group of ${groupSize} (${memberNames.join(', ')}) is in waiting position ${waitingCount + 1}`;
    }

    // Generate unique invoice number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    const invoiceNumber = `INV-${dateStr}-${randomNum}`;

    const entry = await QueueEntry.create({
      queue: serviceId,
      user: userId,
      tokenNumber: nextToken,
      groupSize,
      memberNames: memberNames.map(name => name.trim()),
      status: initialStatus,
      paymentAmount: paymentAmount || 0,
      paymentStatus: paymentStatus || 'completed',
      paymentMethod: paymentMethod || 'dummy',
      paymentDate: new Date(),
      invoiceNumber: invoiceNumber
    });

    res.status(201).json({
      message,
      token: nextToken,
      groupSize,
      memberNames: entry.memberNames,
      status: initialStatus,
      queueEntry: entry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer: Move user to serving
exports.moveToServing = async (req, res) => {
  try {
    const { entryId } = req.body;
    const serviceId = req.params.id;

    const service = await Queue.findById(serviceId);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const entry = await QueueEntry.findById(entryId);
    if (!entry || entry.queue.toString() !== serviceId) {
      return res.status(404).json({ message: "Entry not found" });
    }

    // Check capacity for group size
    const servingEntries = await QueueEntry.find({
      queue: serviceId,
      status: "serving",
    });
    const currentServingCapacity = servingEntries.reduce((sum, entry) => sum + entry.groupSize, 0);

    if (currentServingCapacity >= service.maxCapacity) {
      return res.status(400).json({ message: "Service is at full capacity" });
    }

    entry.status = "serving";
    await entry.save();

    res.json({ message: "User moved to serving", entry });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer: Move user to waiting
exports.moveToWaiting = async (req, res) => {
  try {
    const { entryId } = req.body;
    const serviceId = req.params.id;

    const service = await Queue.findById(serviceId);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const entry = await QueueEntry.findById(entryId);
    if (!entry || entry.queue.toString() !== serviceId) {
      return res.status(404).json({ message: "Entry not found" });
    }

    entry.status = "waiting";
    await entry.save();

    res.json({ message: "User moved to waiting", entry });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer: Mark user as complete
exports.markComplete = async (req, res) => {
  try {
    const { entryId } = req.body;
    const serviceId = req.params.id;

    const service = await Queue.findById(serviceId);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const entry = await QueueEntry.findById(entryId);
    if (!entry || entry.queue.toString() !== serviceId) {
      return res.status(404).json({ message: "Entry not found" });
    }

    entry.status = "complete";
    await entry.save();

    // Auto-move next waiting user to serving if space available
    const servingEntries = await QueueEntry.find({
      queue: serviceId,
      status: "serving",
    });
    const currentServingCapacity = servingEntries.reduce((sum, entry) => sum + entry.groupSize, 0);

    if (currentServingCapacity < service.maxCapacity) {
      const nextWaiting = await QueueEntry.findOne({
        queue: serviceId,
        status: "waiting",
      }).sort({ tokenNumber: 1 });

      if (nextWaiting && currentServingCapacity + nextWaiting.groupSize <= service.maxCapacity) {
        nextWaiting.status = "serving";
        await nextWaiting.save();
      }
    }

    res.json({ message: "User marked as complete", entry });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get organizer's services with pagination
exports.getOrganizerServices = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalServices = await Queue.countDocuments({ organizer: req.user.id });
    const services = await Queue.find({ organizer: req.user.id })
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalServices / limitNum);

    res.json({
      services,
      totalPages,
      currentPage: pageNum,
      totalServices
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Start service
exports.startService = async (req, res) => {
  try {
    const service = await Queue.findById(req.params.id);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    service.status = "active";
    await service.save();

    res.json({ message: "Service started successfully", service });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get service availability (availability windows and booked slots)
exports.getServiceAvailability = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const service = await Queue.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Filter out cancelled slots and populate user details for active booked slots
    const User = require('../models/User');
    const activeSlots = service.bookedSlots.filter(slot => slot.status !== 'cancelled');
    const bookedSlotsWithUserData = await Promise.all(
      activeSlots.map(async (slot) => {
        const user = await User.findById(slot.bookedBy).select('name profileImage');
        return {
          ...slot.toObject(),
          bookedUserProfileImage: user?.profileImage || null
        };
      })
    );

    res.json({
      availabilityWindows: service.availabilityWindows || [],
      bookedSlots: bookedSlotsWithUserData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all appointments for a service (including cancelled) - for organizers
exports.getServiceAppointments = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const service = await Queue.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if user is the organizer
    if (service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Fetch all appointments for this service from Appointment collection
    const appointments = await Appointment.find({ queue: serviceId })
      .populate("user", "name email profileImage")
      .sort({ date: -1, startTime: -1 });

    res.json({
      appointments: appointments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Book appointment (simplified version)
exports.bookAppointment = async (req, res) => {
  try {
    const { queueId, groupSize, memberNames, date, startTime, endTime, paymentAmount, paymentStatus, paymentMethod } = req.body;
    const userId = req.user.id;

    console.log('Booking appointment:', { queueId, date, startTime, endTime, userId });

    const service = await Queue.findById(queueId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Generate unique invoice number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    const invoiceNumber = `INV-${dateStr}-${randomNum}`;

    const bookedSlot = {
      date: new Date(date),
      startTime,
      endTime,
      bookedBy: userId,
      bookedUserName: req.user.name || 'User',
      groupSize: Number(groupSize),
      memberNames: memberNames || [],
      status: 'booked',
      paymentAmount: paymentAmount || 0,
      paymentStatus: paymentStatus || 'pending',
      paymentMethod: paymentMethod || '',
      paymentDate: paymentStatus === 'completed' ? new Date() : null,
      invoiceNumber: invoiceNumber
    };

    service.bookedSlots.push(bookedSlot);
    await service.save();

    // Get the ID of the newly added slot
    const newSlot = service.bookedSlots[service.bookedSlots.length - 1];

    // Create appointment record with payment details
    const appointment = await Appointment.create({
      queue: queueId,
      user: userId,
      date: new Date(date),
      startTime,
      endTime,
      groupSize: Number(groupSize),
      memberNames: memberNames || [],
      status: 'confirmed',
      paymentAmount: paymentAmount || 0,
      paymentStatus: paymentStatus || 'completed',
      paymentMethod: paymentMethod || 'dummy',
      paymentDate: new Date(),
      invoiceNumber: invoiceNumber,
    });

    console.log('Appointment booked, creating notifications...');

    // Create notifications for this appointment
    const notifications = await notificationService.createAppointmentNotifications(
      userId,
      queueId,
      newSlot._id,
      new Date(date),
      startTime,
      service.title
    );

    console.log(`Created ${notifications?.length || 0} notifications`);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: appointment,
      notificationsCreated: notifications?.length || 0
    });
  } catch (error) {
    console.error('bookAppointment error:', error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

// Add availability window (for organizers)
exports.addAvailabilityWindow = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { date, startTime, endTime, capacity } = req.body;
    
    const service = await Queue.findById(serviceId);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    service.availabilityWindows.push({ date, startTime, endTime, capacity });
    await service.save();

    res.json({ message: "Availability window added successfully", service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// Get single appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    
    // Try to find as Appointment document first
    let appointment = await Appointment.findById(appointmentId)
      .populate('queue', 'title address serviceType price')
      .populate('user', 'name email');
    
    if (appointment) {
      // Check if user owns this appointment
      if (appointment.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to view this appointment" });
      }
      return res.json(appointment);
    }
    
    // If not found as Appointment, try QueueEntry
    const queueEntry = await QueueEntry.findById(appointmentId)
      .populate('queue', 'title address serviceType price')
      .populate('user', 'name email');
    
    if (queueEntry) {
      // Check if user owns this queue entry
      if (queueEntry.user._id.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to view this entry" });
      }
      
      // Transform QueueEntry to look like an appointment for consistent frontend handling
      const transformedEntry = {
        _id: queueEntry._id,
        queue: queueEntry.queue,
        user: queueEntry.user,
        groupSize: queueEntry.groupSize,
        memberNames: queueEntry.memberNames,
        status: queueEntry.status,
        tokenNumber: queueEntry.tokenNumber,
        paymentAmount: queueEntry.paymentAmount,
        paymentStatus: queueEntry.paymentStatus,
        paymentMethod: queueEntry.paymentMethod,
        paymentDate: queueEntry.paymentDate,
        createdAt: queueEntry.createdAt,
        type: 'queue', // Indicate this is a queue entry, not appointment
      };
      
      return res.json(transformedEntry);
    }
    
    // If not found in either, search in Queue.bookedSlots (subdocuments)
    const service = await Queue.findOne({
      'bookedSlots._id': appointmentId
    }).populate('organizer', 'name email');
    
    if (service) {
      const slot = service.bookedSlots.id(appointmentId);
      
      if (!slot) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Check if user owns this slot
      if (slot.bookedBy.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to view this appointment" });
      }
      
      // Transform slot to appointment format
      const appointmentData = {
        _id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        groupSize: slot.groupSize,
        memberNames: slot.memberNames,
        status: slot.status || 'confirmed',
        paymentAmount: slot.paymentAmount || service.price * slot.groupSize || 0,
        paymentStatus: slot.paymentStatus || 'completed',
        paymentMethod: slot.paymentMethod || 'dummy',
        paymentDate: slot.paymentDate,
        invoiceNumber: slot.invoiceNumber,
        createdAt: slot.createdAt || slot._id.getTimestamp(), // Add createdAt from slot or extract from MongoDB ObjectId
        queue: {
          _id: service._id,
          title: service.title,
          address: service.address,
          serviceType: service.serviceType,
          price: service.price,
        },
        user: {
          _id: userId,
          name: slot.bookedUserName,
        },
        type: 'slot', // Indicate this is from bookedSlots
      };
      
      return res.json(appointmentData);
    }
    
    return res.status(404).json({ message: "Appointment or queue entry not found" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    
    // Try to find as Appointment document first
    let appointment = await Appointment.findById(appointmentId);
    
    if (appointment) {
      // Check if user owns this appointment
      if (appointment.user.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this appointment" });
      }
      
      // Check if already cancelled
      if (appointment.status === 'cancelled') {
        return res.status(400).json({ message: "Appointment is already cancelled" });
      }
      
      // Check if appointment is in the future
      const now = new Date();
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (now >= appointmentDate) {
        return res.status(400).json({ message: "Cannot cancel past appointments" });
      }
      
      // Calculate hours until appointment
      const timeDiff = appointmentDate - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Calculate refund percentage based on cancellation time
      let refundPercentage = 0;
      let refundMessage = "No refund";
      
      if (hoursDiff >= 24) {
        refundPercentage = 50;
        refundMessage = "50% refund";
      } else if (hoursDiff >= 12) {
        refundPercentage = 25;
        refundMessage = "25% refund";
      } else if (hoursDiff >= 6) {
        refundPercentage = 10;
        refundMessage = "10% refund";
      } else {
        refundPercentage = 0;
        refundMessage = "No refund (less than 6 hours)";
      }
      
      const refundAmount = appointment.paymentAmount ? (appointment.paymentAmount * refundPercentage) / 100 : 0;
      
      // Mark as cancelled and store refund info
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
      appointment.refundPercentage = refundPercentage;
      appointment.refundAmount = refundAmount;
      await appointment.save();
      
      // Also update in Queue.bookedSlots if it exists there
      const service = await Queue.findOne({ "bookedSlots._id": appointmentId });
      if (service) {
        const slot = service.bookedSlots.id(appointmentId);
        if (slot) {
          slot.status = 'cancelled';
          slot.cancelledAt = new Date();
          slot.refundPercentage = refundPercentage;
          slot.refundAmount = refundAmount;
          await service.save();
        }
      }
      
      return res.json({ 
        message: "Appointment cancelled successfully",
        refundPercentage,
        refundAmount,
        refundMessage,
        originalAmount: appointment.paymentAmount || 0
      });
    }
    
    // If not found as Appointment, try to find in Queue.bookedSlots
    const service = await Queue.findOne({ "bookedSlots._id": appointmentId });
    
    if (service) {
      const slot = service.bookedSlots.id(appointmentId);
      
      if (!slot) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Check if user owns this slot
      if (slot.bookedBy.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this appointment" });
      }
      
      // Check if already cancelled
      if (slot.status === 'cancelled') {
        return res.status(400).json({ message: "Appointment is already cancelled" });
      }
      
      // Check if appointment is in the future
      const now = new Date();
      const appointmentDate = new Date(slot.date);
      const [hours, minutes] = slot.startTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (now >= appointmentDate) {
        return res.status(400).json({ message: "Cannot cancel past appointments" });
      }
      
      // Calculate hours until appointment
      const timeDiff = appointmentDate - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Calculate refund percentage based on cancellation time
      let refundPercentage = 0;
      let refundMessage = "No refund";
      
      if (hoursDiff >= 24) {
        refundPercentage = 50;
        refundMessage = "50% refund";
      } else if (hoursDiff >= 12) {
        refundPercentage = 25;
        refundMessage = "25% refund";
      } else if (hoursDiff >= 6) {
        refundPercentage = 10;
        refundMessage = "10% refund";
      } else {
        refundPercentage = 0;
        refundMessage = "No refund (less than 6 hours)";
      }
      
      const paymentAmount = slot.paymentAmount || (service.price * (slot.groupSize || 1));
      const refundAmount = (paymentAmount * refundPercentage) / 100;
      
      // Mark slot as cancelled and store refund info (keep it for history)
      slot.status = 'cancelled';
      slot.cancelledAt = new Date();
      slot.refundPercentage = refundPercentage;
      slot.refundAmount = refundAmount;
      await service.save();
      
      // Also try to update in Appointment collection if it exists
      const appointmentDoc = await Appointment.findOne({
        queue: service._id,
        user: userId,
        date: slot.date,
        startTime: slot.startTime,
        status: { $ne: 'cancelled' }
      });
      
      if (appointmentDoc) {
        appointmentDoc.status = 'cancelled';
        appointmentDoc.cancelledAt = new Date();
        appointmentDoc.refundPercentage = refundPercentage;
        appointmentDoc.refundAmount = refundAmount;
        await appointmentDoc.save();
      }
      
      return res.json({ 
        message: "Appointment cancelled successfully",
        refundPercentage,
        refundAmount,
        refundMessage,
        originalAmount: paymentAmount
      });
    }
    
    // If not found as Appointment or in bookedSlots, try QueueEntry
    const queueEntry = await QueueEntry.findById(appointmentId).populate('queue', 'price');
    
    if (queueEntry) {
      // Check if user owns this queue entry
      if (queueEntry.user.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this entry" });
      }
      
      // Check if entry is not completed
      if (queueEntry.status === 'complete') {
        return res.status(400).json({ message: "Cannot cancel completed entries" });
      }
      
      // Check if already cancelled
      if (queueEntry.status === 'cancelled') {
        return res.status(400).json({ message: "Entry is already cancelled" });
      }
      
      // For queue entries, calculate refund based on creation time
      const now = new Date();
      const createdAt = new Date(queueEntry.createdAt);
      const timeDiff = now - createdAt;
      const hoursSinceCreation = timeDiff / (1000 * 60 * 60);
      
      // Calculate refund percentage (inverse - more time passed = less refund)
      let refundPercentage = 0;
      let refundMessage = "No refund";
      
      if (hoursSinceCreation <= 1) {
        refundPercentage = 50;
        refundMessage = "50% refund";
      } else if (hoursSinceCreation <= 6) {
        refundPercentage = 25;
        refundMessage = "25% refund";
      } else if (hoursSinceCreation <= 12) {
        refundPercentage = 10;
        refundMessage = "10% refund";
      } else {
        refundPercentage = 0;
        refundMessage = "No refund (more than 12 hours)";
      }
      
      const paymentAmount = queueEntry.paymentAmount || 0;
      const refundAmount = (paymentAmount * refundPercentage) / 100;
      
      // Update the queue's serving capacity if the entry was being served
      if (queueEntry.status === 'serving') {
        await Queue.findByIdAndUpdate(queueEntry.queue, {
          $inc: { servingCapacity: -queueEntry.groupSize }
        });
      }
      
      // Mark as cancelled and store refund info
      queueEntry.status = 'cancelled';
      queueEntry.cancelledAt = new Date();
      queueEntry.refundPercentage = refundPercentage;
      queueEntry.refundAmount = refundAmount;
      await queueEntry.save();
      
      return res.json({ 
        message: "Queue entry cancelled successfully",
        refundPercentage,
        refundAmount,
        refundMessage,
        originalAmount: paymentAmount
      });
    }
    
    return res.status(404).json({ message: "Appointment or queue entry not found" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's current queue status
exports.getUserQueueStatus = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;

    const entry = await QueueEntry.findOne({
      queue: serviceId,
      user: userId,
      status: { $in: ["waiting", "serving", "complete"] },
    });

    if (!entry) {
      return res.json({ status: null, message: "Not in queue" });
    }

    const waitingAhead = await QueueEntry.countDocuments({
      queue: serviceId,
      status: "waiting",
      tokenNumber: { $lt: entry.tokenNumber },
    });

    res.json({
      status: entry.status,
      tokenNumber: entry.tokenNumber,
      waitingAhead: entry.status === "waiting" ? waitingAhead : 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get user details by ID (for organizers to view user info)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unique service types for filter dropdown
exports.getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await Queue.distinct('serviceType', { status: 'active' });
    res.json(serviceTypes.sort());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get booked appointments
    const services = await Queue.find({
      'bookedSlots.bookedBy': userId
    }).populate('organizer', 'name');
    
    const appointments = [];
    
    services.forEach(service => {
      const userSlots = service.bookedSlots.filter(slot => 
        slot.bookedBy.toString() === userId
      );
      
      userSlots.forEach(slot => {
        appointments.push({
          _id: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          groupSize: slot.groupSize,
          memberNames: slot.memberNames,
          status: slot.status,
          paymentAmount: slot.paymentAmount,
          paymentStatus: slot.paymentStatus,
          invoiceNumber: slot.invoiceNumber,
          type: 'appointment',
          queue: {
            _id: service._id,
            title: service.title,
            serviceType: service.serviceType,
            organizer: service.organizer,
            address: service.address
          }
        });
      });
    });
    
    // Sort by date/time (newest first)
    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date.toISOString().split('T')[0]}T${a.startTime}`);
      const dateB = new Date(`${b.date.toISOString().split('T')[0]}T${b.startTime}`);
      return dateB - dateA;
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all user's service interactions (for reviews) - includes both appointments and queue entries
exports.getUserServiceInteractions = async (req, res) => {
  try {
    const userId = req.user.id;
    const interactions = [];
    
    // Get booked appointments
    const services = await Queue.find({
      'bookedSlots.bookedBy': userId
    });
    
    services.forEach(service => {
      const userSlots = service.bookedSlots.filter(slot => 
        slot.bookedBy.toString() === userId
      );
      
      userSlots.forEach(slot => {
        interactions.push({
          _id: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
          type: 'appointment',
          queue: {
            _id: service._id,
            title: service.title
          }
        });
      });
    });
    
    // Get queue entries
    const queueEntries = await QueueEntry.find({ user: userId })
      .populate('queue', 'title');
    
    queueEntries.forEach(entry => {
      interactions.push({
        _id: entry._id,
        status: entry.status,
        createdAt: entry.createdAt,
        type: 'queue',
        queue: entry.queue
      });
    });
    
    res.json(interactions);
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { title, description, serviceType, photo, address, maxCapacity, price, appointmentEnabled, availabilityWindows } = req.body;
    
    const service = await Queue.findById(serviceId);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    service.title = title || service.title;
    service.description = description || service.description;
    service.serviceType = serviceType || service.serviceType;
    service.photo = photo !== undefined ? photo : service.photo;
    service.address = address !== undefined ? address : service.address;
    service.maxCapacity = maxCapacity || service.maxCapacity;
    service.price = price !== undefined ? price : service.price;
    service.appointmentEnabled = appointmentEnabled !== undefined ? appointmentEnabled : service.appointmentEnabled;
    service.availabilityWindows = availabilityWindows !== undefined ? availabilityWindows : service.availabilityWindows;
    
    await service.save();
    
    res.json({ message: "Service updated successfully", service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const service = await Queue.findById(serviceId);
    if (!service || service.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete all queue entries for this service
    await QueueEntry.deleteMany({ queue: serviceId });
    
    // Delete the service
    await Queue.findByIdAndDelete(serviceId);
    
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// Get all user's queue entries (for My Booked Services page)
exports.getMyQueueEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const queueEntries = await QueueEntry.find({ user: userId })
      .populate('queue', 'title serviceType address organizer')
      .sort({ createdAt: -1 });
    
    res.json(queueEntries);
  } catch (error) {
    console.error('Error fetching queue entries:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single queue entry by ID (for ticket detail page)
exports.getQueueEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const queueEntry = await QueueEntry.findById(id)
      .populate('queue', 'title serviceType address organizer');
    
    if (!queueEntry) {
      return res.status(404).json({ message: "Queue entry not found" });
    }
    
    // Check if user owns this entry
    if (queueEntry.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    res.json(queueEntry);
  } catch (error) {
    console.error('Error fetching queue entry:', error);
    res.status(500).json({ message: "Server error" });
  }
};
