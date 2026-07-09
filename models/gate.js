const mongoose = require("mongoose");

const gateSchema = new mongoose.Schema(
  {
    gateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    terminal: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
      required: true,
    },
    currentFlight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Gate", gateSchema);
