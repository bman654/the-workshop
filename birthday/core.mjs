// The Birthday Bench — logic core (the probability curve is DROPPED, never drawn).
//
// THE WHOLE POINT: a PEGBOARD of d brass pegs (d = the calendar's length, 365 by default).
// Guests walk in one at a time; each reaches up to the peg for their birthday and hangs a
// luggage-tag. The first time two guests reach for the SAME peg, the peg RINGS (a clang). The
// surprise the bench stages is SPATIAL, not statistical: the bench fills with only ~23 chairs
// before the first ring — not the ~180 you'd guess from "half of 365". You watch the law happen.
//
// WHY THE NUMBERS ARE REAL (the seating process IS the oracle): a "party" is a stream of guests,
// each given a uniformly-random peg in [0,d) by the SAME seeded PRNG the page consumes to walk
// them. The first guest to collide with an earlier one ends the party. Two facts are EXACT, not
// sampled:
//   • pNoClash(n,d) = ∏_{i=0..n-1} (d−i)/d  — the probability the first n guests are all distinct
//     (the i-th guest must miss the i pegs already taken). pClash = 1 − pNoClash.
//   • thresholdN(d) = the SMALLEST n with pClash(n,d) ≥ ½ — the MEDIAN first-clash guest. For the
//     ordinary year d=365 this is 23, because P(clash @ 23) = 0.5073 > ½ while P(@ 22) = 0.4757 < ½.
// thresholdN is the MEDIAN of the first-clash distribution, an INTEGER. (The MEAN is a different
// quantity, E[N] = 1.2533·√d = 23.94 for d=365 — we never assert that; only the median.)
//
// THE √d LAW (felt, never plotted): thresholdN grows like √d, with a ~1.2 constant —
// thresholdN(365)/√365 = 23/19.10 = 1.204 ∈ (1.15, 1.30). Across a ladder of d-values the
// log-log slope of thresholdN vs d sits at ≈ ½ — that is the √d trend, asserted as a TREND
// (0.45 < slope < 0.55), not a single point.
//
// THE NEGATIVE CONTROL (the degenerate calendar): d = 1 — a one-day world. Every guest gets the
// only peg, so guest 2 ALWAYS collides with guest 1: pClash(2,1) = 1 and thresholdN(1) = 2,
// deterministic. The naive-guess control lives on the page (the "183" plate); the core proves the
// guess is wrong by an order of magnitude via thresholdN itself.
//
// SOURCING (anti-drift): the page inlines this core byte-for-byte between the BIRTHDAY CORE
// sentinels; core.test.mjs byte-parity-checks the inlined copy in index.html against this body.
// The seating stream (pickPeg via makeRng) is SACROSANCT — only seatUntilClash/seatSteps consume
// it, so an on-screen party byte-matches a twin replay of the same seed.
//
// Zero-dep ESM.

// ===== BIRTHDAY CORE (byte-identical to core.mjs) =====
"use strict";

// A deterministic, seedable PRNG (xorshift32) so the Node twin and the page agree bit-for-bit.
// seed === 0 is reseeded to the golden ratio constant (xorshift32 is stuck at 0 otherwise).
function makeRng(seed){
  let s = seed >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return function(){
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;   // [0, 1)
  };
}

// Draw one peg index in [0, d): a uniform birthday. The SOLE consumer-facing draw off the seeded
// stream — the page never rolls its own birthday; it consumes pickPeg via seatSteps/seatUntilClash.
function pickPeg(rng, d){ return (rng() * d) | 0; }

// EXACT probability the first n guests are all on DISTINCT pegs:
//   pNoClash(n,d) = ∏_{i=0..n-1} (d−i)/d.
// n>d ⇒ 0 (pigeonhole: more guests than pegs forces a clash). n≤1 ⇒ 1 (no pair yet).
function pNoClash(n, d){
  if (n > d) return 0;
  let p = 1;
  for (let i = 0; i < n; i++) p *= (d - i) / d;
  return p;
}

// EXACT probability that at least one clash has occurred among the first n guests.
function pClash(n, d){ return 1 - pNoClash(n, d); }

// thresholdN(d): the SMALLEST n with pClash(n,d) ≥ ½ — the MEDIAN first-clash guest (an integer).
// Climbs n from 2; bounded by d+1 (a clash is forced by guest d+1 at the latest).
function thresholdN(d){
  for (let n = 2; n <= d + 1; n++) if (pClash(n, d) >= 0.5) return n;
  return d + 1;   // unreachable for d ≥ 1
}

// Seat guests off the seeded stream until two land on the SAME peg; return the count of guests
// seated when the FIRST clash rang (the first-clash N for this party). cap bounds the loop.
function seatUntilClash(rng, d, cap){
  const taken = new Map();              // peg → the guest index that took it
  const lim = cap || (d + 2);
  for (let g = 1; g <= lim; g++){
    const peg = pickPeg(rng, d);
    if (taken.has(peg)) return g;       // g is the first-clash count (this guest collided)
    taken.set(peg, g);
  }
  return lim;                           // capped (only possible if cap < the forced clash)
}

// A GENERATOR that walks the seating ONE guest at a time, yielding the full landed state the page
// dresses: {guest, peg, clash, with}. `clash` is true on the first repeat; `with` is the earlier
// guest index holding that peg (or 0). Stops AFTER yielding the clash. Same seeded stream as
// seatUntilClash — so the page consumes THIS, never drawing its own birthdays.
function* seatSteps(rng, d, cap){
  const taken = new Map();
  const lim = cap || (d + 2);
  for (let g = 1; g <= lim; g++){
    const peg = pickPeg(rng, d);
    const clash = taken.has(peg);
    yield { guest: g, peg, clash, with: clash ? taken.get(peg) : 0 };
    if (clash) return;
    taken.set(peg, g);
  }
}

// ── the self-test: the eight exact claims this bench stakes ───────────────────────────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // (1) thresholdN(365) === 23 — the famous answer, exact.
  {
    const t = thresholdN(365);
    ck('1 · thresholdN(365) === 23 (the median first-clash)', t === 23, 'thresholdN(365)=' + t);
  }

  // (2) P(clash @ 23) ≈ 0.507297 > ½ — just over the line.
  {
    const p = pClash(23, 365);
    ck('2 · P(clash @ 23) = 0.5073 > ½', p > 0.5 && Math.abs(p - 0.507297) < 1e-5,
       'P(@23)=' + p.toFixed(6));
  }

  // (3) P(clash @ 22) ≈ 0.475695 < ½ — the guest before crosses below.
  {
    const p = pClash(22, 365);
    ck('3 · P(clash @ 22) = 0.4757 < ½', p < 0.5 && Math.abs(p - 0.475695) < 1e-5,
       'P(@22)=' + p.toFixed(6));
  }

  // (4) THE SEATING PROCESS converges to the EXACT P: a Monte-Carlo of the SAME xorshift32 seating
  // (deterministic seed, N≈200k parties) matches pClash(n,365) for every n≤40 within tol = 5/√N.
  // This is the page's oracle proven against the closed form — the pixels and the proof are one.
  {
    const N = 200000, d = 365, maxN = 40;
    const rng = makeRng(0x1A2B3C4D);
    const clashByN = new Array(maxN + 1).fill(0);   // clashByN[k] = parties whose first-clash count ≤ k
    for (let t = 0; t < N; t++){
      const fc = seatUntilClash(rng, d, maxN + 2);
      // record "a clash had occurred by guest k" for every k ≥ fc, up to maxN
      for (let k = fc; k <= maxN; k++) clashByN[k]++;
    }
    const tol = 5 / Math.sqrt(N);
    let worst = 0, worstN = 0;
    for (let n = 2; n <= maxN; n++){
      const emp = clashByN[n] / N, exact = pClash(n, d);
      const dev = Math.abs(emp - exact);
      if (dev > worst){ worst = dev; worstN = n; }
    }
    ck('4 · seating Monte-Carlo (N=200k) === exact pClash(n,365) ∀ n≤40', worst <= tol,
       'maxdev=' + worst.toExponential(2) + ' @n=' + worstN + '  tol=' + tol.toExponential(2));
  }

  // (5) NEGATIVE CONTROL — the one-day calendar d=1: guest 2 ALWAYS clashes guest 1, deterministic.
  {
    const ok = pClash(2, 1) === 1 && thresholdN(1) === 2;
    ck('5 · neg-control d=1: pClash(2,1)===1 && thresholdN(1)===2', ok,
       'pClash(2,1)=' + pClash(2, 1) + '  thresholdN(1)=' + thresholdN(1));
  }

  // (6) THE √d TREND — log-log slope of thresholdN vs d over a ladder ≈ ½ (asserted as a band).
  {
    const ds = [64, 128, 256, 365, 512, 1024, 2048, 4096];
    const xs = ds.map(d => Math.log(d)), ys = ds.map(d => Math.log(thresholdN(d)));
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++){ sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    const slope = sxy / sxx;
    ck('6 · log-log slope of thresholdN vs d ≈ ½ (the √d trend)', slope > 0.45 && slope < 0.55,
       'slope=' + slope.toFixed(4));
  }

  // (7) THE 1.2 CONSTANT ANCHOR: thresholdN(365)/√365 ∈ (1.15, 1.30).
  {
    const c = thresholdN(365) / Math.sqrt(365);
    ck('7 · thresholdN(365)/√365 ∈ (1.15, 1.30) — the ~1.2 constant', c > 1.15 && c < 1.30,
       'c=' + c.toFixed(4));
  }

  // (8) MC MEDIAN first-clash === 23: the median of the seating process's first-clash count,
  // sampled deterministically, lands exactly on thresholdN(365). (Median = smallest k with ≥½ of
  // parties clashed by guest k — the EMPIRICAL twin of thresholdN.)
  {
    const N = 200000, d = 365;
    const rng = makeRng(0x55AA55AA);
    const counts = [];
    for (let t = 0; t < N; t++) counts.push(seatUntilClash(rng, d, d + 2));
    counts.sort((a, b) => a - b);
    const median = counts[(N / 2) | 0];   // upper-median: smallest k with ≥ half clashed by k
    ck('8 · Monte-Carlo median first-clash === 23', median === 23, 'MC median=' + median);
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END BIRTHDAY CORE =====

export { makeRng, pickPeg, pNoClash, pClash, thresholdN, seatUntilClash, seatSteps, runSelfTest };
