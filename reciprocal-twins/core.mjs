// === CORE BEGIN ===
// The Reciprocal Twins — the shared reciprocal comb of two periodic worlds (single source of truth).
//
// WHAT THIS MODULE IS. Two DISJOINT cores that have NEVER heard of each other, asked the same
// question — "where do your features land on a reciprocal ladder?" — and answering it the same way:
// on the integer comb {n/p}. One core is OPTICS (a diffraction grating of pitch p): its diffracted
// orders sit at angles sinθ_n = n·λ/p, and the reciprocal coordinate ν = sinθ_n/λ is therefore n/p
// — the wavelength cancels. The other core is SOUND (a string / open pipe whose period is taken as
// p = the fundamental's half-wavelength): its overtones are the integer multiples fₙ = n·f₀ with
// f₀ = c/(2p), and the reciprocal coordinate ν = fₙ/(c/2) is again n/p — the speed of sound cancels.
// Two different physical worlds, two unrelated code paths, ONE ladder.
//
// HONEST SCOPE (non-negotiable, stated in the page lede AND here). This shows the shared reciprocal-
// comb STRUCTURE of two periodic systems: each is the Fourier transform of a single period, so each
// is the comb {n/p}. The acoustic period is TAKEN as p = the fundamental's half-wavelength — the
// chosen convention that makes both families draw at n/p. This is NOT a claim that a grating IS a
// string, nor that light is sound. It is the claim that periodicity-of-pitch-p, transformed, is the
// integer comb {n/p}, whatever the periodic thing is. We always show BOTH the raw physical quantity
// (sinθ_n in degrees; fₙ in Hz) AND the normalized reciprocal coordinate, so the reader watches two
// different worlds collapse onto one ruler rather than being told they are "the same."
//
// THE CLAIMS IT MAKES CHECKABLE (re-proven by both the in-page pill and core.test.mjs):
//   1. TICK COINCIDENCE — across a sweep of p and λ, reciprocalOptics(n,p,λ) and reciprocalSound(n,p,c)
//      both equal n/p to machine-ε, and equal EACH OTHER to < 1e-12. The two disjoint cores agree.
//   2. λ-INDEPENDENCE — the optical reciprocal coordinate for fixed (n,p) is invariant across every λ:
//      color moves the SCREEN position (sinθ changes) but never the reciprocal tick.
//   3. LOCKSTEP (the reciprocity law) — doubling p halves every tick coordinate for BOTH families at
//      once: recipCoord(n, 2p) === recipCoord(n, p)/2 for both cores. Widen the period, the comb
//      compresses; narrow it, the comb fans out. The squeeze is exact.
//   4. NEGATIVE CONTROL IS LOAD-BEARING (the "break the period" toggle, two-pronged):
//      (a) CHIRP the grating — give slit k position xₖ with a per-step pitch pₖ = p·(1+εk) (a real
//          array-factor over chirped positions, not a faked blur). The summed array factor's peaks no
//          longer sit on n/p; assert the max deviation of its peaks from the nearest integer tick > a
//          floor. (b) swap the harmonic overtones for the carillon's INHARMONIC bell partials
//          {0.50,1.00,1.19,1.50,2.00,2.55,3.42,4.18}; assert the off-integer ratios (1.19,2.55,3.42,
//          4.18) each deviate from the nearest integer comb tooth by > 0.1. A vacuous always-aligned
//          checker PASSES claim 1 but FAILS claim 4 loudly.
//
// SINGLE-SOURCE DISCIPLINE. The optics side does NOT hand-write n·λ/p: it imports the grating's own
// orderSinThetas(d,λ) (lifted VERBATIM from diffraction/index.html — returns a SORTED array including
// 0 and ±s capped at |s|≤1) and recovers n by counting from the center. The byte-twin parity row
// proves index.html's inlined CORE slab is char-for-char this module.

// ── constants ────────────────────────────────────────────────────────────────
const SPEED_OF_SOUND = 343;        // m/s, dry air ~20°C — the acoustic "c". Cancels in reciprocalSound.

// The carillon's inharmonic bell recipe — the negative control's VOICE (ratios relative to the prime).
// Lifted from sound-garden/carillon.html's BELL_PARTIALS. The off-integer teeth (1.19, 2.55, 3.42,
// 4.18) are exactly what a harmonic comb is NOT — so swapping these in must push the overlap off {n}.
const BELL_PARTIALS = [0.50, 1.00, 1.19, 1.50, 2.00, 2.55, 3.42, 4.18];

// ── CORE A: OPTICS — the grating's own grating-equation, VERBATIM ──────────────
// orderSinThetas(d, λ): every diffracted order |sinθ_m| = |m·λ/d| ≤ 1, returned SORTED and including
// the central order 0 and the ± pairs. Orders with |sinθ| > 1 are EVANESCENT — they never propagate,
// so they are culled here BEFORE any asin (asin of >1 is NaN). This is byte-identical to the grating.
function orderSinThetas(d, lambda) {
  var out = [], m = 1, s;
  out.push(0);                                     // the central order m = 0
  while (true) {
    s = m * lambda / d;
    if (s > 1) break;                              // |sinθ| > 1 ⇒ evanescent ⇒ cull before asin
    out.push(-s); out.push(s);
    m++;
  }
  out.sort(function (a, b) { return a - b; });
  return out;
}

// reciprocalOptics(n, p, λ): the reciprocal coordinate of the n-th diffracted order. We DERIVE it from
// orderSinThetas (the sole optics authority) — we do NOT hand-write n/p. The sorted array is
// [-sₖ … -s₁, 0, s₁ … sₖ]; the center index holds order 0, and the j-th entry to the RIGHT is order
// +j with sinθ = s_j. The reciprocal coordinate is ν = sinθ_n / λ. For a propagating order this is
// EXACTLY n/p analytically (λ cancels), but the VALUE flows through the grating's array. If order n
// is evanescent (|n·λ/p| > 1) the order does not exist; return null (the spot has faded off-screen).
function reciprocalOptics(n, p, lambda) {
  if (n === 0) return 0;
  const sins = orderSinThetas(p, lambda);
  const center = (sins.length - 1) / 2;            // odd length: 1 + 2·orders; center index is order 0
  const idx = center + n;                          // order +n sits |n| steps right of center (−n to the left)
  if (idx < 0 || idx >= sins.length) return null;  // evanescent — order n does not propagate
  return sins[idx] / lambda;                        // ν = sinθ_n / λ  →  (n·λ/p)/λ = n/p
}

// sinThetaDeg(n, p, λ): the RAW physical quantity for the reader — the diffraction angle in degrees.
// null when the order is evanescent (same cull). This is the "different world" the reciprocal hides.
function sinThetaDeg(n, p, lambda) {
  if (n === 0) return 0;
  const s = n * lambda / p;
  if (Math.abs(s) > 1) return null;
  return Math.asin(s) * 180 / Math.PI;
}

// ── CORE B: SOUND — integer overtones, no trig, no λ, fully disjoint from optics ──
// fundamental(p, c): f₀ = c / (2p). The period p is taken as the fundamental's HALF-wavelength
// (string fixed at both ends / pipe open at both ends): the lowest mode fits one half-wave in p.
function fundamental(p, c) { return c / (2 * p); }

// harmonicComb(p, c, N): the first N overtones fₙ = n·f₀ (n = 1..N). The visible loop-count in the
// standing-wave stack IS n. Pure integer multiples — the harmonic series.
function harmonicComb(p, c, N) {
  const f0 = fundamental(p, c);
  const out = [];
  for (let n = 1; n <= N; n++) out.push(n * f0);
  return out;
}

// reciprocalSound(n, p, c): the reciprocal coordinate of the n-th overtone. ν = fₙ / (c/2) where
// fₙ = n·f₀ = n·c/(2p). So ν = (n·c/(2p)) / (c/2) = n/p — the speed of sound cancels identically.
// We DERIVE it from fundamental (the sole sound authority); we never hand-write n/p.
function reciprocalSound(n, p, c) {
  if (n === 0) return 0;
  const fn = n * fundamental(p, c);                // raw physical quantity, in Hz
  return fn / (c / 2);                              // normalize by c/2  →  n/p, c cancels
}

// fHz(n, p, c): the RAW physical quantity for the reader — the n-th overtone frequency in Hz.
function fHz(n, p, c) { return n * fundamental(p, c); }

// ── the negative control, prong (a): a CHIRPED grating's real array factor ─────
// A perfect grating has slit k at xₖ = k·p; its array factor |Σ exp(i·2π·xₖ·sinθ/λ)|² peaks exactly
// at sinθ = n·λ/p (the orders, on n/p). CHIRP it: let the local pitch grow, pₖ = p·(1+εk), so slit k
// sits at xₖ = Σ_{j<k} p_j (cumulative). The array factor is no longer a clean comb — its peaks drift
// OFF n/p. chirpedPeakDeviation scans the reciprocal axis, finds the array-factor peak nearest each
// integer tick, and returns the MAX |ν_peak − n| over the orders — the smear, in tick units.
function slitPositions(p, N, eps) {
  // N slits, cumulative chirped pitch. eps=0 ⇒ a perfect grating (xₖ = k·p, peaks exactly on n/p).
  const xs = [0];
  for (let k = 1; k < N; k++) xs.push(xs[k - 1] + p * (1 + eps * (k - 1)));
  return xs;
}
function arrayFactorPower(xs, nu) {
  // |Σ_k exp(i·2π·xₖ·ν)|² with ν the reciprocal coordinate (ν = sinθ/λ). At a perfect grating's
  // order n, every term has phase 2π·(k·p)·(n/p) = 2π·k·n ⇒ all in phase ⇒ a principal maximum.
  let re = 0, im = 0;
  for (const x of xs) { const ph = 2 * Math.PI * x * nu; re += Math.cos(ph); im += Math.sin(ph); }
  return (re * re + im * im) / (xs.length * xs.length);   // normalized to [0,1]
}
function chirpedPeakDeviation(p, N, eps, orders) {
  const xs = slitPositions(p, N, eps);
  let maxDev = 0;
  for (let n = 1; n <= orders; n++) {
    const target = n / p;                          // where a perfect grating's order n would sit
    // search a fine window around the integer tick for the local array-factor maximum
    const span = (1 / p) * 0.6;                    // ±60% of one tooth-spacing
    let bestNu = target, bestP = -1;
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const nu = target - span + (2 * span) * (i / steps);
      const pw = arrayFactorPower(xs, nu);
      if (pw > bestP) { bestP = pw; bestNu = nu; }
    }
    const devTicks = Math.abs(bestNu * p - n);     // deviation from integer n, in tick units
    if (devTicks > maxDev) maxDev = devTicks;
  }
  return maxDev;
}

// ── the negative control, prong (b): the inharmonic bell comb ──────────────────
// Swap the harmonic overtones for the carillon's bell ratios. Their reciprocal coordinate is
// ratio·(1/p) → in tick units the tooth lands at `ratio`, NOT at an integer. bellTickDeviations
// returns, for each bell ratio, its distance to the NEAREST integer comb tooth — the off-integer
// ratios (1.19, 2.55, 3.42, 4.18) all deviate > 0.1.
function bellTickDeviations() {
  return BELL_PARTIALS.map((r) => Math.abs(r - Math.round(r)));
}

export {
  SPEED_OF_SOUND, BELL_PARTIALS,
  orderSinThetas, reciprocalOptics, sinThetaDeg,
  fundamental, harmonicComb, reciprocalSound, fHz,
  slitPositions, arrayFactorPower, chirpedPeakDeviation, bellTickDeviations,
};
// === CORE END ===
