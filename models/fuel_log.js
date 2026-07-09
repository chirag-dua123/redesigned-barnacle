const mongoose = require("mongoose");

const fuelLogSchema = new mongoose.Schema(
  {
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
    },
    gallonsFueled: {
      type: Number,
      required: true,
      min: 0,
    },
    // Keep this as a string for the first pass; switch to a User reference if audit depth increases.
    loggedBy: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FuelLog", fuelLogSchema);
