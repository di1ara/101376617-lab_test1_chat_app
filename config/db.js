const mongoose = require("mongoose");
require("dotenv").config(); // Load .env file

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Stop the server if there's an error
  }
};

module.exports = connectDB;
