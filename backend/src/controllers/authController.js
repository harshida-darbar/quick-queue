// quick-queue/backend/src/ccontrollers/authController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { role, name, email, password } = req.body;

    // role must be number: 1,2,3
    if (![1, 2, 3].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User Already Exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      role,
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
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
