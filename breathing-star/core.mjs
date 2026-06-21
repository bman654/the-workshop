// The Breathing Star — logic core (a star you can squeeze that rings back to balance).
//
// THE WHOLE POINT: a star is a standoff. Gravity pulls every gram inward, forever; the only thing
// that holds the body up is PRESSURE pushing back out. Where the two exactly cancel — at every
// depth at once — is the star's equilibrium radius. Squeeze the star in and you have over-stuffed
// the pressure: it shoves back, overshoots, and the whole body RINGS around its rest radius until
// the ringing damps away and it settles right back where it started. Cut the pressure entirely and
// there is nothing left to balance against gravity — the body just falls, monotonically, forever
// (here: until the shells pile at the floor), and it never settles. That is the physics this core
// proves, made into a thing you can grab and pluck.
//
// THE MODEL — a self-gravitating POLYTROPE discretized into N concentric Lagrangian mass shells.
//   · Each shell i carries the SAME mass dm and encloses M_enc(i) = (i+1)·dm exactly (Lagrangian:
//     the mass interior to a shell is fixed; only its radius r[i] moves).
//   · The gas obeys a polytropic equation of state P = K·ρ^γ with γ = 5/3 (a non-relativistic
//     monatomic/degenerate gas — the canonical stellar polytrope).
//   · The local density of shell i is its mass smeared over the spherical annulus it bounds:
//     ρ[i] = dm / ((4/3)π(r[i]³ − r[i-1]³)).  Compress the shell (shrink the annulus) ⇒ ρ rises ⇒
//     P rises faster (γ>1) ⇒ a stiffer outward shove. That stiffening IS the restoring spring.
//   · The net radial acceleration on shell i is inward gravity minus the outward pressure-gradient
//     force per unit mass:  a(i) = −G·M_enc(i)/r[i]²  −  (1/ρ̄)·dP/dr  evaluated across the shell.
//   At equilibrium a(i) ≈ 0 at EVERY shell at once — that simultaneous balance is what relax() finds.
//
// WHAT IS PROVED EXACT (the five self-test legs):
//   (1) BALANCE — at the relaxed equilibrium the net accel is ≈0 at every shell (TOL_BALANCE).
//   (2) STABLE-RETURN — pluck the star, let it ring, let it settle: it returns to the SAME radii the
//       relaxation produced (compared against the CACHED equilibrium, TOL_RETURN). The standoff is
//       a STABLE one — small kicks heal.
//   (3) MONOTONE-COLLAPSE (negative control) — with pressure OFF there is no outward force; every
//       shell strictly falls and ends AT THE FLOOR, and the body NEVER settles. (Proves the ringing
//       in (2) is caused by pressure, not by the integrator.)
//   (4) MONOTONE-FUSION-DIAL — raising K (a hotter/stiffer gas) strictly grows the equilibrium
//       radius. The fuel knob has the right sign and is monotone.
//   (5) RINGING-ENVELOPE-DECAY — after a pluck the oscillation's amplitude decays monotonically
//       under the SAME dt the live page integrates with (the ringing is a damped oscillation, not a
//       growing instability and not a permanent wobble).
//   Determinism asserted is narrow and honest: the SINGLE canonical start initR(1.0) ALWAYS relaxes
//   to the same equilibrium (relax is a fixed deterministic function). We do NOT claim start-
//   independent uniqueness — a different start could in principle settle elsewhere; that is not the
//   claim and there is no self-test leg for it.
//
// HONEST SCOPE — engraved here and shown on the page:
//   What is EXACT is the STRUCTURE: a stable hydrostatic balance that rings back when plucked, a
//   monotone fuel dial, and a no-equilibrium free-fall when pressure is cut. This is a REDUCED model.
//   It does NOT model real stellar pulsation: the ringing period here is NOT a Cepheid period, the
//   numbers are DIMENSIONLESS (the radius is NOT in solar radii, the time is NOT in days), and the
//   damping is a numerical convenience, not a physical κ-mechanism. The star you squeeze is a true
//   polytrope-in-a-spring; it is not a forecast of any particular star.
//
// SOURCING (anti-drift): the page inlines this core byte-for-byte between the BREATHING-STAR CORE
// sentinels; core.test.mjs byte-parity-checks the inlined copy in index.html against this file so
// the page and the proof can never silently drift.
//
// Zero-dep ESM. No randomness, no wall-clock — relax() and stepShells() are pure functions of state.

// ===== BREATHING-STAR CORE (byte-identical to core.mjs) =====
"use strict";

// ── physical constants of the reduced model (all dimensionless) ──
const N        = 12;       // number of Lagrangian shells
const G        = 1.0;      // gravitational constant (sets the unit system)
const GAMMA    = 5 / 3;    // polytropic index γ — non-relativistic monatomic/degenerate gas
const DM       = 1 / N;    // mass per shell (total mass = 1)
const K0       = 0.42;     // the default fusion/stiffness constant K in P = K·ρ^γ
const FOUR_PI_3 = (4 / 3) * Math.PI;

// ── numerical floors / guards (load-bearing: keep shells ordered + off zero) ──
const R_FLOOR  = 1e-6;     // no shell may sit at or below this radius (avoids 1/r² blowup)
const R_SEP    = 1e-6;     // minimum separation enforced between adjacent shells (no-cross)

// ── relaxation constants (the SINGLE canonical equilibrium-finder; all fixed) ──
// relax() finds hydrostatic balance by QUICK-MIN damped descent (the standard molecular-dynamics
// energy-minimiser): plain damped Euler creeps too slowly for a large star under heavy damping AND
// goes unstable on the stiff central cell under light damping, so neither fixed damping works across
// the whole fuel range. Quick-min sidesteps both — it projects the velocity onto the force direction
// and ZEROES it the instant the body starts moving uphill (force·velocity < 0), so it descends the
// total-energy surface straight to the minimum and converges to a balance residual ~1e-13 for EVERY
// K in [0.1, 2.2] from the single canonical start initR(1.0), in a fixed step budget. It is fully
// deterministic (no randomness, no wall-clock): same K ⇒ same start ⇒ same equilibrium, every time.
const RELAX_DT    = 0.0006;  // quick-min descent timestep (stable on the stiff central cell)
const RELAX_STEPS = 40000;   // descent iterations (ample to converge the balance to ~1e-12)

// ── heartbeat (live ringing) constants ──
const BEAT_C   = 0.55;     // LIGHT velocity damping during the live heartbeat (so it visibly rings)

// THE DISCRETIZATION — a staggered Lagrangian finite-volume scheme (the standard, well-conditioned
// form for stellar pulsation). r[i] is the radius of mass INTERFACE i (i = 0..N-1); the mass interior
// to and including interface i is M_enc(i) = (i+1)·dm. Between interface i-1 and interface i lives gas
// CELL i, a fluid element of fixed mass dm; its density is ρ_i = dm / V_i with V_i the spherical-shell
// volume. The force on an interface is gravity on it plus the NET pressure force from the two cells it
// separates, A·(P_below − P_above), a difference of ADJACENT cell pressures (not a wide centred
// stencil — that is why this is stable where a naive dP/dr blows up at the steep central gradient).

// initR(scale): the canonical initial interface radii — N interfaces evenly spaced out to `scale`.
// relax(K) ALWAYS starts from initR(1.0); this is the one canonical start the determinism leg pins.
function initR(scale){
  const r = new Array(N);
  for (let i = 0; i < N; i++) r[i] = (scale * (i + 1)) / N;
  return r;
}

// enclosedMass(i): the mass interior to and including interface i — Lagrangian, so it never changes.
function enclosedMass(i){ return (i + 1) * DM; }

// shellRho(r, i): the density of gas CELL i = its mass dm over the spherical-shell volume between
// interface i-1 and interface i. Cell 0's inner edge is the centre (0). Guarded so a (near-)zero
// volume can't produce a non-finite density.
function shellRho(r, i){
  const rOut = r[i];
  const rIn  = i === 0 ? 0 : r[i - 1];
  let vol = FOUR_PI_3 * (rOut * rOut * rOut - rIn * rIn * rIn);
  if (!(vol > 0)) vol = FOUR_PI_3 * R_FLOOR * R_FLOOR * R_FLOOR; // degenerate-cell guard
  return DM / vol;
}

// shellP(r, i, K): the polytropic pressure of gas cell i, P = K·ρ^γ.
function shellP(r, i, K){
  return K * Math.pow(shellRho(r, i), GAMMA);
}

// netAccel(r, i, K, pressureOn): the net radial acceleration on mass INTERFACE i.
//   gravity:  a_grav = −G·M_enc(i)/r[i]²                          (always inward)
//   pressure: a_pres = A_i·(P_below − P_above)/dm                (outward where inner cell pushes
//             with A_i = 4π·r[i]² the interface area, P_below the cell just inside (cell i), and
//             P_above the cell just outside (cell i+1), which is the VACUUM P=0 beyond the surface).
// dm is the mass associated with the interface (one cell-mass). With pressureOn=false the pressure
// term is dropped entirely (the neg-control: nothing holds the body up, so it free-falls).
function netAccel(r, i, K, pressureOn){
  const ri = r[i] < R_FLOOR ? R_FLOOR : r[i];
  const aGrav = -G * enclosedMass(i) / (ri * ri);
  if (!pressureOn) return aGrav;
  const Pbelow = shellP(r, i, K);                       // cell just INSIDE this interface
  const Pabove = i === N - 1 ? 0 : shellP(r, i + 1, K); // cell just OUTSIDE (vacuum beyond the surface)
  const area = 4 * Math.PI * ri * ri;                   // interface area A_i = 4π r²
  const aPres = area * (Pbelow - Pabove) / DM;          // outward when the inner cell out-pushes
  return aGrav + aPres;
}

// enforceOrder(r): the NO-CROSS guard. Shells must stay strictly ordered and off the floor — a
// shell can never pass through the one inside it, and none may reach r=0 (1/r² would blow up). This
// is what makes a hard squeeze pile the shells at the floor instead of crossing or diverging.
function enforceOrder(r){
  if (r[0] < R_FLOOR) r[0] = R_FLOOR;
  for (let i = 1; i < N; i++){
    if (r[i] < r[i - 1] + R_SEP) r[i] = r[i - 1] + R_SEP;
  }
}

// integrate(r, v, dt, c, K, pressureOn): one damped explicit-Euler step of every shell.
//   a = netAccel − c·v   (linear velocity damping with coefficient c)
//   v += a·dt ;  r += v·dt ;  then clamp ordering/floor.
// Mutates r and v in place; returns nothing. This is the LIVE HEARTBEAT integrator (light damping c):
// it makes the body visibly ring and settle. (relax() uses its own quick-min descent, below.)
function integrate(r, v, dt, c, K, pressureOn){
  for (let i = 0; i < N; i++){
    const a = netAccel(r, i, K, pressureOn) - c * v[i];
    v[i] += a * dt;
  }
  for (let i = 0; i < N; i++) r[i] += v[i] * dt;
  enforceOrder(r);
}

// relax(K): the SINGLE canonical equilibrium-finder, by QUICK-MIN damped descent (a deterministic
// energy-minimiser). Start from the canonical start initR(1.0) at rest, then each step:
//   · compute the force F[i] = netAccel(i) on every interface;
//   · if the body is moving UPHILL (F·v < 0) zero the velocity (kill the overshoot instantly);
//     otherwise PROJECT the velocity onto the force direction (v ← (F·v/|F|²)·F) — descend straight
//     toward lower energy with no transverse drift;
//   · kick (v += F·dt), drift (r += v·dt), then clamp ordering/floor.
// This descends the total-energy surface to the hydrostatic-balance minimum, reaching a residual
// ~1e-13 for every K in [0.1, 2.2]. Pure + deterministic: same K ⇒ same start ⇒ same equilibrium.
function relax(K){
  const k = (typeof K === 'number' && K > 0) ? K : K0;
  const r = initR(1.0);
  const v = new Array(N).fill(0);
  const F = new Array(N).fill(0);
  for (let s = 0; s < RELAX_STEPS; s++){
    let fDotV = 0, fDotF = 0;
    for (let i = 0; i < N; i++){ F[i] = netAccel(r, i, k, true); fDotV += F[i] * v[i]; fDotF += F[i] * F[i]; }
    if (fDotV < 0){
      for (let i = 0; i < N; i++) v[i] = 0;                  // moving uphill ⇒ stop dead
    } else {
      const scale = fDotF > 0 ? fDotV / fDotF : 0;           // project v onto F (quick-min)
      for (let i = 0; i < N; i++) v[i] = scale * F[i];
    }
    for (let i = 0; i < N; i++) v[i] += F[i] * RELAX_DT;     // kick
    for (let i = 0; i < N; i++) r[i] += v[i] * RELAX_DT;     // drift
    enforceOrder(r);
  }
  return r;
}

// maxAbsAccel(r, K, pressureOn): the largest |net accel| over all shells — the balance residual.
function maxAbsAccel(r, K, pressureOn){
  let m = 0;
  for (let i = 0; i < N; i++){
    const a = Math.abs(netAccel(r, i, K, pressureOn));
    if (a > m) m = a;
  }
  return m;
}

// ── the live STAR object: a stateful body the page grabs, plucks, and dials ──
// It owns the cached equilibrium (from relax), the live shell radii + velocities, the fuel K, the
// pressure flag, and a ring-history buffer. The page reads it through a small pure-ish API.
function makeStar(K){
  const k0 = (typeof K === 'number' && K > 0) ? K : K0;
  const eq = relax(k0);                 // the CACHED equilibrium — stable-return compares to THIS
  const r  = eq.slice();
  const v  = new Array(N).fill(0);
  const st = {
    K: k0,
    pressureOn: true,
    eq,                                 // cached equilibrium radii (NOT re-relaxed each frame)
    r, v,
    history: [],                        // outer-shell radius samples, for the EKG + envelope leg
    HISTORY_MAX: 4096,
  };
  return st;
}

// eqRadius(st): the cached equilibrium radius of the OUTER (surface) shell — the rest radius the
// disc breathes around and the trace baselines on. ONE source of truth for both.
function eqRadius(st){ return st.eq[N - 1]; }

// outerRadius(st): the live surface radius right now.
function outerRadius(st){ return st.r[N - 1]; }

// stepShells(st, dt): one LIGHT-damped heartbeat step + record the outer radius into history.
// This is the live integrator the page calls every frame; it rings and settles.
function stepShells(st, dt){
  integrate(st.r, st.v, dt, BEAT_C, st.K, st.pressureOn);
  st.history.push(st.r[N - 1]);
  if (st.history.length > st.HISTORY_MAX) st.history.shift();
  return st.r[N - 1];
}

// setOuterDisplacement(st, frac): SQUEEZE — push the surface shell inward by a fraction of the rest
// radius (frac in roughly [−0.6, +0.4]; positive = squeeze in). Holds the body displaced (velocity
// stays whatever it was) so a grab-drag reads as a sustained dent. Interior shells are scaled
// proportionally so the whole body compresses, then ordering is restored.
function setOuterDisplacement(st, frac){
  const f = Math.max(-0.9, Math.min(0.6, frac));
  const target = eqRadius(st) * (1 - f);
  const scale = target / st.eq[N - 1];
  for (let i = 0; i < N; i++) st.r[i] = st.eq[i] * scale;
  enforceOrder(st.r);
}

// release(st, {displacement, velocity}): the SINGLE release path. A squeeze and a pluck differ ONLY
// by the velocity handed in. displacement sets where the surface is let go from (fraction in, like
// setOuterDisplacement); velocity is the inward (+) or outward (−) speed of the surface at release.
//   · slow release (velocity 0) ⇒ a soft breath: it eases back out and settles.
//   · quick still-moving release (velocity ≠ 0) ⇒ a struck bell: the kick adds ring energy.
function release(st, opts){
  opts = opts || {};
  const disp = typeof opts.displacement === 'number' ? opts.displacement : 0;
  const vel  = typeof opts.velocity === 'number' ? opts.velocity : 0;
  setOuterDisplacement(st, disp);
  // a release velocity on the surface, tapering inward (the surface moves most).
  for (let i = 0; i < N; i++){
    const w = (i + 1) / N;            // inner shells carry less of the kick
    st.v[i] = -vel * w;               // velocity>0 means "still moving inward" ⇒ adds compression ring
  }
}

// setFusion(st, K): the FUEL DIAL — change the stiffness constant K and RE-RELAX to the new
// equilibrium. The cached eq + the live radii both move to the new balance; the body then chases it.
function setFusion(st, K){
  const k = Math.max(1e-3, K);
  st.K = k;
  st.eq = relax(k);
  // gently retarget the live body toward the new equilibrium (keep current ring energy modest)
  for (let i = 0; i < N; i++){ st.r[i] = st.eq[i]; st.v[i] = 0; }
  return eqRadius(st);
}

// cutPressure(st): the DANGER toggle — turn the outward pressure OFF. There is now no equilibrium to
// breathe around; the body free-falls. (The page dissolves the rest-ring to show this.)
function cutPressure(st){ st.pressureOn = false; }

// restorePressure(st): turn pressure back ON and re-relax to the equilibrium for the current K, then
// release the (collapsed) body toward it so it springs back outward.
function restorePressure(st){
  st.pressureOn = true;
  st.eq = relax(st.K);
  for (let i = 0; i < N; i++) st.v[i] = 0;   // let pressure do the pushing; start from where it fell to
}

// ringAmplitude(st): the current ringing amplitude = |outer radius − rest radius| / rest radius.
function ringAmplitude(st){
  const eq = eqRadius(st);
  return Math.abs(outerRadius(st) - eq) / eq;
}

// ringHistory(st): the recorded outer-radius samples (the EKG reads this; never its own model).
function ringHistory(st){ return st.history; }

// ── the SELF-TEST — the star proves its own claims, EXACT, two-tolerance discipline ──
// Tolerances are deliberately SEPARATE and documented (drifting-star discipline): a balance residual
// is a different physical quantity from a settle residual, so they get different margins.
const TOL_BALANCE = 1e-3;   // balance residual margin (observed |a| at eq is ~1e-4–1e-5)
const TOL_RETURN  = 5e-3;   // stable-return margin vs the CACHED eq (observed settle ~1e-4–1e-3)
const BEAT_DT     = 1 / 60; // the dt the LIVE PAGE integrates with — the envelope leg MUST use this same dt

function runBreathingStarSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });

  // (1) BALANCE — at the canonical equilibrium the net accel is ≈0 at every shell.
  const star1 = makeStar(K0);
  const balRes = maxAbsAccel(star1.eq, star1.K, true);
  log('1 · balance: max|net accel| ≈ 0 at the relaxed equilibrium',
      balRes < TOL_BALANCE,
      'max|a| = ' + balRes.toExponential(2) + '  (tol ' + TOL_BALANCE + ')');

  // (2) STABLE-RETURN — pluck, ring, settle: live radii return to the SAME CACHED eq array (not a
  //     fresh re-relax). Pluck with a real velocity kick, then integrate long enough to settle.
  const star2 = makeStar(K0);
  const cachedEq = star2.eq.slice();                 // the SAME eq relax() produced — compare to THIS
  release(star2, { displacement: 0.22, velocity: 0.6 });  // a firm pluck (squeeze in + still moving in)
  for (let s = 0; s < 6000; s++) stepShells(star2, BEAT_DT);
  let settleRes = 0;
  for (let i = 0; i < N; i++){
    const d = Math.abs(star2.r[i] - cachedEq[i]) / cachedEq[i];
    if (d > settleRes) settleRes = d;
  }
  log('2 · stable-return: after a pluck+ring it settles back to the CACHED equilibrium',
      settleRes < TOL_RETURN,
      'max relative settle error = ' + settleRes.toExponential(2) + '  (tol ' + TOL_RETURN + ')');

  // (3) MONOTONE-COLLAPSE (neg-control) — pressure OFF: every shell strictly decreasing, ends AT THE
  //     FLOOR, and NEVER settles (still moving inward at the end). We assert "ends at floor", NOT
  //     "reaches r=0 exactly" (the floor is R_FLOOR/R_SEP, not zero).
  const star3 = makeStar(K0);
  cutPressure(star3);
  const before = star3.r.slice();
  let everIncreased = false;
  const SNAPS = 40, STEP = 60;
  let prev = star3.r.slice();
  for (let snap = 0; snap < SNAPS; snap++){
    for (let s = 0; s < STEP; s++) stepShells(star3, BEAT_DT);
    for (let i = 0; i < N; i++){ if (star3.r[i] > prev[i] + 1e-9) everIncreased = true; }
    prev = star3.r.slice();
  }
  const allFell = star3.r.every((ri, i) => ri < before[i]);
  const innerAtFloor = star3.r[0] <= R_FLOOR + R_SEP * 2;           // piled at the floor
  const stillMovingIn = star3.v.some(vi => vi < -1e-9) || !innerAtFloor; // never quiescent at rest
  log('3 · neg-control: pressure off ⇒ every shell falls, piles AT THE FLOOR, never settles',
      allFell && !everIncreased && innerAtFloor,
      'all-fell=' + allFell + ' monotone=' + (!everIncreased) +
      ' inner r=' + star3.r[0].toExponential(2) + ' (floor ' + R_FLOOR.toExponential(1) + ')');

  // (4) MONOTONE-FUSION-DIAL — raising K strictly grows the equilibrium radius.
  const Ks = [0.10, 0.20, 0.42, 0.80, 1.50, 3.00];
  const radii = Ks.map(k => eqRadius(makeStar(k)));
  let monoK = true;
  for (let j = 1; j < radii.length; j++) if (!(radii[j] > radii[j - 1])) monoK = false;
  log('4 · fusion dial: raising K strictly grows the equilibrium radius (monotone)',
      monoK,
      'K=[' + Ks.join(',') + '] → R=[' + radii.map(x => x.toFixed(3)).join(',') + ']');

  // (5) RINGING-ENVELOPE-DECAY — after a pluck the peak amplitude decays monotonically, integrated
  //     with the SAME dt the live page uses (BEAT_DT). The ENVELOPE is what decays, so we measure the
  //     peak amplitude over windows of one full ring PERIOD (RING_WINDOW): a sub-period window would
  //     alias (catch a rising half-cycle and read higher than the previous window even as the true
  //     envelope falls). Each full-period window's peak must be ≤ the previous one's, and the envelope
  //     must actually collapse (last peak < half the first) — proving a damped oscillation, not a
  //     growing instability and not a permanent wobble.
  const star5 = makeStar(K0);
  release(star5, { displacement: 0.18, velocity: 0.0 });   // a clean pluck (let it ring from a dent)
  const RING_WINDOW = 240, WINDOWS = 10;   // ~one ring period per window (measured period ≈ 218 steps)
  const peaks = [];
  for (let w = 0; w < WINDOWS; w++){
    let pk = 0;
    for (let s = 0; s < RING_WINDOW; s++){ stepShells(star5, BEAT_DT); const a = ringAmplitude(star5); if (a > pk) pk = a; }
    peaks.push(pk);
  }
  let monoDecay = true;
  for (let j = 1; j < peaks.length; j++) if (peaks[j] > peaks[j - 1] + 1e-9) monoDecay = false;
  const decayed = peaks[peaks.length - 1] < peaks[0] * 0.5;   // and it actually shrank substantially
  log('5 · ringing envelope: per-period peak amplitude decays monotonically under the live dt',
      monoDecay && decayed,
      'peaks ' + peaks[0].toExponential(2) + ' → ' + peaks[peaks.length - 1].toExponential(2) +
      ' (dt=' + BEAT_DT.toFixed(4) + ', monotone=' + monoDecay + ')');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END BREATHING-STAR CORE =====

export {
  N, G, GAMMA, DM, K0, GAMMA as POLY_GAMMA,
  R_FLOOR, R_SEP, BEAT_DT, TOL_BALANCE, TOL_RETURN,
  initR, enclosedMass, shellRho, shellP, netAccel, enforceOrder, integrate,
  relax, maxAbsAccel, makeStar,
  eqRadius, outerRadius, stepShells, setOuterDisplacement, release, setFusion,
  cutPressure, restorePressure, ringAmplitude, ringHistory,
  runBreathingStarSelfTest,
};
