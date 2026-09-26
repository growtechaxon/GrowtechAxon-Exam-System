const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
  {
    // =====================================================
    // RESULT IDENTIFICATION
    // =====================================================

    resultId: {
      type: String,
      unique: true,
      index: true
    },

    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true
    },

    testTitle: {
      type: String,
      required: true
    },

    // =====================================================
    // STUDENT DETAILS
    // =====================================================

    candidateName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      default: "",
      trim: true
    },

    // =====================================================
    // RESULT DETAILS
    // =====================================================

    totalQuestions: {
      type: Number,
      default: 0
    },

    attempted: {
      type: Number,
      default: 0
    },

    correct: {
      type: Number,
      default: 0
    },

    wrong: {
      type: Number,
      default: 0
    },

    unanswered: {
      type: Number,
      default: 0
    },

    score: {
      type: Number,
      default: 0
    },

    percentage: {
      type: Number,
      default: 0
    },

    passed: {
      type: Boolean,
      default: false
    },

    // =====================================================
    // STUDENT ANSWERS
    // =====================================================

    answers: [
      {
        questionId: {
          type: String
        },

        selected: {
          type: Number,
          default: -1
        }
      }
    ],

    // =====================================================
    // SUBMISSION TYPE
    // =====================================================

    submissionType: {
      type: String,
      enum: [
        "manual",
        "auto",
        "anti_cheating"
      ],
      default: "manual"
    },

    // =====================================================
    // ANTI-CHEATING INFORMATION
    // =====================================================

    violationCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    violations: {
      type: [String],
      default: []
    },

    // =====================================================
    // DATE / CERTIFICATE
    // =====================================================

    submittedAt: {
      type: Date,
      default: Date.now
    },

    certificateId: {
      type: String,
      default: ""
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "TestResult",
  testResultSchema
);