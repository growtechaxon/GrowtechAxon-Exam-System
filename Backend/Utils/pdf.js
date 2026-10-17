"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

/*
|--------------------------------------------------------------------------
| GROWTECH AXON PDF SYSTEM
|--------------------------------------------------------------------------
| This single file contains:
|
| 1. Result PDF
| 2. Test-wise Results PDF
| 3. Premium Certificate PDF
|
| IMPORTANT:
| The exported function names MUST match adminRoutes.js:
|
| buildResultPdf
| buildTestResultsPdf
| buildCertificatePdf
| gradeFromPercentage
|--------------------------------------------------------------------------
*/


/* ========================================================================
   COLORS
======================================================================== */

const COLORS = {
  /* Result / Admin PDFs */
  navyDark: "#020B1D",
  navy: "#06152D",
  navyLight: "#071A36",

  gold: "#D6B36A",
  goldLight: "#F0D99A",
  goldDark: "#806326",

  white: "#FFFFFF",
  muted: "#93A4BC",
  muted2: "#71839C",

  bluePanel: "#0B2747",

  green: "#35D07F",
  red: "#FF6B6B",
  darkGreen: "#103D2A",
  darkRed: "#451D25",

  /* Premium Certificate */
  midnight: "#080B10",
  midnight2: "#0D1118",
  midnight3: "#111722",

  champagne: "#C9A45C",
  softGold: "#E7C77A",

  ivory: "#F5F1E8",
  silver: "#A9ADB5",

  certMuted: "#737985",
  certDarkGold: "#8D713A"
};


/* ========================================================================
   GENERAL HELPERS
======================================================================== */

function safe(value, fallback = "") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
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


function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safe(value, "N/A");
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}


function formatPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${
    Number.isInteger(number)
      ? number
      : number.toFixed(1)
  }%`;
}


/* ========================================================================
   GRADE
======================================================================== */

function gradeFromPercentage(percentage) {
  const p = Number(percentage) || 0;

  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";

  return "F";
}


/* Alias used internally by certificate */
function getGrade(percentage) {
  return gradeFromPercentage(percentage);
}


/* ========================================================================
   RESULT PDF
======================================================================== */

function buildResultPdf(result, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 45,

    info: {
      Title:
        `Growtech Axon Result - ${safe(
          result.resultId,
          "Result"
        )}`,

      Author: "Growtech Axon",

      Subject: "Assessment Result"
    }
  });


  res.setHeader(
    "Content-Type",
    "application/pdf"
  );


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


  /* ----------------------------------------------------------------------
     Background
  ---------------------------------------------------------------------- */

  doc
    .rect(
      0,
      0,
      pageWidth,
      pageHeight
    )
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


  /* ----------------------------------------------------------------------
     Header
  ---------------------------------------------------------------------- */

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


  /* ----------------------------------------------------------------------
     Heading
  ---------------------------------------------------------------------- */

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


  /* ----------------------------------------------------------------------
     Candidate
  ---------------------------------------------------------------------- */

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "CANDIDATE",
      70,
      205
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(COLORS.white)
    .text(
      safe(
        result.candidateName,
        "Candidate"
      ),
      70,
      222,
      {
        width: 330
      }
    );


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "CERTIFICATE ID",
      70,
      253
    );


  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(COLORS.white)
    .text(
      safe(
        result.certificateId,
        "N/A"
      ),
      70,
      269,
      {
        width: 330
      }
    );


  /* ----------------------------------------------------------------------
     Test
  ---------------------------------------------------------------------- */

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "ASSESSMENT",
      70,
      305
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.goldLight)
    .text(
      safe(
        result.testTitle,
        "Assessment"
      ),
      70,
      321,
      {
        width: 330
      }
    );


  /* ----------------------------------------------------------------------
     Score Card
  ---------------------------------------------------------------------- */

  const scoreY = 205;

  doc
    .roundedRect(
      440,
      scoreY,
      225,
      185,
      14
    )
    .fill(COLORS.navyLight);


  doc
    .roundedRect(
      440,
      scoreY,
      225,
      185,
      14
    )
    .lineWidth(1)
    .stroke(COLORS.goldDark);


  const percentage =
    Number(result.percentage || 0);


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "SCORE",
      465,
      scoreY + 22
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(34)
    .fillColor(COLORS.goldLight)
    .text(
      formatPercentage(percentage),
      465,
      scoreY + 40
    );


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "GRADE",
      570,
      scoreY + 22
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(COLORS.white)
    .text(
      safe(
        result.grade,
        gradeFromPercentage(
          percentage
        )
      ),
      570,
      scoreY + 40
    );


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "RESULT ID",
      465,
      scoreY + 105
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(
      safe(
        result.resultId,
        "N/A"
      ),
      465,
      scoreY + 123,
      {
        width: 170
      }
    );


  /* ----------------------------------------------------------------------
     Statistics
  ---------------------------------------------------------------------- */

  const statsY = 415;

  const stats = [
    [
      "CORRECT",
      result.correct ?? 0,
      COLORS.green
    ],

    [
      "WRONG",
      result.wrong ?? 0,
      COLORS.red
    ],

    [
      "UNANSWERED",
      result.unanswered ?? 0,
      COLORS.muted
    ]
  ];


  stats.forEach(
    (item, index) => {

      const x =
        70 + index * 215;


      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          item[0],
          x,
          statsY
        );


      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(item[2])
        .text(
          String(item[1]),
          x,
          statsY + 15
        );
    }
  );


  /* ----------------------------------------------------------------------
     Footer
  ---------------------------------------------------------------------- */

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted2)
    .text(
      `Submitted: ${formatDate(
        result.submittedAt
      )}`,
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


/* ========================================================================
   TEST-WISE RESULTS PDF
======================================================================== */

function buildTestResultsPdf(
  results,
  testTitle,
  res
) {

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,

    info: {
      Title:
        `Growtech Axon - ${safe(
          testTitle,
          "Test"
        )} Results`,

      Author: "Growtech Axon",

      Subject:
        "Test-wise Student Results"
    }
  });


  const safeTitle =
    safe(
      testTitle,
      "Test"
    )
      .replace(
        /[<>:"/\\|?*]+/g,
        "-"
      )
      .replace(
        /\s+/g,
        "-"
      )
      .substring(
        0,
        80
      );


  res.setHeader(
    "Content-Type",
    "application/pdf"
  );


  res.setHeader(
    "Content-Disposition",
    `attachment; filename="GrowtechAxon-${safeTitle}-Results.pdf"`
  );


  doc.pipe(res);


  const pageWidth =
    doc.page.width;

  const pageHeight =
    doc.page.height;


  const left = 42;

  const right =
    pageWidth - 42;


  /* ----------------------------------------------------------------------
     Header
  ---------------------------------------------------------------------- */

  doc
    .rect(
      0,
      0,
      pageWidth,
      105
    )
    .fill(COLORS.navyDark);


  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(COLORS.goldLight)
    .text(
      "GROWTECH AXON",
      left,
      28
    );


  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "TEST-WISE STUDENT RESULTS",
      left,
      57
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(COLORS.white)
    .text(
      safe(
        testTitle,
        "Assessment"
      ),
      left,
      76
    );


  /* ----------------------------------------------------------------------
     Table Header
  ---------------------------------------------------------------------- */

  let y = 135;


  doc
    .rect(
      left,
      y,
      right - left,
      30
    )
    .fill(COLORS.navy);


  const columns = [
    {
      title: "#",
      x: 55,
      width: 35
    },

    {
      title: "CANDIDATE",
      x: 90,
      width: 150
    },

    {
      title: "CERTIFICATE ID",
      x: 240,
      width: 165
    },

    {
      title: "SCORE",
      x: 405,
      width: 60
    },

    {
      title: "GRADE",
      x: 465,
      width: 55
    },

    {
      title: "STATUS",
      x: 520,
      width: 65
    },

    {
      title: "DATE",
      x: 585,
      width: 75
    }
  ];


  columns.forEach(
    column => {

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(COLORS.goldLight)
        .text(
          column.title,
          column.x,
          y + 10,
          {
            width: column.width
          }
        );
    }
  );


  y += 30;


  const rows =
    Array.isArray(results)
      ? results
      : [];


  rows.forEach(
    (result, index) => {

      /* New page */

      if (y > pageHeight - 70) {

        doc.addPage();

        y = 45;

        doc
          .rect(
            0,
            0,
            pageWidth,
            50
          )
          .fill(
            COLORS.navyDark
          );


        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(
            COLORS.goldLight
          )
          .text(
            "GROWTECH AXON • CONTINUED",
            left,
            18
          );

        y = 75;
      }


      const percentage =
        Number(
          result.percentage || 0
        );


      /* Alternating background */

      if (index % 2 === 0) {

        doc
          .rect(
            left,
            y,
            right - left,
            36
          )
          .fill(
            "#F4F6F9"
          );

      } else {

        doc
          .rect(
            left,
            y,
            right - left,
            36
          )
          .fill(
            "#FFFFFF"
          );
      }


      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#20252D")
        .text(
          String(index + 1),
          55,
          y + 12,
          {
            width: 35
          }
        );


      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#20252D")
        .text(
          safe(
            result.candidateName,
            "Candidate"
          ),
          90,
          y + 8,
          {
            width: 145,
            ellipsis: true
          }
        );


      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#4A505A")
        .text(
          safe(
            result.certificateId,
            "N/A"
          ),
          240,
          y + 12,
          {
            width: 160,
            ellipsis: true
          }
        );


      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#20252D")
        .text(
          formatPercentage(
            percentage
          ),
          405,
          y + 11,
          {
            width: 55
          }
        );


      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.navy)
        .text(
          safe(
            result.grade,
            gradeFromPercentage(
              percentage
            )
          ),
          465,
          y + 11,
          {
            width: 50
          }
        );


      const passed =
        result.passed === true ||
        String(
          result.status || ""
        ).toLowerCase() ===
          "passed";


      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(
          passed
            ? "#16834B"
            : "#B42318"
        )
        .text(
          passed
            ? "PASSED"
            : "FAILED",
          520,
          y + 12,
          {
            width: 60
          }
        );


      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#4A505A")
        .text(
          formatDate(
            result.submittedAt
          ),
          585,
          y + 12,
          {
            width: 75
          }
        );


      y += 36;
    }
  );


  /* ----------------------------------------------------------------------
     Empty state
  ---------------------------------------------------------------------- */

  if (rows.length === 0) {

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#555")
      .text(
        "No results available.",
        left,
        y + 25
      );
  }


  /* ----------------------------------------------------------------------
     Footer
  ---------------------------------------------------------------------- */

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.muted2)
    .text(
      `Generated: ${formatDateTime(
        new Date()
      )}`,
      left,
      pageHeight - 30
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(COLORS.goldDark)
    .text(
      "GROWTECH AXON • OFFICIAL RECORD",
      right - 180,
      pageHeight - 30,
      {
        width: 180,
        align: "right"
      }
    );


  doc.end();
}


/* ========================================================================
   PREMIUM CERTIFICATE
======================================================================== */


/* ------------------------------------------------------------------------
   Certificate background
------------------------------------------------------------------------ */

function drawCertificateBackground(doc) {

  const w = doc.page.width;
  const h = doc.page.height;


  doc
    .rect(
      0,
      0,
      w,
      h
    )
    .fill(
      COLORS.midnight
    );


  /* Subtle central panel */

  doc
    .roundedRect(
      24,
      24,
      w - 48,
      h - 48,
      8
    )
    .fill(
      COLORS.midnight2
    );


  /* Soft inner panel */

  doc
    .roundedRect(
      40,
      40,
      w - 80,
      h - 80,
      6
    )
    .fill(
      COLORS.midnight
    );
}


/* ------------------------------------------------------------------------
   Subtle geometric texture
------------------------------------------------------------------------ */

function drawBackgroundTexture(doc) {

  const w = doc.page.width;
  const h = doc.page.height;


  doc.save();


  doc
    .lineWidth(0.35)
    .strokeOpacity(0.055)
    .stroke(
      COLORS.softGold
    );


  for (
    let x = -h;
    x < w + h;
    x += 42
  ) {

    doc
      .moveTo(x, 0)
      .lineTo(
        x + h,
        h
      )
      .stroke();
  }


  for (
    let x = 0;
    x < w;
    x += 84
  ) {

    doc
      .circle(
        x,
        70,
        1.5
      )
      .fillOpacity(0.08)
      .fill(
        COLORS.softGold
      );
  }


  doc.restore();
}


/* ------------------------------------------------------------------------
   Premium borders
------------------------------------------------------------------------ */

function drawPremiumBorder(doc) {

  const w = doc.page.width;
  const h = doc.page.height;


  doc
    .rect(
      18,
      18,
      w - 36,
      h - 36
    )
    .lineWidth(1.4)
    .stroke(
      COLORS.champagne
    );


  doc
    .rect(
      27,
      27,
      w - 54,
      h - 54
    )
    .lineWidth(0.45)
    .stroke(
      COLORS.certDarkGold
    );


  doc
    .rect(
      36,
      36,
      w - 72,
      h - 72
    )
    .lineWidth(0.35)
    .strokeOpacity(0.45)
    .stroke(
      COLORS.champagne
    );
}


/* ------------------------------------------------------------------------
   Corner decorations
------------------------------------------------------------------------ */

function drawCornerDecoration(doc) {

  const w = doc.page.width;
  const h = doc.page.height;

  const size = 48;


  function corner(x, y, sx, sy) {

    doc.save();

    doc
      .lineWidth(1)
      .stroke(
        COLORS.champagne
      );


    doc
      .moveTo(
        x,
        y + sy * size
      )
      .lineTo(
        x,
        y
      )
      .lineTo(
        x + sx * size,
        y
      )
      .stroke();


    doc
      .lineWidth(0.5)
      .stroke(
        COLORS.softGold
      );


    doc
      .moveTo(
        x + sx * 8,
        y + sy * 8
      )
      .lineTo(
        x + sx * 8,
        y + sy * 36
      )
      .lineTo(
        x + sx * 36,
        y + sy * 8
      )
      .stroke();


    doc.restore();
  }


  corner(
    30,
    30,
    1,
    1
  );

  corner(
    w - 30,
    30,
    -1,
    1
  );

  corner(
    30,
    h - 30,
    1,
    -1
  );

  corner(
    w - 30,
    h - 30,
    -1,
    -1
  );
}


/* ------------------------------------------------------------------------
   Brand
------------------------------------------------------------------------ */

function drawCertificateBrand(doc) {

  const w = doc.page.width;


  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "GROWTECH",
      58,
      48
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(
      COLORS.softGold
    )
    .text(
      "AXON",
      146,
      48
    );


  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(
      COLORS.silver
    )
    .text(
      "DIGITAL SOLUTIONS • TECHNOLOGY • GROWTH",
      58,
      68,
      {
        characterSpacing: 0.8
      }
    );


  /* Small gold mark */

  doc
    .save()
    .lineWidth(1)
    .stroke(
      COLORS.champagne
    );


  doc
    .moveTo(58, 88)
    .lineTo(83, 88)
    .lineTo(70, 75)
    .closePath()
    .stroke();


  doc.restore();


  /* Certificate ID top right */

  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "CERTIFICATE ID",
      w - 205,
      50,
      {
        width: 145,
        align: "right",
        characterSpacing: 1
      }
    );
}


/* ------------------------------------------------------------------------
   Title
------------------------------------------------------------------------ */

function drawCertificateTitle(doc) {

  const w = doc.page.width;


  doc
    .font("Helvetica-Bold")
    .fontSize(31)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "CERTIFICATE OF",
      70,
      111,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1.2
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(31)
    .fillColor(
      COLORS.softGold
    )
    .text(
      "ACHIEVEMENT",
      70,
      145,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1.5
      }
    );


  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(
      COLORS.silver
    )
    .text(
      "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
      70,
      187,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1.4
      }
    );


  doc
    .moveTo(
      300,
      204
    )
    .lineTo(
      w - 300,
      204
    )
    .lineWidth(0.7)
    .stroke(
      COLORS.champagne
    );
}


/* ------------------------------------------------------------------------
   Recipient
------------------------------------------------------------------------ */

function drawCertificateRecipient(
  doc,
  certificate
) {

  const w = doc.page.width;


  const candidate =
    safe(
      certificate.candidateName,
      "Candidate"
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor(
      COLORS.ivory
    )
    .text(
      candidate,
      70,
      218,
      {
        width: w - 140,
        align: "center"
      }
    );


  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(
      COLORS.silver
    )
    .text(
      "FOR SUCCESSFULLY COMPLETING THE ASSESSMENT",
      70,
      255,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(
      COLORS.softGold
    )
    .text(
      safe(
        certificate.testTitle,
        "Assessment"
      ),
      70,
      273,
      {
        width: w - 140,
        align: "center"
      }
    );


  doc
    .moveTo(
      245,
      300
    )
    .lineTo(
      w - 245,
      300
    )
    .lineWidth(0.5)
    .stroke(
      COLORS.certDarkGold
    );
}


/* ------------------------------------------------------------------------
   Score / grade
------------------------------------------------------------------------ */

function drawCertificateAchievement(
  doc,
  certificate
) {

  const w = doc.page.width;


  const percentage =
    Number(
      certificate.percentage || 0
    );


  const grade =
    safe(
      certificate.grade,
      gradeFromPercentage(
        percentage
      )
    );


  const y = 316;


  /* Score */

  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "SCORE",
      95,
      y
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(
      COLORS.softGold
    )
    .text(
      formatPercentage(
        percentage
      ),
      95,
      y + 11
    );


  /* Grade */

  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "GRADE",
      190,
      y
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(
      COLORS.ivory
    )
    .text(
      grade,
      190,
      y + 11
    );


  /* Center status */

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "LEARN • IMPROVE • GROW",
      300,
      y + 13,
      {
        width: 240,
        align: "center",
        characterSpacing: 1
      }
    );


  /* Status */

  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "STATUS",
      550,
      y
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(
      COLORS.green
    )
    .text(
      safe(
        certificate.status,
        "valid"
      ).toUpperCase(),
      550,
      y + 13
    );
}


/* ------------------------------------------------------------------------
   Signature assets
------------------------------------------------------------------------ */

/*
   Put these two PNG files here:

   public/assets/ram-signature.png
   public/assets/aryan-signature.png

   Recommended PNG: transparent background, signature only.
*/

const RAM_SIGNATURE_PATH = path.join(
  __dirname,
  "../../public/assets/ram-signature.png"
);

const ARYAN_SIGNATURE_PATH = path.join(
  __dirname,
  "../../public/assets/aryan-signature.png"
);


function drawSignatureImage(
  doc,
  filePath,
  x,
  y,
  width,
  height
) {

  if (!fs.existsSync(filePath)) {
    return false;
  }

  doc.image(
    filePath,
    x,
    y,
    {
      fit: [
        width,
        height
      ],
      align: "center",
      valign: "center"
    }
  );

  return true;
}


function getSignaturePath(fileName) {

  return path.join(
    __dirname,
    "../../public/assets",
    fileName
  );
}


/* ------------------------------------------------------------------------
   RAM SIGNATURE
------------------------------------------------------------------------ */

function drawRamSignature(
  doc,
  x,
  y
) {

  const signaturePath =
    getSignaturePath(
      "ram-signature.png"
    );


  if (
    fs.existsSync(
      signaturePath
    )
  ) {

    doc.image(
      signaturePath,
      x,
      y,
      {
        fit: [
          115,
          38
        ],
        align: "center",
        valign: "center"
      }
    );

    return;
  }


  /* Fallback */

  doc
    .font("Times-Italic")
    .fontSize(22)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "RAM",
      x,
      y + 5,
      {
        width: 115,
        align: "center"
      }
    );
}


/* ------------------------------------------------------------------------
   ARYAN SIGNATURE
------------------------------------------------------------------------ */

function drawAryanSignature(
  doc,
  x,
  y
) {

  const signaturePath =
    getSignaturePath(
      "aryan-signature.png"
    );


  if (
    fs.existsSync(
      signaturePath
    )
  ) {

    doc.image(
      signaturePath,
      x,
      y,
      {
        fit: [
          115,
          38
        ],
        align: "center",
        valign: "center"
      }
    );

    return;
  }


  /* Fallback */

  doc
    .font("Times-Italic")
    .fontSize(22)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "SATYA NISHAD",
      x,
      y + 5,
      {
        width: 115,
        align: "center"
      }
    );
}


/* ------------------------------------------------------------------------
   Single founder signature section
------------------------------------------------------------------------ */

function drawCertificateSignatures(doc, certificate) {
  const y = 420;
  const centerX = 300;
  const signaturePath = getSignaturePath("ram-signature.png");

  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, centerX + 60, y, {
      fit: [120, 38],
      align: "center",
      valign: "center"
    });
  } else {
    doc.font("Times-Italic")
      .fontSize(19)
      .fillColor(COLORS.ivory)
      .text("Rambharosa Prasad", centerX + 35, y + 6, {
        width: 170,
        align: "center"
      });
  }

  doc.font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.ivory)
    .text("RAMBHAROSA PRASAD", centerX, y + 40, {
      width: 240,
      align: "center"
    });

  doc.font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.silver)
    .text("FOUNDER • GROWTECH AXON", centerX, y + 53, {
      width: 240,
      align: "center",
      characterSpacing: 0.7
    });

  doc.moveTo(centerX + 20, y + 68)
    .lineTo(centerX + 220, y + 68)
    .lineWidth(0.6)
    .stroke(COLORS.certDarkGold);
}


/* ------------------------------------------------------------------------
   Official Growtech Axon seal
------------------------------------------------------------------------ */

function drawOfficialSeal(doc) {
  const sealPath = path.join(
    __dirname,
    "../../public/assets/growtech-axon-seal.png"
  );

  // Exactly one company seal is placed on each certificate.
  if (fs.existsSync(sealPath)) {
    doc.image(sealPath, 635, 414, {
      fit: [100, 100],
      align: "center",
      valign: "center"
    });
  }
}


/* ------------------------------------------------------------------------
   Certificate meta
------------------------------------------------------------------------ */

function drawCertificateMeta(
  doc,
  certificate
) {

  const w = doc.page.width;


  const date =
    formatDate(
      certificate.issueDate ||
      certificate.createdAt ||
      new Date()
    );


  const certificateId =
    safe(
      certificate.certificateId,
      certificate._id ||
        "CERTIFICATE"
    );


  doc
    .font("Helvetica")
    .fontSize(5.8)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "DATE OF ISSUE",
      285,
      500,
      {
        width: 90,
        align: "center",
        characterSpacing: 0.8
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(
      COLORS.ivory
    )
    .text(
      date,
      255,
      512,
      {
        width: 150,
        align: "center"
      }
    );


  doc
    .font("Helvetica")
    .fontSize(5.8)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "CERTIFICATE ID",
      w - 245,
      500,
      {
        width: 175,
        align: "right",
        characterSpacing: 0.8
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(
      COLORS.ivory
    )
    .text(
      certificateId,
      w - 245,
      512,
      {
        width: 175,
        align: "right"
      }
    );
}


/* ------------------------------------------------------------------------
   Certificate footer
------------------------------------------------------------------------ */

function drawCertificateFooter(
  doc
) {

  const w = doc.page.width;
  const h = doc.page.height;


  doc
    .moveTo(
      95,
      h - 47
    )
    .lineTo(
      w - 95,
      h - 47
    )
    .lineWidth(0.5)
    .stroke(
      COLORS.certDarkGold
    );


  doc
    .font("Helvetica")
    .fontSize(5.5)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "This certificate can be verified through the official Growtech Axon verification portal.",
      70,
      h - 37,
      {
        width: w - 140,
        align: "center"
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(5.5)
    .fillColor(
      COLORS.silver
    )
    .text(
      "SKILLS TODAY, SUCCESS TOMORROW",
      70,
      h - 25,
      {
        width: w - 140,
        align: "center",
        characterSpacing: 1
      }
    );
}


/* ------------------------------------------------------------------------
   Certificate PDF
------------------------------------------------------------------------ */

function buildCertificatePdf(certificate, res) {
  const certificateId = safe(certificate.certificateId, certificate._id || "certificate");
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,
    info: {
      Title: `Growtech Axon - Certificate of Completion - ${certificateId}`,
      Author: "Growtech Axon",
      Subject: "Company-issued course/assessment completion certificate",
      Keywords: "Growtech Axon, Certificate, Verification"
    }
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="GrowtechAxon-Certificate-${certificateId}.pdf"`);
  doc.pipe(res);

  const w = doc.page.width;
  const h = doc.page.height;
  const navy = "#071D3B";
  const navy2 = "#0A2A50";
  const gold = "#D6A332";
  const paleGold = "#EBD59A";
  const ink = "#0B2345";
  const muted = "#52637A";
  const assets = path.join(__dirname, "../../public/assets");
  const logoPath = path.join(assets, "growtech-axon-circular-logo.png");
  const sealPath = path.join(assets, "growtech-axon-seal.png");
  const signaturePath = path.join(assets, "ram-signature-transparent.png");

  // Premium white / navy / gold certificate with softly rounded double frame.
  doc.rect(0, 0, w, h).fill("#FFFEFA");
  doc.save().lineWidth(1.4).strokeColor(gold).roundedRect(8, 8, w - 16, h - 16, 10).stroke();
  doc.lineWidth(0.65).strokeColor("#D8C28A").roundedRect(15, 15, w - 30, h - 30, 7).stroke().restore();

  // Navy upper-left brand panel; circular GA logo sits inside it.
  doc.save();
  doc.moveTo(8, 8).lineTo(232, 8).lineTo(164, 104).lineTo(8, 145).closePath().fill(navy);
  doc.moveTo(8, 8).lineTo(232, 8).lineTo(218, 26).lineTo(8, 83).closePath().fill(navy2);
  doc.moveTo(8, 145).lineTo(164, 104).lineWidth(4).strokeColor(gold).stroke();
  doc.restore();

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 29, 18, { fit: [76, 76], align: "center", valign: "center" });
  } else if (fs.existsSync(path.join(assets, "growtechaxon-logo.png"))) {
    doc.image(path.join(assets, "growtechaxon-logo.png"), 27, 20, { fit: [78, 68], align: "center", valign: "center" });
  }
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#FFFFFF").text("GROWTECH AXON", 18, 96, { width: 145, align: "center", characterSpacing: 0.4 });
  doc.font("Helvetica").fontSize(5.6).fillColor("#FFFFFF").text("Digital Technology • Learning • Innovation", 16, 110, { width: 150, align: "center" });

  // Certificate ID and QR code are real certificate-specific verification data.
  doc.font("Helvetica-Bold").fontSize(8).fillColor(navy).text("CERTIFICATE ID", w - 230, 26, { width: 130, align: "right", characterSpacing: 0.5 });
  doc.font("Helvetica").fontSize(8.2).fillColor(ink).text(certificateId, w - 230, 40, { width: 130, align: "right" });
  doc.font("Helvetica-Bold").fontSize(7.6).fillColor(navy).text("ISSUE DATE", w - 230, 56, { width: 130, align: "right", characterSpacing: 0.4 });
  doc.font("Helvetica").fontSize(8.2).fillColor(ink).text(formatDate(certificate.issueDate || certificate.createdAt || new Date()), w - 230, 68, { width: 130, align: "right" });
  const verifyBase = (process.env.PUBLIC_BASE_URL || "https://growtechaxon.in").replace(/\/+$/, "");
  const verifyUrl = `${verifyBase}/verify.html?cid=${encodeURIComponent(certificateId)}`;
  try {
    const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: "M" });
    const qrSize = 48;
    const qrX = w - 76;
    const qrY = 24;
    const moduleCount = qr.modules.size;
    const cell = qrSize / moduleCount;
    doc.save().fillColor("#FFFFFF").roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4).fill();
    doc.lineWidth(1).strokeColor(gold).roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4).stroke();
    doc.fillColor("#000000");
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) doc.rect(qrX + c * cell, qrY + r * cell, cell + 0.1, cell + 0.1).fill();
      }
    }
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(6.1).fillColor(navy).text("SCAN TO VERIFY", qrX - 8, qrY + qrSize + 5, { width: qrSize + 16, align: "center" });
  } catch (e) {
    doc.font("Helvetica").fontSize(6.3).fillColor(muted).text("Verify at growtechaxon.in/verify.html", w - 190, 72, { width: 130, align: "center" });
  }

  // Reference-style title, name, course and supporting line.
  doc.font("Times-Bold").fontSize(22).fillColor(navy).text("CERTIFICATE OF", 185, 43, { width: w - 280, align: "center", characterSpacing: 1.3 });
  doc.font("Times-Bold").fontSize(39).fillColor(navy).text("COMPLETION", 180, 64, { width: w - 270, align: "center", characterSpacing: 0.7 });
  const lineY = 112;
  doc.moveTo(270, lineY).lineTo(388, lineY).lineWidth(0.9).strokeColor(gold).stroke();
  doc.moveTo(455, lineY).lineTo(573, lineY).lineWidth(0.9).strokeColor(gold).stroke();
  doc.save().fillColor(gold).moveTo(431, lineY - 5).lineTo(436, lineY).lineTo(431, lineY + 5).lineTo(426, lineY).closePath().fill().restore();
  doc.font("Helvetica").fontSize(8.7).fillColor(navy2).text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 70, 126, { width: w - 140, align: "center", characterSpacing: 1.4 });

  const candidateName = safe(certificate.candidateName, "Student Name");
  doc.font("Times-Italic").fontSize(candidateName.length > 34 ? 22 : 29).fillColor(navy).text(candidateName, 75, 148, { width: w - 150, align: "center", ellipsis: true });
  doc.moveTo(222, 186).lineTo(620, 186).lineWidth(0.8).strokeColor(gold).stroke();
  doc.save().fillColor(gold).moveTo(421, 181).lineTo(426, 186).lineTo(421, 191).lineTo(416, 186).closePath().fill().restore();
  doc.font("Helvetica").fontSize(9).fillColor(navy2).text("has successfully completed the", 70, 196, { width: w - 140, align: "center" });
  const testTitle = safe(certificate.testTitle, "Course / Assessment");
  doc.font("Times-Bold").fontSize(testTitle.length > 48 ? 15 : 19).fillColor(navy).text(testTitle, 65, 214, { width: w - 130, align: "center", ellipsis: true });
  doc.font("Helvetica").fontSize(8.4).fillColor(ink).text("organized by Growtech Axon, in recognition of dedication, effort and commitment to learning.", 90, 240, { width: w - 180, align: "center" });

  // Four compact information groups matching the supplied reference layout.
  const grade = safe(certificate.grade, gradeFromPercentage(Number(certificate.percentage || 0)));
  const duration = safe(certificate.courseDuration || certificate.duration, "As per course record");
  const mode = safe(certificate.mode, "Online Assessment");
  const skills = safe(certificate.skillsCovered, "As per course syllabus");
  const infoY = 278;
  const items = [
    { x: 92, w: 150, label: "COURSE DURATION", value: duration },
    { x: 278, w: 105, label: "MODE", value: mode },
    { x: 418, w: 190, label: "KEY SKILLS COVERED", value: skills },
    { x: 645, w: 105, label: "GRADE", value: grade }
  ];
  // Small navy circular icon badges with gold outline; one symbol per info group.
  const symbols = ["C", "ON", "</>", "A+"];
  items.forEach((item, i) => {
    const cx = item.x - 19;
    const cy = infoY + 17;
    doc.save().fillColor(navy).circle(cx, cy, 17).fill();
    doc.lineWidth(1).strokeColor(gold).circle(cx, cy, 17).stroke();
    doc.font("Helvetica-Bold").fontSize(i === 2 ? 8 : 12).fillColor(paleGold).text(symbols[i], cx - 13, cy - 5, { width: 26, align: "center" });
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor(navy).text(item.label, item.x, infoY, { width: item.w, align: "left", characterSpacing: 0.2 });
    doc.font("Helvetica").fontSize(i === 2 ? 7.1 : 8.2).fillColor(ink).text(item.value, item.x, infoY + 14, { width: item.w, height: 32, align: "left", ellipsis: true, lineBreak: true });
    if (i < items.length - 1) {
      const dividerX = item.x + item.w + 9;
      doc.moveTo(dividerX, infoY - 2).lineTo(dividerX, infoY + 39).lineWidth(0.7).strokeColor(gold).stroke();
    }
  });

  doc.font("Times-Italic").fontSize(12).fillColor(navy).text("We wish you a bright future in your tech journey!", 90, 342, { width: w - 180, align: "center" });

  // Exactly one Founder signature and one company seal.
  const founderX = 110;
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, founderX + 6, 388, { fit: [138, 32], align: "center", valign: "center" });
  } else {
    doc.font("Times-Italic").fontSize(16).fillColor(navy).text("Rambharosa Prasad", founderX, 391, { width: 150, align: "center" });
  }
  doc.moveTo(founderX, 422).lineTo(founderX + 160, 422).lineWidth(0.7).strokeColor(gold).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(navy).text("RAMBHAROSA PRASAD", founderX - 10, 428, { width: 180, align: "center", characterSpacing: 0.4 });
  doc.font("Helvetica").fontSize(7).fillColor(muted).text("FOUNDER", founderX - 10, 440, { width: 180, align: "center", characterSpacing: 0.7 });

  if (fs.existsSync(sealPath)) {
    doc.image(sealPath, 565, 397, { fit: [78, 78], align: "center", valign: "center" });
  }

  doc.moveTo(42, 477).lineTo(w - 42, 477).lineWidth(0.8).strokeColor(gold).stroke();
  doc.font("Helvetica").fontSize(6.7).fillColor(muted).text("This certificate can be verified through the Growtech Axon certificate verification portal.", 55, 486, { width: w - 110, align: "center" });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(navy).text("www.growtechaxon.in", 55, 499, { width: w - 110, align: "center", characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(7).fillColor(navy).text("LEARN • BUILD • GROW", 55, 512, { width: w - 110, align: "center", characterSpacing: 1.2 });
  doc.end();
}

/* ========================================================================
   EXPORTS
======================================================================== */

/*
|--------------------------------------------------------------------------
| VERY IMPORTANT
|--------------------------------------------------------------------------
| adminRoutes.js expects these exact names.
|--------------------------------------------------------------------------
*/

module.exports = {
  buildResultPdf,
  buildTestResultsPdf,
  buildCertificatePdf,
  gradeFromPercentage
};