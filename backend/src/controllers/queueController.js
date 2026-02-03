// quick-queue/backend/src/controllers/queueController.js
const Queue = require("../models/Queue");
const QueueEntry = require("../models/QueueEntry");
const Appointment = require("../models/Appointment");

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { title, description, serviceType, photo, maxCapacity, appointmentEnabled, availabilityWindows } = req.body;
    
    console.log('Received service data:', req.body); // Debug log
    console.log('Availability windows received:', availabilityWindows); // Debug log

    if (!title || !description || !serviceType || !maxCapacity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const service = await Queue.create({
      title,
      description,
      serviceType,
      photo: photo || "",
      maxCapacity,
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
    const services = await Queue.aggregate([
      { $match: { status: "active" } },
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
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          serviceType: 1,
          photo: 1,
          maxCapacity: 1,
          servingCapacity: 1,
          servingCount: 1,
          waitingCount: 1,
          appointmentEnabled: 1,
          timeSlots: 1,
          isFull: { $gte: ["$servingCapacity", "$maxCapacity"] },
        },
      },
    ]);

    res.json(services);
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
    const { groupSize = 1, memberNames = [] } = req.body;

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

    const entry = await QueueEntry.create({
      queue: serviceId,
      user: userId,
      tokenNumber: nextToken,
      groupSize,
      memberNames: memberNames.map(name => name.trim()),
      status: initialStatus,
    });

    res.status(201).json({
      message,
      token: nextToken,
      groupSize,
      memberNames: entry.memberNames,
      status: initialStatus,
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

// Get organizer's services
exports.getOrganizerServices = async (req, res) => {
  try {
    const services = await Queue.find({ organizer: req.user.id });
    res.json(services);
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

    res.json({
      availabilityWindows: service.availabilityWindows || [],
      bookedSlots: service.bookedSlots || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Book appointment (simplified version)
exports.bookAppointment = async (req, res) => {
  try {
    const { queueId, groupSize, memberNames, date, startTime, endTime } = req.body;
    const userId = req.user.id;

    const service = await Queue.findById(queueId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.bookedSlots.push({
      date: new Date(date),
      startTime,
      endTime,
      bookedBy: userId,
      bookedUserName: req.user.name || 'User',
      groupSize: Number(groupSize),
      memberNames: memberNames || [],
      status: 'booked'
    });

    await service.save();

    res.status(201).json({
      message: "Appointment booked successfully"
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

// Get appointments for a service (accessible to all users)
exports.getServiceAppointments = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const appointments = await Appointment.find({ queue: serviceId })
      .populate('user', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
    console.error(error);
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

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    
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
          service: {
            _id: service._id,
            title: service.title,
            serviceType: service.serviceType,
            organizer: service.organizer
          }
        });
      });
    });
    
    // Sort by date and time
    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date.toISOString().split('T')[0]}T${a.startTime}`);
      const dateB = new Date(`${b.date.toISOString().split('T')[0]}T${b.startTime}`);
      return dateA - dateB;
    });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: "Server error" });
  }
};

