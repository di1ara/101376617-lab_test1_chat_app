const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  console.log("Received signup request:", req.body); // Debugging log

  const { username, firstname, lastname, password } = req.body;

  try {
    // Validate input
    if (!username || !firstname || !lastname || !password) {
      console.log("Signup failed: Missing fields");
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("Signup failed: Username already exists");
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      firstname,
      lastname,
      password: hashedPassword,
    });

    await newUser.save();
    console.log("Signup successful for:", username);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
});
// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Send back username for session storage
    res.json({ username: user.username });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

module.exports = router;
