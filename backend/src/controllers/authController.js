// quick-queue/backend/src/ccontrollers/authController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    console.log("SIGNUP BODY:", req.body);
    const { name, email, password, role } = req.body;

    // 1️⃣ Validate
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 2️⃣ Prevent admin creation via signup
    if (role === 1) {
      return res.status(403).json({ message: "Admin cannot signup" });
    }

    // 3️⃣ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: Number(role), // VERY IMPORTANT
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    console.log("User found:", user);
    console.log(
      "Password match:",
      await bcrypt.compare(password, user.password),
    );
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credential" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credential" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("error:--", error);
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
