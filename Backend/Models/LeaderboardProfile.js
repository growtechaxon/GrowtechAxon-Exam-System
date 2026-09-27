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
    name: { type: String, default: "" },
    score: { type: Number, default: null },
    percentage: { type: Number, default: null },
    grade: { type: String, default: "" },
    status: { type: String, default: "PASSED" },
    testTitle: { type: String, default: "" },
    rank: { type: Number, default: null },
    imageData: { type: String, default: "" },
    imageMimeType: { type: String, default: "" },
    updatedByAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaderboardProfile", leaderboardProfileSchema);
