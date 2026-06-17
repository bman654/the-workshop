/* ════════════════════════════════════════════════════════════════════════════
   THE INFINITE OVERHANG — core.mjs · the geometry/physics authority (pure, DOM-free).

   The block-stacking (book-stacking) problem. A book has unit length 1. You stack
   n identical books at the edge of a table — the CLIFF — and slide them out over
   thin air. How far past the cliff can the TOP book's right edge float and the
   stack still stand?

   For the classic SINGLE-WIDE (one book per layer) harmonic stack the answer is
   EXACTLY ½·H(n), where H(n) = 1 + 1/2 + ⋯ + 1/n is the nth harmonic number. The
   construction: the kth book counted FROM THE TOP overhangs the one beneath it by
   exactly 1/(2k), and the bottom (nth) book overhangs the TABLE by 1/(2n). Summing,
   the top book's right edge sits at Σ_{k=1..n} 1/(2k) = ½·H(n).

   Because H(n) → ∞ (it grows like ½·ln n), the overhang has NO upper bound: with
   enough books you can clear ANY distance. Yet each new book buys only the marginal
   nudge 1/(2k) — an ever-SMALLER increment. THAT logarithmic crawl is the honest
   star of this room: divergent, but each step diminishing. (This is the single-wide
   optimum — NOT "the maximum possible overhang": multi-wide constructions reach
   ~n^(1/3) and are a different problem we do not build here.)

   STABILITY is a stack of center-of-mass tests, one per interface. Books are indexed
   from the TOP (block 0 = topmost); each spans [left, left+1]. For each interface i
   (block i resting on block i+1), the CoM of the TOP sub-stack {0..i} must lie within
   the footprint of the block beneath it. The bottom block rests on the TABLE, whose
   support is x ≤ 0 (the cliff at x = 0): its whole-stack CoM must be ≤ 0. In the
   optimal stack every one of those sub-stack CoMs sits EXACTLY on its support edge —
   the whole tower is balanced on a chain of knife-edges. Nudge any book a hair past
   its 1/(2k) and the sub-stack at/above that interface tips.

   Imported byte-faithfully into the page (via forge:include) and by core.test.mjs.
   The Node twin runs the SAME runSelfTest() the in-page pill runs.
   ════════════════════════════════════════════════════════════════════════════ */

// The nth harmonic number H(n) = 1 + 1/2 + ⋯ + 1/n.
export function harmonic(n){ let s = 0; for (let k = 1; k <= n; k++) s += 1 / k; return s; }

// The MAXIMUM stable overhang for n single-wide books, in book-lengths: exactly ½·H(n).
// This is the sum of the optimal per-layer offsets Σ_{k=1..n} 1/(2k).
export function maxOverhang(n){ return 0.5 * harmonic(n); }

// The marginal nudge the kth book (counted FROM THE TOP) buys: exactly 1/(2k).
// Adding the nth book slides the whole tower out by this diminishing amount — the
// logarithmic crawl made explicit (the B-graft: the divergence ledger shows this live).
export function nudge(k){ return 1 / (2 * k); }

// The OPTIMAL stack: an array of LEFT edges (index 0 = top block) that places each
// top-k sub-stack's CoM exactly on the right edge of the block beneath it. Built from
// the bottom up: the bottom block (index n−1) overhangs the table by 1/(2n); each
// higher block overhangs the one below by 1/(2k); the top block's right edge lands at
// Σ_{k=1..n} 1/(2k) = ½·H(n) = maxOverhang(n).
export function optimalLefts(n){
  const lefts = new Array(n);
  let rightEdge = 0;           // running right edge of the block at this level
  for (let k = n; k >= 1; k--){
    rightEdge += 1 / (2 * k);  // this block extends 1/(2k) past the one below
    lefts[k - 1] = rightEdge - 1;
  }
  return lefts;
}

// CENTER OF MASS of a set of equal blocks given their left edges = mean of their
// centers = mean(left) + 0.5.
export function comOf(lefts){
  if (lefts.length === 0) return 0;
  let s = 0; for (const L of lefts) s += L + 0.5;
  return s / lefts.length;
}

// The SUPPORT-EDGE test (the criticality / toppling authority). Blocks indexed from
// the TOP (0 = topmost). For each interface i (block i resting on block i+1, for
// i = 0..n−2) the CoM of the TOP sub-stack {0..i} must lie within the footprint
// [left_{i+1}, left_{i+1}+1] of the block beneath. The LAST block (i = n−1) rests on
// the TABLE, whose support is x ≤ 0 (the cliff at x=0): its sub-stack {0..n−1} CoM
// must be ≤ 0.
//
// Returns { stable, firstFail, margins } where:
//   stable     — every sub-stack CoM sits over its support
//   firstFail  — the interface index that topples first (or -1)
//   margins[i] — signed distance from the sub-stack CoM to the FAILING (right) edge of
//                its support: negative = safe, positive = past the edge.
export function supportTest(lefts){
  const n = lefts.length;
  const margins = new Array(n);
  let firstFail = -1;
  let sumCenters = 0;                              // running sum of top-(i+1) block centers
  for (let i = 0; i < n; i++){
    sumCenters += lefts[i] + 0.5;
    const com = sumCenters / (i + 1);             // CoM of sub-stack {0..i}
    if (i < n - 1){
      // rests on the block below (index i+1): support footprint [supLeft, supRight].
      const supLeft = lefts[i + 1], supRight = lefts[i + 1] + 1;
      // a stack tips RIGHT (out over the cliff) past supRight; it could also tip LEFT
      // off the back past supLeft. We measure the worse of the two.
      const overRight = com - supRight;            // >0 ⇒ past the right edge
      const overLeft  = supLeft - com;             // >0 ⇒ past the left edge
      margins[i] = Math.max(overRight, overLeft);
    } else {
      // bottom block rests on the TABLE: support is x ≤ 0; the failing edge is the cliff.
      margins[i] = com - 0;                        // >0 ⇒ whole-stack CoM out past the cliff
    }
    if (margins[i] > 1e-12 && firstFail === -1) firstFail = i;
  }
  return { stable: firstFail === -1, firstFail, margins };
}

// The overhang of the TOP block past the cliff (x=0), in book-lengths: its right edge
// = lefts[0] + 1. Returns 0 for an empty stack.
export function topOverhang(lefts){ return lefts.length ? lefts[0] + 1 : 0; }

// The smallest n for which the OPTIMAL single-wide stack overhangs the cliff by STRICTLY
// MORE than `target` book-lengths. (Divergence made concrete: 1→4, 2→31, 3→227.)
export function minBooksFor(target){
  let n = 1; while (maxOverhang(n) <= target) n++;
  return n;
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — proves the four directive claims; the Node twin runs the SAME code.
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest(){
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };
  const EPS = 1e-12;

  // (1) the optimal stack's total overhang = EXACTLY ½·H(n), to machine ε, for n=1..300.
  let worst = 0;
  for (let n = 1; n <= 300; n++){
    const oh = topOverhang(optimalLefts(n));
    worst = Math.max(worst, Math.abs(oh - maxOverhang(n)));
  }
  ok(worst < 1e-12, `optimal overhang = ½·H(n) to machine ε for n≤300 (worst |Δ| ${worst.toExponential(2)})`);

  // (2) CRITICALITY: in the optimal stack, EVERY top-k sub-stack's CoM sits EXACTLY on
  //     the right edge of the block beneath it (|margin| ≈ 0 — on the brink, stable).
  for (const n of [2, 4, 10, 50, 200]){
    const t = supportTest(optimalLefts(n));
    let maxAbsMargin = 0;
    for (let i = 0; i < n; i++) maxAbsMargin = Math.max(maxAbsMargin, Math.abs(t.margins[i]));
    ok(maxAbsMargin < 1e-12, `n=${n}: every sub-stack CoM sits ON its support edge (max |margin| ${maxAbsMargin.toExponential(2)})`);
    ok(t.stable, `n=${n}: the optimal stack is (marginally) stable — no sub-stack past its edge`);
  }

  // (3) DIVERGENCE thresholds — the minimum n to clear 1, 2, 3 book-lengths, AND the
  //     bracket that 3 books cannot clear 1 length but enough books eventually do.
  ok(minBooksFor(1) === 4,   `overhang exceeds 1 book-length first at n=4  (½·H(4)=${maxOverhang(4).toFixed(4)})`);
  ok(minBooksFor(2) === 31,  `overhang exceeds 2 book-lengths first at n=31 (½·H(31)=${maxOverhang(31).toFixed(4)})`);
  ok(minBooksFor(3) === 227, `overhang exceeds 3 book-lengths first at n=227 (½·H(227)=${maxOverhang(227).toFixed(4)})`);
  ok(maxOverhang(3) < 1 && maxOverhang(4) > 1, `½·H(3)=${maxOverhang(3).toFixed(4)} < 1 < ½·H(4)=${maxOverhang(4).toFixed(4)}`);

  // (4) NEG CONTROLS. (a) Nudge the top block 1px (=1/240 book-length) past its limit and
  //     the top-1 sub-stack's CoM crosses block 1's right edge → topple flagged at i=0.
  {
    const n = 6;
    const lefts = optimalLefts(n);
    const onePx = 1 / 240;                               // a literal 1px nudge at 240px/book
    const nudged = lefts.slice(); nudged[0] += onePx;
    const t = supportTest(nudged);
    ok(!t.stable, `nudging the top book 1px (=1/240) past its limit topples (firstFail=${t.firstFail})`);
    ok(t.firstFail === 0, `the failing interface is exactly the nudged one (top book on block 1)`);
    // and a sub-machine-ε nudge also trips it (the brink is genuine, not slop):
    const micro = lefts.slice(); micro[0] += 1e-6;
    ok(!supportTest(micro).stable, `even a 1e-6 nudge past the limit trips the topple (the brink is real)`);
    // (b) the other control: a perfectly-vertical zero-overhang stack stays STABLE.
    const vert = new Array(n).fill(-1);                  // every left at −1 → right edge flush at the cliff
    const tv = supportTest(vert);
    ok(tv.stable, `the vertical zero-overhang stack stays stable (the other control)`);
    ok(Math.abs(topOverhang(vert) - 0) < EPS, `vertical stack overhang = 0`);
  }

  // (5) MONOTONE CRAWL: each added book buys a strictly SMALLER nudge (1/(2k) decreasing),
  //     yet the total never stops growing — the divergence felt as diminishing returns.
  {
    let monotoneDown = true, alwaysGrows = true, nudgeMatches = true;
    let prevGain = Infinity, prevTotal = -1;
    for (let n = 1; n <= 100; n++){
      const total = maxOverhang(n);
      const gain = total - (n > 1 ? maxOverhang(n - 1) : 0);
      if (n > 1 && gain >= prevGain) monotoneDown = false;          // each gain smaller than the last
      if (Math.abs(gain - nudge(n)) > 1e-12) nudgeMatches = false;  // and that gain IS exactly 1/(2n)
      if (total <= prevTotal) alwaysGrows = false;
      prevGain = gain; prevTotal = total;
    }
    ok(monotoneDown, `each new book adds a strictly smaller nudge (1/(2k) shrinks)`);
    ok(nudgeMatches, `the nth book's gain equals exactly nudge(n)=1/(2n)`);
    ok(alwaysGrows, `yet the total overhang strictly grows with every book (never stops)`);
  }

  return { pass, fail, log };
}

/* ── Node bridge. The dual-use guard below is what `forge` strips wholesale when it
   inlines this core into the page (a bare `module`/`require` is undefined in the
   browser anyway). On Node it exposes the surface for the CommonJS path; the real
   Node entry point is core.test.mjs, which `import`s this module (ESM) and runs the
   SAME runSelfTest() — `node overhang/core.test.mjs` exits 0 iff every claim is green.
   ──────────────────────────────────────────────────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { harmonic, maxOverhang, nudge, optimalLefts, comOf, supportTest, topOverhang, minBooksFor, runSelfTest };
}
