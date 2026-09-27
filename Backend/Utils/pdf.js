"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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
   Signature section
------------------------------------------------------------------------ */

function drawCertificateSignatures(
  doc,
  certificate
) {

  const y = 425;


  /* ================================================================
     LEFT SIGNATURE - RAM
  ================================================================= */

  drawRamSignature(
    doc,
    112,
    y
  );


  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "RAM BHAROSA PRASAD",
      95,
      y + 42,
      {
        width: 150,
        align: "center"
      }
    );


  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(
      COLORS.silver
    )
    .text(
      "FOUNDER",
      95,
      y + 54,
      {
        width: 150,
        align: "center",
        characterSpacing: 1
      }
    );


  doc
    .moveTo(
      95,
      y + 69
    )
    .lineTo(
      245,
      y + 69
    )
    .lineWidth(0.5)
    .stroke(
      COLORS.certDarkGold
    );


  /* ================================================================
     RIGHT SIGNATURE - ARYAN
  ================================================================= */

  drawAryanSignature(
    doc,
    595,
    y
  );


  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "SATYA NISHAD",
      580,
      y + 42,
      {
        width: 145,
        align: "center"
      }
    );


  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(
      COLORS.silver
    )
    .text(
      "PROGRAM MANAGER",
      580,
      y + 54,
      {
        width: 145,
        align: "center",
        characterSpacing: 0.8
      }
    );


  doc
    .moveTo(
      580,
      y + 69
    )
    .lineTo(
      725,
      y + 69
    )
    .lineWidth(0.5)
    .stroke(
      COLORS.certDarkGold
    );


  /* ================================================================
     CENTER LABEL
  ================================================================= */

  doc
    .font("Helvetica")
    .fontSize(5.5)
    .fillColor(
      COLORS.certMuted
    )
    .text(
      "AUTHORIZED SIGNATORIES",
      300,
      y + 58,
      {
        width: 240,
        align: "center",
        characterSpacing: 1
      }
    );
}


/* ------------------------------------------------------------------------
   Official Growtech Axon seal
------------------------------------------------------------------------ */

function drawOfficialSeal(
  doc
) {

  const x = 421;
  const y = 465;


  doc.save();


  doc
    .circle(
      x,
      y,
      34
    )
    .lineWidth(1)
    .stroke(
      COLORS.champagne
    );


  doc
    .circle(
      x,
      y,
      28
    )
    .lineWidth(0.6)
    .stroke(
      COLORS.certDarkGold
    );


  /* GA center */

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(
      COLORS.softGold
    )
    .text(
      "GA",
      x - 16,
      y - 9,
      {
        width: 32,
        align: "center"
      }
    );


  doc
    .font("Helvetica-Bold")
    .fontSize(4.5)
    .fillColor(
      COLORS.ivory
    )
    .text(
      "GROWTECH",
      x - 25,
      y + 7,
      {
        width: 50,
        align: "center",
        characterSpacing: 0.6
      }
    );


  doc
    .font("Helvetica")
    .fontSize(4)
    .fillColor(
      COLORS.silver
    )
    .text(
      "AXON • OFFICIAL",
      x - 25,
      y + 14,
      {
        width: 50,
        align: "center",
        characterSpacing: 0.4
      }
    );


  /* Small dots */

  for (
    let i = 0;
    i < 8;
    i++
  ) {

    const angle =
      (Math.PI * 2 * i) /
      8;

    const dx =
      x +
      Math.cos(angle) *
        22;

    const dy =
      y +
      Math.sin(angle) *
        22;


    doc
      .circle(
        dx,
        dy,
        1
      )
      .fill(
        COLORS.champagne
      );
  }


  doc.restore();
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

function buildCertificatePdf(
  certificate,
  res
) {

  const certificateId =
    safe(
      certificate.certificateId,
      certificate._id ||
        "certificate"
    );


  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,

    info: {
      Title:
        `Growtech Axon Certificate - ${certificateId}`,

      Author:
        "Growtech Axon",

      Subject:
        "Certificate of Achievement",

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


  /* Premium certificate */

  drawCertificateBackground(doc);

  drawBackgroundTexture(doc);

  drawPremiumBorder(doc);

  drawCornerDecoration(doc);

  drawCertificateBrand(doc);

  drawCertificateTitle(doc);

  drawCertificateRecipient(
    doc,
    certificate
  );

  drawCertificateAchievement(
    doc,
    certificate
  );

  drawCertificateSignatures(
    doc,
    certificate
  );

  drawOfficialSeal(doc);

  drawCertificateMeta(
    doc,
    certificate
  );

  drawCertificateFooter(doc);


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