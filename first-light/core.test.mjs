// ============================================================================
//  Node twin for FIRST LIGHT core (metric expansion / cosmology).
//  Zero-dep.  Run:  node first-light/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM a SECOND way, not merely that the code runs:
//   [shared] runs the SAME runSelfTest() the in-page pill runs and mirrors its
//            verdict here, so the twin and the pill can never diverge.
//   (1) REDSHIFT = GEOMETRY — 1+z === a_now/a_then to <1e-9 over a sweep, AND the
//       drawn crest-spacing ratio is the SAME number (picture === proof). Re-derived
//       here independently against a hand-computed a-ratio.
//   (2) HOMOGENEITY / NO-CENTRE — re-anchor on EVERY vantage, fit H from the {(d,v)}
//       cloud, recover the SAME H = ȧ/a with R²=1 and anisotropy<tol. The rose and
//       this test read the SAME recession() path (vantage as an argument).
//   (3) T·a INVARIANT — T·a === T0 to <1e-9 over the a-sweep.
//   (4a) FROZEN METRIC — held a ⇒ 1+z === 1 EXACTLY (no velocity/Doppler term).
//   (4b) FIXED-CENTRE CHEAT BITES — re-anchored OFF-centre the cheat measurably
//        violates v∝d (anisotropy ≫ tol, ≥1 near-side galaxy APPROACHES, slope NOT
//        consistent across vantages), is a genuinely DIFFERENT law (non-vacuity),
//        while the TRUE law's deviation === 0 at the SAME vantage. This split is what
//        gives claim (2) its teeth — the same vantage-sweep PASSES truth, FAILS cheat.
//   (BYTE-TWIN) — index.html's inlined FIRST-LIGHT CORE slab is byte-identical
//       (indentation-normalised) to core.mjs, and the char counts match.
// ============================================================================

import {
  SCENE,
  properPos, scaleField, recession, properSep, hubbleRate,
  fixedCenterCheatRecession,
  redshift, onePlusZ, observedWavelength,
  temperature,
  fitHubbleSlope, anisotropy, fitR2,
  measureFrom, minRadialSpeed,
  crestSpacing, frozenMetricPhoton,
  makeTestField, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here ───
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (1) re-prove REDSHIFT = GEOMETRY directly, and picture === proof ───────────
{
  let zWorst = 0, crestWorst = 0;
  for (let i = 1; i <= 30; i++){
    for (let j = 1; j <= 30; j++){
      const aThen = 0.15 + i * 0.11, aNow = 0.15 + j * 0.097;
      // independent hand-derivation of the a-ratio
      const aRatio = aNow / aThen;
      zWorst = Math.max(zWorst, Math.abs(onePlusZ(aThen, aNow) - aRatio));
      // observedWavelength scales by exactly the a-ratio
      const lamRatio = observedWavelength(SCENE.lambda0, aThen, aNow) / SCENE.lambda0;
      crestWorst = Math.max(crestWorst, Math.abs(lamRatio - aRatio));
      // the DRAWN crest spacing ratio is the same number — bound it together
      const drawn = crestSpacing(SCENE.lambda0, aNow) / crestSpacing(SCENE.lambda0, aThen);
      crestWorst = Math.max(crestWorst, Math.abs(drawn - aRatio));
    }
  }
  check('(1) 1+z === a_now/a_then over a sweep (<1e-9)', zWorst < EPS, 'worst ' + zWorst.toExponential(2));
  check('(1b) drawn crest-spacing ratio === observed λ ratio === the a-ratio (picture === proof)',
    crestWorst < EPS, 'worst ' + crestWorst.toExponential(2));
  // a spot value: a_then=1, a_now=3 ⇒ z=2, λ tripled
  check('(1c) spot: a 1→3 ⇒ z===2 and λ_obs===3λ0 exactly',
    Math.abs(redshift(1, 3) - 2) < 1e-15 && Math.abs(observedWavelength(SCENE.lambda0, 1, 3) - 3 * SCENE.lambda0) < 1e-15,
    'z=' + redshift(1, 3).toFixed(6));
}

// ── (2) HOMOGENEITY / NO-CENTRE — re-anchor on EVERY vantage, same H, R²=1 ──────
{
  const gals = makeTestField(120);
  const aDot = 0.5, a = 1.6;
  const Hexpect = aDot / a;
  let hSpread = 0, worstA = 0, minR2 = 1;
  for (const v of gals){
    const f = measureFrom(gals, v, a, aDot, recession);
    hSpread = Math.max(hSpread, Math.abs(fitHubbleSlope(f.seps, f.vels) - Hexpect));
    worstA = Math.max(worstA, anisotropy(f.seps, f.vels));
    minR2 = Math.min(minR2, fitR2(f.seps, f.vels));
  }
  check('(2) re-anchor on all ' + gals.length + ' vantages ⇒ same H=ȧ/a (<1e-9)', hSpread < EPS, 'H spread ' + hSpread.toExponential(2));
  check('(2b) anisotropy<tol at every vantage (isotropic outflow)', worstA < EPS, 'worst A ' + worstA.toExponential(2));
  check('(2c) R²=1 at every vantage (v∝d is a perfect linear fit)', (1 - minR2) < EPS, 'min R² ' + minR2.toFixed(12));
  // v = H·d hand-check on one explicit galaxy from one explicit vantage
  const f0 = measureFrom(gals, gals[0], a, aDot, recession);
  let worstHd = 0;
  for (let i = 1; i < f0.seps.length; i++){
    const d = Math.hypot(f0.seps[i].dx, f0.seps[i].dy);
    const vr = (f0.vels[i].vx * f0.seps[i].dx + f0.vels[i].vy * f0.seps[i].dy) / d;
    worstHd = Math.max(worstHd, Math.abs(vr - Hexpect * d));
  }
  check('(2d) v·d̂ === H·d for every galaxy from a fixed vantage (Hubble law, not a fit)',
    worstHd < EPS, 'worst |v_r − Hd| ' + worstHd.toExponential(2));
}

// ── (3) T·a INVARIANT, re-proven over a wider sweep ────────────────────────────
{
  let worst = 0;
  for (let k = 0; k < 200; k++){
    const a = 0.05 + k * 0.05;
    worst = Math.max(worst, Math.abs(temperature(a, SCENE.T0) * a - SCENE.T0));
  }
  check('(3) T·a === T0 invariant over a∈[0.05,10] (<1e-9)', worst < EPS, 'worst ' + worst.toExponential(2));
  // a halving of a ⇒ a doubling of T (the cooling you watch is exactly 1/a)
  check('(3b) T(a/2) === 2·T(a) exactly', Math.abs(temperature(1, 2) - 2 * temperature(2, 2)) < 1e-15);
}

// ── (4a) FROZEN METRIC ⇒ 1+z === 1 EXACTLY ─────────────────────────────────────
{
  let worst = 0;
  for (let k = 1; k <= 50; k++){
    const aHeld = 0.2 + k * 0.06;
    const fp = frozenMetricPhoton(SCENE.lambda0, aHeld);
    worst = Math.max(worst, Math.abs(fp.onePlusZ - 1), Math.abs(fp.lambdaObs - SCENE.lambda0));
  }
  check('(4a) frozen metric: held a ⇒ 1+z === 1 EXACTLY, λ unchanged (no Doppler term)', worst === 0, 'worst dev ' + worst.toExponential(2));
}

// ── (4b) FIXED-CENTRE CHEAT BITES off-centre; TRUE law does not — the teeth ────
{
  const gals = makeTestField(120);
  const aDot = 0.5, a = 1.6;
  // off-centre vantage = the galaxy farthest from the comoving origin
  let offIdx = 0, offR = 0;
  for (let i = 0; i < gals.length; i++){
    const r = Math.hypot(gals[i].cx, gals[i].cy);
    if (r > offR){ offR = r; offIdx = i; }
  }
  const off = gals[offIdx];
  const origin = gals.reduce((b, g) => (Math.hypot(g.cx, g.cy) < Math.hypot(b.cx, b.cy) ? g : b), gals[0]);

  const cheatOff = measureFrom(gals, off, a, aDot, fixedCenterCheatRecession);
  const cheatOrg = measureFrom(gals, origin, a, aDot, fixedCenterCheatRecession);
  const trueOff = measureFrom(gals, off, a, aDot, recession);

  const cheatA = anisotropy(cheatOff.seps, cheatOff.vels);
  const cheatMin = minRadialSpeed(cheatOff.seps, cheatOff.vels);
  const Hc_off = fitHubbleSlope(cheatOff.seps, cheatOff.vels);
  const Hc_org = fitHubbleSlope(cheatOrg.seps, cheatOrg.vels);
  const trueA = anisotropy(trueOff.seps, trueOff.vels);
  const trueMin = minRadialSpeed(trueOff.seps, trueOff.vels);

  check('(4b-i) cheat off-centre: anisotropy ≫ tol (v NOT ∝ d)', cheatA > 0.05, 'A ' + cheatA.toExponential(2));
  check('(4b-ii) cheat off-centre: a near-side galaxy APPROACHES (v·d̂ < 0 — impossible under real expansion)',
    cheatMin < 0, 'min v_r ' + cheatMin.toExponential(2));
  check('(4b-iii) cheat slope NOT consistent across vantages (origin vs off-centre differ)',
    Math.abs(Hc_off - Hc_org) > 1e-3, 'H off ' + Hc_off.toFixed(3) + ' vs org ' + Hc_org.toFixed(3));
  check('(4b-iv) TRUE law at the SAME off-centre vantage: anisotropy === 0, NO galaxy approaches',
    trueA < EPS && trueMin >= 0, 'A ' + trueA.toExponential(2) + ', min v_r ' + trueMin.toExponential(2));

  // NON-VACUITY: the cheat is a genuinely DIFFERENT law (not a re-parameterisation):
  // at the off-centre vantage its velocity field differs from the true one. The
  // difference is EXACTLY the anchor's own velocity ȧ·c_off (the term it omits).
  let lawDiff = 0, omitWorst = 0;
  for (let i = 0; i < gals.length; i++){
    lawDiff = Math.max(lawDiff, Math.hypot(cheatOff.vels[i].vx - trueOff.vels[i].vx, cheatOff.vels[i].vy - trueOff.vels[i].vy));
    // cheat − true should equal +ȧ·c_off for EVERY galaxy (the missing −ȧ·c_from)
    const ex = aDot * off.cx, ey = aDot * off.cy;
    omitWorst = Math.max(omitWorst, Math.abs(cheatOff.vels[i].vx - trueOff.vels[i].vx - ex),
                                     Math.abs(cheatOff.vels[i].vy - trueOff.vels[i].vy - ey));
  }
  check('(4b-v) NON-VACUITY: cheat ≠ true at the off-centre vantage (genuinely different law)', lawDiff > 0.1, 'law diff ' + lawDiff.toExponential(2));
  check('(4b-vi) the cheat omits EXACTLY the anchor\'s own velocity ȧ·c_from (cheat − true === ȧ·c_off)',
    omitWorst < EPS, 'worst residual ' + omitWorst.toExponential(2));
  // The cheat is innocent ONLY at the explosion's true centre — the comoving
  // origin (0,0). There the missing −ȧ·c_from term is zero, so cheat === truth and
  // the outflow is isotropic. (A galaxy NEAR but not AT the origin already shows
  // small anisotropy — the cheat has exactly one privileged seat, which is the whole
  // point: a centre exists.) Anchor at the literal origin to show the innocence.
  const ORIGIN = { cx: 0, cy: 0 };
  const cheatAtCentre = measureFrom(gals, ORIGIN, a, aDot, fixedCenterCheatRecession);
  const trueAtCentre = measureFrom(gals, ORIGIN, a, aDot, recession);
  const cheatCentreA = anisotropy(cheatAtCentre.seps, cheatAtCentre.vels);
  let centreLawDiff = 0;
  for (let i = 0; i < gals.length; i++){
    centreLawDiff = Math.max(centreLawDiff, Math.hypot(
      cheatAtCentre.vels[i].vx - trueAtCentre.vels[i].vx,
      cheatAtCentre.vels[i].vy - trueAtCentre.vels[i].vy));
  }
  check('(4b-vii) at the EXACT explosion centre (comoving origin) the cheat === truth: isotropic, anisotropy === 0',
    cheatCentreA < EPS && centreLawDiff < EPS, 'A ' + cheatCentreA.toExponential(2) + ', cheat−true ' + centreLawDiff.toExponential(2));
}

// ── BYTE-TWIN PARITY: the page's inlined FIRST-LIGHT CORE slab === core.mjs ─────
const here = dirname(fileURLToPath(import.meta.url));
{
  const BEGIN = '// === FIRST-LIGHT CORE BEGIN ===';
  const END = '// === FIRST-LIGHT CORE END ===';
  function region(text){
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  }
  function norm(s){
    return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  }
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
  check('byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
  check('byte-parity: index.html inlined core === core.mjs (indentation-normalised)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? ('chars ' + norm(pageRegion).length + ' vs ' + norm(coreRegion).length) : 'index.html not built yet (run forge)');
}

console.log('\nFirst Light — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
