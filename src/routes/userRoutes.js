const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, email, fullName, photoURL } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "firebaseUid and email are required",
      });
    }

    const safeFullName =
      fullName || email.split("@")[0] || "Utilizator SmartBin";

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        firebaseUid,
        email,
        fullName: safeFullName,
        photoURL,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      message: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("User sync error:", error);

    res.status(500).json({
      message: "Server error while syncing user",
    });
  }
});

router.get("/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Server error while getting user",
    });
  }
});

module.exports = router;