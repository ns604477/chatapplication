const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const colors = require("colors");
const socketio = require("socket.io");

dotenv.config(); // Load environment variables from .env file
connectDB(); // Connect to MongoDB using Mongoose

const app = express(); // Initialize Express application

app.use(express.json()); // Middleware to parse JSON requests

// API routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Serve static assets in production
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// Error handling middleware
app.use(notFound); // Handle 404 Not Found errors
app.use(errorHandler); // General error handler

const PORT = process.env.PORT || 5000; // Define the port to listen on

const server = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`.yellow.bold);
});

// Socket.io setup
const io = socketio(server, {
  pingTimeout: 60000, // Adjust ping timeout as needed
  cors: {
    origin: "http://localhost:3000", // Allow connections from this origin
  },
});

// Socket.io event listeners
io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // Handle setup event
  socket.on("setup", (userData) => {
    socket.join(userData._id); // Join room based on user's _id
    socket.emit("connected"); // Emit connected event
  });

  // Handle join chat event
  socket.on("join chat", (room) => {
    socket.join(room); // Join room based on chat room
    console.log("User Joined Room: " + room);
  });

  // Handle typing event
  socket.on("typing", (room) => socket.in(room).emit("typing"));

  // Handle stop typing event
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // Handle new message event
  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      // Emit message received event to each user in chat room
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Perform any necessary cleanup or actions upon disconnect
  });
});
