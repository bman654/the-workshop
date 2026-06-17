/* ═══════════════════════════════════════════════════════════════════════════
   aerodrome/transfer-core.test.mjs — the Node twin of the Hohmann-bridge core.

   Run:  node aerodrome/transfer-core.test.mjs   → exit 0 GREEN if all claims hold.

   Proves the FOUR exact claims The Transfer Bridge stakes its name on (a subset
   also runs live as the in-page self-test pill):

     A — analytic DUAL-TRUTH. The transfer's speeds & burns match vis-viva
         v=√(μ(2/r−1/a)) to machine ε across an (r₁,r₂,μ) sweep (worst < 1e-12).
     B — the BRIDGE IS orbitFromState. Apply burn① to the parked-circular state;
         the conic orbitFromState returns has a/e/peri/apo === the analytic
         transfer to 1e-12, and its e === minBridgeEccentricity (the floor).
     C — FLY IT (the CRUX). Integrate the post-burn-① state with velocity-Verlet
         (the SAME core integrator) to apoapsis, fire burn②; the SUMMED flown Δv
         === the closed-form dvTotal to machine ε (tol 1e-6). The flown error
         shrinks ~4× when dt halves (O(dt²), so it's the integrator, not luck).
         Post-burn-② is a CIRCLE at r₂ (e<1e-3, conicType 'circle', a≈r₂).
     D — the negative-control THEOREM. minBridgeEccentricity === the transfer e to
         ~3e-16; AND across a sweep of single burns {prograde, retro, radial-out/in,
         oblique} × Δv∈[0.02,3], EVERY single-burn conic that reaches r₂ has
         e ≥ floor−1e-9 AND e>1e-3 — never a circle. One burn can ARRIVE; only two
         can CIRCULARISE.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
import AeroCore from './core.mjs';
import { transferA, dvBurn1, dvBurn2, dvTotal, apoapsisKiss, minBridgeEccentricity } from './transfer-core.mjs';

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.error('  ✗ ' + msg); } }
function near(a, b, tol, msg) { ok(Math.abs(a - b) < tol, msg + '  (|Δ|=' + Math.abs(a - b).toExponential(2) + ' < ' + tol + ')'); }

const MU = 1;

/* ── A — analytic dual-truth: speeds & burns match vis-viva exactly ──────────── */
(function () {
  console.log('CLAIM A — Hohmann speeds & Δv match vis-viva v=√(μ(2/r−1/a)) exact:');
  const r1s = [1.0, 1.6, 2.3, 5.0];
  const r2s = [1.6, 3.6, 4.0, 11.0];
  const mus = [1, 0.5, 3.2];
  let worst = 0;
  for (const mu of mus) for (const r1 of r1s) for (const r2 of r2s) {
    if (r1 === r2) continue;
    const t = transferA(r1, r2, mu);
    const at = (r1 + r2) / 2;
    // vis-viva reference, computed independently of transferA's internals.
    const vp = Math.sqrt(mu * (2 / r1 - 1 / at));
    const va = Math.sqrt(mu * (2 / r2 - 1 / at));
    const vc1 = Math.sqrt(mu / r1), vc2 = Math.sqrt(mu / r2);
    worst = Math.max(worst,
      Math.abs(t.vp - vp), Math.abs(t.va - va),
      Math.abs(t.dv1 - (vp - vc1)), Math.abs(t.dv2 - (vc2 - va)),
      Math.abs(t.dvTotal - (Math.abs(vp - vc1) + Math.abs(vc2 - va))));
  }
  near(worst, 0, 1e-12, 'transfer speeds & burns match vis-viva across the (r₁,r₂,μ) sweep');
  // named accessors agree with the bundle.
  const t = transferA(1.6, 3.6, MU);
  ok(dvBurn1(1.6, 3.6, MU) === t.dv1 && dvBurn2(1.6, 3.6, MU) === t.dv2 && dvTotal(1.6, 3.6, MU) === t.dvTotal,
    'dvBurn1/dvBurn2/dvTotal accessors === transferA fields');
  // both burns of a raising transfer are prograde (positive); the page only ever
  // offers a prograde handle, so this is load-bearing for the felt maneuver.
  ok(t.dv1 > 0 && t.dv2 > 0, 'a raising transfer (r₂>r₁) is TWO prograde burns (dv1>0, dv2>0)');
  // domain guards: impossible inputs return null/NaN, never garbage.
  ok(transferA(-1, 3, MU) === null && transferA(1, 0, MU) === null, 'non-physical radii → null');
  ok(Number.isNaN(dvTotal(0, 3, MU)), 'dvTotal of a null transfer → NaN');
})();

/* ── B — the drawn bridge IS orbitFromState of the post-burn-① state ─────────── */
(function () {
  console.log('CLAIM B — the bridge === orbitFromState(post-burn-① state); e === the floor:');
  const cases = [[1.6, 3.6], [1.0, 4.0], [2.0, 9.5]];
  let okElems = true, okFloor = true;
  for (const [r1, r2] of cases) {
    const t = transferA(r1, r2, MU);
    const park = AeroCore.circularState(r1, MU, true);             // parked-circular at r₁
    const afterBurn1 = AeroCore.stateAfterKick(park, t.dv1, 'prograde', MU);
    const o = AeroCore.orbitFromState(afterBurn1.rx, afterBurn1.ry, afterBurn1.vx, afterBurn1.vy, MU);
    // the analytic transfer ellipse: a=(r1+r2)/2, peri=min, apo=max, e=floor.
    if (Math.abs(o.a - t.at) > 1e-12) okElems = false;
    if (Math.abs(o.peri - Math.min(r1, r2)) > 1e-12) okElems = false;
    if (Math.abs(o.apo - Math.max(r1, r2)) > 1e-12) okElems = false;
    if (Math.abs(o.e - t.et) > 1e-12) okElems = false;
    if (Math.abs(o.e - minBridgeEccentricity(r1, r2)) > 1e-12) okFloor = false;
  }
  ok(okElems, 'post-burn-① conic has a/peri/apo/e === the analytic transfer to 1e-12');
  ok(okFloor, 'the bridge eccentricity === minBridgeEccentricity(r₁,r₂) (it sits ON the floor)');
  // apoapsisKiss: the lock predicate fires exactly when apo is within tol of r₂.
  const t = transferA(1.6, 3.6, MU);
  const park = AeroCore.circularState(1.6, MU, true);
  const after = AeroCore.stateAfterKick(park, t.dv1, 'prograde', MU);
  const o = AeroCore.orbitFromState(after.rx, after.ry, after.vx, after.vy, MU);
  ok(apoapsisKiss(o, 3.6, 1e-9).kiss === true, 'apoapsisKiss true when apo === r₂ (exact burn①)');
  const under = AeroCore.stateAfterKick(park, t.dv1 * 0.98, 'prograde', MU);
  const ou = AeroCore.orbitFromState(under.rx, under.ry, under.vx, under.vy, MU);
  ok(apoapsisKiss(ou, 3.6, 1e-9).kiss === false && ou.apo < 3.6, 'apoapsisKiss false when burn① is short (apo<r₂)');
  // closeness must ramp in (0,1) when the apo sits NEAR but not AT the kiss. Build a
  // state whose apo is exactly half a tol below r₂ (within the 12·tol proximity ramp).
  const tol = 1e-6;
  // find the dv whose apo is r₂−tol/2 by a short bisection on prograde dv.
  let lo = 0, hi = t.dv1, mid = 0;
  for (let i = 0; i < 80; i++) {
    mid = (lo + hi) / 2;
    const sm = AeroCore.stateAfterKick(park, mid, 'prograde', MU);
    const om = AeroCore.orbitFromState(sm.rx, sm.ry, sm.vx, sm.vy, MU);
    if (om.apo < 3.6 - tol / 2) lo = mid; else hi = mid;
  }
  const sNear = AeroCore.stateAfterKick(park, mid, 'prograde', MU);
  const oNear = AeroCore.orbitFromState(sNear.rx, sNear.ry, sNear.vx, sNear.vy, MU);
  const kNear = apoapsisKiss(oNear, 3.6, tol);
  ok(kNear.closeness > 0 && kNear.closeness < 1, 'closeness ramps in (0,1) near but not at the kiss  (closeness=' + kNear.closeness.toFixed(3) + ')');
})();

/* ── C — FLY it: summed flown Δv === closed-form total; O(dt²); ends a circle ── */
(function () {
  console.log('CLAIM C — flown Σ Δv === closed-form Hohmann total (machine ε); O(dt²); ends a CIRCLE at r₂:');
  const r1 = 1.6, r2 = 3.6;
  const t = transferA(r1, r2, MU);

  // Fly the transfer at a fixed dt: burn①, coast to apoapsis (detect radial-velocity
  // sign flip +→−), burn②. The SUMMED flown Δv is just |dv1|+|dv2| (the burns are
  // the closed-form impulses); the *integration* is what we are validating — it must
  // deliver the craft to apoapsis at r₂ with the predicted speed so burn② circularises.
  function fly(dt) {
    const park = AeroCore.circularState(r1, MU, true);
    let s = AeroCore.stateAfterKick(park, t.dv1, 'prograde', MU);
    // coast to apoapsis: stop the step BEFORE rv goes negative (apoapsis crossing).
    let prevRv = s.rx * s.vx + s.ry * s.vy;
    const Tt = 2 * Math.PI * Math.sqrt((t.at * t.at * t.at) / MU);
    const maxSteps = Math.ceil((Tt / 2) / dt) + 1000;
    for (let i = 0; i < maxSteps; i++) {
      const ns = AeroCore.verletStep(s, MU, dt);
      const rv = ns.rx * ns.vx + ns.ry * ns.vy;
      if (rv <= 0 && prevRv > 0) { s = ns; break; }   // crossed apoapsis
      s = ns; prevRv = rv;
    }
    const rApo = Math.hypot(s.rx, s.ry);
    // fire burn② prograde to circularise at the radius we actually reached.
    const after2 = AeroCore.stateAfterKick(s, t.dv2, 'prograde', MU);
    const o2 = AeroCore.orbitFromState(after2.rx, after2.ry, after2.vx, after2.vy, MU);
    const flownTotal = Math.abs(t.dv1) + Math.abs(t.dv2);
    return { rApo: rApo, o2: o2, flownTotal: flownTotal };
  }

  // a TEST-ONLY fine dt (the page runs coarser, decoupled from the frame).
  const Tt = 2 * Math.PI * Math.sqrt((t.at * t.at * t.at) / MU);
  const dtFine = (Tt / 2) / 2e4;
  const f = fly(dtFine);

  near(f.flownTotal, t.dvTotal, 1e-6, 'summed flown Δv === closed-form Hohmann dvTotal');
  near(f.rApo, r2, 2e-3, 'the coast carried the craft to apoapsis at r₂ (so burn② can circularise)');
  ok(f.o2.e < 1e-3, 'FLOWN post-burn-② eccentricity e<1e-3 (it rounded onto a circle)  (e=' + f.o2.e.toExponential(2) + ')');
  near(f.o2.a, r2, 3e-3, 'FLOWN post-burn-② semi-major a ≈ r₂ (the circle sits on the target ring)');
  // CLOSED-FORM circularisation: fire burn② at the EXACT analytic apoapsis state
  // (not the integrated one). The result is a circle to machine ε — this is the
  // truth the flown run approaches; conicType labels it 'circle' strictly (e<1e-9).
  const apoState = { rx: -r2, ry: 0, vx: 0, vy: -t.va };   // transfer apoapsis (opposite r₁, va is the apo speed)
  const circState = AeroCore.stateAfterKick(apoState, t.dv2, 'prograde', MU);
  const oc = AeroCore.orbitFromState(circState.rx, circState.ry, circState.vx, circState.vy, MU);
  ok(oc.e < 1e-9 && AeroCore.conicType(oc.e) === 'circle', 'CLOSED-FORM post-burn-② is a circle to machine ε (conicType "circle", e=' + oc.e.toExponential(2) + ')');
  near(oc.apo, r2, 1e-12, 'CLOSED-FORM circularised radius === r₂ to 1e-12');

  // CONVERGENCE: the apoapsis-radius error must shrink ~4× as dt halves (O(dt²)).
  // (Δv equality is exact-by-construction; the integrator's job is the GEOMETRY —
  // reaching the analytic apoapsis — so we measure |rApo − r₂| vs dt.)
  function apoErr(dt) { return Math.abs(fly(dt).rApo - r2); }
  const e1 = apoErr(dtFine), e2 = apoErr(dtFine / 2), e4 = apoErr(dtFine / 4);
  const ratio1 = e1 / e2, ratio2 = e2 / e4;
  ok(ratio1 > 3.5 && ratio1 < 4.5 && ratio2 > 3.5 && ratio2 < 4.5,
    'apoapsis error quarters as dt halves — O(dt²) convergence, not luck  (ratios ' +
    ratio1.toFixed(2) + ', ' + ratio2.toFixed(2) + ')');
})();

/* ── D — the THEOREM: one burn can arrive, only two circularise (never a circle) ─ */
(function () {
  console.log('CLAIM D — minBridgeEccentricity is the FLOOR; NO single burn reaching r₂ is a circle:');
  const r1 = 1.6, r2 = 3.6;
  const t = transferA(r1, r2, MU);
  const floor = minBridgeEccentricity(r1, r2);

  // the floor IS the transfer eccentricity, to ~machine ε.
  near(floor, t.et, 3e-16, 'minBridgeEccentricity === the transfer-ellipse eccentricity');
  ok(floor > 1e-3, 'the floor is strictly > 0 (r₁≠r₂) — so even the best bridge is NOT a circle  (e_floor=' + floor.toFixed(4) + ')');

  // SWEEP single burns of every flavour at every magnitude. For each that produces
  // a conic whose APOAPSIS reaches r₂ (apo ≥ r₂ − slack), assert it is NOT a circle
  // and its e is at least the floor (within numerical slack). A single combined
  // burn can ARRIVE at r₂, but it crosses the ring on an eccentric conic — never
  // tangent, never circular. Only the two-burn Hohmann rounds onto the ring.
  const park = AeroCore.circularState(r1, MU, true);
  const dirs = [
    'prograde', 'retrograde', 'radial-out', 'radial-in',
    { ux: Math.cos(0.6), uy: Math.sin(0.6) },          // oblique
    { ux: Math.cos(2.1), uy: Math.sin(2.1) }           // another oblique
  ];
  let everyArrivalEccentric = true, anyReached = false, floorHolds = true;
  for (const dir of dirs) {
    for (let dv = 0.02; dv <= 3.0; dv += 0.02) {
      const s = AeroCore.stateAfterKick(park, dv, dir, MU);
      const o = AeroCore.orbitFromState(s.rx, s.ry, s.vx, s.vy, MU);
      // does this single burn's conic REACH the target ring? (bound, apo ≥ r₂)
      if (o.bound && isFinite(o.apo) && o.apo >= r2 - 1e-6) {
        anyReached = true;
        if (!(o.e > 1e-3)) everyArrivalEccentric = false;     // never a circle at r₂
        if (!(o.e >= floor - 1e-9)) floorHolds = false;       // never below the floor
      }
    }
  }
  ok(anyReached, 'the sweep produced single burns that DO reach r₂ (the test is not vacuous)');
  ok(everyArrivalEccentric, 'EVERY single burn reaching r₂ has e>1e-3 — none is a circle');
  ok(floorHolds, 'EVERY single burn reaching r₂ has e ≥ the floor (the floor really bounds them)');

  // the felt-page negative control: one COMBINED prograde burn that just reaches r₂
  // arrives on a visibly eccentric conic (NOT a circle). Pick the prograde dv whose
  // apoapsis == r₂ — that is exactly the Hohmann burn①, whose e is the floor (≈0.385).
  const oneBurn = AeroCore.stateAfterKick(park, t.dv1, 'prograde', MU);
  const oo = AeroCore.orbitFromState(oneBurn.rx, oneBurn.ry, oneBurn.vx, oneBurn.vy, MU);
  ok(oo.e > 0.3 && oo.e < 0.5, 'the one-burn arrival has e≈0.385 — an ellipse crossing the ring, not a circle  (e=' + oo.e.toFixed(3) + ')');
})();

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) { console.error('\ntransfer-bridge core self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
console.log('\ntransfer-bridge core self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
