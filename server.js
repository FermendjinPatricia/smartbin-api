const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./src/config/db");
const userRoutes = require("./src/routes/userRoutes");
const rewardRoutes = require("./src/routes/rewardRoutes");
const collectionPointRoutes = require("./src/routes/collectionPointRoutes");
const scanRoutes = require("./src/routes/scanRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const scheduleRoutes = require("./src/routes/scheduleRoutes");
const admin = require("./src/config/firebaseAdmin");
const User = require("./src/models/User");
const Notification = require("./src/models/Notification");
const ScheduledCollection = require("./src/models/ScheduledCollection");

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedule", scheduleRoutes);

app.listen(PORT, () => {
  console.log(`SmartBin API running on http://localhost:${PORT}`);
  startBinWatcher();
  startCollectionReminders();
});

const FILL_THRESHOLD = 85;
const sentAlerts = new Set();

function startBinWatcher() {
  const db = admin.database();
  const binsRef = db.ref("bins");

  binsRef.on("value", async (snapshot) => {
    if (!snapshot.exists()) return;

    const bins = snapshot.val();

    for (const [binCode, bin] of Object.entries(bins)) {
      if (!bin.compartments) continue;

      for (const [type, compartment] of Object.entries(bin.compartments)) {
        const alertKey = `${binCode}-${type}`;

        if (compartment.percent >= FILL_THRESHOLD && !sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          await sendFillAlert(binCode, compartment);
        }

        if (compartment.percent < FILL_THRESHOLD) {
          sentAlerts.delete(alertKey);
        }
      }
    }
  });

  console.log("Bin watcher started");
}

const COMPARTMENT_LABELS = {
  plastic: "Plastic",
  paper: "Hârtie",
  metal: "Metal",
  general: "Menajer",
};

function startCollectionReminders() {
  cron.schedule("* * * * *", async () => {
    const due = await ScheduledCollection.find({
      sent: false,
      scheduledAt: { $lte: new Date() },
    });

    for (const item of due) {
      try {
        const user = await User.findOne({ firebaseUid: item.firebaseUid });

        item.sent = true;
        await item.save();

        if (!user?.fcmToken) continue;

        const label = COMPARTMENT_LABELS[item.compartmentType] || item.compartmentType;
        const title = "Reminder golire tomberon";
        const body = `E momentul să golești compartimentul ${label} al tomberonului ${item.binCode}.`;

        await Notification.create({
          firebaseUid: item.firebaseUid,
          title,
          message: body,
          type: "info",
        });

        await admin.messaging().send({
          token: user.fcmToken,
          notification: { title: `SmartBin · ${title}`, body },
          data: {
            type: "collection_reminder",
            binCode: item.binCode,
            compartmentType: item.compartmentType,
          },
        });
      } catch (err) {
        console.error("Collection reminder error:", err);
      }
    }
  });

  console.log("Collection reminder scheduler started");
}

async function sendFillAlert(binCode, compartment) {
  try {
    const users = await User.find({
      registeredBins: binCode,
      fcmToken: { $exists: true, $ne: "" },
    });

    for (const user of users) {
      const notifType = compartment.percent >= 95 ? "danger" : "warning";
      const title = `${compartment.label} aproape plin`;
      const message = `Compartimentul ${compartment.label} este ${compartment.percent}% plin și trebuie golit.`;

      await Notification.create({
        firebaseUid: user.firebaseUid,
        title,
        message,
        type: notifType,
      });

      await admin.messaging().send({
        token: user.fcmToken,
        notification: { title: `SmartBin · ${title}`, body: message },
        data: { type: "fill_alert", compartment: compartment.type, percent: String(compartment.percent) },
      });
    }
  } catch (error) {
    console.error("sendFillAlert error:", error);
  }
}