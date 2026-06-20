// ============================================================================
//  THE MOVING FRAME — the estate's ONE special-relativity logic core.
//
//  Natural units, c = 1.  Pure, DOM-free, dependency-free, dual-use (runs in
//  the browser and in Node).  This module is the SINGLE SOURCE OF TRUTH for all
//  Lorentz / proper-time math on the estate.  THREE pages import it:
//
//    • relativity/index.html                  — The Twin Voyage (this wing's bench)
//    • cavern/light-clock/index.html          — The Light Clock (γ from Pythagoras)
//    • relativity/speed-you-cant-add/index.html — The Speed You Can't Add (velAdd via rapidity)
//
//  All importers ALSO inline the slab between the CORE BEGIN / CORE END sentinels
//  byte-for-byte; relativity/core.test.mjs proves the inline copies in the first
//  two pages are identical to this file (indentation-normalised) so the math can
//  never silently drift.  Because it lives here once, NO duplicate Lorentz code
//  survives anywhere on the estate.
//
//  THE ONE IDEA. A clock measures the LENGTH of its own worldline through
//  spacetime — its PROPER TIME.  At instantaneous speed β its clock runs at the
//  rate dτ/dt = √(1−β²) = 1/γ, so the total elapsed for any voyage is the
//  integral  τ = ∫ √(1−β(t)²) dt  over the lab (home) time t.  The "twin
//  paradox" is then not a paradox but a THEOREM: leaving the platform and
//  returning is a longer worldline through space and therefore a SHORTER one
//  through time, so the traveller re-docks younger — strictly so, and more so
//  for a faster or longer detour.  The same √(1−β²) is the geometry the Light
//  Clock draws as the slanted photon path; the same Lorentz boost preserves the
//  interval s² = (ct)² − x² that the cone diagram swivels.
//
//  (reciprocal-twins/ is a diffraction/sound piece — a different "twins"; it
//  shares NO math with this module by design.)
// ============================================================================

// === CORE BEGIN ===
// --- the Lorentz kinematics (c = 1) -----------------------------------------

// The Lorentz factor γ = 1/√(1−β²).  Diverges as β → 1.
function gammaOf(beta){ return 1 / Math.sqrt(1 - beta*beta); }

// The proper-time RATE at instantaneous speed β:  dτ/dt = √(1−β²) = 1/γ.
// This is the integrand the whole wing is built on.
function rateOf(beta){ return Math.sqrt(1 - beta*beta); }

// Lorentz boost of an event (ct, x) into a frame moving at β (c = 1):
//   t' = γ(t − βx),   x' = γ(x − βt).
function lorentz(ct, x, beta){
  const g = gammaOf(beta);
  return { ct: g*(ct - beta*x), x: g*(x - beta*ct) };
}

// The invariant spacetime interval  s² = (ct)² − x².  Preserved by lorentz().
function interval2(ct, x){ return ct*ct - x*x; }

// Relativistic velocity addition (collinear), c = 1:  w = (u+v)/(1 + uv).
// Two sub-c speeds never compose to ≥ c — light keeps its monopoly on c.
function velAdd(u, v){ return (u + v) / (1 + u*v); }

// RAPIDITY  φ = atanh(β).  The ADDITIVE coordinate of a boost: collinear boosts
// add their rapidities, which is WHY velocities compose by velAdd.  φ→∞ as β→1.
function rapidity(beta){ return Math.atanh(beta); }

// The inverse: β = tanh(φ).  Maps any real rapidity back into (−1, 1) — so no
// stack of finite rapidities ever reaches c.  velAdd(u,v) === tanh(atanh u + atanh v).
function betaOfRapidity(phi){ return Math.tanh(phi); }

// The GALILEAN ("wrong", pre-Einstein) transform — the falsifiable control:
// t unchanged, x sheared.  It does NOT preserve the interval, by construction.
function galilean(ct, x, beta){ return { ct: ct, x: x - beta*ct }; }

// γ DERIVED FROM THE BOUNCING-PHOTON GEOMETRY — independent of the closed form.
// In the lab the photon climbs the mirror gap L while the clock drifts; the
// one-way path is the hypotenuse, and (because the photon moves at c=1) its
// LENGTH equals the one-way TIME T_half:  T_half = √(L² + (β·T_half)²).
// We solve that implicit equation by bisection (borrowing no algebra from
// 1/√(1−β²)), then γ = (2·T_half)/T0 = T_half / L, with the rest tick T0 = 2L.
function gammaFromGeometry(beta, L){
  if (L == null) L = 1;
  const T0 = 2 * L;                          // rest tick = one round trip = 2L/c
  function pathMinusTime(Th){ return Math.sqrt(L*L + (beta*Th)*(beta*Th)) - Th; }
  // root of f(Th)=path−Th: at Th=L it's ≥0 (path≥L), goes negative for large Th.
  let lo = L, hi = L * 1e7;                  // γ ≤ ~22 here, so L·1e7 is a safe bracket
  for (let i = 0; i < 200; i++){
    const mid = 0.5*(lo + hi);
    if (pathMinusTime(mid) > 0) lo = mid; else hi = mid;
  }
  const Thalf = 0.5*(lo + hi);
  return (2*Thalf) / T0;                     // = Thalf / L
}

// --- proper time of a voyage  τ = ∫ √(1−β(t)²) dt ---------------------------

// CLOSED FORM for a constant-speed leg of lab-duration T:  the traveller moves
// the whole time, so τ = T·√(1−β²) = T/γ.  (constLegTau is the alias the Node
// twin uses; tauClosedForm is the wing's name for the same function.)
function constLegTau(beta, T){ return T * rateOf(beta); }
function tauClosedForm(T, beta){ return T * rateOf(beta); }   // (T, β) argument order for the wing

// THE INTEGRATOR — Simpson's rule for τ = ∫₀ᵀ √(1−β(t)²) dt given a sampled
// speed profile β(t) supplied as a function.  n is forced even; exact (to ε) for
// smooth β.  This is the "area under the √(1−β²) band" the wing shades live.
function properTime(betaFn, T, n){
  n = n || 4000; if (n % 2) n++;
  const h = T / n;
  let s = rateOf(betaFn(0)) + rateOf(betaFn(T));
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * rateOf(betaFn(i*h));
  return s * h / 3;
}

// THE LIVE-PROFILE INTEGRATOR — τ = ∫ √(1−β²) dt by the trapezoid rule over an
// already-sampled profile [{t, beta}, …] sorted by t.  This is what the running
// animation accumulates frame-to-frame (its samples are not equally spaced).
function properTimeIntegral(samples){
  let tau = 0;
  for (let i = 1; i < samples.length; i++){
    const a = samples[i-1], b = samples[i];
    const dt = b.t - a.t;
    if (dt <= 0) continue;
    tau += 0.5 * (rateOf(a.beta) + rateOf(b.beta)) * dt;   // trapezoid
  }
  return tau;
}

// PROPER TIME of a piecewise-constant-β voyage given as legs [{beta, dt}, …]
// where dt is the elapsed LAB time on that leg:  τ = Σ √(1−βᵢ²)·dtᵢ.  Exact
// when β is piecewise constant (the out/turn/in shape the rail flies).
function properTimePiecewise(legs){
  let tau = 0;
  for (const L of legs) tau += rateOf(L.beta) * L.dt;
  return tau;
}

// THE COORDINATE-CLOCK negative control — a (wrong) clock that ignores β: its
// rate is always 1, so it accrues τ ≡ t and NEVER lags.  Must fail to show the
// gap; this is what gives the proof its teeth.
function coordRate(_beta){ return 1; }
function coordinateClockTau(_betaFn, T){ return T; }
function properTimeCoordinate(legs){
  let tau = 0;
  for (const L of legs) tau += coordRate(L.beta) * L.dt;    // ≡ Σ dt = t
  return tau;
}

// --- relativistic aberration & Doppler: the sky you fly INTO -----------------
// θ is the star's RING angle in the dome's REST frame (cosθ=+1 dead ahead,
// cosθ=−1 dead astern).  Flying at β toward θ=0, the moving observer SEES the
// star at θ' given by the aberration of light (c=1):
//   cosθ' = (cosθ + β)/(1 + β·cosθ).
// As β→1 every star with cosθ>−1 has θ'→0 (the HEADLIGHT); the lone antipode
// cosθ=−1 is a measure-zero fixed point.  Its own inverse at −β: a bijection.
function relativisticAberration(cosTheta, beta){
  return (cosTheta + beta) / (1 + beta*cosTheta);
}

// The relativistic DOPPLER factor for that star: D = ν_obs/ν_rest =
//   (1 + β·cosθ)/√(1−β²).   D>1 ahead (BLUEshift), D<1 behind (REDshift),
// and D=1 exactly at rest (β=0) for every star.  Boosting by β then −β (with
// the aberrated angle) returns the frequency unchanged: D(β,θ)·D(−β,θ')=1.
function dopplerFactor(cosTheta, beta){
  return (1 + beta*cosTheta) / Math.sqrt(1 - beta*beta);
}

// The NEGATIVE CONTROL — Galilean ("classical") aberration: the apparent
// direction shifts by simple vector subtraction of the observer's velocity,
// with NO 1/(1+β·cosθ) denominator → cosθ' = cosθ+β, clamped to the sphere.
// There is NO headlight: a rear star (cosθ near −1) barely moves and θ' does
// NOT → 0 as β→1.  Intentionally not a bijection (the clamp collapses a cap):
// classical aberration is not a clean solid-angle remap — only the
// relativistic Möbius map is.  This is what gives the headlight claim teeth.
function classicalAberration(cosTheta, beta){
  return Math.max(-1, Math.min(1, cosTheta + beta));
}
// === CORE END ===

export {
  gammaOf, rateOf, lorentz, interval2, velAdd, rapidity, betaOfRapidity,
  galilean, gammaFromGeometry,
  constLegTau, tauClosedForm, properTime, properTimeIntegral,
  properTimePiecewise, coordRate, coordinateClockTau, properTimeCoordinate,
  relativisticAberration, dopplerFactor, classicalAberration,
};
