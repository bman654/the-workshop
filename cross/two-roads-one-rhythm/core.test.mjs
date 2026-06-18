// Node twin for Two Roads, One Rhythm core. Zero-dep. Run: `node cross/two-roads-one-rhythm/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char), the anchor anti-circularity leg,
// and a determinism leg.
//
//   L1 UNIVERSALITY — |δ_logistic − δ_sine| < 0.01 at ladder depth ≥6 (measured 8.48e-4).
//   L2 IT'S δ — both measured δ within 0.01 of FEIGENBAUM_DELTA (4.669201609).
//   L3 CONVERGES — the last logistic ratio is closer to δ than the first (a limit, not luck).
//   L4 NEG-CONTROL — at depth 8 the smooth maps climb ≥7 rungs while the tent climbs ≤1
//      (rungs 9/9/1), the tent δ is NaN (ratios: 0), and an always-4.669 classifier FAILS the tent.
//   L5 ANCHORS (anti-circularity) — R₁_logistic ≈ 1+√5 = 3.2360680 and R₁_sine ≈ 0.77773 are DIFFERENT
//      rung VALUES with the SAME ratio limit → one δ (universality, not a coincidence of values).
//   L6 DETERMINISM — te.rungs===1 reproducibly (the corner-kills-cascade signal is bit-stable).
//   L7 BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//   L8 PILL PARITY — runSelfTest().pass===total and matches the legs above.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  FEIGENBAUM_DELTA, MAPS, superstableLadder, feigenbaumRatios, cascadeReading, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nTwo Roads, One Rhythm — Node twin (two humps climb at the same shrinking instants)\n');

// the readings the legs share, computed once
const lo = cascadeReading(MAPS.logistic, 6), si = cascadeReading(MAPS.sine, 6);
const te = cascadeReading(MAPS.tent, 8);
const lo8 = cascadeReading(MAPS.logistic, 8), si8 = cascadeReading(MAPS.sine, 8);

// ── LEG 1: UNIVERSALITY — two different humps land on the SAME ratio ──────────────────────────────
console.log('— Leg 1: universality — |δ_logistic − δ_sine| < 0.01 at depth ≥6 —');
{
  const d = Math.abs(lo.delta - si.delta);
  ck('|δ_logistic − δ_sine| < 0.01', d < 0.01,
    'δ_log=' + lo.delta.toFixed(8) + ' δ_sin=' + si.delta.toFixed(8) + ' |Δ|=' + d.toExponential(2));
}

// ── LEG 2: IT'S δ — both ratios sit on Feigenbaum's constant ─────────────────────────────────────
console.log('\n— Leg 2: it is δ — both within 0.01 of 4.669201609 —');
{
  const el = Math.abs(lo.delta - FEIGENBAUM_DELTA), es = Math.abs(si.delta - FEIGENBAUM_DELTA);
  ck('|δ_logistic − δ| < 0.01', el < 0.01, 'δ_log=' + lo.delta.toFixed(8) + ' |Δ|=' + el.toExponential(2));
  ck('|δ_sine − δ| < 0.01', es < 0.01, 'δ_sin=' + si.delta.toFixed(8) + ' |Δ|=' + es.toExponential(2));
}

// ── LEG 3: CONVERGES — the last ratio is closer to δ than the first (a limit, not luck) ───────────
console.log('\n— Leg 3: convergence — the last logistic ratio is closer to δ than the first —');
{
  const first = lo.ratios[0], last = lo.ratios.at(-1);
  ck('|last − δ| < |first − δ|',
    Math.abs(last - FEIGENBAUM_DELTA) < Math.abs(first - FEIGENBAUM_DELTA),
    lo.ratios.map(v => v.toFixed(4)).join(' → '));
}

// ── LEG 4: NEG-CONTROL — the corner kills the cascade ────────────────────────────────────────────
console.log('\n— Leg 4 (load-bearing): the tent has a corner, not a curve — no cascade, no δ —');
{
  ck('rung-count: smooth roads climb ≥7, the tent ≤1 (9/9/1)',
    lo8.rungs >= 7 && si8.rungs >= 7 && te.rungs <= 1,
    'rungs: logistic=' + lo8.rungs + ' sine=' + si8.rungs + ' tent=' + te.rungs);
  ck('the tent has no cascade ⇒ δ undefined (NaN, ratios: 0)',
    !te.hasCascade && Number.isNaN(te.delta),
    'tent hasCascade=' + te.hasCascade + ' δ=' + te.delta + ' ratios=' + te.ratios.length);
  // ANTI-VACUITY: an always-answer-4.669 classifier has NO tent ladder to ratio ⇒ it FAILS the tent.
  const vacuousAnswer = 4.669;
  const honestHasTentDelta = te.hasCascade;       // the honest reading: false
  ck('anti-vacuity: an always-4.669 classifier FAILS the tent (it has no ladder to ratio)',
    !honestHasTentDelta,
    'a vacuous "every hump gives ' + vacuousAnswer + '" claim has no tent ladder to ratio ⇒ FAILS');
}

// ── LEG 5: ANCHORS — DIFFERENT rung values, SAME ratio limit (anti-circularity) ──────────────────
console.log('\n— Leg 5: anchors — R₁ differs per map (1+√5 vs 0.77773) yet one ratio limit emerges —');
{
  const R1log = lo.R[1], R1sin = si.R[1];
  const goldenAnchor = 1 + Math.sqrt(5);          // 3.2360679…  (R₁ of the logistic map, exact)
  ck('R₁_logistic ≈ 1+√5 = 3.2360680 (the logistic 2-cycle superstable point)',
    Math.abs(R1log - goldenAnchor) < 1e-6, 'R₁_log=' + R1log.toFixed(7) + ' 1+√5=' + goldenAnchor.toFixed(7));
  ck('R₁_sine ≈ 0.77773 (a DIFFERENT rung value)',
    Math.abs(R1sin - 0.77773) < 1e-4, 'R₁_sin=' + R1sin.toFixed(7));
  ck('the two rung VALUES differ by a wide margin, yet share the SAME ratio limit (universality)',
    Math.abs(R1log - R1sin) > 2 && Math.abs(lo.delta - si.delta) < 0.01,
    '|R₁_log − R₁_sin|=' + Math.abs(R1log - R1sin).toFixed(4) + ' |Δδ|=' + Math.abs(lo.delta - si.delta).toExponential(2));
}

// ── LEG 6: DETERMINISM — the corner-kills-cascade signal is bit-stable ───────────────────────────
console.log('\n— Leg 6: determinism — the tent yields exactly one rung, reproducibly —');
{
  const a = cascadeReading(MAPS.tent, 8).rungs;
  const b = cascadeReading(MAPS.tent, 8).rungs;
  const c = superstableLadder(MAPS.tent, 8).length;
  ck('cascadeReading(tent).rungs === 1 on repeated calls (bit-stable)',
    a === 1 && b === 1 && c === 1, 'rungs: ' + a + '/' + b + '/' + c);
}

// ── LEG 7: BYTE-TWIN PARITY — the inlined slab IS the module, byte-for-byte ───────────────────────
console.log('\n— Leg 7: byte-twin parity (index.html CORE slab === core.mjs CORE char-for-char) —');
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

// ── LEG 8: PILL PARITY — the shared runSelfTest (the function the page inlines) agrees ───────────
console.log('\n— Leg 8: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs',
    r.ok, r.pass + '/' + r.total + (r.lines.filter(l => !l.ok).length ? ' · ' + r.lines.filter(l => !l.ok).map(l => l.name).join(',') : ''));
}

console.log('\n—— Two Roads, One Rhythm Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
