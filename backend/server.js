// quick-queue/backend/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const queueRoutes = require("./src/routes/queueRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const notificationService = require("./src/services/notificationService");

dotenv.config();
connectDB();  
  
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Cron job to check and send notifications every minute
cron.schedule("* * * * *", async () => {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Checking for due notifications...`);
    const sentCount = await notificationService.checkAndSendNotifications(io);
    if (sentCount > 0) {
      console.log(`Sent ${sentCount} notifications`);
    }
  } catch (error) {
    console.error("Error in notification cron job:", error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/", (req, res) => {
  res.send("Quick Queue Backend Running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
