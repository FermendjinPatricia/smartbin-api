const express = require("express");
const ScheduledCollection = require("../models/ScheduledCollection");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { firebaseUid, binCode, compartmentType, scheduledAt } = req.body;

    if (!firebaseUid || !binCode || !compartmentType || !scheduledAt) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const date = new Date(scheduledAt);
    if (isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({ message: "scheduledAt must be a future date" });
    }

    const scheduled = await ScheduledCollection.create({
      firebaseUid,
      binCode,
      compartmentType,
      scheduledAt: date,
    });

    res.status(201).json({ scheduled });
  } catch (error) {
    console.error("Schedule collection error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:firebaseUid", async (req, res) => {
  try {
    const schedules = await ScheduledCollection.find({
      firebaseUid: req.params.firebaseUid,
      sent: false,
      scheduledAt: { $gte: new Date() },
    }).sort({ scheduledAt: 1 });

    res.json(schedules);
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
