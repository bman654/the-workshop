// The Selection Jar — Node cross-check (the falsifiability twin of core.mjs).
//   (a) runs the shared runSelfTest() at a HEAVY capsule (more runs/gens, tighter
//       band, same KSIG); (b) adds independent re-derivations NOT routed through
//       step(): a hand-built parent/offspring scatter with KNOWN heritability,
//       regressed; a Monte-Carlo confirming the R−h²·S error shrinks as 1/√runs;
//   (c) — the integration crux — RE-EXTRACTS the inlined core from index.html,
//       asserts it is char-for-char the export-stripped core.mjs body, evals it, and
//       runs ITS runSelfTest, asserting pass-count + every named check agree.
//   There is NO cross-wing import here, so page-core === module-core IS the parity.
import * as Core from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Conservatory · The Selection Jar — Node cross-check\n');

// ── 1. the shared core self-test (identical to the in-page pill), HEAVY capsule ──
console.log('— shared runSelfTest({runs:600,gens:30}) (same assertions the in-page pill runs, tighter band) —');
let moduleRes;
{
  moduleRes = Core.runSelfTest({ runs: 600, gens: 30 });
  for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);
}

// ── 2. INDEPENDENT re-derivations (NOT via step()) ─────────────────────
console.log('\n— independent re-derivations (hand-built, NOT routed through step()) —');

// (a) hand-built parent/offspring arrays with KNOWN V_A and σ_e: regress, assert the
//     least-squares slope === h² AND the mean-shift === h²·S by direct algebra.
{
  let worstSlope = 0, worstShift = 0, where = '';
  for (const h2 of [0.2, 0.35, 0.5, 0.7, 0.9]) {
    const rng = Core.makeRng(31337); const g = Core.makeGaussian(rng);
    const n = 200000, popMean = 0.5, sd = Math.sqrt(0.02);
    const sigma_e = Math.sqrt(Math.max(0, 0.02 * (1 - h2 * h2)));
    // a SURVIVOR pool deliberately shifted by a known differential S:
    const S = -0.06;                                  // survivors sit S below popMean
    const xs = new Float64Array(n), ys = new Float64Array(n);
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) {
      const par = popMean + S + sd * g();             // survivor parent (mean = popMean + S)
      const child = popMean + h2 * (par - popMean) + sigma_e * g();
      xs[i] = par; ys[i] = child; sx += par; sy += child;
    }
    const mx = sx / n, my = sy / n;
    let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    const slope = sxy / sxx;
    const meanShift = my - popMean;                   // R
    const predShift = h2 * S;                         // h²·S
    worstSlope = Math.max(worstSlope, Math.abs(slope - h2));
    if (Math.abs(meanShift - predShift) > worstShift) { worstShift = Math.abs(meanShift - predShift); where = 'h²=' + h2; }
  }
  ok('(re-derive)★ hand-built scatter: regression slope === h² AND mean-shift === h²·S by direct algebra',
     worstSlope < 0.01 && worstShift < 0.01, 'worst |slope−h²|=' + worstSlope.toExponential(2) + '  ·  worst |R−h²·S|=' + worstShift.toExponential(2) + ' @ ' + where);
}

// (b) Monte-Carlo: the ensemble |R − h²·S| error shrinks like 1/√runs (the band is
//     real sampling noise, not a hidden bias).  Compare 100-run vs 1600-run paired SE.
{
  const small = Core.runEnsemble({ runs: 100, gens: 20, h2: 0.5, strength: 0.6, bg: 0.5, N: 300, baseSeed: 5, early: 6 });
  const big = Core.runEnsemble({ runs: 1600, gens: 20, h2: 0.5, strength: 0.6, bg: 0.5, N: 300, baseSeed: 5, early: 6 });
  const ratio = small.pairedSE / big.pairedSE;        // expect ≈ √(1600/100) = 4
  // both errors must sit inside their own KSIG band, and the SE must shrink ~4×.
  const smallIn = Math.abs(small.pairedErrMean) <= Core.P.KSIG * small.pairedSE;
  const bigIn = Math.abs(big.pairedErrMean) <= Core.P.KSIG * big.pairedSE;
  ok('(MC)★ paired SE shrinks ~√(runs) (4× runs ⇒ ~2× tighter), both means inside KSIG band',
     smallIn && bigIn && ratio > 2.4 && ratio < 5.6,
     'SE 100-run=' + small.pairedSE.toExponential(2) + '  1600-run=' + big.pairedSE.toExponential(2) + '  ratio=' + ratio.toFixed(2) + ' (expect ≈4)');
}

// (c) determinism, independently: two makeState+step sequences byte-identical.
{
  function runOnce() {
    let st = Core.makeState({ seed: 24680, bg: 0.18, h2: 0.6, strength: 0.5, N: 250 });
    const trail = [];
    for (let i = 0; i < 15; i++) { const r = Core.step(st); trail.push(Array.from(r.shades)); st = r; }
    return JSON.stringify(trail);
  }
  ok('(determinism)★ identical {seed,…} ⇒ byte-identical 15-gen offspring trail', runOnce() === runOnce(), 'two full runs byte-identical');
}

// ── 3. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ───────────
//   Read index.html, slice the inline core between the SELECTION-JAR CORE sentinels,
//   assert it is char-for-char the export-stripped module body (from the first locked
//   marker to the END sentinel), eval it (new Function factory), run ITS runSelfTest
//   and assert pass-count and every named check agree.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== SELECTION-JAR CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END SELECTION-JAR CORE =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? 'slice is ' + (j - i) + ' chars' : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);

    // the slice must be PURE core — no ws breadcrumb / WS. leakage inside the twin.
    ok('the byte-twin slice contains no breadcrumb / WS. leakage',
       !/ws:seen:/.test(slice) && !/\bWS\./.test(slice) && !/localStorage/.test(slice),
       'core slice is pure — breadcrumb + WS cue sit outside the sentinels');

    // (0-teeth)★ BYTE-IDENTITY: the inline slice is char-for-char the module's body
    //   (from the first locked-const marker to the END sentinel, every leading
    //   `export ` removed).  page core IS the module core, not merely "same pass-count".
    const modSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const KMARK = '// The tolerance capsule';
    const k = modSrc.indexOf(KMARK), me = modSrc.indexOf(END);
    const modBody = modSrc.slice(k, me).replace(/^export /gm, '').trim();
    ok('(0-teeth)★ inline core slice is char-for-char the export-stripped core.mjs body',
       slice.trim() === modBody,
       slice.trim() === modBody ? 'identical bytes (' + modBody.length + ' chars)' :
       'DRIFT: slice ' + slice.trim().length + ' vs module ' + modBody.length + ' chars');

    let pageRes = null, evalErr = null;
    try {
      const factory = new Function(slice +
        '\n;return { P, DARK, LIGHT, beetleColor, bgColor, conspicuousness, makeRng, makeGaussian, mean, variance, select, breed, step, makeState, meanShade, runEnsemble, runSelfTest };');
      const PageCore = factory();
      pageRes = PageCore.runSelfTest({ runs: 600, gens: 30 });

      // the page core's shared formulas must match the module's value-for-value.
      const colSame = PageCore.beetleColor(0.3) === Core.beetleColor(0.3) && PageCore.bgColor(0.7) === Core.bgColor(0.7);
      const rngSame = PageCore.makeRng(1)() === Core.makeRng(1)();
      const ksigSame = PageCore.P.KSIG === Core.P.KSIG;
      ok('(parity)★ page core formulas === module core formulas (beetleColor/bgColor/makeRng/KSIG identical)',
         colSame && rngSame && ksigSame, colSame && rngSame && ksigSame ? 'every shared formula returns the identical value' : 'a formula drifted');
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count',
         pageRes.pass === moduleRes.pass && pageRes.total === moduleRes.total,
         'in-page ' + pageRes.pass + '/' + pageRes.total + '  ·  module ' + moduleRes.pass + '/' + moduleRes.total);
      let agree = pageRes.checks.length === moduleRes.checks.length;
      for (let m = 0; agree && m < pageRes.checks.length; m++) {
        if (pageRes.checks[m].pass !== moduleRes.checks[m].pass) agree = false;
        if (pageRes.checks[m].name !== moduleRes.checks[m].name) agree = false;
      }
      ok('(parity)★ every named assertion agrees ok-for-ok (page vs module)', agree,
         agree ? 'all ' + pageRes.checks.length + ' checks identical' : 'a check disagreed');

      console.log('\n  ▸ RECORDED: in-page ' + pageRes.pass + '/' + pageRes.total + ' · Node module ' + moduleRes.pass + '/' + moduleRes.total);
    }
  }
}

console.log('\n' + pass + '/' + total + ' ' + (pass === total ? '✓ ALL GREEN' : '✗ FAILURES'));
process.exit(pass === total ? 0 : 1);
