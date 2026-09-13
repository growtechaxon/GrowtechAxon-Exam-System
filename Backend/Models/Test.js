const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },

    options: {
      type: [String],
      required: true,
      validate: (v) => v.length >= 2
    },

    answer: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    durationMinutes: {
      type: Number,
      default: 15,
      min: 1
    },

    passingPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },

    certificateEnabled: {
      type: Boolean,
      default: true
    },

    active: {
      type: Boolean,
      default: true
    },

    // Test automatically becomes available from this time
    startAt: {
      type: Date,
      default: null
    },

    // Test automatically stops accepting new attempts after this time
    endAt: {
      type: Date,
      default: null
    },

    questions: {
      type: [questionSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);