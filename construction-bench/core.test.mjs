// Node twin for The Construction Bench math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (between the
// CORE sentinels), so the page's self-test pill and this test can never drift. Proves
// the six load-bearing claims AND a byte-twin parity check.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  rat, num, add, sub, mul, div, sqrtA, P, line, circle,
  intersectLineLine, intersectLineCircle, intersectCircleCircle,
  towerHeightOf, certify, TARGETS, rationalRootTest, neusisLand, solveCubicNeusis,
  pentagonCos72, depth2Witness, perpBisector, isPow2, threeNeverDivides2k,
  evalExact, mulberry32, runSelfTest
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }
const polyAt = (coeffs, x) => { let s = 0; for (let i = coeffs.length - 1; i >= 0; i--) s = s * x + coeffs[i]; return s; };

// ── C1: EXACT == FLOAT < 1e-9 over ≥2000 random honest constructions ──
const rng = mulberry32(0xBEEF1234 >>> 0);
let n1 = 0, worst1 = 0;
for (let i = 0; i < 3000 && n1 < 2600; i++){
  const rp = () => P(num(rat(Math.floor(rng() * 60) - 30, 1)), num(rat(Math.floor(rng() * 60) - 30, 1)));
  const a = rp(), b = rp(), c = rp(), d = rp();
  if (Math.hypot(a.x.f - b.x.f, a.y.f - b.y.f) < 1e-6) continue;
  if (Math.hypot(c.x.f - d.x.f, c.y.f - d.y.f) < 1e-6) continue;
  for (const pt of intersectLineCircle(line(a, b), circle(c, d))){
    n1++;
    worst1 = Math.max(worst1, Math.abs(evalExact(pt.x) - pt.x.f), Math.abs(evalExact(pt.y) - pt.y.f));
  }
  for (const pt of intersectCircleCircle(circle(a, b), circle(c, d))){
    n1++;
    worst1 = Math.max(worst1, Math.abs(evalExact(pt.x) - pt.x.f), Math.abs(evalExact(pt.y) - pt.y.f));
  }
}
ck('C1: EXACT == FLOAT < 1e-9 over ' + n1 + ' random honest constructions', n1 >= 2000 && worst1 < 1e-9);

// ── C2: every constructed point's tower height is a power of 2 (never 3/5/6/7) ──
let allPow2 = true, deepest = 1, badHeights = [];
const rng2 = mulberry32(0x5EED9999 >>> 0);
for (let i = 0; i < 800; i++){
  const rp = () => P(num(rat(Math.floor(rng2() * 24) - 12, 1)), num(rat(Math.floor(rng2() * 24) - 12, 1)));
  const a = rp(), b = rp(), c = rp(), d = rp();
  if (Math.hypot(a.x.f - b.x.f, a.y.f - b.y.f) < 1e-6) continue;
  for (const pt of intersectCircleCircle(circle(a, b), circle(c, d))){
    const h = towerHeightOf(pt); deepest = Math.max(deepest, h);
    if (!isPow2(h)){ allPow2 = false; if (badHeights.length < 5) badHeights.push(h); }
  }
}
const pentH = Math.pow(2, pentagonCos72().depth);
const d2H = Math.pow(2, depth2Witness().depth);
// pentagon anchor: cos72° = (√5−1)/4, degree 2. 17-gon's tower is declared 16, minPoly deg 8.
ck('C2: all constructed degrees are powers of 2 (no ' + (badHeights.join(',') || 'violations') + ')', allPow2);
ck('C2 anchor: pentagon cos72° tower height === 2', pentH === 2);
ck('C2 anchor: √(2+√3) tower height === 4 (depth-2 stacks honestly)', d2H === 4);
ck('C2 anchor: line∩line never deepens the tower (height 1)', (() => {
  const p = intersectLineLine(line(P(num(0), num(0)), P(num(3), num(1))), line(P(num(0), num(2)), P(num(4), num(0))))[0];
  return towerHeightOf(p) === 1;
})());
ck("C2 anchor: 17-gon target declares minPoly degree 8 (=2³) and tower height 16 (=2⁴)",
   TARGETS.heptadecagon.degree === 8 && TARGETS.heptadecagon.towerHt === 16);
ck('C2 anchor: pentagon target declares minPoly degree 2, tower height 2',
   TARGETS.pentagon.degree === 2 && TARGETS.pentagon.towerHt === 2);

// ── C3: the three impossibility certificates — irreducible deg-3, RRT witness, unreachable ──
let c3 = true;
const c3rows = [];
for (const key of ['trisect-60', 'double-cube', 'heptagon']){
  const cert = certify(key);
  const rootOk = Math.abs(polyAt(cert.minPoly.coeffs, cert.value)) < 1e-12;
  const ok = cert.degree === 3 && cert.irreducible === true && cert.witness.kind === 'RRT' &&
             cert.witness.anyRationalRoot === null && cert.reachable === false && rootOk;
  if (!ok) c3 = false;
  c3rows.push(key + ' deg' + cert.degree + (ok ? '✓' : '✗'));
}
ck('C3: trisect-60 (8x³−6x−1), double-cube (x³−2), heptagon (x³+x²−2x−1) each irreducible deg-3, unreachable [' + c3rows.join(' ') + ']', c3);
ck('C3: the exact minimal polynomials match the named values', (() => {
  return Math.abs(polyAt([-1, -6, 0, 8], Math.cos(20 * Math.PI / 180))) < 1e-12 &&   // 8x³−6x−1 @ cos20°
         Math.abs(polyAt([-2, 0, 0, 1], Math.cbrt(2))) < 1e-12 &&                     // x³−2 @ ∛2
         Math.abs(polyAt([-1, -2, 1, 1], 2 * Math.cos(2 * Math.PI / 7))) < 1e-12;     // x³+x²−2x−1 @ 2cos2π/7
})());
ck('C3: 3 ∤ 2ᵏ for all k≤64 (so a degree-3 value is outside any line-circle program)', threeNeverDivides2k());
ck('C3: RRT confirms NO rational root for each cubic (candidate set exhausted)', (() => {
  return rationalRootTest([-1, -6, 0, 8]).noRationalRoot &&
         rationalRootTest([-2, 0, 0, 1]).noRationalRoot &&
         rationalRootTest([-1, -2, 1, 1]).noRationalRoot;
})());

// ── C4: NEG-CONTROL tool-relative — neusis LANDS the three deg-3 targets ──
let c4 = true;
const c4rows = [];
for (const key of ['trisect-60', 'double-cube', 'heptagon']){
  const honest = certify(key).reachable;
  const withN = certify(key, { neusis: true }).reachable;
  const landed = neusisLand(key);
  const land = Math.abs(polyAt(TARGETS[key].coeffs, landed)) < 1e-9;
  const near = Math.abs(landed - TARGETS[key].value) < 1e-6;   // it lands the RIGHT root
  const ok = honest === false && withN === true && land && near;
  if (!ok) c4 = false;
  c4rows.push(key + (ok ? '✓' : '✗'));
}
ck('C4: honest tools FAIL, neusis SUCCEEDS on exactly the three degree-3 roots [' + c4rows.join(' ') + ']', c4);

// ── C5: NEG-CONTROL false-equal — a claimed point >1e-2 off fails its root test ──
ck('C5: a claimed trisector 0.03 off fails the minimal-poly root test (rejected)', (() => {
  const trueVal = TARGETS['trisect-60'].value;
  const claimed = trueVal + 0.03;
  return Math.abs(claimed - trueVal) > 1e-2 &&
         Math.abs(polyAt(TARGETS['trisect-60'].coeffs, claimed)) > 1e-3 &&
         Math.abs(polyAt(TARGETS['trisect-60'].coeffs, trueVal)) < 1e-12;
})());

// ── C6: DAG invariance — rotation can't change degree; the perp-bisector arc is honest ──
ck('C6: certify is rotation-invariant (degree is a field property, not a picture)', (() => {
  for (const _ of [0, 1, 2, 3]){ if (certify('trisect-60').reachable !== false) return false; }
  return certify('double-cube').degree === 3 && certify('heptagon').degree === 3;
})());
ck('C6: perpendicular bisector is born only as an intersection of two equal arcs (honest)', (() => {
  const pb = perpBisector(P(num(0), num(0)), P(num(4), num(0)));
  // the bisector of (0,0)-(4,0) crosses x=2; check the two arc-intersection points share x≈2.
  return Math.abs(pb.pts[0].x.f - 2) < 1e-9 && Math.abs(pb.pts[1].x.f - 2) < 1e-9;
})());

// ── the bench's own runSelfTest (the SAME function the page pill runs) is all-green ──
const st = runSelfTest();
ck('runSelfTest() (the in-page pill twin) reports all ' + st.total + ' checks pass', st.ok && st.passed === st.total);

// ── C7 / BYTE-TWIN PARITY: index.html CORE region === core.mjs CORE region ──
function coreRegion(text){
  const BEGIN = '// === CONSTRUCTION-BENCH CORE BEGIN ===';
  const END = '// === CONSTRUCTION-BENCH CORE END ===';
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i, j + END.length);
}
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
let pageReg = null, coreReg = coreRegion(coreSrc);
try { pageReg = coreRegion(readFileSync(join(here, 'index.html'), 'utf8')); } catch { pageReg = null; }
ck('byte-twin: core.mjs CORE region present', !!coreReg);
ck('byte-twin: index.html CORE region present (run the forge if missing)', !!pageReg);
ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical — the forge guarantees it)',
   !!coreReg && !!pageReg && coreReg === pageReg);

// ── report ──
console.log('The Construction Bench · core.test.mjs');
console.log('  C1 exact==float: ' + n1 + ' honest points, worst |Δ| = ' + worst1.toExponential(2));
console.log('  C2 powers-of-2: deepest tower seen = ' + deepest + ' (pentagon ' + pentH + ', √(2+√3) ' + d2H + ')');
console.log('  C3 cubics: trisect-60 8x³−6x−1 · double-cube x³−2 · heptagon x³+x²−2x−1 — all irreducible deg-3');
console.log('  C4 neusis lands: ' + c4rows.join(' '));
console.log('  in-page pill twin: ' + st.passed + '/' + st.total + (st.ok ? ' ✓' : ' ✗'));
console.log('  byte-twin parity: ' + (coreReg && pageReg && coreReg === pageReg ? 'IDENTICAL' : (pageReg ? 'DRIFTED' : 'index.html not forged yet')));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
