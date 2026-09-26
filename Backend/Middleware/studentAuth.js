const jwt = require("jsonwebtoken");
const Account = require("../Models/Account");

async function studentAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token) {
    return res.status(401).json({ message: "Student login required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "student" || !payload.id) {
      return res.status(401).json({ message: "Invalid student session." });
    }

    const student = await Account.findById(payload.id).select("-password");

    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Student account not found." });
    }

    if (!student.isActive || student.isBlocked) {
      return res.status(403).json({ message: "This student account is inactive or blocked." });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired student session." });
  }
}

module.exports = studentAuth;
