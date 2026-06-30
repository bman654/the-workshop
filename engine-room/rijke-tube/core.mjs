// ============================================================================
//  The Engine Room · The Rijke Tube — CORE
//  A heat engine whose work output is SOUND. The math claim, made falsifiable.
//  Pure, DOM-free, no imports.
//
//  THE CLAIM (Rayleigh's thermoacoustic-instability criterion):
//    A flame feeds a standing wave ONLY where it dumps its heat as the air is
//    being compressed. For a hot gauze at fractional height u = x_h/L in an
//    OPEN–OPEN tube, the linear modal growth rate of the fundamental reduces
//    (up to a positive constant) to
//        γ(u, Q)  ∝  Q · sin(2π·u)
//    so the SIGN of γ — the only thing we pin — depends purely on position:
//      · u ∈ (0, ½)  → sin(2πu) > 0 → γ > 0   the tube SINGS  (lower half)
//      · u = ½        → sin(π)     = 0 → γ = 0   dead silent EXACTLY (the node)
//      · u ∈ (½, 1)  → sin(2πu) < 0 → γ < 0   silent          (upper half)
//    Negative control: Q = 0 ⇒ γ = 0 everywhere — heat is required, and
//    confinement alone (a cold pipe) makes no sound.
//
//  CRITICAL CORRECTNESS — the MIDPOINT SNAP:
//    Math.sin(2π·0.5) = Math.sin(π) is 1.2246e-16 in IEEE-754, NOT a clean 0.
//    Trusting the library would FALSIFY the "γ = 0 EXACTLY at the midpoint"
//    claim (1e-16 satisfies |γ|≤1e-12 but is not bit-exact zero). So we SNAP:
//    reduce to half-turns t = 2u and return 0 the instant t is an integer.
//    The result is `growthRate(0.5, Q) === 0` bit-exact for ANY finite Q, and
//    the SAME snap fires at u=0 and u=1 (the open mouths — also nodes).
//
//  SINGLE SOURCE OF TRUTH:
//    The verdict, the canvas readout, AND the audio gain all read the SAME γ.
//    targetAmp() calls growthRate(); the page's readout calls growthRate() and
//    fundamentalHz(). growthRate() has never heard of the DOM, the AudioContext,
//    or the pipe constants — a source-disjointness check in the test asserts it.
//    So the ear and the eye cannot drift: there is one number behind both.
//
//  The region between the two sentinels below is the DOM-free, import-free
//  core. It is inlined BYTE-FOR-BYTE into index.html (a .test parity grep
//  asserts the two slices are identical). Because the slice must be valid
//  inside BOTH a plain <script> and an ES module, it uses NO `export`/`import`
//  keyword; the module re-exports the names just below the END sentinel.
// ============================================================================
// ===== RIJKE-CORE (byte-twin of core.mjs) BEGIN =====
const C_AIR = 343;        // m/s — speed of sound in dry air (~20 °C, sea level)
const TOL = 1e-12;        // amplitude gate: |γ| below this is treated as dead silence

// Fundamental of an open–open pipe: f = c / 2L. A TALLER pipe hums LOWER.
// (Exact relation; not part of the snapped instability core.)
function fundamentalHz(L, c = C_AIR){ return c / (2 * L); }

// THE RAYLEIGH GROWTH RATE (up to a positive constant): γ ∝ Q · sin(2π·u).
//   u = the gauze's fractional height x_h/L ∈ (0,1); Q ≥ 0 is the heat input.
// The midpoint SNAP: work in half-turns t = 2u so the nodes land on integers.
// When t is an integer (u = 0, ½, 1) the sine is mathematically 0 → we return a
// bit-exact 0, never the library's 1e-16. Q=0 short-circuits to 0 (neg control).
function growthRate(u, Q){
  if (!(Q > 0)) return 0;                 // no heat ⇒ no instability (negative control)
  const t = 2 * u;                        // half-turns: a node sits at every integer t
  if (t === Math.round(t)) return 0;      // EXACT node — the dead-silent midpoint/mouths
  return Q * Math.sin(Math.PI * t);       // sin(2π·u) = sin(π·t), now provably non-node
}

// Does the tube sing? Strictly γ > TOL. Encodes confinement + heat: Q=0 ⇒ false,
// the midpoint ⇒ false, the upper half ⇒ false.
function sings(u, Q){ return growthRate(u, Q) > TOL; }

// Audible amplitude of the saturated limit cycle: a positive γ drives the tone
// up to a bounded plateau (tanh); γ ≤ TOL decays to silence. Smooth, in [0,1].
// The TOL gate makes the audible midpoint TRULY dead — no 1e-16 whisper — so the
// ear matches the pinned claim exactly. The onset/swell FEEL constants live in
// the page (they touch no pinned claim); this is the saturation only.
function targetAmp(u, Q, k = 3.2){ const g = growthRate(u, Q); return g > TOL ? Math.tanh(k * g) : 0; }
// ===== RIJKE-CORE (byte-twin of core.mjs) END =====

export { C_AIR, TOL, fundamentalHz, growthRate, sings, targetAmp };
