const assert = require("node:assert/strict");
const { applyDenseRanking } = require("../Backend/Utils/leaderboardRanking");

function ranked(scores) {
  return applyDenseRanking(scores.map(percentage => ({ percentage })).sort((a, b) => b.percentage - a.percentage));
}

// A large tie at rank 1 must not push the next distinct score to rank 10.
const nineFirst = ranked([100,100,100,100,100,100,100,100,100,99,98]);
assert.deepEqual(nineFirst.map(x => x.rank), [1,1,1,1,1,1,1,1,1,2,3]);

// Any number of tied students share one rank; next distinct score advances by one.
const fiftyAtTwo = ranked([100, ...Array(50).fill(99), 98]);
assert.equal(fiftyAtTwo[0].rank, 1);
assert.ok(fiftyAtTwo.slice(1, 51).every(x => x.rank === 2));
assert.equal(fiftyAtTwo[51].rank, 3);

// Several distinct score groups preserve dense sequential ranks.
assert.deepEqual(ranked([100, 95, 95, 90, 85]).map(x => x.rank), [1,2,2,3,4]);
console.log("Leaderboard ranking tests passed.");
