// ============================================================================
//  THE JUG — the HELMHOLTZ-RESONATOR CORE: the sole authority for the claim
//  "a jug hums ONE low note with NO overtone ladder — the plug of air in the neck
//  is a MASS bobbing on the cavity's air SPRING, a single lumped resonance." Pure,
//  dependency-free (DOM-free). This module owns the bench's physics:
//
//    • THE HELMHOLTZ LAW.  The neck air is a slug of mass m = ρ·A·L_eff (density ×
//      bore area × effective neck length). The cavity air is a spring: compress the
//      slug inward by dx and the trapped V is squeezed, raising the pressure, which
//      pushes back with stiffness k = ρ·c²·A²/V. A mass on a spring rings at one
//      frequency:
//          ω = √(k/m) = √( (ρc²A²/V) / (ρA·L_eff) ) = c·√( A/(V·L_eff) )
//      — the ρ CANCELS — so
//          f_H = ω/2π = (c/2π)·√( A/(V·L_eff) ).
//      ONE mode. There is NOTHING at 2f to draw: this is the LUMPED foil to The
//      Stopped Pipe's DISTRIBUTED odd-harmonic ladder.
//
//    • THE THREE LEVERS (each an exact musical interval, scale-free):
//        – halve the air V→V/2  ⇒  f × √2  (+600¢, a tritone)   [f ∝ 1/√V]
//        – double the throat A→2A ⇒ f × √2  (+600¢, a tritone)   [f ∝ √A]
//        – quadruple the neck L_eff→4L_eff ⇒ f ÷ 2 (−1200¢, an octave) [f ∝ 1/√L_eff]
//      All three change the same single f_H — the slug bobs faster/slower and the
//      hum slides; no new partials appear.
//
//    • THE SINGLE-MODE NEGATIVE CONTROL (the renderResonator ODE).  Strike the
//      lumped resonator with broadband noise and only f_H survives — the energy at
//      2f,3f sits at the resonator's far-skirt floor ((E₂²+E₃²)/E₁² ~2e-4). Render
//      a harmonic LADDER instead (modes at f,2f,3f, weighted so the output is a 1/n
//      string spectrum) and that ratio jumps to ~0.36 — three orders of magnitude
//      louder at the partials. The jug is NOT a ladder. And because the ODE is
//      LINEAR, driving it 8× harder produces a bit-identical waveform ×8: louder,
//      never higher — blowing harder cannot move the pitch.
//
//  This HELMHOLTZ CORE is single-sourced here; the page (index.html) inlines a
//  BYTE-TWIN of the slice between the sentinels below, char-for-char, plus a
//  byte-twin of the PITCH CORE slice from ../pitch-core.mjs (semiToFreq + noteName,
//  for the pip's note label — never re-typed). The Node twin (core.test.mjs)
//  re-extracts both slices, asserts char-for-char identity, and calls the SAME
//  runJugSelfTest the in-page pill calls — so "self-test green" cannot drift.
//
//  The leaf lives one level deep (the-jug → sound-garden → repo root), so the Node
//  twin's repoRoot is ../.. and the pitch anchor is ../pitch-core.mjs.
// ============================================================================

import { semiToFreq, noteName } from '../pitch-core.mjs';   // the pitch anchor — never re-typed

// ===== JUG CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE & self-contained: the physics constants, the Helmholtz law, the
// lumped spring/mass, the matrix-exp ODE render, and runJugSelfTest take only plain
// numbers — so the page can inline this block verbatim regardless of script load
// order (the PITCH CORE label wiring lives OUTSIDE this slice), and the Helmholtz
// law literal lives in exactly ONE place (the single-source grep checks).

// THE PHYSICS CONSTANTS — the ONE place these live as code.
const C_AIR = 343;            // m/s — the speed of sound in air (the law's c)
const RHO_AIR = 1.2;          // kg/m³ — air density (cancels out of f_H; present in k and m)
const END_CORR = 1.7;         // the neck end-correction factor: L_eff = L_drawn + 1.7·r
//   the validated A3 baseline geometry (B's tuning): a 30 mm-bore (r=15 mm) neck of
//   effective length 8 cm over a ~0.54 L cavity rings at f_H = 220.0 Hz (A3).
const A0 = 7.069e-4;          // m² — the neck bore area (r = 15 mm ⇒ πr² = 7.069e-4)
const V0 = 5.44e-4;           // m³ — the cavity air volume (~0.54 L)
const LEFF0 = 0.08;           // m — the effective neck length (incl. the 1.7·r end-correction)

// THE HELMHOLTZ LAW — f_H given (A, V, L_eff): the SOLE source of every pitch the
// bench draws and hears. A mass on a spring, ρ cancelled. f ∝ √A, f ∝ 1/√V,
// f ∝ 1/√L_eff. Takes a state-like object so the page calls helmholtzFreq(state).
function helmholtzFreq({ A, V, Leff, c = C_AIR }){
  return (c / (2 * Math.PI)) * Math.sqrt(A / (V * Leff));
}

// THE AIR SPRING — its stiffness k = ρ·c²·A²/V (N/m). Squeeze the slug in by dx and
// the cavity pressure rises, pushing back with this stiffness. Grows as A² and as 1/V.
function springConstant(A, V, rho = RHO_AIR, c = C_AIR){ return rho * c * c * A * A / V; }

// THE AIR SLUG — its mass m = ρ·A·L_eff (kg): the plug of air in the neck that bobs.
function slugMass(A, Leff, rho = RHO_AIR){ return rho * A * Leff; }

// the lumped resonance ω = √(k/m) — a mass on a spring. The SAME ω as 2π·f_H (the
// identity LEG 1 proves), reached by the disjoint mechanical route (k and m, ρ and
// all). The pitch the eye watches bob and the ear hears IS √(k/m).
function omegaFromLumped(k, m){ return Math.sqrt(k / m); }

// a frequency RATIO in cents — 1200·log₂(r). √2 ⇒ +600¢ (a tritone); ½ ⇒ −1200¢ (an octave).
function centsRatio(r){ return 1200 * Math.log2(r); }

// a tiny, fast SEEDED PRNG (mulberry32) → deterministic white noise in [-1,1].
// Deterministic so the ODE render, the neg-control, and the linearity check agree.
function makeRng(seed){
  let a = (seed >>> 0) || 1;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1;
  };
}

// THE RESONATOR RENDER (exact 2×2 matrix-exponential ODE integrator). Each mode is a
// damped harmonic oscillator  ẍ + (ω/Q)·ẋ + ω²·x = u(t)  driven by a SHARED seeded
// white-noise force u. We advance the state [x; v] each sample by the EXACT discrete
// transition Φ = exp(M·dt), M = [[0,1],[−ω²,−2α]] (α = ω/2Q), so there is no
// integrator drift — the closed-form damped-oscillator matrix exponential:
//     Φ = e^(−α dt) · [[ cos+ (α/ω_d) sin,        (1/ω_d) sin       ],
//                      [ −(ω²/ω_d) sin,           cos − (α/ω_d) sin ]]
// with ω_d = ω·√(1−1/4Q²). The force enters the velocity each step (an impulse of
// momentum u·dt). `modes` is an array of { freq, weight }; their weighted x's are
// summed — ONE mode for the jug, three (f,2f,3f) for the harmonic-ladder control.
// LINEAR in `gain`: gain scales the drive, so the whole output scales by gain — a
// power-of-two gain reproduces the waveform bit-for-bit ×gain (LEG 5 leans on this).
function renderResonator(modes, opts = {}){
  const Q = opts.Q ?? 32;
  const seed = opts.seed ?? 3;
  const gain = opts.gain ?? 1;
  const sr = opts.sr ?? 44100;
  const seconds = opts.seconds ?? 1.0;
  const total = Math.max(2, Math.floor(seconds * sr));
  const dt = 1 / sr;
  const rng = makeRng(seed);                       // the SHARED seeded white-noise drive
  const drive = new Float64Array(total);
  for (let i = 0; i < total; i++) drive[i] = gain * rng();
  const out = new Float64Array(total);
  for (const mode of modes){
    const w = 2 * Math.PI * mode.freq;             // ω — the mode's natural angular frequency
    const alpha = w / (2 * Q);                     // α — the decay rate ζω
    const wd = w * Math.sqrt(Math.max(1e-12, 1 - 1 / (4 * Q * Q)));   // ω_d — the damped frequency
    const e = Math.exp(-alpha * dt);
    const cs = Math.cos(wd * dt), sn = Math.sin(wd * dt);
    const phi00 = e * (cs + (alpha / wd) * sn);    // the exact transition matrix Φ
    const phi01 = e * (sn / wd);
    const phi10 = e * (-(w * w / wd) * sn);
    const phi11 = e * (cs - (alpha / wd) * sn);
    const weight = mode.weight ?? 1;
    let x = 0, v = 0;
    for (let i = 0; i < total; i++){
      const nx = phi00 * x + phi01 * v;            // homogeneous step (matrix-exp)
      const nv = phi10 * x + phi11 * v;
      x = nx; v = nv + drive[i] * dt;              // the force: an impulse of momentum u·dt
      out[i] += weight * x;
    }
  }
  return out;
}

// Goertzel magnitude of buf[s..e) at frequency f (Hz) — the amplitude of one
// spectral line, normalized by window length. Used to measure each partial n·f_H:
// the jug lights only f_H; the ladder control lights 1,2,3·f_H.
function goertzel(buf, s, e, f, sr = 44100){
  s = Math.max(0, s | 0); e = Math.min(buf.length, e | 0);
  const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = s; i < e; i++){ const s0 = buf[i] + c * s1 - s2; s2 = s1; s1 = s0; }
  const re = s1 - s2 * Math.cos(w), im = s2 * Math.sin(w);
  const Nw = e - s;
  return Nw > 0 ? Math.sqrt(re * re + im * im) / Nw : 0;
}

// the dominant peak frequency of buf[s..e) over [fLo, fHi] by a Goertzel scan refined
// by parabolic interpolation — used to show the gain×8 render's pitch is bit-identical.
function dominantPeak(buf, s, e, fLo, fHi, sr = 44100, step = 0.5){
  let bestF = fLo, best = -Infinity;
  for (let f = fLo; f <= fHi; f += step){ const a = goertzel(buf, s, e, f, sr); if (a > best){ best = a; bestF = f; } }
  const y0 = goertzel(buf, s, e, bestF - step, sr), y1 = best, y2 = goertzel(buf, s, e, bestF + step, sr);
  const den = y0 - 2 * y1 + y2;
  const d = den !== 0 ? 0.5 * (y0 - y2) / den : 0;
  return bestF + Math.max(-0.5, Math.min(0.5, d)) * step;
}

// ── runJugSelfTest(A, V, Leff) — the SOLE ORACLE. Same shape as the sibling leaves:
// { pass, total, lines:[{name, ok, detail}] }. The in-page pill and the Node twin
// both call THIS, so they cannot disagree. (A,V,Leff) is the baseline geometry. The
// five legs are GEOMETRY-FREE (they assert identities & interval RATIOS, never a
// pixel or an absolute Hz), so the A3 retune is free. All tolerances pinned ONCE.
function runJugSelfTest(A, V, Leff){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // the pinned tolerances (relative, except cents which is absolute):
  const IDENT_TOL = 1e-12;     // the lumped identity & ρ-independence, relative
  const RATIO_TOL = 1e-12;     // each lever's interval ratio, relative
  const NEG_FLOOR = 1e-3;      // the jug's (E₂²+E₃²)/E₁² must sit BELOW this (single mode)
  const NEG_ALIVE = 0.1;       // the ladder control's same ratio must EXCEED this (partials present)
  const NEG_DROP = 100;        // the ladder/jug ratio must be at least this (the jug is no ladder)
  const CENTS_TOL = 5;         // each lever's interval within this many cents of the exact value

  // LEG 1 — THE LUMPED IDENTITY + ρ-INDEPENDENCE (a mass on a spring): across a 400-
  //   geometry sweep, (2π·f_H)² equals k/m to <1e-12 relative (the Helmholtz law IS
  //   √(k/m), reached two disjoint ways), AND f_H is INDEPENDENT of the air density ρ
  //   (it cancels) — √(k/m) at ρ=0.5 equals √(k/m) at ρ=5.0 to <1e-12 relative.
  {
    let ok = true, worstId = 0, worstRho = 0;
    const rng = makeRng(20240626);
    for (let i = 0; i < 400; i++){
      const Ai = A * (0.3 + 2.7 * (rng() * 0.5 + 0.5));      // random physical geometry
      const Vi = V * (0.3 + 2.7 * (rng() * 0.5 + 0.5));
      const Li = Leff * (0.3 + 3.7 * (rng() * 0.5 + 0.5));
      const omega = 2 * Math.PI * helmholtzFreq({ A: Ai, V: Vi, Leff: Li });
      const k = springConstant(Ai, Vi), m = slugMass(Ai, Li);
      const omLump = omegaFromLumped(k, m);                 // √(k/m), the mechanical route
      worstId = Math.max(worstId, Math.abs(omega - omLump) / omLump);
      const omLo = omegaFromLumped(springConstant(Ai, Vi, 0.5), slugMass(Ai, Li, 0.5));
      const omHi = omegaFromLumped(springConstant(Ai, Vi, 5.0), slugMass(Ai, Li, 5.0));
      worstRho = Math.max(worstRho, Math.abs(omLo - omHi) / omHi);
      if (worstId >= IDENT_TOL || worstRho >= IDENT_TOL) ok = false;
    }
    T('LEG 1 — the lumped identity: across a 400-geometry sweep (2π·f_H)² === k/m to <1e-12 relative (the Helmholtz pitch IS √(k/m) — a MASS m=ρA·L_eff on a SPRING k=ρc²A²/V, reached two disjoint ways), and f_H is INDEPENDENT of the air density ρ (it cancels: √(k/m) at ρ=0.5 === at ρ=5.0 to <1e-12)',
      ok, ok ? `identity worst rel Δ ${worstId.toExponential(2)} · ρ-independence worst rel Δ ${worstRho.toExponential(2)} (both < 1e-12, over 400 geometries)`
             : `identity rel Δ ${worstId.toExponential(2)} / ρ-dep rel Δ ${worstRho.toExponential(2)}`);
  }

  // LEG 2 — HALVE THE AIR ⇒ +√2 (a tritone): f_H ∝ 1/√V, so f_H(A,V/2,L)/f_H(A,V,L) =
  //   √2 to <1e-12 relative ⇒ exactly +600.000¢. Pour water in to halve the air-space
  //   and the hum jumps a tritone.
  {
    const r = helmholtzFreq({ A, V: V / 2, Leff }) / helmholtzFreq({ A, V, Leff });
    const cents = centsRatio(r);
    const ok = Math.abs(r - Math.SQRT2) / Math.SQRT2 < RATIO_TOL && Math.abs(cents - 600) < CENTS_TOL;
    T('LEG 2 — HALVE THE AIR (V→V/2) ⇒ ×√2, a tritone: f_H ∝ 1/√V, so halving the air-space multiplies the pitch by exactly √2 (+600.000¢) — proven scale-free, to <1e-12 relative',
      ok, `ratio ${r.toFixed(9)} vs √2 (rel Δ ${(Math.abs(r - Math.SQRT2) / Math.SQRT2).toExponential(2)}) = ${cents.toFixed(3)}¢`);
  }

  // LEG 3 — DOUBLE THE THROAT ⇒ +√2 (a tritone via a DIFFERENT lever): f_H ∝ √A, so
  //   f_H(2A,V,L)/f_H(A,V,L) = √2 ⇒ +600.000¢. The SAME interval the air gives, by area.
  {
    const r = helmholtzFreq({ A: 2 * A, V, Leff }) / helmholtzFreq({ A, V, Leff });
    const cents = centsRatio(r);
    const ok = Math.abs(r - Math.SQRT2) / Math.SQRT2 < RATIO_TOL && Math.abs(cents - 600) < CENTS_TOL;
    T('LEG 3 — DOUBLE THE THROAT (A→2A) ⇒ ×√2, the same tritone by a DIFFERENT lever: f_H ∝ √A, so doubling the bore AREA multiplies the pitch by exactly √2 (+600.000¢) — to <1e-12 relative',
      ok, `ratio ${r.toFixed(9)} vs √2 (rel Δ ${(Math.abs(r - Math.SQRT2) / Math.SQRT2).toExponential(2)}) = ${cents.toFixed(3)}¢`);
  }

  // LEG 4 — QUADRUPLE THE NECK ⇒ −octave: f_H ∝ 1/√L_eff, so f_H(A,V,4L)/f_H(A,V,L) =
  //   ½ to <1e-12 relative ⇒ exactly −1200.000¢. Stretch the neck four-fold and the
  //   hum drops one clean octave.
  {
    const r = helmholtzFreq({ A, V, Leff: 4 * Leff }) / helmholtzFreq({ A, V, Leff });
    const cents = centsRatio(r);
    const ok = Math.abs(r - 0.5) / 0.5 < RATIO_TOL && Math.abs(cents - (-1200)) < CENTS_TOL;
    T('LEG 4 — QUADRUPLE THE NECK (L_eff→4·L_eff) ⇒ ×½, an octave down: f_H ∝ 1/√L_eff, so quadrupling the effective neck length halves the pitch exactly (−1200.000¢) — to <1e-12 relative',
      ok, `ratio ${r.toFixed(9)} vs ½ (rel Δ ${(Math.abs(r - 0.5) / 0.5).toExponential(2)}) = ${cents.toFixed(3)}¢`);
  }

  // LEG 5 — THE SINGLE-MODE NEGATIVE CONTROL (the ODE render, Q=32/seed=3, fixed HERE
  //   so the page's live ring Q never leaks in): strike the lumped resonator with
  //   broadband noise and only f_H survives — (E₂²+E₃²)/E₁² sits at the far-skirt
  //   floor (< 1e-3). Render a harmonic LADDER (modes at f,2f,3f, input-weighted n so
  //   the OUTPUT is a 1/n string spectrum) and that ratio jumps above 0.1 — a >100×
  //   gap: the jug is NO ladder, there is nothing at 2f. And the ODE is LINEAR — an
  //   8× drive (a power of two) reproduces the SAME waveform ×8 to the bit, so the
  //   measured pitch is identical: blowing harder is louder, never higher.
  {
    const Q5 = 32, seed5 = 3, sr5 = 44100, secs = 1.0;
    const fH = helmholtzFreq({ A, V, Leff });
    const jug = renderResonator([{ freq: fH, weight: 1 }], { Q: Q5, seed: seed5, sr: sr5, seconds: secs });
    // the harmonic-ladder control: modes at f,2f,3f, input-weighted so the RADIATED
    // partials measure as a 1/n string spectrum (E₂/E₁≈½, E₃/E₁≈⅓) — the weights
    // compensate the resonator's per-mode peak rolloff so the output is a real,
    // recognizable harmonic ladder (the thing the jug is NOT).
    const ladder = renderResonator(
      [{ freq: fH, weight: 1 }, { freq: 2 * fH, weight: 2.23 }, { freq: 3 * fH, weight: 7.57 }],
      { Q: Q5, seed: seed5, sr: sr5, seconds: secs });
    const m0 = Math.floor(0.1 * sr5), eN = jug.length;       // skip the 100 ms attack
    const E = (buf, n) => goertzel(buf, m0, eN, n * fH, sr5);
    const jugRatio = (E(jug, 2) ** 2 + E(jug, 3) ** 2) / (E(jug, 1) ** 2);
    const ladRatio = (E(ladder, 2) ** 2 + E(ladder, 3) ** 2) / (E(ladder, 1) ** 2);
    const drop = jugRatio > 0 ? ladRatio / jugRatio : Infinity;
    // linearity: an 8× drive ⇒ a bit-identical waveform ×8 ⇒ a bit-identical pitch.
    const jug8 = renderResonator([{ freq: fH, weight: 1 }], { Q: Q5, seed: seed5, sr: sr5, seconds: secs, gain: 8 });
    let worstLin = 0, maxAbs = 0;
    for (let i = 0; i < jug.length; i++){ const ref = 8 * jug[i]; maxAbs = Math.max(maxAbs, Math.abs(ref)); worstLin = Math.max(worstLin, Math.abs(jug8[i] - ref)); }
    const linRel = maxAbs > 0 ? worstLin / maxAbs : 0;
    const peak1 = dominantPeak(jug, m0, eN, fH * 0.8, fH * 1.2, sr5);
    const peak8 = dominantPeak(jug8, m0, eN, fH * 0.8, fH * 1.2, sr5);
    const pitchIdentical = peak1 === peak8;
    const ok = jugRatio < NEG_FLOOR && ladRatio > NEG_ALIVE && drop > NEG_DROP && pitchIdentical && linRel < 1e-12;
    T('LEG 5 — the single-mode negative control (the matrix-exp ODE render, Q=32/seed=3): a broadband strike leaves ONLY f_H alive — (E₂²+E₃²)/E₁² sits at the resonator\'s far-skirt floor (<1e-3) — while a harmonic LADDER driven the same way lights 2f,3f (ratio >0.1), a >100× gap; and the ODE is LINEAR so an 8× drive gives a bit-identical waveform ×8 and an identical pitch (louder, never higher)',
      ok, ok ? `jug (E₂²+E₃²)/E₁² = ${jugRatio.toExponential(2)} (<1e-3, single mode) · ladder = ${ladRatio.toFixed(3)} (>0.1) · ${(drop >= 1e4 ? drop.toExponential(1) : Math.round(drop) + '×')} gap · gain×8 waveform bit-identical (rel Δ ${linRel.toExponential(1)}), pitch ${peak1.toFixed(3)}≡${peak8.toFixed(3)} Hz`
             : `jug ${jugRatio.toExponential(2)} / ladder ${ladRatio.toFixed(3)} / drop ${drop} / pitchEq ${pitchIdentical} / linRel ${linRel.toExponential(2)}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== JUG CORE END =====

export {
  C_AIR, RHO_AIR, END_CORR, A0, V0, LEFF0,
  helmholtzFreq, springConstant, slugMass, omegaFromLumped, centsRatio,
  makeRng, renderResonator, goertzel, dominantPeak, runJugSelfTest,
  semiToFreq, noteName,
};
