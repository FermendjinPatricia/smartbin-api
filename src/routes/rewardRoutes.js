const express = require("express");
const Reward = require("../models/Reward");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ points: 1 });

    res.status(200).json(rewards);
  } catch (error) {
    console.error("Get rewards error:", error);

    res.status(500).json({
      message: "Server error while getting rewards",
    });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const existingCount = await Reward.countDocuments();

    if (existingCount > 0) {
      return res.status(200).json({
        message: "Rewards already seeded",
      });
    }

    const rewards = await Reward.insertMany([
      {
        title: "10% reducere Carrefour",
        description: "Valabil 30 zile",
        points: 500,
        iconType: "shopping",
        available: true,
        partner: "Carrefour",
      },
      {
        title: "Cafea gratis · Starbucks",
        description: "Orice mărime",
        points: 800,
        iconType: "coffee",
        available: true,
        partner: "Starbucks",
      },
      {
        title: "Abonament 1 lună Bolt",
        description: "Transport urban",
        points: 3000,
        iconType: "bus",
        available: false,
        partner: "Bolt",
      },
    ]);

    res.status(201).json({
      message: "Rewards seeded successfully",
      rewards,
    });
  } catch (error) {
    console.error("Seed rewards error:", error);

    res.status(500).json({
      message: "Server error while seeding rewards",
    });
  }
});

module.exports = router;
