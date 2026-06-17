/* ═══════════════════════════════════════════════════════════════════════════
   aerodrome/slingshot/slingshot-core.test.mjs — the Node twin of the gravity-
   assist core.

   Run:  node aerodrome/slingshot/slingshot-core.test.mjs  → exit 0 GREEN if all hold.

   Proves the FIVE exact claims The Slingshot stakes its name on (claims 1–5 also
   run live as the in-page self-test pill):

     1 — PLANET-FRAME INVARIANCE. |relIn| === |relOut| for every aim across a
         seeded random aim-sweep (~2000 iters). The encounter is a pure rotation.
     2 — EXACT ENERGY IDENTITY. |out|² − |vCraftIn|² === 2·vPlanet·(relOut − relIn)
         to machine ε across the sweep — the heliocentric energy change is just the
         planet velocity dotted into the (rotated) relative-velocity change. AND the
         heliocentric |Δv| ceiling is 2·|vPlanet|, approached as v∞→|U|, δ→π.
     3 — NEGATIVE CONTROL (load-bearing). vPlanet=0 ⇒ |out| === |vCraftIn| EXACTLY
         for every aim. A still mass gives nothing; this guards the counter-intuition.
     4 — MOMENTUM-THEFT BALANCE. mCraft·Δv_craft + mPlanet·dU === 0 (vector). The
         planet's speed-shrink the player SEES === |dU|.
     5 — DEFLECTION GEOMETRY / DUAL-TRUTH (the GAP claim). (a) closed-form
         sin(δ/2) === 1/e to machine ε across the sweep, AND e>1 (hyperbolic)
         always. (b) integrate ONE representative SOI flyby with AeroCore.verletStep
         (two-body about the planet, fixed dt); the asymptotic deflection recovered
         from the integration matches the closed-form flybyOut deflection, with the
         error QUARTERING as dt halves (O(dt²) — print the ratio, ~4.00). Claims 1–4
         alone pass even with a garbage δ; only 5 catches a wrong deflection formula.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
import AeroCore from '../core.mjs';
import { deflection, eccentricityOf, flybyOut, heliocentricGain, momentumBalance } from './slingshot-core.mjs';

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.error('  ✗ ' + msg); } }
function near(a, b, tol, msg) { ok(Math.abs(a - b) < tol, msg + '  (|Δ|=' + Math.abs(a - b).toExponential(2) + ' < ' + tol + ')'); }

/* a tiny seeded PRNG (mulberry32) so the aim-sweep is deterministic & reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mag(v) { return Math.hypot(v.x, v.y); }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function dot(a, b) { return a.x * b.x + a.y * b.y; }

const MU = 0.06;   // a representative planet gravitational parameter

/* ── 1 — PLANET-FRAME INVARIANCE: |relIn| === |relOut| over a random aim-sweep ─ */
(function () {
  console.log('CLAIM 1 — planet-frame |relIn| === |relOut| (a pure rotation) over a 2000-aim sweep:');
  const rng = mulberry32(0x51a7);
  let worst = 0, n = 0;
  for (let i = 0; i < 2000; i++) {
    const vc = { x: (rng() - 0.5) * 2.4, y: (rng() - 0.5) * 2.4 };
    const vp = { x: (rng() - 0.5) * 1.6, y: (rng() - 0.5) * 1.6 };
    const b = 0.02 + rng() * 2.0;
    const side = rng() < 0.5 ? -1 : 1;
    const f = flybyOut(vc, vp, b, MU, side);
    worst = Math.max(worst, Math.abs(mag(f.relIn) - mag(f.relOut)));
    n++;
  }
  near(worst, 0, 1e-14, 'over ' + n + ' random aims, |relIn| === |relOut| (planet-frame speed conserved)');
})();

/* ── 2 — EXACT ENERGY IDENTITY + the 2|U| ceiling ───────────────────────────── */
(function () {
  console.log('CLAIM 2 — |out|²−|vCraftIn|² === 2·vPlanet·(relOut−relIn) to machine ε; |Δv| ≤ 2|vPlanet|:');
  const rng = mulberry32(0xbee5);
  let worst = 0;
  for (let i = 0; i < 2000; i++) {
    const vc = { x: (rng() - 0.5) * 2.4, y: (rng() - 0.5) * 2.4 };
    const vp = { x: (rng() - 0.5) * 1.6, y: (rng() - 0.5) * 1.6 };
    const b = 0.02 + rng() * 2.0;
    const side = rng() < 0.5 ? -1 : 1;
    const f = flybyOut(vc, vp, b, MU, side);
    const lhs = dot(f.out, f.out) - dot(vc, vc);
    const rhs = 2 * dot(vp, sub(f.relOut, f.relIn));
    worst = Math.max(worst, Math.abs(lhs - rhs));
  }
  near(worst, 0, 1e-14, 'the exact heliocentric energy identity holds across the sweep');

  // the 2|U| ceiling: the max heliocentric |Δv| over a deflection sweep ≤ 2|vPlanet|,
  // approached as v∞→|U| (so the whole relative velocity can be flipped, δ→π).
  const vp = { x: 1.0, y: 0 };
  const U = mag(vp);
  // craft inbound chosen so relIn is anti-parallel-ish to vPlanet with |relIn| ≈ |vPlanet|.
  // sweep b small→large (δ large→small) and confirm dv never exceeds 2|U|.
  let maxDv = 0, ceil = 2 * U;
  for (let i = 0; i < 4000; i++) {
    const b = 0.0005 + i * 0.0008;
    // pick relIn = U·(cosθ,sinθ) added to vp so the craft is moving; vary θ.
    const th = (i / 4000) * Math.PI * 2;
    const relIn = { x: U * Math.cos(th), y: U * Math.sin(th) };
    const vc = { x: vp.x + relIn.x, y: vp.y + relIn.y };
    const g = heliocentricGain(vc, vp, b, MU, 1);
    maxDv = Math.max(maxDv, g.dvMag);
  }
  ok(maxDv <= ceil + 1e-9, 'max heliocentric |Δv| ≤ 2|vPlanet| over the deflection sweep  (max=' + maxDv.toFixed(4) + ' ≤ ' + ceil.toFixed(4) + ')');
  // and it really APPROACHES the ceiling when v∞===|U| and b→0 (δ→π flips relIn).
  const bTiny = 1e-4;
  const relIn = { x: -U, y: 0 };                 // anti-parallel to vp, |relIn|=|U|
  const vc = { x: vp.x + relIn.x, y: vp.y + relIn.y };  // vc = 0 (craft momentarily still in sun frame)
  const gNear = heliocentricGain(vc, vp, bTiny, MU, 1);
  near(gNear.dvMag, ceil, 5e-3, 'with v∞=|U| and b→0 (δ→π) the |Δv| approaches the 2|vPlanet| ceiling');
})();

/* ── 3 — NEGATIVE CONTROL: a STATIONARY planet gives ZERO heliocentric gain ──── */
(function () {
  console.log('CLAIM 3 — vPlanet=0 ⇒ |out| === |vCraftIn| EXACTLY for every aim (a still mass gives nothing):');
  const rng = mulberry32(0x0dead);
  let worst = 0;
  const vp0 = { x: 0, y: 0 };
  for (let i = 0; i < 2000; i++) {
    const vc = { x: (rng() - 0.5) * 2.4, y: (rng() - 0.5) * 2.4 };
    const b = 0.02 + rng() * 2.0;
    const side = rng() < 0.5 ? -1 : 1;
    const f = flybyOut(vc, vp0, b, MU, side);
    worst = Math.max(worst, Math.abs(mag(f.out) - mag(vc)));
  }
  near(worst, 0, 1e-14, 'stationary planet ⇒ heliocentric speed unchanged for every aim (NO free energy)');
  // and the heliocentric Δv is a pure rotation of vc (its magnitude is conserved),
  // so dSpeed is exactly 0 — the gain comes ONLY from the planet's motion.
  const g = heliocentricGain({ x: 1.3, y: 0.4 }, vp0, 0.5, MU, 1);
  near(g.dSpeed, 0, 1e-14, 'heliocentricGain.dSpeed === 0 against a stationary planet');
})();

/* ── 4 — MOMENTUM-THEFT BALANCE: craft gain === planet loss (vector) ─────────── */
(function () {
  console.log('CLAIM 4 — mCraft·Δv_craft + mPlanet·dU === 0 (vector) to machine ε:');
  const rng = mulberry32(0x33aa);
  let worst = 0;
  for (let i = 0; i < 2000; i++) {
    const vc = { x: (rng() - 0.5) * 2.4, y: (rng() - 0.5) * 2.4 };
    const vp = { x: (rng() - 0.5) * 1.6, y: (rng() - 0.5) * 1.6 };
    const b = 0.02 + rng() * 2.0;
    const side = rng() < 0.5 ? -1 : 1;
    const mCraft = 0.5 + rng() * 3;
    const mPlanet = 1e3 + rng() * 9e3;
    const g = heliocentricGain(vc, vp, b, MU, side);
    const bal = momentumBalance(mCraft, mPlanet, g.dv);
    const sumx = mCraft * g.dv.x + mPlanet * bal.dU.x;
    const sumy = mCraft * g.dv.y + mPlanet * bal.dU.y;
    worst = Math.max(worst, Math.abs(sumx), Math.abs(sumy));
  }
  near(worst, 0, 1e-12, 'total momentum change is zero (craft gain === planet loss) across the sweep');
  // the planet's SEEN speed-shrink === |dU|: |vPlanet| − |vPlanet+dU| ≈ projection,
  // but the exact balance is the vector cancellation just asserted; here confirm dU
  // really points opposite the craft's Δv (the planet recoils).
  const g = heliocentricGain({ x: 1.4, y: 0.2 }, { x: 0.1, y: 0.9 }, 0.4, MU, 1);
  const bal = momentumBalance(2, 5000, g.dv);
  ok(dot(bal.dU, g.dv) < 0, 'the planet recoils OPPOSITE the craft Δv (dU·Δv_craft < 0)');
})();

/* ── 5 — DEFLECTION GEOMETRY / DUAL-TRUTH (the GAP claim) ─────────────────────── */
(function () {
  console.log('CLAIM 5 — (a) sin(δ/2)===1/e & e>1 closed-form; (b) integrated SOI flyby recovers δ, O(dt²):');

  // (a) closed-form: sin(δ/2) === 1/e exactly, and e>1 (hyperbolic) for every aim.
  const rng = mulberry32(0xc105ed);
  let worstSin = 0, everyHyper = true;
  for (let i = 0; i < 2000; i++) {
    const b = 0.02 + rng() * 2.0;
    const vinf = 0.1 + rng() * 2.0;
    const d = deflection(b, vinf, MU);
    const e = eccentricityOf(b, vinf, MU);
    worstSin = Math.max(worstSin, Math.abs(Math.sin(d / 2) - 1 / e));
    if (!(e > 1)) everyHyper = false;
  }
  near(worstSin, 0, 1e-14, 'sin(δ/2) === 1/e to machine ε across the (b,v∞) sweep');
  ok(everyHyper, 'e>1 (hyperbolic) for every aim — the craft is unbound about the planet');

  // guard: the WRONG formula e = 1 + b·v∞²/μ would break the sin(δ/2)=1/e identity.
  // Pick a STRONG-deflection regime (small b·v∞²/μ) where the two diverge sharply —
  // exactly the regime explorer C's off-by-0.8rad prototype got wrong.
  (function () {
    const b = 0.2, vinf = 0.4;
    const wrongE = 1 + b * vinf * vinf / MU;        // explorer C's off-by-0.8rad prototype
    const d = deflection(b, vinf, MU);
    ok(Math.abs(Math.sin(d / 2) - 1 / wrongE) > 0.1,
      'the WRONG e=1+b·v∞²/μ does NOT satisfy sin(δ/2)=1/e (the atan2 form is the right one)  (|Δ|=' +
      Math.abs(Math.sin(d / 2) - 1 / wrongE).toFixed(3) + ' > 0.1)');
  })();

  // (b) INTEGRATE one representative SOI flyby with verletStep (two-body about the
  // planet at the origin), measure the asymptotic deflection, and confirm it matches
  // the closed-form δ — with the error QUARTERING as dt halves (O(dt²)).
  //
  // Setup: place the craft far up-range on the incoming asymptote so that the
  // straight-line miss distance (impact parameter) is exactly b. The incoming
  // relative velocity is v∞ along +x; the asymptote is offset by b along ±y. We
  // integrate until the craft is far out the other side, then read the velocity
  // direction. The turn between in- and out-velocity is the deflection.
  const b = 0.45, vinf = 0.9;
  const closedDelta = deflection(b, vinf, MU);

  function integratedDelta(dt) {
    // Place the craft FAR up-range on the inbound asymptote: a straight line at
    // perpendicular distance b from the planet, with velocity (v∞,0). Starting at
    // x=−r0Far, y=b, v=(v∞,0), the planet (origin) sits exactly b from this line,
    // so b IS the impact parameter as r0Far→∞. We take r0Far VERY large so the
    // finite-distance asymptote error sits well BELOW the integrator's O(dt²)
    // truncation error across the whole dt sweep — otherwise that fixed floor (not
    // the truncation) would dominate and the ratio would NOT be 4. We then read the
    // velocity-direction turn at the far side: that turn IS the deflection.
    const r0Far = 200000;              // far enough that the asymptote floor ≪ dt² error
    let s = { rx: -r0Far, ry: b, vx: vinf, vy: 0 };
    const vIn = { x: vinf, y: 0 };
    let guard = 0;
    const maxSteps = Math.ceil((2 * r0Far / vinf) / dt) + 200000;
    while (s.rx < r0Far && guard++ < maxSteps) {
      s = AeroCore.verletStep(s, MU, dt);
    }
    const vOut = { x: s.vx, y: s.vy };
    // the turn angle between vIn and vOut (we compare magnitudes).
    const ang = Math.atan2(vIn.x * vOut.y - vIn.y * vOut.x, vIn.x * vOut.x + vIn.y * vOut.y);
    return Math.abs(ang);
  }

  // a coarsening sweep of dt staying in the asymptotic O(dt²) regime; the geometry
  // error (|integrated δ − closed δ|) must shrink ~4× each time dt halves.
  const dt1 = 0.08, dt2 = 0.04, dt3 = 0.02;
  const d1 = integratedDelta(dt1), d2 = integratedDelta(dt2), d3 = integratedDelta(dt3);
  const e1 = Math.abs(d1 - closedDelta), e2 = Math.abs(d2 - closedDelta), e3 = Math.abs(d3 - closedDelta);
  near(d3, closedDelta, 5e-3, 'integrated SOI flyby recovers the closed-form deflection δ  (δ=' + closedDelta.toFixed(4) + ', integ=' + d3.toFixed(4) + ')');
  const r1 = e1 / e2, r2 = e2 / e3;
  ok(r1 > 3.3 && r1 < 4.7 && r2 > 3.3 && r2 < 4.7,
    'deflection error QUARTERS as dt halves — O(dt²) convergence, not luck  (ratios ' +
    r1.toFixed(2) + ', ' + r2.toFixed(2) + ')');
})();

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) { console.error('\nslingshot core self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
console.log('\nslingshot core self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
