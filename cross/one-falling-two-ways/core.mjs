// ============================================================================
//  ONE FALLING, TWO WAYS — logic core (a free-falling cabin's brake-entry speed
//  and a water-clock's Torricelli jet are the SAME law v = √(2gh)). Pure,
//  dependency-free except TWO single-source ES imports: the drop-tower core and
//  the water-clock core are the estate's sole authorities for their own physics,
//  so the entry speed this cross rides and the jet speed it rides come from THOSE
//  modules — never a re-typed √(2gh) (anti-circularity). The page resolves both
//  natively as browser ES modules (BOTH two ../ hops — cross/<leaf>/ is one dir
//  deeper than a top-level bench), so the imports sit ABOVE the CORE region and
//  are NOT part of the byte-twin slab.
//
//  THE ONE IDEA. Turn ONE gold √-groove — the law v = √(2gh) — with a single
//  shared HEIGHT dial, and two worlds that never met ride the very same curve.
//
//    • THE CABIN (drop-tower/core.mjs). A sealed cabin is hoisted h metres and
//      the cable releases. It free-falls under gravity alone and reaches the brake
//      zone at the entry speed v with ½ m v² = m g h, i.e. v = √(2·g_DT·h). The
//      faster you've fallen, the deeper you fell — the SAME √ law, read as a SPEED
//      of arrival.
//
//    • THE TANK (hours/water-clock/core.mjs). A vessel filled to head h leaks
//      through a small orifice. Torricelli's law gives the jet speed leaving the
//      hole: v = √(2·g_WC·h). It is AREA-INDEPENDENT — recovered from the outflow
//      ODE dh/dt = −(a/A)·v as v = −dh/dt · A/a, the shaped bore and the straight
//      cylinder agree to 4.4e-16. The deeper the water, the faster the jet — the
//      SAME √ law, read as a speed of LEAVING.
//
//  THE LATCH. Free-fall entry speed and Torricelli jet speed are the IDENTICAL
//  function of head. The lock pill latches GOLD on |fall − jet| < 1e-9. It is NOT
//  a tautology: the two benches were measured with slightly DIFFERENT g (the
//  drop-tower's 9.81 vs the water-clock's standard 9.80665), so the RAW jet sits a
//  fixed 1.7076e-4 (relative) below the cabin's entry speed — a real, bounded gap
//  the teeth leg pins to the EXACT identity (1 − √(g_WC/g_DT)). We hold the shared
//  groove at the cabin's g and WARP the tank's head by the exact factor g_DT/g_WC
//  so the two laws sit on ONE curve to 4.4e-16 — and that un-warped gap is itself
//  the proof the collapse is engineered, not assumed.
//
//  THE FORM (form expresses content). One brass instrument. ROW 1 = two butted
//  bays: LEFT a drop-tower shaft (a release line, a floor that slides DOWN as h
//  grows, a seat-scale that snaps to WEIGHTLESS on release); RIGHT a water tank
//  (a surface that rises in LOCKSTEP with the left floor, a parabolic jet arcing
//  from a base orifice, growing ∝ √h). ROW 2 = the GROOVE: one gold v=√(2gh)
//  curve with a warm cabin rider and a cool jet rider that OVERLAP into one
//  gold-haloed marker when both controls are off; the lock pill latches on the
//  live agreement. ROW 3 = the shared height dial + two brass-switch negative
//  controls.
//
//  TWO LOAD-BEARING NEGATIVE CONTROLS (the differentiators).
//    A. CLIP TO CABLE. A cable-held cabin (a = 0) coasts at a FIXED speed COAST_V,
//       no h→v at all. Its rideRatio v/√h is NOT constant (it spreads 2.449× over
//       the head range) ⟹ it provably FAILS the √-collapse, where the real
//       free-fall rideRatio is the SAME constant √(2·g_DT) to <1e-12.
//    B. METRONOME BORE. Swap the orifice for the water-clock's OWN shaped even-
//       ticking bore: the surface drops at the constant rate WC.C (the metronomic
//       tick, FLAT vs head). metronomeSurfaceSpeed() === WC.C, flat in t ⟹ its
//       rideRatio C/√h varies (spread 5.3e-2) ⟹ it FAILS the √-collapse, where a
//       TRUE Torricelli jet over the same heads rides one constant ratio.
//
//  SINGLE-SOURCE DISCIPLINE. The two recovery adapters below are the ONLY g-bearing
//  reads from each foreign core; each is wrapped in sub-sentinels so the
//  disjointness grep proves the cabin adapter names no water-clock fn and vice
//  versa. index.html inlines this whole CORE region byte-identically between the
//  same sentinels; the byte-twin parity leg proves the page IS this module.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. ANTI-CIRCULARITY — dtEntryV(h) === √(2·g_DT·h) and wcJetV(h) === √(2·g_WC·h)
//       to <1e-12 (the cores' own numbers, not re-typed); wcJetV is area-independent.
//    2. HEADLINE — over (0,H_MAX]: |fall − jet| < 1e-12 (worst 4.4e-16), every pair
//       collapsed, both === √(2·g_GROOVE·h), rideRatio the SAME constant √(2·g_GROOVE).
//    3. TEETH — the un-warped rawGap is BOUNDED BELOW (≥1e-4 relative at h≥0.05) AND
//       its relative value === the EXACT 1 − √(g_WC/g_DT) (h-independent, <1e-7), so
//       the warp is load-bearing; remove it and the gap caps at 1.7076e-4, never ε.
//    4. NEG-CONTROL A (coasting cabin) — coastEntryV(h) flat ⟹ rideRatio spreads
//       2.449× ⟹ FAILS the √-collapse (real free-fall rideRatio constant <1e-12).
//    5. NEG-CONTROL B (metronome bore) — metronomeSurfaceSpeed() === WC.C flat in t
//       ⟹ rideRatio varies ⟹ FAILS the √-collapse; anti-vacuity vs a true jet.
//    6. BYTE-TWIN PARITY + DISJOINTNESS — index.html's inlined CORE === core.mjs
//       CORE char-for-char; the two adapter blocks name no foreign fn of each other.
// ============================================================================

import * as DT from '../../drop-tower/core.mjs';
import * as WC from '../../hours/water-clock/core.mjs';

// === CORE BEGIN ===
"use strict";

// ══ THE GROUNDED CONSTANTS — read LIVE from each foreign core, never re-typed ══════════════════════
const G_DT     = DT.G;        // the drop-tower's gravity (9.81 m/s²)
const G_WC     = WC.G;        // the water-clock's gravity (standard, 9.80665 m/s²)
const G_GROOVE = G_DT;        // the shared groove is held at the cabin's g (the tank's head is warped onto it)
const H_MAX    = WC.H0;       // both bodies share the water-clock's head scale: 0.30 m
const D_REF    = 0.5;         // an inert brake distance for the integrate() call (d,m,steps don't touch entry speed)

// ══ THE TWO RECOVERY ADAPTERS — the ONLY g-bearing reads from each foreign core ════════════════════
// Each is the sole bridge into one bench's physics; the disjointness grep slices these sub-sentineled
// blocks and proves the cabin block names no water-clock fn and the tank block names no cabin fn.

// ─ DROP-TOWER-ADAPTER BEGIN ─
// dtEntryV(h): the cabin's brake-ENTRY speed after a free fall of h metres, read straight off the
// drop-tower's own integrator (verdict.vBrakeEntry). d_brake / m / steps are inert to the entry speed
// (½ m v² = m g h ⟹ v = √(2·g_DT·h)), so any inert d/m/steps recover the same number.
function dtEntryV(h){
  return DT.integrate(h, D_REF, 1, 1).verdict.vBrakeEntry;
}
// ─ DROP-TOWER-ADAPTER END ─

// ─ WATER-CLOCK-ADAPTER BEGIN ─
// wcJetV(h): the Torricelli jet speed leaving the orifice at head h, RECOVERED from the water-clock's
// own outflow ODE dh/dt = −(a/A)·v. Inverting: v = −dh/dt · A/a. AREA-INDEPENDENT — the shaped bore
// and the straight cylinder give the same jet to 4.4e-16, because the A cancels (= √(2·g_WC·h)).
function wcJetV(h){
  return -WC.dhdt(h, WC.shapedArea, WC.A_ORIFICE) * WC.shapedArea(h) / WC.A_ORIFICE;
}
// metronomeSurfaceSpeed(): NEG-CONTROL B's flat readout — the shaped bore's demanded CONSTANT level-
// drop rate WC.C (= H0/T_DRAIN = 0.02 m/s, the metronomic tick). Genuinely flat vs head, genuinely
// the water-clock's own constant — a SURFACE speed, not a jet speed, so it cannot ride the √-groove.
function metronomeSurfaceSpeed(){
  return WC.C;
}
// ─ WATER-CLOCK-ADAPTER END ─

// ══ THE SHARED SURFACE — the one law, the warp, the groove readout, the teeth, the ride ratio ══════
// vSqrt(g,h): the law itself, v = √(2gh). The gold groove is vSqrt(G_GROOVE, ·).
function vSqrt(g, h){ return Math.sqrt(2 * g * h); }

// warpForGroove(h): hold the shared groove at the cabin's g and warp the tank's head by the EXACT
// factor g_DT/g_WC, so wcJetV(warpForGroove(h)) = √(2·g_WC·(h·g_DT/g_WC)) = √(2·g_DT·h) — the cabin's
// groove, to machine-ε. The un-warped gap (teeth) measures how far apart the two g's leave the laws.
function warpForGroove(h){ return h * G_DT / G_WC; }

// grooveReadout(h): the hero readout. `groove` is the gold curve; `fall` the cabin rider (raw h);
// `jet` the tank rider (WARPED head, so it collapses onto the groove); `collapsed` the live agreement.
function grooveReadout(h){
  const fall = dtEntryV(h);
  const jet  = wcJetV(warpForGroove(h));
  return { h, groove: vSqrt(G_GROOVE, h), fall, jet, collapsed: Math.abs(fall - jet) < 1e-12 };
}

// rawJet(h): the UN-warped jet (raw head) — the tank read at its own g_WC. rawGap(h) is the bounded
// teeth gap between the cabin's entry speed and the un-warped jet; it never reaches machine-ε.
function rawJet(h){ return wcJetV(h); }
function rawGap(h){ return Math.abs(dtEntryV(h) - rawJet(h)); }

// rideRatio(v,h): v/√h. On the √-law this is the CONSTANT √(2g) for every h; a body that does NOT
// obey v = √(2gh) (a coasting cabin, a metronomic surface) gives a ratio that VARIES with h — that
// variance is exactly how each negative control provably fails the √-collapse.
function rideRatio(v, h){ return h > 0 ? v / Math.sqrt(h) : NaN; }

// ══ THE NEGATIVE CONTROLS — flat readouts the teeth / peel-off render reads ═════════════════════════
// COAST_V: a fixed coast speed (a representative held-cabin speed). coastEntryV(h) is FLAT in h — a
// cable-held cabin, a = 0, no h→v — so its rideRatio v/√h spreads with h and it fails the √-collapse.
const COAST_V = vSqrt(G_GROOVE, 0.15);
function coastEntryV(h){ return COAST_V; }

// the head sweep the page and the test ride over (the dial's detents, in metres of head).
const H_SWEEP = [0.02, 0.05, 0.08, 0.12, 0.16, 0.20, 0.24, 0.27, 0.30];

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ════════════════
function runSelfTest(){
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info });

  // LEG 1 — ANTI-CIRCULARITY: each recovery adapter reproduces its core's OWN √ law (not a re-typed
  // literal), and the jet is area-independent (shaped bore === straight cylinder).
  {
    let wFall = 0, wJet = 0, wArea = 0;
    for (const h of H_SWEEP){
      wFall = Math.max(wFall, Math.abs(dtEntryV(h) - vSqrt(G_DT, h)));
      wJet  = Math.max(wJet,  Math.abs(wcJetV(h)   - vSqrt(G_WC, h)));
      const cyl = -WC.dhdt(h, WC.cylinderArea, WC.A_ORIFICE) * WC.cylinderArea(h) / WC.A_ORIFICE;
      wArea = Math.max(wArea, Math.abs(wcJetV(h) - cyl));
    }
    ck('1 · anti-circularity: dtEntryV === √(2·g_DT·h), wcJetV === √(2·g_WC·h) (<1e-12), jet area-independent',
       wFall < 1e-12 && wJet < 1e-12 && wArea < 1e-12,
       'fall=' + wFall.toExponential(2) + ' jet=' + wJet.toExponential(2) + ' area=' + wArea.toExponential(2));
  }

  // LEG 2 — HEADLINE (the collapse): over a dense (0,H_MAX] sweep the cabin entry speed and the
  // WARPED-head jet agree to <1e-12, every pair collapses, both === the gold groove √(2·g_GROOVE·h),
  // and the rideRatio is the SAME constant √(2·g_GROOVE) for both.
  {
    let worst = 0, allCollapsed = true, grooveErr = 0, rrSpread = 0;
    const rrRef = Math.sqrt(2 * G_GROOVE);
    for (let i = 1; i <= 50; i++){
      const h = H_MAX * i / 50;
      const r = grooveReadout(h);
      worst = Math.max(worst, Math.abs(r.fall - r.jet));
      if (!r.collapsed) allCollapsed = false;
      grooveErr = Math.max(grooveErr, Math.abs(r.fall - r.groove), Math.abs(r.jet - r.groove));
      rrSpread = Math.max(rrSpread, Math.abs(rideRatio(r.fall, h) - rrRef), Math.abs(rideRatio(r.jet, h) - rrRef));
    }
    ck('2 · headline: |fall − jet| < 1e-12 over (0,H_MAX], all collapsed, both === √(2·g_GROOVE·h), one rideRatio',
       worst < 1e-12 && allCollapsed && grooveErr < 1e-12 && rrSpread < 1e-12,
       'worst=' + worst.toExponential(2) + ' grooveErr=' + grooveErr.toExponential(2) + ' rrSpread=' + rrSpread.toExponential(2));
  }

  // LEG 3 — TEETH (the warp is load-bearing): the un-warped rawGap is bounded below (≥1e-4 relative at
  // h≥0.05) AND its relative value === the EXACT teeth identity 1 − √(g_WC/g_DT) (h-INDEPENDENT) to
  // <1e-7. Remove the warp and the gap caps at 1.7076e-4 — never machine-ε. The ½·dg/g linearization
  // is the same number to <1e-3 (a sanity bound, not the claim).
  {
    const exactRel = 1 - Math.sqrt(G_WC / G_DT);
    let minRel = Infinity, lawErr = 0, hSpread = 0, relRef = null;
    for (const h of H_SWEEP){
      const rel = rawGap(h) / dtEntryV(h);
      if (relRef === null) relRef = rel;
      hSpread = Math.max(hSpread, Math.abs(rel - relRef));          // h-independence of the relative gap
      lawErr  = Math.max(lawErr, Math.abs(rel - exactRel));         // === the exact teeth identity
      if (h >= 0.05) minRel = Math.min(minRel, rel);                // bounded below (a real gap, not ε)
    }
    const linLaw = 0.5 * Math.abs(G_DT - G_WC) / ((G_DT + G_WC) / 2);
    ck('3 · teeth: un-warped gap ≥1e-4 (rel) at h≥0.05, === exact 1−√(g_WC/g_DT) (h-indep <1e-7), ½dg/g sanity <1e-3',
       minRel >= 1e-4 && lawErr < 1e-7 && hSpread < 1e-7 && Math.abs(exactRel - linLaw) / exactRel < 1e-3,
       'minRel=' + minRel.toExponential(2) + ' exactErr=' + lawErr.toExponential(2) + ' exactRel=' + exactRel.toExponential(4));
  }

  // LEG 4 — NEG-CONTROL A (coasting cabin, load-bearing): coastEntryV(h) is identical at every head
  // ⟹ its rideRatio v/√h SPREADS with h (caps held; a cable-held cabin doesn't obey v=√(2gh)), so a
  // √-collapse classifier provably FAILS it; anti-vacuity — the real free-fall rideRatio is constant.
  {
    const hs = [0.05, 0.15, 0.30];
    const coastFlat = coastEntryV(hs[0]) === coastEntryV(hs[1]) && coastEntryV(hs[1]) === coastEntryV(hs[2]);
    const cr = hs.map(h => rideRatio(coastEntryV(h), h));
    const coastVaries = (Math.max(...cr) / Math.min(...cr)) > 2;   // measured 2.449×
    const fr = hs.map(h => rideRatio(dtEntryV(h), h));
    const realConstant = (Math.max(...fr) - Math.min(...fr)) < 1e-12;
    ck('4 · neg-control A (coast): coastEntryV flat ⟹ rideRatio spreads >2× (FAILS √); real free-fall ratio constant <1e-12',
       coastFlat && coastVaries && realConstant,
       'coastSpread=' + (Math.max(...cr) / Math.min(...cr)).toFixed(3) + '× realSpread=' + (Math.max(...fr) - Math.min(...fr)).toExponential(2));
  }

  // LEG 5 — NEG-CONTROL B (metronome bore, load-bearing): metronomeSurfaceSpeed() === WC.C flat across
  // t ⟹ its rideRatio C/√h VARIES with head, so the √-collapse classifier provably FAILS it; anti-
  // vacuity — a TRUE Torricelli jet over the same heads rides ONE constant ratio.
  {
    const flat = metronomeSurfaceSpeed() === WC.C && Math.abs(metronomeSurfaceSpeed() - WC.C) < 1e-9;
    const hs = [0.05, 0.15, 0.30];
    const mr = hs.map(h => rideRatio(metronomeSurfaceSpeed(), h));
    const metVaries = (Math.max(...mr) - Math.min(...mr)) > 1e-2;  // measured 5.3e-2
    const jr = hs.map(h => rideRatio(wcJetV(h), h));
    const jetConstant = (Math.max(...jr) - Math.min(...jr)) < 1e-12;
    ck('5 · neg-control B (metronome): surfaceSpeed === WC.C flat ⟹ rideRatio varies (FAILS √); true jet ratio constant',
       flat && metVaries && jetConstant,
       'metSpread=' + (Math.max(...mr) - Math.min(...mr)).toExponential(2) + ' jetSpread=' + (Math.max(...jr) - Math.min(...jr)).toExponential(2));
  }

  const passed = checks.filter(c => c.ok).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}

export {
  G_DT, G_WC, G_GROOVE, H_MAX, D_REF, COAST_V, H_SWEEP,
  dtEntryV, wcJetV, metronomeSurfaceSpeed,
  vSqrt, warpForGroove, grooveReadout, rawJet, rawGap, rideRatio, coastEntryV,
  runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region
// above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('One Falling, Two Ways — core self-test: ' + r.passed + '/' + r.total +
    (r.ok ? ' ✓' : ' ✗ ' + r.checks.filter(c => !c.ok).map(c => c.name).join(',')));
  process.exit(r.ok ? 0 : 1);
}
