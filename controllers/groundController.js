const mongoose = require("mongoose");
const Flight = require("../models/flight");
const Gate = require("../models/gate");
const FuelLog = require("../models/fuel_log");

const getGateMatrix = async (req, res, next) => {
  try {
    const gates = await Gate.find()
      .populate("currentFlight", "flightNumber airline origin destination status eta etd")
      .sort({ terminal: 1, gateId: 1 });

    return res.status(200).json({ success: true, gates });
  } catch (error) {
    return next(error);
  }
};

const assignGateToFlight = async (req, res, next) => {
  try {
    const { gateId, flightId } = req.body;

    if (!gateId || !flightId) {
      return res.status(400).json({
        success: false,
        message: "gateId and flightId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(flightId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid flightId: ${flightId}`,
      });
    }

    const [gate, flight] = await Promise.all([
      Gate.findOne({ gateId: gateId.trim() }),
      Flight.findById(flightId),
    ]);

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: "Gate not found",
      });
    }

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found",
      });
    }

    if (gate.status === "maintenance") {
      return res.status(400).json({
        success: false,
        message: "Gate is under maintenance",
      });
    }

    if (gate.currentFlight && gate.currentFlight.toString() !== flight._id.toString()) {
      return res.status(409).json({
        success: false,
        message: "Gate is already occupied",
      });
    }

    await Gate.updateMany(
      { currentFlight: flight._id, _id: { $ne: gate._id } },
      { $set: { currentFlight: null, status: "available" } },
    );

    gate.currentFlight = flight._id;
    gate.status = "occupied";
    await gate.save();

    const populatedGate = await Gate.findById(gate._id).populate(
      "currentFlight",
      "flightNumber airline origin destination status eta etd",
    );

    return res.status(200).json({
      success: true,
      message: "Gate assigned successfully",
      gate: populatedGate,
    });
  } catch (error) {
    return next(error);
  }
};

const logRefueling = async (req, res, next) => {
  try {
    const { flightId, gallonsFueled } = req.body;

    if (!flightId || gallonsFueled === undefined) {
      return res.status(400).json({
        success: false,
        message: "flightId and gallonsFueled are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(flightId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid flightId: ${flightId}`,
      });
    }

    if (typeof gallonsFueled !== "number" && typeof gallonsFueled !== "string") {
      return res.status(400).json({
        success: false,
        message: "gallonsFueled must be a number",
      });
    }

    if (isNaN(Number(gallonsFueled)) || Number(gallonsFueled) <= 0) {
      return res.status(400).json({
        success: false,
        message: "gallonsFueled must be a number greater than 0",
      });
    }

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found",
      });
    }

    const fuelLog = await FuelLog.create({
      flightId: flight._id,
      gallonsFueled: Number(gallonsFueled),
      loggedBy: req.user.name,
    });

    return res.status(201).json({
      success: true,
      message: "Refueling logged successfully",
      fuelLog,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getGateMatrix,
  assignGateToFlight,
  logRefueling,
};
