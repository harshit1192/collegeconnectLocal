// server/config/db.js
// Handles the MongoDB connection using Mongoose.
// Called once from server.js on startup.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Fail fast: without a DB connection the API can't function.
    process.exit(1);
  }
};

// Optional: log connection-level events for easier debugging in dev.
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

module.exports = connectDB;
