const express = require("express");

const Certificate = require("../Models/Certificate");
const TestResult = require("../Models/TestResult");
const Test = require("../Models/Test");

const { buildCertificatePdf } = require("../Utils/pdf");

const router = express.Router();


// =====================================================
// HELPER
// Resolve answer index safely
//
// Exam system:
// 0 = A
// 1 = B
// 2 = C
// 3 = D
//
// Also supports:
// A / B / C / D
// "0" / "1" / "2" / "3"
// =====================================================

function resolveAnswerIndex(value, options) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }


  const optionList =
    Array.isArray(options)
      ? options
      : [];


  /*
   * Explicit unanswered value.
   *
   * Submission system uses:
   *
   * -1 = unanswered
   */

  if (
    typeof value === "number" &&
    value === -1
  ) {
    return null;
  }


  const raw =
    String(value).trim();


  if (!raw) {
    return null;
  }


  /*
   * Explicit string "-1"
   */

  if (raw === "-1") {
    return null;
  }


  /*
   * Numeric index.
   *
   * 0 -> A
   * 1 -> B
   * 2 -> C
   * 3 -> D
   */

  if (/^\d+$/.test(raw)) {

    const index =
      Number(raw);

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < optionList.length
    ) {
      return index;
    }

    return null;
  }


  /*
   * Letter format.
   *
   * A -> 0
   * B -> 1
   * C -> 2
   * D -> 3
   */

  const letter =
    raw.toUpperCase();


  if (/^[A-Z]$/.test(letter)) {

    const index =
      letter.charCodeAt(0) - 65;

    if (
      index >= 0 &&
      index < optionList.length
    ) {
      return index;
    }
  }


  return null;
}



// =====================================================
// STUDENT RESULT + QUESTION CHECK
//
// GET:
// /api/results/check?resultId=...&email=...
//
// Returns:
// - result summary
// - every question
// - original options
// - student's selected option
// - correct option
// - correct/wrong status
// =====================================================

router.get(
  "/results/check",
  async (req, res) => {

    try {

      const {
        resultId,
        email
      } = req.query;


      // =================================================
      // VALIDATE REQUEST
      // =================================================

      if (
        !resultId ||
        !email
      ) {

        return res.status(400).json({

          valid: false,

          message:
            "Student/Result ID and registered email are required."

        });

      }


      const cleanResultId =
        String(resultId)
          .trim();


      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();


      // =================================================
      // FIND RESULT
      // =================================================

      const result =
        await TestResult.findOne({

          resultId:
            cleanResultId,

          email:
            cleanEmail

        }).lean();


      if (!result) {

        return res.status(404).json({

          valid: false,

          message:
            "Student/Result ID and email do not match."

        });

      }


      // =================================================
      // FIND ORIGINAL TEST
      // =================================================

      const test =
        await Test.findById(
          result.testId
        ).lean();


      if (!test) {

        return res.status(404).json({

          valid: false,

          message:
            "Original test data not found."

        });

      }


      // =================================================
      // CREATE STUDENT ANSWER MAP
      //
      // Normal/current results:
      //
      // {
      //   questionId: "...",
      //   selected: 2
      // }
      //
      // selected:
      // 0 = A
      // 1 = B
      // 2 = C
      // 3 = D
      // -1 = unanswered
      // =================================================

      const answerMap =
        new Map();


      const savedAnswers =
        Array.isArray(result.answers)
          ? result.answers
          : [];


      savedAnswers.forEach(
        (answer) => {

          if (
            !answer ||
            answer.questionId === undefined ||
            answer.questionId === null
          ) {
            return;
          }


          answerMap.set(

            String(
              answer.questionId
            ),

            answer.selected

          );

        }
      );



      // =================================================
      // BUILD QUESTION REVIEW
      // =================================================

      const questions =
        (test.questions || [])
          .map(
            (q, index) => {


              // =========================================
              // QUESTION ID
              // =========================================

              const questionId =
                String(q._id);



              // =========================================
              // ORIGINAL OPTIONS
              // =========================================

              const options =
                Array.isArray(q.options)

                  ? q.options.map(
                      option =>
                        String(option)
                    )

                  : [];



              // =========================================
              // FIND STUDENT ANSWER
              //
              // STEP 1:
              // Try exact questionId match.
              //
              // STEP 2:
              // If not found, use answer at same index.
              //
              // This protects OLD RESULTS when the
              // test questions were edited/recreated and
              // MongoDB generated new question _ids.
              // =========================================

              let storedSelected =
                null;


              let answerSource =
                "none";


              // -----------------------------------------
              // PRIMARY MATCH: QUESTION ID
              // -----------------------------------------

              if (
                answerMap.has(questionId)
              ) {

                storedSelected =
                  answerMap.get(questionId);

                answerSource =
                  "questionId";

              }


              // -----------------------------------------
              // FALLBACK MATCH: QUESTION INDEX
              // -----------------------------------------

              else if (
                savedAnswers[index] !== undefined
              ) {

                const fallbackAnswer =
                  savedAnswers[index];


                if (
                  fallbackAnswer &&
                  fallbackAnswer.selected !== undefined
                ) {

                  storedSelected =
                    fallbackAnswer.selected;

                  answerSource =
                    "index";

                }

              }



              // =========================================
              // RESOLVE STUDENT ANSWER INDEX
              // =========================================

              const selectedIndex =
                resolveAnswerIndex(
                  storedSelected,
                  options
                );



              // =========================================
              // RESOLVE CORRECT ANSWER INDEX
              // =========================================

              const correctIndex =
                resolveAnswerIndex(
                  q.answer,
                  options
                );



              // =========================================
              // ANSWERED?
              // =========================================

              const isAnswered =
                selectedIndex !== null;



              // =========================================
              // STUDENT ANSWER TEXT
              // =========================================

              let selectedAnswer =
                "Not Answered";


              if (
                isAnswered &&
                options[selectedIndex] !== undefined
              ) {

                selectedAnswer =
                  options[selectedIndex];

              }



              // =========================================
              // CORRECT ANSWER TEXT
              // =========================================

              let correctAnswer =
                "Not Available";


              if (
                correctIndex !== null &&
                options[correctIndex] !== undefined
              ) {

                correctAnswer =
                  options[correctIndex];

              }



              // =========================================
              // CORRECT / WRONG
              // =========================================

              let isCorrect =
                null;


              if (
                isAnswered &&
                correctIndex !== null
              ) {

                isCorrect =
                  selectedIndex ===
                  correctIndex;

              }



              // =========================================
              // RETURN COMPLETE QUESTION
              // =========================================

              return {

                number:
                  index + 1,


                question:
                  String(
                    q.question || ""
                  ),


                /*
                 * Original options exactly as stored
                 * in the Test document.
                 */

                options,


                /*
                 * Student selected option index.
                 *
                 * null = unanswered
                 */

                selectedIndex,


                /*
                 * Compatibility property.
                 */

                selected:
                  selectedIndex,


                /*
                 * Correct option index.
                 */

                correctIndex,


                /*
                 * Actual selected option text.
                 */

                selectedAnswer,


                /*
                 * Actual correct option text.
                 */

                correctAnswer,


                /*
                 * true  = correct
                 * false = wrong
                 * null  = unanswered
                 */

                isCorrect,


                /*
                 * Internal debugging information.
                 *
                 * This can help us identify whether an
                 * answer was matched by ID or fallback index.
                 */

                answerSource

              };

            }
          );



      // =================================================
      // RETURN RESULT
      // =================================================

      return res.json({

        valid: true,


        result: {

          resultId:
            result.resultId,


          candidateName:
            result.candidateName,


          email:
            result.email,


          testTitle:
            result.testTitle,


          totalQuestions:
            Number(
              result.totalQuestions || 0
            ),


          attempted:
            Number(
              result.attempted || 0
            ),


          correct:
            Number(
              result.correct || 0
            ),


          wrong:
            Number(
              result.wrong || 0
            ),


          unanswered:
            Number(
              result.unanswered || 0
            ),


          score:
            Number(
              result.score || 0
            ),


          percentage:
            Number(
              result.percentage || 0
            ),


          passed:
            Boolean(
              result.passed
            ),


          submissionType:
            result.submissionType ||
            "manual",


          submittedAt:
            result.submittedAt,


          certificateId:
            result.certificateId || ""

        },


        questions

      });


    } catch (err) {

      console.error(
        "Student result check error:",
        err
      );


      return res.status(500).json({

        valid: false,

        message:
          "Unable to load result.",

        error:
          err.message

      });

    }

  }
);



// =====================================================
// CERTIFICATE VERIFY
//
// GET:
// /api/certificates/verify
//
// Query:
// certificateId
// email
// =====================================================

router.get(
  "/certificates/verify",
  async (req, res) => {

    try {

      const {
        certificateId,
        email
      } = req.query;


      // =================================================
      // VALIDATE CERTIFICATE ID
      // =================================================

      if (!certificateId) {

        return res.status(400).json({

          valid: false,

          message:
            "Certificate ID is required."

        });

      }


      const cleanCertificateId =
        String(certificateId)
          .trim()
          .toUpperCase();



      // =================================================
      // FIND CERTIFICATE
      // =================================================

      const certificate =
        await Certificate.findOne({

          certificateId:
            cleanCertificateId

        }).lean();



      // =================================================
      // CHECK CERTIFICATE STATUS
      // =================================================

      if (
        !certificate ||
        certificate.status !== "valid"
      ) {

        return res.status(404).json({

          valid: false,

          message:
            "Certificate not found or revoked."

        });

      }



      // =================================================
      // OPTIONAL EMAIL VERIFICATION
      // =================================================

      if (
        email &&
        certificate.email !==
          String(email)
            .trim()
            .toLowerCase()
      ) {

        return res.status(404).json({

          valid: false,

          message:
            "Certificate ID and email do not match."

        });

      }



      // =================================================
      // RETURN CERTIFICATE
      // =================================================

      return res.json({

        valid: true,


        certificate: {

          certificateId:
            certificate.certificateId,


          candidateName:
            certificate.candidateName,


          email:
            certificate.email,


          testTitle:
            certificate.testTitle,


          issueDate:
            certificate.issueDate,


          percentage:
            certificate.percentage,


          grade:
            certificate.grade,


          status:
            certificate.status,


          signatoryName:
            certificate.signatoryName,


          signatoryDesignation:
            certificate.signatoryDesignation,

          programManagerName:
            certificate.programManagerName || "",

          programManagerDesignation:
            certificate.programManagerDesignation || "",

          resultId:
            certificate.resultId || null

        }

      });


    } catch (err) {

      console.error(
        "Certificate verify error:",
        err
      );


      return res.status(500).json({

        valid: false,

        message:
          "Unable to verify certificate.",

        error:
          err.message

      });

    }

  }
);



// =====================================================
// STUDENT CERTIFICATE PDF
//
// GET:
// /api/certificates/:id/pdf?email=...
// =====================================================

router.get(
  "/certificates/:id/pdf",
  async (req, res) => {

    try {

      const id =
        String(
          req.params.id
        )
          .trim()
          .toUpperCase();


      const email =
        req.query.email
          ? String(
              req.query.email
            )
              .trim()
              .toLowerCase()
          : "";



      // =================================================
      // FIND CERTIFICATE
      // =================================================

      const certificate =
        await Certificate.findOne({

          certificateId:
            id

        });



      // =================================================
      // CHECK CERTIFICATE
      // =================================================

      if (
        !certificate ||
        certificate.status !== "valid"
      ) {

        return res.status(404).json({

          message:
            "Certificate not found or revoked."

        });

      }



      // =================================================
      // EMAIL SECURITY CHECK
      // =================================================

      if (
        email &&
        certificate.email !== email
      ) {

        return res.status(403).json({

          message:
            "Email verification failed."

        });

      }



      // =================================================
      // BUILD PDF
      // =================================================

      buildCertificatePdf(
        certificate,
        res
      );


    } catch (err) {

      console.error(
        "Student certificate PDF error:",
        err
      );


      if (!res.headersSent) {

        return res.status(500).json({

          message:
            "Unable to generate certificate PDF.",

          error:
            err.message

        });

      }

    }

  }
);



// =====================================================
// EXPORT
// =====================================================

module.exports = router;