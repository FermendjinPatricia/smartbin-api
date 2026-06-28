const express = require("express");
const Notification = require("../models/Notification");

const router = express.Router();

function formatDay(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Azi";
  if (d.toDateString() === yesterday.toDateString()) return "Ieri";

  return d.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// GET /api/notifications/:firebaseUid
router.get("/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const notifications = await Notification.find({ firebaseUid })
      .sort({ createdAt: -1 })
      .limit(30);

    const formatted = notifications.map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      day: formatDay(n.createdAt),
      time: new Date(n.createdAt).toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Eroare la încărcarea notificărilor" });
  }
});

// PUT /api/notifications/:firebaseUid/read-all
router.put("/:firebaseUid/read-all", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    await Notification.updateMany({ firebaseUid }, { read: true });
    res.json({ message: "Toate notificările au fost marcate ca citite" });
  } catch (error) {
    console.error("Read all notifications error:", error);
    res.status(500).json({ message: "Eroare" });
  }
});

module.exports = router;
