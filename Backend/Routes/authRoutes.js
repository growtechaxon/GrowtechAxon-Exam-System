const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Account = require("../Models/Account");
const TestResult = require("../Models/TestResult");
const Certificate = require("../Models/Certificate");
const studentAuth = require("../Middleware/studentAuth");

const router = express.Router();

function studentId() {
  return `GTAX-STU-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function signStudent(student) {
  return jwt.sign(
    {
      id: String(student._id),
      studentId: student.studentId,
      email: student.email,
      role: "student"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const mobile = String(req.body.mobile || "").trim();
    const password = String(req.body.password || "");

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (fullName.length < 2) {
      return res.status(400).json({ message: "Please enter a valid full name." });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    const existing = await Account.findOne({ email }).select("_id isActive isBlocked");

    if (existing) {
      return res.status(409).json({ message: "This email is already registered. Please use Login." });
    }

    let generatedStudentId = studentId();
    while (await Account.exists({ studentId: generatedStudentId })) {
      generatedStudentId = studentId();
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const student = await Account.create({
      studentId: generatedStudentId,
      fullName,
      email,
      mobile,
      password: hashedPassword,
      role: "student",
      isActive: true,
      isBlocked: false
    });

    const token = signStudent(student);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        mobile: student.mobile
      }
    });
  } catch (error) {
    console.error("Student registration error:", error);
    return res.status(500).json({ message: "Unable to register student.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const student = await Account.findOne({ email, role: "student" }).select("+password");

    if (!student) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!student.isActive || student.isBlocked) {
      return res.status(403).json({ message: "This student account is inactive or blocked." });
    }

    const validPassword = await bcrypt.compare(password, student.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    student.lastLogin = new Date();
    await student.save();

    const token = signStudent(student);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        mobile: student.mobile
      }
    });
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({ message: "Unable to login student.", error: error.message });
  }
});

router.get("/me", studentAuth, async (req, res) => {
  res.json({
    authenticated: true,
    student: {
      studentId: req.student.studentId,
      fullName: req.student.fullName,
      email: req.student.email,
      mobile: req.student.mobile,
      lastLogin: req.student.lastLogin
    }
  });
});

router.get("/results", studentAuth, async (req, res) => {
  try {
    const results = await TestResult.find({ email: req.student.email })
      .sort({ submittedAt: -1 })
      .limit(100)
      .lean();

    const certificateIds = results.map((r) => r.certificateId).filter(Boolean);
    const certificates = certificateIds.length
      ? await Certificate.find({ certificateId: { $in: certificateIds } }).lean()
      : [];

    const certMap = new Map(certificates.map((c) => [c.certificateId, c]));

    res.json({
      results: results.map((r) => ({
        resultId: r.resultId,
        testTitle: r.testTitle,
        totalQuestions: r.totalQuestions,
        attempted: r.attempted,
        correct: r.correct,
        wrong: r.wrong,
        unanswered: r.unanswered,
        score: r.score,
        percentage: r.percentage,
        passed: r.passed,
        submissionType: r.submissionType,
        submittedAt: r.submittedAt,
        certificateId: r.certificateId || "",
        certificate: r.certificateId ? certMap.get(r.certificateId) || null : null
      }))
    });
  } catch (error) {
    console.error("Student results error:", error);
    res.status(500).json({ message: "Unable to load student results.", error: error.message });
  }
});

module.exports = router;
