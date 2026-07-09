const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    airline: {
      type: String,
      required: true,
      trim: true,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "boarding", "departed", "arrived", "cancelled"],
      default: "scheduled",
      required: true,
    },
    eta: {
      type: Date,
      required: true,
    },
    etd: {
      type: Date,
      required: true,
    },
    passengerCount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Flight", flightSchema);
