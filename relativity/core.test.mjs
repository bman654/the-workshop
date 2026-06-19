// ============================================================================
//  Node twin for THE MOVING FRAME core (special relativity).  Zero-dep.
//  Run:  node relativity/core.test.mjs    (exit 0 = green; non-zero = red)
//
//  Proves the wing's CLAIM, not merely that the code runs:
//   (1) τ = ∫√(1−β²)dt  matches the constant-β closed form τ = t/γ within ε
//       (the integrator round-trips the closed form over 401 speeds).
//   (2) THE TWIN PARADOX IS MONOTONE: a faster or longer detour yields strictly
//       LESS proper time — never a trick, a theorem.
//   (3) τ < t whenever you MOVE; the no-detour control β≡0 gives τ = t EXACTLY.
//   (4) THE COORDINATE-CLOCK control FAILS to lag: τ ≡ t while the real τ lags
//       a lot — so the test has teeth (a clock that ignores β can't show a gap).
//   (5) INTERVAL INVARIANCE (grafted from the worldline-cockpit): s²=(ct)²−x²
//       survives a Lorentz boost to <1e-12, tying the proof to the shared
//       geometry the Light Clock draws; the Galilean control BREAKS it.
//   (6) γ·√(1−β²)=1 and the time-rate falls strictly with β (faster ⇒ slower).
//   (7) γ FROM PHOTON-PATH PYTHAGORAS == 1/√(1−β²) (the Light Clock's claim,
//       proved from the same shared function).
//   (8) velocity addition stays strictly below c.
//   (9) THE STARBOW — the sky you fly into.  Aberration cosθ'=(cosθ+β)/(1+βcosθ)
//       and Doppler D=(1+βcosθ)/√(1−β²):  (9a) HEADLIGHT — every star sweeps to
//       θ'→0 as β→1 (max θ' < 0.5° at β=1−1e-9); (9a′) per-star θ'(β) is strictly
//       monotone ↓; (9b) it is a BIJECTION — N+1 stars in, N+1 out, all finite,
//       and the inverse boost at −β round-trips each cosθ (<1e-11); (9c) the
//       Doppler round-trips, D(β,θ)·D(−β,θ')=1 (<1e-11), and D(c,0)=1 exactly;
//       (9d) it is DIRECTIONAL — blue ahead (D>1), red behind (D<1); (9e) the
//       classical NEG-CONTROL FAILS the headlight (a rear star stays at 60°).
//   (e) BYTE-TWIN PARITY: the inlined CORE slab in BOTH relativity/index.html
//       and cavern/light-clock/index.html is byte-identical (indentation-
//       normalised) to core.mjs's slab — so the math can never silently drift.
// ============================================================================

import {
  gammaOf, rateOf, lorentz, interval2, velAdd, galilean, gammaFromGeometry,
  constLegTau, tauClosedForm, properTime, properTimeIntegral,
  properTimePiecewise, coordinateClockTau, properTimeCoordinate,
  relativisticAberration, dopplerFactor, classicalAberration,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x7C12FA);
const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── (1) the integrator round-trips the constant-β closed form ──────────────
{
  let maxErr = 0, worst = 0;
  for (let i = 0; i <= 400; i++){
    const b = (i / 400) * 0.985;
    const T = 2 + rnd() * 8;
    const num = properTime(() => b, T, 4000);
    const cf = constLegTau(b, T);
    const e = Math.abs(num - cf) / (1 + cf);
    if (e > maxErr){ maxErr = e; worst = b; }
  }
  check('(1) τ=∫√(1−β²)dt == closed form t/γ  (401 speeds)',
    maxErr < EPS, 'max rel ' + maxErr.toExponential(2) + ' @β=' + worst.toFixed(3));
  // and tauClosedForm (the wing's (T,β) alias) agrees with constLegTau exactly
  let aliasOk = true;
  for (let i = 0; i <= 200; i++){ const b = (i/200)*0.99, T = 3.0;
    if (Math.abs(tauClosedForm(T, b) - constLegTau(b, T)) > 0) aliasOk = false; }
  check('(1′) tauClosedForm(T,β) === constLegTau(β,T) exactly', aliasOk, '');
}

// ── (2) the twin paradox is MONOTONE: faster/longer detour ⇒ strictly LESS τ ─
{
  let allLess = true, minGap = 1;
  for (let k = 0; k < 3000; k++){
    const T = 4 + rnd() * 6;
    let b1 = rnd() * 0.95, b2 = rnd() * 0.95;
    if (b2 <= b1){ const t = b1; b1 = b2; b2 = t; }
    if (b2 - b1 < 1e-3) continue;
    const t1 = constLegTau(b1, T), t2 = constLegTau(b2, T);
    if (!(t2 < t1)) allLess = false;
    minGap = Math.min(minGap, t1 - t2);
  }
  check('(2) faster detour ⇒ strictly LESS τ  (twin paradox is monotone)',
    allLess, 'minGap ' + minGap.toExponential(2));

  // longer voyage at fixed β ⇒ strictly larger gap (t − τ grows with T)
  let allGrow = true;
  for (let k = 0; k < 2000; k++){
    const b = 0.2 + rnd() * 0.75;
    const Ta = 2 + rnd() * 4, Tb = Ta + 0.5 + rnd() * 4;
    const gapA = Ta - constLegTau(b, Ta), gapB = Tb - constLegTau(b, Tb);
    if (!(gapB > gapA)) allGrow = false;
  }
  check('(2′) longer voyage ⇒ strictly larger gap', allGrow, '');

  // the SHAPE of β(t) sets τ: a high-then-low profile vs its low-then-high
  // mirror over the same window accrue EQUAL τ (∫ is order-free), but a profile
  // that spends MORE of the window fast accrues strictly LESS τ.
  {
    const T = 6.0;
    const fast = properTime(t => (t < T*0.75 ? 0.9 : 0.1), T, 4000);  // mostly fast
    const slow = properTime(t => (t < T*0.75 ? 0.1 : 0.9), T, 4000);  // mostly slow
    check('(2″) more time spent fast ⇒ strictly less τ (the SHAPE of β(t) matters)',
      fast < slow - 1e-6, 'fast τ=' + fast.toFixed(4) + ' < slow τ=' + slow.toFixed(4));
  }
}

// ── (3) τ < t whenever moving; β≡0 ⇒ τ = t EXACTLY (no-detour control) ──────
{
  let lagOk = true;
  for (let k = 0; k < 2000; k++){
    const b = rnd() * 0.999, T = 0.5 + rnd() * 5;
    const tau = constLegTau(b, T);
    if (b > 1e-6 && !(tau < T)) lagOk = false;
  }
  const restInt = properTime(() => 0, 10, 4000);
  const restLegs = properTimePiecewise([{ beta: 0, dt: 3.0 }]);
  const restExact = Math.abs(restInt - 10) < 1e-12 && Math.abs(restLegs - 3.0) < 1e-12;
  check('(3) CONTROL no-detour β≡0 ⇒ τ = t EXACTLY; all moving voyages lag',
    lagOk && restExact, restExact ? '|Δτ(rest)| ' + Math.abs(restInt - 10).toExponential(2) : 'rest τ≠t');
}

// ── (4) coordinate-clock control FAILS to lag while real τ lags a lot ───────
{
  let maxD = 0;
  for (let k = 0; k < 500; k++){ const T = 2 + rnd() * 8;
    maxD = Math.max(maxD, Math.abs(coordinateClockTau(() => 0.9, T) - T)); }
  const legs = [{ beta: 0.8, dt: 2.0 }, { beta: 0.8, dt: 2.0 }];
  const tauReal = properTimePiecewise(legs);
  const tauCoord = properTimeCoordinate(legs);
  const t = legs.reduce((s, L) => s + L.dt, 0);
  const coordIsT = Math.abs(tauCoord - t) < 1e-12;
  const realLags = (t - tauReal) > 0.5;
  check('(4) CONTROL coordinate-clock: τ≡t (never lags) while real τ lags ≫0 ⇒ test bites',
    maxD < 1e-12 && coordIsT && realLags,
    'coord τ=' + tauCoord.toFixed(3) + ' (=t), real τ=' + tauReal.toFixed(3));
}

// ── (5) interval invariance (worldline-cockpit graft) + Galilean control ────
{
  let maxBoost = 0;
  for (let m = 0; m < 4000; m++){
    const ct = (rnd()*2 - 1) * 3, x = (rnd()*2 - 1) * 3, b = (rnd()*2 - 1) * 0.99;
    const p = lorentz(ct, x, b);
    maxBoost = Math.max(maxBoost, Math.abs(interval2(p.ct, p.x) - interval2(ct, x)));
  }
  check('(5) Lorentz boost preserves s²=(ct)²−x²  (4000 random events)',
    maxBoost < 1e-12, 'max |Δs²| ' + maxBoost.toExponential(2));

  // boost(β) ∘ boost(−β) == identity (group property)
  let maxR = 0;
  for (let m = 0; m < 3000; m++){
    const ct = (rnd()*2 - 1) * 5, x = (rnd()*2 - 1) * 5, b = (rnd()*2 - 1) * 0.999;
    const f = lorentz(ct, x, b), g = lorentz(f.ct, f.x, -b);
    maxR = Math.max(maxR, Math.abs(g.ct - ct), Math.abs(g.x - x));
  }
  check('(5′) boost(β)∘boost(−β) == identity  (3000 events)',
    maxR < 1e-12, 'max round-trip ' + maxR.toExponential(2));

  // the Galilean control must WRECK the interval (so check (5) isn't vacuous)
  let maxGal = 0;
  for (let n = 0; n < 2000; n++){
    const ct = (rnd()*2 - 1) * 6, x = (rnd()*2 - 1) * 6, b = 0.2 + rnd() * 0.7;
    const pg = galilean(ct, x, b);
    maxGal = Math.max(maxGal, Math.abs(interval2(pg.ct, pg.x) - interval2(ct, x)));
  }
  check('(5″) CONTROL Galilean transform BREAKS s² (error ≫ tol → check bites)',
    maxGal > 1e-3, 'max |Δs²| ' + maxGal.toExponential(2) + ' (≫ 1e-12)');
}

// ── (6) γ·rate=1 and the rate falls strictly with β ─────────────────────────
{
  let prodOk = true, mono = true, prev = 2;
  for (let s = 0; s <= 400; s++){
    const b = (s / 400) * 0.999;
    if (Math.abs(gammaOf(b) * rateOf(b) - 1) > 1e-12) prodOk = false;
    const r = rateOf(b);
    if (s > 0 && !(r < prev)){ mono = false; break; }
    prev = r;
  }
  check('(6) γ·√(1−β²)=1 and time-rate falls strictly with β  (faster ⇒ slower clock)',
    prodOk && mono && rateOf(0) === 1, prodOk ? (mono ? 'monotone, rate(0)=1' : 'NOT monotone') : 'γ·rate≠1');
}

// ── (7) γ from photon-path Pythagoras == 1/√(1−β²)  (the Light Clock's claim) ─
{
  let maxErr = 0, worst = 0;
  for (let i = 0; i <= 500; i++){
    const b = (i / 500) * 0.999;
    const e = Math.abs(gammaFromGeometry(b) - gammaOf(b));
    if (e > maxErr){ maxErr = e; worst = b; }
  }
  check('(7) γ from photon-path Pythagoras == 1/√(1−β²)  (501 β; the Light Clock’s claim)',
    maxErr < 1e-12, 'max |Δγ| ' + maxErr.toExponential(2) + ' @β=' + worst.toFixed(3));
}

// ── (8) velocity addition stays strictly below c ────────────────────────────
{
  let maxW = 0, allUnder = true;
  for (let j = 0; j < 5000; j++){
    const u = (rnd()*2 - 1) * 0.99999, v = (rnd()*2 - 1) * 0.99999;
    const w = Math.abs(velAdd(u, v));
    if (w >= 1) allUnder = false;
    if (w > maxW) maxW = w;
  }
  check('(8) velocity addition (u+v)/(1+uv) stays |w| < c  (5000 pairs)',
    allUnder && maxW < 1, 'max |w| ' + maxW.toFixed(9) + ' c');
}

// ── (9) THE STARBOW — relativistic aberration + Doppler of the flown sky ─────
const DEG = 180 / Math.PI;
const acosClamp = c => Math.acos(Math.max(-1, Math.min(1, c)));
{
  // (9a) HEADLIGHT: at β just under c every star (bar the measure-zero antipode)
  //      is swept to θ'≈0.  Sweep cosθ₀ from just above −1 up to +1.
  {
    const beta = 1 - 1e-9;
    let maxTheta = 0, worst = -2;
    for (let i = 0; i <= 4000; i++){
      const cos0 = -1 + 1e-3 + (1 - (-1 + 1e-3)) * (i / 4000);
      const th = acosClamp(relativisticAberration(cos0, beta)) * DEG;
      if (th > maxTheta){ maxTheta = th; worst = cos0; }
    }
    check('(9a) HEADLIGHT: β→1 sweeps the whole sky into θ′<0.5°',
      maxTheta < 0.5, 'max θ′ ' + maxTheta.toFixed(3) + '° @cosθ=' + worst.toFixed(4));
  }

  // (9a′) PER-STAR MONOTONE: for a fixed star, θ'(β) strictly decreases in β.
  {
    let mono = true, worst = '';
    for (const cos0 of [0.5, 0, -0.5, -0.9, -0.999]){
      let prev = Infinity;
      for (let s = 0; s <= 400; s++){
        const beta = (s / 400) * 0.99999;
        const th = acosClamp(relativisticAberration(cos0, beta));
        if (s > 0 && !(th < prev - 1e-15)){ mono = false; worst = 'cosθ=' + cos0 + ' @β step ' + s; break; }
        prev = th;
      }
      if (!mono) break;
    }
    check('(9a′) per-star θ′(β) strictly ↓ in β (the star never swings back)',
      mono, mono ? '5 stars monotone over 401 β each' : 'NOT monotone: ' + worst);
  }

  // (9b) BIJECTION: every rest star maps to exactly one apparent star, finite and
  //      on the sphere; and the inverse boost at −β returns the original cosθ.
  {
    const beta = 0.9;
    const N = 4000;
    let countIn = 0, countOut = 0, allOnSphere = true, maxRound = 0, worst = 0;
    for (let i = 0; i <= N; i++){
      const cos0 = -1 + 2 * (i / N);
      countIn++;
      const cosA = relativisticAberration(cos0, beta);
      if (Number.isFinite(cosA)) countOut++;
      if (!(cosA >= -1 - 1e-12 && cosA <= 1 + 1e-12)) allOnSphere = false;
      const back = relativisticAberration(cosA, -beta);     // inverse at −β
      const e = Math.abs(back - cos0);
      if (e > maxRound){ maxRound = e; worst = cos0; }
    }
    check('(9b) BIJECTION: N+1 in === N+1 out, all on the sphere; inverse-at−β round-trips',
      countIn === N + 1 && countOut === N + 1 && allOnSphere && maxRound < 1e-11,
      'in/out ' + countIn + '/' + countOut + ' · max round-trip ' + maxRound.toExponential(2) +
      ' @cosθ=' + worst.toFixed(4) + ' (1+βcosθ→0 at the antipode is the conditioning-worst point; 1e-12 is unachievable in float64)');
  }

  // (9c) DOPPLER round-trips to 1, and D(c,0)=1 exactly (no shift at rest, full restore).
  {
    let maxErr = 0, worst = 0;
    for (let s = 0; s <= 400; s++){
      const beta = (s / 400) * 0.999;
      for (let i = 0; i <= 40; i++){
        const cos0 = -1 + 2 * (i / 40);
        const cosA = relativisticAberration(cos0, beta);
        const round = dopplerFactor(cos0, beta) * dopplerFactor(cosA, -beta);
        const e = Math.abs(round - 1);
        if (e > maxErr){ maxErr = e; worst = beta; }
      }
    }
    const restExact = dopplerFactor(1, 0) === 1 && dopplerFactor(0, 0) === 1 && dopplerFactor(-1, 0) === 1;
    check('(9c) DOPPLER round-trips D(β,θ)·D(−β,θ′)=1 (<1e-11) and D(·,0)=1 exactly',
      maxErr < 1e-11 && restExact, 'max |Δ| ' + maxErr.toExponential(2) + ' @β=' + worst.toFixed(3) +
      (restExact ? ' · D(·,0)=1 ✓' : ' · D at rest ≠ 1'));
  }

  // (9d) DIRECTIONAL: blueshift dead ahead (D>1), redshift dead astern (D<1).
  {
    let dirOk = true, note = '';
    for (const beta of [0.1, 0.5, 0.9]){
      const ahead = dopplerFactor(1, beta), behind = dopplerFactor(-1, beta);
      if (!(ahead > 1 && behind < 1)){ dirOk = false; note = 'β=' + beta + ' ahead=' + ahead.toFixed(3) + ' behind=' + behind.toFixed(3); break; }
    }
    check('(9d) DIRECTIONAL: blue ahead (D>1), red behind (D<1) for β∈{.1,.5,.9}',
      dirOk, dirOk ? 'D(+1,.9)=' + dopplerFactor(1, 0.9).toFixed(3) + ' · D(−1,.9)=' + dopplerFactor(-1, 0.9).toFixed(3) : note);
  }

  // (9e) NEG-CONTROL: the relativistic map passes the headlight; the classical
  //      one FAILS — a rear star at cosθ=−0.5 stays at 60°, no headlight.
  {
    const beta = 1 - 1e-9;
    const thRel = acosClamp(relativisticAberration(-0.5, beta)) * DEG;
    const thCls = acosClamp(classicalAberration(-0.5, beta)) * DEG;
    check('(9e) CONTROL: relativistic passes headlight (θ′<0.06°) while classical FAILS (θ′>57°)',
      thRel < 0.06 && thCls > 57,
      'relativistic θ′=' + thRel.toFixed(4) + '° · classical θ′=' + thCls.toFixed(2) + '°');
  }
}

// ── (e) BYTE-TWIN PARITY: both pages’ inlined CORE slab === core.mjs slab ────
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN = '// === CORE BEGIN ===';
const END = '// === CORE END ===';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
const wingRegion = region(readFileSync(join(here, 'index.html'), 'utf8'));
const lcRegion = region(readFileSync(join(here, '..', 'cavern', 'light-clock', 'index.html'), 'utf8'));
check('(e) byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
check('(e) byte-parity: wing index.html inlined core === core.mjs (norm)',
  !!coreRegion && !!wingRegion && norm(coreRegion) === norm(wingRegion));
check('(e) byte-parity: light-clock index.html inlined core === core.mjs (norm)',
  !!coreRegion && !!lcRegion && norm(coreRegion) === norm(lcRegion));

console.log('\nThe Moving Frame — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
