const mongoose = require("mongoose");

const scheduledCollectionSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    binCode: { type: String, required: true },
    compartmentType: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScheduledCollection", scheduledCollectionSchema);
