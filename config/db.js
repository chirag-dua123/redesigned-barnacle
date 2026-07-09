const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  const conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
};

module.exports = connectDB;
