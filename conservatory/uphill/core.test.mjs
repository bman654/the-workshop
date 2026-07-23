// ============================================================================
//  THE CONSERVATORY · UPHILL WITH THEIR EYES CLOSED — Node twin of the in-page
//  payoff-liveness self-test.
//  Run:  node conservatory/uphill/core.test.mjs
//
//  This is a DELIGHT piece, so the twin proves the PAYOFF FIRES, not a theorem:
//  the blind swarm floods uphill toward the painted nectar while the identical
//  GAIN=0 control does not — and the honesty guards (blindness, mechanism,
//  adaptation, determinism, dish invariants) hold.  It also proves the SIM-CORE
//  inlined in index.html is byte-identical to core.mjs (re-extraction parity), so
//  "self-test green" in the page can never drift from this file.
// ============================================================================
import {
  GW, GH, CX, CY, RDISH, DEFAULT,
  makeField, wipe, paintBump, diffuseDecay, sampleC,
  uniformReorient, tumbleRate, makeSwarm, reflectAtRim, step,
  centerOfMass, meanConcAtCells, distCOMtoPeak, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test (the proven payoff core) —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

const DT = 1 / 60;

// THE MIGRATION, re-run from scratch here.  A static nectar bump offset from a
// centred swarm: the chemotactic COM floods to it; the GAIN=0 control does not.
{
  const PEAK = { x: CX + 24, y: CY - 8 };
  function run(gain, seed) {
    const f = makeField(); paintBump(f, PEAK.x, PEAK.y, 1.0, 15);
    const sw = makeSwarm(seed, 400, 16);
    step(sw, f, DT, { ...DEFAULT, GAIN: gain });
    const c0 = meanConcAtCells(sw, f), d0 = distCOMtoPeak(sw, PEAK);
    for (let i = 0; i < 1000; i++) step(sw, f, DT, { ...DEFAULT, GAIN: gain });
    return { sw, c1: meanConcAtCells(sw, f), c0, d0, d1: distCOMtoPeak(sw, PEAK) };
  }
  const chemo = run(DEFAULT.GAIN, 0xA11CE), ctrl = run(0, 0xA11CE);
  check('the blind chemotactic swarm floods uphill: mean-scent climbs and the COM closes on the peak',
        (chemo.c1 - chemo.c0) > 0.2 && (chemo.d0 - chemo.d1) > 12,
        'climb=' + (chemo.c1 - chemo.c0).toFixed(3) + '  dist ' + chemo.d0.toFixed(1) + '→' + chemo.d1.toFixed(1));
  check('the GAIN=0 control (same seed/field) never finds the food: COM stays far from the peak',
        ctrl.d1 > 3 * chemo.d1,
        'chemo ' + chemo.d1.toFixed(1) + ' vs ctrl ' + ctrl.d1.toFixed(1) + ' units  ·  ' + (ctrl.d1 / chemo.d1).toFixed(1) + '× closer');
}

// THE BLINDNESS is structural, not a coincidence of a seed: reorientation is
// UNIFORM.  Draw many uniformReorient headings and confirm the mean of cos/sin
// is ~0 (no preferred direction) over a fresh seed.
{
  const rng = (function (s) { return function () { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(777);
  let sc = 0, ss = 0; const M = 200000;
  for (let i = 0; i < M; i++) { const th = uniformReorient(rng); sc += Math.cos(th); ss += Math.sin(th); }
  check('uniformReorient is directionally unbiased: mean cos & sin ≈ 0 over 200k draws',
        Math.abs(sc / M) < 0.01 && Math.abs(ss / M) < 0.01,
        '⟨cos⟩=' + (sc / M).toFixed(4) + '  ⟨sin⟩=' + (ss / M).toFixed(4));
}

// THE RATE LAW — climbing suppresses tumbling monotonically, clamped to the band.
{
  let mono = true;
  for (let d = -1; d < 1; d += 0.05) if (!(tumbleRate(d + 0.05) <= tumbleRate(d) + 1e-12)) mono = false;
  check('tumbleRate is non-increasing in dc/dt (climbing ⇒ fewer tumbles), clamped to [R_MIN,R_MAX]',
        mono && tumbleRate(10) === DEFAULT.R_MIN && tumbleRate(-10) === DEFAULT.R_MAX && tumbleRate(0) === DEFAULT.R0,
        'R_MIN=' + DEFAULT.R_MIN + '  R0=' + DEFAULT.R0 + '  R_MAX=' + DEFAULT.R_MAX);
}

// GAIN=0 IS the constant-rate random walk — the neg-control identity.  With
// GAIN=0 every cell's tumble rate is exactly R0 regardless of dc/dt.
{
  const p = { ...DEFAULT, GAIN: 0 };
  let allR0 = true;
  for (const d of [-2, -0.5, 0, 0.3, 5]) if (tumbleRate(d, p) !== DEFAULT.R0) allR0 = false;
  check('GAIN=0 collapses the rule to a constant-rate (R0) random walk (the neg-control)', allR0);
}

// ADAPTATION on a broad flat top: a cell parked at a locally-flat maximum sees
// dc/dt→0 and its rate returns to baseline R0 — the source of the peak shimmer.
{
  const f = makeField(); paintBump(f, CX, CY, 1.0, 45);
  const sw = makeSwarm(3, 1, 0); sw.cells[0].x = CX; sw.cells[0].y = CY; sw.cells[0].theta = 0;
  for (let i = 0; i < 3; i++) step(sw, f, DT, DEFAULT);
  check('a cell on a flat summit has dc/dt≈0 ⇒ reverts to baseline R0 (peak shimmer)',
        Math.abs(sw.cells[0].dcdt) < 0.05 && Math.abs(tumbleRate(sw.cells[0].dcdt) - DEFAULT.R0) < 0.2,
        'dc/dt=' + sw.cells[0].dcdt.toFixed(4));
}

// THE DISH is a true reflecting boundary: launch a cell straight at the rim and
// confirm it never escapes over a long run and its speed is conserved.
{
  const f = makeField();
  const sw = makeSwarm(5, 1, 0); sw.cells[0].x = CX; sw.cells[0].y = CY; sw.cells[0].theta = 0.7;
  let allIn = true, maxD = 0;
  const p = { ...DEFAULT, R0: 0, R_MIN: 0, R_MAX: 0 };   // no tumbles: a pure ballistic ray bouncing
  for (let i = 0; i < 5000; i++) {
    const bx = sw.cells[0].x, by = sw.cells[0].y;
    step(sw, f, DT, p);
    const moved = Math.hypot(sw.cells[0].x - bx, sw.cells[0].y - by);
    // speed conserved except on a reflection frame (where the fold shortens the step)
    if (moved > DEFAULT.V * DT + 1e-9) allIn = false;
    const d = Math.hypot(sw.cells[0].x - CX, sw.cells[0].y - CY);
    if (d > maxD) maxD = d; if (d > RDISH + 1e-6) allIn = false;
  }
  check('a ballistic ray bounces inside the dish forever (never escapes; speed never exceeds V·dt)',
        allIn, 'max r reached = ' + maxD.toFixed(3) + ' ≤ ' + RDISH);
}

// THE PLUME diffuses + decays deterministically and conserves nothing forever:
// total scent strictly decreases each frame (decay), and a sharp bump spreads.
{
  const f = makeField(); paintBump(f, CX, CY, 1.0, 6);
  const sum = () => { let s = 0; for (let i = 0; i < f.c.length; i++) s += f.c[i]; return s; };
  const s0 = sum(); const peak0 = sampleC(f, CX, CY);
  for (let i = 0; i < 30; i++) diffuseDecay(f, 0.16, 0.997);
  const s1 = sum(); const peak1 = sampleC(f, CX, CY);
  check('diffuseDecay dissipates the plume: total scent falls (decay) and the peak spreads/softens',
        s1 < s0 && peak1 < peak0 && s1 > 0,
        'Σ ' + s0.toFixed(1) + '→' + s1.toFixed(1) + '  peak ' + peak0.toFixed(3) + '→' + peak1.toFixed(3));
  // determinism of the field op
  const g = makeField(); paintBump(g, CX, CY, 1.0, 6);
  const h = makeField(); paintBump(h, CX, CY, 1.0, 6);
  for (let i = 0; i < 30; i++) { diffuseDecay(g, 0.16, 0.997); diffuseDecay(h, 0.16, 0.997); }
  check('diffuseDecay is deterministic (two runs byte-identical)',
        JSON.stringify([...g.c]) === JSON.stringify([...h.c]));
  // wipe returns the dish to bare soil
  wipe(g); let z = 0; for (let i = 0; i < g.c.length; i++) z += Math.abs(g.c[i]);
  check('wipe() clears the dish to bare soil (Σ|c| = 0)', z === 0);
}

// sampleC bilinear correctness — exact at a grid node, and the mid-edge of two
// nodes is their exact average.
{
  const f = makeField();
  f.c[10 * GW + 20] = 4; f.c[10 * GW + 21] = 8;
  check('sampleC is exact at a grid node', sampleC(f, 20, 10) === 4 && sampleC(f, 21, 10) === 8);
  check('sampleC bilinear midpoint is the exact average', Math.abs(sampleC(f, 20.5, 10) - 6) < 1e-6);
}

// DETERMINISM of the whole self-test.
{
  const a = JSON.stringify(runSelfTest().detail);
  const b = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === b);
}

// GEOMETRY constants are the single shared truth.
check('fixed dish geometry GW=160 GH=120 RDISH=54, centre at grid middle',
      GW === 160 && GH === 120 && RDISH === 54 && CX === (GW - 1) / 2 && CY === (GH - 1) / 2);

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the SIM-CORE inlined in index.html is byte-identical
//  to core.mjs (between the // ===== SIM-CORE sentinels), indentation-normalised.
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== SIM-CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END SIM-CORE =====';
  const mi = modSrc.indexOf(START), mj = modSrc.indexOf(END);
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('core.mjs & index.html both contain the SIM-CORE sentinels', mi >= 0 && mj > mi && pi >= 0 && pj > pi);
  if (mi >= 0 && mj > mi && pi >= 0 && pj > pi) {
    const modBody = modSrc.slice(mi + START.length, mj).trim();
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
    check('inlined SIM-CORE matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
