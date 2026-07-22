// Node twin for The Brachistochrone core. Zero-dep. Run: `node brachistochrone/core.test.mjs`.
// Imports the SAME core.mjs that index.html inlines byte-identical, so the page's gold
// self-test pill and this twin can never drift. It re-proves the 7 rows the in-page pill
// proves (via runSelfTest), PLUS the byte-twin parity row (index.html CORE === core.mjs
// CORE char-for-char) and a few direct-function spot checks that the kin (The Bead That
// Falls Like Light) relies on when it imports solveCycloid / cycloidTime / descentTimeFn.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  solveCycloid, cycloidTime, descentTimeFn,
  trackLine, trackArc, trackParab,
  tautochroneAnalytic, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Brachistochrone — Node twin (the curve of fastest descent + its tautochrone twin)\n');

// ── ROW A: the shared runSelfTest (the exact function the page inlines as its pill) ──
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all rows (the in-page pill is this same function)', r.pass === r.total,
    r.pass + '/' + r.total + ' · cycloid ' + r.Tcyc.toFixed(5) + ' s beats line ' + r.Tline.toFixed(5) + ' s');
}

// ── ROW B: byte-twin parity — index.html CORE === core.mjs CORE (char-for-char) ──
{
  const B = '// === BRACHISTOCHRONE CORE BEGIN ===', E = '// === BRACHISTOCHRONE CORE END ===';
  const region = (t) => { const i = t.indexOf(B), j = t.indexOf(E); return (i < 0 || j < 0 || j < i) ? null : t.slice(i, j + E.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreReg = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING'
      : (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

// ── ROW C: direct spot checks the kin relies on (solveCycloid / cycloidTime / descentTimeFn) ──
{
  const g = 9.81, xB = 2.0, yB = 1.0;
  const c = solveCycloid(xB, yB);
  // passes through A & B
  const xb = c.r * (c.thB - Math.sin(c.thB)), yb = c.r * (1 - Math.cos(c.thB));
  ck('solveCycloid threads A=(0,0) and B exactly', Math.max(Math.abs(xb - xB), Math.abs(yb - yB)) < 1e-9,
    'r=' + c.r.toFixed(4) + ' θB=' + c.thB.toFixed(4));
  // cycloid time is the least: strictly faster than the straight line for the same A→B
  const T = cycloidTime(c.r, c.thB, g);
  const ln = trackLine(xB, yB);
  const Tline = descentTimeFn(ln.y, ln.yp, xB, g, 40000);
  ck('cycloidTime < straight-line descentTimeFn (fastest descent, strict)', T < Tline - 1e-4,
    'cycloid ' + T.toFixed(5) + ' s < line ' + Tline.toFixed(5) + ' s');
  // tautochrone closed form
  ck('tautochroneAnalytic(r,g) = π√(r/g)', Math.abs(tautochroneAnalytic(0.7, g) - Math.PI * Math.sqrt(0.7 / g)) < 1e-12);
}

console.log('\n—— Brachistochrone Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
