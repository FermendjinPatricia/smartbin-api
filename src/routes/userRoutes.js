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
      { $set: { firebaseUid, email, fullName: safeFullName, photoURL } },
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

// PUT /api/users/:firebaseUid/fcm-token
router.put("/:firebaseUid/fcm-token", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { fcmToken } = req.body;

    if (typeof fcmToken === "undefined") {
      return res.status(400).json({ message: "fcmToken is required" });
    }

    await User.findOneAndUpdate({ firebaseUid }, { fcmToken });

    res.json({ message: "FCM token saved" });
  } catch (error) {
    console.error("Save FCM token error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:firebaseUid/profile
router.put("/:firebaseUid/profile", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { fullName, email, primaryBinCode } = req.body;

    const update = {};
    if (fullName?.trim()) update.fullName = fullName.trim();
    if (email?.trim()) update.email = email.trim().toLowerCase();
    if (primaryBinCode?.trim()) update["registeredBins.0"] = primaryBinCode.trim().toUpperCase();

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:firebaseUid/bins
router.put("/:firebaseUid/bins", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const { binCode } = req.body;

    if (!binCode) {
      return res.status(400).json({ message: "binCode is required" });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $addToSet: { registeredBins: binCode.trim().toUpperCase() } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Add bin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:firebaseUid/bins/:binCode
router.delete("/:firebaseUid/bins/:binCode", async (req, res) => {
  try {
    const { firebaseUid, binCode } = req.params;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $pull: { registeredBins: decodeURIComponent(binCode) } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Remove bin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:firebaseUid
router.delete("/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    await User.findOneAndDelete({ firebaseUid });

    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;