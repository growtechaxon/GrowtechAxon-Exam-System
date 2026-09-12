const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema({
  resultId: { type: String, unique: true, index: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  testTitle: { type: String, required: true },
  candidateName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: "", trim: true },
  totalQuestions: Number,
  attempted: Number,
  correct: Number,
  wrong: Number,
  unanswered: Number,
  score: Number,
  percentage: Number,
  passed: Boolean,
  answers: [{ questionId: String, selected: Number }],
  submissionType: { type: String, enum: ["manual", "auto"], default: "manual" },
  submittedAt: { type: Date, default: Date.now },
  certificateId: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("TestResult", testResultSchema);