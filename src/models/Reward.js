const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    points: {
      type: Number,
      required: true,
    },

    iconType: {
      type: String,
      enum: ["shopping", "coffee", "bus", "gift"],
      default: "gift",
    },

    available: {
      type: Boolean,
      default: true,
    },

    partner: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reward", rewardSchema);