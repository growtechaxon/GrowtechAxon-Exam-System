const mongoose = require("mongoose");

const leaderboardProfileSchema = new mongoose.Schema(
  {
    studentKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },

    name: {
      type: String,
      default: ""
    },

    score: {
      type: Number,
      default: null
    },

    percentage: {
      type: Number,
      default: null
    },

    grade: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "PASSED"
    },

    testTitle: {
      type: String,
      default: ""
    },

    rank: {
      type: Number,
      default: null
    },

    imageData: {
      type: String,
      default: ""
    },

    imageMimeType: {
      type: String,
      default: ""
    },

    /*
     * Admin can hide a leaderboard student
     * without deleting the original TestResult.
     */
    hidden: {
      type: Boolean,
      default: false
    },

    updatedByAdmin: {
      type: Boolean,
      default: false
    }
  },

  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "LeaderboardProfile",
    leaderboardProfileSchema
  );