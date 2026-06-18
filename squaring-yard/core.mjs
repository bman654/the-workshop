/* ════════════════════════════════════════════════════════════════════════════
   core.mjs — THE SQUARING YARD's sole arithmetic authority (figurate numbers).

   The fifth-and-later benches of the Numbers Room turn a counting fact into a
   SHAPE you can fold. Three identities about figurate numbers — each a thing the
   pebbles ENACT, not a curve to plot — are proven here EXACTLY (integer-only, no
   floats), and the page replays exactly what this module proves (dual truth):

     (1) THE ODD GNOMONS build a square:   Σ_{k=1}^{n} (2k−1) = n².
         Nest L-shaped odd shells 1, 3, 5, …, (2n−1) and the n-th one snapping
         home completes an n×n square. The running pebble count IS n².

     (2) TWO TRIANGLES tile that square:   T_n + T_{n−1} = n²,  T_k = k(k+1)/2.
         Take two consecutive triangular stacks, flip one, and the pair tiles
         the SAME n×n square — the gnomon square, reached a second way.

     (3) THE HIDDEN ONE — a hexagonal number IS a triangular number:
         H_n = T_{2n−1},   H_k = k(2k−1).   The same pebbles laid out two ways.

   Everything is exact integer arithmetic, so "machine precision" here means
   LITERAL equality of integers (===), not a tolerance. A NEG-CONTROL proves the
   honesty floor: drop or mis-place one gnomon and the assembled count is NOT a
   perfect square — assembledCount(n, drop>0) returns the honest non-square so a
   vacuous "always says square" renderer fails.

   Pure, DOM-free, zero-dependency. Inlined byte-faithfully into index.html via a
   forge:include; also imported by core.test.mjs (the Node twin) — page & test
   can never drift.
   ════════════════════════════════════════════════════════════════════════════ */

// ── triangular & hexagonal numbers (integer-exact; integer division is exact
//    here because n(n+1) and k(2k−1) are always even / already integral) ───────
export function triangular(n) {           // T_n = 1 + 2 + … + n = n(n+1)/2
  if (n < 0) return 0;
  return (n * (n + 1)) / 2;
}
export function hexagonal(n) {             // H_n = n(2n−1) = 1, 6, 15, 28, …
  return n * (2 * n - 1);
}

// The n-th odd GNOMON: the L-shaped shell of pebbles you nest to grow the square
// from (n−1)² up to n². It has exactly (2n−1) pebbles (the n-th odd number).
export function gnomon(n) {                // 1, 3, 5, 7, … = 2n−1
  return 2 * n - 1;
}

// ── (1) THE GNOMON SUM, computed two independent ways so the test can cross them.
// loopGnomonSum: literally add the odd shells one at a time (what the board does
// as you fold each L home). squareClosed: the claimed answer n². They must agree.
export function loopGnomonSum(n) {         // Σ_{k=1}^{n} (2k−1), summed honestly
  let s = 0;
  for (let k = 1; k <= n; k++) s += gnomon(k);
  return s;
}
export function squareClosed(n) {          // the CLAIM: that sum is n²
  return n * n;
}

// ── (3) coordinates that PROVE H_n = T_{2n−1} by construction: lay H_n as a
//    triangular stack of side (2n−1). The page renders these exact pebble cells;
//    the count of cells === H_n === T_{2n−1}, so the picture is the proof.
//    Returns [{row, col}] for a left-justified triangle of side s = 2n−1
//    (row r, r = 0..s−1, has r+1 pebbles). Length === T_s === H_n.
export function hexAsTriangle(n) {
  const s = 2 * n - 1;                     // the triangle's side
  const cells = [];
  for (let r = 0; r < s; r++) {
    for (let c = 0; c <= r; c++) cells.push({ row: r, col: c });
  }
  return cells;
}

// The GENUINE figurate-hexagonal figure: n nested regular hexagons sharing one
// corner. Hook k (k=1..n) traces 4 of the 6 hexagon edges (the far side, away
// from the shared corner), adding exactly 4k−3 dots; the union has H_n distinct
// dots. Returned as axial integer lattice coords [{q, r}] (the page maps q,r →
// pixels with the usual triangular-lattice basis). length === H_n by
// construction — the SAME pebbles the triangle-of-side-(2n−1) holds, two ways.
export function hexFigure(n) {
  const seen = new Set();
  const cells = [];
  const add = (q, r) => { const k = q + '|' + r; if (!seen.has(k)) { seen.add(k); cells.push({ q, r }); } };
  add(0, 0);                               // the shared corner (hook 1 = 1 dot)
  const D = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];  // 6 hex directions
  for (let k = 2; k <= n; k++) {
    let q = (k - 1) * D[0][0], r = (k - 1) * D[0][1];   // far-right corner of hexagon k
    add(q, r);
    for (let e = 1; e <= 4; e++) {          // 4 far edges of length (k−1)
      const [dq, dr] = D[e];
      for (let s = 0; s < k - 1; s++) { q += dq; r += dr; add(q, r); }
    }
  }
  return cells;
}

// ── THE ASSEMBLED COUNT + NEG-CONTROL ─────────────────────────────────────────
// Fold the first n gnomons home, but DROP `drop` of their pebbles (drop=0 ⇒ the
// honest square). Returns the literal pebble count actually placed — n² when
// nothing is dropped, and n²−drop otherwise (the honest non-square).
export function assembledCount(n, drop = 0) {
  return loopGnomonSum(n) - drop;
}

// Is `k` a perfect square? Integer-exact (no float round-trip): take the rounded
// √, then VERIFY by squaring back, so e.g. 24 and 26 are correctly rejected.
export function isPerfectSquare(k) {
  if (k < 0) return false;
  const r = Math.round(Math.sqrt(k));
  // check r and its neighbours to be bullet-proof against float drift near edges
  for (const cand of [r - 1, r, r + 1]) {
    if (cand >= 0 && cand * cand === k) return true;
  }
  return false;
}

// ── one self-contained report the page's chip and the Node twin both consume,
//    so the in-page pill === the twin (chip↔twin parity). Returns
//    { pass, total, fails:[…] }. Covers all three identities over 1..RANGE plus
//    the neg-control and a couple of spot constants. ───────────────────────────
export const RANGE = 200;

export function runChecks(range = RANGE) {
  const fails = [];
  let total = 0;
  function ck(name, ok) { total++; if (!ok) fails.push(name); }

  // (1) Σ(2k−1) = n², via the honest loop AND the closed form, for n=1..range
  for (let n = 1; n <= range; n++) {
    ck(`gnomon Σ(2k−1)=n² at n=${n}`, loopGnomonSum(n) === squareClosed(n));
    // and the assembled square count is genuinely a perfect square
    ck(`assembled gnomon count is a perfect square at n=${n}`, isPerfectSquare(assembledCount(n, 0)));
  }

  // (2) T_n + T_{n−1} = n²  for n=1..range  (the two-triangle tiling)
  for (let n = 1; n <= range; n++) {
    ck(`T_n + T_{n−1} = n² at n=${n}`, triangular(n) + triangular(n - 1) === n * n);
  }

  // (3) H_n = T_{2n−1}  for n=1..range  (closed form AND by BOTH built figures —
  //     the triangle of side 2n−1 AND the genuine nested-hexagon figure)
  for (let n = 1; n <= range; n++) {
    ck(`H_n = T_{2n−1} (closed) at n=${n}`, hexagonal(n) === triangular(2 * n - 1));
    ck(`H_n = built triangle cell-count at n=${n}`, hexAsTriangle(n).length === hexagonal(n));
    const fig = hexFigure(n);
    ck(`H_n = built hexagon-figure dot-count at n=${n}`, fig.length === hexagonal(n));
    // the hexagon figure has no duplicate lattice points (every dot distinct)
    ck(`hexagon figure has H_n DISTINCT dots at n=${n}`,
       new Set(fig.map(p => p.q + '|' + p.r)).size === hexagonal(n));
  }

  // NEG-CONTROL: drop ONE gnomon pebble (n≥2 so n²−1 is never itself a square)
  // and the assembled count must NOT be a perfect square — the honesty floor.
  for (let n = 2; n <= range; n++) {
    const c = assembledCount(n, 1);
    ck(`neg-control: n=${n} with 1 pebble dropped (count ${c}) is NOT a square`, !isPerfectSquare(c));
  }

  // spot constants the win-line states out loud (checkable, not decorative):
  // T_4=10, H_3=15=T_5, the 7th gnomon is 13, Σ first 5 odds = 25 = 5².
  ck('constant: T_4 = 10', triangular(4) === 10);
  ck('constant: H_3 = 15 = T_5', hexagonal(3) === 15 && triangular(5) === 15);
  ck('constant: 7th gnomon = 13', gnomon(7) === 13);
  ck('constant: 1+3+5+7+9 = 25 = 5²', loopGnomonSum(5) === 25 && 25 === 5 * 5);
  // isPerfectSquare itself is sound: rejects the famous near-misses
  ck('isPerfectSquare rejects 24, 26, 2', !isPerfectSquare(24) && !isPerfectSquare(26) && !isPerfectSquare(2));
  ck('isPerfectSquare accepts 0, 1, 81, 40000', isPerfectSquare(0) && isPerfectSquare(1) && isPerfectSquare(81) && isPerfectSquare(40000));

  return { pass: total - fails.length, total, fails };
}
