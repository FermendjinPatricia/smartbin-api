const express = require("express");
const CollectionPoint = require("../models/CollectionPoint");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { type, search } = req.query;

    const query = {};

    if (type && type !== "toate") {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const points = await CollectionPoint.find(query).sort({ name: 1 });

    res.status(200).json(points);
  } catch (error) {
    console.error("Get collection points error:", error);

    res.status(500).json({
      message: "Server error while getting collection points",
    });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const existingCount = await CollectionPoint.countDocuments();

    if (existingCount > 0) {
      return res.status(200).json({
        message: "Collection points already seeded",
      });
    }

    const points = await CollectionPoint.insertMany([
      {
        name: "Parc Herăstrău · Intrarea B",
        address: "Str. Aviatorilor 14",
        distance: "320 m",
        status: "Liber",
        type: "plastic",
        fillPercent: 42,
        position: {
          lat: 44.4706,
          lng: 26.0823,
        },
      },
      {
        name: "Punct colectare Aviatorilor",
        address: "Bd. Aviatorilor",
        distance: "650 m",
        status: "Aproape plin",
        type: "paper",
        fillPercent: 78,
        position: {
          lat: 44.4668,
          lng: 26.0862,
        },
      },
      {
        name: "Piața Dorobanți",
        address: "Calea Dorobanți",
        distance: "1,1 km",
        status: "Liber",
        type: "metal",
        fillPercent: 15,
        position: {
          lat: 44.4579,
          lng: 26.0964,
        },
      },
      {
        name: "Floreasca Park",
        address: "Calea Floreasca",
        distance: "1,4 km",
        status: "Plin",
        type: "general",
        fillPercent: 95,
        position: {
          lat: 44.4627,
          lng: 26.1027,
        },
      },
    ]);

    res.status(201).json({
      message: "Collection points seeded successfully",
      points,
    });
  } catch (error) {
    console.error("Seed collection points error:", error);

    res.status(500).json({
      message: "Server error while seeding collection points",
    });
  }
});

module.exports = router;