/* ═══════════════════════════════════════════════════════════════════════════
   aerodrome/core.mjs — the SOLE-AUTHORITY two-body flight core for The Aerodrome.

   This file is the one true source for the Aerodrome's orbital mathematics. It is
   inlined BYTE-IDENTICAL (between the CORE BEGIN / CORE END sentinels) into
   aerodrome/index.html, and a Node twin (aerodrome/core.test.mjs) asserts the
   three exact claims this estate stakes its name on:

     (1) TSIOLKOVSKY exact   — dvSpent(m0,mf,ve) === ve·ln(m0/mf) to machine ε.
     (2) ε-CONSERVATION      — velocity-Verlet conserves specific orbital energy
                               over a multi-period coast to < 1e-9, AND a leaky
                               forward-Euler control DRIFTS > 1e-3 on the SAME arc
                               (so the bound proves the integrator, not luck).
     (3) ESCAPE at √(2μ/r)   — v just under vEsc ALWAYS stays bound (ε<0, e<1,
                               finite apoapsis, returns); v just over ALWAYS
                               escapes (ε≥0, e≥1, r→∞ over a long horizon).

   CANONICAL UNITS: μ = 1, central body radius R = 1. (The UI scales to pixels.)
   This is a CLEARLY-SEPARATE state-vector force integrator — it does NOT reuse
   the orrery's elements-from-time Kepler core (that is degrees-and-epochs; this
   is a live (r,v) two-body propagator in canonical units). Optionally the orrery's
   kepler() may be used by callers as a read-only anomaly oracle; nothing here
   depends on it.
   ═══════════════════════════════════════════════════════════════════════════ */

/* CORE BEGIN — inlined byte-identical into index.html between the same sentinels.
   Do NOT edit one copy without the other; core.test.mjs asserts byte parity. */
var AeroCore = (function () {
  'use strict';

  /* ── Tsiolkovsky rocket equation ──────────────────────────────────────────
     The Δv a burn spends to take wet mass m0 → dry mass mf at exhaust velocity
     ve is exactly ve·ln(m0/mf). The Δv TANK's drained height IS this function —
     the gauge is the equation, not a decorative readout. Inputs must be finite,
     ve ≥ 0, and 0 < mf ≤ m0 (you cannot end heavier than you began). */
  function dvSpent(m0, mf, ve) {
    if (!(isFinite(m0) && isFinite(mf) && isFinite(ve))) return NaN;
    if (ve < 0 || mf <= 0 || m0 <= 0 || mf > m0) return NaN;
    return ve * Math.log(m0 / mf);
  }

  /* ── escape speed at radius r ──────────────────────────────────────────────
     v_esc = √(2μ/r). The luminous ESCAPE WALL in the UI is drawn at exactly this
     speed (same function the test asserts). μ defaults to the canonical 1. */
  function vEsc(r, mu) {
    if (mu == null) mu = 1;
    if (!(isFinite(r) && isFinite(mu)) || r <= 0 || mu < 0) return NaN;
    return Math.sqrt(2 * mu / r);
  }

  /* ── specific orbital energy ε = v²/2 − μ/r ────────────────────────────────
     The conserved quantity of the two-body coast. ε<0 bound (ellipse), ε=0
     parabolic, ε>0 unbound (hyperbola). r,v are SCALAR magnitudes here. */
  function specificEnergy(r, v, mu) {
    if (mu == null) mu = 1;
    if (!(isFinite(r) && isFinite(v) && isFinite(mu)) || r <= 0) return NaN;
    return 0.5 * v * v - mu / r;
  }

  /* ── conic classification from eccentricity ────────────────────────────────
     A tiny named helper so the UI + the test agree on the words. */
  function conicType(e) {
    if (!isFinite(e) || e < 0) return 'invalid';
    if (e < 1e-9) return 'circle';
    if (e < 1 - 1e-12) return 'ellipse';
    if (Math.abs(e - 1) <= 1e-9) return 'parabola';
    return 'hyperbola';
  }

  /* ── orbital elements & geometry FROM a state vector ───────────────────────
     Given position (rx,ry) and velocity (vx,vy) in the 2-D orbital plane about a
     central mass at the origin (μ), return the full analytic conic the craft is
     ON RIGHT NOW: semi-latus p, eccentricity e, semi-major a, argument of
     periapsis ω (the direction of periapsis, atan2), periapsis & apoapsis radii,
     specific energy ε, period T (NaN if unbound), and the true anomaly ν.

     This is the EXACT solution the UI draws as the pale-gilt conic; the moving
     dot is the INTEGRATED state. Their agreement is both the beauty and the proof.

     Method (2-D specialization of the standard vis-viva / eccentricity-vector
     derivation): specific angular momentum h = rx·vy − ry·vx (scalar, signed).
     The eccentricity vector e⃗ = ((v²−μ/r)·r⃗ − (r⃗·v⃗)·v⃗)/μ. */
  function orbitFromState(rx, ry, vx, vy, mu) {
    if (mu == null) mu = 1;
    var r = Math.hypot(rx, ry);
    var v2 = vx * vx + vy * vy;
    var v = Math.sqrt(v2);
    var h = rx * vy - ry * vx;                       // signed specific ang. momentum
    var rv = rx * vx + ry * vy;                      // r⃗·v⃗
    // eccentricity vector
    var ex = ((v2 - mu / r) * rx - rv * vx) / mu;
    var ey = ((v2 - mu / r) * ry - rv * vy) / mu;
    var e = Math.hypot(ex, ey);
    var eps = 0.5 * v2 - mu / r;                     // specific energy
    var p = (h * h) / mu;                            // semi-latus rectum
    // semi-major axis: a = p/(1−e²); for e→1 it diverges → Infinity (parabola).
    var oneMinusE2 = 1 - e * e;
    var a = Math.abs(oneMinusE2) < 1e-14 ? Infinity : p / oneMinusE2;
    // periapsis distance is always finite & meaningful; apoapsis only when bound.
    var peri = p / (1 + e);
    var apo = e < 1 - 1e-12 ? p / (1 - e) : Infinity; // "—" / escaped when e≥1
    // argument of periapsis (direction of the eccentricity vector). For a circle
    // (e≈0) the apse line is undefined; report 0 by convention.
    var omega = e < 1e-9 ? 0 : Math.atan2(ey, ex);
    // true anomaly ν: angle from periapsis to the current radius vector. Sign by
    // the radial velocity (rv>0 ⇒ outbound ⇒ ν in (0,π)).
    var nu;
    if (e < 1e-9) {
      nu = Math.atan2(ry, rx) - omega;
    } else {
      var cosNu = (ex * rx + ey * ry) / (e * r);
      cosNu = Math.max(-1, Math.min(1, cosNu));
      nu = Math.acos(cosNu);
      if (rv < 0) nu = -nu;
    }
    // period (bound orbits only): T = 2π·√(a³/μ).
    var T = (e < 1 - 1e-12 && a > 0 && isFinite(a)) ? 2 * Math.PI * Math.sqrt((a * a * a) / mu) : NaN;
    return {
      r: r, v: v, h: h, e: e, a: a, p: p,
      peri: peri, apo: apo, omega: omega, nu: nu,
      eps: eps, T: T, type: conicType(e), bound: eps < 0
    };
  }

  /* ── apply an instantaneous Δv impulse to a state vector ───────────────────
     `dir` is one of 'prograde' | 'retrograde' | 'radial-out' | 'radial-in'
     (or a free unit vector {ux,uy}). The kick adds dv (magnitude ≥ 0) along that
     direction at the craft's current point; position is unchanged (an impulse).
     Returns a NEW state {rx,ry,vx,vy}. Prograde = +velocity unit; radial-out =
     +position unit. Degenerate frames (v≈0 or r≈0) fall back gracefully. */
  function stateAfterKick(s, dv, dir, mu) {
    if (mu == null) mu = 1;
    var vmag = Math.hypot(s.vx, s.vy) || 0;
    var rmag = Math.hypot(s.rx, s.ry) || 0;
    var ux = 0, uy = 0;
    if (dir && typeof dir === 'object') {
      var dm = Math.hypot(dir.ux, dir.uy) || 1; ux = dir.ux / dm; uy = dir.uy / dm;
    } else if (dir === 'prograde' || dir === 'retrograde') {
      if (vmag > 1e-12) { ux = s.vx / vmag; uy = s.vy / vmag; }
      if (dir === 'retrograde') { ux = -ux; uy = -uy; }
    } else if (dir === 'radial-out' || dir === 'radial-in') {
      if (rmag > 1e-12) { ux = s.rx / rmag; uy = s.ry / rmag; }
      if (dir === 'radial-in') { ux = -ux; uy = -uy; }
    }
    var d = isFinite(dv) ? dv : 0;
    return { rx: s.rx, ry: s.ry, vx: s.vx + ux * d, vy: s.vy + uy * d };
  }

  /* ── gravitational acceleration at a position (inverse-square toward origin) ─ */
  function accel(rx, ry, mu) {
    var r2 = rx * rx + ry * ry;
    var r = Math.sqrt(r2);
    var f = -mu / (r2 * r);                          // −μ/r³ · r⃗
    return { ax: f * rx, ay: f * ry };
  }

  /* ── velocity-Verlet (a.k.a. leapfrog) step — the SYMPLECTIC integrator ─────
     One fixed-dt step of the two-body coast. Verlet is symplectic, so specific
     energy is conserved to O(dt²) with NO secular drift — this is what makes the
     coasting ship ride the analytic conic for many periods. Returns a NEW state. */
  function verletStep(s, mu, dt) {
    if (mu == null) mu = 1;
    var a0 = accel(s.rx, s.ry, mu);
    var rx = s.rx + s.vx * dt + 0.5 * a0.ax * dt * dt;
    var ry = s.ry + s.vy * dt + 0.5 * a0.ay * dt * dt;
    var a1 = accel(rx, ry, mu);
    var vx = s.vx + 0.5 * (a0.ax + a1.ax) * dt;
    var vy = s.vy + 0.5 * (a0.ay + a1.ay) * dt;
    return { rx: rx, ry: ry, vx: vx, vy: vy };
  }

  /* ── badStep — the NEGATIVE CONTROL: leaky explicit (forward) Euler ─────────
     Deliberately NON-symplectic. At the same dt on the same arc this DRIFTS the
     specific energy by orders of magnitude more than Verlet — the twin asserts
     this divergence so the conservation bound proves the integrator CHOICE, not a
     loose tolerance. Never used to drive the UI; it exists only to fail honestly. */
  function badStep(s, mu, dt) {
    if (mu == null) mu = 1;
    var a0 = accel(s.rx, s.ry, mu);
    var rx = s.rx + s.vx * dt;                       // position from OLD velocity
    var ry = s.ry + s.vy * dt;
    var vx = s.vx + a0.ax * dt;                      // velocity from OLD accel
    var vy = s.vy + a0.ay * dt;
    return { rx: rx, ry: ry, vx: vx, vy: vy };
  }

  /* ── helper: a circular-orbit state at radius r (speed √(μ/r), CCW) ────────
     Handy for seeding the launch rail's starter orbit and the test fixtures. */
  function circularState(r, mu, ccw) {
    if (mu == null) mu = 1;
    var vc = Math.sqrt(mu / r);
    var sign = ccw === false ? -1 : 1;
    return { rx: r, ry: 0, vx: 0, vy: sign * vc };
  }

  return {
    dvSpent: dvSpent,
    vEsc: vEsc,
    specificEnergy: specificEnergy,
    conicType: conicType,
    orbitFromState: orbitFromState,
    stateAfterKick: stateAfterKick,
    accel: accel,
    verletStep: verletStep,
    badStep: badStep,
    circularState: circularState
  };
})();
/* CORE END */

export const { dvSpent, vEsc, specificEnergy, conicType, orbitFromState,
  stateAfterKick, accel, verletStep, badStep, circularState } = AeroCore;
export default AeroCore;
