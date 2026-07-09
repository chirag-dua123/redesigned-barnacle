const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/user");
const Flight = require("../models/flight");
const Gate = require("../models/gate");
const FuelLog = require("../models/fuel_log");

dotenv.config();

const gateSeedData = [
  { gateId: "A1", terminal: "Terminal 1", status: "available", currentFlight: null },
  { gateId: "A2", terminal: "Terminal 1", status: "available", currentFlight: null },
  { gateId: "B1", terminal: "Terminal 2", status: "available", currentFlight: null },
  { gateId: "B2", terminal: "Terminal 2", status: "maintenance", currentFlight: null },
  { gateId: "C1", terminal: "Terminal 3", status: "available", currentFlight: null },
];

const now = Date.now();
const flightSeedData = [
  {
    flightNumber: "AC101",
    airline: "AeroCommand Air",
    origin: "JFK",
    destination: "LAX",
    status: "scheduled",
    eta: new Date(now + 2 * 60 * 60 * 1000),
    etd: new Date(now + 3 * 60 * 60 * 1000),
    passengerCount: 186,
  },
  {
    flightNumber: "AC202",
    airline: "AeroCommand Air",
    origin: "SFO",
    destination: "ORD",
    status: "boarding",
    eta: new Date(now + 90 * 60 * 1000),
    etd: new Date(now + 2 * 60 * 60 * 1000),
    passengerCount: 142,
  },
  {
    flightNumber: "AC303",
    airline: "AeroCommand Air",
    origin: "MIA",
    destination: "SEA",
    status: "scheduled",
    eta: new Date(now + 4 * 60 * 60 * 1000),
    etd: new Date(now + 5 * 60 * 60 * 1000),
    passengerCount: 158,
  },
  {
    flightNumber: "AC404",
    airline: "AeroCommand Air",
    origin: "ATL",
    destination: "DEN",
    status: "arrived",
    eta: new Date(now - 30 * 60 * 1000),
    etd: new Date(now - 2 * 60 * 60 * 1000),
    passengerCount: 174,
  },
];

const userSeedData = [
  {
    name: "Control One",
    email: "controller@aerocommand.local",
    password: "Password123!",
    role: "controller",
  },
  {
    name: "Ground One",
    email: "ground@aerocommand.local",
    password: "Password123!",
    role: "ground_staff",
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await Promise.all([
      FuelLog.deleteMany({}),
      Gate.deleteMany({}),
      Flight.deleteMany({}),
      User.deleteMany({}),
    ]);

    const flights = await Flight.insertMany(flightSeedData);

    const flightsByNumber = flights.reduce((acc, flight) => {
      acc[flight.flightNumber] = flight;
      return acc;
    }, {});

    const gatesWithAssignments = gateSeedData.map((gate) => {
      if (gate.gateId === "A2") {
        return {
          ...gate,
          status: "occupied",
          currentFlight: flightsByNumber.AC202._id,
        };
      }

      if (gate.gateId === "C1") {
        return {
          ...gate,
          status: "occupied",
          currentFlight: flightsByNumber.AC404._id,
        };
      }

      return gate;
    });

    await Gate.insertMany(gatesWithAssignments);

    // Use the User model so the password pre-save hook hashes credentials.
    for (const userData of userSeedData) {
      const user = new User(userData);
      await user.save();
    }

    console.log("Database seeded successfully.");
    console.log("Seed users:");
    console.log("  controller@aerocommand.local / Password123!");
    console.log("  ground@aerocommand.local / Password123!");
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedDatabase();
