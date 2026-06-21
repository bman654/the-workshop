/* ════════════════════════════════════════════════════════════════════════════
   core.mjs — THE DIVIDING YARD's sole integer-partition authority.

   The Squaring Yard folds ODD NUMBERS into a SQUARE; this neighbouring bench
   FOLDS A WHOLE NUMBER across a mirror. A partition of n is a way to write n as
   a sum of positive parts; lay its parts as rows of beads and you get a Ferrers
   staircase. Reflect that staircase across the row=col diagonal and you get its
   CONJUGATE — another partition of the SAME n. Three facts the beads ENACT, each
   proven here EXACTLY (integer-only, no floats), the page replaying what this
   module proves (dual truth):

     (1) CONJUGATION IS AN n-PRESERVING INVOLUTION.
         conjugate(p) transposes the Ferrers diagram (rows↔cols). It preserves
         the sum (every bead is relocated, none lost) and conjugate∘conjugate is
         the identity (transposing twice returns the original). Fold across the
         mirror, fold again, and the beads retrace home exactly.

     (2) EULER:  #{partitions of n into DISTINCT parts} = #{into ODD parts}.
         Two utterly different sieves of the partitions of n land on the SAME
         count, for every n. We DISCOVER the equality by literally enumerating
         BOTH sets and crossing their lengths with === — never a generating-
         function shortcut. The two-sieve tower race enacts exactly this.

     (3) THE NEG-CONTROL (the honesty floor). Loosen the DISTINCT sieve to allow
         repeats and it collapses to ALL partitions — its count OVERSHOOTS the
         odd count (strictly, for every n≥2). Euler's match is SPECIAL to the
         distinct↔odd pairing, not a vacuous "always equal" box: the cheat tower
         visibly punches past the level line.

   Everything is exact integer arithmetic, so "machine precision" here means
   LITERAL equality of integers (===), not a tolerance.

   Pure, DOM-free, zero-dependency. Inlined byte-faithfully into index.html via a
   forge:include; also imported by core.test.mjs (the Node twin) — page & test
   can never drift.
   ════════════════════════════════════════════════════════════════════════════ */

// ── the ranges the chip and twin sweep ───────────────────────────────────────
export const RANGE = 40;        // Euler / sieve / neg-control sweep (q(40)=1113)
export const CONJ_RANGE = 24;   // conjugation involution sweep (all 7337 parts)

// ── ONE shared descending-partition enumerator ────────────────────────────────
// Recursive descent over DESCENDING parts. `rem` is what remains to be summed,
// `cap` is the largest part still allowed (enforces descending order), `acc` the
// parts chosen so far. Options:
//   oddOnly      — skip even candidate parts (partitions into odd parts)
//   distinct     — after choosing part p, drop the cap to p−1 (strictly
//                  decreasing) UNLESS allowRepeat re-loosens it back to p
//   allowRepeat  — keep the cap at p even when `distinct` is set: this is the
//                  CHEAT that collapses "distinct" back to ALL partitions.
// Returns an array of partitions, each a DESCENDING array of positive integers.
function _enum(n, { distinct = false, oddOnly = false, allowRepeat = false } = {}) {
  const out = [];
  const acc = [];
  function rec(rem, cap) {
    if (rem === 0) { out.push(acc.slice()); return; }
    const hi = Math.min(rem, cap);
    for (let p = hi; p >= 1; p--) {
      if (oddOnly && (p % 2 === 0)) continue;
      acc.push(p);
      // descending order is the invariant: the next part may be at most `nextCap`.
      // distinct ⇒ strictly smaller (p−1); allowRepeat overrides distinct back to p.
      const nextCap = (distinct && !allowRepeat) ? p - 1 : p;
      rec(rem - p, nextCap);
      acc.pop();
    }
  }
  if (n > 0) rec(n, n);
  else if (n === 0) out.push([]);   // the empty partition of 0
  return out;
}

// ── the four sieves (each returns the actual partitions, descending) ──────────
export function partitionsDistinct(n) { return _enum(n, { distinct: true }); }
export function partitionsOdd(n)      { return _enum(n, { oddOnly: true }); }
export function partitionsAll(n)      { return _enum(n, {}); }
// the CHEAT: distinct WITH allowRepeat ⇒ the cap never drops ⇒ collapses to ALL
// partitions. Used ONLY as the neg-control (counted, never drawn).
export function partitionsDistinctCheat(n) { return _enum(n, { distinct: true, allowRepeat: true }); }

// ── counts (the towers read these) ────────────────────────────────────────────
export function countDistinct(n) { return partitionsDistinct(n).length; }
export function countOdd(n)      { return partitionsOdd(n).length; }
export function partSum(p)       { let s = 0; for (const x of p) s += x; return s; }

// ── CONJUGATION — the Ferrers transpose (descending in, descending out) ───────
// conj[k] = #{rows ≥ k} for k = 1..p[0]. Because p is descending, conj is too.
// e.g. conjugate([4,2,1]) = [3,2,1,1].
export function conjugate(p) {
  if (p.length === 0) return [];
  const m = p[0];                       // p is descending, so p[0] is the max part
  const c = new Array(m).fill(0);
  for (const part of p) {
    // a row of length `part` contributes a bead to columns 1..part
    for (let k = 0; k < part; k++) c[k]++;
  }
  return c;                             // already descending (counts of rows ≥ k)
}

// ── ferrersCells — the SOLE source of bead pixel cells ────────────────────────
// Row-major DESCENDING order: row r (0-based, part p[r]) yields cells col 0..p[r]−1.
// length === partSum(p). The board renders exactly these; nothing else owns geometry.
export function ferrersCells(p) {
  const cells = [];
  for (let r = 0; r < p.length; r++) {
    for (let c = 0; c < p[r]; c++) cells.push({ row: r, col: c });
  }
  return cells;
}

// ── defaultPartition — the staircase-iest legible default for n ───────────────
// Greedy near-triangular descending staircase: take the largest triangular
// staircase m, m−1, …, 1 that fits (T_m ≤ n), then pour the remainder onto the
// top part. e.g. 6→[3,2,1], 7→[4,2,1], 10→[4,3,2,1]. Always strictly descending.
export function defaultPartition(n) {
  if (n <= 0) return [];
  let m = 0;
  while ((m + 1) * (m + 2) / 2 <= n) m++;       // largest m with T_m ≤ n
  if (m === 0) return [n];                        // n < 1 handled above; n===... safety
  const staircase = [];
  for (let i = m; i >= 1; i--) staircase.push(i); // m, m−1, …, 1
  staircase[0] += n - (m * (m + 1)) / 2;          // pour remainder onto the top
  return staircase;
}

// ── transferBead — a legal in-place edit that keeps the count pinned to n ─────
// Move ONE bead off the end of row `row` (delta=−1) or onto it (delta=+1),
// returning a NEW valid DESCENDING partition of the SAME n, or `cur` unchanged
// if the move would break descending-order or positivity. The number of beads
// (= n) is conserved by construction: a bead removed from one row is the same n
// only if it lands elsewhere — here we model the board's row-drag as growing or
// shrinking a row while a NEIGHBOURING row compensates, keeping the SUM fixed.
// delta = +1 : row gains a bead, the row BELOW (row+1) loses one.
// delta = −1 : row loses a bead, the row BELOW (row+1) gains one.
// (Moving beads between adjacent rows is the natural "reshape the staircase"
//  gesture; the partition's n never changes.)
export function transferBead(cur, row, delta) {
  if (!Array.isArray(cur) || cur.length === 0) return cur;
  const below = row + 1;
  const next = cur.slice();
  if (delta === +1) {
    // need a donor row below to take a bead FROM
    if (below >= next.length) {
      // no row below: a bead can come from a fresh trailing 1 only if one exists;
      // otherwise illegal (would change n). Reject.
      return cur;
    }
    next[row] += 1;
    next[below] -= 1;
  } else if (delta === -1) {
    if (row >= next.length) return cur;
    // row gives a bead to the row below (creating it if row is the last row)
    if (below >= next.length) next.push(0);
    next[row] -= 1;
    next[below] += 1;
  } else {
    return cur;
  }
  // drop any trailing zero rows
  while (next.length && next[next.length - 1] === 0) next.pop();
  // validate: positive, descending, same sum
  if (!isPartition(next)) return cur;
  if (partSum(next) !== partSum(cur)) return cur;
  return next;
}

// ── randomPartition — any valid descending partition of n (board's "shuffle") ─
export function randomPartition(n) {
  if (n <= 0) return [];
  const all = partitionsAll(n);
  return all[Math.floor(Math.random() * all.length)].slice();
}

// ── isPartition — a non-empty array of positive, non-strictly-descending ints ─
export function isPartition(p) {
  if (!Array.isArray(p)) return false;
  if (p.length === 0) return true;                // the empty partition (of 0) is valid
  for (let i = 0; i < p.length; i++) {
    if (!Number.isInteger(p[i]) || p[i] <= 0) return false;
    if (i > 0 && p[i] > p[i - 1]) return false;   // descending (repeats allowed)
  }
  return true;
}

// ── runChecks — the SINGLE battery the page chip AND the Node twin consume ────
// (chip↔twin parity). Returns { pass, total, fails:[…] }.
export function runChecks(range = RANGE) {
  const fails = [];
  let total = 0;
  function ck(name, ok) { total++; if (!ok) fails.push(name); }

  // (1) EULER — countDistinct(n) === countOdd(n) by INDEPENDENT enumeration,
  //     n = 1..range. (Each side enumerates its own set and we cross the lengths.)
  for (let n = 1; n <= range; n++) {
    ck(`Euler #distinct=#odd at n=${n}`, countDistinct(n) === countOdd(n));
  }

  // (2) HAND-TABULATED LITERALS (guards two-bugs-that-agree).
  ck('#distinct(7) = 5', countDistinct(7) === 5);
  ck('#odd(7) = 5', countOdd(7) === 5);
  // the distinct-count prefix for n=1..8 is exactly [1,1,2,2,3,4,5,6]
  ck('distinct prefix n=1..8 = [1,1,2,2,3,4,5,6]',
     JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8].map(countDistinct)) === JSON.stringify([1, 1, 2, 2, 3, 4, 5, 6]));
  // the FULL distinct(7) SET
  ck('distinct(7) SET = [[7],[6,1],[5,2],[4,3],[4,2,1]]',
     JSON.stringify(partitionsDistinct(7)) === JSON.stringify([[7], [6, 1], [5, 2], [4, 3], [4, 2, 1]]));
  // the FULL odd(7) SET
  ck('odd(7) SET = [[7],[5,1,1],[3,3,1],[3,1,1,1,1],[1,1,1,1,1,1,1]]',
     JSON.stringify(partitionsOdd(7)) === JSON.stringify([[7], [5, 1, 1], [3, 3, 1], [3, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1]]));
  // q(40) = 1113 (the distinct-partition count of 40)
  ck('q(40) = 1113', countDistinct(40) === 1113);

  // (3) STRUCTURAL — every member of each sieve is a genuine partition, n=1..range.
  for (let n = 1; n <= range; n++) {
    let okD = true;
    for (const p of partitionsDistinct(n)) {
      if (partSum(p) !== n) okD = false;
      for (let i = 1; i < p.length; i++) if (p[i] >= p[i - 1]) okD = false;   // STRICTLY decreasing
    }
    ck(`every distinct member sums to n & strictly decreasing at n=${n}`, okD);
    let okO = true;
    for (const p of partitionsOdd(n)) {
      if (partSum(p) !== n) okO = false;
      for (const x of p) if (x % 2 === 0) okO = false;                         // all parts odd
    }
    ck(`every odd member sums to n & all parts odd at n=${n}`, okO);
  }

  // (4) CONJUGATION — sum-preserving AND an involution, over ALL partitions of
  //     n = 1..CONJ_RANGE. Plus the spot literal conj([4,2,1]) = [3,2,1,1].
  for (let n = 1; n <= CONJ_RANGE; n++) {
    let okC = true;
    for (const p of partitionsAll(n)) {
      const c = conjugate(p);
      if (partSum(c) !== n) okC = false;                                       // sum preserved
      if (JSON.stringify(conjugate(c)) !== JSON.stringify(p)) okC = false;     // involution
    }
    ck(`conjugation sum-preserving & involution over all partitions of n=${n}`, okC);
  }
  ck('conj([4,2,1]) = [3,2,1,1]', JSON.stringify(conjugate([4, 2, 1])) === JSON.stringify([3, 2, 1, 1]));

  // (5) NEG-CONTROL — loosen distinct to allow repeats and it collapses to ALL
  //     partitions, whose count STRICTLY overshoots the odd count for n≥2.
  for (let n = 2; n <= range; n++) {
    ck(`neg-control: cheat(n) > odd(n) (strict) at n=${n}`,
       partitionsDistinctCheat(n).length > countOdd(n));
  }
  // the cheat really is ALL partitions: cheat(7) = p(7) = 15 > odd(7) = 5
  ck('cheat(7) = 15 (= p(7)) > odd(7) = 5',
     partitionsDistinctCheat(7).length === 15 && countOdd(7) === 5);

  return { pass: total - fails.length, total, fails };
}
