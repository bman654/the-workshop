// ============================================================================
//  THE SPIN THEY KEEP — a mechanics × celestial cross. Logic core.
//
//  THE ONE IDEA. Two worlds you push by hand — a figure skater on a free pivot
//  and a planet on an ellipse — obey the SAME conservation law, and one brass
//  L-needle reads it in both. Pull the skater's arms IN and she whirls faster;
//  drag the planet toward PERIHELION and it races. In each world the spin-rate
//  climbs steeply. Yet the conserved angular momentum L does NOT budge — so the
//  ONE needle both worlds drive holds dead still at its HELD detent. "Closer
//  means faster" is not a coincidence twice; it is L kept, twice.
//
//    • THE SKATER (spinning-chair/core.mjs — "The Spinning Chair"). Two weights on
//      arms of radius r about a body of moment I₀: I(r)=I₀+2mr². On a free pivot
//      L=I·ω is conserved, so ω(r)=L₀/I(r) is FORCED — arms in (r small) ⇒ I small
//      ⇒ ω large. inertia(r)·omegaAt(r) === L₀ = L_SKATER for every r, exactly.
//
//    • THE PLANET (equal-area-sweep/core.mjs — "The Equal-Area Sweep"). On an
//      ellipse of eccentricity e, conservation of angular momentum gives r²·θ̇ = L
//      constant (Kepler's 2nd law). angularSpeed(θ,e)=L/r², so r²·angularSpeed ===
//      arealConstant(e) = L_ORBIT for every θ — the planet RACES at perihelion
//      (r small) and CRAWLS at aphelion (r large), yet r²·θ̇ never changes.
//
//  THE BRIDGE. ONE control per world — a fraction frac∈[0,1] you push by hand
//  (0 = arms out / aphelion, 1 = tucked / perihelion). needleReading(scene,frac)
//  returns that world's live rate AND its held-fraction held = L/L_scene. At
//  leak=0, held === 1 in BOTH worlds for ALL frac — so the composed needle
//  index = min(held_chair, held_orbit) === 1 and the needle stays at HELD while
//  the rates climb. That is the payoff: the spin they KEEP.
//
//  THE TEETH (a neg-control you can feel). The bleed (1 − leak·frac) is HONESTLY
//  PHENOMENOLOGICAL: it claims only the DIRECTION — an external torque (a friction
//  brake on the pivot / an off-centre tug on the orbit) strictly REMOVES L, so
//  held drops below 1 and the needle SAGS. It is NOT a derived friction curve;
//  machine-ε exactness of the conservation claim lives only at leak=0. Flip a
//  world's leak on and push it and its held falls, the min() falls, the needle
//  rotates off HELD toward BLED. The parent's Lclamped corroborates "external
//  torque ⇒ L varies" in the Node twin (belt & suspenders), not here.
//
//  HONESTY (structural). The needle never shows a MAGNITUDE — only the
//  dimensionless held-fraction (= 1 in both worlds though L_SKATER ≈ 9.71 kg·m²/s
//  and L_ORBIT = 0.8 are ~12× apart and carry different units). What is shared is
//  the INVARIANCE, never the number.
//
//  SINGLE-SOURCE DISCIPLINE. Both parent cores are imported byte-untouched (native
//  ES modules, one ../ hop each, since the-spin-they-keep/ is a top-level leaf next
//  to the parents), so the imports sit ABOVE the CORE region and are NOT part of
//  the byte-twin slab. The CORE slab DECLARES no parent function — it names them by
//  import only (a grep leg in the Node twin guards against a fork). index.html
//  inlines this whole CORE region byte-identically; the in-page pill calls the
//  SAME runSelfTest() / runPayoffLiveness() the twin runs.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. CHAIR INVARIANT — inertia(r)·omegaAt(r) === L_SKATER over the whole pull.
//    2. ORBIT INVARIANT — r²·angularSpeed === L_ORBIT AND arealRate === L_ORBIT
//       over E∈[0,2π).
//    3. SHARED GUARANTEE — radius-shrink offsets rate-rise in BOTH: chair ω₂/ω₁ ===
//       I₁/I₂, orbit θ̇₂/θ̇₁ === r₁²/r₂², and rate strictly rises as frac rises.
//    4. HONESTY — L_SKATER ≠ L_ORBIT (ratio ≈ 12) AND held === 1 in both at leak=0.
//    5. NEG-CONTROL — leak=0 ⇒ L===Lideal; leak>0 ⇒ L strictly decreases across
//       frac (deeper with more leak); the leaked rate is below the ideal; leak→1 ⇒
//       L→0 at frac=1; and the drag's L-range is bounded from 0 at leak>0 vs flat
//       (<1e-9) at leak=0 (the worlds DECOUPLE).
//    6. PAYOFF-LIVENESS — runPayoffLiveness: held flat at 1.0 and rates strictly
//       rise at leak=0 in both worlds; held strictly sags at leak=0.5.
//    (Node twin only) 7. BYTE-TWIN PARITY + anti-fork grep. 8. HONESTY-GREP on prose.
//
//  Cycle #418 — the FIRST mechanics × celestial cross, in the Workbench's cross
//  vein, kin to The Same Slow Throb (a heard beat × a seen crawl).
// ============================================================================

import { inertia, omegaAt, L0, Lclamped, A, B } from '../spinning-chair/core.mjs';
import { arealConstant, angularSpeed, radius, arealRate, timeAtTheta, stateAtTime, TAU } from '../equal-area-sweep/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE SHARED APPARATUS — the two worlds' fixed constants ═════════════════════════════════════════
const ORBIT_E = 0.6;                 // the orbit's eccentricity — the off-centre Sun IS the lesson
const L_SKATER = L0();               // the skater's conserved L = I(A)·ω_A ≈ 9.70752 kg·m²/s
const L_ORBIT  = arealConstant(ORBIT_E);  // the planet's conserved r²·θ̇ = √(1−e²) = 0.8 (dimensionless)
const SAG_MAX  = 74;                 // degrees the L-needle sags from HELD (index 1) to BLED (index 0)

// ── THE TWO HAND-CONTROLS — one frac∈[0,1] per world (0 = arms out / aphelion, 1 = tucked / perihelion) ──
// The skater's hand radius runs A (arms out) → B (arms tucked) as frac 0 → 1.
function chairRadiusAt(frac){ return A + (B - A) * frac; }
// The planet's true anomaly runs π (aphelion) → 0 (perihelion) as frac 0 → 1.
function orbitThetaAt(frac){ return Math.PI - Math.PI * frac; }
// The inverse the free-running orbit animation uses: a true anomaly θ (any lap) → its frac. r is
// symmetric about the apse line, so we FOLD θ to [0,π]; frac = (π − θ_folded)/π reconstructs the SAME r.
function orbitFracFromTheta(theta){
  let ph = ((theta % TAU) + TAU) % TAU;   // θ mod 2π ∈ [0,2π)
  const tf = ph <= Math.PI ? ph : TAU - ph;  // fold to [0,π]
  return (Math.PI - tf) / Math.PI;
}

// ── THE ONE ENTRY — the live reading for a world at a given push, with an optional external-torque leak ──
// scene 'chair' | 'orbit'; frac∈[0,1]; leak∈[0,1] (0 = the pure free/conserving law; >0 = the neg-control).
// Returns the ideal (conserved) L, the bled L, the live rate, and held = L / L_scene (=1 at leak=0 ∀frac).
function needleReading(scene, frac, leak){
  if (leak == null) leak = 0;
  const bleed = 1 - leak * frac;                 // (1 − leak·frac): an external torque strictly removes L
  if (scene === 'chair'){
    const r = chairRadiusAt(frac);
    const I = inertia(r);                         // I(r) = I₀ + 2mr²  (the skater's own law)
    const Lideal = I * omegaAt(r);                // === L_SKATER for every r, exactly (conservation)
    const L = bleed * Lideal;
    const rate = L / I;                           // = ω when leak=0 (rad/s)
    return { scene:'chair', frac, leak, r, I, theta:null, Lideal, L, rate, held: L / L_SKATER, units:'kg·m²/s' };
  } else {
    const theta = orbitThetaAt(frac);
    const r = radius(theta, ORBIT_E);             // conic r(θ) = a(1−e²)/(1+e·cosθ)  (the planet's own law)
    const Lideal = r * r * angularSpeed(theta, ORBIT_E);  // === L_ORBIT for every θ, exactly (conservation)
    const L = bleed * Lideal;
    const rate = L / (r * r);                     // = θ̇ when leak=0 (rad/s)
    return { scene:'orbit', frac, leak, r, I:null, theta, Lideal, L, rate, held: L / L_ORBIT, units:'(dimensionless)' };
  }
}

// ── THE COMPOSITION RULE — the ONE needle both worlds drive ──────────────────────────────────────────
// index = min(held_chair, held_orbit): the needle holds at HELD only while BOTH worlds keep their L.
function needleIndex(chairFrac, chairLeak, orbitFrac, orbitLeak){
  const hc = needleReading('chair', chairFrac, chairLeak).held;
  const ho = needleReading('orbit', orbitFrac, orbitLeak).held;
  return { index: Math.min(hc, ho), heldChair: hc, heldOrbit: ho };
}
// The needle's sag angle (degrees from HELD): 0° at index 1 (straight up), SAG_MAX at index 0 (BLED).
function needleAngleDeg(index){ return (1 - index) * SAG_MAX; }

// ── the live rate range of a world (frac 0 → 1) — for honest fill-bar normalisation on the page ──
function sceneRateRange(scene){
  const lo = needleReading(scene, 0, 0).rate;
  const hi = needleReading(scene, 1, 0).rate;
  return { lo, hi };
}

// ══ THE PAYOFF-LIVENESS TWIN — the needle HOLDS as you push, and SAGS under the neg-control ═══════════
// Called by the in-page pill AND core.test.mjs AND the DOM liveness driver. Fine frac sweep, both worlds:
// at leak=0 assert held flat at 1.0 (<1e-9) AND rate strictly rises; at leak=0.5 assert held strictly sags.
function runPayoffLiveness(){
  const EPS = 1e-9;
  const fracs = []; for (let i = 0; i <= 64; i++) fracs.push(i / 64);
  const detail = [];
  let ok = true;
  for (const scene of ['chair', 'orbit']){
    let worstHeld = 0, riseOK = true, prevRate = -Infinity;
    for (const f of fracs){
      const rd = needleReading(scene, f, 0);
      worstHeld = Math.max(worstHeld, Math.abs(rd.held - 1));
      if (prevRate !== -Infinity && !(rd.rate > prevRate)) riseOK = false;   // strictly rising
      prevRate = rd.rate;
    }
    const heldFlat = worstHeld < EPS;
    let sagOK = true, prevHeld = Infinity;
    for (const f of fracs){
      const rd = needleReading(scene, f, 0.5);
      if (f > 0 && !(rd.held < prevHeld)) sagOK = false;                      // strictly sagging
      prevHeld = rd.held;
    }
    const d = { scene, heldFlat, riseOK, sagOK, worstHeld };
    detail.push(d);
    ok = ok && heldFlat && riseOK && sagOK;
  }
  return { pass: ok, detail };
}

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's gold pill) ═════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });
  const EPS = 1e-9;
  const fracs = []; for (let i = 0; i <= 240; i++) fracs.push(i / 240);

  // LEG 1 — CHAIR INVARIANT: the skater's L is kept for every arm-radius across the whole pull.
  {
    let worst = 0;
    for (const f of fracs){
      const r = chairRadiusAt(f);
      worst = Math.max(worst, Math.abs(inertia(r) * omegaAt(r) - L_SKATER));
    }
    ck('1 · chair invariant: inertia(r)·omegaAt(r) === L_SKATER for every frac across the pull (arms out → tucked)',
       worst < EPS, 'worst |ΔL| = ' + worst.toExponential(2) + ' over ' + fracs.length + ' radii · L_SKATER = ' + L_SKATER.toFixed(5) + ' kg·m²/s');
  }

  // LEG 2 — ORBIT INVARIANT: the planet's r²·θ̇ is kept for every true anomaly, two independent ways.
  {
    let worstSpeed = 0;
    for (const f of fracs){
      const th = orbitThetaAt(f);
      const r = radius(th, ORBIT_E);
      worstSpeed = Math.max(worstSpeed, Math.abs(r * r * angularSpeed(th, ORBIT_E) - L_ORBIT));
    }
    let worstAreal = 0;
    for (let k = 0; k < 240; k++){
      const E = k * TAU / 240;
      worstAreal = Math.max(worstAreal, Math.abs(arealRate(ORBIT_E, E) - L_ORBIT));
    }
    ck('2 · orbit invariant: r²·angularSpeed === L_ORBIT (every θ) AND arealRate === L_ORBIT over E∈[0,2π)',
       worstSpeed < EPS && worstAreal < EPS,
       'r²θ̇ worst = ' + worstSpeed.toExponential(2) + ' · arealRate worst = ' + worstAreal.toExponential(2) + ' · L_ORBIT = ' + L_ORBIT);
  }

  // LEG 3 — SHARED GUARANTEE: in BOTH worlds a shrinking radius exactly offsets the rising rate, so the
  // conserved quantity holds; and the rate strictly RISES as you push (frac up) in both.
  {
    let worstChair = 0, worstOrbit = 0, riseChair = true, riseOrbit = true;
    let pc = -Infinity, po = -Infinity;
    const r1c = chairRadiusAt(0), I1c = inertia(r1c), w1c = omegaAt(r1c);
    const th1o = orbitThetaAt(0), r1o = radius(th1o, ORBIT_E), td1o = angularSpeed(th1o, ORBIT_E);
    for (const f of fracs){
      // chair: ω(r)/ω(A) === I(A)/I(r)
      const r2 = chairRadiusAt(f), w2 = omegaAt(r2), I2 = inertia(r2);
      worstChair = Math.max(worstChair, Math.abs((w2 / w1c) - (I1c / I2)));
      if (pc !== -Infinity && !(w2 > pc)) riseChair = false; pc = w2;
      // orbit: θ̇(θ)/θ̇(θ_aph) === r_aph²/r²
      const th2 = orbitThetaAt(f), r2o = radius(th2, ORBIT_E), td2 = angularSpeed(th2, ORBIT_E);
      worstOrbit = Math.max(worstOrbit, Math.abs((td2 / td1o) - ((r1o * r1o) / (r2o * r2o))));
      if (po !== -Infinity && !(td2 > po)) riseOrbit = false; po = td2;
    }
    ck('3 · shared guarantee: chair ω₂/ω₁ === I₁/I₂, orbit θ̇₂/θ̇₁ === r₁²/r₂², AND rate strictly rises with frac in BOTH',
       worstChair < EPS && worstOrbit < EPS && riseChair && riseOrbit,
       'chair worst = ' + worstChair.toExponential(2) + ' · orbit worst = ' + worstOrbit.toExponential(2) + ' · rises: chair ' + riseChair + ' orbit ' + riseOrbit);
  }

  // LEG 4 — HONESTY: the two conserved magnitudes are NOT equal (≈12× apart, different units); what is
  // shared is only the invariance — held === 1 in BOTH worlds at leak=0 for every frac.
  {
    const distinct = L_SKATER !== L_ORBIT;
    const ratio = L_SKATER / L_ORBIT;
    let worstHeld = 0;
    for (const f of fracs){
      worstHeld = Math.max(worstHeld, Math.abs(needleReading('chair', f, 0).held - 1));
      worstHeld = Math.max(worstHeld, Math.abs(needleReading('orbit', f, 0).held - 1));
    }
    ck('4 · honesty: L_SKATER ≠ L_ORBIT (ratio ≈ ' + ratio.toFixed(1) + ', different units) yet held === 1 in BOTH at leak=0 — the invariance is shared, never the number',
       distinct && ratio > 11 && worstHeld < EPS,
       'L_SKATER = ' + L_SKATER.toFixed(4) + ' kg·m²/s · L_ORBIT = ' + L_ORBIT + ' (—) · held worst |Δ| = ' + worstHeld.toExponential(2));
  }

  // LEG 5 — NEG-CONTROL (the teeth): the leak bleeds L away, deeper with more leak, decoupling the worlds.
  {
    // (a) leak=0 ⇒ L === Lideal exactly.
    let worstIdeal = 0;
    for (const scene of ['chair', 'orbit']) for (const f of fracs){
      const rd = needleReading(scene, f, 0);
      worstIdeal = Math.max(worstIdeal, Math.abs(rd.L - rd.Lideal));
    }
    // (b) leak>0 ⇒ L strictly decreases across frac, and deeper for larger leak.
    let strictDrop = true, deeper = true;
    for (const scene of ['chair', 'orbit']){
      let prev = Infinity;
      for (const f of fracs){ const L = needleReading(scene, f, 0.5).L; if (f > 0 && !(L < prev)) strictDrop = false; prev = L; }
      const shallow = needleReading(scene, 1, 0.3).L, deep = needleReading(scene, 1, 0.7).L;
      if (!(deep < shallow)) deeper = false;
    }
    // (c) the leaked rate is below the ideal (spin-up falters), and leak→1 ⇒ L→0 at frac=1.
    let rateBelow = true, toZero = true;
    for (const scene of ['chair', 'orbit']){
      for (const f of fracs){ if (f > 0 && !(needleReading(scene, f, 0.5).rate < needleReading(scene, f, 0).rate)) rateBelow = false; }
      if (Math.abs(needleReading(scene, 1, 1).L) > EPS) toZero = false;
    }
    // (d) DECOUPLE: at leak>0 the L-range across the drag is bounded from 0, vs flat (<1e-9) at leak=0.
    let decouple = true;
    for (const scene of ['chair', 'orbit']){
      let lo0 = Infinity, hi0 = -Infinity, loK = Infinity, hiK = -Infinity;
      for (const f of fracs){
        const L0v = needleReading(scene, f, 0).L, Lk = needleReading(scene, f, 0.5).L;
        lo0 = Math.min(lo0, L0v); hi0 = Math.max(hi0, L0v);
        loK = Math.min(loK, Lk); hiK = Math.max(hiK, Lk);
      }
      if (!((hi0 - lo0) < EPS && (hiK - loK) > 1e-3)) decouple = false;
    }
    ck('5 · neg-control: leak=0 ⇒ L===Lideal; leak>0 ⇒ L strictly falls across frac (deeper with more leak); leaked rate < ideal; leak→1 ⇒ L→0; and the drag DECOUPLES the worlds',
       worstIdeal < EPS && strictDrop && deeper && rateBelow && toZero && decouple,
       'ideal worst = ' + worstIdeal.toExponential(2) + ' · strictDrop=' + strictDrop + ' deeper=' + deeper + ' rateBelow=' + rateBelow + ' toZero=' + toZero + ' decouple=' + decouple);
  }

  // LEG 6 — PAYOFF-LIVENESS: the needle HOLDS as you push (held flat, rates rise) and SAGS under the leak.
  {
    const pl = runPayoffLiveness();
    ck('6 · payoff-liveness: held flat at 1.0 & rates strictly rise at leak=0 in BOTH worlds; held strictly sags at leak=0.5 (the needle holds, then bleeds)',
       pl.pass, pl.detail.map(d => d.scene + '{held0=1:' + d.heldFlat + ',rise:' + d.riseOK + ',sag:' + d.sagOK + '}').join(' · '));
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  ORBIT_E, L_SKATER, L_ORBIT, SAG_MAX,
  chairRadiusAt, orbitThetaAt, orbitFracFromTheta, needleReading,
  needleIndex, needleAngleDeg, sceneRateRange,
  runPayoffLiveness, runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region above
// byte-identically; core.test.mjs imports these exports and re-proves every leg + parity + honesty grep.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.info ? '  ·  ' + c.info : ''));
  console.log('\nThe Spin They Keep — core self-test: ' + r.passed + '/' + r.total + (r.ok ? ' ✓ ALL GREEN' : ' ✗ FAILURES'));
  process.exit(r.ok ? 0 : 1);
}
