const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Test = require("../Models/Test");
const TestResult = require("../Models/TestResult");
const Certificate = require("../Models/Certificate");
const adminAuth = require("../Middleware/adminAuth");

const {
  buildResultPdf,
  buildCertificatePdf,
  gradeFromPercentage
} = require("../Utils/pdf");

const router = express.Router();

// =========================
// ADMIN LOGIN
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const okEmail = email === process.env.ADMIN_EMAIL;
    const configured = process.env.ADMIN_PASSWORD || "";

    const okPass = configured.startsWith("$2")
      ? await bcrypt.compare(password, configured)
      : password === configured;

    if (!okEmail || !okPass) {
      return res.status(401).json({
        message: "Invalid admin credentials."
      });
    }

    const token = jwt.sign(
      {
        email,
        role: "admin"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    res.json({ token });
  } catch (err) {
    console.error("Admin login error:", err);

    res.status(500).json({
      message: "Admin login failed.",
      error: err.message
    });
  }
});

// =========================
// GET ALL RESULTS
// =========================
router.get("/results", adminAuth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    const filter = q
      ? {
          $or: [
            { candidateName: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { resultId: { $regex: q, $options: "i" } },
            { testTitle: { $regex: q, $options: "i" } }
          ]
        }
      : {};

    const results = await TestResult.find(filter)
      .sort({ submittedAt: -1 })
      .limit(500);

    res.json(results);
  } catch (err) {
    console.error("Results list error:", err);

    res.status(500).json({
      message: "Unable to load results.",
      error: err.message
    });
  }
});

// =========================
// VIEW SINGLE RESULT
// =========================
router.get("/results/:id", adminAuth, async (req, res) => {
  try {
    const id = req.params.id;

    let result = await TestResult.findOne({
      resultId: id
    }).lean();

    if (!result && mongoose.Types.ObjectId.isValid(id)) {
      result = await TestResult.findById(id).lean();
    }

    if (!result) {
      return res.status(404).json({
        message: "Result not found."
      });
    }

    let certificate = null;

    if (result.certificateId) {
      certificate = await Certificate.findOne({
        certificateId: result.certificateId
      }).lean();
    }

    res.json({
      result,
      certificate
    });
  } catch (err) {
    console.error("View result error:", err);

    res.status(500).json({
      message: "Unable to load result.",
      error: err.message
    });
  }
});

// =========================
// RESULT PDF
// =========================
router.get("/results/:id/pdf", adminAuth, async (req, res) => {
  try {
    const id = req.params.id;

    let result = await TestResult.findOne({
      resultId: id
    });

    if (!result && mongoose.Types.ObjectId.isValid(id)) {
      result = await TestResult.findById(id);
    }

    if (!result) {
      return res.status(404).json({
        message: "Result not found."
      });
    }

    buildResultPdf(result, res);
  } catch (err) {
    console.error("Result PDF error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Unable to generate result PDF.",
        error: err.message
      });
    }
  }
});

// =========================
// CERTIFICATE PDF
// =========================
router.get("/certificates/:id/pdf", adminAuth, async (req, res) => {
  try {
    const id = req.params.id;

    let certificate = await Certificate.findOne({
      certificateId: id
    });

    if (!certificate && mongoose.Types.ObjectId.isValid(id)) {
      certificate = await Certificate.findById(id);
    }

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found."
      });
    }

    if (certificate.status === "revoked") {
      return res.status(400).json({
        message: "Certificate is revoked."
      });
    }

    buildCertificatePdf(certificate, res);
  } catch (err) {
    console.error("Certificate PDF error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Unable to generate certificate PDF.",
        error: err.message
      });
    }
  }
});

// =========================
// GENERATE CERTIFICATE
// =========================
router.post(
  "/certificates/generate/:resultId",
  adminAuth,
  async (req, res) => {
    try {
      const id = req.params.resultId;

      // Find result by custom Result ID
      let result = await TestResult.findOne({
        resultId: id
      });

      // Fallback to MongoDB ObjectId
      if (!result && mongoose.Types.ObjectId.isValid(id)) {
        result = await TestResult.findById(id);
      }

      if (!result) {
        return res.status(404).json({
          message: "Result not found."
        });
      }

      // Candidate must pass
      if (!result.passed) {
        return res.status(400).json({
          message:
            "Certificate cannot be generated for a failed result."
        });
      }

      // If certificate already exists, return it
      if (result.certificateId) {
        const existingCertificate = await Certificate.findOne({
          certificateId: result.certificateId
        });

        if (existingCertificate) {
          return res.json(existingCertificate);
        }
      }

      // Generate unique certificate ID
      let certificateId;
      let exists = true;

      while (exists) {
        certificateId =
          "GTA-" +
          new Date().getFullYear() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        exists = await Certificate.exists({
          certificateId
        });
      }

      const percentage = Number(result.percentage || 0);

      // Create certificate
      const certificate = await Certificate.create({
        certificateId,
        resultId: result.resultId,
        candidateName: result.candidateName,
        email: result.email,
        testTitle: result.testTitle,
        issueDate: new Date(),
        percentage,
        grade: gradeFromPercentage(percentage),
        status: "active",
        signatoryName:
          process.env.CERTIFICATE_SIGNATORY_NAME ||
          "Growtech Axon",
        signatoryDesignation:
          process.env.CERTIFICATE_SIGNATORY_DESIGNATION ||
          "Authorized Signatory"
      });

      // Save certificate ID inside result
      result.certificateId = certificate.certificateId;

      await result.save();

      res.status(201).json(certificate);
    } catch (err) {
      console.error("Generate certificate error:", err);

      res.status(500).json({
        message: "Unable to generate certificate.",
        error: err.message
      });
    }
  }
);

// =========================
// EDIT CERTIFICATE
// =========================
router.put("/certificates/:id", adminAuth, async (req, res) => {
  try {
    const allowed = [
      "candidateName",
      "testTitle",
      "issueDate",
      "percentage",
      "grade",
      "status",
      "signatoryName",
      "signatoryDesignation"
    ];

    const data = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    });

    if (data.percentage !== undefined) {
      data.percentage = Number(data.percentage);

      if (!req.body.grade) {
        data.grade = gradeFromPercentage(data.percentage);
      }
    }

    const certificate = await Certificate.findOneAndUpdate(
      {
        certificateId: req.params.id
      },
      data,
      {
        new: true,
        runValidators: true
      }
    );

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate not found."
      });
    }

    res.json(certificate);
  } catch (err) {
    console.error("Certificate update error:", err);

    res.status(500).json({
      message: "Unable to update certificate.",
      error: err.message
    });
  }
});

// =========================
// GET ALL TESTS
// =========================
router.get("/tests", adminAuth, async (req, res) => {
  try {
    const tests = await Test.find()
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    console.error("Tests list error:", err);

    res.status(500).json({
      message: "Unable to load tests.",
      error: err.message
    });
  }
});

// =========================
// CREATE TEST
// =========================
router.post("/tests", adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      durationMinutes,
      passingPercentage,
      certificateEnabled = true,
      active = true,
      questions = []
    } = req.body;

    if (
      !title ||
      !Array.isArray(questions) ||
      !questions.length
    ) {
      return res.status(400).json({
        message:
          "Title and at least one question are required."
      });
    }

    const cleanQuestions = questions.map((q) => ({
      question: String(q.question || "").trim(),
      options: Array.isArray(q.options)
        ? q.options.map(String)
        : [],
      answer: Number(q.answer)
    }));

    const test = await Test.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      durationMinutes: Number(durationMinutes || 15),
      passingPercentage: Number(
        passingPercentage ?? 50
      ),
      certificateEnabled: Boolean(certificateEnabled),
      active: Boolean(active),
      questions: cleanQuestions
    });

    res.status(201).json(test);
  } catch (err) {
    console.error("Create test error:", err);

    res.status(500).json({
      message: "Unable to create test.",
      error: err.message
    });
  }
});

// =========================
// UPDATE TEST
// =========================
router.put("/tests/:id", adminAuth, async (req, res) => {
  try {
    const allowed = [
      "title",
      "description",
      "durationMinutes",
      "passingPercentage",
      "certificateEnabled",
      "active",
      "questions"
    ];

    const data = {};

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    });

    if (data.durationMinutes !== undefined) {
      data.durationMinutes = Number(
        data.durationMinutes
      );
    }

    if (data.passingPercentage !== undefined) {
      data.passingPercentage = Number(
        data.passingPercentage
      );
    }

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      data,
      {
        new: true,
        runValidators: true
      }
    );

    if (!test) {
      return res.status(404).json({
        message: "Test not found."
      });
    }

    res.json(test);
  } catch (err) {
    console.error("Update test error:", err);

    res.status(500).json({
      message: "Unable to update test.",
      error: err.message
    });
  }
});

// =========================
// DELETE TEST
// =========================
router.delete("/tests/:id", adminAuth, async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(
      req.params.id
    );

    if (!test) {
      return res.status(404).json({
        message: "Test not found."
      });
    }

    res.json({
      success: true,
      message: "Test deleted successfully."
    });
  } catch (err) {
    console.error("Delete test error:", err);

    res.status(500).json({
      message: "Unable to delete test.",
      error: err.message
    });
  }
});

module.exports = router;