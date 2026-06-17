// Node twin for The Shape They Share core. Zero-dep. Run: `node cross/the-shape-they-share/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this test can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity leg (index.html CORE region === core.mjs CORE char-for-char) and an anti-circularity check.
//   1. AGREEMENT below the snap — two disjoint cores report the same a to < 1e-9 across a swept handle.
//   2. THRESHOLD === the analytic Goldschmidt argmin (U*·tanh(U*)=1, GMIN=cosh(U*)/U*), the existence
//      wall s*===2/GMIN, AND the area-crossover at 2h/R≈1.056.
//   3. NEGATIVE CONTROL (load-bearing) — past the wall solveCatenoidA===null while solveCatenary still
//      returns a finite a. A vacuous "they always agree" checker PASSES leg 1 and FAILS this.
//   4. closed-form catenoid area === numeric ∫ AND |H|≈0 (the lifted film core is sound).
//   5. catenary hits both pins + arc length to 1e-9 (the lifted chain core is sound).
//   6. determinism — same s ⇒ byte-identical (a_film, a_chain).
//   7. BYTE-TWIN PARITY — index.html's inlined CORE slab === core.mjs CORE char-for-char.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  USTAR, GMIN, S_STAR, S_AREA, RING_R,
  solveCatenary, catY, catLen, catVertexX,
  solveCatenoidA, coshArea_a, meanCurvatureCatenoid, profileArea, discArea, filmState,
  solveShared, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Shape They Share — Node twin (the legs the in-page pill proves + parity)\n');

// ── LEG 1: AGREEMENT below the snap ──────────────────────────────────────────────
console.log('— Leg 1: agreement (two disjoint cores report the SAME a below the snap, to <1e-9) —');
{
  let worst = 0, checked = 0;
  for (let s = 0.20; s < 1.27; s += 0.005) {
    const a_film = solveCatenoidA(RING_R, s / 2);
    if (a_film === null) continue;
    const L = 2 * a_film * Math.sinh((s / 2) / a_film);   // the catenary's own arc length for parameter a_film
    const sol = solveCatenary(s / 2, 0, L);
    if (!sol.ok) continue;
    worst = Math.max(worst, Math.abs(a_film - sol.a)); checked++;
  }
  ck('|a_chain − a_film| < 1e-9 across s∈[0.20,1.27)', worst < 1e-9 && checked > 100,
    'max Δ = ' + worst.toExponential(2) + ' over ' + checked + ' handle steps (two disjoint cores, one a)');
}

// ── LEG 2: THRESHOLD === analytic Goldschmidt argmin + wall + area-crossover ──────
console.log('\n— Leg 2: threshold === the analytic Goldschmidt argmin (wall + area-crossover) —');
{
  ck('the snap argmin satisfies U*·tanh(U*) = 1', Math.abs(USTAR * Math.tanh(USTAR) - 1) < 1e-7,
    '|U*·tanh(U*) − 1| = ' + Math.abs(USTAR * Math.tanh(USTAR) - 1).toExponential(2));
  ck('GMIN === cosh(U*)/U* (the existence floor of R/h)', GMIN === Math.cosh(USTAR) / USTAR,
    'GMIN = ' + GMIN.toFixed(6));
  ck('existence wall s* === 2/GMIN', Math.abs(S_STAR - 2 / GMIN) < 1e-15, 's* = ' + S_STAR.toFixed(5));
  ck('AREA-crossover lands at 2h/R ≈ 1.056 (soap-film published 1.056)', Math.abs(S_AREA - 1.0557) < 5e-3,
    '2h/R = ' + S_AREA.toFixed(4));
}

// ── LEG 3: NEGATIVE CONTROL (load-bearing) ───────────────────────────────────────
console.log('\n— Leg 3: load-bearing negative control (past the wall: film null, chain hangs on) —');
{
  const sPast = 1.345;
  const filmPast = solveCatenoidA(RING_R, sPast / 2);
  const chainPast = solveCatenary(sPast / 2, 0, 2.6 * (sPast / 2));
  ck('above the wall solveCatenoidA === null (two discs)', filmPast === null, 'film = ' + (filmPast === null ? 'null' : filmPast));
  ck('above the wall solveCatenary STILL returns a finite valid a (the chain hangs)', chainPast.ok && chainPast.a > 0,
    'chain a = ' + (chainPast.ok ? chainPast.a.toFixed(4) : 'fail'));
  // ANTI-VACUITY: a checker that just returns the film's a for both would have NO a past the wall ⇒ FAIL.
  ck('a vacuous "always agree" checker would FAIL this leg (the control has teeth)',
    filmPast === null && chainPast.a > 0);
  // and below the wall the film DOES exist (so the wall is a real boundary, not a constant null)
  const filmBelow = solveCatenoidA(RING_R, 1.0 / 2);
  ck('below the wall solveCatenoidA exists (the boundary is real, not always-null)', filmBelow !== null && filmBelow > 0,
    'film a @ s=1.0 = ' + (filmBelow === null ? 'null' : filmBelow.toFixed(4)));
}

// ── LEG 4: closed-form catenoid area === numeric ∫, and |H|≈0 (the lifted film core) ──
console.log('\n— Leg 4: catenoid area closed-form === numeric, and the surface is minimal (|H|≈0) —');
{
  const R = 1, h = 0.5, a = solveCatenoidA(R, h);
  const closed = coshArea_a(a, h);
  const N = 4000, zs = [], rs = [];
  for (let i = 0; i <= N; i++) { const z = -h + (2 * h) * (i / N); zs.push(z); rs.push(a * Math.cosh(z / a)); }
  const numeric = profileArea(zs, rs);
  ck('closed-form area === numeric ∫ to < 1e-6 relative', Math.abs(closed - numeric) / closed < 1e-6,
    'rel err = ' + (Math.abs(closed - numeric) / closed).toExponential(2));
  let maxH = 0; for (let i = 1; i < N; i++) maxH = Math.max(maxH, Math.abs(meanCurvatureCatenoid(a, zs[i])));
  ck('mean curvature |H| ≈ 0 everywhere (a minimal surface)', maxH < 1e-9, '|H|max = ' + maxH.toExponential(2));
  // and the disc competitor is what it snaps TO
  ck('discArea(R) = 2πR² is the Goldschmidt competitor', Math.abs(discArea(1) - 2 * Math.PI) < 1e-12);
}

// ── LEG 5: catenary hits both pins + arc length (the lifted chain core) ───────────
console.log('\n— Leg 5: catenary hits both pins and matches arc length to 1e-9 (the lifted chain core) —');
{
  const h = 0.6, a0 = solveCatenoidA(1, h);
  const L = 2 * a0 * Math.sinh(h / a0);
  const sol = solveCatenary(h, 0, L);
  const yA = catY(sol, -h), yB = catY(sol, h);
  const lenErr = Math.abs(catLen(sol) - L);
  ck('both pins at y-down 0 (symmetric drop)', Math.abs(yA) < 1e-9 && Math.abs(yB) < 1e-9,
    'yA = ' + yA.toExponential(1) + ' · yB = ' + yB.toExponential(1));
  ck('catLen === requested L to < 1e-9', lenErr < 1e-9, 'len err = ' + lenErr.toExponential(2));
  ck('vertex (deepest sag) lies within the span', catVertexX(sol) >= -h - 1e-9 && catVertexX(sol) <= h + 1e-9);
}

// ── LEG 6: determinism ───────────────────────────────────────────────────────────
console.log('\n— Leg 6: determinism (same s ⇒ byte-identical a) —');
{
  const A = solveShared(0.8), B = solveShared(0.8);
  ck('solveShared(0.8) === solveShared(0.8) in a_film & a_chain', A.a_film === B.a_film && A.a_chain === B.a_chain,
    'a_film = ' + A.a_film.toFixed(6) + ' · a_chain = ' + A.a_chain.toFixed(6));
}

// ── PARITY: the in-page self-test agrees with this twin (the same runSelfTest) ────
console.log('\n— The shared runSelfTest (the function the page inlines) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok, r.pass + '/' + r.total + (r.detail.length ? ' · ' + r.detail.join(',') : ''));
}

// ── LEG 7: BYTE-TWIN PARITY ──────────────────────────────────────────────────────
console.log('\n— Leg 7: single-source discipline (the inlined slab is the module, byte-for-byte) —');
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

// ── ANTI-CIRCULARITY: the two cores must be DISJOINT (neither solver calls the other) ──
console.log('\n— Anti-circularity: the two cores are disjoint (neither solver calls the other) —');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'core.mjs'), 'utf8');
  const catBody = src.slice(src.indexOf('function solveCatenary'), src.indexOf('function catY'));
  const filmBody = src.slice(src.indexOf('function solveCatenoidA'), src.indexOf('function meanCurvatureCatenoid'));
  ck('solveCatenary never calls solveCatenoidA (gravity core is disjoint)', !/solveCatenoidA/.test(catBody));
  ck('solveCatenoidA never calls solveCatenary (tension core is disjoint)', !/solveCatenary/.test(filmBody));
}

console.log('\n—— The Shape They Share Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
