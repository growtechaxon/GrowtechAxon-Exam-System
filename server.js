require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const Test = require("./Backend/Models/Test");
const { defaultQuestions } = require("./Backend/Data/questions");

const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FRONTEND
========================= */

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   BASIC API
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "GrowtechAxon Exam System",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/api/config", (req, res) => {
  res.json({
    whatsappGroupLink: process.env.WHATSAPP_GROUP_LINK || "",
    brand: "GrowtechAxon"
  });
});

/* =========================
   BACKEND ROUTES
========================= */

app.use("/api", require("./Backend/Routes/testRoutes"));
app.use("/api/admin", require("./Backend/Routes/adminRoutes"));
app.use("/api", require("./Backend/Routes/certificateRoutes"));

/* =========================
   FRONTEND FALLBACK
========================= */

app.get("*splat", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      message: "API route not found."
    });
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   DATABASE SEED
========================= */

async function seed() {
  const count = await Test.countDocuments();

  if (count === 0) {
    await Test.create({
      title: "HTML & CSS Assessment",
      description: "Demo assessment covering HTML and CSS fundamentals.",
      durationMinutes: 15,
      passingPercentage: Number(
        process.env.CERTIFICATE_PASS_PERCENTAGE || 50
      ),
      certificateEnabled: true,
      active: true,
      questions: defaultQuestions
    });

    console.log("Default demo test seeded.");
  }
}

/* =========================
   START SERVER FIRST
========================= */

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(
    `GrowtechAxon Exam System running at http://localhost:${port}`
  );

  connectDatabase();
});

/* =========================
   DATABASE CONNECTION
========================= */

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI missing in .env");
    console.warn("Frontend is running, but database features are unavailable.");
    return;
  }

  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET missing in .env");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    await seed();

    console.log("Database ready.");
  } catch (err) {
    console.error("⚠️ MongoDB connection failed.");
    console.error(err.message);
    console.log(
      "Frontend will continue running at http://localhost:" + port
    );
  }
}