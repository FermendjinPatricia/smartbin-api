const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const userRoutes = require("./src/routes/userRoutes");
const rewardRoutes = require("./src/routes/rewardRoutes");
const collectionPointRoutes = require("./src/routes/collectionPointRoutes");
const scanRoutes = require("./src/routes/scanRoutes");

connectDB();

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SmartBin API is running",
    status: "ok",
  });
});

app.get("/api/health", (req, res) => {
  const databaseState =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "ok",
    service: "smartbin-api",
    database: databaseState,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/collection-points", collectionPointRoutes);
app.use("/api/scan", scanRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartBin API running on port ${PORT}`);
});