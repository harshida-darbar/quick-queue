// quick-queue/backend/createAdmin.js
// Run this script to create an admin user: node createAdmin.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/User");

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Admin details - CHANGE THESE
    const adminData = {
      name: "Super Admin",
      email: "admin@quickqueue.com",
      password: "admin123", // Change this to your desired password
      role: 1, // Admin role
      phone: "1234567890",
      city: "Admin City",
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("Admin user already exists with email:", adminData.email);
      console.log("Updating password...");
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Update existing admin
      existingAdmin.password = hashedPassword;
      existingAdmin.name = adminData.name;
      existingAdmin.role = 1;
      await existingAdmin.save();
      
      console.log("✅ Admin password updated successfully!");
      console.log("Email:", adminData.email);
      console.log("Password:", adminData.password);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      // Create admin user
      const admin = await User.create({
        ...adminData,
        password: hashedPassword,
      });

      console.log("✅ Admin user created successfully!");
      console.log("Email:", adminData.email);
      console.log("Password:", adminData.password);
      console.log("Role: Admin (1)");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAdmin();
