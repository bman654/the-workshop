/* ═══════════════════════════════════════════════════════════════════════════
   aerodrome/transfer-core.mjs — the thin Hohmann-bridge core for The Transfer
   Bridge (a second room in the Aerodrome wing).

   This is NOT a copy of the flight core. It LEANS ON aerodrome/core.mjs (imported
   below, byte-clean) for the two-body propagator + orbitFromState, and adds only
   the closed-form Hohmann transfer between two CIRCULAR coplanar orbits:

     burn ① at r₁ : raise apoapsis to r₂   (prograde)
     coast        : along the transfer ellipse to apoapsis
     burn ② at r₂ : circularise onto r₂    (prograde)

   The estate's name is staked on the page IMPORTING the SAME core the flight room
   uses — so this file is consumed as an ES module by both the page and the Node
   twin; there is NO inlining and therefore NO byte-parity sentinel (drop Claim E).

   CANONICAL UNITS: μ = 1 by default (the UI passes μ=1, r₁=1.6, r₂=3.6).

   The exact claims the twin (transfer-core.test.mjs) asserts:
     A — analytic DUAL-TRUTH: the speeds/Δv match vis-viva to machine ε.
     B — the drawn bridge IS orbitFromState of the post-burn-1 state (a/e/peri/apo
         === the analytic transfer to 1e-12; e === the minBridgeEccentricity floor).
     C — FLY it: summed flown Δv === the closed-form total to machine ε, the error
         shrinks as O(dt²), and post-burn-2 is a CIRCLE at r₂.
     D — the negative-control THEOREM: minBridgeEccentricity === the transfer e, and
         NO single burn from r₁ that reaches r₂ is ever a circle (e ≥ floor > 0).
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
import AeroCore from './core.mjs';

/* ── the full analytic Hohmann transfer between circular orbits r₁ → r₂ ────────
   Returns every quantity the page and the twin need, all from vis-viva:
     v = √(μ·(2/r − 1/a)).
   o1 is the TRANSFER ELLIPSE: its periapsis is min(r₁,r₂), apoapsis max(r₁,r₂),
   semi-major a_t=(r₁+r₂)/2, eccentricity e_t=|r₂−r₁|/(r₁+r₂). Works both ways
   (r₂>r₁ raise, r₂<r₁ lower); the burns flip sign accordingly. */
function transferA(r1, r2, mu) {
  if (mu == null) mu = 1;
  if (!(isFinite(r1) && isFinite(r2) && isFinite(mu)) || r1 <= 0 || r2 <= 0 || mu <= 0) return null;
  var vc1 = Math.sqrt(mu / r1);              // circular speed at start
  var vc2 = Math.sqrt(mu / r2);              // circular speed at target
  var at = (r1 + r2) / 2;                    // transfer-ellipse semi-major axis
  var vp = Math.sqrt(mu * (2 / r1 - 1 / at)); // transfer speed at r₁
  var va = Math.sqrt(mu * (2 / r2 - 1 / at)); // transfer speed at r₂
  var dv1 = vp - vc1;                         // burn ① (raise: +, lower: −)
  var dv2 = vc2 - va;                         // burn ② (raise: +, lower: −)
  var et = Math.abs(r2 - r1) / (r1 + r2);     // transfer-ellipse eccentricity
  return {
    r1: r1, r2: r2, mu: mu,
    vc1: vc1, vc2: vc2, at: at, vp: vp, va: va,
    dv1: dv1, dv2: dv2, dvTotal: Math.abs(dv1) + Math.abs(dv2),
    et: et,
    peri: Math.min(r1, r2), apo: Math.max(r1, r2),
    raising: r2 >= r1
  };
}

/* ── the two burns and their sum (thin named accessors over transferA) ───────── */
function dvBurn1(r1, r2, mu) { var t = transferA(r1, r2, mu); return t ? t.dv1 : NaN; }
function dvBurn2(r1, r2, mu) { var t = transferA(r1, r2, mu); return t ? t.dv2 : NaN; }
function dvTotal(r1, r2, mu) { var t = transferA(r1, r2, mu); return t ? t.dvTotal : NaN; }

/* ── minBridgeEccentricity — the THEOREM floor ─────────────────────────────────
   The least-eccentric ellipse that touches BOTH circles r₁ and r₂ has its apsides
   exactly AT r₁ and r₂ (peri=min, apo=max). Its eccentricity is
       e = (apo − peri)/(apo + peri) = |r₂ − r₁|/(r₁ + r₂).
   No conic reaching from r₁ out to r₂ can be less eccentric than this and still be
   a closed ellipse touching both — and it is strictly > 0 whenever r₁ ≠ r₂, so the
   bridge is NEVER a circle. This is the negative control made into a number. */
function minBridgeEccentricity(r1, r2) {
  if (!(isFinite(r1) && isFinite(r2)) || r1 <= 0 || r2 <= 0) return NaN;
  return Math.abs(r2 - r1) / (r1 + r2);
}

/* ── apoapsisKiss — does the conic `orbit` kiss the target radius r2? ───────────
   The lock predicate the UI reads (a closed-form test, NEVER the integrated sum):
   true when the conic's apoapsis is within `tol` of r2. Returns a small report so
   the UI can drive proximity glow (how close) AND the hard lock (within tol). The
   page maps its pixel snap-band → canonical tol through view.ppu so the visual
   snap and the lock use the SAME number. */
function apoapsisKiss(orbit, r2, tol) {
  if (tol == null) tol = 1e-6;
  if (!orbit || !isFinite(orbit.apo) || !isFinite(r2)) {
    return { kiss: false, gap: Infinity, signedGap: Infinity, closeness: 0 };
  }
  var signedGap = orbit.apo - r2;
  var gap = Math.abs(signedGap);
  // closeness: 1 at exact kiss, decaying over ~12·tol (a generous proximity ramp
  // so the apo dot warms well before it locks). Clamped to [0,1].
  var closeness = Math.max(0, Math.min(1, 1 - gap / (Math.max(tol, 1e-12) * 12)));
  return { kiss: gap <= tol, gap: gap, signedGap: signedGap, closeness: closeness };
}

export { transferA, dvBurn1, dvBurn2, dvTotal, apoapsisKiss, minBridgeEccentricity };
export { AeroCore };
export default { transferA, dvBurn1, dvBurn2, dvTotal, apoapsisKiss, minBridgeEccentricity, AeroCore };
