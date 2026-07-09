const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const trafficRoutes = require("./routes/trafficRoutes");
const groundRoutes = require("./routes/groundRoutes");
const viewRoutes = require("./routes/viewRoutes");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/ping", (req, res) => {
  res.status(200).json({ success: true, message: "Pong" });
});

app.use("/", viewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api/ground", groundRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

// Centralized error handler — must be after all routes
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully.");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
