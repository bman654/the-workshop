// === CORE BEGIN ===
// Two Ways to π — ONE number, π, reached two maximally different ways on a single ruler.
//
// WHAT THIS MODULE IS. Two DISJOINT cores, lifted VERBATIM from two existing rooms that share NO code,
// asked the same question — "where is π?" — and answering it on the SAME number-line by two opposite
// kinds of truth. One core is THE SPELL (collisions/core.mjs, Galperin's billiard): two blocks on a
// frictionless lane bouncing off a wall, mass ratio M/m = 100^k, the TOTAL collision count is EXACTLY
// the first k+1 digits of π — 3, 31, 314, 3141 — an integer, computed once, never moving. The other is
// THE STAMMER (buffon/core.mjs, Buffon's needles): matchstick-needles rained on a planked floor, the
// fraction that cross a seam gives π = 2·L·N/(t·crossings) — a probabilistic estimate that converges
// into a 1/√N corridor and NEVER equals π exactly. Exact-and-instant vs converges-into-a-band. Same π.
//
// THE THIN ADAPTER (the ONLY new logic besides runSelfTest). solveBoth(N, k, seed) drives BOTH cores
// from one shared notion of "how precise":
//   • STAMMER: runBatch(makeRng(seed), N, L=0.8, t=1.0) → {piHat, crossings}; the DISPLAYED corridor is
//     hw = corridorHalfWidth(N, 0.8, 1.0, 1.96) (the ~95% band a visitor sees on the line).
//   • SPELL: eventCount(RATIOS[k], 1) → exactCount; goldDigits = piPrefix(k+1) (the locked gold digits).
//   • THE AGREEMENT: bandContainsPi = isFinite(piHat) && (piHat−hw) ≤ π ≤ (piHat+hw) — the latch is
//     "the corridor STRADDLES the gold bar," NEVER "the caret === π." The two worlds collapse onto one
//     ruler; the moment the guess's band first holds the certainty is the climax.
// L=0.8, t=1.0 EVERYWHERE (matches buffon's own self-test) so the displayed band and the needle floor agree.
//
// HONEST SCOPE (non-negotiable, stated in the page lede AND here). The claim is NOT that needles ARE
// billiards. It is: ONE π is reachable two maximally different ways — exact-and-instant (a count) and
// converging-into-a-corridor (an estimate that never equals it) — and the agreement is what you watch.
// THE SPELL is exact (integer ===, never moves); THE STAMMER is an estimate with visible error; the
// latch is "band contains π," never "caret === π." The asymmetry is the point, not a flaw.
//
// THE CLAIMS IT MAKES CHECKABLE (re-proven by both the in-page pill and core.test.mjs):
//   1. STAMMER converges INTO its corridor — a seeded big-N run lands |piHat−π| ≤ corridorHalfWidth(N,..,4σ)
//      (the GENEROUS gate band; the page DISPLAYS the 1.96σ band). It approaches π, never equals it.
//   1b. the band actually SHRINKS ~1/√N — meanErr decade-ratio over two decades ∈ [6,16].
//   2. SPELL is EXACT — for every ratio 100^k in RATIOS, eventCount === closedCount === piPrefix(k+1)
//      EXACTLY (3, 31, 314, 3141). An integer count, not a fit.
//   3. THE AGREEMENT is real — at the converged N the gold bar sits inside [piHat−hw, piHat+hw].
//   NEG A (Buffon): fixed-angle θ=π/2 throw → piHat → 2.0, |2.0−π|>1, the band never contains π.
//   NEG B (Clack): naiveFloorCount → 4 not 3 (the boundary trap), isPiPrefix(4)=false — the spell reads
//      the WRONG digit. Both neg-controls FAIL the gate while both correct paths PASS; a vacuous "they
//      always agree" checker PASSES leg 3 but FAILS both controls.
//   BYTE-TWIN PARITY — index.html's inlined CORE slab === core.mjs CORE char-for-char.
//
// SINGLE-SOURCE DISCIPLINE. The two cores below are lifted byte-faithfully from their rooms and NEVER
// call each other (anti-circularity: the Buffon solver never names a Clack fn and vice-versa). The
// adapter sits on TOP of them. The byte-twin parity leg proves index.html's inlined slab is this module.

// ══ CORE A: PROBABILITY — Buffon's needles, lifted VERBATIM from buffon/core.mjs ══════════════════════
"use strict";

// A landed needle, reduced to the only two numbers that decide a crossing:
//   d     = distance from the needle's CENTER to the NEAREST seam, in [0, t/2]
//   theta = orientation in [0, pi)  (sin is symmetric across pi, so [0,pi) covers all lines)
// CROSSES iff the across-planks half-extent (L/2)·sin(theta) reaches the seam: d <= (L/2)·sin(theta).
// This single predicate is the sole oracle — the canvas colours a needle by it, and the proof counts by it.
function crosses(d, theta, L){
  return d <= (L / 2) * Math.abs(Math.sin(theta));
}

// Exact crossing PROBABILITY for the SHORT-needle regime L<=t, orientation uniform on [0,pi):
//   P = 2L/(pi·t).  (Derived by averaging the crossing indicator over d~U[0,t/2], theta~U[0,pi).)
function crossProbUniform(L, t){
  return (2 * L) / (Math.PI * t);
}

// Crossing probability when EVERY needle is thrown at a FIXED orientation thetaFixed (the negative
// control): P = (L/t)·|sin thetaFixed|. (No theta-average — the orientation is degenerate.)
function crossProbFixedAngle(L, t, thetaFixed){
  return (L / t) * Math.abs(Math.sin(thetaFixed));
}

// pi estimate from a tally: pi ~= 2·L·N / (t·crossings). Returns NaN before the first crossing.
function piEstimate(N, crossings, L, t){
  if (crossings <= 0) return NaN;
  return (2 * L * N) / (t * crossings);
}

// One physical toss. rng() -> [0,1). If thetaFixed is a finite number, the orientation is forced to
// it (the biased control); otherwise theta is uniform on [0,pi). Returns the full landed state so the
// renderer can draw the matchstick AND decide its colour from the SAME numbers the proof counts.
function toss(rng, L, t, thetaFixed){
  const theta = (typeof thetaFixed === 'number' && isFinite(thetaFixed))
    ? thetaFixed
    : rng() * Math.PI;
  const d = rng() * (t / 2);                 // center distance to nearest seam, U[0, t/2]
  return { theta, d, hit: crosses(d, theta, L) };
}

// A deterministic, seedable PRNG (mulberry32) so the Node twin and the page agree bit-for-bit.
function makeRng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Run a batch of N tosses; return {N, crossings, pi}. thetaFixed (finite) selects the biased control.
function runBatch(rng, N, L, t, thetaFixed){
  let crossings = 0;
  for (let i = 0; i < N; i++){
    if (toss(rng, L, t, thetaFixed).hit) crossings++;
  }
  return { N, crossings, pi: piEstimate(N, crossings, L, t) };
}

// 1/sqrt(N) tolerance corridor half-width for the pi estimate, in absolute pi-units, at confidence z.
// crossings ~ Binomial(N, p), p = 2L/(pi t). pi_hat = 2LN/(t·crossings) = pi·(N·p)/crossings, so by the
// delta method SD(pi_hat) ≈ pi·sqrt((1−p)/(N·p)) — exactly a 1/sqrt(N) law. half-width = z·SD.
function corridorHalfWidth(N, L, t, z){
  if (N <= 0) return Infinity;
  const p = crossProbUniform(L, t);
  return (z || 1.96) * Math.PI * Math.sqrt((1 - p) / (N * p));
}

// ══ CORE B: COUNTING — Galperin's billiard, lifted VERBATIM from collisions/core.mjs ══════════════════
// Two blocks on a frictionless lane + a wall on the right. The HEAVY block M is shoved into the LIGHT
// block m=1 between M and the wall. Count EVERY collision (block-block + block-wall) until the system
// separates forever. For a mass ratio M/m = 100^k the total count is the first k+1 digits of π:
// 3, 31, 314, 3141 (Galperin 2003, "Playing pool with π"). Fully disjoint from CORE A.

// Exact elastic block-block collision (1-D, masses M & m, velocities vH & vL).
// Returns [vH', vL']. Conserves momentum and KE exactly (to machine ε).
function elasticBlockBlock(M, m, vH, vL) {
  return [
    ((M - m) * vH + 2 * m * vL) / (M + m),
    ((m - M) * vL + 2 * M * vH) / (M + m),
  ];
}

// ── (1) THE CLOSED FORM — the wedge-unfolding count, NOT a stepped loop ───────
// Unfold the two reflecting walls (the rigid wall + the elastic block) into a
// wedge of half-angle θ = atan√(m/M); the trajectory is a straight line bouncing
// inside the wedge, and the number of bounces before it escapes is ⌈π/θ⌉ − 1.
//
// CRITICAL BOUNDARY NOTE: ⌈·⌉−1, NOT ⌊·⌋. At the 1:1 boundary θ = π/4 exactly,
// so π/θ = 4 — ⌊4⌋ = 4 (WRONG: the true count is 3) but ⌈4⌉−1 = 3 (right). At
// 3:1, θ = atan√(1/3) = π/6, π/θ = 6 — ⌊6⌋ = 6 (WRONG) but ⌈6⌉−1 = 5 (right).
// The self-test pins this trap explicitly.
function closedCount(M, m) {
  const theta = Math.atan(Math.sqrt(m / M));
  return Math.ceil(Math.PI / theta) - 1;
}

// The naive (WRONG-at-boundary) formula, exported ONLY so the self-test can prove
// it disagrees with the truth at the integer-π/θ ratios. Do not use it for real.
function naiveFloorCount(M, m) {
  const theta = Math.atan(Math.sqrt(m / M));
  return Math.floor(Math.PI / theta);
}

// ── (2) VELOCITY-SPACE COUNT-ONLY GROUND TRUTH ───────────────────────────────
// No positions: just alternate "light hits wall" (vL flips sign) and "heavy
// catches light" (elastic exchange), starting from vH=1, vL=0, until separation.
// Separation = light not moving toward the wall (vL ≤ 0) AND heavy not faster
// than light (vH ≤ vL). This is the literal classic mechanics, counted.
function velocityCount(M, m) {
  let vH = 1, vL = 0, n = 0;
  // hard cap is generous: count for 100^4 is 31415, far under the guard.
  for (let g = 0; g < 2e8; g++) {
    if (vL <= 0 && vH <= vL) break;             // separated forever
    if (vL > 0) { vL = -vL; n++; }              // light → wall (sign flip)
    else { [vH, vL] = elasticBlockBlock(M, m, vH, vL); n++; }  // heavy catches light
  }
  return n;
}

// ── (3) THE EVENT-DRIVEN ENGINE (real positions; drives the visuals) ─────────
// Geometry: lane on [0, LANE]; wall at x = LANE. Each block has a LEFT-face x and
// a width. Heavy's RIGHT face (xH+wH) meets light's LEFT face (xL) for block-block;
// light's RIGHT face (xL+wL) meets the wall (LANE) for a wall hit. We compute the
// analytic time to whichever happens first, glide exactly to it, resolve it, emit
// an event, and repeat. No time-stepping ⇒ no float drift; the count is exact.
//
// Returns { events, count, M, m, settledVH, settledVL } where events is an ordered
// array of { i, kind:'block'|'wall', t, tAbs, xH, xL, vH, vL } — t is the gap to
// the PREVIOUS event, tAbs the cumulative time, positions/velocities AFTER resolve.
function simulate(M, m, opts = {}) {
  const LANE = opts.LANE ?? 1000;
  const wH = opts.wH ?? 60;          // heavy width (world units)
  const wL = opts.wL ?? 34;          // light width
  const xH0 = opts.xH ?? 250;        // heavy LEFT face
  const xL0 = opts.xL ?? 700;        // light LEFT face
  const vH0 = opts.vH ?? 1;          // shove velocity (heavy)
  const EPS = 1e-12;

  let xH = xH0, xL = xL0, vH = vH0, vL = 0;
  const events = [];
  let tAbs = 0, guard = 0;
  const GUARD_MAX = opts.guardMax ?? 6e7;

  function timeBlockBlock() {
    const gap = xL - (xH + wH);             // free space between the faces
    const closing = vH - vL;                 // >0 means they are approaching
    if (closing <= EPS) return null;
    const t = gap / closing;
    return t >= -1e-9 ? Math.max(0, t) : null;
  }
  function timeWallHit() {
    if (vL <= EPS) return null;              // light must move toward the wall
    const t = (LANE - (xL + wL)) / vL;
    return t >= -1e-9 ? Math.max(0, t) : null;
  }

  while (guard++ < GUARD_MAX) {
    const tB = timeBlockBlock();
    const tW = timeWallHit();
    let best = null;
    if (tB !== null) best = { t: tB, kind: 'block' };
    if (tW !== null && (best === null || tW < best.t)) best = { t: tW, kind: 'wall' };
    if (!best) break;                         // nothing closing → settled

    // glide exactly to the event
    xH += vH * best.t;
    xL += vL * best.t;
    tAbs += best.t;
    if (best.kind === 'block') {
      [vH, vL] = elasticBlockBlock(M, m, vH, vL);
    } else {
      vL = -vL;
    }
    events.push({
      i: events.length, kind: best.kind, t: best.t, tAbs,
      xH, xL, vH, vL,
    });

    // settled? light not heading to the wall AND heavy not catching light
    if (vL <= 1e-9 && vH <= vL + EPS) break;
  }

  return { events, count: events.length, M, m, settledVH: vH, settledVL: vL,
           geom: { LANE, wH, wL, xH: xH0, xL: xL0 } };
}

// Convenience: the event-driven engine's emitted count only (drives the proof).
function eventCount(M, m, opts) {
  return simulate(M, m, opts).count;
}

// ── π-prefix helpers (for the prophecy + neg-control) ─────────────────────────
// The first N+1 digits of π as an integer: 3, 31, 314, 3141, 31415, …
const PI_DIGITS = '3141592653589793';
function piPrefix(n) {                 // n = number of leading digits
  return parseInt(PI_DIGITS.slice(0, n), 10);
}
// Is `count` exactly some leading-digits prefix of π? (used by the neg-control)
function isPiPrefix(count) {
  const s = String(count);
  return s.length >= 1 && s === PI_DIGITS.slice(0, s.length);
}

// The four canonical π-power ratios and their counts, for UI + tests.
const RATIOS = [1, 100, 10000, 1000000];

// ══ THE ADAPTER (the only new logic) — one "precision" sense drives BOTH disjoint cores ═══════════════
const BUF_L = 0.8, BUF_T = 1.0;       // needle length / plank gap — matches buffon's own self-test.

// solveBoth(N, k, seed): from one precision sense, run BOTH cores and report the shared ruler readout.
//   N    — the Buffon toss count (drives the corridor width & the caret).
//   k    — the Clack precision index 0..3 → mass ratio 100^k → k+1 gold digits.
//   seed — the Buffon PRNG seed (determinism).
// Returns BOTH worlds' raw quantities + the agreement verdict. thetaFixed (finite) and naive flip the
// two neg-controls; they are passed straight through to the unchanged cores.
function solveBoth(N, k, seed, opts = {}) {
  const thetaFixed = opts.thetaFixed;       // finite ⇒ Buffon neg-control (bias the throw)
  const naive = !!opts.naive;               // true   ⇒ Clack neg-control (use the wrong count)
  // STAMMER side — its own unchanged core:
  const batch = runBatch(makeRng(seed >>> 0), N, BUF_L, BUF_T, thetaFixed);
  const piHat = batch.pi;
  const crossings = batch.crossings;
  const hw = corridorHalfWidth(N, BUF_L, BUF_T, 1.96);     // the DISPLAYED ~95% corridor half-width
  const bandLo = isFinite(piHat) ? piHat - hw : NaN;
  const bandHi = isFinite(piHat) ? piHat + hw : NaN;
  // SPELL side — its own unchanged core. naive flips closedCount→naiveFloorCount (the boundary trap).
  const M = RATIOS[Math.max(0, Math.min(RATIOS.length - 1, k))];
  const exactCount = naive ? naiveFloorCount(M, 1) : eventCount(M, 1);
  const goldDigits = piPrefix(k + 1);                       // the locked gold digits 3,31,314,3141
  const spellExact = !naive && (exactCount === goldDigits); // is the spell reading the right digits?
  // THE AGREEMENT: the corridor STRADDLES π (the gold bar) — NOT "caret === π".
  const bandContainsPi = isFinite(piHat) && bandLo <= Math.PI && Math.PI <= bandHi;
  return {
    N, k, seed: seed >>> 0, thetaFixed: thetaFixed, naive,
    // STAMMER (an estimate with visible error):
    piHat, crossings, hw, bandLo, bandHi, bandContainsPi,
    // SPELL (exact, locked):
    M, exactCount, goldDigits, spellExact,
    // the shared truth:
    PI: Math.PI,
  };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ══════════════════
function runSelfTest(){
  let pass = 0, total = 0; const detail = [];
  const ck = (ok, label) => { total++; if(ok) pass++; else detail.push(label); };

  // LEG 1 — STAMMER converges INTO its corridor (honest, never instant equality). Seeded big-N run lands
  // |piHat − π| ≤ corridorHalfWidth(N, .., 4σ) — the GENEROUS gate band (~1-in-15000 false-fail). The PAGE
  // displays the 1.96σ band; this gate uses the generous band buffon's own self-test uses.
  {
    const N = 400000;
    const r = solveBoth(N, 3, 0xB0FFE5);
    const band4 = corridorHalfWidth(N, BUF_L, BUF_T, 4);
    const inBand = isFinite(r.piHat) && Math.abs(r.piHat - Math.PI) <= band4;
    const notEqual = r.piHat !== Math.PI;          // it converges INTO the band, never EQUALS π
    ck(inBand && notEqual,
       'stammer-converges(piHat=' + (isFinite(r.piHat)?r.piHat.toFixed(5):'nan') + ',|err|=' + Math.abs(r.piHat-Math.PI).toExponential(1) + ',band4=' + band4.toExponential(1) + ')');
  }

  // LEG 1b — the band actually SHRINKS ~1/√N: meanErr decade-ratio over two decades ∈ [6,16] (buffon's leg 2).
  {
    const Nsmall = 2000, Nbig = 200000, trials = 60;
    let eSmall = 0, eBig = 0;
    for(let s = 0; s < trials; s++){
      eSmall += Math.abs(solveBoth(Nsmall, 3, 1000 + s).piHat - Math.PI);
      eBig   += Math.abs(solveBoth(Nbig,   3, 9000 + s).piHat - Math.PI);
    }
    eSmall /= trials; eBig /= trials;
    const ratio = eSmall / eBig;
    ck(ratio >= 6 && ratio <= 16, 'band-shrinks~1/sqrtN(ratio=' + ratio.toFixed(2) + ')');
  }

  // LEG 2 — SPELL is EXACT: for every ratio 100^k, eventCount === closedCount === piPrefix(k+1) EXACTLY.
  {
    let allExact = true; const seen = [];
    for(let k = 0; k < RATIOS.length; k++){
      const M = RATIOS[k];
      const ev = eventCount(M, 1), cc = closedCount(M, 1), want = piPrefix(k + 1);
      seen.push(ev);
      if(!(ev === cc && cc === want)) allExact = false;
    }
    ck(allExact, 'spell-exact(' + seen.join(',') + ')');
  }

  // LEG 3 — THE AGREEMENT is real: at the converged N the gold bar sits inside [piHat−hw, piHat+hw].
  {
    const r = solveBoth(400000, 3, 0xB0FFE5);     // a seed that converges well inside the 1.96σ band
    ck(r.bandContainsPi && r.spellExact, 'agreement(bandContainsPi=' + r.bandContainsPi + ',spellExact=' + r.spellExact + ')');
  }

  // NEG A (Buffon) — fixed-angle θ=π/2 throw biases piHat → 2.0, NOT π; the band never contains π.
  {
    const r = solveBoth(300000, 3, 0x5151, { thetaFixed: Math.PI / 2 });
    const nearTwo = Math.abs(r.piHat - 2) < 0.02;
    const farFromPi = Math.abs(r.piHat - Math.PI) > 1.0;
    ck(nearTwo && farFromPi && !r.bandContainsPi,
       'neg-A-buffon(piHat=' + r.piHat.toFixed(4) + ',bandContainsPi=' + r.bandContainsPi + ')');
  }

  // NEG B (Clack) — naiveFloorCount → 4 not 3 at the 1:1 boundary; isPiPrefix(4)=false; the spell is WRONG.
  {
    const r = solveBoth(400000, 0, 0xB0FFE5, { naive: true });   // k=0 ⇒ ratio 1:1, true count 3
    const naiveIsFour = r.exactCount === 4;
    const truthIsThree = closedCount(1, 1) === 3;
    const broke = (r.exactCount !== r.goldDigits) && !isPiPrefix(4) && !r.spellExact;
    ck(naiveIsFour && truthIsThree && broke,
       'neg-B-clack(naive=' + r.exactCount + ',truth=3,spellExact=' + r.spellExact + ')');
  }

  return { pass, total, ok: pass === total && total > 0, detail };
}

export {
  // Buffon core (CORE A)
  crosses, crossProbUniform, crossProbFixedAngle, piEstimate, toss, makeRng, runBatch, corridorHalfWidth,
  // Clack core (CORE B)
  elasticBlockBlock, closedCount, naiveFloorCount, velocityCount, simulate, eventCount,
  piPrefix, isPiPrefix, PI_DIGITS, RATIOS,
  // the adapter + self-test
  BUF_L, BUF_T, solveBoth, runSelfTest,
};
// === CORE END ===

// Dual-use guard: when run directly via `node core.mjs`, print the self-test (the page inlines the CORE
// region above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity).
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('Two Ways to π — core self-test: ' + r.pass + '/' + r.total + (r.ok ? ' ✓' : ' ✗ ' + r.detail.join(',')));
  process.exit(r.ok ? 0 : 1);
}
