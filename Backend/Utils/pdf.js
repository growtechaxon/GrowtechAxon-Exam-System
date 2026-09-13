const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/* =========================================================
   HELPERS
========================================================= */

function safe(value, fallback = "") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function formatDate(value) {
  if (!value) return "";

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
   COLORS
========================================================= */

const COLORS = {
  navyDark: "#020B1D",
  navy: "#06152D",
  navyLight: "#071A36",

  gold: "#D6B36A",
  goldLight: "#F0D99A",
  goldDark: "#806326",

  white: "#FFFFFF",
  muted: "#93A4BC",
  muted2: "#71839C",

  bluePanel: "#0B2747"
};

/* =========================================================
   RESULT PDF
========================================================= */

function buildResultPdf(result, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 45,

    info: {
      Title: `Growtech Axon Result - ${safe(result.resultId, "Result")}`,
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

  /* Background */

  doc
    .rect(0, 0, pageWidth, pageHeight)
    .fill(COLORS.navyDark);

  /* Main panel */

  doc
    .roundedRect(
      28,
      28,
      pageWidth - 56,
      pageHeight - 56,
      16
    )
    .fill(COLORS.navy);

  /* Gold border */

  doc
    .roundedRect(
      35,
      35,
      pageWidth - 70,
      pageHeight - 70,
      12
    )
    .lineWidth(1.5)
    .stroke(COLORS.gold);

  /* Header */

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(COLORS.goldLight)
    .text(
      "GROWTECH AXON",
      55,
      65,
      {
        width: pageWidth - 110,
        align: "center"
      }
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "DIGITAL INNOVATION • SMARTER GROWTH",
      55,
      94,
      {
        width: pageWidth - 110,
        align: "center",
        characterSpacing: 1.2
      }
    );

  doc
    .moveTo(85, 120)
    .lineTo(pageWidth - 85, 120)
    .lineWidth(1)
    .stroke(COLORS.goldDark);

  /* Heading */

  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor(COLORS.white)
    .text(
      "ASSESSMENT RESULT",
      55,
      150,
      {
        width: pageWidth - 110,
        align: "center"
      }
    );

  /* Candidate */

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("CANDIDATE", 70, 205);

  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(COLORS.white)
    .text(
      safe(result.candidateName, "Candidate"),
      70,
      222,
      {
        width: pageWidth - 140
      }
    );

  /* Test */

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("ASSESSMENT", 70, 265);

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.goldLight)
    .text(
      safe(result.testTitle, "Assessment"),
      70,
      282,
      {
        width: pageWidth - 140
      }
    );

  /* Score */

  const scoreY = 330;

  doc
    .roundedRect(
      70,
      scoreY,
      pageWidth - 140,
      95,
      14
    )
    .fill("#081D3C");

  doc
    .roundedRect(
      70,
      scoreY,
      pageWidth - 140,
      95,
      14
    )
    .lineWidth(1)
    .stroke(COLORS.goldDark);

  const percentage = Number(result.percentage) || 0;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text("FINAL SCORE", 95, scoreY + 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(COLORS.goldLight)
    .text(
      formatPercentage(percentage),
      95,
      scoreY + 38
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text("GRADE", 300, scoreY + 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(COLORS.white)
    .text(
      safe(
        result.grade,
        gradeFromPercentage(percentage)
      ),
      300,
      scoreY + 38
    );

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text("RESULT ID", 470, scoreY + 20);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.white)
    .text(
      safe(result.resultId, "N/A"),
      470,
      scoreY + 42,
      {
        width: 190
      }
    );

  /* Statistics */

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
      .fillColor(COLORS.muted)
      .text(item[0], x, statsY);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(COLORS.white)
      .text(String(item[1]), x, statsY + 15);
  });

  /* Footer */

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted2)
    .text(
      `Submitted: ${formatDate(result.submittedAt)}`,
      70,
      pageHeight - 62
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted2)
    .text(
      "GROWTECH AXON • OFFICIAL ASSESSMENT RECORD",
      70,
      pageHeight - 47
    );

  doc.end();
}

/* =========================================================
   CERTIFICATE BACKGROUND
========================================================= */

function drawCertificateBackground(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  /* Full background */

  doc
    .rect(0, 0, w, h)
    .fill(COLORS.navyDark);

  /* Main certificate */

  doc
    .roundedRect(
      18,
      18,
      w - 36,
      h - 36,
      15
    )
    .fill(COLORS.navy);

  /* Inner panel */

  doc
    .roundedRect(
      38,
      38,
      w - 76,
      h - 76,
      10
    )
    .fill(COLORS.navyLight);
}

/* =========================================================
   PREMIUM BORDER
========================================================= */

function drawPremiumBorder(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  /* Outer */

  doc
    .roundedRect(
      17,
      17,
      w - 34,
      h - 34,
      15
    )
    .lineWidth(2)
    .stroke(COLORS.gold);

  /* Middle */

  doc
    .roundedRect(
      27,
      27,
      w - 54,
      h - 54,
      11
    )
    .lineWidth(0.8)
    .stroke(COLORS.goldDark);

  /* Inner */

  doc
    .roundedRect(
      34,
      34,
      w - 68,
      h - 68,
      8
    )
    .lineWidth(0.35)
    .stroke(COLORS.goldLight);
}

/* =========================================================
   CORNER DESIGN
========================================================= */

function drawCornerDecoration(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  const gold = COLORS.gold;

  /* Top Left */

  doc
    .moveTo(38, 105)
    .lineTo(38, 55)
    .bezierCurveTo(
      38,
      43,
      45,
      38,
      57,
      38
    )
    .lineTo(107, 38)
    .lineWidth(2)
    .stroke(gold);

  /* Top Right */

  doc
    .moveTo(w - 38, 105)
    .lineTo(w - 38, 55)
    .bezierCurveTo(
      w - 38,
      43,
      w - 45,
      38,
      w - 57,
      38
    )
    .lineTo(w - 107, 38)
    .lineWidth(2)
    .stroke(gold);

  /* Bottom Left */

  doc
    .moveTo(38, h - 105)
    .lineTo(38, h - 55)
    .bezierCurveTo(
      38,
      h - 43,
      45,
      h - 38,
      57,
      h - 38
    )
    .lineTo(107, h - 38)
    .lineWidth(2)
    .stroke(gold);

  /* Bottom Right */

  doc
    .moveTo(w - 38, h - 105)
    .lineTo(w - 38, h - 55)
    .bezierCurveTo(
      w - 38,
      h - 43,
      w - 45,
      h - 38,
      w - 57,
      h - 38
    )
    .lineTo(w - 107, h - 38)
    .lineWidth(2)
    .stroke(gold);
}

/* =========================================================
   SUBTLE BACKGROUND PATTERN
========================================================= */

function drawBackgroundTexture(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  doc.save();

  doc.opacity(0.035);

  for (let x = -h; x < w + h; x += 30) {
    doc
      .moveTo(x, 0)
      .lineTo(x + h, h)
      .lineWidth(0.5)
      .stroke(COLORS.goldLight);
  }

  doc.opacity(1);

  doc.restore();
}

/* =========================================================
   LOGO
========================================================= */

function drawLogo(doc) {
  const logoPath = path.join(
    __dirname,
    "../../public/assets/growtechaxon-logo.png"
  );

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(
        logoPath,
        55,
        47,
        {
          fit: [155, 60],
          align: "left",
          valign: "center"
        }
      );

      return;
    } catch (error) {
      console.warn(
        "Logo could not be loaded:",
        error.message
      );
    }
  }

  /* Fallback */

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.goldLight)
    .text(
      "GROWTECH AXON",
      55,
      58
    );
}

/* =========================================================
   CERTIFICATE ID TOP
========================================================= */

function drawTopCertificateId(doc, certificate) {
  const w = doc.page.width;

  const certificateId = safe(
    certificate.certificateId,
    certificate._id || "N/A"
  );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text(
      "CERTIFICATE ID",
      w - 265,
      55,
      {
        width: 205,
        align: "right",
        characterSpacing: 1
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.goldLight)
    .text(
      certificateId,
      w - 265,
      69,
      {
        width: 205,
        align: "right"
      }
    );
}

/* =========================================================
   TITLE
========================================================= */

function drawCertificateHeading(doc) {
  const w = doc.page.width;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "LEARN  •  IMPROVE  •  GROW",
      50,
      112,
      {
        width: w - 100,
        align: "center",
        characterSpacing: 2
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(31)
    .fillColor(COLORS.white)
    .text(
      "CERTIFICATE OF ACHIEVEMENT",
      50,
      140,
      {
        width: w - 100,
        align: "center"
      }
    );

  doc
    .moveTo(270, 181)
    .lineTo(w - 270, 181)
    .lineWidth(1)
    .stroke(COLORS.gold);

  /* Diamond */

  const cx = w / 2;

  doc
    .moveTo(cx, 176)
    .lineTo(cx + 5, 181)
    .lineTo(cx, 186)
    .lineTo(cx - 5, 181)
    .closePath()
    .fill(COLORS.goldLight);
}

/* =========================================================
   CANDIDATE
========================================================= */

function drawCandidateSection(doc, certificate) {
  const w = doc.page.width;

  const candidateName = safe(
    certificate.candidateName,
    "Candidate"
  );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
      70,
      202,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1.3
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(29)
    .fillColor(COLORS.white)
    .text(
      candidateName,
      70,
      222,
      {
        width: w - 140,
        align: "center"
      }
    );

  /* Name line */

  doc
    .moveTo(315, 265)
    .lineTo(w - 315, 265)
    .lineWidth(1)
    .stroke(COLORS.gold);

  /* Assessment label */

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "FOR SUCCESSFULLY COMPLETING THE ASSESSMENT",
      70,
      279,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1
      }
    );

  /* Test title */

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.goldLight)
    .text(
      safe(
        certificate.testTitle,
        "Assessment"
      ),
      100,
      299,
      {
        width: w - 200,
        align: "center"
      }
    );
}

/* =========================================================
   SCORE + GRADE
========================================================= */

function drawScoreBadge(doc, certificate) {
  const w = doc.page.width;

  const percentage =
    Number(certificate.percentage) || 0;

  const grade = safe(
    certificate.grade,
    gradeFromPercentage(percentage)
  );

  const cx = w / 2;
  const cy = 357;

  /* Outer */

  doc
    .circle(cx, cy, 38)
    .fill(COLORS.navy);

  doc
    .circle(cx, cy, 38)
    .lineWidth(1.8)
    .stroke(COLORS.gold);

  /* Inner */

  doc
    .circle(cx, cy, 31)
    .lineWidth(0.6)
    .stroke(COLORS.goldDark);

  /* Score */

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.muted)
    .text(
      "SCORE",
      cx - 30,
      cy - 20,
      {
        width: 60,
        align: "center",
        characterSpacing: 1.5
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.white)
    .text(
      formatPercentage(percentage),
      cx - 40,
      cy - 5,
      {
        width: 80,
        align: "center"
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(COLORS.goldLight)
    .text(
      `GRADE ${grade}`,
      cx - 40,
      cy + 16,
      {
        width: 80,
        align: "center",
        characterSpacing: 0.8
      }
    );
}

/* =========================================================
   SIGNATURE
========================================================= */

function drawSignature(doc, certificate) {
  const signaturePath = path.join(
    __dirname,
    "../../public/assets/signature.png"
  );

  const x = 75;
  const y = 445;

  /* Signature image */

  if (fs.existsSync(signaturePath)) {
    try {
      doc.image(
        signaturePath,
        x + 25,
        y - 5,
        {
          fit: [125, 42],
          align: "center",
          valign: "center"
        }
      );
    } catch (error) {
      console.warn(
        "Signature could not be loaded:",
        error.message
      );
    }
  }

  /* Signature line */

  doc
    .moveTo(x, y + 38)
    .lineTo(x + 175, y + 38)
    .lineWidth(0.7)
    .stroke(COLORS.goldDark);

  const name = safe(
    certificate.signatoryName,
    "Ram"
  );

  const designation = safe(
    certificate.signatoryDesignation,
    "Founder & CEO"
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(
      name,
      x,
      y + 46,
      {
        width: 175,
        align: "center"
      }
    );

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.muted)
    .text(
      designation,
      x,
      y + 59,
      {
        width: 175,
        align: "center"
      }
    );
}

/* =========================================================
   OFFICIAL SEAL
========================================================= */

function drawOfficialSeal(doc) {
  const cx = 420;
  const cy = 475;

  /* Outer */

  doc
    .circle(cx, cy, 31)
    .lineWidth(1.6)
    .stroke(COLORS.gold);

  /* Inner */

  doc
    .circle(cx, cy, 25)
    .lineWidth(0.7)
    .stroke(COLORS.goldDark);

  /* Star */

  doc
    .moveTo(cx, cy - 14)
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
    .fill(COLORS.gold);

  doc
    .font("Helvetica-Bold")
    .fontSize(5.5)
    .fillColor(COLORS.goldLight)
    .text(
      "GROWTECH",
      cx - 25,
      cy - 24,
      {
        width: 50,
        align: "center",
        characterSpacing: 0.6
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(5.5)
    .fillColor(COLORS.goldLight)
    .text(
      "AXON",
      cx - 25,
      cy + 17,
      {
        width: 50,
        align: "center",
        characterSpacing: 1
      }
    );
}

/* =========================================================
   DATE + CERTIFICATE ID
========================================================= */

function drawCertificateMeta(doc, certificate) {
  const w = doc.page.width;

  const x = w - 270;
  const y = 439;

  const certificateId = safe(
    certificate.certificateId,
    certificate._id || "N/A"
  );

  const issueDate =
    formatDate(certificate.issueDate);

  /* Date */

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.muted)
    .text(
      "DATE OF ISSUE",
      x,
      y,
      {
        width: 190,
        characterSpacing: 1
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.white)
    .text(
      issueDate || "N/A",
      x,
      y + 12,
      {
        width: 190
      }
    );

  /* Certificate ID */

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.muted)
    .text(
      "CERTIFICATE ID",
      x,
      y + 32,
      {
        width: 190,
        characterSpacing: 1
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.goldLight)
    .text(
      certificateId,
      x,
      y + 44,
      {
        width: 190
      }
    );

  /* Verified badge */

  doc
    .roundedRect(
      x,
      y + 66,
      115,
      18,
      9
    )
    .fill(COLORS.bluePanel);

  doc
    .roundedRect(
      x,
      y + 66,
      115,
      18,
      9
    )
    .lineWidth(0.6)
    .stroke(COLORS.goldDark);

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor(COLORS.goldLight)
    .text(
      "AUTHENTIC CERTIFICATE",
      x + 8,
      y + 72,
      {
        width: 99,
        align: "center",
        characterSpacing: 0.3
      }
    );
}

/* =========================================================
   FOOTER
========================================================= */

function drawCertificateFooter(doc) {
  const w = doc.page.width;
  const h = doc.page.height;

  doc
    .moveTo(95, h - 63)
    .lineTo(w - 95, h - 63)
    .lineWidth(0.5)
    .stroke(COLORS.goldDark);

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.muted2)
    .text(
      "This certificate can be verified through the official Growtech Axon verification portal.",
      70,
      h - 51,
      {
        width: w - 140,
        align: "center"
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor(COLORS.muted)
    .text(
      "SKILLS TODAY, SUCCESS TOMORROW",
      70,
      h - 37,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1
      }
    );
}

/* =========================================================
   CERTIFICATE PDF
========================================================= */

function buildCertificatePdf(certificate, res) {

  const certificateId = safe(
    certificate.certificateId,
    certificate._id || "certificate"
  );

  /*
      IMPORTANT

      A4 Landscape:
      842 x 595 points
  */

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,

    info: {
      Title: `Growtech Axon Certificate - ${certificateId}`,
      Author: "Growtech Axon",
      Subject: "Certificate of Achievement",
      Keywords:
        "Growtech Axon, Certificate, Achievement, Verification"
    }
  });

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="GrowtechAxon-Certificate-${certificateId}.pdf"`
  );

  doc.pipe(res);

  /* Background */

  drawCertificateBackground(doc);

  /* Texture */

  drawBackgroundTexture(doc);

  /* Borders */

  drawPremiumBorder(doc);

  /* Corners */

  drawCornerDecoration(doc);

  /* Logo */

  drawLogo(doc);

  /* Certificate ID */

  drawTopCertificateId(
    doc,
    certificate
  );

  /* Heading */

  drawCertificateHeading(doc);

  /* Candidate */

  drawCandidateSection(
    doc,
    certificate
  );

  /* Score */

  drawScoreBadge(
    doc,
    certificate
  );

  /* Signature */

  drawSignature(
    doc,
    certificate
  );

  /* Seal */

  drawOfficialSeal(doc);

  /* Meta */

  drawCertificateMeta(
    doc,
    certificate
  );

  /* Footer */

  drawCertificateFooter(doc);

  /* Finish */

  doc.end();
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  buildResultPdf,
  buildCertificatePdf,
  gradeFromPercentage
};