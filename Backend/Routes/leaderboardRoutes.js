const express = require("express");

const TestResult = require("../Models/TestResult");
const Test = require("../Models/Test");
const LeaderboardProfile = require("../Models/LeaderboardProfile");
const adminAuth = require("../Middleware/adminAuth");
const { gradeFromPercentage } = require("../Utils/pdf");

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

function normalizeNumber(value, fallback = null) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


/* =========================================================
   DENSE RANKING

   Example:

   100     -> Rank 1
   100     -> Rank 1
   100     -> Rank 1
   98.3    -> Rank 2
   95      -> Rank 3
   91.7    -> Rank 4
   83.3    -> Rank 5
   81.7    -> Rank 6

   IMPORTANT:
   Same percentage = same rank.

   Rank is NOT student count.
========================================================= */

function applyDenseRanking(rows) {
  let previousPercentage = null;
  let rank = 0;

  for (const row of rows) {
    const percentage = Number(
      row.percentage || 0
    );

    if (
      previousPercentage === null ||
      percentage !== previousPercentage
    ) {
      rank += 1;
      previousPercentage = percentage;
    }

    row.autoRank = rank;
  }

  return rows;
}


/* =========================================================
   FIND LATEST C PROGRAMMING TEST

   User requirement:
   Leaderboard should use C Programming assessment,
   not an old HTML/CSS/other assessment.
========================================================= */

async function getLatestCProgrammingTest() {
  const test = await Test.findOne({
    title: {
      $regex: /c\s*programming/i,
    },
  })
    .sort({
      createdAt: -1,
    })
    .select("_id title createdAt")
    .lean();

  return test;
}


/* =========================================================
   GET C PROGRAMMING LEADERBOARD

   IMPORTANT:
   We do NOT limit the number of students.

   We calculate ALL ranks first.

   Then we return EVERY student whose automatic
   rank is 1, 2, 3, 4 or 5.

   Example:
   Rank 1 has 3 students
   Rank 2 has 1
   Rank 3 has 1
   Rank 4 has 1
   Rank 5 has 1

   Total = 7 students.
========================================================= */

async function getAutomaticTopRows() {
  const latestTest =
    await getLatestCProgrammingTest();

  if (!latestTest) {
    console.warn(
      "Leaderboard: C Programming test not found."
    );

    return [];
  }


  /*
   * Get all PASSED results belonging
   * to the latest C Programming test.
   */
  const results =
    await TestResult.find({
      testId: latestTest._id,
      passed: true,
    })
      .sort({
        percentage: -1,
        score: -1,
        submittedAt: -1,
        createdAt: -1,
      })
      .lean();


  if (!results.length) {
    return [];
  }


  /*
   * Keep best result for each student.
   *
   * IMPORTANT:
   * Prefer candidateName when available.
   *
   * This prevents different students from
   * disappearing just because their email
   * field is missing or duplicated.
   */
  const bestByStudent =
    new Map();


  for (const result of results) {

    const candidateName =
      String(
        result.candidateName || ""
      )
        .trim()
        .toLowerCase();


    const email =
      String(
        result.email || ""
      )
        .trim()
        .toLowerCase();


    /*
     * Student identity:
     *
     * candidate name first.
     * email only when name unavailable.
     */
    const studentKey =
      candidateName ||
      email ||
      String(result._id);


    const existing =
      bestByStudent.get(
        studentKey
      );


    if (!existing) {

      bestByStudent.set(
        studentKey,
        result
      );

      continue;
    }


    const newPercentage =
      Number(
        result.percentage || 0
      );


    const oldPercentage =
      Number(
        existing.percentage || 0
      );


    /*
     * Keep the best percentage.
     */
    if (
      newPercentage >
      oldPercentage
    ) {

      bestByStudent.set(
        studentKey,
        result
      );

      continue;
    }


    /*
     * Same percentage:
     * keep higher score.
     */
    if (
      newPercentage ===
        oldPercentage &&
      Number(result.score || 0) >
        Number(existing.score || 0)
    ) {

      bestByStudent.set(
        studentKey,
        result
      );
    }
  }


  /*
   * Convert database results
   * into leaderboard rows.
   */
  const rows =
    Array.from(
      bestByStudent.entries()
    )
      .map(
        ([studentKey, result]) => {

          const percentage =
            Number(
              result.percentage || 0
            );


          return {

            studentKey,

            resultId:
              result.resultId ||
              String(result._id),

            name:
              result.candidateName ||
              "Student",

            score:
              Number(
                result.score || 0
              ),

            percentage,

            grade:
              result.grade ||
              gradeFromPercentage(
                percentage
              ),

            status:
              result.passed
                ? "PASSED"
                : "FAILED",

            testTitle:
              result.testTitle ||
              latestTest.title ||
              "C Programming Assessment",

            submittedAt:
              result.submittedAt ||
              result.createdAt ||
              null,

            autoRank: null,

            /*
             * Admin profile data
             * will be merged later.
             */
            imageData: "",

            imageMimeType: "",

            updatedByAdmin: false,
          };
        }
      )
      .sort(
        (a, b) => {

          /*
           * Percentage decides ranking.
           */
          if (
            b.percentage !==
            a.percentage
          ) {
            return (
              b.percentage -
              a.percentage
            );
          }


          /*
           * Same percentage:
           * score decides display order.
           *
           * IMPORTANT:
           * score does NOT create a new rank.
           */
          if (
            b.score !==
            a.score
          ) {
            return (
              b.score -
              a.score
            );
          }


          /*
           * Same percentage + same score:
           * name keeps ordering stable.
           */
          return String(
            a.name || ""
          ).localeCompare(
            String(
              b.name || ""
            )
          );
        }
      );


  /*
   * Apply dense ranking.
   */
  applyDenseRanking(rows);


  /*
   * ONLY NOW filter Rank 1-5.
   *
   * No slice.
   *
   * No "first 5 students".
   *
   * No "first 7 students".
   */
  return rows.filter(
    (row) =>
      Number(row.autoRank) >= 1 &&
      Number(row.autoRank) <= 5
  );
}


/* =========================================================
   MERGE ADMIN PROFILE DATA
========================================================= */

async function mergeProfiles(rows) {

  if (!rows.length) {
    return rows;
  }


  const keys =
    rows.map(
      (row) =>
        row.studentKey
    );


  const profiles =
    await LeaderboardProfile.find({
      studentKey: {
        $in: keys,
      },
    }).lean();


  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          profile.studentKey,
          profile,
        ]
      )
    );


  return rows.map(
    (row) => {

      const profile =
        profileMap.get(
          row.studentKey
        );


      /*
       * No admin profile.
       */
      if (!profile) {

        return {
          ...row,

          /*
           * AUTOMATIC rank remains
           * the public rank.
           */
          rank:
            row.autoRank,

          image: null,
        };
      }


      /*
       * Admin may edit display values.
       *
       * Automatic ranking remains
       * based on original result percentage.
       */
      const displayPercentage =
        profile.percentage === null ||
        profile.percentage === undefined
          ? row.percentage
          : Number(
              profile.percentage
            );


      return {

        ...row,

        name:
          profile.name ||
          row.name,

        score:
          profile.score === null ||
          profile.score === undefined
            ? row.score
            : Number(
                profile.score
              ),

        percentage:
          displayPercentage,

        grade:
          profile.grade ||
          row.grade,

        status:
          profile.status ||
          row.status,

        testTitle:
          profile.testTitle ||
          row.testTitle,

        /*
         * VERY IMPORTANT:
         *
         * Public rank is ALWAYS automatic rank.
         *
         * Old manual rank values cannot hide
         * a Rank 1-5 student.
         */
        rank:
          row.autoRank,

        image:
          profile.imageData
            ? {
                data:
                  profile.imageData,

                mimeType:
                  profile.imageMimeType ||
                  "image/jpeg",
              }
            : null,

        updatedByAdmin:
          profile.updatedByAdmin === true,
      };
    }
  );
}


/* =========================================================
   PUBLIC LEADERBOARD
========================================================= */

router.get(
  "/leaderboard",
  async (req, res) => {

    try {

      const automaticRows =
        await getAutomaticTopRows();


      const mergedRows =
        await mergeProfiles(
          automaticRows
        );


      /*
       * Sort ONLY by automatic rank.
       *
       * This guarantees:
       *
       * all Rank 1 students
       * then all Rank 2 students
       * then all Rank 3 students
       * then all Rank 4 students
       * then all Rank 5 students
       */
      mergedRows.sort(
        (a, b) => {

          const rankA =
            Number(
              a.autoRank || 999
            );

          const rankB =
            Number(
              b.autoRank || 999
            );


          if (
            rankA !== rankB
          ) {
            return (
              rankA -
              rankB
            );
          }


          return (
            Number(
              b.percentage || 0
            ) -
            Number(
              a.percentage || 0
            )
          );
        }
      );


      /*
       * Convert response.
       *
       * IMPORTANT:
       * There is NO slice().
       */
      const students =
        mergedRows.map(
          (student) => {

            const {
              image,
              ...row
            } = student;


            return {

              ...row,

              /*
               * Always send automatic rank.
               */
              rank:
                Number(
                  student.autoRank
                ),

              photo:
                image || null,
            };
          }
        );


      console.log(
        "Leaderboard students:",
        students.map(
          (student) => ({
            name:
              student.name,

            percentage:
              student.percentage,

            rank:
              student.rank,
          })
        )
      );


      res.json({

        success: true,

        title:
          "Top Performers",

        students,
      });

    } catch (error) {

      console.error(
        "Leaderboard public error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to load leaderboard.",
      });
    }
  }
);


/* =========================================================
   ADMIN LEADERBOARD
========================================================= */

router.get(
  "/admin/leaderboard",
  adminAuth,
  async (req, res) => {

    try {

      const rows =
        await getAutomaticTopRows();


      const merged =
        await mergeProfiles(
          rows
        );


      merged.sort(
        (a, b) => {

          const rankA =
            Number(
              a.autoRank || 999
            );

          const rankB =
            Number(
              b.autoRank || 999
            );


          if (
            rankA !== rankB
          ) {
            return (
              rankA -
              rankB
            );
          }


          return (
            Number(
              b.percentage || 0
            ) -
            Number(
              a.percentage || 0
            )
          );
        }
      );


      res.json({

        success: true,

        students:
          merged,

      });

    } catch (error) {

      console.error(
        "Leaderboard admin GET error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to load leaderboard.",
      });
    }
  }
);


/* =========================================================
   ADMIN UPDATE
========================================================= */

router.put(
  "/admin/leaderboard/:studentKey",
  adminAuth,
  async (req, res) => {

    try {

      const studentKey =
        decodeURIComponent(
          req.params.studentKey ||
            ""
        )
          .trim()
          .toLowerCase();


      if (!studentKey) {

        return res.status(400).json({

          success: false,

          message:
            "Student key is required.",
        });
      }


      const allowedFields = [

        "name",

        "score",

        "percentage",

        "grade",

        "status",

        "testTitle",

        "rank",

        "imageData",

        "imageMimeType",

      ];


      const data = {

        updatedByAdmin:
          true,

      };


      for (
        const field
        of allowedFields
      ) {

        if (
          req.body[field] !==
          undefined
        ) {

          data[field] =
            req.body[field];

        }
      }


      /*
       * NAME
       */
      if (
        data.name !==
        undefined
      ) {

        data.name =
          String(
            data.name
          )
            .trim()
            .slice(0, 100);
      }


      /*
       * GRADE
       */
      if (
        data.grade !==
        undefined
      ) {

        data.grade =
          String(
            data.grade
          )
            .trim()
            .slice(0, 20);
      }


      /*
       * STATUS
       */
      if (
        data.status !==
        undefined
      ) {

        data.status =
          String(
            data.status
          )
            .trim()
            .slice(0, 30);
      }


      /*
       * TEST TITLE
       */
      if (
        data.testTitle !==
        undefined
      ) {

        data.testTitle =
          String(
            data.testTitle
          )
            .trim()
            .slice(0, 160);
      }


      /*
       * NUMBERS
       */
      for (
        const field of [
          "score",
          "percentage",
          "rank",
        ]
      ) {

        if (
          data[field] !==
          undefined
        ) {

          data[field] =
            normalizeNumber(
              data[field]
            );


          if (
            data[field] ===
            null
          ) {

            delete data[field];

          }
        }
      }


      /*
       * PERCENTAGE
       */
      if (
        data.percentage !==
          undefined &&
        data.percentage !==
          null
      ) {

        data.percentage =
          Math.max(
            0,
            Math.min(
              100,
              data.percentage
            )
          );
      }


      /*
       * RANK
       *
       * Kept for admin compatibility,
       * but public automatic rank is authoritative.
       */
      if (
        data.rank !==
          undefined &&
        data.rank !==
          null
      ) {

        data.rank =
          Math.max(
            1,
            Math.min(
              999,
              Math.round(
                data.rank
              )
            )
          );
      }


      /*
       * IMAGE
       */
      if (
        data.imageData
      ) {

        if (
          typeof data.imageData !==
            "string"
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Invalid student photo.",

          });
        }


        if (
          data.imageData.length >
          1600000
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Student photo is too large. Please upload a smaller image.",

          });
        }


        /*
         * Correct image validation.
         */
        if (
          !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(
            data.imageData
          )
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Only JPG, PNG or WebP images are supported.",

          });
        }
      }


      const profile =
        await LeaderboardProfile.findOneAndUpdate(

          {
            studentKey,
          },

          {
            $set:
              data,

            $setOnInsert: {
              studentKey,
            },
          },

          {
            new: true,

            upsert: true,

            runValidators:
              true,
          }
        ).lean();


      res.json({

        success: true,

        profile,

      });

    } catch (error) {

      console.error(
        "Leaderboard admin PUT error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to save leaderboard changes.",
      });
    }
  }
);


/* =========================================================
   RESET ADMIN OVERRIDE
========================================================= */

router.delete(
  "/admin/leaderboard/:studentKey",
  adminAuth,
  async (req, res) => {

    try {

      const studentKey =
        decodeURIComponent(
          req.params.studentKey ||
            ""
        )
          .trim()
          .toLowerCase();


      await LeaderboardProfile.deleteOne({

        studentKey,

      });


      res.json({

        success: true,

        message:
          "Leaderboard override reset.",

      });

    } catch (error) {

      console.error(
        "Leaderboard reset error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to reset leaderboard entry.",

      });
    }
  }
);


module.exports = router;