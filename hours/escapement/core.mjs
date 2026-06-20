/* ============================================================================
   THE HOURS · ESCAPEMENT — core.mjs   (the SOLE pendulum authority for the bench)

   When the sun is hidden, the estate still keeps the hour: a swinging pendulum
   meters out even beats, and a toothed escape-wheel releases one tooth per beat,
   counting them into hours. This is the mechanism a clock keeps WHILE the sun
   wanders ±16 min over the year (the equation of time the sundial wears).

   ── THE IDEAL CLAIM: isochronism ──
   For SMALL swings, a pendulum's period is independent of how wide it swings:

        T = 2π·√(L/G)                                  (the small-angle period — NO θ₀ in it)

   That absence of θ₀ IS the isochronism claim: widen the swing, the beat is
   unchanged. We pin the rod length so the ideal beat is EXACTLY 2.000000 s:

        L0 = G·(2/2π)²   ⇒   2π·√(L0/G) = 2 s exactly  (verified |periodIdeal()−2|=0)

   ── THE REAL TRUTH: the wide-swing correction ──
   The exact period of a finite-amplitude pendulum is an ELLIPTIC integral:

        T(θ₀) = 4·√(L/G)·K(sin(θ₀/2))                  (K = complete elliptic, 1st kind)

   K(0)=π/2 so T(0⁺) → 2π√(L/G) (it reduces to the ideal). K grows with its modulus,
   so T(θ₀) is STRICTLY INCREASING in θ₀: a wide swing runs SLOW. That is the real
   pendulum's lie — it is NOT isochronous, only approximately so for small θ₀.

   ── WHY THE PICTURE CANNOT LIE ──
   In REAL mode the visible bob angle is the CLOSED-FORM elliptic solution

        θ(t) = 2·asin( sin(θ₀/2)·sn(K(k) − √(G/L)·t, k) ),   k = sin(θ₀/2)

   (sn = Jacobi elliptic sine). The SAME elliptic authority sets both the bob's
   swing AND the period T(θ₀) the released-tooth count divides by — so the drawn
   pendulum and the counted teeth share one source. They cannot disagree.

   ── THREE HONESTY CAVEATS (executable, not asserted) ──
   1. periodSeries is a WITNESS, not the authority: the textbook power series in θ₀
      is honest only to ≤~45°; periodReal (the elliptic integral) is the authority,
      exact on the whole open interval (0,π). The knob is capped at θ₀=90° (THETA_MAX),
      clear of the θ₀→π separatrix singularity.
   2. The DRIFT claim ("the clock loses N minutes") is read from phaseGap /
      lostSeconds — the CONTINUOUS, strictly-monotone gap — NEVER from the floored
      tooth-count difference, which is a staircase that can momentarily tie.
   3. The whole model is a frictionless, point-mass, planar pendulum with a perfect
      escapement that neither drives nor damps. We model the SHAPE of the timekeeping
      error, not a real clock's mainspring, air drag, or temperature.

   index.html INLINES this file byte-identical between sentinels; core.test.mjs runs
   it in Node. If the page's inline ever drifts from this file, the page's
   re-extraction parity check fails.

   PINNED CONSTANTS — all derive from one target (the 2 s beat). To retime, change
   ONLY the beat target; never touch G, and keep L0 derived (so the headline claim
   |periodIdeal()−2|=0 stays exact).
   ============================================================================ */

// ── physical + design constants (labeled; the bench reads these, never hardcodes) ──
export const G = 9.80665;                          // standard gravity (m/s²)
export const TWO_PI = 2 * Math.PI;
// rod length pinned so the ideal beat is EXACTLY 2.000000 s: T = 2π√(L0/G) = 2.
export const L0 = G * Math.pow(2 / TWO_PI, 2);     // ≈ 0.99362 m (the seconds-pendulum)
export const T_IDEAL = TWO_PI * Math.sqrt(L0 / G); // = 2 s exactly (verified |·−2|=0)
export const N_TEETH = 30;                          // the escape-wheel's tooth count
export const STEPS_PER_HAND_REV = 60;               // hand notches per full revolution
export const THETA_MAX = Math.PI / 2;               // amplitude knob cap = 90° (clear of θ₀→π)
// knob limits the view reads (never hardcodes its own).
export const LIMITS = {
  LMIN: 0.45, LMAX: 1.80,                            // rod-length knob range (m)
  THETA0_MIN: 0.5 * Math.PI / 180,                  // 0.5° — anti-vacuity floor
  THETA0_MAX: THETA_MAX,                             // 90°
};

// ── the small-angle period: T = 2π√(L/G). NO θ₀ argument — that absence is the
//    isochronism claim made executable (the ideal beat never reads amplitude). ──
export function periodIdeal(L = L0){ return TWO_PI * Math.sqrt(L / G); }

// ── complete elliptic integral of the first kind, K(k), via the AGM.
//    a=1, b=√(1−k²); iterate (a,b)→((a+b)/2,√(ab)) to machine-ε; K = π/(2a). ──
export function ellipticK(k){
  let a = 1, b = Math.sqrt(1 - k * k);
  for(let i = 0; i < 60; i++){
    const an = (a + b) / 2, bn = Math.sqrt(a * b);
    if(Math.abs(a - b) < 1e-16){ a = an; b = bn; break; }
    a = an; b = bn;
  }
  return Math.PI / (2 * a);
}

// ── THE REAL AUTHORITY: the exact finite-amplitude period T(θ₀) = 4√(L/G)·K(sin(θ₀/2)).
//    Strictly increasing in θ₀; → T_IDEAL as θ₀→0. Exact on the open interval (0,π). ──
export function periodReal(theta0, L = L0){
  return 4 * Math.sqrt(L / G) * ellipticK(Math.sin(theta0 / 2));
}

// ── the textbook power SERIES in θ₀ — a WITNESS, honest only to ≤~45°. NOT the
//    authority. Shown so the page can prove WHERE the small-angle story breaks. ──
export function periodSeries(theta0, L = L0){
  const t2 = theta0 * theta0;
  const Tid = periodIdeal(L);
  return Tid * (1
    + t2 / 16
    + 11 * t2 * t2 / 3072
    + 173 * Math.pow(theta0, 6) / 737280
    + 22931 * Math.pow(theta0, 8) / 1321205760);
}

// ── Jacobi elliptic sine sn(u,k) via the descending-Landen / AGM scale.
//    Build aArr/cArr by (a,b,c)→((a+b)/2,√(ab),(a−b)/2) until |c|<1e-15; seed the
//    angle φ = 2ⁿ·aₙ·u; back-substitute φ ← ½(φ + asin((cᵢ/aᵢ)·sin φ)); sn = sin φ. ──
export function jacobiSN(u, k){
  let a = 1, b = Math.sqrt(1 - k * k), c = k, n = 0;
  const aArr = [a], cArr = [c];
  while(Math.abs(c) > 1e-15 && n < 60){
    const an = (a + b) / 2, bn = Math.sqrt(a * b), cn = (a - b) / 2;
    a = an; b = bn; c = cn; n++;
    aArr.push(a); cArr.push(c);
  }
  let phi = Math.pow(2, n) * aArr[n] * u;
  for(let i = n; i >= 1; i--){
    phi = 0.5 * (phi + Math.asin((cArr[i] / aArr[i]) * Math.sin(phi)));
  }
  return Math.sin(phi);
}

// ── THE VISIBLE BOB ANGLE at time t (rad), for the chosen mode.
//    IDEAL: simple-harmonic θ₀·cos(2π t/T_ideal) — isochronous (no θ₀ in the period).
//    REAL : the CLOSED-FORM elliptic solution θ(t)=2·asin(k·sn(K(k)−√(G/L)·t, k)),
//           k=sin(θ₀/2). The bob's swing AND the released-tooth count both flow from
//           this one elliptic authority, so the drawn picture cannot lie. ──
export function pendulumAngle(t, theta0, mode, L = L0){
  if(mode === 'ideal'){
    return theta0 * Math.cos(TWO_PI * t / periodIdeal(L));
  }
  const k = Math.sin(theta0 / 2);
  return 2 * Math.asin(k * jacobiSN(ellipticK(k) - Math.sqrt(G / L) * t, k));
}

// ── the released-tooth COUNT the clock face shows: one tooth per half-period (a beat).
//    IDEAL divides by the amplitude-blind ideal period; REAL by the elliptic period. ──
export function toothCountIdeal(t, L = L0){ return Math.floor(2 * t / periodIdeal(L)); }
export function toothCountReal(t, theta0, L = L0){ return Math.floor(2 * t / periodReal(theta0, L)); }

// ── geometry the view draws from: the escape-wheel angle for a tooth count, and the
//    hour-hand angle (notched, never gliding). Pure functions of the integer count. ──
export function wheelAngleRad(teeth){ return teeth * (TWO_PI / N_TEETH); }
export function handAngleRad(teeth){ return teeth * TWO_PI / (N_TEETH * STEPS_PER_HAND_REV); }

// ── THE DRIFT the readout reads — both CONTINUOUS and strictly monotone in t and θ₀.
//    phaseGap = (ideal beats so far) − (real beats so far); lostSeconds = wall-clock
//    seconds the real clock has fallen behind. NEVER the floored count difference. ──
export function phaseGap(t, theta0, L = L0){
  return 2 * t / periodIdeal(L) - 2 * t / periodReal(theta0, L);
}
export function lostSeconds(t, theta0, L = L0){
  return t * (1 - periodIdeal(L) / periodReal(theta0, L));
}

// ── the independent WITNESS: integrate the raw pendulum ODE θ''=−(G/L)sinθ with RK4
//    (θ(0)=θ₀, θ'(0)=0) and read the quarter-period off the first zero-crossing × 4.
//    Agrees with periodReal to ~1e-12. Frame jitter never touches this; it is the twin. ──
export function periodRK4(theta0, L = L0, dt = 1e-4){
  const f = (th, w) => [w, -(G / L) * Math.sin(th)];
  let th = theta0, w = 0, t = 0, prev = th;
  while(t < 100){
    const [k1a, k1b] = f(th, w);
    const [k2a, k2b] = f(th + 0.5 * dt * k1a, w + 0.5 * dt * k1b);
    const [k3a, k3b] = f(th + 0.5 * dt * k2a, w + 0.5 * dt * k2b);
    const [k4a, k4b] = f(th + dt * k3a, w + dt * k3b);
    const nth = th + (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
    w += (dt / 6) * (k1b + 2 * k2b + 2 * k3b + k4b);
    if(prev > 0 && nth <= 0){                 // quarter-period: first descending zero
      const frac = prev / (prev - nth);
      return 4 * (t + frac * dt);
    }
    prev = nth; th = nth; t += dt;
  }
  return NaN;
}
