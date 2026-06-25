const mongoose = require("mongoose");

const scanHistorySchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },

    s3Key: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    wasteType: {
      type: String,
      enum: ["plastic", "paper", "metal", "general"],
      required: true,
    },

    compartment: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
      required: true,
    },

    advice: {
      type: String,
      required: true,
    },

    pointsAwarded: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ScanHistory", scanHistorySchema);
