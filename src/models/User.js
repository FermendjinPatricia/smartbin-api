const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    photoURL: {
    type: String,
    default: "",
    },

    role: {
      type: String,
      enum: ["citizen", "operator", "authority"],
      default: "citizen",
    },

    points: {
      type: Number,
      default: 0,
    },

    level: {
      type: String,
      default: "Eco-Începător",
    },

    registeredBins: {
      type: [String],
      default: ["SB-2026-1947"],
    },

    fcmToken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);