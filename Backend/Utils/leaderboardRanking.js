/**
 * Dense ranking: equal percentages receive the same rank and the next
 * distinct percentage receives the next sequential rank (1, 2, 2, 3).
 * The input must already be sorted from highest to lowest percentage.
 */
function applyDenseRanking(rows) {
  let rank = 0;
  let previous = null;
  for (const row of rows) {
    const score = Number(row.percentage || 0);
    if (previous === null || score !== previous) {
      rank += 1;
      previous = score;
    }
    row.rank = rank;
  }
  return rows;
}

module.exports = { applyDenseRanking };
