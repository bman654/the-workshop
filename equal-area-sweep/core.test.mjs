// Node twin for The Equal-Area Sweep. Zero-dep. Run: `node equal-area-sweep/core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count (aerodrome ok/near style).
//
// Proves Kepler's 2nd law — a planet sweeps EQUAL AREAS in EQUAL TIMES — INDEPENDENTLY of the
// page's in-page pill, re-deriving the keystone three different ways and exercising the falsifier:
//   CLAIM 1 EQUAL-AREA — across e ∈ {0,.2,.6,.85,.967} × nTicks ∈ {8,12,13}, every equal-Δt wedge
//           has area = πab/nTicks; the max−min spread over a row is < 1e-12 (measured ~1e-15). The
//           areal velocity dA/dt = L/2 is the same constant on every tick.
//   CLAIM 2 SHOELACE = ANALYTIC (and a THIRD route) — the shoelace area of the wedge polygon
//           (focus + many arc samples) matches the closed form to < 1e-6 (a POLYGON APPROXIMATION,
//           so the gate is 1e-6, NOT machine ε — do not "tighten" it or it breaks). A third,
//           fully-independent route — Simpson ½∫r(θ)²dθ over the tick's θ-range — converges to the
//           same number.
//   CLAIM 3 r²·θ̇ CONSTANT — arealRate(e,E) (the analytic cross product x·ẏ−y·ẋ, NO finite
//           differencing) has < 1e-12 spread around the orbit AND equals √(1−e²) = L to < 1e-12.
//   NEG-CONTROL / DISCRIMINATION — the SAME machinery that passes 'time' FAILS 'angle': the
//           equal-angle cheat's wedge max/min ratio > 5× at e=0.6 (and grows with e). At e=0 BOTH
//           modes give equal wedges (ratio = 1 ± 1e-12) — the bite comes specifically from eccentricity.
//   WRAP-AROUND — keplerSolveCumulative keeps the lap-crossing wedge honest: the last (wrap) wedge
//           equals the first to < 1e-12 (a naive M mod 2π would collapse it to zero).
//   ROUND-TRIP — keplerSolve(MfromE(e,E),e) === E and timeAtTheta(stateAtTime(t,e).theta,e) === t,
//           both to < 1e-12.
//   DOMAIN GUARDS — e<0 / e≥1 / non-finite → NaN.
//   BYTE-TWIN PARITY — the CORE region inlined in index.html is byte-identical (indentation-
//           normalized) to core.mjs's CORE region.
//
// NOTE ON TOLERANCES: the page DISPLAYS an ε = (max−min)/mean over fired wedges (~1e-15, the actual
// numerical spread). This twin ASSERTS a guard tol of 1e-12 (claims 1/3/round-trip/wrap) and 1e-6
// (claim 2, the polygon approximation). The 1e-15 readout and the 1e-12 assertion are NOT a
// contradiction — one is the measured spread, the other is a deliberately-loose guard.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TAU, semiMinor, arealConstant, arealVelocity,
  keplerSolve, keplerSolveCumulative, MfromE,
  stateAtTime, timeAtTheta, sweepArea, angularSpeed, arealRate,
  polygonArea, fireWedge, sectorAreaNumeric, runSelfTest
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ok   ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; fails.push(name); console.log('  FAIL ' + name + (info ? '  [' + info + ']' : '')); }
}

console.log('The Equal-Area Sweep — core.test.mjs\n');

// ── (a) the core's own self-test is all-green ──
console.log('· core self-test (the same legs the in-page pill runs):');
const st = runSelfTest();
for (const c of st.checks) ck('selftest · ' + c.name, c.pass, c.info);

// ── CLAIM 1 · EQUAL-AREA across an eccentricity sweep × several tick counts ──
console.log('\n· CLAIM 1 — equal-time wedges are equal-area (= πab/nTicks):');
for (const e of [0, 0.2, 0.6, 0.85, 0.967]) {
  for (const n of [8, 12, 13]) {
    const areas = [];
    for (let k = 0; k < n; k++) areas.push(fireWedge(e, 'time', k * TAU / n, TAU / n, 64).areaClosed);
    const mn = Math.min(...areas), mx = Math.max(...areas);
    const spread = mx - mn;
    const expected = Math.PI * semiMinor(e) / n;         // πab/n with a=1
    const relErr = Math.abs(areas[0] - expected) / expected;
    ck('e=' + e + ' ×' + n + ' wedges equal-area',
      spread < 1e-12 && relErr < 1e-9,
      'spread ' + spread.toExponential(1) + ', πab/n match ' + relErr.toExponential(1));
  }
}
// dA/dt = L/2 constant, the same on every tick (areal velocity).
{
  const e = 0.85, n = 12, L = arealConstant(e);
  let worst = 0;
  for (let k = 0; k < n; k++) {
    const w = fireWedge(e, 'time', k * TAU / n, TAU / n, 32);
    const dAdt = w.areaClosed / (TAU / n);              // ΔA / Δt
    worst = Math.max(worst, Math.abs(dAdt - L / 2));
  }
  ck('dA/dt = L/2 constant on every equal-time wedge (e=0.85)',
    worst < 1e-12, 'max|ΔA/Δt − L/2| ' + worst.toExponential(1) + ' (L/2=' + arealVelocity(e).toFixed(4) + ')');
}

// ── CLAIM 2 · SHOELACE = ANALYTIC, and a THIRD route (Simpson) ──
console.log('\n· CLAIM 2 — the wedge area, re-derived two INDEPENDENT ways:');
for (const e of [0.2, 0.6, 0.85]) {
  const w = fireWedge(e, 'time', 0.7, TAU / 12, 4000);
  const dShoe = Math.abs(w.areaShoelace - w.areaClosed);
  ck('e=' + e + ' shoelace(focus + 4000 arc samples) = closed form',
    dShoe < 1e-6, '|Δ| ' + dShoe.toExponential(1) + ' (<1e-6, polygon approx)');
  // THIRD route: ½∫r(θ)²dθ over the tick's true-anomaly range (Simpson)
  const dSimp = Math.abs(sectorAreaNumeric(e, w.thetaStart, w.thetaEnd, 4000) - w.areaClosed);
  ck('e=' + e + ' Simpson ½∫r²dθ over the tick = closed form',
    dSimp < 1e-6, '|Δ| ' + dSimp.toExponential(1) + ' (<1e-6, quadrature)');
}

// ── CLAIM 3 · r²·θ̇ CONSTANT and equal to L (analytic cross product) ──
console.log('\n· CLAIM 3 — r²·θ̇ = L constant around the orbit (no finite differencing):');
for (const e of [0.2, 0.6, 0.85, 0.967]) {
  const L = arealConstant(e);
  let worstSpread = 0, worstVsL = 0, prevRate = null;
  const rates = [];
  for (let k = 0; k < 64; k++) {
    const E = k * TAU / 64;
    const rate = arealRate(e, E);
    rates.push(rate);
    worstVsL = Math.max(worstVsL, Math.abs(rate - L));
  }
  worstSpread = Math.max(...rates) - Math.min(...rates);
  ck('e=' + e + ' arealRate spread < 1e-12 AND = √(1−e²)',
    worstSpread < 1e-12 && worstVsL < 1e-12,
    'spread ' + worstSpread.toExponential(1) + ', |rate−L| ' + worstVsL.toExponential(1) + ' (L=' + L.toFixed(4) + ')');
}
// the page's drag-feel knob angularSpeed = L/r² is consistent with arealRate.
{
  const e = 0.6, L = arealConstant(e);
  let worst = 0;
  for (let k = 0; k < 32; k++) {
    const th = k * TAU / 32;
    const r = (1 - e * e) / (1 + e * Math.cos(th));
    worst = Math.max(worst, Math.abs(angularSpeed(th, e) * r * r - L));
  }
  ck('angularSpeed·r² = L (the drag-feel knob is honest)',
    worst < 1e-12, 'max|θ̇·r² − L| ' + worst.toExponential(1));
}

// ── NEG-CONTROL / DISCRIMINATION — same machinery passes 'time', FAILS 'angle' ──
console.log('\n· NEG-CONTROL — the equal-angle cheat produces UNEQUAL areas (the falsifier fires):');
// the cheat's inequality GROWS with eccentricity: already biting at e=0.2,
// gross by e=0.6 (>5×), enormous by e=0.85. Each row asserts its honest floor.
for (const { e, min } of [{ e: 0.2, min: 1.5 }, { e: 0.6, min: 5 }, { e: 0.85, min: 5 }]) {
  const n = 12, areas = [];
  for (let k = 0; k < n; k++) {
    const M0 = timeAtTheta(k * TAU / n, e);
    areas.push(fireWedge(e, 'angle', M0, TAU / n, 32).areaClosed);
  }
  const ratio = Math.max(...areas) / Math.min(...areas);
  ck('e=' + e + ' equal-angle cheat: max/min area ratio > ' + min + '×',
    ratio > min, 'ratio ' + ratio.toFixed(1) + '× (grows with e)');
}
// at e=0 BOTH modes are equal — the bite is eccentricity, not the machinery.
{
  const n = 12, t = [], a = [];
  for (let k = 0; k < n; k++) {
    t.push(fireWedge(0, 'time', k * TAU / n, TAU / n, 32).areaClosed);
    a.push(fireWedge(0, 'angle', k * TAU / n, TAU / n, 32).areaClosed);
  }
  const tRatio = Math.max(...t) / Math.min(...t);
  const aRatio = Math.max(...a) / Math.min(...a);
  ck('e=0 circle: BOTH modes equal (ratio = 1 ± 1e-12) — bite is eccentricity',
    Math.abs(tRatio - 1) < 1e-12 && Math.abs(aRatio - 1) < 1e-12,
    'time ' + tRatio.toFixed(12) + ', angle ' + aRatio.toFixed(12));
}

// ── WRAP-AROUND — the lap-crossing wedge stays honest (the landmine guard) ──
console.log('\n· WRAP-AROUND — keplerSolveCumulative keeps the lap-crossing wedge honest:');
for (const e of [0.2, 0.6, 0.85]) {
  const n = 12;
  const first = fireWedge(e, 'time', 0, TAU / n, 48).areaClosed;
  const wrap = fireWedge(e, 'time', (n - 1) * TAU / n, TAU / n, 48).areaClosed;
  ck('e=' + e + ' wrap wedge (M: 11π/6→2π) equals the first',
    Math.abs(wrap - first) < 1e-12, '|Δ| ' + Math.abs(wrap - first).toExponential(1));
  // and the naive collapse it guards against: M mod 2π on the second endpoint
  // would have given M1=0 < M0, a NEGATIVE/zero-collapsed area — show it differs.
  const Enaive0 = keplerSolve(((n - 1) * TAU / n) % TAU, e);
  const Enaive1 = keplerSolve((TAU) % TAU, e);            // = keplerSolve(0) = 0 → collapses
  const naive = Math.abs(sweepArea(e, Enaive0, Enaive1));
  ck('e=' + e + ' the naive M mod 2π WOULD collapse this wedge (guard earns its keep)',
    naive > first * 1.5, 'naive ' + naive.toFixed(4) + ' vs honest ' + first.toFixed(4));
}

// ── ROUND-TRIP — Kepler & the θ↔t inverse both round-trip to machine precision ──
console.log('\n· ROUND-TRIP — M↔E and θ↔t invert exactly:');
for (const e of [0.2, 0.6, 0.85, 0.967]) {
  let worstE = 0, worstT = 0;
  for (let k = 1; k < 64; k++) {
    const E = k * TAU / 64;
    worstE = Math.max(worstE, Math.abs(keplerSolve(MfromE(e, E), e) - E));
    const t = k * TAU / 64;
    const th = stateAtTime(t, e).theta;
    const back = timeAtTheta(th, e);
    const tMod = ((t % TAU) + TAU) % TAU;
    const d = Math.abs(back - tMod);
    worstT = Math.max(worstT, Math.min(d, TAU - d));
  }
  ck('e=' + e + ' keplerSolve(MfromE(E))=E and timeAtTheta(θ(t))=t',
    worstE < 1e-12 && worstT < 1e-12,
    'M↔E ' + worstE.toExponential(1) + ', θ↔t ' + worstT.toExponential(1));
}

// ── DOMAIN GUARDS — out-of-scope inputs return NaN, never silent garbage ──
console.log('\n· DOMAIN GUARDS — parabolic/hyperbolic/degenerate inputs → NaN:');
ck('keplerSolve(M, e<0) → NaN', Number.isNaN(keplerSolve(1, -0.1)));
ck('keplerSolve(M, e=1) → NaN (parabolic, out of scope)', Number.isNaN(keplerSolve(1, 1)));
ck('keplerSolve(M, e=1.5) → NaN (hyperbolic)', Number.isNaN(keplerSolve(1, 1.5)));
ck('keplerSolve(NaN, e) → NaN', Number.isNaN(keplerSolve(NaN, 0.5)));
ck('keplerSolveCumulative(M, e≥1) → NaN', Number.isNaN(keplerSolveCumulative(7, 1.2)));

// ── BYTE-TWIN PARITY — index.html's inlined core === core.mjs CORE region ──
console.log('\n· BYTE-TWIN PARITY — the page inlines core.mjs byte-identically:');
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
let pageSrc = '';
try { pageSrc = readFileSync(join(here, 'index.html'), 'utf8'); } catch (e) { /* forged later */ }
const BEGIN = '/* CORE BEGIN';
const END = '/* CORE END */';
function region(text) {
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
function norm(s) {
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = pageSrc ? region(pageSrc) : null;
ck('CORE sentinels present in core.mjs', !!coreRegion);
if (pageSrc) {
  ck('CORE sentinels present in index.html', !!pageRegion);
  ck('index.html inlined core === core.mjs CORE region (indentation-normalized)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion && coreRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED');
} else {
  console.log('  ..   index.html not forged yet — skipping page byte-parity (run forge, then re-test)');
}

// ── report ──
console.log('\n' + (fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
console.log('  Kepler 2nd law: every equal-TIME wedge area = πab/n (spread ~1e-15); the equal-ANGLE cheat fails.');
if (fail) { console.log('\n  FAILING:\n    ' + fails.join('\n    ')); process.exit(1); }
