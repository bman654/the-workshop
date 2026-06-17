/* ════════════════════════════════════════════════════════════════════════════
   THE CONTRARY STONE — core.mjs · the physics authority (pure, DOM-free).

   A rattleback (celt / wobblestone) is a canoe-shaped rigid body whose PRINCIPAL
   inertia axes are slightly SKEWED from its geometric (hull) axes — nonzero
   products of inertia. That skew couples the spin (about the hull vertical) to the
   two rocking modes, and produces the celt's signature reversal — a rolling-contact
   instability:

     • spin it the FAVORED way → the rocking modes are DAMPED → it spins clean
     • spin it the WRONG way   → the rocking modes are ANTI-DAMPED → their amplitude
       GROWS, fed by the spin; the spin bleeds to zero, crosses it, and re-emerges
       spinning the FAVORED way; the rock then drains its energy BACK into spin.

   State  v = [n, A, B, sA, sB]:
     n      spin rate (about the hull vertical)            ← the spin you flick
     A, sA  pitch rock rate & amplitude (oscillator wp)    ← the belly see-saw
     B, sB  roll  rock rate & amplitude (oscillator wq≠wp) ← the side rock

   The rock effective damping is  γ = μ + ε·n :
     favored n>0 ⇒ γ>0 ⇒ rock decays (stable);  wrong n<0 ⇒ γ<0 ⇒ rock GROWS.
   ε is the products-of-inertia coupling — set continuously by the visible mass-axis
   SKEW ANGLE δ via  ε = K·sin(2δ)  (peaks at δ=45°, vanishes at δ=0 — a diagonal
   inertia tensor). The spin gives up EXACTLY the power the anti-damping injects into
   rock, so total rotational energy
        E = n² + A² + B² + wp²·sA² + wq²·sB²
   is conserved to machine ε in the frictionless (μ=0) idealisation — the reversal
   is genuine energy TRANSFER, never integrator leakage (the self-test pins it).
   ε = 0 (δ = 0, diagonal tensor) ⇒ no spin-dependence ⇒ NO reversal in either
   direction: the negative control. The SIGN of δ flips which spin sense is favored.
   (Mechanism: Walker 1979; Garcia & Hubbard 1988.)

   Imported byte-faithfully into the page (via forge:include) and by core.test.mjs.
   ════════════════════════════════════════════════════════════════════════════ */

// The coupling strength as a function of the visible mass-axis skew angle δ (radians).
// ε = K·sin(2δ): zero at δ=0 (diagonal tensor → negative control), maximal at δ=45°,
// and SIGN-FLIPPING with δ — a left-skewed stone favors the opposite spin sense.
export const K_SKEW = 0.9;
export function epsOfSkew(deltaRad) { return K_SKEW * Math.sin(2 * deltaRad); }
export function epsOfSkewDeg(deltaDeg) { return epsOfSkew(deltaDeg * Math.PI / 180); }

// The FAVORED spin sign for a given coupling ε. dn = ε·(A²+0.78B²) ≥ 0 when ε>0, so
// a positive ε drives n UP toward +1 (favored = +1); a negative ε (δ<0) favors −1.
// ε = 0 (diagonal) has NO favored sign — neither launch reverses (returns 0).
export function favoredSign(eps) { return eps === 0 ? 0 : Math.sign(eps); }

// Derivative of v = [n, A, B, sA, sB].  p = { eps, wp, wq, mu }.
export function deriv(v, p) {
  const [n, A, B, sA, sB] = v;
  const { eps, wp, wq, mu } = p;
  // spin-dependent effective rock (anti-)damping — the skew coupling ε:
  const gA = mu + eps * n;          // pitch mode damping
  const gB = mu + eps * n * 0.78;   // roll mode (skew: the two channels are unequal)
  const dsA = A, dA = -wp * wp * sA - gA * A;
  const dsB = B, dB = -wq * wq * sB - gB * B;
  // Energy bookkeeping: the ε-channel moves power -(ε·n)(A² + 0.78·B²) into rock;
  // the spin supplies it (n·dn = -that), so dn = ε·(A² + 0.78·B²). The spin factor
  // n CANCELS — no division at the reversal point. With ε>0, dn ≥ 0: a wrong-way
  // (negative) spin is driven UP through zero into the favored sign; a clean favored
  // spin (whose rock has decayed) sees dn→0 and holds.
  const dn = eps * (A * A + 0.78 * B * B);
  return [dn, dA, dB, dsA, dsB];
}

// Total rotational energy — the conserved quadratic when μ=0.
export function energy(v, p) {
  const [n, A, B, sA, sB] = v;
  const wp = p ? p.wp : 1, wq = p ? p.wq : 1;
  return n * n + A * A + B * B + wp * wp * sA * sA + wq * wq * sB * sB;
}

// Split energy into the SPIN part and the ROCK part (what the two bars show).
export function energySplit(v, p) {
  const [n, A, B, sA, sB] = v;
  const wp = p ? p.wp : 1, wq = p ? p.wq : 1;
  const spin = n * n;
  const rock = A * A + B * B + wp * wp * sA * sA + wq * wq * sB * sB;
  return { spin, rock, total: spin + rock };
}

// One classical RK4 step of size h. RK4 has tiny, BOUNDED energy error for a small
// fixed h on this smooth field, so a "reversal" can never be integrator energy
// injection — the self-test pins the drift bound (the Clack-Counter lesson).
export function rk4Step(v, h, p) {
  const add = (u, w, s) => u.map((ui, i) => ui + s * w[i]);
  const k1 = deriv(v, p);
  const k2 = deriv(add(v, k1, h / 2), p);
  const k3 = deriv(add(v, k2, h / 2), p);
  const k4 = deriv(add(v, k3, h), p);
  return v.map((vi, i) => vi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// Integrate from v0 for `steps` steps of size h, returning the final state + the
// worst |E - E0| seen (the conservation guard, tracked only in the frictionless case).
export function integrate(v0, h, steps, p) {
  let v = v0.slice();
  const E0 = energy(v, p);
  let maxDrift = 0;
  for (let i = 0; i < steps; i++) {
    v = rk4Step(v, h, p);
    if (p.mu === 0) maxDrift = Math.max(maxDrift, Math.abs(energy(v, p) - E0));
  }
  return { v, maxDrift, E0, E1: energy(v, p) };
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST (the Node twin runs the SAME code; the browser pill calls it).
   Proves the claims; energy to machine ε. Designed to catch C's exact failure
   mode: it asserts the FINAL sign(n) is the single favored sign for BOTH launches
   (NOT merely "crossed zero once"), integrating long enough that a transient slosh
   that re-crosses would be caught — a reversal must SETTLE, not flicker.
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest() {
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };

  const h = 0.003, N = 240000;            // small fixed dt, long enough to SETTLE
  const seed = [0, 0, 0, 0.08, 0];        // pure-spin launch + a tiny seed pitch
  const w0 = 1.0;
  const launch = (sign, P) => integrate([sign * w0, ...seed.slice(1)], h, N, P).v;

  // The default favored skew: δ = +20° ⇒ ε = K·sin(40°) > 0 ⇒ favored sign = +1.
  const epsFav = epsOfSkewDeg(20);
  const FAV = favoredSign(epsFav);
  ok(FAV === +1, `δ=+20° gives a positive coupling, favored sign +1 (eps ${epsFav.toFixed(3)})`);

  // (1) BOTH launch signs END at the favored sign — the wrong-way one reverses and
  //     SETTLES there; the favored one never leaves. (NOT "crossed once" — FINAL sign.)
  const P = { eps: epsFav, wp: 1.0, wq: 1.7, mu: 0.02 };
  const fav = launch(+1, P), wrong = launch(-1, P);
  ok(Math.sign(fav[0]) === FAV, `favored launch ENDS at favored sign (got ${fav[0].toFixed(4)})`);
  ok(Math.sign(wrong[0]) === FAV, `WRONG launch reverses AND settles at favored sign (got ${wrong[0].toFixed(4)})`);
  ok(Math.abs(wrong[0]) > 0.5, `the reversed spin is robust, not a near-zero flicker (|n|=${Math.abs(wrong[0]).toFixed(3)})`);

  // (2) NEGATIVE CONTROL: diagonal tensor (δ=0 ⇒ ε=0) — NO reversal in EITHER direction;
  //     EACH launch keeps its OWN sign, both ways.
  const Pdiag = { eps: 0, wp: 1.0, wq: 1.7, mu: 0 };
  const dPos = launch(+1, Pdiag), dNeg = launch(-1, Pdiag);
  ok(Math.sign(dPos[0]) === +1, `diagonal: +spin stays + (no reversal)  (got ${dPos[0].toFixed(4)})`);
  ok(Math.sign(dNeg[0]) === -1, `diagonal: -spin stays - (no reversal)  (got ${dNeg[0].toFixed(4)})`);

  // (3) ENERGY conserved to machine ε (frictionless) — the reversal is real TRANSFER,
  //     not integrator injection. (The non-drift guard; drift shrinks with dt.)
  const Pf = { eps: epsFav, wp: 1.0, wq: 1.7, mu: 0 };
  const run = integrate([-w0, ...seed.slice(1)], h, N, Pf);   // the reversing run
  const relDrift = run.maxDrift / run.E0;
  ok(relDrift < 1e-9, `energy conserved on the reversing run (rel drift ${relDrift.toExponential(2)} < 1e-9)`);
  ok(Math.sign(run.v[0]) === FAV, `frictionless wrong-way still reverses to favored  (got ${run.v[0].toFixed(4)})`);
  const runD = integrate([-w0, ...seed.slice(1)], h, N, Pdiag);
  ok(runD.maxDrift / runD.E0 < 1e-9, `energy conserved (diagonal)  (rel drift ${(runD.maxDrift / runD.E0).toExponential(2)})`);

  // (4) DAMPED ATTRACTOR: the favored state is a true basin — the wrong launch lands
  //     favored with the rock fully died out (it settled, did not keep sloshing).
  ok(Math.abs(wrong[1]) < 0.1 && Math.abs(wrong[2]) < 0.1, `damped: rock died out after reversal (true attractor)`);
  ok(Math.abs(fav[1]) < 0.05 && Math.abs(fav[2]) < 0.05, `damped favored: rock never grew`);

  // (5) δ-SIGN FLIPS the favored sign — the asymmetry IS the skew, not a numeric bias.
  //     A left-skewed stone (δ<0 ⇒ ε<0) favors −1, and BOTH its launches settle there.
  const epsL = epsOfSkewDeg(-20);
  ok(favoredSign(epsL) === -1, `δ=-20° flips the favored sign to -1 (eps ${epsL.toFixed(3)})`);
  const PL = { eps: epsL, wp: 1.0, wq: 1.7, mu: 0.02 };
  const favL = launch(-1, PL), wrongL = launch(+1, PL);
  ok(Math.sign(favL[0]) === -1 && Math.sign(wrongL[0]) === -1,
     `left-skew: BOTH launches settle at the flipped favored sign -1  (${favL[0].toFixed(3)}, ${wrongL[0].toFixed(3)})`);

  return { pass, fail, log };
}
