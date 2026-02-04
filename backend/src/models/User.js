// backend/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: {
    type: Number,
    enum: [1, 2, 3], // 1=admin, 2=organizer, 3=user
    default: 3
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
