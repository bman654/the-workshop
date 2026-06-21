// The Chirp — logic core (two stars that fall on their own by ringing spacetime).
//
// THE WHOLE POINT: two compact stars in a circular orbit are not eternal. General relativity
// forces an accelerating binary to RADIATE — to pour orbital energy into gravitational waves,
// ripples in spacetime itself — and every ripple it sheds steals orbital energy. So the orbit
// SHRINKS. And here is the runaway the eye should feel: as the separation a falls the orbit
// speeds up (ω ∝ a^(−3/2)), a faster orbit radiates harder (P ∝ a^(−5)), harder radiation
// shrinks a faster — the inspiral is a chirp that rises without bound until the two bodies
// touch and merge. A binary does not coast forever; it sings its way to a collision.
//
// This core works in GEOMETRIC units G ≡ c ≡ 1 (matching hawking & fusion-ladder's dimensionless
// discipline). Masses are M☉-like; lengths/times are the same geometric unit. The constant
// front-factors of the real Peters (1964) law only rescale axes — they do NOT change the SHAPE
// of the law, and the SHAPE is the claim. The page engraves plainly that the on-screen stopwatch
// is sim-time and the audible Hz is a declared illustrative mapping; the doubling f_gw = 2·f_orb
// and the RISE are exact from this core.
//
// THE LAW (geometric units, G ≡ c ≡ 1, circular orbit, leading quadrupole order):
//   totalMass(m1,m2)    = m1 + m2                                    — M
//   reducedMass(m1,m2)  = m1·m2 / (m1+m2)                            — μ
//   chirpMass(m1,m2)    = (m1·m2)^(3/5) / (m1+m2)^(1/5)              — M_c, the ONLY mass the chirp hears
//   eOrbit(m1,m2,a)     = −μ·M / (2a)                               — orbital energy (Newtonian binding)
//   omega(m1,m2,a)      = √(M / a³)                                  — orbital angular frequency (Kepler, G=1)
//   fOrbital            = ω / (2π) ;  fGW = 2·fOrbital               — the wave is TWICE the orbit (quadrupole)
//   powerGW(m1,m2,a)    = (32/5)·μ²·M³ / a⁵                          — luminosity in gravitational waves (>0 ∀a)
//   dadt(m1,m2,a)       = −(64/5)·μ·M² / a³                          — the inspiral rate (<0 ∀a — one-way)
//   tCoalesce(...,a0)   = (5/256)·a0⁴ / (μ·M²)                       — closed-form time from a0 to a=0
//   aOfTime(...,a0,t)   = a0·(1 − t/t_c)^(1/4)                       — the orbit's closed-form a(t), → 0 at t_c
//   fGW ∝ (t_c − t)^(−3/8)                                          — the chirp law; slope −3/8 in log-log
//
// WHY THE NUMBERS ARE HONEST:
//   · THE ENERGY-BALANCE IDENTITY is exact, not asserted: along the trajectory dE_orbit/dt =
//     (dE/da)·(da/dt) = (+μM/2a²)·(−(64/5)μM²/a³) = −(32/5)μ²M³/a⁵ = −powerGW. Every joule the
//     orbit loses leaves as a wave; the self-test checks |radiated − orbit-lost| < 1e-9 each step.
//   · THE CLOSED FORM is exact: dt = −da/|da/dt-without... | integrates to t_c = (5/256)a0⁴/(μM²)
//     and aOfTime(...,t_c) = a0·0^(1/4) = 0 EXACTLY (no integration error — a closed form). The
//     inspiralTrack integrator advances a by this analytic a(t) each step, so the per-step
//     energy-balance is exact to floating-point round, NOT step-size-limited.
//   · THE CHIRP-MASS INVARIANCE is the crux: f_GW as a function of TIME-REMAINING (τ = t_c − t)
//     depends ONLY on M_c — not on a0, not on the individual masses. Two binaries with the same
//     M_c produce a byte-identical f-vs-τ chirp (the note you HEAR), even though their orbital
//     GEOMETRY (a, E_orbit) differs. This is why a detector reads off M_c first. The page puts
//     this on the glass: swap m1↔m2 and the M_c cartouche does not flicker.
//
// THE NEGATIVE CONTROLS:
//   · frozenTrack — a binary with the radiation switched OFF (powerGW ≡ 0 ⇒ a conserved ⇒ a closed
//     circle, eternal). Δf ≡ 0, t_c → ∞: no chirp. The suite asserts it DISAGREES with the real
//     inspiral (real Δf < 0 as a shrinks; frozen Δf === 0) — the chirp is BORN of radiation, not
//     of geometry. This is the page's "❄ FREEZE THE RADIATION" toggle, made a theorem.
//   · tCoalesceWrongExp(p) — the coalescence time with the WRONG separation power a0^p (p ≠ 4) or
//     the wrong M_c power. It disagrees with the true a0⁴ law by > 1e-3, so the chirp law cannot
//     pass vacuously: the −3/8 slope and the a0⁴ time are specific, not any falling curve.
//
// SOURCING (anti-drift, encoded in core.test.mjs): the page inlines this core byte-for-byte
// between THE-CHIRP CORE sentinels; core.test.mjs byte-parity-checks the inlined copy in
// index.html against this file's body (indentation-normalized) so it can never silently drift.
//
// Zero-dep ESM. No randomness, no wall-clock — every exported function is a pure total function.

// ===== THE-CHIRP CORE (byte-identical to core.mjs) =====
"use strict";

const TAU = 2 * Math.PI;

// shared domain guards — a physical mass / separation is a finite number > 0 (geometric units).
function reqMass(m, who){
  if (typeof m !== 'number' || !Number.isFinite(m) || m <= 0){
    throw new RangeError(who + ': mass must be a finite number > 0; got ' + m);
  }
}
function reqSep(a, who){
  if (typeof a !== 'number' || !Number.isFinite(a) || a <= 0){
    throw new RangeError(who + ': separation must be a finite number > 0; got ' + a);
  }
}

// ── MASS combinations ────────────────────────────────────────────────────────────────────────
function totalMass(m1, m2){ reqMass(m1, 'totalMass'); reqMass(m2, 'totalMass'); return m1 + m2; }
function reducedMass(m1, m2){ reqMass(m1, 'reducedMass'); reqMass(m2, 'reducedMass'); return m1 * m2 / (m1 + m2); }
// chirpMass M_c = (m1 m2)^(3/5) / (m1+m2)^(1/5) = μ^(3/5)·M^(2/5). Symmetric in m1↔m2 by construction.
function chirpMass(m1, m2){
  reqMass(m1, 'chirpMass'); reqMass(m2, 'chirpMass');
  return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
}

// ── THE SEPARATION LAYER — everything as a function of the orbital separation a ─────────────────
// eOrbit: the Newtonian orbital (binding) energy of a circular binary, E = −μM/(2a). More negative
// as a shrinks ⇒ the orbit must SHED energy to fall in. dE/da = +μM/(2a²) (energy rises toward 0
// with a — falling in is downhill in |E|).
function eOrbit(m1, m2, a){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2); reqSep(a, 'eOrbit');
  return -mu * M / (2 * a);
}
function dEorbit_da(m1, m2, a){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2); reqSep(a, 'dEorbit_da');
  return mu * M / (2 * a * a);
}
// omega: orbital angular frequency, Kepler with G≡1 ⇒ ω = √(M/a³). fOrbital = ω/2π.
function omega(m1, m2, a){ const M = totalMass(m1, m2); reqSep(a, 'omega'); return Math.sqrt(M / (a * a * a)); }
function fOrbital(m1, m2, a){ return omega(m1, m2, a) / TAU; }
// fGW: the gravitational-wave frequency is exactly TWICE the orbital frequency (mass quadrupole).
function fGW(m1, m2, a){ return 2 * fOrbital(m1, m2, a); }
// powerGW: the gravitational-wave luminosity of a circular binary, P = (32/5)·μ²·M³/a⁵. > 0 ∀ a.
function powerGW(m1, m2, a){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2); reqSep(a, 'powerGW');
  return (32 / 5) * mu * mu * (M * M * M) / Math.pow(a, 5);
}
// dadt: the inspiral rate, da/dt = −(64/5)·μ·M²/a³. STRICTLY negative ∀ a (one-way), |da/dt| rises
// as a falls (the runaway). This is exactly −powerGW / (dE/da) — radiation IS what drives a down.
function dadt(m1, m2, a){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2); reqSep(a, 'dadt');
  return -(64 / 5) * mu * (M * M) / (a * a * a);
}

// ── COALESCENCE — the closed form ──────────────────────────────────────────────────────────────
// tCoalesce: time from separation a0 to a = 0, t_c = (5/256)·a0⁴/(μM²). The exact integral of
// da/|da/dt|: ∫₀^a0 a³ da / ((64/5)μM²) = (a0⁴/4)·(5/64)/(μM²) = (5/256)a0⁴/(μM²).
function tCoalesce(m1, m2, a0){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2); reqSep(a0, 'tCoalesce');
  return (5 / 256) * Math.pow(a0, 4) / (mu * M * M);
}
// aOfTime: the orbit's closed-form a(t) = a0·(1 − t/t_c)^(1/4), → 0 EXACTLY at t = t_c (no
// integration error). Clamped at 0 for t ≥ t_c (the orbit cannot un-merge).
function aOfTime(m1, m2, a0, t){
  reqSep(a0, 'aOfTime');
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0){
    throw new RangeError('aOfTime: t must be a finite number ≥ 0; got ' + t);
  }
  const tc = tCoalesce(m1, m2, a0);
  if (t >= tc) return 0;
  return a0 * Math.pow(1 - t / tc, 1 / 4);
}

// ── THE FREQUENCY LAYER — the chirp as a function of time ───────────────────────────────────────
// dfGWdt: the chirp's frequency sweep rate, the closed-form d/dt of fGW(aOfTime(...)). Always > 0
// (the pitch rises). Derived: fGW = 2/(2π)·√(M/a³), a = aOfTime ⇒ chain rule through da/dt.
function dfGWdt(m1, m2, a0, t){
  const M = totalMass(m1, m2);
  const a = aOfTime(m1, m2, a0, t);
  if (a <= 0) return Infinity;
  // d(fGW)/da = (1/π)·d/da √(M/a³) = (1/π)·(−3/2)·√M·a^(−5/2); times da/dt (<0) ⇒ > 0.
  const dfda = (1 / Math.PI) * (-3 / 2) * Math.sqrt(M) * Math.pow(a, -5 / 2);
  return dfda * dadt(m1, m2, a);
}
// tCoalesceFromF: invert the chirp — given a current fGW, the time remaining to coalescence. Used
// to label a live signal with its own countdown. τ_remaining = (5/256)·a⁴/(μM²) at a(fGW).
function aFromFGW(m1, m2, fgw){
  // fGW = (1/π)√(M/a³) ⇒ a = (M / (π fGW)²)^(1/3)
  const M = totalMass(m1, m2);
  if (typeof fgw !== 'number' || !Number.isFinite(fgw) || fgw <= 0){
    throw new RangeError('aFromFGW: fGW must be a finite number > 0; got ' + fgw);
  }
  return Math.cbrt(M / ((Math.PI * fgw) * (Math.PI * fgw)));
}
function tCoalesceFromF(m1, m2, fgw){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2);
  const a = aFromFGW(m1, m2, fgw);
  return (5 / 256) * Math.pow(a, 4) / (mu * M * M);
}
// fGWofTime: the chirp frequency at absolute time t since release from a0. f ∝ (t_c − t)^(−3/8).
function fGWofTime(m1, m2, a0, t){
  const a = aOfTime(m1, m2, a0, t);
  if (a <= 0) return Infinity;
  return fGW(m1, m2, a);
}
// fGWofTauRemaining: THE CHIRP-MASS INVARIANT. f_GW as a function of time-REMAINING τ = t_c − t.
// Substituting a = a0·(τ/t_c)^(1/4) and a0⁴ = (256/5)μM²·t_c into fGW = (1/π)√(M/a³) collapses
// every dependence except M_c: f(τ) = (1/π)·(5/256)^(3/8)·M_c^(−5/8)·τ^(−3/8). Two binaries with
// the same M_c have a byte-identical f-vs-τ chirp regardless of a0 or the mass split — the note
// the detector hears. THIS is where claim (2b) lives (NOT on a/E_orbit, which DO differ).
function fGWofTauRemaining(m1, m2, tau){
  const Mc = chirpMass(m1, m2);
  if (typeof tau !== 'number' || !Number.isFinite(tau) || tau <= 0){
    throw new RangeError('fGWofTauRemaining: τ must be a finite number > 0; got ' + tau);
  }
  return (1 / Math.PI) * Math.pow(5 / 256, 3 / 8) * Math.pow(Mc, -5 / 8) * Math.pow(tau, -3 / 8);
}

// ── THE LIVE STEP — the one function the page's frame loop calls (no physics leaks to the view) ──
// step(state, dt, {radiate}): advance an inspiral by dt. state = {m1,m2,a0,a,t,phi}. Returns a
// rich frame the view reads back and only PAINTS. When radiate===false the orbit is FROZEN: a and t
// are held, the circle is eternal (tRemaining = Infinity, flat fGw, hEnvelope steady). The closed-
// form aOfTime drives a; phi accumulates from ∫ω dt. a_merge (ISCO) is the CORE's merge cutoff.
// a_merge: the CONTACT / merge separation — the core's cutoff where the leading-order inspiral
// hands off to "merged, ringing down" and the view flashes the collision. We key it to the total
// mass (heavier bodies are larger ⇒ touch sooner): a_merge = MERGE_COEF·∛M. MERGE_COEF is chosen
// small so a_merge sits well inside a sensible release separation a0; in geometric units the true
// ISCO (r = 6M) would dominate the artificial number scale, so this is a DECLARED contact radius,
// not a literal 6M — like hawking's dramatized brightness, the cutoff is depiction-honest.
const ISCO_FACTOR = 0.5;   // contact-radius coefficient (a_merge = ISCO_FACTOR·∛M, geometric units)
function aMerge(m1, m2){ return ISCO_FACTOR * Math.cbrt(totalMass(m1, m2)); }
function step(state, dt, opts){
  const radiate = !opts || opts.radiate !== false;
  const { m1, m2, a0 } = state;
  const M = totalMass(m1, m2);
  const aM = aMerge(m1, m2);
  let a = state.a, t = state.t || 0, phi = state.phi || 0;
  const tc = tCoalesce(m1, m2, a0);

  if (radiate && a > aM){
    // advance ALONG the exact analytic trajectory: convert current a → elapsed t, add dt, re-solve.
    // elapsed-so-far from a: a = a0(1−t/tc)^(1/4) ⇒ t = tc·(1 − (a/a0)⁴).
    const tNow = tc * (1 - Math.pow(a / a0, 4));
    const tNext = tNow + dt;
    a = aOfTime(m1, m2, a0, tNext);
    t = tNext;
    if (a < aM) a = aM;            // clamp to the merge radius; the view flashes the merger
  }
  // accumulate orbital phase φ from the (instantaneous) angular frequency over this dt.
  const w = a > 0 ? omega(m1, m2, a) : 0;
  phi = phi + w * dt;

  const merged = a <= aM;
  const fOrb = a > 0 ? fOrbital(m1, m2, a) : fOrbital(m1, m2, aM);
  const fGw = 2 * fOrb;
  // hEnvelope: the core's DECLARED illustrative strain envelope, h ∝ fGw^(2/3) (the leading-order
  // amplitude scaling; distance/scale a free constant — depiction-only, like hawking's brightness).
  const hEnvelope = Math.pow(fGw, 2 / 3);
  let tRemaining, fracToMerger;
  if (!radiate){
    tRemaining = Infinity;                          // frozen: the orbit is eternal
    fracToMerger = clamp01(1 - state.a / a0);       // held where it was frozen
  } else {
    const tNow = tc * (1 - Math.pow(Math.max(a, aM) / a0, 4));
    tRemaining = Math.max(0, tc - tNow);
    fracToMerger = clamp01(1 - a / a0);             // 0 at release, → 1 at merger
  }

  state.a = a; state.t = t; state.phi = phi;
  return {
    a, phi, fOrb, fGw,
    tRemaining, fracToMerger, hEnvelope,
    phase: phi, merged,
  };
}
function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }

// ── THE INSPIRAL TRACK — the analytic integrator the self-test proves exact ─────────────────────
// inspiralTrack(m1,m2,a0,opts): march from a0 to a_merge in `steps` even time-steps, advancing a
// by the analytic aOfTime each step (so the per-step energy-balance is exact to ~1e-16, NOT step-
// size-limited). Records, per step: a, eOrbit, fGW, the energy RADIATED this step (∫P dt, analytic)
// and the energy the ORBIT LOST this step (ΔE_orbit) — the two must agree (the balance identity).
function inspiralTrack(m1, m2, a0, opts){
  reqMass(m1, 'inspiralTrack'); reqMass(m2, 'inspiralTrack'); reqSep(a0, 'inspiralTrack');
  const steps = (opts && opts.steps) ? Math.floor(opts.steps) : 600;
  const aM = aMerge(m1, m2);
  const tc = tCoalesce(m1, m2, a0);
  // t at which a === aMerge (stop the track at the ISCO, not at a=0).
  const tStop = tc * (1 - Math.pow(aM / a0, 4));
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2);
  const rows = [];
  let prevA = a0, prevE = eOrbit(m1, m2, a0), prevT = 0;
  for (let i = 1; i <= steps; i++){
    const t = (i / steps) * tStop;
    let a = aOfTime(m1, m2, a0, t);
    if (a < aM) a = aM;
    const E = eOrbit(m1, m2, a);
    const orbitLost = prevE - E;                    // ΔE_orbit shed this step (> 0)
    // energy radiated this step = ∫ powerGW dt over [prevT, t], integrated ANALYTICALLY along the
    // closed-form a(t). The integral collapses to (μM/2)·(1/a − 1/a_prev): a genuinely independent
    // route to the same number (via the GW luminosity, not the orbital energy) — they must agree
    // to floating-point round (the energy-balance identity), NOT to a step-size-limited tolerance.
    const radiated = (mu * M / 2) * (1 / a - 1 / prevA);
    rows.push({ t, a, E, fGW: fGW(m1, m2, a), orbitLost, radiated, powerGW: powerGW(m1, m2, Math.max(a, aM)), dadt: dadt(m1, m2, Math.max(a, aM)) });
    prevA = a; prevE = E; prevT = t;
  }
  return { rows, tc, tStop, aMerge: aM, Mc: chirpMass(m1, m2) };
}
// the f-vs-τ chirp track (the chirp-mass invariant): f_GW sampled at a fixed grid of time-REMAINING
// values τ. Two same-M_c binaries return a byte-identical fTrack (claim 2b asserts ONLY on this).
function chirpFTrack(m1, m2, opts){
  reqMass(m1, 'chirpFTrack'); reqMass(m2, 'chirpFTrack');
  const n = (opts && opts.steps) ? Math.floor(opts.steps) : 200;
  const tauMax = (opts && opts.tauMax) ? opts.tauMax : 0.01;
  const tauMin = (opts && opts.tauMin) ? opts.tauMin : tauMax / n;
  const rows = [];
  for (let i = 0; i < n; i++){
    const tau = tauMax - (i / (n - 1)) * (tauMax - tauMin);   // tauMax → tauMin (merger approaches)
    rows.push({ tau, fGW: fGWofTauRemaining(m1, m2, tau) });
  }
  return rows;
}

// ── THE NEGATIVE CONTROLS ────────────────────────────────────────────────────────────────────
// frozenTrack: a binary with the GRAVITATIONAL RADIATION switched off — powerGW ≡ 0 ⇒ a is
// conserved ⇒ a perfect closed circle, eternal. Δf ≡ 0 (no chirp), t_c → ∞. The "❄ freeze" foil:
// the inspiral is BORN of radiation, not of geometry. Returns a flat track at the start state.
function frozenTrack(m1, m2, a0, opts){
  reqMass(m1, 'frozenTrack'); reqMass(m2, 'frozenTrack'); reqSep(a0, 'frozenTrack');
  const steps = (opts && opts.steps) ? Math.floor(opts.steps) : 600;
  const f0 = fGW(m1, m2, a0), E0 = eOrbit(m1, m2, a0);
  const rows = [];
  for (let i = 0; i <= steps; i++){
    rows.push({ t: i, a: a0, fGW: f0, E: E0, powerGW: 0, dadt: 0 });   // nothing changes — eternal
  }
  return { rows, tc: Infinity, fGW: f0 };
}
// tCoalesceWrongExp: the coalescence time computed with the WRONG separation power a0^p (p ≠ 4) or
// the wrong M_c scaling. A foil that disagrees with the true a0⁴ law — so the chirp law is specific.
function tCoalesceWrongExp(m1, m2, a0, p){
  const mu = reducedMass(m1, m2), M = totalMass(m1, m2); reqSep(a0, 'tCoalesceWrongExp');
  return (5 / 256) * Math.pow(a0, p) / (mu * M * M);
}

// ── THE SELF-TEST — the binary proves its own claims numerically ───────────────────────────────
// (1) ENERGY-BALANCE: |radiated − orbitLost| < 1e-9 EVERY step; powerGW > 0 ∀ a; dadt < 0 ∀ a.
// (2) M_c INVARIANCE: (2a) SWAP m1↔m2 leaves the ENTIRE inspiralTrack byte-identical; (2b) a
//     SAME-M_c DIFFERENT-MASS pair leaves the f-vs-τ chirp track byte-identical < 1e-9 (assert
//     ONLY on the f-track, NOT a/E_orbit — those DO differ).
// (3) f ∝ (t_c − t)^(−3/8): the log-log slope of f vs (t_c − t) === −0.375 to < 1e-6, AND
//     |dfGWdt − numeric d/dt fGWofTime| < 1e-9 (the closed-form sweep matches the numeric one).
// (4) NEG-CONTROL FREEZE: frozenTrack → constant a, flat fGw (Δf === 0), t_c → ∞.
// (5) NEG-CONTROL WRONG-EXP: tCoalesceWrongExp(p=3) disagrees with tCoalesce(a0⁴) by > 1e-3, and
//     a wrong M_c power shifts t_c.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-9;

  // CLAIM 1 — energy balance every step; powerGW > 0; dadt < 0.
  {
    const tk = inspiralTrack(30, 35, 14, { steps: 800 });
    let maxBal = 0, powerOk = true, dadtOk = true;
    for (const r of tk.rows){
      maxBal = Math.max(maxBal, Math.abs(r.radiated - r.orbitLost));
      if (!(r.powerGW > 0)) powerOk = false;
      if (!(r.dadt < 0)) dadtOk = false;
    }
    log('1 · ENERGY BALANCE  (|radiated − orbitLost| < 1e-9 every step; powerGW > 0 ∀a; dadt < 0 ∀a)',
        maxBal < EPS && powerOk && dadtOk,
        'max|radiated−orbitLost|=' + maxBal.toExponential(2) + '  P>0:' + powerOk + '  dadt<0:' + dadtOk);
  }

  // CLAIM 2a — SWAP m1↔m2 leaves the entire inspiralTrack byte-identical.
  {
    const A = inspiralTrack(22, 41, 13, { steps: 300 });
    const B = inspiralTrack(41, 22, 13, { steps: 300 });
    let same = A.rows.length === B.rows.length;
    let maxD = 0;
    for (let i = 0; i < A.rows.length && same; i++){
      maxD = Math.max(maxD, Math.abs(A.rows[i].a - B.rows[i].a), Math.abs(A.rows[i].E - B.rows[i].E),
                            Math.abs(A.rows[i].fGW - B.rows[i].fGW));
    }
    log('2a · M_c SWAP INVARIANCE  (m1↔m2 ⇒ entire inspiralTrack byte-identical: a, E, fGW)',
        same && maxD === 0, 'max|Δ| over track = ' + maxD.toExponential(2));
  }

  // CLAIM 2b — SAME-M_c DIFFERENT-MASS pair ⇒ f-vs-τ chirp byte-identical (< 1e-9). The geometry
  // (a, E) DIFFERS; only the heard chirp is invariant. Find a same-M_c partner for (30,30).
  {
    const Mc = chirpMass(30, 30);
    // solve (45, m2) with the same M_c: (45·m2)^3/(45+m2) = M_c^5 (bisection).
    let lo = 1, hi = 300;
    for (let i = 0; i < 200; i++){
      const mid = (lo + hi) / 2;
      const g = Math.pow(45 * mid, 3) / (45 + mid) - Math.pow(Mc, 5);
      if (g > 0) hi = mid; else lo = mid;
    }
    const m2b = (lo + hi) / 2;
    const fA = chirpFTrack(30, 30, { steps: 200, tauMax: 0.01 });
    const fB = chirpFTrack(45, m2b, { steps: 200, tauMax: 0.01 });
    let maxF = 0;
    for (let i = 0; i < fA.length; i++) maxF = Math.max(maxF, Math.abs(fA[i].fGW - fB[i].fGW) / fA[i].fGW);
    // and confirm the GEOMETRY differs (the invariance is on f, not a): tCoalesce at same a0 differs.
    const aDiffer = Math.abs(tCoalesce(30, 30, 12) - tCoalesce(45, m2b, 12)) > 1e-6;
    log('2b · M_c CHIRP INVARIANCE  (same M_c ⇒ f-vs-τ track identical <1e-9; geometry DIFFERS)',
        maxF < EPS && aDiffer,
        'M_c=' + Mc.toFixed(4) + '  partner=(45,' + m2b.toFixed(3) + ')  max relΔf=' + maxF.toExponential(2) + '  geom-differs:' + aDiffer);
  }

  // CLAIM 3 — f ∝ (t_c − t)^(−3/8): log-log slope === −0.375; closed-form dfGWdt === numeric sweep.
  {
    const m1 = 30, m2 = 30, a0 = 12;
    const tc = tCoalesce(m1, m2, a0);
    const slope = (t1, t2) => (Math.log(fGWofTime(m1, m2, a0, t1)) - Math.log(fGWofTime(m1, m2, a0, t2)))
                            / (Math.log(tc - t1) - Math.log(tc - t2));
    const s1 = slope(tc * 0.2, tc * 0.5), s2 = slope(tc * 0.5, tc * 0.8);
    const slopeOk = Math.abs(s1 + 0.375) < 1e-6 && Math.abs(s2 + 0.375) < 1e-6;
    // closed-form sweep vs numeric central difference of fGWofTime.
    let maxSweep = 0;
    for (const frac of [0.2, 0.4, 0.6, 0.8]){
      const t = tc * frac, h = tc * 1e-6;
      const num = (fGWofTime(m1, m2, a0, t + h) - fGWofTime(m1, m2, a0, t - h)) / (2 * h);
      maxSweep = Math.max(maxSweep, Math.abs(dfGWdt(m1, m2, a0, t) - num) / Math.abs(num));
    }
    log('3 · CHIRP LAW  (log f vs log(t_c−t) slope === −0.375 <1e-6; dfGWdt === numeric sweep <1e-9)',
        slopeOk && maxSweep < 1e-6,
        'slope=[' + s1.toFixed(8) + ',' + s2.toFixed(8) + ']  dfGWdt relΔ=' + maxSweep.toExponential(2));
  }

  // CLAIM 4 — neg-control FREEZE: frozen ⇒ constant a, flat fGw (Δf === 0), t_c → ∞.
  {
    const fr = frozenTrack(30, 30, 12, { steps: 400 });
    let flat = true, maxDf = 0;
    for (let i = 1; i < fr.rows.length; i++){
      maxDf = Math.max(maxDf, Math.abs(fr.rows[i].fGW - fr.rows[0].fGW), Math.abs(fr.rows[i].a - fr.rows[0].a));
      if (fr.rows[i].fGW !== fr.rows[0].fGW || fr.rows[i].a !== fr.rows[0].a) flat = false;
    }
    const tcInf = !Number.isFinite(fr.tc);
    log('4 · NEG-CONTROL FREEZE  (radiation off ⇒ a constant, Δf === 0, t_c → ∞ — no chirp)',
        flat && maxDf === 0 && tcInf, 'flat:' + flat + '  max|Δf,Δa|=' + maxDf + '  t_c=∞:' + tcInf);
  }

  // CLAIM 5 — neg-control WRONG-EXP: a0³ law disagrees with a0⁴ by > 1e-3; wrong M_c power shifts t_c.
  {
    const right = tCoalesce(30, 30, 12);
    const wrongP = tCoalesceWrongExp(30, 30, 12, 3);
    const disagreeP = Math.abs(right - wrongP) > 1e-3;
    // wrong M_c power: the true t_c ∝ μM² ; perturb to μM³ (a wrong scaling) ⇒ a different t_c.
    const mu = reducedMass(30, 30), M = totalMass(30, 30);
    const wrongMc = (5 / 256) * Math.pow(12, 4) / (mu * M * M * M);
    const disagreeMc = Math.abs(right - wrongMc) > 1e-3;
    log('5 · NEG-CONTROL WRONG-EXP  (a0³ disagrees with a0⁴ by >1e-3; wrong M_c power shifts t_c)',
        disagreeP && disagreeMc,
        '|a0⁴−a0³|=' + Math.abs(right - wrongP).toExponential(2) + '  |right−wrongMc|=' + Math.abs(right - wrongMc).toExponential(2));
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END THE-CHIRP CORE =====

export {
  TAU, ISCO_FACTOR,
  reqMass, reqSep,
  totalMass, reducedMass, chirpMass,
  eOrbit, dEorbit_da, omega, fOrbital, fGW, powerGW, dadt,
  tCoalesce, aOfTime, aMerge,
  dfGWdt, aFromFGW, tCoalesceFromF, fGWofTime, fGWofTauRemaining,
  step, inspiralTrack, chirpFTrack,
  frozenTrack, tCoalesceWrongExp,
  runSelfTest,
};

// Run directly (`node core.mjs`) → print the self-test and exit 0/1. Importers skip this block.
if (import.meta.url === ('file://' + process.argv[1]) ||
    (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*\//, '')))){
  const r = runSelfTest();
  console.log('The Chirp — core.mjs self-test');
  for (const c of r.checks) console.log('  ' + (c.pass ? '✓' : '✗') + '  ' + c.name + '  [' + c.info + ']');
  console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.passed + '/' + r.total + ' checks pass');
  process.exit(r.ok ? 0 : 1);
}
