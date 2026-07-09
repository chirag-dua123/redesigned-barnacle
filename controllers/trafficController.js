const mongoose = require("mongoose");
const Flight = require("../models/flight");

const ALLOWED_STATUSES = ["scheduled", "boarding", "departed", "arrived", "cancelled"];

const getAllFlights = async (req, res, next) => {
  try {
    const flights = await Flight.find().sort({ etd: 1, eta: 1, flightNumber: 1 });

    return res.status(200).json({ success: true, flights });
  } catch (error) {
    return next(error);
  }
};

const updateFlightStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid flight id: ${id}`,
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found",
      });
    }

    flight.status = status;
    await flight.save();

    return res.status(200).json({
      success: true,
      message: "Flight status updated successfully",
      flight,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllFlights,
  updateFlightStatus,
};
