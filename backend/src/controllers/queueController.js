// quick-queue/backend/src/controllers/queueController.js
const Queue = require("../models/Queue");
const QueueEntry = require("../models/QueueEntry");

exports.startQueue = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    if (queue.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    queue.status = "active";

    // 🔥 THIS WAS MISSING
    if (!queue.currentToken || queue.currentToken === 0) {
      queue.currentToken = 1;
    }

    await queue.save();

    res.json({
      message: "Queue started successfully",
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createQueue = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Queue name required" });
    }

    const queue = await Queue.create({
      name,
      organizer: req.user.id, // from JWT
    });

    res.status(201).json({
      message: "Queue created successfully",
      queue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.pauseQueue = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    // Organizer ownership check
    if (queue.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (queue.status !== "active") {
      return res.status(400).json({
        message: "Only active queues can be paused",
      });
    }

    queue.status = "paused";
    await queue.save();

    res.json({
      message: "Queue paused successfully",
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.closeQueue = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    // Organizer ownership check
    if (queue.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (queue.status === "closed") {
      return res.status(400).json({
        message: "Queue already closed",
      });
    }

    queue.status = "closed";
    await queue.save();

    res.json({
      message: "Queue closed successfully",
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.joinQueue = async (req, res) => {
  console.log("JOIN QUEUE ROUTE HIT");

  try {
    const queueId = req.params.id;
    const userId = req.user.id;

    const queue = await Queue.findById(queueId);

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    if (queue.status !== "active") {
      return res.status(400).json({
        message: "Queue is not active",
      });
    }

    // Prevent duplicate join
    const alreadyJoined = await QueueEntry.findOne({
      queue: queueId,
      user: userId,
      status: "waiting",
    });

    if (alreadyJoined) {
      return res.status(400).json({
        message: "You already joined this queue",
      });
    }

    // Generate next token
    const lastEntry = await QueueEntry.find({ queue: queueId })
      .sort({ tokenNumber: -1 })
      .limit(1);

    const nextToken = lastEntry.length > 0 ? lastEntry[0].tokenNumber + 1 : 1;

    const entry = await QueueEntry.create({
      queue: queueId,
      user: userId,
      tokenNumber: nextToken,
    });

    res.status(201).json({
      message: "Joined queue successfully",
      token: nextToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.nextToken = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) return res.status(404).json({ message: "Queue not found" });

    if (queue.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (queue.status !== "active") {
      return res.status(400).json({ message: "Queue is not active" });
    }

    const nextEntry = await QueueEntry.findOne({
      queue: queue._id,
      status: "waiting",
    }).sort({ tokenNumber: 1 });

    if (!nextEntry) {
      return res.json({ message: "No more users in queue" });
    }

    nextEntry.status = "served";
    await nextEntry.save();

    queue.currentToken = nextEntry.tokenNumber;
    await queue.save();

    res.json({
      message: "Next token served",
      currentToken: queue.currentToken,
      user: nextEntry.user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyToken = async (req, res) => {
  try {
    const queueId = req.params.id;
    const userId = req.user.id;

    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    const myEntry = await QueueEntry.findOne({
      queue: queueId,
      user: userId,
    });

    if (!myEntry) {
      return res
        .status(404)
        .json({ message: "You have not joined this queue" });
    }

    const waitingAhead = await QueueEntry.countDocuments({
      queue: queueId,
      status: "waiting",
      tokenNumber: { $lt: myEntry.tokenNumber },
    });

    res.json({
      queueStatus: queue.status,
      currentToken: queue.currentToken,
      myToken: myEntry.tokenNumber,
      myStatus: myEntry.status,
      peopleAhead: waitingAhead,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getActiveQueues = async (req, res) => {
  console.log("ACTIVE QUEUES HIT ✅", req.user);
  const queues = await Queue.aggregate([
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
        name: 1,
        currentToken: 1,
        waitingCount: 1,
      },
    },
  ]);

  res.json(queues);
};

