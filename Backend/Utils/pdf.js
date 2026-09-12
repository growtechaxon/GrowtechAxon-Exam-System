const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/* =========================================================
   COMMON HELPERS
========================================================= */

function safe(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function formatDate(value) {
  if (!value) {
    return "";

  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safe(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${Number.isInteger(number) ? number : number.toFixed(1)}%`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* =========================================================
   GRADE
========================================================= */

function gradeFromPercentage(percentage) {
  const p = Number(percentage) || 0;

  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";

  return "F";
}

/* =========================================================
   RESULT PDF
========================================================= */

function buildResultPdf(result, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 45,
    info: {
      Title: `Growtech Axon Result - ${safe(result.resultId)}`,
      Author: "Growtech Axon",
      Subject: "Assessment Result"
    }
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="GrowtechAxon-Result-${safe(
      result.resultId,
      "result"
    )}.pdf"`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Background
  doc.rect(0, 0, pageWidth, pageHeight).fill("#020b1d");

  // Main panel
  doc
    .roundedRect(28, 28, pageWidth - 56, pageHeight - 56, 16)
    .fill("#06152d");

  // Gold border
  doc
    .roundedRect(35, 35, pageWidth - 70, pageHeight - 70, 12)
    .lineWidth(1.5)
    .stroke("#c9a24a");

  // Header
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#f5d77a")
    .text("GROWTECH AXON", 55, 65, {
      width: pageWidth - 110,
      align: "center"
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9fb0c8")
    .text("DIGITAL INNOVATION • SMARTER GROWTH", 55, 94, {
      width: pageWidth - 110,
      align: "center",
      characterSpacing: 1.2
    });

  doc
    .moveTo(85, 120)
    .lineTo(pageWidth - 85, 120)
    .lineWidth(1)
    .stroke("#8b6c2f");

  // Result heading
  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor("#ffffff")
    .text("ASSESSMENT RESULT", 55, 150, {
      width: pageWidth - 110,
      align: "center"
    });

  // Candidate
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#9fb0c8")
    .text("CANDIDATE", 70, 205);

  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor("#ffffff")
    .text(safe(result.candidateName, "Candidate"), 70, 222, {
      width: pageWidth - 140
    });

  // Test
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#9fb0c8")
    .text("ASSESSMENT", 70, 265);

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#f5d77a")
    .text(safe(result.testTitle, "Assessment"), 70, 282, {
      width: pageWidth - 140
    });

  // Score card
  const scoreY = 330;

  doc
    .roundedRect(70, scoreY, pageWidth - 140, 95, 14)
    .fill("#081d3c");

  doc
    .roundedRect(70, scoreY, pageWidth - 140, 95, 14)
    .lineWidth(1)
    .stroke("#6f5727");

  const percentage = Number(result.percentage) || 0;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9fb0c8")
    .text("FINAL SCORE", 95, scoreY + 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#f5d77a")
    .text(formatPercentage(percentage), 95, scoreY + 38);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9fb0c8")
    .text("GRADE", 300, scoreY + 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#ffffff")
    .text(safe(result.grade, gradeFromPercentage(percentage)), 300, scoreY + 38);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9fb0c8")
    .text("RESULT ID", 470, scoreY + 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#ffffff")
    .text(safe(result.resultId, "N/A"), 470, scoreY + 42, {
      width: 190
    });

  // Statistics
  const statsY = 455;

  const stats = [
    ["CORRECT", result.correct ?? 0],
    ["WRONG", result.wrong ?? 0],
    ["UNANSWERED", result.unanswered ?? 0]
  ];

  stats.forEach((item, index) => {
    const x = 70 + index * 215;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#8fa1ba")
      .text(item[0], x, statsY);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#ffffff")
      .text(String(item[1]), x, statsY + 15);
  });

  // Submitted date
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#8fa1ba")
    .text(
      `Submitted: ${formatDate(result.submittedAt)}`,
      70,
      pageHeight - 62
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#8fa1ba")
    .text("GROWTECH AXON • OFFICIAL ASSESSMENT RECORD", 70, pageHeight - 47);

  doc.end();
}

/* =========================================================
   PREMIUM CERTIFICATE HELPERS
========================================================= */

function drawPremiumBorder(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  // Outer gold line
  doc
    .roundedRect(18, 18, w - 36, h - 36, 15)
    .lineWidth(2)
    .stroke("#c9a24a");

  // Inner gold line
  doc
    .roundedRect(27, 27, w - 54, h - 54, 11)
    .lineWidth(0.7)
    .stroke("#73591f");

  // Fine highlight line
  doc
    .roundedRect(33, 33, w - 66, h - 66, 8)
    .lineWidth(0.35)
    .stroke("#d8bd70");
}

function drawCornerDecoration(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  // Top-left
  doc
    .moveTo(35, 105)
    .lineTo(35, 55)
    .bezierCurveTo(35, 43, 43, 35, 55, 35)
    .lineTo(105, 35)
    .lineWidth(2)
    .stroke("#c9a24a");

  // Top-right
  doc
    .moveTo(w - 35, 105)
    .lineTo(w - 35, 55)
    .bezierCurveTo(w - 35, 43, w - 43, 35, w - 55, 35)
    .lineTo(w - 105, 35)
    .lineWidth(2)
    .stroke("#c9a24a");

  // Bottom-left
  doc
    .moveTo(35, h - 105)
    .lineTo(35, h - 55)
    .bezierCurveTo(35, h - 43, 43, h - 35, 55, h - 35)
    .lineTo(105, h - 35)
    .lineWidth(2)
    .stroke("#c9a24a");

  // Bottom-right
  doc
    .moveTo(w - 35, h - 105)
    .lineTo(w - 35, h - 55)
    .bezierCurveTo(w - 35, h - 43, w - 43, h - 35, w - 55, h - 35)
    .lineTo(w - 105, h - 35)
    .lineWidth(2)
    .stroke("#c9a24a");
}

function drawBackgroundTexture(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  // Subtle diagonal lines
  doc.save();

  doc.opacity(0.035);

  for (let x = -h; x < w + h; x += 28) {
    doc
      .moveTo(x, 0)
      .lineTo(x + h, h)
      .lineWidth(0.5)
      .stroke("#d9b85c");
  }

  doc.opacity(1);
  doc.restore();
}

function drawTopAccent(doc) {
  const w = doc.page.width;

  doc
    .moveTo(120, 145)
    .lineTo(w - 120, 145)
    .lineWidth(0.6)
    .stroke("#806326");

  doc
    .moveTo(285, 145)
    .lineTo(w - 285, 145)
    .lineWidth(1.6)
    .stroke("#c9a24a");

  // Small center diamond
  const cx = w / 2;
  const cy = 145;

  doc
    .moveTo(cx, cy - 5)
    .lineTo(cx + 5, cy)
    .lineTo(cx, cy + 5)
    .lineTo(cx - 5, cy)
    .closePath()
    .fill("#c9a24a");
}

function drawLogo(doc) {
  const logoPath = path.join(
    __dirname,
    "../../public/assets/growtechaxon-logo.png"
  );

  if (!fs.existsSync(logoPath)) {
    // Fallback text if logo is missing
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#f5d77a")
      .text("GROWTECH AXON", 55, 52);

    return;
  }

  try {
    doc.image(logoPath, 52, 45, {
      fit: [150, 70],
      align: "left",
      valign: "center"
    });
  } catch (error) {
    console.warn("Unable to load Growtech Axon logo:", error.message);

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#f5d77a")
      .text("GROWTECH AXON", 55, 52);
  }
}

function drawTopRightId(doc, certificate) {
  const w = doc.page.width;

  const id = safe(
    certificate.certificateId,
    certificate._id || "N/A"
  );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#8193ad")
    .text("CERTIFICATE ID", w - 260, 55, {
      width: 205,
      align: "right",
      characterSpacing: 1
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#f5d77a")
    .text(id, w - 260, 68, {
      width: 205,
      align: "right"
    });
}

function drawCertificateHeading(doc) {
  const w = doc.page.width;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#a8b5c7")
    .text("GROWTECH AXON", 50, 122, {
      width: w - 100,
      align: "center",
      characterSpacing: 3
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(31)
    .fillColor("#ffffff")
    .text("CERTIFICATE", 50, 158, {
      width: w - 100,
      align: "center"
    });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#f5d77a")
    .text("OF ACHIEVEMENT", 50, 195, {
      width: w - 100,
      align: "center",
      characterSpacing: 3
    });
}

function drawCandidateSection(doc, certificate) {
  const w = doc.page.width;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9aabc1")
    .text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 70, 235, {
      width: w - 140,
      align: "center",
      characterSpacing: 1.4
    });

  const candidateName = safe(
    certificate.candidateName,
    "Candidate"
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#ffffff")
    .text(candidateName, 70, 258, {
      width: w - 140,
      align: "center",
      lineGap: 3
    });

  doc
    .moveTo(300, 302)
    .lineTo(w - 300, 302)
    .lineWidth(1)
    .stroke("#c9a24a");

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#9aabc1")
    .text("FOR SUCCESSFULLY COMPLETING THE ASSESSMENT", 70, 316, {
      width: w - 140,
      align: "center",
      characterSpacing: 1
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#f5d77a")
    .text(
      safe(certificate.testTitle, "Assessment"),
      100,
      339,
      {
        width: w - 200,
        align: "center"
      }
    );
}

function drawScoreBadge(doc, certificate) {
  const w = doc.page.width;

  const percentage = Number(certificate.percentage) || 0;
  const grade = safe(
    certificate.grade,
    gradeFromPercentage(percentage)
  );

  const cx = w / 2;
  const cy = 410;
  const radius = 47;

  // Outer circle
  doc
    .circle(cx, cy, radius)
    .fill("#071a36");

  doc
    .circle(cx, cy, radius)
    .lineWidth(2)
    .stroke("#c9a24a");

  // Inner circle
  doc
    .circle(cx, cy, radius - 7)
    .lineWidth(0.5)
    .stroke("#73591f");

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#93a4bc")
    .text("SCORE", cx - 30, cy - 24, {
      width: 60,
      align: "center",
      characterSpacing: 1.5
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#ffffff")
    .text(formatPercentage(percentage), cx - 40, cy - 8, {
      width: 80,
      align: "center"
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#f5d77a")
    .text(`GRADE ${grade}`, cx - 40, cy + 17, {
      width: 80,
      align: "center",
      characterSpacing: 1
    });
}

function drawDigitalSignature(doc, certificate) {
  const name = safe(
    certificate.signatoryName,
    process.env.CERTIFICATE_SIGNATORY_NAME || "Authorized Signatory"
  );

  const designation = safe(
    certificate.signatoryDesignation,
    process.env.CERTIFICATE_SIGNATORY_DESIGNATION ||
      "Authorized Signatory"
  );

  const x = 95;
  const y = 472;

  // Signature line
  doc
    .moveTo(x, y + 34)
    .lineTo(x + 180, y + 34)
    .lineWidth(0.7)
    .stroke("#78602a");

  // Digital signature-style curves
  doc.save();

  doc
    .moveTo(x + 15, y + 22)
    .bezierCurveTo(
      x + 35,
      y - 2,
      x + 45,
      y + 45,
      x + 65,
      y + 13
    )
    .bezierCurveTo(
      x + 82,
      y - 7,
      x + 91,
      y + 43,
      x + 112,
      y + 15
    )
    .bezierCurveTo(
      x + 128,
      y - 2,
      x + 145,
      y + 35,
      x + 162,
      y + 9
    )
    .lineWidth(1.4)
    .stroke("#f0d37a");

  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#ffffff")
    .text(name, x, y + 42, {
      width: 180,
      align: "center"
    });

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#8e9eb4")
    .text(designation, x, y + 57, {
      width: 180,
      align: "center",
      characterSpacing: 0.7
    });
}

function drawOfficialSeal(doc) {
  const cx = 420;
  const cy = 506;

  // Outer seal
  doc
    .circle(cx, cy, 34)
    .lineWidth(1.5)
    .stroke("#c9a24a");

  doc
    .circle(cx, cy, 28)
    .lineWidth(0.6)
    .stroke("#806326");

  // Star / AXON symbol
  doc
    .moveTo(cx, cy - 13)
    .lineTo(cx + 4, cy - 4)
    .lineTo(cx + 14, cy - 4)
    .lineTo(cx + 6, cy + 2)
    .lineTo(cx + 9, cy + 12)
    .lineTo(cx, cy + 6)
    .lineTo(cx - 9, cy + 12)
    .lineTo(cx - 6, cy + 2)
    .lineTo(cx - 14, cy - 4)
    .lineTo(cx - 4, cy - 4)
    .closePath()
    .fill("#c9a24a");

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor("#f5d77a")
    .text("GROWTECH", cx - 27, cy - 26, {
      width: 54,
      align: "center",
      characterSpacing: 0.8
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor("#f5d77a")
    .text("AXON", cx - 27, cy + 18, {
      width: 54,
      align: "center",
      characterSpacing: 1
    });
}

function drawCertificateMeta(doc, certificate) {
  const w = doc.page.width;

  const x = w - 275;
  const y = 468;

  const certificateId = safe(
    certificate.certificateId,
    certificate._id || "N/A"
  );

  const issueDate = formatDate(certificate.issueDate);

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#7f91aa")
    .text("DATE OF ISSUE", x, y, {
      width: 190,
      characterSpacing: 1
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#ffffff")
    .text(issueDate || "N/A", x, y + 13, {
      width: 190
    });

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#7f91aa")
    .text("CERTIFICATE ID", x, y + 37, {
      width: 190,
      characterSpacing: 1
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#f5d77a")
    .text(certificateId, x, y + 50, {
      width: 190
    });

  // Verified mark
  doc
    .roundedRect(x, y + 73, 98, 19, 9)
    .fill("#0b2747");

  doc
    .roundedRect(x, y + 73, 98, 19, 9)
    .lineWidth(0.7)
    .stroke("#806326");

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor("#f5d77a")
    .text("AUTHENTIC CERTIFICATE", x + 8, y + 80, {
      width: 82,
      align: "center",
      characterSpacing: 0.4
    });
}

function drawCertificateFooter(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  doc
    .moveTo(90, h - 67)
    .lineTo(w - 90, h - 67)
    .lineWidth(0.5)
    .stroke("#73591f");

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor("#71839c")
    .text(
      "This certificate can be verified through the official Growtech Axon verification portal.",
      70,
      h - 55,
      {
        width: w - 140,
        align: "center"
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor("#8c9ab0")
    .text(
      "GROWTECH AXON • CERTIFICATE AUTHENTICITY & VERIFICATION",
      70,
      h - 40,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 0.7
      }
    );
}

/* =========================================================
   PREMIUM CERTIFICATE PDF
========================================================= */

function buildCertificatePdf(certificate, res) {
  const certificateId = safe(
    certificate.certificateId,
    certificate._id || "certificate"
  );

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,
    info: {
      Title: `Growtech Axon Certificate - ${certificateId}`,
      Author: "Growtech Axon",
      Subject: "Certificate of Achievement",
      Keywords: "Growtech Axon, Certificate, Achievement, Verification"
    }
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="GrowtechAxon-Certificate-${certificateId}.pdf"`
  );

  doc.pipe(res);

  const w = doc.page.width;
  const h = doc.page.height;

  /* -------------------------------------------------------
     BACKGROUND
  ------------------------------------------------------- */

  doc.rect(0, 0, w, h).fill("#020b1d");

  // Large central panel
  doc
    .roundedRect(22, 22, w - 44, h - 44, 16)
    .fill("#06152d");

  // Slight inner panel
  doc
    .roundedRect(39, 39, w - 78, h - 78, 10)
    .fill("#071a36");

  drawBackgroundTexture(doc);
  drawPremiumBorder(doc);
  drawCornerDecoration(doc);

  /* -------------------------------------------------------
     HEADER
  ------------------------------------------------------- */

  drawLogo(doc);
  drawTopRightId(doc, certificate);

  /* -------------------------------------------------------
     MAIN CONTENT
  ------------------------------------------------------- */

  drawCertificateHeading(doc);
  drawTopAccent(doc);
  drawCandidateSection(doc, certificate);
  drawScoreBadge(doc, certificate);

  /* -------------------------------------------------------
     BOTTOM CONTENT
  ------------------------------------------------------- */

  drawDigitalSignature(doc, certificate);
  drawOfficialSeal(doc);
  drawCertificateMeta(doc, certificate);

  /* -------------------------------------------------------
     FOOTER
  ------------------------------------------------------- */

  drawCertificateFooter(doc);

  /* -------------------------------------------------------
     END
  ------------------------------------------------------- */

  doc.end();
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  buildResultPdf,
  buildCertificatePdf,
  gradeFromPercentage
};