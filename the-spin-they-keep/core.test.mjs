// Node twin for The Spin They Keep core. Zero-dep. Run: `node the-spin-they-keep/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at the
// same ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves the 6 legs
// the in-page pill proves over WIDER sweeps, PLUS an Lclamped corroboration leg (belt & suspenders), the
// byte-twin parity + anti-fork grep leg, and the honesty grep on index.html prose. ONE law: closer means
// faster in both worlds, yet the conserved L — and the one needle both worlds drive — does not budge.
//
//   1.  CHAIR INVARIANT   — inertia(r)·omegaAt(r) === L_SKATER over the whole pull.
//   2.  ORBIT INVARIANT   — r²·angularSpeed === L_ORBIT AND arealRate === L_ORBIT over E∈[0,2π).
//   3.  SHARED GUARANTEE  — chair ω₂/ω₁ === I₁/I₂, orbit θ̇₂/θ̇₁ === r₁²/r₂², rate strictly rises, both.
//   4.  HONESTY           — L_SKATER ≠ L_ORBIT (≈12×) yet held === 1 in both at leak=0.
//   5.  NEG-CONTROL       — leak bleeds L (strictly falls, deeper with more leak, decouples the worlds).
//   6.  PAYOFF-LIVENESS   — runPayoffLiveness: needle holds at leak=0, sags at leak=0.5, both worlds.
//   7.  Lclamped CORROBORATION — the parent's Lclamped confirms "external torque ⇒ L varies" (belt & susp).
//   8.  ANTI-CIRCULARITY  — the reading routes through the REAL parents (not a local re-implementation).
//   9.  BYTE-TWIN PARITY + ANTI-FORK — index.html CORE === core.mjs CORE char-for-char; the CORE slab
//       DECLARES no parent function (it names them by import only).
//  10.  HONESTY-GREP      — index.html prose carries the disclaimer AND no affirmative L-equality claim.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { inertia, omegaAt, L0, Lclamped, A, B } from '../spinning-chair/core.mjs';
import { arealConstant, angularSpeed, radius, arealRate, TAU } from '../equal-area-sweep/core.mjs';
import {
  ORBIT_E, L_SKATER, L_ORBIT, SAG_MAX,
  chairRadiusAt, orbitThetaAt, orbitFracFromTheta, needleReading,
  needleIndex, needleAngleDeg, sceneRateRange,
  runPayoffLiveness, runSelfTest,
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Spin They Keep — Node twin (two worlds you push; one L-needle that will not move)\n');

// a WIDER, finer sweep than the in-page pill walks.
function wideSweep(){ const xs = []; for (let i = 0; i <= 1000; i++) xs.push(i / 1000); return xs; }
const F = wideSweep();
const EPS = 1e-9;

// ── LEG 1: CHAIR INVARIANT ──────────────────────────────────────────────────────────────────────────
console.log('— Leg 1: chair invariant — inertia(r)·omegaAt(r) === L_SKATER across the pull —');
{
  let worst = 0;
  for (const f of F){ const r = chairRadiusAt(f); worst = Math.max(worst, Math.abs(inertia(r) * omegaAt(r) - L_SKATER)); }
  ck('inertia(r)·omegaAt(r) === L_SKATER for every frac (' + F.length + ' radii, arms out → tucked)',
     worst < EPS, 'worst |ΔL| = ' + worst.toExponential(2) + ' · L_SKATER = ' + L_SKATER.toFixed(6) + ' kg·m²/s');
}

// ── LEG 2: ORBIT INVARIANT (two independent routes) ───────────────────────────────────────────────────
console.log('\n— Leg 2: orbit invariant — r²·angularSpeed === L_ORBIT AND arealRate === L_ORBIT —');
{
  let worstSpeed = 0;
  for (const f of F){ const th = orbitThetaAt(f); const r = radius(th, ORBIT_E); worstSpeed = Math.max(worstSpeed, Math.abs(r * r * angularSpeed(th, ORBIT_E) - L_ORBIT)); }
  let worstAreal = 0;
  for (let k = 0; k < 1000; k++){ const E = k * TAU / 1000; worstAreal = Math.max(worstAreal, Math.abs(arealRate(ORBIT_E, E) - L_ORBIT)); }
  ck('r²·angularSpeed === L_ORBIT (every θ) AND arealRate === L_ORBIT over E∈[0,2π)',
     worstSpeed < EPS && worstAreal < EPS, 'r²θ̇ worst = ' + worstSpeed.toExponential(2) + ' · arealRate worst = ' + worstAreal.toExponential(2) + ' · L_ORBIT = ' + L_ORBIT);
}

// ── LEG 3: SHARED GUARANTEE (radius-shrink offsets rate-rise, both worlds) ─────────────────────────────
console.log('\n— Leg 3: shared guarantee — ω₂/ω₁ === I₁/I₂, θ̇₂/θ̇₁ === r₁²/r₂², rate strictly rises, both —');
{
  const r1c = chairRadiusAt(0), I1c = inertia(r1c), w1c = omegaAt(r1c);
  const th1o = orbitThetaAt(0), r1o = radius(th1o, ORBIT_E), td1o = angularSpeed(th1o, ORBIT_E);
  let worstChair = 0, worstOrbit = 0, riseChair = true, riseOrbit = true, pc = -Infinity, po = -Infinity;
  for (const f of F){
    const r2 = chairRadiusAt(f), w2 = omegaAt(r2), I2 = inertia(r2);
    worstChair = Math.max(worstChair, Math.abs((w2 / w1c) - (I1c / I2)));
    if (pc !== -Infinity && !(w2 > pc)) riseChair = false; pc = w2;
    const th2 = orbitThetaAt(f), r2o = radius(th2, ORBIT_E), td2 = angularSpeed(th2, ORBIT_E);
    worstOrbit = Math.max(worstOrbit, Math.abs((td2 / td1o) - ((r1o * r1o) / (r2o * r2o))));
    if (po !== -Infinity && !(td2 > po)) riseOrbit = false; po = td2;
  }
  ck('chair ω₂/ω₁ === I₁/I₂ AND orbit θ̇₂/θ̇₁ === r₁²/r₂² AND rate strictly rises with frac in BOTH',
     worstChair < EPS && worstOrbit < EPS && riseChair && riseOrbit,
     'chair worst = ' + worstChair.toExponential(2) + ' · orbit worst = ' + worstOrbit.toExponential(2) + ' · rises chair ' + riseChair + ' orbit ' + riseOrbit);
}

// ── LEG 4: HONESTY (distinct magnitudes, shared invariance) ───────────────────────────────────────────
console.log('\n— Leg 4: honesty — L_SKATER ≠ L_ORBIT (≈12×) yet held === 1 in both at leak=0 —');
{
  const ratio = L_SKATER / L_ORBIT;
  let worstHeld = 0;
  for (const f of F){
    worstHeld = Math.max(worstHeld, Math.abs(needleReading('chair', f, 0).held - 1));
    worstHeld = Math.max(worstHeld, Math.abs(needleReading('orbit', f, 0).held - 1));
  }
  ck('L_SKATER ≠ L_ORBIT (ratio ' + ratio.toFixed(3) + ', different units) AND held === 1 in both worlds at leak=0',
     L_SKATER !== L_ORBIT && ratio > 11 && ratio < 13 && worstHeld < EPS,
     'L_SKATER = ' + L_SKATER.toFixed(4) + ' · L_ORBIT = ' + L_ORBIT + ' · held worst |Δ| = ' + worstHeld.toExponential(2));
  // the needle index composes as min(held): with both worlds free it holds at 1 (0° sag).
  const ni = needleIndex(0.7, 0, 0.9, 0);
  ck('needleIndex(min held) === 1 and needleAngleDeg(1) === 0° when both worlds are free (the needle holds)',
     Math.abs(ni.index - 1) < EPS && Math.abs(needleAngleDeg(ni.index)) < EPS,
     'index = ' + ni.index.toFixed(9) + ' · sag = ' + needleAngleDeg(ni.index).toFixed(3) + '° · SAG_MAX = ' + SAG_MAX + '°');
}

// ── LEG 5: NEG-CONTROL (the leak bleeds L; the worlds decouple) ────────────────────────────────────────
console.log('\n— Leg 5 (neg-control): leak bleeds L — strictly falls, deeper with more leak, decouples —');
{
  let worstIdeal = 0;
  for (const scene of ['chair', 'orbit']) for (const f of F){ const rd = needleReading(scene, f, 0); worstIdeal = Math.max(worstIdeal, Math.abs(rd.L - rd.Lideal)); }
  ck('leak=0 ⇒ L === Lideal exactly in both worlds (the conservation claim is machine-ε only at leak=0)',
     worstIdeal < EPS, 'worst |L−Lideal| = ' + worstIdeal.toExponential(2));

  let strictDrop = true, deeper = true, rateBelow = true, toZero = true, decouple = true;
  for (const scene of ['chair', 'orbit']){
    let prev = Infinity;
    for (const f of F){ const L = needleReading(scene, f, 0.5).L; if (f > 0 && !(L < prev)) strictDrop = false; prev = L; }
    if (!(needleReading(scene, 1, 0.7).L < needleReading(scene, 1, 0.3).L)) deeper = false;
    for (const f of F){ if (f > 0 && !(needleReading(scene, f, 0.5).rate < needleReading(scene, f, 0).rate)) rateBelow = false; }
    if (Math.abs(needleReading(scene, 1, 1).L) > EPS) toZero = false;
    let lo0 = Infinity, hi0 = -Infinity, loK = Infinity, hiK = -Infinity;
    for (const f of F){ const a = needleReading(scene, f, 0).L, b = needleReading(scene, f, 0.5).L; lo0 = Math.min(lo0, a); hi0 = Math.max(hi0, a); loK = Math.min(loK, b); hiK = Math.max(hiK, b); }
    if (!((hi0 - lo0) < EPS && (hiK - loK) > 1e-3)) decouple = false;
  }
  ck('leak>0 ⇒ L strictly falls across frac; deeper with more leak; leaked rate < ideal; leak→1 ⇒ L→0; the drag DECOUPLES the worlds',
     strictDrop && deeper && rateBelow && toZero && decouple,
     'strictDrop=' + strictDrop + ' deeper=' + deeper + ' rateBelow=' + rateBelow + ' toZero=' + toZero + ' decouple=' + decouple);
}

// ── LEG 6: PAYOFF-LIVENESS (the shared runSelfTest's live leg, re-run here) ────────────────────────────
console.log('\n— Leg 6: payoff-liveness — needle holds at leak=0, sags at leak=0.5, both worlds —');
{
  const pl = runPayoffLiveness();
  ck('runPayoffLiveness: held flat at 1.0 & rates rise (leak=0), held sags (leak=0.5), BOTH worlds',
     pl.pass, pl.detail.map(d => d.scene + '{heldFlat:' + d.heldFlat + ',rise:' + d.riseOK + ',sag:' + d.sagOK + '}').join(' · '));
}

// ── LEG 7: Lclamped CORROBORATION (belt & suspenders — external torque ⇒ L varies) ────────────────────
console.log('\n— Leg 7: Lclamped corroboration — a clamped (motor-driven) pivot varies its L with r —');
{
  // On a pivot bolted to a fixed-ω motor, L_clamped(r) = I(r)·ω_fix VARIES with r (the parent's own law),
  // corroborating the neg-control's DIRECTION: when an external torque acts, L is not conserved. Distinct
  // route from the (1−leak·frac) bleed: this is the parent's exact clamped-momentum, imported unforked.
  const wFix = 4.2;
  const La = Lclamped(chairRadiusAt(0), wFix), Lb = Lclamped(chairRadiusAt(1), wFix);
  const ratioL = Lb / La, ratioI = inertia(chairRadiusAt(1)) / inertia(chairRadiusAt(0));
  ck('Lclamped(B)/Lclamped(A) === I(B)/I(A) ≠ 1 (a motor-clamped pivot pours/eats L — external torque ⇒ L varies)',
     Math.abs(ratioL - ratioI) < EPS && ratioL < 1 - 1e-3,
     'ratioL = ' + ratioL.toFixed(6) + ' === I-ratio ' + ratioI.toFixed(6) + ' (bounded below 1)');
}

// ── LEG 8: ANTI-CIRCULARITY (the reading routes through the REAL parents) ──────────────────────────────
console.log('\n— Leg 8: anti-circularity — needleReading routes through the real parent laws —');
{
  let okChair = true, okOrbit = true;
  for (const f of F){
    const rc = needleReading('chair', f, 0);
    if (rc.Lideal !== inertia(chairRadiusAt(f)) * omegaAt(chairRadiusAt(f))) okChair = false;
    const ro = needleReading('orbit', f, 0);
    const th = orbitThetaAt(f), r = radius(th, ORBIT_E);
    if (ro.Lideal !== r * r * angularSpeed(th, ORBIT_E)) okOrbit = false;
  }
  ck('chair Lideal === the parent chair\'s inertia·omegaAt AND orbit Lideal === the parent sweep\'s r²·angularSpeed (byte-exact, anti-circular)',
     okChair && okOrbit, 'chair ' + okChair + ' · orbit ' + okOrbit + ' at all ' + F.length + ' fracs');
  // orbitFracFromTheta inverts orbitThetaAt (with the apse-line fold) so the free-run needle reads honestly.
  let worstInv = 0;
  for (const f of F){ const th = orbitThetaAt(f); const rr = radius(th, ORBIT_E); const rBack = radius(orbitThetaAt(orbitFracFromTheta(th)), ORBIT_E); worstInv = Math.max(worstInv, Math.abs(rr - rBack)); }
  ck('orbitFracFromTheta ∘ orbitThetaAt reconstructs the same r (the free-run animation reads the needle honestly)',
     worstInv < EPS, 'worst |Δr| = ' + worstInv.toExponential(2));
}

// ── LEG 9: BYTE-TWIN PARITY + ANTI-FORK ───────────────────────────────────────────────────────────────
console.log('\n— Leg 9: byte-twin parity (index.html CORE === core.mjs CORE) + anti-fork (no parent fn declared) —');
{
  const coreSrc = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  const slice = (s) => {
    const a = s.indexOf('// === CORE BEGIN ===');
    const b = s.indexOf('// === CORE END ===');
    if (a < 0 || b < 0) return null;
    return s.slice(a, b + '// === CORE END ==='.length);
  };
  const coreSlice = slice(coreSrc), pageSlice = slice(pageSrc);
  ck('index.html CORE slab is present and char-for-char identical to core.mjs CORE slab (byte-twin)',
     coreSlice != null && pageSlice != null && coreSlice === pageSlice,
     coreSlice == null ? 'core.mjs has no CORE sentinels' :
     pageSlice == null ? 'index.html has no CORE sentinels' :
     coreSlice === pageSlice ? 'identical (' + coreSlice.length + ' chars)' :
     'DIFFER (core ' + coreSlice.length + ' vs page ' + pageSlice.length + ' chars)');

  // ANTI-FORK: the CORE slab must DECLARE no parent function — it names them by import only.
  const PARENT_FNS = ['inertia', 'omegaAt', 'L0', 'Lclamped', 'arealConstant', 'angularSpeed', 'radius', 'arealRate', 'timeAtTheta', 'stateAtTime'];
  const declRe = (fn) => new RegExp('(function\\s+' + fn + '\\s*\\(|(?:const|let|var)\\s+' + fn + '\\s*=)');
  const forked = PARENT_FNS.filter(fn => declRe(fn).test(coreSlice));
  // but the slab MUST call the parents (else it forked the math into inline arithmetic) — spot-check a few.
  const callsParents = ['inertia(', 'omegaAt(', 'radius(', 'angularSpeed('].every(sig => coreSlice.includes(sig));
  ck('the CORE slab declares NO parent function (names them by import only) AND does call them (unforked)',
     forked.length === 0 && callsParents, forked.length ? 'FORKED: ' + forked.join(', ') : 'clean · calls parents = ' + callsParents);
}

// ── LEG 10: HONESTY-GREP on index.html prose ──────────────────────────────────────────────────────────
console.log('\n— Leg 10: honesty grep — the disclaimer is present, no affirmative L-equality claim —');
{
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  const DISCLAIMER = 'keep their own scales and units';
  const FORBIDDEN = ['equal L', 'same number', 'L_skater = L_orbit', 'L_SKATER = L_ORBIT', 'the same L'];
  const present = pageSrc.includes(DISCLAIMER);
  const bad = FORBIDDEN.filter(p => pageSrc.includes(p));
  ck('index.html carries the disclaimer "' + DISCLAIMER + '" AND no affirmative L-equality phrase',
     present && bad.length === 0, present ? (bad.length ? 'FORBIDDEN present: ' + bad.join(', ') : 'disclaimer present · no forbidden phrase') : 'DISCLAIMER MISSING');
}

// the shared runSelfTest (the page's pill) is itself green.
console.log('\n— the shared runSelfTest (the page\'s gold pill) —');
{
  const r = runSelfTest();
  for (const c of r.checks) console.log('    ' + (c.ok ? '✓' : '✗') + ' ' + c.name);
  ck('the shared runSelfTest (the page\'s pill) is green', r.ok, r.passed + '/' + r.total + ' legs');
}

console.log('\nThe Spin They Keep — Node twin: ' + pass + '/' + (pass + fail) + (fail === 0 ? ' ✓ ALL GREEN' : ' ✗ ' + fail + ' FAIL'));
if (fail) { console.log('FAILED:'); for (const f of fails) console.log('  · ' + f); }
process.exit(fail === 0 ? 0 : 1);
