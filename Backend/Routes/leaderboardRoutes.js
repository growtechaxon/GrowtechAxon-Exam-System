const express = require("express");
const TestResult = require("../Models/TestResult");
const Test = require("../Models/Test");
const LeaderboardProfile = require("../Models/LeaderboardProfile");
const LeaderboardSettings = require("../Models/LeaderboardSettings");
const adminAuth = require("../Middleware/adminAuth");
const { gradeFromPercentage } = require("../Utils/pdf");
const { applyDenseRanking } = require("../Utils/leaderboardRanking");
const router = express.Router();

const norm = (v) => String(v || "").trim().toLowerCase();
const num = (v, fallback = null) => v === null || v === undefined || v === "" ? fallback : (Number.isFinite(Number(v)) ? Number(v) : fallback);
const profileKey = (testId, email, resultId) => `${String(testId)}::${norm(email) || norm(resultId)}`;


async function getSettings() {
  let settings = await LeaderboardSettings.findOne({ key: "public" }).lean();
  if (!settings) settings = await LeaderboardSettings.create({ key: "public", selectedTestId: "latest", showAllTests: false });
  return settings;
}

async function getTests() {
  return Test.find({}).select("_id title createdAt active").sort({ createdAt: -1 }).lean();
}

async function getRowsForTest(test, includeFailed = false) {
  const query = { testId: test._id };
  if (!includeFailed) query.passed = true;
  const results = await TestResult.find(query).sort({ submittedAt: -1, createdAt: -1 }).lean();
  if (!results.length) return [];

  // Profiles are test-scoped and keyed primarily by email, not name, so duplicate names remain separate.
  const keys = results.map(r => profileKey(test._id, r.email, r.resultId || r._id));
  const emails = results.map(r => norm(r.email)).filter(Boolean);
  // Only use test-scoped identity keys for overrides. Legacy name-only profiles
  // remain stored for compatibility but must not leak visibility/photos between tests.
  const profiles = await LeaderboardProfile.find({ $or: [{ studentKey: { $in: keys } }, { testId: String(test._id), email: { $in: emails } }] }).lean();
  const profileMap = new Map();
  for (const p of profiles) {
    profileMap.set(norm(p.studentKey), p);
    if (p.email) profileMap.set(profileKey(p.testId || test._id, p.email), p);
  }

  // Pick each student's best result for this test. Email is the stable identity.
  const best = new Map();
  for (const result of results) {
    const key = profileKey(test._id, result.email, result.resultId || result._id);
    const identity = norm(result.email) || norm(result.resultId || result._id);
    const old = best.get(identity);
    if (!old || Number(result.percentage || 0) > Number(old.result.percentage || 0) ||
      (Number(result.percentage || 0) === Number(old.result.percentage || 0) && Number(result.score || 0) > Number(old.result.score || 0))) {
      best.set(identity, { result, key });
    }
  }

  const rows = [];
  for (const { result, key } of best.values()) {
    const composite = profileKey(test._id, result.email, result.resultId || result._id);
    const profile = profileMap.get(norm(composite)) || profileMap.get(profileKey(test._id, result.email));
    const passed = result.passed === true;
    const percentage = profile && profile.percentage !== null && profile.percentage !== undefined ? Number(profile.percentage) : Number(result.percentage || 0);
    const score = profile && profile.score !== null && profile.score !== undefined ? Number(profile.score) : Number(result.score || 0);
    const hidden = profile?.hidden === true || profile?.showOnLeaderboard === false;
    rows.push({
      studentKey: composite, _identity: norm(result.email) || norm(result.resultId || result._id), testId: String(test._id), testTitle: test.title,
      resultId: result.resultId || String(result._id), email: norm(result.email),
      name: profile?.name || result.candidateName || "Student", score, percentage,
      grade: profile?.grade || result.grade || gradeFromPercentage(percentage),
      status: passed ? (profile?.status || "PASSED") : "FAILED", passed,
      submittedAt: result.submittedAt || result.createdAt || null,
      image: profile?.imageData ? { data: profile.imageData, mimeType: profile.imageMimeType || "image/jpeg" } : null,
      hidden,
      showOnLeaderboard: profile?.showOnLeaderboard === true,
      hasVisibilityOverride: typeof profile?.showOnLeaderboard === "boolean",
      updatedByAdmin: profile?.updatedByAdmin === true,
      profileId: profile?._id ? String(profile._id) : null,
      rank: null
    });
  }

  const passedRows = rows.filter(r => r.passed).sort((a, b) => b.percentage - a.percentage || b.score - a.score || a.name.localeCompare(b.name));
  applyDenseRanking(passedRows);
  const rankByIdentity = new Map(passedRows.map(r => [r._identity, r.rank]));
  for (const row of rows) row.rank = row.passed ? (rankByIdentity.get(row._identity) || null) : null;
  return rows.sort((a, b) => (a.rank || 999999) - (b.rank || 999999) || b.percentage - a.percentage || a.name.localeCompare(b.name));
}

function publicEligible(row) {
  if (!row.passed || row.hidden || String(row.status).toUpperCase() === "FAILED") return false;
  if (row.hasVisibilityOverride) return row.showOnLeaderboard;
  return row.rank !== null && row.rank <= 5; // default: top five ranks visible; rank 6+ needs admin opt-in
}

function publicShape(row, includePhoto = true) {
  const { hidden, hasVisibilityOverride, showOnLeaderboard, passed, email, profileId, _identity, studentKey, ...safe } = row;
  return { ...safe, photo: includePhoto && row.image ? row.image : null };
}

router.get("/leaderboard/tests", async (req, res) => {
  try { res.json({ success: true, tests: await getTests() }); }
  catch (e) { console.error("Leaderboard test list error", e); res.status(500).json({ success: false, message: "Unable to load tests." }); }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const tests = await getTests();
    const settings = await getSettings();
    let selectedTests;
    const requested = String(req.query.testId || "");
    const wantsAll = req.query.all === "true" || settings.showAllTests;
    if (wantsAll) selectedTests = tests;
    else if (requested && requested !== "latest") selectedTests = tests.filter(t => String(t._id) === requested);
    else if (settings.selectedTestId && settings.selectedTestId !== "latest") selectedTests = tests.filter(t => String(t._id) === settings.selectedTestId);
    else selectedTests = tests.slice(0, 1);
    const latestId = tests[0] ? String(tests[0]._id) : "";
    const grouped = [];
    for (const test of selectedTests) {
      const rows = await getRowsForTest(test, false);
      const isLatestTest = String(test._id) === latestId;
      const visible = rows.filter(publicEligible).map(r => ({ ...publicShape(r, isLatestTest), isLatestTest }));
      grouped.push({ testId: String(test._id), testTitle: test.title, isLatestTest: String(test._id) === latestId, students: visible });
    }
    const students = grouped.flatMap(g => g.students);
    res.json({ success: true, title: "Top Performers", selectedTestId: wantsAll ? "all" : (selectedTests[0] ? String(selectedTests[0]._id) : ""), showAllTests: wantsAll, latestTestId: latestId, tests: grouped, students });
  } catch (e) { console.error("Leaderboard public error", e); res.status(500).json({ success: false, message: "Unable to load leaderboard." }); }
});

router.get("/admin/leaderboard/tests", adminAuth, async (req, res) => {
  try { res.json({ success: true, tests: await getTests(), settings: await getSettings() }); }
  catch (e) { console.error("Admin leaderboard tests error", e); res.status(500).json({ success: false, message: "Unable to load tests." }); }
});

router.put("/admin/leaderboard/settings", adminAuth, async (req, res) => {
  try {
    const showAllTests = req.body.showAllTests === true || req.body.showAllTests === "true";
    const selectedTestId = showAllTests ? "all" : String(req.body.selectedTestId || "latest");
    if (!showAllTests && selectedTestId !== "latest" && !/^[a-f\d]{24}$/i.test(selectedTestId)) return res.status(400).json({ success: false, message: "Select a valid test." });
    if (!showAllTests && selectedTestId !== "latest" && !(await Test.exists({ _id: selectedTestId }))) return res.status(400).json({ success: false, message: "Selected test was not found." });
    const settings = await LeaderboardSettings.findOneAndUpdate({ key: "public" }, { $set: { selectedTestId, showAllTests } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    res.json({ success: true, settings });
  } catch (e) { console.error("Leaderboard settings update error", e); res.status(500).json({ success: false, message: "Unable to save leaderboard display settings." }); }
});

router.get("/admin/leaderboard", adminAuth, async (req, res) => {
  try {
    const tests = await getTests();
    const testId = String(req.query.testId || "latest");
    const selectedTests = testId === "all" ? tests : testId === "latest" ? tests.slice(0, 1) : tests.filter(t => String(t._id) === testId);
    const students = [];
    for (const test of selectedTests) students.push(...await getRowsForTest(test, true));
    res.json({ success: true, students, tests, settings: await getSettings() });
  } catch (e) { console.error("Leaderboard admin GET error", e); res.status(500).json({ success: false, message: "Unable to load leaderboard." }); }
});

router.put("/admin/leaderboard/:studentKey", adminAuth, async (req, res) => {
  try {
    const studentKey = String(req.params.studentKey || "").trim().toLowerCase();
    if (!studentKey) return res.status(400).json({ success: false, message: "Student key is required." });
    const allowed = ["name", "score", "percentage", "grade", "status", "testTitle", "rank", "imageData", "imageMimeType", "hidden", "showOnLeaderboard"];
    const data = { updatedByAdmin: true };
    for (const field of allowed) if (req.body[field] !== undefined) data[field] = req.body[field];
    if (data.name !== undefined) data.name = String(data.name).trim().slice(0, 100);
    if (data.grade !== undefined) data.grade = String(data.grade).trim().slice(0, 20);
    if (data.status !== undefined) data.status = String(data.status).trim().slice(0, 30).toUpperCase();
    if (data.testTitle !== undefined) data.testTitle = String(data.testTitle).trim().slice(0, 160);
    for (const field of ["score", "percentage", "rank"]) if (data[field] !== undefined) { data[field] = num(data[field]); if (data[field] === null) delete data[field]; }
    if (data.percentage !== undefined && data.percentage !== null) data.percentage = Math.max(0, Math.min(100, data.percentage));
    if (data.rank !== undefined && data.rank !== null) data.rank = Math.max(1, Math.min(999, Math.round(data.rank)));
    if (data.hidden !== undefined) data.hidden = data.hidden === true || data.hidden === "true";
    if (data.showOnLeaderboard !== undefined) data.showOnLeaderboard = data.showOnLeaderboard === true || data.showOnLeaderboard === "true";
    if (data.showOnLeaderboard !== undefined) data.hidden = !data.showOnLeaderboard;
    if (data.imageData !== undefined && data.imageData !== "") {
      if (typeof data.imageData !== "string" || data.imageData.length > 1600000 || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(data.imageData)) return res.status(400).json({ success: false, message: "Upload a smaller JPG, PNG or WebP student photo." });
    }
    const splitAt = studentKey.indexOf("::");
    const testId = splitAt > -1 ? studentKey.slice(0, splitAt) : "";
    const email = splitAt > -1 ? studentKey.slice(splitAt + 2) : "";
    if (testId) { data.testId = testId; data.email = email; }
    const profile = await LeaderboardProfile.findOneAndUpdate({ studentKey }, { $set: data, $setOnInsert: { studentKey } }, { new: true, upsert: true, runValidators: true }).lean();
    res.json({ success: true, profile });
  } catch (e) { console.error("Leaderboard profile update error", e); res.status(500).json({ success: false, message: "Unable to save leaderboard changes." }); }
});

router.delete("/admin/leaderboard/:studentKey", adminAuth, async (req, res) => {
  try { const studentKey = String(req.params.studentKey || "").trim().toLowerCase(); await LeaderboardProfile.deleteOne({ studentKey }); res.json({ success: true, message: "Leaderboard override reset." }); }
  catch (e) { console.error("Leaderboard reset error", e); res.status(500).json({ success: false, message: "Unable to reset leaderboard entry." }); }
});

module.exports = router;
