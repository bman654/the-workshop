/* ═══════════════════════════════════════════════════════════════════════════
   aerodrome/slingshot/slingshot-core.mjs — the thin gravity-assist core for
   The Slingshot (a THIRD room in the Aerodrome wing).

   This is NOT a copy of the flight core. It LEANS ON aerodrome/core.mjs (imported
   below, byte-clean) for the two-body propagator (verletStep) and orbitFromState,
   and adds only the closed-form PATCHED-CONIC gravity assist about a MOVING planet:

     • in the PLANET's frame the encounter is a pure hyperbolic deflection — the
       craft turns by an angle δ but its SPEED is unchanged (|v∞,in| === |v∞,out|).
     • in the SUN's frame that same turn ADDS the planet's velocity back differently
       on the way out than on the way in — so the heliocentric speed JUMPS. The
       energy is STOLEN from the planet's orbit (momentum-conserving), never conjured.

   The estate's name is staked on the page IMPORTING the SAME core the flight room
   uses — so this file is consumed as an ES module by both the page and the Node
   twin; there is NO inlining and therefore NO byte-parity sentinel (matches
   transfer-core.mjs exactly).

   CANONICAL UNITS: μ_planet is the planet's gravitational parameter (the UI passes
   a small value, the planet being a minor body relative to the Sun); speeds are in
   the same canonical units as the rest of the Aerodrome.

   The exact claims the twin (slingshot-core.test.mjs) asserts:
     1 — PLANET-FRAME INVARIANCE: |relIn| === |relOut| for every aim (a rotation).
     2 — EXACT ENERGY IDENTITY: |out|² − |vCraftIn|² === 2·vPlanet·(relOut − relIn),
         and the heliocentric |Δv| ceiling is 2·|vPlanet| (approached as v∞→|U|, δ→π).
     3 — NEGATIVE CONTROL: vPlanet=0 ⇒ |out| === |vCraftIn| EXACTLY (a still mass
         gives nothing; this guards the whole counter-intuition).
     4 — MOMENTUM-THEFT BALANCE: mCraft·Δv_craft + mPlanet·dU === 0 (vector).
     5 — DEFLECTION GEOMETRY / DUAL-TRUTH: sin(δ/2) === 1/e and e>1 (hyperbolic)
         closed-form; AND an integrated SOI flyby (AeroCore.verletStep) recovers the
         same asymptotic deflection, with O(dt²) convergence.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
import AeroCore from '../core.mjs';

/* ── deflection angle of a hyperbolic flyby ─────────────────────────────────
   For an impact parameter b, hyperbolic excess speed v∞, and planet gravitational
   parameter μ, the total turn of the velocity vector between the in- and out-
   asymptotes is
       δ = 2·atan(μ / (b·v∞²)) = 2·atan2(μ, b·v∞²).
   This is the standard result, derived from sin(δ/2)=1/e with e = √(1+(b·v∞²/μ)²):
       tan(δ/2) = 1/√(e²−1) = μ/(b·v∞²).
   Use the atan2 form — it is exact and well-conditioned for all b≥0, v∞>0, μ>0
   (verified correct to ~8e-15 against sin(δ/2)=1/e). The naive vis-viva-style
   e = 1 + b·v∞²/μ is the WRONG formula and is NOT used here. */
function deflection(b, vinf, mu) {
  if (!(isFinite(b) && isFinite(vinf) && isFinite(mu)) || b < 0 || vinf <= 0 || mu <= 0) return NaN;
  return 2 * Math.atan2(mu, b * vinf * vinf);
}

/* ── eccentricity of the flyby hyperbola ────────────────────────────────────
   e = √(1 + (b·v∞²/μ)²). Always > 1 for a real flyby (the craft is unbound about
   the planet during the encounter). The companion to deflection() — together they
   satisfy sin(δ/2) === 1/e exactly, which the twin cross-checks. */
function eccentricityOf(b, vinf, mu) {
  if (!(isFinite(b) && isFinite(vinf) && isFinite(mu)) || b < 0 || vinf <= 0 || mu <= 0) return NaN;
  var x = b * vinf * vinf / mu;
  return Math.sqrt(1 + x * x);
}

/* ── rotate a 2-D vector by angle θ (CCW positive) ─────────────────────────── */
function rot(v, theta) {
  var c = Math.cos(theta), s = Math.sin(theta);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function mag(v) { return Math.hypot(v.x, v.y); }
function dot(a, b) { return a.x * b.x + a.y * b.y; }
function scale(v, k) { return { x: v.x * k, y: v.y * k }; }

/* ── the patched-conic flyby: the heart of the room ─────────────────────────
   Given the craft's heliocentric inbound velocity vCraftIn and the planet's
   velocity vPlanet (both {x,y}), the impact parameter b, the planet's μ, and the
   pass `side` (+1 / −1, which way around the planet — leading vs trailing):

     relIn  = vCraftIn − vPlanet     (the velocity in the PLANET's frame, inbound)
     v∞     = |relIn|                (the hyperbolic excess speed; conserved)
     δ      = deflection(b, v∞, μ)   (the turn angle)
     relOut = rot(relIn, side·δ)     (the SAME speed, turned by ±δ)
     out    = relOut + vPlanet       (back to the SUN frame — the new heliocentric v)

   Returns {out, vinf, delta, e, relIn, relOut}. Pure, DOM-free. This is the
   analytic truth the page draws and the twin proves; the page additionally
   integrates the SOI passage to SHOW it, but never gates on the integration. */
function flybyOut(vCraftIn, vPlanet, b, mu, side) {
  var s = (side < 0) ? -1 : 1;
  var relIn = sub(vCraftIn, vPlanet);
  var vinf = mag(relIn);
  var delta = deflection(b, vinf, mu);
  var e = eccentricityOf(b, vinf, mu);
  var relOut = rot(relIn, s * delta);
  var out = add(relOut, vPlanet);
  return { out: out, vinf: vinf, delta: delta, e: e, relIn: relIn, relOut: relOut };
}

/* ── heliocentric gain: the speed the craft walks away with ─────────────────
   The signed change in heliocentric SPEED (|out| − |vCraftIn|) and the vector Δv.
   Positive |Δspeed| is a BOOST (energy stolen from the planet); negative is a
   BRAKE (energy donated to the planet). gainSign tags trailing(+1)/leading(−1)
   only as a convenience for the page's label. */
function heliocentricGain(vCraftIn, vPlanet, b, mu, side) {
  var f = flybyOut(vCraftIn, vPlanet, b, mu, side);
  var dv = sub(f.out, vCraftIn);
  var spIn = mag(vCraftIn), spOut = mag(f.out);
  return {
    out: f.out, vinf: f.vinf, delta: f.delta, e: f.e,
    dv: dv, dvMag: mag(dv),
    speedIn: spIn, speedOut: spOut, dSpeed: spOut - spIn,
    boost: spOut > spIn
  };
}

/* ── momentum-theft balance ─────────────────────────────────────────────────
   Conservation of momentum binds the craft's heliocentric velocity gain to the
   planet's velocity LOSS exactly:
       mCraft·Δv_craft + mPlanet·dU = 0   ⇒   dU = −(mCraft/mPlanet)·Δv_craft.
   The planet slows by |dU| — a real, tiny recoil. This returns the vector dU and
   the two momenta so the twin can assert they cancel to machine ε. dvCraft is the
   craft's heliocentric Δv vector (from heliocentricGain.dv). */
function momentumBalance(mCraft, mPlanet, dvCraft) {
  if (!(isFinite(mCraft) && isFinite(mPlanet)) || mCraft <= 0 || mPlanet <= 0) {
    return { dU: { x: NaN, y: NaN }, dpCraft: { x: NaN, y: NaN }, dpPlanet: { x: NaN, y: NaN } };
  }
  var dU = scale(dvCraft, -mCraft / mPlanet);
  var dpCraft = scale(dvCraft, mCraft);
  var dpPlanet = scale(dU, mPlanet);
  return { dU: dU, dpCraft: dpCraft, dpPlanet: dpPlanet };
}

export { deflection, eccentricityOf, flybyOut, heliocentricGain, momentumBalance };
export { AeroCore };
export default { deflection, eccentricityOf, flybyOut, heliocentricGain, momentumBalance, AeroCore };
