// ============================================================================
//  THE FIRST INTEGRAL — Node twin of the in-page self-test.
//  Run:  node first-integral/core.test.mjs
//  Proves the falsifiable claim EXACT, and that the in-page core is byte-identical
//  to this module (re-extraction parity), so "self-test green" can't drift.
// ============================================================================
import {
  hCatenary, hCatenoid, hBrachistochrone, firstIntegralBrachistochrone,
  sampleCatenary, sampleCatenoid, sampleCycloid, sampleArc, sampleParabola,
  flatness, buildPanels, runSelfTest,
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

const TOL = 1e-9;

console.log('\n— The full in-page self-test —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

// CATENARY: H = a exactly, analytically, for y=a·cosh(x/a).
{
  const a = 1.37, w = 1.9;
  const s = sampleCatenary(a, w, 500);
  const f = flatness(s, hCatenary);
  check('catenary H̄ == a to <1e-12', Math.abs(f.mean - a) < 1e-12, '|H̄−a|=' + Math.abs(f.mean - a).toExponential(2));
  check('catenary H flat to <1e-12 (a is the parameter)', f.relDev < 1e-12, 'rel ' + f.relDev.toExponential(2));
  // hand-check one interior point: H(y,y′) = a·cosh / cosh = a.
  const t = 0.6, y = a * Math.cosh(t), yp = Math.sinh(t);
  check('catenary H at one interior point == a', Math.abs(hCatenary(y, yp) - a) < 1e-14,
        'H=' + hCatenary(y, yp).toFixed(12));
}

// CATENOID: same integrand, a DIFFERENT object (radius profile), const = neck a.
{
  const a = 0.5, h = 0.9;
  const s = sampleCatenoid(a, h, 500);
  const f = flatness(s, hCatenoid);
  check('catenoid H̄ == neck radius a to <1e-12', Math.abs(f.mean - a) < 1e-12,
        '|H̄−a|=' + Math.abs(f.mean - a).toExponential(2));
  check('catenoid and catenary use the SAME integrand object', hCatenoid === hCatenary);
}

// BRACHISTOCHRONE: classic first integral y·(1+y′²)=2r and H=1/(2√r) on the OPEN
//   interval. Sweep many windows; the cusp τ=0 is excluded by construction.
{
  for (const r0 of [0.3, 0.55, 1.0, 2.0]) {
    const s = sampleCycloid(r0, 0.4, 2.6, 400);
    const fFI = flatness(s, firstIntegralBrachistochrone);
    const fH = flatness(s, hBrachistochrone);
    check('cycloid r=' + r0 + ': y·(1+y′²) == 2r flat', fFI.relDev < TOL && Math.abs(fFI.mean - 2 * r0) < 1e-9,
          'y(1+y′²)=' + fFI.mean.toFixed(9) + '  2r=' + (2 * r0).toFixed(9));
    check('cycloid r=' + r0 + ': H == 1/(2√r) flat', fH.relDev < TOL && Math.abs(fH.mean - 1 / (2 * Math.sqrt(r0))) < 1e-9,
          'H=' + fH.mean.toFixed(9) + '  1/(2√r)=' + (1 / (2 * Math.sqrt(r0))).toFixed(9));
  }
  // The two forms agree: H = 1/√(2·[y·(1+y′²)]) pointwise.
  const s = sampleCycloid(0.7, 0.5, 2.5, 300);
  let maxLink = 0;
  for (const p of s) {
    const fi = firstIntegralBrachistochrone(p.y, p.yp);
    const h = hBrachistochrone(p.y, p.yp);
    maxLink = Math.max(maxLink, Math.abs(h - 1 / Math.sqrt(2 * fi)));
  }
  check('the two brachistochrone forms agree pointwise (H = 1/√(2·y(1+y′²)))', maxLink < 1e-14,
        'max link err ' + maxLink.toExponential(2));
}

// NEGATIVE CONTROL with teeth: the catenary's true cosh is flat under hCatenary,
//   but a circular arc AND a parabola through the same pins are NOT.
{
  const a = 0.85, w = 1.25;
  const y0 = a * Math.cosh(w / a), sag = y0 - a;
  const tru = flatness(sampleCatenary(a, w, 240), hCatenary);
  const arc = flatness(sampleArc(w, y0, sag, 240), hCatenary);
  const par = flatness(sampleParabola(w, y0, sag, 240), hCatenary);
  check('the TRUE catenary is flat under its H', tru.relDev < TOL, 'rel ' + tru.relDev.toExponential(2));
  check('the circular ARC is NOT flat under the catenary H (>1e-3)', arc.relDev > 1e-3,
        'arc varies ' + (arc.relDev * 100).toFixed(2) + '%');
  check('the PARABOLA is NOT flat under the catenary H (>1e-3)', par.relDev > 1e-3,
        'parabola varies ' + (par.relDev * 100).toFixed(2) + '%');
  // the impostors are MANY orders of magnitude wavier than the true curve:
  check('impostor / truth flatness ratio > 1e6 (the law clearly discriminates)',
        arc.relDev / Math.max(tru.relDev, 1e-300) > 1e6,
        'ratio ' + (arc.relDev / Math.max(tru.relDev, 1e-300)).toExponential(1));
}

// NEVER sample the cusp: the cycloid window must keep y>0 throughout.
{
  const s = sampleCycloid(0.55, 0.45, 2.55, 240);
  const minY = Math.min(...s.map((p) => p.y));
  check('cycloid OPEN-interval sampling keeps y>0 (no y=0 cusp)', minY > 0, 'min y = ' + minY.toExponential(2));
}

// Determinism: two full runs are byte-identical.
{
  const a = JSON.stringify(runSelfTest().detail);
  const b = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === b);
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== FIRST-INTEGRAL CORE sentinels).
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== FIRST-INTEGRAL CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END FIRST-INTEGRAL CORE =====';

  // Extract from the module: everything between the first integrand and the export.
  const modBody = modSrc
    .slice(modSrc.indexOf('function hCatenary'), modSrc.indexOf('export {'))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the FIRST-INTEGRAL CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    // the page wraps the same functions but drops `export`/`import`; compare the
    // function bodies that both share, normalised for leading indentation.
    const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
