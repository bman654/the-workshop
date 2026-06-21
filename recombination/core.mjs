// ============================================================================
//  THE FOG THAT CLEARED — the estate's ONE recombination core (cosmology wing).
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every ionization fraction, mean-free-path,
//  optical-depth, and transparency number the room shows. The page inlines the
//  slab between the RECOMBINATION CORE BEGIN / END sentinels byte-for-byte;
//  core.test.mjs proves the inlined copy is identical (indentation-normalised)
//  to this file, so page, pill, and Node twin can never silently drift.
//
//  THE ONE IDEA — A HOT FOG CLEARS WHEN IT RECOMBINES, NOT WHEN IT WAITS. Early
//  on, the box is a plasma: free electrons everywhere, and a photon cannot fly a
//  step without scattering off one — the box is OPAQUE, a glowing fog. As you
//  COOL it (pull the temperature collar DOWN), electrons start to find protons and
//  fall into neutral atoms — RECOMBINATION. The free-electron fraction xₑ collapses,
//  the photon's mean free path λ = 1/(nₑσ) blows up toward infinity, and at one
//  sharp crossing the fog SNAPS transparent and the trapped light streams out: the
//  cosmic microwave background, released. The whole event is governed by ONE knob,
//  the temperature; ELAPSED TIME never enters the model. A box held HOT can wait
//  forever and never clear — transparency is born of recombination, not of time.
//
//  THE MATH — A DIMENSIONLESS SAHA EQUATION. We work in a reduced temperature
//  τ = kT/χ, where χ is the ionization SCALE (~13.6 eV is the illustrative unit
//  on the axis, never defended). The Saha ratio of a single declared illustrative
//  constant A is
//        S(τ) = A · τ^(3/2) · e^(−1/τ)        (0 if τ ≤ 0),
//  and the ionized fraction xₑ solves the Saha quadratic  xₑ²/(1−xₑ) = S, i.e.
//        xₑ = ( −S + √(S² + 4S) ) / 2.
//  We DO NOT evaluate that subtractive form — for tiny S it catastrophically
//  cancels in float and goes non-monotone. We use the algebraically identical but
//  numerically STABLE root
//        xₑ = 2S / ( S + √(S² + 4S) ),
//  which is monotone in S down to xₑ ≈ 1e-43 (verified). xₑ→1 when S→∞ (fully
//  ionized fog), xₑ→0 when S→0 (fully recombined, transparent).
//
//  THE MEAN FREE PATH is the soul number: λ(τ) = L0 / xₑ in box-widths. As the
//  box cools and xₑ→0, λ DIVERGES — the photon flies arbitrarily far between
//  scatters. The ONE shared predicate the whole scene reads — the glyph escape,
//  the fog dissolve, the SNAP, and the CMB flash — is
//        isTransparent(τ)  ⇔  λ(τ) ≥ CLEAR_LAMBDA,
//  so the picture you watch and the proof are the SAME threshold, fired at the
//  SAME τ. The optical depth is τ_opt = L / λ (NOT the temperature τ — different
//  τ): high when trapped, → 0 when clear.
//
//  THE NEG-CONTROL — A BOX HELD HOT. Pin τ = tauHot (above the χ-scale) and feed
//  it through the SAME meanFreePath/photonScatters path: xₑ stays high, λ stays
//  bounded and small, the fog never thins, the photon keeps ricocheting — for any
//  elapsed time. Time is not in the model; only τ is. So a held-hot box provably
//  cannot clear by waiting. Crossing the temperature LINE is what clears it.
// ============================================================================

// === RECOMBINATION CORE BEGIN ===
"use strict";

// ── THE SHIPPED SCENE ───────────────────────────────────────────────────────
// SAHA_A is the ONE declared illustrative constant — it sets where on the τ axis
// the ionization crossing sits; it defends NO physical recombination temperature.
const SCENE = {
  SAHA_A: 1e9,        // the illustrative Saha constant (sole magic number, declared)
  L0: 1.0,            // box-widths of mean free path at full ionization (xₑ = 1)
  BOX_L: 1.0,         // the box is one box-width across (optical depth = L/λ)
  CLEAR_LAMBDA: 1.5,  // λ (box-widths) at which the box reads TRANSPARENT
  tauHot: 0.30,       // the neg-control's held-hot reduced temperature (a fog)
  tauColdEnd: 0.012,  // the cold end of the cooling sweep (deeply recombined)
  tauHotEnd: 0.5,     // the hot end of the collar's τ range
};

// ── THE SAHA RATIO ──────────────────────────────────────────────────────────
// S(τ) = A·τ^(3/2)·e^(−1/τ). The exponential e^(−1/τ) is the ionization barrier:
// it vanishes super-exponentially as τ→0, so S collapses and the gas recombines.
function sahaS(tau, A){
  if (tau <= 0) return 0;
  return A * Math.pow(tau, 1.5) * Math.exp(-1 / tau);
}

// ── THE IONIZED FRACTION (the stable Saha root) ─────────────────────────────
// Solve xₑ²/(1−xₑ) = S for xₑ ∈ [0,1]. The textbook root (−S+√(S²+4S))/2
// catastrophically cancels for tiny S; we use the algebraically identical
//        xₑ = 2S / ( S + √(S²+4S) ),
// which is monotone and accurate down to xₑ ≈ 1e-43.
function ionizedFraction(tau, A){
  const S = sahaS(tau, A);
  if (!isFinite(S)) return 1;          // S → ∞ ⇒ fully ionized
  if (S <= 0) return 0;                // S = 0 ⇒ fully recombined
  const disc = Math.sqrt(S * S + 4 * S);
  return (2 * S) / (S + disc);
}

// ── THE MEAN FREE PATH (box-widths) ─────────────────────────────────────────
// λ = L0 / xₑ. Diverges to ∞ as xₑ → 0: with no free electrons left, a photon
// flies forever between scatters. (xₑ ≤ 0 ⇒ Infinity.)
function meanFreePath(tau, A){
  const xe = ionizedFraction(tau, A == null ? SCENE.SAHA_A : A);
  return xe <= 0 ? Infinity : SCENE.L0 / xe;
}

// ── THE OPTICAL DEPTH ───────────────────────────────────────────────────────
// τ_opt = L / λ across the box (NOT the temperature τ). High ⇒ opaque; → 0 ⇒ clear.
function opticalDepth(tau, A){
  const lam = meanFreePath(tau, A);
  return !isFinite(lam) ? 0 : SCENE.BOX_L / lam;
}

// ── THE ONE SHARED TRANSPARENCY PREDICATE ───────────────────────────────────
// The glyph escape, the fog dissolve, the SNAP, and the CMB flash ALL read THIS,
// so they fire at the SAME τ: the box is transparent once λ reaches CLEAR_LAMBDA.
function isTransparent(tau, A){
  return meanFreePath(tau, A) >= SCENE.CLEAR_LAMBDA;
}

// ── THE RECOMBINATION CROSSING τ* (where xₑ = ½ ⇔ S = ½) ─────────────────────
// Bisection on S(τ) = ½. Recomputed per-A so NO claim references an absolute
// temperature — the crossing is wherever the chosen illustrative A puts it.
function crossingTau(A){
  const a = A == null ? SCENE.SAHA_A : A;
  let lo = 1e-4, hi = 5.0;               // S(lo) ≈ 0, S(hi) ≫ ½ for any sane A
  for (let i = 0; i < 200; i++){
    const mid = 0.5 * (lo + hi);
    if (sahaS(mid, a) < 0.5) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

// ── THE TRACKED-PHOTON SCATTER RULE (pure) ──────────────────────────────────
// Does a photon scatter on a step of fractional length stepFrac (∈ (0,1])?
// Returns stepFrac < min(1, xₑ): above the crossing xₑ ≈ 1 ⇒ scatters nearly
// every step (a trapped random walk); below, xₑ → 0 ⇒ flies straight (free).
// The render layer owns the seeded RNG and passes stepFrac in; the core stays
// pure (no RNG, no wall-clock).
function photonScatters(tau, stepFrac, A){
  const xe = ionizedFraction(tau, A == null ? SCENE.SAHA_A : A);
  return stepFrac < Math.min(1, xe);
}

// ── THE SELF-TEST — the box proves its own claim ────────────────────────────
// FOUR claims, swept over SAHA_A ∈ {1e6, 1e9, 1e12} so nothing is wired to one
// constant. The page pill and the Node twin both call this.
//  A · λ DIVERGES as xₑ→0 (cold end λ ≫ crossing λ, xₑ < 1e-6).
//  B · λ MONOTONE-INCREASING as T falls (sweep τ DOWN, strict λ↑) — started BELOW
//      the xₑ≈1 plateau so the flat top doesn't trip a strict comparison.
//  C · NEG-CONTROL held hot ⇒ λ BOUNDED (small, xₑ still a fog) for any time.
//  D · picture === proof: photonScatters is high ABOVE τ* (trapped), low BELOW
//      (streaming), with a wide margin — the glyph reads the SAME function.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const A_SWEEP = [1e6, 1e9, 1e12];
  const { L0, tauHot, tauColdEnd } = SCENE;

  // ── CLAIM A — λ DIVERGES as xₑ → 0. At the cold end λ exceeds the crossing λ
  //    by > 1e6×, and xₑ there is < 1e-6 (a vanishing free-electron fraction).
  let aOk = true, aInfo = [];
  for (const A of A_SWEEP){
    const tauStar = crossingTau(A);
    const lamCross = meanFreePath(tauStar, A);       // λ at xₑ=½ ⇒ λ = 2·L0
    const lamCold = meanFreePath(tauColdEnd, A);
    const xeCold = ionizedFraction(tauColdEnd, A);
    const ok = (lamCold > 1e6 * lamCross) && (xeCold < 1e-6) && isFinite(lamCross);
    aOk = aOk && ok;
    aInfo.push('A=' + A.toExponential(0) + ': λcold/λ* ' + (lamCold / lamCross).toExponential(1) + ', xe ' + xeCold.toExponential(1));
  }
  log('A · λ DIVERGES as xₑ→0: cold-end λ > 1e6·λ(crossing) and xₑ(cold) < 1e-6 (per-A)',
      aOk, aInfo.join(' · '));

  // ── CLAIM B — λ MONOTONE-INCREASING as T falls. Sweep τ DOWN from JUST below the
  //    xₑ≈1 plateau (start where xₑ < 0.99, i.e. just above τ*) down to tauColdEnd,
  //    and assert STRICT λ(τ_{k+1}) > λ(τ_k). (On the plateau λ is flat — start below it.)
  let bOk = true, bInfo = [];
  for (const A of A_SWEEP){
    const tauStar = crossingTau(A);
    // find a τ_start just above τ* where xₑ has dropped below 0.99 (off the plateau)
    let tauStart = tauStar;
    for (let m = 1; m <= 400; m++){
      const t = tauStar + m * 0.0005 * tauStar + m * 1e-5;
      if (ionizedFraction(t, A) < 0.99){ tauStart = t; break; }
    }
    const N = 80;
    let prev = -Infinity, strict = true, lastXe = 1;
    for (let k = 0; k <= N; k++){
      const tau = tauStart + (tauColdEnd - tauStart) * (k / N);   // sweeps DOWN
      const lam = meanFreePath(tau, A);
      if (!(lam > prev)){ strict = false; break; }
      prev = lam; lastXe = ionizedFraction(tau, A);
    }
    const ok = strict && ionizedFraction(tauStart, A) < 0.99 && lastXe < 1e-3;
    bOk = bOk && ok;
    bInfo.push('A=' + A.toExponential(0) + ': strict ' + strict + ', xe(start) ' + ionizedFraction(tauStart, A).toFixed(3));
  }
  log('B · λ MONOTONE-INCREASING as T falls: strict λ↑ over the cooling sweep below the plateau (per-A)',
      bOk, bInfo.join(' · '));

  // ── CLAIM C — NEG-CONTROL held HOT ⇒ λ BOUNDED. At τ = tauHot (> χ-scale) λ is
  //    finite and small AND xₑ > 0.5 (still a fog). Time never enters — a held-hot
  //    box provably cannot clear by elapsed time.
  let cOk = true, cInfo = [];
  for (const A of A_SWEEP){
    const lamHot = meanFreePath(tauHot, A);
    const xeHot = ionizedFraction(tauHot, A);
    // bound: λ < 4·L0 (well inside the opaque regime) and a real fog (xₑ > 0.5)
    const ok = isFinite(lamHot) && lamHot < 4 * L0 && xeHot > 0.5 && !isTransparent(tauHot, A);
    cOk = cOk && ok;
    cInfo.push('A=' + A.toExponential(0) + ': λhot ' + lamHot.toFixed(3) + ', xe ' + xeHot.toFixed(3));
  }
  log('C · NEG-CONTROL held HOT ⇒ λ BOUNDED, xₑ>½, never transparent (no elapsed time in the model)',
      cOk, cInfo.join(' · '));

  // ── CLAIM D — PICTURE === PROOF. Over a fixed τ-grid, photonScatters returns true
  //    on a HIGH fraction ABOVE τ* (trapped) and a LOW fraction BELOW (streaming),
  //    with a large margin. The glyph the viewer watches reads THIS same function.
  let dOk = true, dInfo = [];
  const GRID = 64, stepFrac = 0.5;   // a representative half-box step
  for (const A of A_SWEEP){
    const tauStar = crossingTau(A);
    let above = 0, below = 0;
    for (let g = 1; g <= GRID; g++){
      const tAbove = tauStar * (1 + 0.5 * g / GRID);   // above τ* (hotter ⇒ ionized)
      const tBelow = tauStar * (0.5 * g / GRID);       // below τ* (cooler ⇒ neutral)
      if (photonScatters(tAbove, stepFrac, A)) above++;
      if (photonScatters(tBelow, stepFrac, A)) below++;
    }
    const fAbove = above / GRID, fBelow = below / GRID;
    const ok = fAbove > 0.9 && fBelow < 0.1 && (fAbove - fBelow) > 0.8;
    dOk = dOk && ok;
    dInfo.push('A=' + A.toExponential(0) + ': scatter↑ ' + fAbove.toFixed(2) + ' / ↓ ' + fBelow.toFixed(2));
  }
  log('D · picture === proof: photonScatters HIGH above τ* (trapped), LOW below (streaming), wide margin',
      dOk, dInfo.join(' · '));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === RECOMBINATION CORE END ===

export {
  SCENE,
  sahaS, ionizedFraction, meanFreePath, opticalDepth,
  isTransparent, crossingTau, photonScatters,
  runSelfTest,
};
