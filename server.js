const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const userRoutes = require("./src/routes/userRoutes");
const rewardRoutes = require("./src/routes/rewardRoutes");
const collectionPointRoutes = require("./src/routes/collectionPointRoutes");
const scanRoutes = require("./src/routes/scanRoutes");

connectDB();

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
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
  res.json({
    status: "ok",
    service: "smartbin-api",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/collection-points", collectionPointRoutes);
app.use("/api/scan", scanRoutes);

app.listen(PORT, () => {
  console.log(`SmartBin API running on http://localhost:${PORT}`);
});