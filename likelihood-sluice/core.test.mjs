// Node twin for The Likelihood Sluice math core. Zero-dep. Run: `node core.test.mjs`.
//
// The Sluice adds NO new inference math: it REUSES belief-beam's verified per-draw
// log-likelihood-ratio slide and only adds Wald's two barriers + the latch. This twin
// PROVES the bench's claims and is careful to NEVER over-claim:
//   (1) WALD INEQUALITIES — α̂ ≤ α and β̂ ≤ β over many seeded Monte-Carlo runs at two
//       (α,β) pairs. Asserted as ≤ (NEVER =): the realized error rate is conservative.
//   (2) NEG-CONTROL — barriers at ±∞ ⇒ ZERO latches over long runs (the decision lives in
//       the FINITE gates, not the walk). Second neg form: i === j ⇒ every step 0 ⇒ no latch.
//   (3) ANTI-FORK — for every trial, |L − replayLogOdds(cards,i,j)| < 1e-12: the walk IS
//       the Beam's order-free log-odds, so the Sluice cannot drift from the reused law.
//   (4) DETERMINISM — same seed ⇒ same {verdict, n} (inherits makeSource).
//   (5) SOFT/MODELED — E[N]_SPRT < a matched fixed-N test (labeled "modeled — Wald–Wolfowitz,
//       shown empirically"); asserted as an ORDERING only, never an exact value.
//   (6) BYTE-TWIN PARITY (two slabs) — the SLUICE slab in index.html === the SLUICE sentinels
//       in core.mjs (char-identical), AND the borrowed belief-beam slab in index.html === the
//       belief-beam CORE sentinels (char-identical, so the reused law cannot drift). Plus an
//       anti-circularity check: strip both slabs and the page defines NO second log-LR / barrier.
//
// The realized error rates are RANDOM (Monte-Carlo). A bare ≤ assertion is safe at M=4000
// because the dialed rates here (0.02..0.10) sit comfortably below the actual P(error)≈α·(true
// rate), so α̂ lands well under α with margin ≫ the +k/√M sampling band (≈ 0.05·√(.05·.95/4000)
// ≈ 0.0017 at k=2). We document that band here rather than fuzz the inequality.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  barrierAccept, barrierReject, SLICES,
  runTrial, runTrialInf, runSluiceSelfTest,
  logLikRatioStep, replayLogOdds, makeSource
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOL = 1e-12;

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// ── barrier formulas: A>0>B, and they are monotone in the error rates. ──
{
  const A = barrierAccept(0.05, 0.05), B = barrierReject(0.05, 0.05);
  ck('barriers straddle zero: A > 0 > B at α=β=0.05', A > 0 && B < 0);
  ck('A = ln((1−β)/α), B = ln(β/(1−α)) (exact)',
     A === Math.log(0.95 / 0.05) && B === Math.log(0.05 / 0.95));
  // tighter α ⇒ higher A (need more evidence to accept H1); tighter β ⇒ lower B.
  ck('tighter α raises the H1 barrier A (more evidence required)', barrierAccept(0.01, 0.05) > A);
  ck('tighter β lowers the H0 barrier B (more evidence required)', barrierReject(0.05, 0.01) < B);
}

// ── slices expose the expected per-draw steps (the Beam's verified law, sliced). ──
{
  const { i, j } = SLICES.soft;   // 0,1
  ck('soft slice steps: red +0.811 / green −0.693 / blue −1.386',
     Math.abs(logLikRatioStep(0, i, j) - Math.log((9 / 12) / (4 / 12))) < TOL &&
     Math.abs(logLikRatioStep(1, i, j) - Math.log((2 / 12) / (4 / 12))) < TOL &&
     Math.abs(logLikRatioStep(2, i, j) - Math.log((1 / 12) / (4 / 12))) < TOL);
  const sh = SLICES.sharp;        // 0,2
  ck('sharp slice: GREEN is the visible inert no-op (step 0)', logLikRatioStep(1, sh.i, sh.j) === 0);
  ck('sharp slice: red and blue are equal-and-opposite (±2.197)',
     Math.abs(logLikRatioStep(0, sh.i, sh.j) + logLikRatioStep(2, sh.i, sh.j)) < TOL &&
     logLikRatioStep(0, sh.i, sh.j) > 2.1);
}

// ── (1) WALD INEQUALITIES — α̂ ≤ α and β̂ ≤ β over M seeded runs, at TWO (α,β) pairs. ──
function measure({ i, j, alpha, beta, M }) {
  let h1onH0 = 0, opens0 = 0, nsum0 = 0;
  for (let s = 0; s < M; s++) {
    const r = runTrial({ urn: j, seed: s, i, j, alpha, beta });   // truth = H0 (urn j)
    if (r.verdict === 'H1') h1onH0++;
    if (r.verdict === 'open') opens0++;
    nsum0 += r.n;
  }
  let h0onH1 = 0, opens1 = 0, nsum1 = 0;
  for (let s = 0; s < M; s++) {
    const r = runTrial({ urn: i, seed: s + 5000000, i, j, alpha, beta });  // truth = H1 (urn i)
    if (r.verdict === 'H0') h0onH1++;
    if (r.verdict === 'open') opens1++;
    nsum1 += r.n;
  }
  return { aHat: h1onH0 / M, bHat: h0onH1 / M, opens: opens0 + opens1, eN: (nsum0 + nsum1) / (2 * M) };
}
{
  const M = 4000;
  const a = measure({ i: 0, j: 1, alpha: 0.05, beta: 0.05, M });
  ck('(1) WALD α̂ ≤ α at (.05,.05): ' + a.aHat.toFixed(4) + ' ≤ 0.05', a.aHat <= 0.05);
  ck('(1) WALD β̂ ≤ β at (.05,.05): ' + a.bHat.toFixed(4) + ' ≤ 0.05', a.bHat <= 0.05);
  ck('(1) at (.05,.05) zero trials run open (the cap is never reached)', a.opens === 0);

  const b = measure({ i: 0, j: 1, alpha: 0.10, beta: 0.02, M });
  ck('(1) WALD α̂ ≤ α at (.10,.02): ' + b.aHat.toFixed(4) + ' ≤ 0.10', b.aHat <= 0.10);
  ck('(1) WALD β̂ ≤ β at (.10,.02): ' + b.bHat.toFixed(4) + ' ≤ 0.02', b.bHat <= 0.02);
  ck('(1) inequalities are CONSERVATIVE: realized rates sit strictly below the dialed ones',
     a.aHat < 0.05 && a.bHat < 0.05 && b.aHat < 0.10 && b.bHat < 0.02);
}

// ── (2) NEG-CONTROL — barriers at ±∞ ⇒ ZERO latches over many long runs. ──
{
  let latches = 0;
  const M = 500;
  for (let s = 0; s < M; s++) {
    const r = runTrialInf({ urn: 0, seed: s, i: 0, j: 1, cap: 2000 });
    if (r.verdict !== 'open') latches++;
  }
  ck('(2) NEG ±∞ barriers: ZERO latches over ' + M + ' × 2000-draw runs', latches === 0);

  // second neg form: i === j ⇒ every per-draw step is 0 ⇒ L never moves ⇒ never latches.
  let maxAbsL = 0, eqLatch = 0;
  for (let s = 0; s < 100; s++) {
    const r = runTrial({ urn: 0, seed: s, i: 1, j: 1, alpha: 0.05, beta: 0.05, cap: 500 });
    maxAbsL = Math.max(maxAbsL, Math.abs(r.L));
    if (r.verdict !== 'open') eqLatch++;
  }
  ck('(2) NEG i===j: every step 0, L never moves (max|L|=' + maxAbsL.toExponential(1) + '), never latches',
     maxAbsL === 0 && eqLatch === 0);
}

// ── (3) ANTI-FORK — the walk L IS belief-beam's order-free log-odds, to 1e-12. ──
{
  let maxErr = 0;
  for (let s = 0; s < 1000; s++) {
    const r = runTrial({ urn: s % 3, seed: s, i: 0, j: 1, alpha: 0.05, beta: 0.05 });
    maxErr = Math.max(maxErr, Math.abs(r.L - replayLogOdds(r.cards, 0, 1)));
  }
  ck('(3) anti-fork: |L − replayLogOdds(cards,0,1)| < 1e-12 over 1000 trials', maxErr < TOL);
  // also for the sharp slice
  let maxErr2 = 0;
  for (let s = 0; s < 500; s++) {
    const r = runTrial({ urn: s % 3, seed: s + 9000, i: 0, j: 2, alpha: 0.05, beta: 0.05 });
    maxErr2 = Math.max(maxErr2, Math.abs(r.L - replayLogOdds(r.cards, 0, 2)));
  }
  ck('(3) anti-fork (sharp slice i=0,j=2): |L − replayLogOdds| < 1e-12', maxErr2 < TOL);
}

// ── (4) DETERMINISM — same seed ⇒ same {verdict, n}. ──
{
  let same = true;
  for (let s = 0; s < 50; s++) {
    const a = runTrial({ urn: 0, seed: s, i: 0, j: 1, alpha: 0.05, beta: 0.05 });
    const b = runTrial({ urn: 0, seed: s, i: 0, j: 1, alpha: 0.05, beta: 0.05 });
    if (a.verdict !== b.verdict || a.n !== b.n || a.L !== b.L) same = false;
  }
  ck('(4) determinism: same seed ⇒ identical {verdict, n, L}', same);
}

// ── (5) SOFT / MODELED — E[N]_SPRT < a matched fixed-N test. ORDERING only, labeled. ──
{
  // E[N] under the SPRT (truth = urn j = H0), at (.05,.05).
  let nsum = 0; const M = 4000;
  for (let s = 0; s < M; s++) nsum += runTrial({ urn: 1, seed: s, i: 0, j: 1, alpha: 0.05, beta: 0.05 }).n;
  const eN = nsum / M;
  // A matched FIXED-sample likelihood-ratio test reaching the same (α,β) needs N_fixed draws,
  // estimated from the normal approximation of the summed per-draw log-LR under each hypothesis
  // (Wald–Wolfowitz: the SPRT is optimal — minimizes E[N] among all tests of the same error
  // rates — so this ordering is a THEOREM shown here empirically, NOT an exact-value claim).
  const step = [Math.log((9 / 12) / (4 / 12)), Math.log((2 / 12) / (4 / 12)), Math.log((1 / 12) / (4 / 12))];
  const p0 = [4 / 12, 4 / 12, 4 / 12], p1 = [9 / 12, 2 / 12, 1 / 12];
  const mean = (p) => p.reduce((a, _v, k) => a + p[k] * step[k], 0);
  const sd = (p) => { const m = mean(p); return Math.sqrt(p.reduce((a, _v, k) => a + p[k] * step[k] * step[k], 0) - m * m); };
  const z = 1.645; // ~95%
  const Nfixed = Math.pow(z * (sd(p0) + sd(p1)) / (mean(p1) - mean(p0)), 2);
  ck('(5) MODELED ordering: E[N]_SPRT (' + eN.toFixed(2) + ') < matched fixed-N (' + Nfixed.toFixed(1) + ') — Wald–Wolfowitz, empirical',
     eN < Nfixed);
}

// ── (6) BYTE-TWIN PARITY — both slabs char-identical, plus anti-circularity. ──
function region(src, begin, end) {
  const a = src.indexOf(begin);
  const b = src.indexOf(end);
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + end.length);
}
const SLUICE_BEGIN = '// === SLUICE CORE BEGIN ===', SLUICE_END = '// === SLUICE CORE END ===';
const BEAM_BEGIN = '// === CORE BEGIN ===', BEAM_END = '// === CORE END ===';

const coreSrc = readFileSync(join(__dirname, 'core.mjs'), 'utf8');
const beamSrc = readFileSync(join(__dirname, '..', 'belief-beam', 'core.mjs'), 'utf8');
let pageSrc = null;
try { pageSrc = readFileSync(join(__dirname, 'index.html'), 'utf8'); } catch (e) { pageSrc = null; }

const sluiceFromCore = region(coreSrc, SLUICE_BEGIN, SLUICE_END);
const sluiceFromPage = pageSrc && region(pageSrc, SLUICE_BEGIN, SLUICE_END);
const beamFromBeam = region(beamSrc, BEAM_BEGIN, BEAM_END);
const beamFromPage = pageSrc && region(pageSrc, BEAM_BEGIN, BEAM_END);

ck('(6) SLUICE sentinels found in core.mjs', !!sluiceFromCore);
ck('(6) SLUICE sentinels found in index.html', !!sluiceFromPage);
ck('(6) byte-twin: inlined SLUICE slab is CHARACTER-IDENTICAL to core.mjs', !!sluiceFromCore && sluiceFromCore === sluiceFromPage);
ck('(6) belief-beam CORE sentinels found in belief-beam/core.mjs', !!beamFromBeam);
ck('(6) belief-beam CORE sentinels found in index.html (the borrowed law is inlined)', !!beamFromPage);
ck('(6) byte-twin: the borrowed belief-beam slab is CHARACTER-IDENTICAL to belief-beam/core.mjs (the reused law cannot drift)',
   !!beamFromBeam && beamFromBeam === beamFromPage);

// anti-circularity: strip BOTH slabs from the page; the remainder must define NO second
// barrier formula and NO second logLikRatioStep / logOddsIn (only the two slabs may).
if (pageSrc) {
  let stripped = pageSrc;
  if (sluiceFromPage) stripped = stripped.replace(sluiceFromPage, '');
  if (beamFromPage) stripped = stripped.replace(beamFromPage, '');
  const noSecondLaw =
    !/function\s+logLikRatioStep\s*\(/.test(stripped) &&
    !/function\s+logOddsIn\s*\(/.test(stripped) &&
    !/function\s+barrierAccept\s*\(/.test(stripped) &&
    !/function\s+barrierReject\s*\(/.test(stripped);
  ck('(6) anti-circularity: outside the two slabs the page defines NO second log-LR / barrier formula', noSecondLaw);
}

// ── the page-twin self-test entrypoint also passes (the same function the in-page pill runs). ──
{
  const r = runSluiceSelfTest({ mode: 'normal' });
  ck('runSluiceSelfTest("normal") passes its live in-browser checks', r.pass === true && r.offender === null);
  const neg = runSluiceSelfTest({ mode: 'noBarriers' });
  ck('runSluiceSelfTest("noBarriers") NEG fires (zero latches) and names the offender', neg.pass === true && /gates/i.test(neg.offender));
}

// ── report ──
console.log('The Likelihood Sluice — core.test.mjs');
{
  const a = measure({ i: 0, j: 1, alpha: 0.05, beta: 0.05, M: 4000 });
  console.log('  Wald @ (.05,.05): α̂=' + a.aHat.toFixed(4) + ' ≤ 0.05 · β̂=' + a.bHat.toFixed(4) + ' ≤ 0.05 · E[N]≈' + a.eN.toFixed(2) + ' · opens=' + a.opens);
  console.log('  barriers @ (.05,.05): A=+' + barrierAccept(0.05, 0.05).toFixed(3) + '  B=' + barrierReject(0.05, 0.05).toFixed(3) + '  (nats)');
  console.log('  the walk IS belief-beam\'s order-free log-odds (anti-fork |Δ|<1e-12 over 1000 trials)');
}
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
