// Node twin for Two Ways to π core. Zero-dep. Run: `node cross/two-ways-to-pi/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this test can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char) and an anti-circularity check.
//   1.  STAMMER converges INTO its corridor — seeded big-N |piHat−π| ≤ corridorHalfWidth(N,..,4σ); ≠ π.
//   1b. the band SHRINKS ~1/√N — meanErr decade-ratio ∈ [6,16].
//   2.  SPELL is EXACT — eventCount === closedCount === piPrefix(k+1) for every 100^k (3,31,314,3141).
//   3.  THE AGREEMENT is real — at the converged N the gold bar sits inside [piHat−hw, piHat+hw].
//   NEG A (Buffon) — fixed-angle θ=π/2 → piHat → 2.0, |2.0−π|>1, band never contains π.
//   NEG B (Clack)  — naiveFloorCount → 4 not 3, isPiPrefix(4)=false, the spell reads the WRONG digit.
//   BOTH neg-controls FAIL the gate while both correct paths PASS — a vacuous "always agree" checker
//   PASSES leg 3 but FAILS both controls.
//   PARITY — index.html's inlined CORE slab === core.mjs CORE char-for-char.
//   ANTI-CIRCULARITY — the Buffon solver never names a Clack fn and vice-versa (disjoint domains).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  crossProbUniform, crossProbFixedAngle, corridorHalfWidth, makeRng, runBatch,
  closedCount, naiveFloorCount, velocityCount, eventCount, piPrefix, isPiPrefix, RATIOS,
  BUF_L, BUF_T, solveBoth, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nTwo Ways to π — Node twin (the legs the in-page pill proves + parity)\n');

// ── LEG 1: STAMMER converges INTO its corridor (never instant equality) ──────────
console.log('— Leg 1: the Stammer (Buffon) converges INTO its corridor — it approaches π, never equals it —');
{
  const N = 400000;
  const r = solveBoth(N, 3, 0xB0FFE5);
  const band4 = corridorHalfWidth(N, BUF_L, BUF_T, 4);   // generous 4σ gate band (page shows 1.96σ)
  ck('seeded big-N piHat lands inside the 4σ corridor of π', isFinite(r.piHat) && Math.abs(r.piHat - Math.PI) <= band4,
    'piHat = ' + r.piHat.toFixed(6) + '  |err| = ' + Math.abs(r.piHat - Math.PI).toExponential(2) + '  band4 = ' + band4.toExponential(2));
  ck('the estimate NEVER equals π exactly (it converges into a band)', r.piHat !== Math.PI,
    'piHat − π = ' + (r.piHat - Math.PI).toExponential(2) + ' (an estimate, not the integer count)');
  // and the DISPLAYED 1.96σ band is what the page draws (the two are not conflated):
  ck('the page-displayed band is the 1.96σ half-width (shown ≠ the proven 4σ gate)', r.hw === corridorHalfWidth(N, BUF_L, BUF_T, 1.96),
    'hw(1.96σ) = ' + r.hw.toExponential(3));
}

// ── LEG 1b: the band actually SHRINKS ~1/√N ──────────────────────────────────────
console.log('\n— Leg 1b: the corridor shrinks ~1/√N (the honest slow-convergence lesson) —');
{
  const Nsmall = 2000, Nbig = 200000, trials = 60;
  let eSmall = 0, eBig = 0;
  for (let s = 0; s < trials; s++) {
    eSmall += Math.abs(solveBoth(Nsmall, 3, 1000 + s).piHat - Math.PI);
    eBig   += Math.abs(solveBoth(Nbig,   3, 9000 + s).piHat - Math.PI);
  }
  eSmall /= trials; eBig /= trials;
  const ratio = eSmall / eBig;             // expect ≈ sqrt(100) = 10
  ck('meanErr decade-ratio over two decades ∈ [6,16] (clearly 1/√N, not flat)', ratio >= 6 && ratio <= 16,
    'meanErr(2k) = ' + eSmall.toExponential(2) + '  meanErr(200k) = ' + eBig.toExponential(2) + '  ratio = ' + ratio.toFixed(2));
  // and the corridor half-width itself shrinks by ~10× per two decades, exactly:
  const hwRatio = corridorHalfWidth(Nsmall, BUF_L, BUF_T, 1.96) / corridorHalfWidth(Nbig, BUF_L, BUF_T, 1.96);
  ck('corridorHalfWidth ratio === √100 = 10 exactly (the band is a 1/√N law)', Math.abs(hwRatio - 10) < 1e-9,
    'hw(2k)/hw(200k) = ' + hwRatio.toFixed(6));
}

// ── LEG 2: SPELL is EXACT across every π-power ratio ──────────────────────────────
console.log('\n— Leg 2: the Spell (Clack) is EXACT — the event count IS the digits of π (3,31,314,3141) —');
{
  for (let k = 0; k < RATIOS.length; k++) {
    const M = RATIOS[k];
    const ev = eventCount(M, 1), cc = closedCount(M, 1), vc = velocityCount(M, 1), want = piPrefix(k + 1);
    ck('100^' + k + ' (=' + M + ':1) → eventCount === closedCount === velocityCount === ' + want,
      ev === cc && cc === vc && vc === want,
      'event = ' + ev + ' · closed = ' + cc + ' · velocity = ' + vc + ' · π-prefix = ' + want);
  }
  ck('isPiPrefix(3141) is true (a real π prefix)', isPiPrefix(3141));
}

// ── LEG 3: THE AGREEMENT is real ──────────────────────────────────────────────────
console.log('\n— Leg 3: the agreement — at the converged N the gold bar sits inside the corridor —');
{
  const r = solveBoth(400000, 3, 0xB0FFE5);
  ck('bandContainsPi: (piHat−hw) ≤ π ≤ (piHat+hw) at the converged N', r.bandContainsPi,
    '[' + r.bandLo.toFixed(5) + ', ' + r.bandHi.toFixed(5) + '] ∋ π = ' + Math.PI.toFixed(5));
  ck('the latch is "band contains π", NEVER "caret === π" (the caret is an estimate)', r.piHat !== Math.PI && r.bandContainsPi);
  ck('AND the spell reads the right gold digits at the same precision', r.spellExact,
    'exactCount = ' + r.exactCount + ' === goldDigits = ' + r.goldDigits);
}

// ── NEG A: Buffon fixed-angle bias ────────────────────────────────────────────────
console.log('\n— Neg-control A (Buffon): bias the throw (θ=π/2) → the caret marches to 2.0, never π —');
{
  const r = solveBoth(300000, 3, 0x5151, { thetaFixed: Math.PI / 2 });
  ck('fixed perpendicular throw biases piHat → 2.0 (not π)', Math.abs(r.piHat - 2) < 0.02, 'piHat ≈ ' + r.piHat.toFixed(4));
  ck('|piHat − π| > 1.0 (clean out of the corridor)', Math.abs(r.piHat - Math.PI) > 1.0, '|err| = ' + Math.abs(r.piHat - Math.PI).toFixed(4));
  ck('the band NEVER contains π under the bias (the latch can never fire)', !r.bandContainsPi);
  // the closed-form rate confirms WHY: P = (L/t)·|sin(π/2)| = L/t, so piHat → 2.
  ck('crossProbFixedAngle(π/2) = L/t, so 2L/(t·P) = 2 (the bias is principled)',
    Math.abs(crossProbFixedAngle(BUF_L, BUF_T, Math.PI / 2) - BUF_L / BUF_T) < 1e-12,
    'P_fixed = ' + crossProbFixedAngle(BUF_L, BUF_T, Math.PI / 2).toFixed(4) + ' vs P_uniform = ' + crossProbUniform(BUF_L, BUF_T).toFixed(4));
}

// ── NEG B: Clack naive-count boundary trap ────────────────────────────────────────
console.log('\n— Neg-control B (Clack): use the naive ⌊π/θ⌋ count → 4 not 3, the gold spell reads wrong —');
{
  const r = solveBoth(400000, 0, 0xB0FFE5, { naive: true });   // k=0 ⇒ ratio 1:1, true count 3
  ck('naiveFloorCount(1,1) === 4 (the ⌊4⌋ boundary trap)', r.exactCount === 4, 'naive count = ' + r.exactCount);
  ck('the TRUE closedCount(1,1) === 3 (so the boundary is real)', closedCount(1, 1) === 3);
  ck('isPiPrefix(4) is false — 4 is NOT a leading digit of π', !isPiPrefix(4));
  ck('the spell is BROKEN: exactCount !== goldDigits, spellExact false', r.exactCount !== r.goldDigits && !r.spellExact,
    'naive = ' + r.exactCount + ' vs gold = ' + r.goldDigits);
}

// ── ANTI-VACUITY: both controls have teeth (a "they always agree" checker fails them) ──
console.log('\n— Anti-vacuity: both neg-controls FAIL while both correct paths PASS (the controls bite) —');
{
  const good = solveBoth(400000, 3, 0xB0FFE5);
  const negA = solveBoth(300000, 3, 0x5151, { thetaFixed: Math.PI / 2 });
  const negB = solveBoth(400000, 0, 0xB0FFE5, { naive: true });
  // a vacuous checker that always reports "agree" would PASS leg-3 on `good` but ALSO on the controls.
  ck('correct path agrees (band∋π AND spell exact) — but neg-A breaks the band',
    good.bandContainsPi && good.spellExact && !negA.bandContainsPi);
  ck('… and neg-B breaks the spell (so a vacuous always-agree checker FAILS here)',
    !negB.spellExact && negB.exactCount === 4);
}

// ── PARITY: the in-page self-test agrees with this twin (the same runSelfTest) ────
console.log('\n— The shared runSelfTest (the function the page inlines) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok, r.pass + '/' + r.total + (r.detail.length ? ' · ' + r.detail.join(',') : ''));
}

// ── BYTE-TWIN PARITY ───────────────────────────────────────────────────────────
console.log('\n— Byte-twin parity (the inlined slab IS the module, byte-for-byte) —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── ANTI-CIRCULARITY: the two cores are DISJOINT (neither solver names the other) ──
console.log('\n— Anti-circularity: the two cores are disjoint (neither solver names the other) —');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  // the Buffon solver body: from `function runBatch` to the Clack core header.
  const buffonBody = src.slice(src.indexOf('function runBatch'), src.indexOf('// ══ CORE B'));
  // the Clack solver body: from `function eventCount`/`simulate` to the adapter header.
  const clackBody = src.slice(src.indexOf('function elasticBlockBlock'), src.indexOf('// ══ THE ADAPTER'));
  ck('the Buffon core never names a Clack fn (eventCount/closedCount/simulate)',
    !/eventCount|closedCount|simulate|elasticBlockBlock|velocityCount|naiveFloorCount/.test(buffonBody));
  ck('the Clack core never names a Buffon fn (runBatch/toss/corridorHalfWidth)',
    !/runBatch|\btoss\b|corridorHalfWidth|crossProbUniform|piEstimate/.test(clackBody));
}

console.log('\n—— Two Ways to π Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
