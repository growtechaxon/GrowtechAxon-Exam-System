const mongoose = require("mongoose");

const leaderboardSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "public", unique: true },
  selectedTestId: { type: String, default: "latest" },
  showAllTests: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("LeaderboardSettings", leaderboardSettingsSchema);
