const mongoose = require("mongoose");

const collectionPointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    distance: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Liber", "Aproape plin", "Plin"],
      default: "Liber",
    },

    type: {
      type: String,
      enum: ["plastic", "paper", "metal", "general"],
      default: "general",
    },

    fillPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    position: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CollectionPoint", collectionPointSchema);