const express = require("express");
const router = express.Router();
const GroupMessage = require("../models/GroupMessage");

// Save new message
router.post("/send", async (req, res) => {
  try {
    const { from_user, room, message } = req.body;
    const newMessage = new GroupMessage({
      from_user,
      room,
      message,
      date_sent: new Date(),
    });
    await newMessage.save();
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: "Failed to save message" });
  }
});

// Get chat history
router.get("/:room", async (req, res) => {
  try {
    const messages = await GroupMessage.find({ room: req.params.room }).sort({
      date_sent: 1,
    });
    res.json(messages);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
