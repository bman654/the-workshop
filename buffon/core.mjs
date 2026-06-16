// Buffon's Needles — logic core (pi DROPPED, not computed).
//
// THE WHOLE POINT: a planked wooden FLOOR of parallel seams spaced t apart. Fling (or hold to rain)
// matchstick-needles of length L (L<=t). Each lands at a random center and a random orientation and
// TUMBLES to rest. A needle FLASHES GREEN if its body crosses a seam, stays GREY if it lands clean.
// As the pile of needles grows, a number assembles itself out of the heap: pi ~= 2·L·N / (t·crossings).
// The floor of needles is the hero; the convergence is a by-product you watch emerge.
//
// WHY THE PROOF IS REAL (the geometry is the oracle): a needle is fixed by its center distance d to
// the NEAREST seam (d in [0, t/2]) and its orientation theta. Its body reaches a half-length L/2 to
// each side, projected onto the across-planks axis as (L/2)·sin(theta). So it CROSSES iff
// d <= (L/2)·sin(theta) — a single predicate, the sole authority for both pixels and proof. Averaging
// the crossing indicator over d~Uniform[0,t/2] and theta~Uniform[0,pi):
//     P(cross) = (1/(pi))·∫₀^π min(1, (L/(t))·sin θ) dθ  =  2L/(pi·t)   for L<=t.
// Invert: pi = 2·L / (t·P). Estimate P by crossings/N, and pi ~= 2·L·N/(t·crossings). The constant is
// NOT calculated — it falls out of counting matchsticks. The error shrinks like 1/sqrt(N): the honest,
// slow Monte-Carlo lesson, NOT a fake instant-pi.
//
// THE NEGATIVE CONTROL (randomness is the proof, not decoration): throw every needle at a FIXED angle
// instead of uniform on [0,pi). The crossing rate is then P = (L/t)·|sin θ_fixed|, so the estimate
// converges to 2/|sin θ_fixed| — NOT pi. Perpendicular needles (θ=π/2) give 2.0; the bias drags the
// running estimate clean out of the 1/sqrt(N) tolerance corridor. Uniform orientation is load-bearing.
//
// SOURCING (anti-drift): the page inlines this core byte-for-byte between the BUFFON CORE sentinels;
// core.test.mjs byte-parity-checks the inlined copy in index.html against this file's body.
//
// Zero-dep ESM. Floor units: plank spacing t and needle length L are caller-supplied (require L<=t).

// ===== BUFFON CORE (byte-identical to core.mjs) =====
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

// ── the self-test: prove the three claims numerically ──────────────────────────────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const L = 0.8, t = 1.0;

  // (1) BIG-N inside the Monte-Carlo confidence band: a large uniform run lands the empirical estimate
  // within the 1/sqrt(N) corridor of 2L/(pi t) → pi. (Seeded, so this is deterministic & reproducible.)
  {
    const N = 400000;
    const { pi } = runBatch(makeRng(0xB0FFE5), N, L, t);
    const band = corridorHalfWidth(N, L, t, 4);     // generous 4-sigma band: ~1-in-15000 false fail
    const inBand = isFinite(pi) && Math.abs(pi - Math.PI) <= band;
    ck('1 · big-N lands inside the 4σ Monte-Carlo band of 2L/(pi·t)', inBand,
       'pi≈' + pi.toFixed(5) + '  |err|=' + Math.abs(pi - Math.PI).toExponential(2) + '  band=' + band.toExponential(2));
  }

  // (2) 1/sqrt(N) DECAY across decades: averaging the absolute error over many seeds at N and 100·N,
  // the error must shrink by ≈ sqrt(100) = 10×. We demand the ratio land in [6, 16] — clearly 1/sqrt(N),
  // not flat (would be ~1) and not faster. This is the honest slow-convergence lesson made falsifiable.
  {
    const Nsmall = 2000, Nbig = 200000, trials = 60;
    let eSmall = 0, eBig = 0;
    for (let s = 0; s < trials; s++){
      eSmall += Math.abs(runBatch(makeRng(1000 + s), Nsmall, L, t).pi - Math.PI);
      eBig   += Math.abs(runBatch(makeRng(9000 + s), Nbig,   L, t).pi - Math.PI);
    }
    eSmall /= trials; eBig /= trials;
    const ratio = eSmall / eBig;                    // expect ≈ sqrt(100) = 10
    ck('2 · error shrinks ~1/sqrt(N) across 2 decades (ratio≈10)', ratio >= 6 && ratio <= 16,
       'meanErr(2k)=' + eSmall.toExponential(2) + '  meanErr(200k)=' + eBig.toExponential(2) + '  ratio=' + ratio.toFixed(2));
  }

  // (3) NEGATIVE CONTROL: needles thrown at a FIXED angle (not uniform) bias the estimate AWAY from pi.
  // Perpendicular (θ=π/2): the rate is L/t, so 2LN/(t·crossings) → 2.0, NOT pi. The estimate must land
  // near 2 and FAR from pi — proving uniform orientation is load-bearing, the randomness IS the proof.
  {
    const N = 300000;
    const { pi: biased } = runBatch(makeRng(0x5151), N, L, t, Math.PI / 2);
    const nearTwo = Math.abs(biased - 2) < 0.02;
    const farFromPi = Math.abs(biased - Math.PI) > 1.0;
    ck('3 · negative control: fixed-angle throw biases to 2.0, NOT pi', nearTwo && farFromPi,
       'biased≈' + biased.toFixed(4) + '  (uniform would give pi=' + Math.PI.toFixed(4) + ')');
  }

  // (4) the crossing ORACLE matches the closed-form probability: Monte-Carlo crossing fraction over the
  // reduced (d,theta) space converges to crossProbUniform — the predicate and the formula are one thing.
  {
    const N = 500000, rng = makeRng(0xC0FFEE);
    let hit = 0;
    for (let i = 0; i < N; i++) if (toss(rng, L, t).hit) hit++;
    const empirical = hit / N, exact = crossProbUniform(L, t);
    ck('4 · crossing oracle ≈ closed-form P=2L/(pi·t)', Math.abs(empirical - exact) < 5e-3,
       'P_emp=' + empirical.toFixed(5) + '  P_exact=' + exact.toFixed(5));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END BUFFON CORE =====

export { crosses, crossProbUniform, crossProbFixedAngle, piEstimate, toss, makeRng, runBatch, corridorHalfWidth, runSelfTest };
