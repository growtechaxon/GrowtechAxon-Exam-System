const express = require("express");

const TestResult = require("../Models/TestResult");
const Test = require("../Models/Test");
const LeaderboardProfile = require("../Models/LeaderboardProfile");
const adminAuth = require("../Middleware/adminAuth");
const { gradeFromPercentage } = require("../Utils/pdf");

const router = express.Router();


/* =========================================================
   HELPER: NORMALIZE NUMBER
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

   Same percentage = same rank.

   Example:

   100%  -> Rank 1
   100%  -> Rank 1
   98.3% -> Rank 2
   95%   -> Rank 3
   91.7% -> Rank 4
   83.3% -> Rank 5
   81.7% -> Rank 6
========================================================= */

function applyDenseRanking(rows) {
  let previousPercentage = null;
  let currentRank = 0;

  for (const row of rows) {
    const percentage = Number(
      row.percentage || 0
    );

    if (
      previousPercentage === null ||
      percentage !== previousPercentage
    ) {
      currentRank += 1;
      previousPercentage = percentage;
    }

    row.autoRank = currentRank;
  }

  return rows;
}


/* =========================================================
   GET LATEST C PROGRAMMING TEST
========================================================= */

async function getLatestCProgrammingTest() {
  const test = await Test.findOne({
    title: {
      $regex: /c\s*programming/i
    }
  })
    .sort({
      createdAt: -1
    })
    .select(
      "_id title createdAt"
    )
    .lean();

  return test;
}


/* =========================================================
   GET AUTOMATIC LEADERBOARD

   IMPORTANT:

   Admin-edited percentage is applied BEFORE
   ranking is calculated.

   This means:

   Original Himanshu Maurya result
          ↓
   Admin percentage = 81.7%
          ↓
   Ranking calculation
          ↓
   Rank 6
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


  /* -------------------------------------------------------
     GET RESULTS
  ------------------------------------------------------- */

  const results =
    await TestResult.find({
      testId: latestTest._id,
      passed: true
    })
      .sort({
        percentage: -1,
        score: -1,
        submittedAt: -1,
        createdAt: -1
      })
      .lean();


  if (!results.length) {
    return [];
  }


  /* -------------------------------------------------------
     GET ALL LEADERBOARD PROFILES

     We need these BEFORE ranking because
     admin-edited percentage must affect rank.
  ------------------------------------------------------- */

  const resultStudentKeys =
    results.map(
      (result) => {
        const name =
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

        return (
          name ||
          email ||
          String(result._id)
        );
      }
    );


  const profiles =
    await LeaderboardProfile.find({
      studentKey: {
        $in: resultStudentKeys
      }
    }).lean();


  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          String(
            profile.studentKey
          )
            .trim()
            .toLowerCase(),

          profile
        ]
      )
    );


  /* -------------------------------------------------------
     BEST RESULT FOR EACH STUDENT
  ------------------------------------------------------- */

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

    const studentKey =
      candidateName ||
      email ||
      String(result._id);


    /*
     * If admin has hidden this student,
     * do not put them into leaderboard.
     *
     * IMPORTANT:
     * We are NOT deleting TestResult.
     */
    const profile =
      profileMap.get(
        studentKey
      );

    if (
      profile &&
      profile.hidden === true
    ) {
      continue;
    }


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


  /* -------------------------------------------------------
     BUILD EFFECTIVE LEADERBOARD ROWS

     ADMIN OVERRIDE IS APPLIED HERE.

     Example:

     Himanshu Maurya
     Original percentage = 100%
     Admin percentage    = 81.7%

     Effective percentage = 81.7%
  ------------------------------------------------------- */

  const rows =
    Array.from(
      bestByStudent.entries()
    )
      .map(
        ([studentKey, result]) => {
          const profile =
            profileMap.get(
              studentKey
            );


          /*
           * ADMIN PERCENTAGE
           */
          const percentage =
            profile &&
            profile.percentage !== null &&
            profile.percentage !== undefined
              ? Number(
                  profile.percentage
                )
              : Number(
                  result.percentage || 0
                );


          /*
           * ADMIN SCORE
           */
          const score =
            profile &&
            profile.score !== null &&
            profile.score !== undefined
              ? Number(
                  profile.score
                )
              : Number(
                  result.score || 0
                );


          /*
           * ADMIN NAME
           */
          const name =
            profile &&
            profile.name
              ? profile.name
              : (
                  result.candidateName ||
                  "Student"
                );


          /*
           * ADMIN GRADE
           */
          const grade =
            profile &&
            profile.grade
              ? profile.grade
              : (
                  result.grade ||
                  gradeFromPercentage(
                    percentage
                  )
                );


          /*
           * ADMIN STATUS
           */
          const status =
            profile &&
            profile.status
              ? profile.status
              : (
                  result.passed
                    ? "PASSED"
                    : "FAILED"
                );


          /*
           * ADMIN TEST TITLE
           */
          const testTitle =
            profile &&
            profile.testTitle
              ? profile.testTitle
              : (
                  result.testTitle ||
                  latestTest.title ||
                  "C Programming Assessment"
                );


          return {
            studentKey,

            resultId:
              result.resultId ||
              String(result._id),

            name,

            score,

            percentage,

            grade,

            status,

            testTitle,

            submittedAt:
              result.submittedAt ||
              result.createdAt ||
              null,

            autoRank: null,

            imageData:
              profile &&
              profile.imageData
                ? profile.imageData
                : "",

            imageMimeType:
              profile &&
              profile.imageMimeType
                ? profile.imageMimeType
                : "",

            updatedByAdmin:
              profile &&
              profile.updatedByAdmin === true,

            hidden: false
          };
        }
      );


  /* -------------------------------------------------------
     SORT USING EFFECTIVE PERCENTAGE
  ------------------------------------------------------- */

  rows.sort(
    (a, b) => {
      if (
        b.percentage !==
        a.percentage
      ) {
        return (
          b.percentage -
          a.percentage
        );
      }


      if (
        b.score !==
        a.score
      ) {
        return (
          b.score -
          a.score
        );
      }


      return String(
        a.name || ""
      ).localeCompare(
        String(
          b.name || ""
        )
      );
    }
  );


  /* -------------------------------------------------------
     APPLY DENSE RANKING

     NOW ranking uses admin-edited percentage.
  ------------------------------------------------------- */

  applyDenseRanking(rows);


  /* -------------------------------------------------------
     ONLY RANK 1 TO RANK 6

     IMPORTANT:

     This is NOT slice(0, 6).

     Rank 1 can have multiple students.

     Example:

     Rank 1 = 2 students

     So Rank 1 through Rank 6
     can contain 7 total students.
  ------------------------------------------------------- */

  const topRows =
    rows.filter(
      (row) =>
        Number(
          row.autoRank
        ) >= 1 &&
        Number(
          row.autoRank
        ) <= 6
    );


  return topRows;
}


/* =========================================================
   MERGE PROFILE DATA

   Ranking is NOT changed here.

   autoRank remains authoritative.
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
        $in: keys
      }
    }).lean();


  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          String(
            profile.studentKey
          )
            .trim()
            .toLowerCase(),

          profile
        ]
      )
    );


  return rows.map(
    (row) => {
      const profile =
        profileMap.get(
          String(
            row.studentKey
          )
            .trim()
            .toLowerCase()
        );


      if (!profile) {
        return {
          ...row,

          rank:
            row.autoRank,

          hidden: false,

          image: null
        };
      }


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
          profile.percentage === null ||
          profile.percentage === undefined
            ? row.percentage
            : Number(
                profile.percentage
              ),

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
         * IMPORTANT:
         * Never use manually stored rank here.
         *
         * Rank is calculated automatically
         * from the effective percentage.
         */
        rank:
          row.autoRank,

        hidden:
          profile.hidden === true,

        image:
          profile.imageData
            ? {
                data:
                  profile.imageData,

                mimeType:
                  profile.imageMimeType ||
                  "image/jpeg"
              }
            : null,

        updatedByAdmin:
          profile.updatedByAdmin === true
      };
    }
  );
}


/* =========================================================
   REMOVE HIDDEN STUDENTS
========================================================= */

function removeHiddenStudents(rows) {
  return rows.filter(
    (student) =>
      student.hidden !== true
  );
}


/* =========================================================
   FINAL SORT
========================================================= */

function sortLeaderboard(rows) {
  rows.sort(
    (a, b) => {
      const rankA =
        Number(
          a.autoRank ||
          a.rank ||
          999
        );

      const rankB =
        Number(
          b.autoRank ||
          b.rank ||
          999
        );


      if (
        rankA !== rankB
      ) {
        return (
          rankA -
          rankB
        );
      }


      const percentageA =
        Number(
          a.percentage || 0
        );

      const percentageB =
        Number(
          b.percentage || 0
        );


      if (
        percentageA !==
        percentageB
      ) {
        return (
          percentageB -
          percentageA
        );
      }


      return String(
        a.name || ""
      ).localeCompare(
        String(
          b.name || ""
        )
      );
    }
  );


  return rows;
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


      let mergedRows =
        await mergeProfiles(
          automaticRows
        );


      /*
       * Remove hidden students.
       */
      mergedRows =
        removeHiddenStudents(
          mergedRows
        );


      /*
       * Sort final result.
       */
      sortLeaderboard(
        mergedRows
      );


      /*
       * Public leaderboard.
       *
       * Rank is always automatic.
       */
      const students =
        mergedRows.map(
          (student) => {
            const {
              image,
              hidden,
              ...row
            } = student;


            return {
              ...row,

              rank:
                Number(
                  student.autoRank ||
                  student.rank
                ),

              photo:
                image || null
            };
          }
        );


      console.log(
        "PUBLIC LEADERBOARD:",
        students.map(
          (student) => ({
            name:
              student.name,

            percentage:
              student.percentage,

            rank:
              student.rank
          })
        )
      );


      res.json({
        success: true,

        title:
          "Top Performers",

        students
      });
    } catch (error) {
      console.error(
        "Leaderboard public error:",
        error
      );


      res.status(500).json({
        success: false,

        message:
          "Unable to load leaderboard."
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
      const automaticRows =
        await getAutomaticTopRows();


      let mergedRows =
        await mergeProfiles(
          automaticRows
        );


      /*
       * Remove hidden students.
       */
      mergedRows =
        removeHiddenStudents(
          mergedRows
        );


      /*
       * Sort final leaderboard.
       */
      sortLeaderboard(
        mergedRows
      );


      const students =
        mergedRows.map(
          (student) => {
            const {
              hidden,
              ...row
            } = student;

            return {
              ...row,

              rank:
                Number(
                  student.autoRank ||
                  student.rank
                )
            };
          }
        );


      console.log(
        "ADMIN LEADERBOARD:",
        students.map(
          (student) => ({
            name:
              student.name,

            percentage:
              student.percentage,

            rank:
              student.rank
          })
        )
      );


      res.json({
        success: true,

        students
      });
    } catch (error) {
      console.error(
        "Leaderboard admin GET error:",
        error
      );


      res.status(500).json({
        success: false,

        message:
          "Unable to load leaderboard."
      });
    }
  }
);


/* =========================================================
   ADMIN UPDATE LEADERBOARD PROFILE
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
            "Student key is required."
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
        "hidden"
      ];


      const data = {
        updatedByAdmin: true
      };


      for (
        const field of allowedFields
      ) {
        if (
          req.body[field] !==
          undefined
        ) {
          data[field] =
            req.body[field];
        }
      }


      /* NAME */
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


      /* GRADE */
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


      /* STATUS */
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


      /* TEST TITLE */
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


      /* NUMBER FIELDS */
      for (
        const field of [
          "score",
          "percentage",
          "rank"
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


      /* PERCENTAGE LIMIT */
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
       * Manual rank is stored for admin
       * compatibility, but automatic ranking
       * remains authoritative.
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


      /* HIDDEN */
      if (
        data.hidden !==
        undefined
      ) {
        data.hidden =
          data.hidden === true ||
          data.hidden === "true";
      }


      /* IMAGE */
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
              "Invalid student photo."
          });
        }


        if (
          data.imageData.length >
          1600000
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Student photo is too large. Please upload a smaller image."
          });
        }


        if (
          !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(
            data.imageData
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Only JPG, PNG or WebP images are supported."
          });
        }
      }


      const profile =
        await LeaderboardProfile.findOneAndUpdate(
          {
            studentKey
          },

          {
            $set:
              data,

            $setOnInsert: {
              studentKey
            }
          },

          {
            new: true,

            upsert: true,

            runValidators:
              true
          }
        ).lean();


      res.json({
        success: true,

        profile
      });
    } catch (error) {
      console.error(
        "Leaderboard admin PUT error:",
        error
      );


      res.status(500).json({
        success: false,

        message:
          "Unable to save leaderboard changes."
      });
    }
  }
);


/* =========================================================
   RESET LEADERBOARD OVERRIDE
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
        studentKey
      });


      res.json({
        success: true,

        message:
          "Leaderboard override reset."
      });
    } catch (error) {
      console.error(
        "Leaderboard reset error:",
        error
      );


      res.status(500).json({
        success: false,

        message:
          "Unable to reset leaderboard entry."
      });
    }
  }
);


module.exports = router;