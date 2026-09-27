const express = require("express");
const crypto = require("crypto");

const Test = require("../Models/Test");
const TestResult = require("../Models/TestResult");
const Certificate = require("../Models/Certificate");
const { gradeFromPercentage } = require("../Utils/pdf");
const studentAuth = require("../Middleware/studentAuth");

const router = express.Router();

// =====================================================
// TEMPORARY EXAM SESSIONS
// =====================================================
const sessions = new Map();

// =====================================================
// ID GENERATOR
// =====================================================
function id(prefix) {
  return `${prefix}-${Date.now()
    .toString(36)
    .toUpperCase()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

// =====================================================
// CERTIFICATE ID GENERATOR
// =====================================================
function certificateId() {
  return `GTAX-CERT-${new Date().getFullYear()}-${Date.now()
    .toString(36)
    .toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

// =====================================================
// GET AVAILABLE TESTS
// =====================================================
router.get("/tests", async (req, res) => {
  try {
    const now = new Date();

    const tests = await Test.find({
      active: true,

      $and: [
        {
          $or: [
            {
              startAt: null
            },
            {
              startAt: {
                $lte: now
              }
            }
          ]
        },

        {
          $or: [
            {
              endAt: null
            },
            {
              endAt: {
                $gt: now
              }
            }
          ]
        }
      ]
    })
      .select(
        "title description durationMinutes passingPercentage certificateEnabled questions startAt endAt"
      )
      .sort({
        createdAt: -1
      })
      .limit(1);

    res.json(
      tests.map((t) => ({
        id: t._id,

        title: t.title,

        description:
          t.description,

        durationMinutes:
          t.durationMinutes,

        passingPercentage:
          t.passingPercentage,

        certificateEnabled:
          t.certificateEnabled,

        questionCount:
          t.questions.length,

        startAt:
          t.startAt,

        endAt:
          t.endAt
      }))
    );

  } catch (err) {

    console.error(
      "Get tests error:",
      err
    );

    res.status(500).json({
      message:
        "Unable to load tests.",

      error:
        err.message
    });
  }
});

// =====================================================
// START TEST
// =====================================================
router.post(
  "/tests/start",
  studentAuth,
  async (req, res) => {

    try {

      const {
        testId
      } = req.body;


      if (!testId) {

        return res.status(400).json({
          message:
            "Test ID is required."
        });

      }


      const test =
        await Test.findOne({
          _id: testId,
          active: true
        });


      if (!test) {

        return res.status(404).json({
          message:
            "Test not found or inactive."
        });

      }


      // =================================================
      // CHECK SCHEDULE
      // =================================================

      const now =
        new Date();


      if (
        test.startAt &&
        now < test.startAt
      ) {

        return res.status(403).json({
          message:
            `Test will open at ${test.startAt.toLocaleString(
              "en-IN",
              {
                timeZone:
                  "Asia/Kolkata"
              }
            )}.`
        });

      }


      if (
        test.endAt &&
        now >= test.endAt
      ) {

        return res.status(403).json({
          message:
            "Test is closed."
        });

      }


      // =================================================
      // CREATE SESSION
      // =================================================

      const sessionId =
        crypto.randomBytes(20)
          .toString("hex");


      const startedAt =
        Date.now();


      const durationEnd =
        startedAt +
        Number(
          test.durationMinutes || 15
        ) *
        60 *
        1000;


      let expiresAt =
        durationEnd;


      // Fixed test closing time
      if (test.endAt) {

        expiresAt =
          Math.min(
            durationEnd,
            test.endAt.getTime()
          );

      }


      sessions.set(
        sessionId,
        {

          testId:
            String(test._id),

          studentId:
            String(
              req.student.studentId || ""
            ),

          name:
            String(
              req.student.fullName
            ).trim(),

          email:
            String(
              req.student.email
            )
              .trim()
              .toLowerCase(),

          phone:
            String(
              req.student.mobile || ""
            ).trim(),

          startedAt,

          expiresAt,

          used:
            false

        }
      );


      // =================================================
      // REMOVE EXPIRED SESSION
      // =================================================

      setTimeout(
        () => {

          sessions.delete(
            sessionId
          );

        },

        Math.max(
          60000,
          expiresAt -
            startedAt +
            3600000
        )
      );


      // =================================================
      // RETURN TEST
      // =================================================

      res.json({

        sessionId,

        expiresAt,

        test: {

          id:
            test._id,

          title:
            test.title,

          durationMinutes:
            test.durationMinutes,

          questions:
            test.questions.map(
              (q) => ({

                id:
                  q._id,

                question:
                  q.question,

                options:
                  q.options

              })
            )

        }

      });

    } catch (err) {

      console.error(
        "Start test error:",
        err
      );

      res.status(500).json({

        message:
          "Unable to start the test.",

        error:
          err.message

      });

    }

  }
);

// =====================================================
// SUBMIT TEST
// =====================================================
router.post(
  "/tests/submit",
  async (req, res) => {

    try {

      const {

        sessionId,

        answers = {},

        submissionType =
          "manual",

        violationCount =
          0,

        violations =
          []

      } = req.body;


      // =================================================
      // SESSION VALIDATION
      // =================================================

      if (!sessionId) {

        return res.status(400).json({
          message:
            "Session ID is required."
        });

      }


      const session =
        sessions.get(
          sessionId
        );


      if (
        !session ||
        session.used
      ) {

        return res.status(400).json({
          message:
            "This test session is invalid or already submitted."
        });

      }


      // =================================================
      // GET TEST
      // =================================================

      const test =
        await Test.findById(
          session.testId
        );


      if (!test) {

        return res.status(404).json({
          message:
            "Test not found."
        });

      }


      // =================================================
      // MARK SESSION USED
      // =================================================

      session.used =
        true;


      const now =
        Date.now();


      // =================================================
      // TIMER AUTO SUBMISSION
      // =================================================

      const autoSubmitted =
        now >=
        session.expiresAt;


      // =================================================
      // NORMALIZE ANSWERS
      // =================================================

      const normalized =
        {};


      Object.keys(
        answers || {}
      ).forEach(
        (key) => {

          const numberValue =
            Number(
              answers[key]
            );


          if (
            Number.isInteger(
              numberValue
            )
          ) {

            normalized[
              String(key)
            ] =
              numberValue;

          }

        }
      );


      // =================================================
      // CALCULATE RESULT
      // =================================================

      let correct =
        0;


      let attempted =
        0;


      const answerList =
        test.questions.map(
          (question) => {

            const questionId =
              String(
                question._id
              );


            const selected =
              Object.prototype.hasOwnProperty.call(
                normalized,
                questionId
              )
                ? normalized[
                    questionId
                  ]
                : -1;


            const valid =
              selected >= 0 &&
              selected <
                question.options.length;


            if (valid) {

              attempted++;

            }


            if (
              valid &&
              selected ===
                Number(
                  question.answer
                )
            ) {

              correct++;

            }


            return {

              questionId,

              selected:
                valid
                  ? selected
                  : -1

            };

          }
        );


      // =================================================
      // SCORE
      // =================================================

      const total =
        test.questions.length;


      const wrong =
        attempted -
        correct;


      const unanswered =
        total -
        attempted;


      const percentage =
        total > 0
          ? Math.round(
              (correct /
                total) *
                10000
            ) / 100
          : 0;


      const passed =
        percentage >=
        Number(
          test.passingPercentage ||
            50
        );


      // =================================================
      // ANTI-CHEATING DATA
      // =================================================

      let safeViolationCount =
        Number(
          violationCount
        );


      if (
        !Number.isInteger(
          safeViolationCount
        ) ||
        safeViolationCount < 0
      ) {

        safeViolationCount =
          0;

      }


      // Prevent unreasonable values
      safeViolationCount =
        Math.min(
          safeViolationCount,
          100
        );


      let safeViolations =
        Array.isArray(
          violations
        )
          ? violations
          : [];


      safeViolations =
        safeViolations
          .map(
            (item) => {

              if (
                typeof item ===
                "string"
              ) {

                return item
                  .trim()
                  .slice(
                    0,
                    100
                  );

              }


              if (
                item &&
                typeof item.reason ===
                  "string"
              ) {

                return item.reason
                  .trim()
                  .slice(
                    0,
                    100
                  );

              }


              return null;

            }
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            100
          );


      // =================================================
      // SUBMISSION TYPE
      // =================================================

      const allowedSubmissionTypes =
        [
          "manual",
          "anti_cheating",
          "auto"
        ];


      let finalSubmissionType =
        String(
          submissionType ||
            "manual"
        );


      if (
        !allowedSubmissionTypes.includes(
          finalSubmissionType
        )
      ) {

        finalSubmissionType =
          "manual";

      }


      // Timer expiration has priority.
      if (autoSubmitted) {

        finalSubmissionType =
          "auto";

      }


      // =================================================
      // CREATE RESULT
      // =================================================

      const result =
        new TestResult({

          resultId:
            id("RES"),

          testId:
            test._id,

          testTitle:
            test.title,

          candidateName:
            session.name,

          email:
            session.email,

          phone:
            session.phone,

          totalQuestions:
            total,

          attempted,

          correct,

          wrong,

          unanswered,

          score:
            correct,

          percentage,

          passed,

          answers:
            answerList,

          submissionType:
            finalSubmissionType,

          violationCount:
            safeViolationCount,

          violations:
            safeViolations,

          submittedAt:
            new Date(),

          certificateId:
            null

        });


      // =================================================
      // SAVE RESULT
      // =================================================

      await result.save();


      // =================================================
      // CREATE CERTIFICATE
      // =================================================

      let generatedCertificate =
        null;


      if (
        passed &&
        Boolean(
          test.certificateEnabled
        )
      ) {

        try {

          let newCertificateId =
            certificateId();


          let existing =
            await Certificate.findOne({
              certificateId:
                newCertificateId
            })
              .select("_id");


          while (existing) {

            newCertificateId =
              certificateId();


            existing =
              await Certificate.findOne({
                certificateId:
                  newCertificateId
              })
                .select("_id");

          }


          generatedCertificate =
            new Certificate({

              certificateId:
                newCertificateId,

              resultId:
                result._id,

              candidateName:
                session.name,

              email:
                session.email,

              testTitle:
                test.title,

              percentage,

              grade:
                gradeFromPercentage(
                  percentage
                ),

              issueDate:
                new Date(),

              status:
                "valid",

              signatoryName:
                process.env
                  .CERTIFICATE_FOUNDER_NAME ||
                "RAM BHAROSA PRASAD",

              signatoryDesignation:
                process.env
                  .CERTIFICATE_FOUNDER_DESIGNATION ||
                "FOUNDER",

              programManagerName:
                process.env
                  .CERTIFICATE_PROGRAM_MANAGER_NAME ||
                "ARYAN",

              programManagerDesignation:
                process.env
                  .CERTIFICATE_PROGRAM_MANAGER_DESIGNATION ||
                "PROGRAM MANAGER"

            });


          await generatedCertificate.save();


          // =================================================
          // SAVE CERTIFICATE ID
          // =================================================

          result.certificateId =
            generatedCertificate
              .certificateId;


          await result.save();


          console.log(
            "Certificate generated:",
            generatedCertificate
              .certificateId
          );


        } catch (
          certificateError
        ) {

          console.error(
            "Certificate generation error:",
            certificateError
          );


          generatedCertificate =
            null;

        }

      }


      // =================================================
      // DELETE SESSION
      // =================================================

      sessions.delete(
        sessionId
      );


      // =================================================
      // RESPONSE
      // =================================================

      res.json({

        success:
          true,

        message:
          finalSubmissionType ===
          "anti_cheating"

            ? "Test automatically submitted because exam integrity rules were triggered."

            : "Test submitted successfully.",

        resultId:
          result.resultId,

        certificateGenerated:
          Boolean(
            generatedCertificate
          ),

        certificateId:
          generatedCertificate
            ?.certificateId ||
          null,

        submissionType:
          finalSubmissionType

      });

    } catch (err) {

      console.error(
        "Submit test error:",
        err
      );


      res.status(500).json({

        message:
          "Unable to save test result.",

        error:
          err.message

      });

    }

  }
);

// =====================================================
// EXPORT
// =====================================================
module.exports = router;