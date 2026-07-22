// Node twin for The Bead That Falls Like Light core. Zero-dep.
// Run: `node cross/the-bead-that-falls-like-light/core.test.mjs`.
// Imports the SAME core.mjs that index.html inlines byte-identical, plus BOTH real
// parents (brachistochrone + refraction-run) at the same two ../ hops, so the page's
// gold self-test pill and this twin can never drift. It re-proves the rows the in-page
// pill proves (via runSelfTest), PLUS the byte-twin parity row and a code-disjointness
// grep (this cross core names NO integrator symbol of either parent — only their public
// solvers). ONE road: the least-time bead path and the least-time light ray are one curve.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as BRACH from '../../brachistochrone/core.mjs';
import * as REFR from '../../refraction-run/core.mjs';
import {
  G, XB, YB, refCycloid, cycloidTstar, solvePhoton, photonBouguer,
  invariantAlong, cycloidInvariantExact, invariantState, straightRamp,
  cycloidKnots, makeRamp, rampDescentTime, gapToLight, buildRunners, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Bead That Falls Like Light — Node twin (the brachistochrone bead and the Fermat ray are one road)\n');

// ── ROW 1: the shared runSelfTest (the exact function the page inlines as its pill) ──
console.log('— Row 1: the shared runSelfTest (page pill === this) —');
{
  const r = runSelfTest();
  for (const it of r.items) ck(it.label.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ''), it.ok,
    it.detail.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ''));
  ck('runSelfTest passes every row', r.pass === r.total, r.pass + '/' + r.total
    + ' · T*=' + r.Tstar.toFixed(4) + ' Tphoton=' + r.Tphoton.toFixed(4) + ' Tstraight=' + r.Tstraight.toFixed(4) + ' s');
}

// ── ROW 2: independent cross-check — BOTH parents agree on the invariant ──
console.log('\n— Row 2: both shipped cores agree — sinθ/v (bead) and n·sinθ (light) —');
{
  const c = refCycloid();
  const exact = cycloidInvariantExact(c, G, 800);
  const phot = solvePhoton(c);
  const bou = photonBouguer(phot.scene, phot.X);
  let mn = Infinity, mx = -Infinity; for (const v of bou){ mn = Math.min(mn, v); mx = Math.max(mx, v); }
  const bouRel = (mx - mn) / Math.abs(0.5 * (mx + mn));
  ck('cycloid sinθ/v relative spread < 1e-4 (bead core)', exact.relSpread < 1e-4, 'relSpread=' + exact.relSpread.toExponential(2));
  ck("refraction-run bouguerInvariant n·sinθ constant to machine-ε (light core)", bouRel < 1e-9, 'relSpread=' + bouRel.toExponential(2));
  // the two constants are the SAME statement (n ∝ 1/v ⇒ n·sinθ = const·(sinθ/v))
  ck('both invariants are one law (n·sinθ = const · sinθ/v with n ∝ 1/v)', exact.relSpread < 1e-4 && bouRel < 1e-9);
}

// ── ROW 3: neg-control is load-bearing — a hand ramp on the cycloid nearly ties;
//           the straight ramp badly loses; a vacuous checker would fail here ──
console.log('\n— Row 3: neg-control bites — cycloid-hugging ramp nears the tie; straight ramp loses —');
{
  const c = refCycloid();
  const Tstar = cycloidTstar(c, G);
  const near = makeRamp(cycloidKnots(c), XB, YB);
  const Tnear = rampDescentTime(near, XB, G);
  const straight = straightRamp();
  const Tstraight = rampDescentTime(straight, XB, G);
  ck('a cycloid-hugging hand ramp comes within ~2% (the dead-heat latch is reachable)', gapToLight(Tnear, Tstar).rel < 0.03,
    'gap ' + (gapToLight(Tnear, Tstar).rel * 100).toFixed(2) + '% (' + (Tnear - Tstar).toFixed(4) + ' s)');
  ck('the straight ramp is strictly slower by a visible margin', Tstraight > Tstar + 1e-3,
    'T_straight ' + Tstraight.toFixed(4) + ' s vs T* ' + Tstar.toFixed(4) + ' s');
  const cycVar = invariantAlong(c ? (function(){const p=[];for(let i=0;i<=400;i++){const th=c.thB*i/400;p.push({x:c.r*(th-Math.sin(th)),y:c.r*(1-Math.cos(th))});}return p;})() : [], G).var;
  const stVar = invariantAlong(straight.poly, G).var;
  ck('var(sinθ/v) straight ≫ 50× cycloid (the widget really discriminates)', stVar / cycVar > 50, 'ratio ' + (stVar / cycVar).toExponential(2));
}

// ── ROW 4: buildRunners wires the animation — three tables, gold≈photon, ramp lags ──
console.log('\n— Row 4: buildRunners — dead heat enacted in the animation clock —');
{
  const R = buildRunners([], XB, YB, G);   // [] = straight default ramp
  const heatMs = Math.abs(R.gold.T - R.photon.T) * 1000;
  ck('gold bead & photon tables finish within <1 frame (dead heat)', heatMs < 16, '|Δ| ' + heatMs.toFixed(3) + ' ms');
  ck('the straight default ramp lags both by a visible margin', R.ramp.T > Math.max(R.gold.T, R.photon.T) + 0.03,
    'ramp ' + R.ramp.T.toFixed(4) + ' vs light ' + Math.max(R.gold.T, R.photon.T).toFixed(4) + ' s');
  ck('the rendered photon road drives the live widget to STEADY green', invariantState(invariantAlong(R.photon.poly, G).cov) === 'steady');
}

// ── ROW 5: byte-twin parity + parent-hop + disjointness ──
console.log('\n— Row 5: byte-twin parity (index.html CORE === core.mjs CORE) + disjointness —');
{
  const B = '// === CORE BEGIN ===', E = '// === CORE END ===';
  const region = (t) => { const i = t.indexOf(B), j = t.indexOf(E); return (i < 0 || j < 0 || j < i) ? null : t.slice(i, j + E.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const coreReg = region(coreSrc);
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING'
      : (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
  // this cross core names ONLY the parents' public solvers, never their internal integrators.
  ck('cross core names NO brachistochrone-internal symbol (only its public solvers)',
    !/BRACH\.(rk4Step|deriv|buildTimeTableInternal)/.test(coreReg), 'reads solveCycloid/cycloidTime/descentTimeFn/buildTimeTable/posAtTime only');
  ck('cross core names NO refraction-run-internal solver symbol (only solveFermat/bouguerInvariant)',
    !/REFR\.(solveCoord|thomasSolve|hessianTri|gradL|numGradL)/.test(coreReg), 'reads solveFermat/bouguerInvariant only');
  // both parents imported at the same two ../ hops
  ck('both parents imported at the same two ../ hops', /\.\.\/\.\.\/brachistochrone\/core\.mjs/.test(coreSrc) && /\.\.\/\.\.\/refraction-run\/core\.mjs/.test(coreSrc));
}

console.log('\n—— The Bead That Falls Like Light — Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
