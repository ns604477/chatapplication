const mongoose = require("mongoose");
const colors = require("colors");

const connectDB = async () => {
  try {
    const uri = "mongodb://127.0.0.1:27017/chat"; // Ensure MONGO_URI is correctly accessed

    if (!uri) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1); // Exit with a non-zero status code to indicate an error
  }
};

module.exports = connectDB;
