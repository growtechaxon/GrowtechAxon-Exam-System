const express = require("express");
const crypto = require("crypto");

const Test = require("../Models/Test");
const TestResult = require("../Models/TestResult");
const Certificate = require("../Models/Certificate");
const { gradeFromPercentage } = require("../Utils/pdf");

const router = express.Router();

// =====================================================
// TEMPORARY EXAM SESSIONS
// =====================================================
const sessions = new Map();

// =====================================================
// ID GENERATOR
// =====================================================
function id(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

// =====================================================
// CERTIFICATE ID GENERATOR
// =====================================================
function certificateId() {
  return `GTAX-CERT-${new Date().getFullYear()}-${Date.now()
    .toString(36)
    .toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

// =====================================================
// GET AVAILABLE TESTS
// =====================================================
router.get("/tests", async (req, res) => {
  try {
    const now = new Date();

    const tests = await Test.find({
      active: true,

      $and: [
        {
          $or: [
            { startAt: null },
            { startAt: { $lte: now } }
          ]
        },
        {
          $or: [
            { endAt: null },
            { endAt: { $gt: now } }
          ]
        }
      ]
    })
      .select(
        "title description durationMinutes passingPercentage certificateEnabled questions startAt endAt"
      )
      .sort({ createdAt: -1 });

    res.json(
      tests.map((t) => ({
        id: t._id,
        title: t.title,
        description: t.description,
        durationMinutes: t.durationMinutes,
        passingPercentage: t.passingPercentage,
        certificateEnabled: t.certificateEnabled,
        questionCount: t.questions.length,
        startAt: t.startAt,
        endAt: t.endAt
      }))
    );
  } catch (err) {
    console.error("Get tests error:", err);

    res.status(500).json({
      message: "Unable to load tests.",
      error: err.message
    });
  }
});

// =====================================================
// START TEST
// =====================================================
router.post("/tests/start", async (req, res) => {
  try {
    const {
      testId,
      name,
      email,
      phone = ""
    } = req.body;

    if (!testId) {
      return res.status(400).json({
        message: "Test ID is required."
      });
    }

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required."
      });
    }

    const test = await Test.findOne({
      _id: testId,
      active: true
    });

    if (!test) {
      return res.status(404).json({
        message: "Test not found or inactive."
      });
    }

    // =================================================
    // CHECK SCHEDULE
    // =================================================
    const now = new Date();

    if (test.startAt && now < test.startAt) {
      return res.status(403).json({
        message: `Test will open at ${test.startAt.toLocaleString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata"
          }
        )}.`
      });
    }

    if (test.endAt && now >= test.endAt) {
      return res.status(403).json({
        message: "Test is closed."
      });
    }

    // =================================================
    // CREATE SESSION
    // =================================================
    const sessionId = crypto.randomBytes(20).toString("hex");

    const startedAt = Date.now();

    const durationEnd =
      startedAt +
      Number(test.durationMinutes || 15) * 60 * 1000;

    // If exam has a fixed closing time,
    // session cannot continue beyond that time.
    let expiresAt = durationEnd;

    if (test.endAt) {
      expiresAt = Math.min(
        durationEnd,
        test.endAt.getTime()
      );
    }

    sessions.set(sessionId, {
      testId: String(test._id),

      name: String(name).trim(),

      email: String(email)
        .trim()
        .toLowerCase(),

      phone: String(phone || "").trim(),

      startedAt,

      expiresAt,

      used: false
    });

    // Automatically remove expired session.
    setTimeout(() => {
      sessions.delete(sessionId);
    }, Math.max(
      60000,
      expiresAt - startedAt + 3600000
    ));

    res.json({
      sessionId,

      expiresAt,

      test: {
        id: test._id,

        title: test.title,

        durationMinutes: test.durationMinutes,

        questions: test.questions.map((q) => ({
          id: q._id,
          question: q.question,
          options: q.options
        }))
      }
    });
  } catch (err) {
    console.error("Start test error:", err);

    res.status(500).json({
      message: "Unable to start test.",
      error: err.message
    });
  }
});

// =====================================================
// SUBMIT TEST
// =====================================================
router.post("/tests/submit", async (req, res) => {
  try {
    const {
      sessionId,
      answers = {},
      submissionType = "manual"
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID is required."
      });
    }

    const session = sessions.get(sessionId);

    if (!session || session.used) {
      return res.status(400).json({
        message:
          "This test session is invalid or already submitted."
      });
    }

    const test = await Test.findById(session.testId);

    if (!test) {
      return res.status(404).json({
        message: "Test not found."
      });
    }

    // Mark session as used immediately.
    session.used = true;

    const now = Date.now();

    const autoSubmitted = now >= session.expiresAt;

    // =================================================
    // NORMALIZE ANSWERS
    // =================================================
    const normalized = {};

    Object.keys(answers || {}).forEach((key) => {
      const numberValue = Number(answers[key]);

      if (Number.isInteger(numberValue)) {
        normalized[String(key)] = numberValue;
      }
    });

    // =================================================
    // CALCULATE RESULT
    // =================================================
    let correct = 0;

    let attempted = 0;

    const answerList = test.questions.map((question) => {
      const questionId = String(question._id);

      const selected = Object.prototype.hasOwnProperty.call(
        normalized,
        questionId
      )
        ? normalized[questionId]
        : -1;

      const valid =
        selected >= 0 &&
        selected < question.options.length;

      if (valid) {
        attempted++;
      }

      if (
        valid &&
        selected === Number(question.answer)
      ) {
        correct++;
      }

      return {
        questionId,
        selected: valid ? selected : -1
      };
    });

    const total = test.questions.length;

    const wrong = attempted - correct;

    const unanswered = total - attempted;

    const percentage =
      total > 0
        ? Math.round((correct / total) * 10000) / 100
        : 0;

    const passed =
      percentage >= Number(test.passingPercentage || 50);

    // =================================================
    // CREATE RESULT
    // =================================================
    const result = new TestResult({
      resultId: id("RES"),

      testId: test._id,

      testTitle: test.title,

      candidateName: session.name,

      email: session.email,

      phone: session.phone,

      totalQuestions: total,

      attempted,

      correct,

      wrong,

      unanswered,

      score: correct,

      percentage,

      passed,

      answers: answerList,

      submissionType: autoSubmitted
        ? "auto"
        : submissionType,

      submittedAt: new Date(),

      certificateId: null
    });

    await result.save();

    // =================================================
    // CREATE CERTIFICATE
    // =================================================
    let generatedCertificate = null;

    if (
      passed &&
      Boolean(test.certificateEnabled)
    ) {
      try {
        let newCertificateId = certificateId();

        let existing = await Certificate.findOne({
          certificateId: newCertificateId
        }).select("_id");

        while (existing) {
          newCertificateId = certificateId();

          existing = await Certificate.findOne({
            certificateId: newCertificateId
          }).select("_id");
        }

        generatedCertificate = new Certificate({
          certificateId: newCertificateId,

          resultId: result._id,

          candidateName: session.name,

          email: session.email,

          testTitle: test.title,

          percentage,

          grade: gradeFromPercentage(percentage),

          issueDate: new Date(),

          // Certificate.js enum is: valid / revoked
          status: "valid",

          signatoryName:
            process.env.CERTIFICATE_SIGNATORY_NAME ||
            "Authorized Signatory",

          signatoryDesignation:
            process.env.CERTIFICATE_SIGNATORY_DESIGNATION ||
            "Authorized Signatory"
        });

        await generatedCertificate.save();

        // Save Certificate ID inside result.
        result.certificateId =
          generatedCertificate.certificateId;

        await result.save();

        console.log(
          "Certificate generated:",
          generatedCertificate.certificateId
        );
      } catch (certificateError) {
        console.error(
          "Certificate generation error:",
          certificateError
        );

        generatedCertificate = null;
      }
    }

    // Session no longer needed.
    sessions.delete(sessionId);

    // =================================================
    // DO NOT RETURN SCORE TO CANDIDATE
    // =================================================
    res.json({
      success: true,

      message: "Test submitted successfully.",

      resultId: result.resultId,

      certificateGenerated:
        Boolean(generatedCertificate),

      certificateId:
        generatedCertificate?.certificateId || null
    });
  } catch (err) {
    console.error("Submit test error:", err);

    res.status(500).json({
      message: "Unable to save test result.",
      error: err.message
    });
  }
});

// =====================================================
// EXPORT
// =====================================================
module.exports = router;