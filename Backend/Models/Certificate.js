const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, unique: true, index: true },
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: "TestResult", required: true },
  candidateName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  testTitle: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  percentage: { type: Number, default: 0 },
  grade: { type: String, default: "Completed" },
  status: { type: String, enum: ["valid", "revoked"], default: "valid" },
  signatoryName: { type: String, default: "" },
  signatoryDesignation: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Certificate", certificateSchema);