const express = require("express");
const Certificate = require("../Models/Certificate");
const TestResult = require("../Models/TestResult");
const Test = require("../Models/Test");

const { buildCertificatePdf } = require("../Utils/pdf");

const router = express.Router();

// =====================================================
// STUDENT RESULT + QUESTION CHECK
// Student/Result ID + Registered Email
// =====================================================
router.get("/results/check", async (req, res) => {
  try {
    const { resultId, email } = req.query;

    if (!resultId || !email) {
      return res.status(400).json({
        valid: false,
        message: "Student/Result ID and registered email are required."
      });
    }

    const cleanResultId = String(resultId).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    const result = await TestResult.findOne({
      resultId: cleanResultId,
      email: cleanEmail
    }).lean();

    if (!result) {
      return res.status(404).json({
        valid: false,
        message: "Student/Result ID and email do not match."
      });
    }

    const test = await Test.findById(result.testId).lean();

    if (!test) {
      return res.status(404).json({
        valid: false,
        message: "Original test data not found."
      });
    }

    const answerMap = new Map();

    (result.answers || []).forEach((answer) => {
      answerMap.set(
        String(answer.questionId),
        Number(answer.selected)
      );
    });

    const questions = (test.questions || []).map((q, index) => {
      const questionId = String(q._id);

      const selected = answerMap.has(questionId)
        ? answerMap.get(questionId)
        : null;

      const isAnswered =
        selected !== null &&
        selected !== undefined &&
        !Number.isNaN(selected);

      const isCorrect =
        isAnswered &&
        Number(selected) === Number(q.answer);

      return {
        number: index + 1,

        question: q.question,

        options: Array.isArray(q.options)
          ? q.options
          : [],

        selected: isAnswered ? selected : null,

        selectedAnswer:
          isAnswered &&
          q.options &&
          q.options[selected] !== undefined
            ? q.options[selected]
            : "Not Answered",

        correctAnswer:
          q.options &&
          q.options[q.answer] !== undefined
            ? q.options[q.answer]
            : "Not Available",

        isCorrect: isAnswered
          ? isCorrect
          : null
      };
    });

    return res.json({
      valid: true,

      result: {
        resultId: result.resultId,
        candidateName: result.candidateName,
        email: result.email,
        testTitle: result.testTitle,

        totalQuestions: Number(result.totalQuestions || 0),
        attempted: Number(result.attempted || 0),
        correct: Number(result.correct || 0),
        wrong: Number(result.wrong || 0),
        unanswered: Number(result.unanswered || 0),

        score: Number(result.score || 0),
        percentage: Number(result.percentage || 0),

        passed: Boolean(result.passed),

        submissionType: result.submissionType || "manual",
        submittedAt: result.submittedAt,

        certificateId: result.certificateId || ""
      },

      questions
    });
  } catch (err) {
    console.error("Student result check error:", err);

    return res.status(500).json({
      valid: false,
      message: "Unable to load result.",
      error: err.message
    });
  }
});

// =====================================================
// CERTIFICATE VERIFY
// Certificate ID + Email
// =====================================================
router.get("/certificates/verify", async (req, res) => {
  try {
    const { certificateId, email } = req.query;

    if (!certificateId) {
      return res.status(400).json({
        valid: false,
        message: "Certificate ID is required."
      });
    }

    const cleanCertificateId = String(certificateId)
      .trim()
      .toUpperCase();

    const certificate = await Certificate.findOne({
      certificateId: cleanCertificateId
    }).lean();

    if (!certificate || certificate.status !== "valid") {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found or revoked."
      });
    }

    if (
      email &&
      certificate.email !==
        String(email).trim().toLowerCase()
    ) {
      return res.status(404).json({
        valid: false,
        message: "Certificate ID and email do not match."
      });
    }

    return res.json({
      valid: true,

      certificate: {
        certificateId: certificate.certificateId,
        candidateName: certificate.candidateName,
        email: certificate.email,
        testTitle: certificate.testTitle,
        issueDate: certificate.issueDate,
        percentage: certificate.percentage,
        grade: certificate.grade,
        status: certificate.status,
        signatoryName: certificate.signatoryName,
        signatoryDesignation:
          certificate.signatoryDesignation
      }
    });
  } catch (err) {
    console.error("Certificate verify error:", err);

    return res.status(500).json({
      valid: false,
      message: "Unable to verify certificate.",
      error: err.message
    });
  }
});

// =====================================================
// STUDENT CERTIFICATE PDF
// Certificate ID + Email
// =====================================================
router.get("/certificates/:id/pdf", async (req, res) => {
  try {
    const id = String(req.params.id)
      .trim()
      .toUpperCase();

    const email = req.query.email
      ? String(req.query.email).trim().toLowerCase()
      : "";

    const certificate = await Certificate.findOne({
      certificateId: id
    });

    if (
      !certificate ||
      certificate.status !== "valid"
    ) {
      return res.status(404).json({
        message: "Certificate not found or revoked."
      });
    }

    if (
      email &&
      certificate.email !== email
    ) {
      return res.status(403).json({
        message: "Email verification failed."
      });
    }

    buildCertificatePdf(certificate, res);
  } catch (err) {
    console.error("Student certificate PDF error:", err);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to generate certificate PDF.",
        error: err.message
      });
    }
  }
});

module.exports = router;