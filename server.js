require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const User = require("./models/User");
const GroupMessage = require("./models/GroupMessage");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Set views directory
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// Routes to serve HTML pages
app.get("/", (req, res) => res.render("login"));
app.get("/login", (req, res) => res.render("login")); 
app.get("/signup", (req, res) => res.render("signup"));
app.get("/chat", (req, res) => res.render("chat"));

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

// Store users in rooms
const users = {};

// WebSocket Logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins a room
  socket.on("joinRoom", async ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    console.log(`${username} joined room: ${room}`);

    // Notify others in the room
    socket.to(room).emit("message", {
      from_user: "System",
      message: `${username} has joined the chat!`,
      date_sent: new Date(),
    });

    // Send updated user list
    io.to(room).emit("roomUsers", {
      room,
      users: Object.values(users).filter((user) => user.room === room),
    });

    // Fetch previous messages and send them to the user
    try {
      const messages = await GroupMessage.find({ room }).sort({ date_sent: 1 });
      socket.emit("chatHistory", messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  });

  // Handle chat messages
  socket.on("chatMessage", async ({ username, room, message }) => {
    console.log(`[${room}] ${username}: ${message}`);

    const msgData = {
      from_user: username,
      room: room,
      message: message,
      date_sent: new Date(),
    };

    try {
      // Save message in MongoDB
      await GroupMessage.create(msgData);
      console.log("Message saved to database:", message);

      // Broadcast the message to all users in the room
      io.to(room).emit("message", msgData);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // Typing Indicator
  socket.on("typing", ({ username, room }) => {
    console.log(`[DEBUG] ${username} is typing in ${room}`); // Log when typing event fires
    socket.to(room).emit("typing", { from_user: username });
});


  // Handle Leave Room
  socket.on("leaveRoom", ({ username, room }) => {
    socket.leave(room);
    delete users[socket.id];

    // Notify others and update user list
    io.to(room).emit("roomUsers", {
      room,
      users: Object.values(users).filter((user) => user.room === room),
    });

    io.to(room).emit("message", {
      from_user: "System",
      message: `${username} has left the chat.`,
      date_sent: new Date(),
    });

    console.log(`${username} left room: ${room}`);
  });

  // Handle User Disconnect
  socket.on("disconnect", () => {
    if (users[socket.id]) {
      const { username, room } = users[socket.id];
      delete users[socket.id];

      // Notify users in the room
      io.to(room).emit("roomUsers", {
        room,
        users: Object.values(users).filter((user) => user.room === room),
      });

      io.to(room).emit("message", {
        from_user: "System",
        message: `${username} has disconnected.`,
        date_sent: new Date(),
      });

      console.log(`User disconnected: ${socket.id}`);
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
