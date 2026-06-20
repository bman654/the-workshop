// The Benford Mill — logic core (Benford's law DROPPED out of a grinding mill, not asserted).
//
// THE WHOLE POINT: a hand-cranked brass grain mill. Pour in a hopper of grains, each a plain
// uniform number in ONE decade (1..10). Turn the crank: every pass MULTIPLIES every grain by a
// random factor. After a while the LEADING digits of the milled grains are not flat at 1/9 each —
// they fall into Benford's law: digit d leads with probability P(d) = log10(1 + 1/d). A 1 leads
// ~30.1% of the time, a 9 only ~4.6%. The nine bins fill into the descending gold staircase, and
// a grabbable LOG-WHEEL shows WHY: a grain's MANTISSA frac(log10 x) smears UNIFORMLY around a
// circular log scale, and the arc that digit d subtends on that wheel IS its Benford height.
//
// WHY THE PROOF IS REAL (the closed form is exact; the fit is an honest statistic):
//   • EXACT, no Monte-Carlo: P(d) = log10(d+1) − log10(d) is the WIDTH of digit d's interval on the
//     mantissa line [0,1). Those nine widths telescope to log10(10) − log10(1) = 1 EXACTLY. P(d) is
//     literally the length of an arc — closedForm(d) === (log10(d+1) − log10(d)) to machine epsilon.
//   • The wheel's wedge for d and the bin's gold reference height are BOTH drawn from band(d) — one
//     oracle. The staircase IS the wheel's shadow. (Self-test checks 1–3 forbid these views drifting.)
//   • The MILL is the ONLY stochastic part. Repeated multiplication ADDS the mantissas (mod 1) of the
//     factors; by equidistribution the sum smears toward Uniform[0,1) on the log circle, so leading
//     digits land at the Benford frequencies. We do NOT assert convergence — we MILL real grains and
//     report a χ² goodness-of-fit verdict: at the pinned gate seed the milled bins do NOT reject
//     Benford (χ²=1.15 ≪ 15.51 at α=.05). The honesty leg proves the mean χ² stays ≈ df=8 across
//     budgets — an honest fit that does NOT collapse to a fake "exact" zero.
//
// THE NEGATIVE CONTROL (multiplicativity is the cause, not decoration): flip the mill from MULTIPLY
// to ADD. The SAME factor stream is reused — only the operator changes. Adding ~1 per pass 80 times
// shoves every grain into the 80–90 range, so nearly all of them lead with 8: the bins collapse onto
// one digit, the gold curve stops fitting, and χ² explodes past 17,000 (Benford REJECTED). A second
// control: a tight U(1,2) source with no milling — almost everything already leads with 1.
//
// SOURCING (anti-drift): index.html inlines this core byte-for-byte between the BENFORD-MILL CORE
// sentinels; core.test.mjs byte-parity-checks the inlined copy against this file's body.
//
// Zero-dep ESM. Deterministic & seedable — identical seeds ⇒ identical mill, no Math.random in the path.

// ===== BENFORD-MILL CORE (byte-identical to core.mjs) =====
"use strict";

// ── seedable PRNG (the estate idiom: xmur3 string-hash → mulberry32 stream) ──────────────────────
// makeRng accepts a number OR a string; strings are hashed so per-pass streams (millSeed+'|'+pass)
// are well-separated. The Node twin and the page agree bit-for-bit.
function xmur3(str){
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function(){
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seed){
  const s = xmur3(String(seed));
  return mulberry32(s());
}

// ── constants (single source for the page AND the tests) ─────────────────────────────────────────
const GRAINS_DEFAULT = 1500;
const PASSES_DEFAULT  = 80;
const GRAINS_CAP      = 20000;
const PLOT_CAP        = 600;          // the wheel plots at most this many dots; its KS/χ² use the same sample
const GATE_HOP_SEED   = 7068;         // pinned hopper seed for the deterministic gate (self-test check 4)
const GATE_MILL_SEED  = 12158;        // pinned mill seed: χ²=1.15 ≪ 15.51 — well inside the band, an honest fit
const ALPHA = 0.05;
const DF = 8;
const TAU = 2 * Math.PI;

// ── the exact math spine (the oracle for BOTH the bins and the wheel) ─────────────────────────────
// Benford probability for leading digit d: the closed form. Telescopes to 1 over d=1..9 EXACTLY.
function closedForm(d){ return Math.log10(1 + 1 / d); }
const BENFORD_BINS = [1,2,3,4,5,6,7,8,9].map(closedForm);

// mantissa(x) = frac(log10|x|) in [0,1) — a grain's position on the log scale.
function mantissa(x){
  const l = Math.log10(Math.abs(x));
  return l - Math.floor(l);
}
// leading (most-significant) decimal digit of x, 1..9 (0 only for non-finite/zero).
function leadingDigit(x){
  if (!isFinite(x) || x === 0) return 0;
  return Math.floor(Math.abs(x) / 10 ** Math.floor(Math.log10(Math.abs(x))));
}
// wheelAngle maps a mantissa m∈[0,1) to a screen angle: m=0 at 12 o'clock, increasing clockwise so
// the wedges read 1,2,…,9 like the bins left-to-right.
function wheelAngle(m){ return -Math.PI / 2 + m * TAU; }

// band(d): the SINGLE description of digit d shared by the wheel wedge and the bin's gold tick.
// arcFrac is the width of d's mantissa interval; it EQUALS closedForm(d) to machine epsilon — that
// identity (checked exact in the self-test) is the whole "why": the staircase is the wheel's shadow.
function band(d){
  const m0 = Math.log10(d), m1 = Math.log10(d + 1);
  return {
    d,
    m0, m1,
    arcFrac: m1 - m0,
    benford: closedForm(d),
    a0: wheelAngle(m0),
    a1: wheelAngle(m1)
  };
}
const BANDS = Array.from({ length: 9 }, (_, i) => band(i + 1));

// ── the mill (the ONLY stochastic engine; pure given seeds) ──────────────────────────────────────
// A fresh hopper of n grains, each Uniform(1,10) — a single honest decade, flat leading-digit "before".
function makeHopper(n, seed){
  const r = makeRng(seed);
  const g = new Float64Array(n);
  for (let i = 0; i < n; i++) g[i] = 1 + r() * 9;
  return g;
}
// Grind `seedGrains` for `passes` passes. Each pass draws a fresh factor f = 0.5 + rng() ∈ U(0.5,1.5)
// per grain from a per-pass stream (millSeed+'|'+pass). mode 'multiply' → g*=f, 'add' → g+=f. The
// factor stream is IDENTICAL across modes — only the operator differs, isolating multiplicativity.
function mill(seedGrains, passes, mode, millSeed){
  const g = Float64Array.from(seedGrains);
  for (let p = 0; p < passes; p++){
    const r = makeRng(millSeed + '|' + p);
    for (let i = 0; i < g.length; i++){
      const f = 0.5 + r();
      g[i] = (mode === 'add') ? g[i] + f : g[i] * f;
    }
  }
  return g;
}
// Tally leading digits 1..9 into a length-9 array.
function leadingCounts(grains){
  const c = new Array(9).fill(0);
  for (let i = 0; i < grains.length; i++){
    const d = leadingDigit(grains[i]);
    if (d >= 1 && d <= 9) c[d - 1]++;
  }
  return c;
}

// χ² goodness-of-fit of observed leading-digit counts vs Benford expectation. df=8 (no fitted params).
function chiSquared(counts){
  let n = 0;
  for (const c of counts) n += c;
  let stat = 0;
  for (let d = 0; d < 9; d++){
    const expected = BENFORD_BINS[d] * n;
    if (expected <= 0) continue;
    const diff = counts[d] - expected;
    stat += (diff * diff) / expected;
  }
  return { stat, df: DF, n };
}

// ── χ² distribution machinery (Lanczos log-gamma + regularized incomplete gamma; lifted verbatim
//    from the Galton board's core so the two number-wing rooms reckon the same χ²) ───────────────
function logGamma(z){
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  z -= 1;
  let x = C[0];
  for (let i = 1; i < 9; i++) x += C[i] / (z + i);
  const t = z + 7 + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
// regularized lower incomplete gamma P(a,x) = γ(a,x)/Γ(a): series for x<a+1, else Lentz's CF for Q.
function gammaP(a, x){
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  const gln = logGamma(a);
  if (x < a + 1){
    let ap = a, sum = 1 / a, del = sum;
    for (let i = 0; i < 1000; i++){ ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  } else {
    const FPMIN = 1e-300;
    let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (let j = 1; j < 1000; j++){
      const an = -j * (j - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const delta = d * c; h *= delta;
      if (Math.abs(delta - 1) < 1e-15) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
  }
}
function chiSquareCDF(x, df){ return x <= 0 ? 0 : gammaP(df / 2, x / 2); }
function chiSquarePValue(stat, df){ return 1 - chiSquareCDF(stat, df); }
// critical value: the x with CDF(x,df)=1−α, by bisection on the monotone CDF.
function chiSquareCritical(alpha, df){
  const target = 1 - alpha;
  let lo = 0, hi = Math.max(40, df * 4 + 40);
  while (chiSquareCDF(hi, df) < target && hi < 1e6) hi *= 2;
  for (let i = 0; i < 200; i++){ const mid = 0.5 * (lo + hi); if (chiSquareCDF(mid, df) < target) lo = mid; else hi = mid; }
  return 0.5 * (lo + hi);
}

// Kolmogorov–Smirnov statistic D of a mantissa sample against Uniform[0,1).
function ksUniform(samples){
  const xs = Array.from(samples, mantissa).sort((a, b) => a - b);
  const n = xs.length;
  if (n === 0) return 0;
  let D = 0;
  for (let i = 0; i < n; i++){
    D = Math.max(D, Math.abs((i + 1) / n - xs[i]), Math.abs(xs[i] - i / n));
  }
  return D;
}
// KS critical D at α≈0.01 for sample size n (the asymptotic 1.63/√n).
function ksCritical(n){ return n > 0 ? 1.63 / Math.sqrt(n) : Infinity; }

// Trace ONE grain through the mill (same factor stream as mill()): per-pass {value,mantissa,angle,digit}.
// The "follow this grain" ribbon, its wheel dot, and its bin token all index this ONE array.
function traceGrain(x0, passes, mode, millSeed){
  const out = [{ value: x0, mantissa: mantissa(x0), angle: wheelAngle(mantissa(x0)), digit: leadingDigit(x0) }];
  let x = x0;
  for (let p = 0; p < passes; p++){
    const r = makeRng(millSeed + '|' + p);
    const f = 0.5 + r();                 // first draw of the pass-stream = grain 0's factor
    x = (mode === 'add') ? x + f : x * f;
    out.push({ value: x, mantissa: mantissa(x), angle: wheelAngle(mantissa(x)), digit: leadingDigit(x) });
  }
  return out;
}

// ── THE ONE ADAPTER the page reads (everything downstream INDEXES this — nothing re-mills) ─────────
// Pure: same opts ⇒ byte-identical result. Defaults to the pinned gate (7068, 12158, 80, multiply).
function run(opts){
  opts = opts || {};
  const grainsN   = opts.grains   == null ? GRAINS_DEFAULT : opts.grains;
  const passes    = opts.passes   == null ? PASSES_DEFAULT : opts.passes;
  const mode      = opts.mode     || 'multiply';
  const hopperSeed = opts.hopperSeed == null ? GATE_HOP_SEED  : opts.hopperSeed;
  const millSeed   = opts.millSeed   == null ? GATE_MILL_SEED : opts.millSeed;
  let grains;
  if (opts.source === 'tight'){           // the U(1,2) tight-decade negative control (no milling)
    const r = makeRng(hopperSeed);
    grains = new Float64Array(grainsN);
    for (let i = 0; i < grainsN; i++) grains[i] = 1 + r();
  } else {
    grains = mill(makeHopper(grainsN, hopperSeed), passes, mode, millSeed);
  }
  const counts = leadingCounts(grains);
  const chi = chiSquared(counts);
  chi.pValue = chiSquarePValue(chi.stat, chi.df);
  const sample = Array.from(grains).slice(0, PLOT_CAP);
  const mant = sample.map(mantissa);
  const D = ksUniform(sample);
  return {
    grains, counts, chi,
    mantissa: mant,
    ks: { D, crit: ksCritical(sample.length), n: sample.length },
    mode, hopperSeed, millSeed, passes
  };
}

// ── the self-test: EIGHT checks. Claim ONLY what is exactly true. ─────────────────────────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });
  const crit05 = chiSquareCritical(ALPHA, DF);          // 15.507
  const crit001 = chiSquareCritical(0.001, DF);         // 26.12

  // (1) the closed form sums to 1 EXACTLY — the nine probabilities telescope to log10(10)=1.
  {
    let sum = 0; for (const b of BENFORD_BINS) sum += b;
    ck('1 · P(d)=log₁₀(1+1/d) sums to 1 exactly', sum === 1,
       'Σ log₁₀(1+1/d) = ' + sum + '  |Σ−1| = ' + Math.abs(sum - 1).toExponential(2) + ' (telescopes)');
  }
  // (2) closed form === log-arc width to machine epsilon — P(d) IS the width of d's mantissa interval.
  {
    let maxErr = 0;
    for (let d = 1; d <= 9; d++) maxErr = Math.max(maxErr, Math.abs(closedForm(d) - (Math.log10(d + 1) - Math.log10(d))));
    ck('2 · P(d) === log-arc width to <1e-12', maxErr < 1e-12,
       'max|P(d) − (log₁₀(d+1)−log₁₀(d))| = ' + maxErr.toExponential(2));
  }
  // (3) the wheel wedge arc === the Benford height, exactly — the staircase is the wheel's shadow.
  {
    let maxErr = 0;
    for (const b of BANDS) maxErr = Math.max(maxErr, Math.abs(b.arcFrac - b.benford));
    ck('3 · wheel-wedge arc === bin Benford height to <1e-15', maxErr < 1e-15,
       'max|band.arcFrac − closedForm(d)| = ' + maxErr.toExponential(2) + ' — the staircase is the wheel’s shadow, proven');
  }
  // (4) EMPIRICAL FIT — deterministic gate. The pinned-seed mill does NOT reject Benford, and the
  //     statistic is not a fake zero. (Generous α=.05 band + pinned seeds = cannot false-fail.)
  {
    const r = run();
    const ok = r.chi.stat < crit05 && r.chi.stat > 0;
    ck('4 · seeded mill does NOT reject Benford (χ² fit)', ok,
       'χ²=' + r.chi.stat.toFixed(3) + ' (.05-crit ' + crit05.toFixed(2) + ', p=' + r.chi.pValue.toFixed(3) +
       ') — an honest stat, not equality');
  }
  // (5) mantissa uniformity — the milled grains' mantissas pass KS against U(0,1).
  {
    const r = run();
    ck('5 · milled mantissas pass KS-uniformity on [0,1)', r.ks.D < r.ks.crit,
       'KS D=' + r.ks.D.toFixed(4) + ' < crit ' + r.ks.crit.toFixed(4) + ' (n=' + r.ks.n + ')');
  }
  // (6) NEG-CONTROL 'add' has teeth — additive milling destroys log-uniformity, piling onto digit 8.
  {
    const r = run({ mode: 'add' });
    const dom = r.counts.indexOf(Math.max.apply(null, r.counts)) + 1;
    const ok = r.chi.stat > crit001 && dom === 8;
    ck('6 · ADD destroys it: bins skew onto 8, Benford REJECTED', ok,
       'χ²=' + r.chi.stat.toFixed(0) + ' ≫ .001-crit ' + crit001.toFixed(2) + ' · dominant digit ' + dom + ' — multiplicativity is the cause');
  }
  // (7) NEG-CONTROL 'tight-decade' has teeth — a U(1,2) un-milled source: nearly all lead with 1.
  {
    const r = run({ source: 'tight' });
    const dom = r.counts.indexOf(Math.max.apply(null, r.counts)) + 1;
    const ok = r.chi.stat > crit001 && dom === 1;
    ck('7 · tight U(1,2) source rejects Benford too (leads with 1)', ok,
       'χ²=' + r.chi.stat.toFixed(0) + ' ≫ .001-crit ' + crit001.toFixed(2) + ' · dominant digit ' + dom + ' — a second named failure');
  }
  // (8) determinism / purity — run() twice yields identical counts, χ², and mantissa head. No entropy.
  {
    const a = run(), b = run();
    let same = a.chi.stat === b.chi.stat;
    for (let d = 0; d < 9; d++) same = same && a.counts[d] === b.counts[d];
    for (let i = 0; i < 5; i++) same = same && a.mantissa[i] === b.mantissa[i];
    ck('8 · run() is deterministic & pure (no Math.random/clock)', same,
       'identical counts + χ²=' + a.chi.stat.toFixed(3) + ' + mantissa[0..4] across two calls');
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END BENFORD-MILL CORE =====

export {
  xmur3, mulberry32, makeRng,
  GRAINS_DEFAULT, PASSES_DEFAULT, GRAINS_CAP, PLOT_CAP, GATE_HOP_SEED, GATE_MILL_SEED, ALPHA, DF, TAU,
  closedForm, BENFORD_BINS, mantissa, leadingDigit, wheelAngle, band, BANDS,
  makeHopper, mill, leadingCounts, chiSquared,
  logGamma, gammaP, chiSquareCDF, chiSquarePValue, chiSquareCritical,
  ksUniform, ksCritical, traceGrain,
  run, runSelfTest
};
