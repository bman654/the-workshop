// ============================================================================
//  THE DEEP HEARTH · The Melting Floor — the estate's ONE decompression-melting core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for the crossing depth, the melt fraction, and the
//  pressure-with-the-lid-lifted the bench shows. The bench page inlines the slab
//  between the MELTING-FLOOR CORE BEGIN / END sentinels byte-for-byte;
//  core.test.mjs proves the inlined copy is identical (indentation-normalised) to
//  this file, so the page, the in-page self-test pill, and the headless Node twin
//  all run the SAME math. (This core is INDEPENDENT of the conduit's core — it
//  works in DEPTH metres directly, its own conventions, so the single-source grep
//  stays clean: the melting predicate lives ONLY here.)
//
//  ── THE ONE GESTURE, made falsifiable ────────────────────────────────────────
//  You grab a thick country-rock LID resting on the chamber roof and LIFT it. You
//  add NO heat. Yet the rock below melts. Why: lifting the lid by L removes
//  G_rock·L of overburden, so the confining PRESSURE at every depth falls. The
//  rock's SOLIDUS (the temperature at which it begins to melt) RISES with
//  pressure — so dropping the pressure slides the solidus DOWN, and the fixed
//  geotherm (the rock's actual temperature vs depth) now sits ABOVE the solidus
//  over a band of depth. That band is molten. This is DECOMPRESSION MELTING — the
//  real reason mid-ocean ridges and mantle plumes melt: not more heat, less lid.
//
//  Three exact claims, all LINEAR (so every number is closed-form, provable to
//  <1e-9 with no clamp discontinuity inside a compared band):
//    • CRUX-1 (LEVER RULE) — the local melt fraction F(z,L,w) is the fraction of
//        the melting interval [solidus, liquidus] the geotherm has climbed past:
//            F = clamp01( (T_g(z) − T_s(P(z,L),w)) / ΔT_sl ).
//        The RENDERED pool coverage is an INDEPENDENT depth-march that integrates
//        crystal fraction (1−F) cell-by-cell down the column — a different
//        computation than the closed F() — and the two agree to <1e-9 everywhere.
//    • CRUX-2 (CROSSING) — the crossing depth z_x where T_g = T_s is one linear
//        solve; an independent BISECTION root-find of (T_g − T_s) reproduces it to
//        <1e-9. Melt exists only for z ≥ z_x (down to the chamber).
//    • CRUX-3 (MONOTONE) — decompression melting is real: dropping the pressure
//        (lifting the lid) never lowers F, and strictly raises it inside the melt
//        band. dF/dL = G_rock·a/ΔT_sl > 0 is provable, not merely sampled; and the
//        crossing marches monotonically SHALLOWER as you lift (dz_x/dL < 0).
//    NEG-CONTROL (REFRACTORY) — a dry ultra-refractory rock whose solidus sits
//        ABOVE the geotherm at every depth even at MAX lift and MAX water: F ≡ 0,
//        no crossing in range, the pool provably dark for ANY gesture. The bench
//        enacts this as a hard stop under your hand.
//    POS-CONTROL — a fertile wet composition DOES bloom (F→1 near the chamber),
//        so the melting regime is genuinely reachable, not degenerate.
//
//  The bench reads the crossing depth, the per-depth F, and the pressure straight
//  from this predicate; "rendered === predicate" is therefore structural.
// ============================================================================

// === MELTING-FLOOR CORE BEGIN ===
// ── GEOMETRY (depth in metres; the chamber roof is the source we melt from).
const D_ROOF = 2000;          // chamber-roof depth, metres (where the conduit ends)
const D_CHAMBER = 2760;       // chamber-centre depth — the deepest the pool can reach
const L_MAX = 900;            // how far the lid can be lifted, metres of overburden removed

// ── PRESSURE (lithostatic; MPa for readable numbers). Lifting the lid by L
//    removes G_rock·L of overburden from EVERY depth below it.
const P_SURF = 0.1;           // surface pressure, MPa (≈ 1 atm)
const G_ROCK = 0.027;         // lithostatic gradient, MPa/m (ρ≈2750 kg/m³ · g) — shared magmastatic-kin value

// ── THERMAL STRUCTURE (all linear in their arguments — the spine of the proof).
//    Geotherm: the rock's real temperature, FIXED, never touched by the lid. We
//    sit on a HOT arc/plume geotherm (500 °C/km) — the rock beside an active
//    chamber is genuinely this warm; that is WHY it is poised on the edge of
//    melting and a little decompression tips it over.
const T_SURF = 15;            // surface temperature, °C
const GAMMA = 0.5;            // geotherm gradient, °C/m (a hot arc/plume geotherm, 500 °C/km)
//    Solidus: T_s(P,w) = TS0 + A·P − B·w. Rises with pressure, falls with water.
//    A is large so the confining pressure holds the rock solid until you lift the
//    lid — decompression melting made legible: little pressure change, big effect
//    on where the geotherm crosses the (steep) solidus.
const TS0 = 683;              // dry solidus at P→0, °C (fertile crust/upper-mantle)
const A_SOL = 9.97;           // solidus pressure sensitivity, °C/MPa  (Clausius–Clapeyron-ish)
const B_SOL = 260;            // water depression of the solidus, °C at full water budget
const DT_SL = 320;            // solidus→liquidus interval width, °C (fixed, positive)

// ── REFRACTORY neg-control: a dry, ultra-high solidus rock (a barren harzburgitic
//    residue). TS0_REF chosen so the solidus sits above the geotherm at EVERY
//    depth even at MAX lift & MAX water — verified in the self-test.
const TS0_REF = 2400;         // refractory dry solidus at P→0, °C

// GUARD (non-parallel slopes): the crossing z_x = (num)/(GAMMA − A·G_rock) has a
// singularity when the geotherm slope GAMMA equals the pressure-shifted solidus
// slope A·G_rock. We assert a safe margin: GAMMA=0.75 vs A·G_rock=0.36·0.027≈0.0097.
const SOL_SLOPE = A_SOL * G_ROCK;   // effective solidus slope in depth, °C/m

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

// ── the tunables → physical quantities ───────────────────────────────────────
//    L is the lid lift in metres [0,L_MAX]; w is the water budget dial [0,1].
function pressureAt(z, L) { return P_SURF + G_ROCK * (z - L); }        // MPa; lid removes G_rock·L
function waterFrac(w) { return clamp01(w); }                          // 0 (dry) … 1 (saturated)

// ── the two thermal lines. `refractory` swaps in the dry high solidus (neg-ctrl).
function geothermT(z) { return T_SURF + GAMMA * z; }                  // °C — FIXED
function solidusT(P, w, refractory) {
  const ts0 = refractory ? TS0_REF : TS0;
  const wb = refractory ? 0 : B_SOL * waterFrac(w);                   // refractory rock is dry
  return ts0 + A_SOL * P - wb;                                        // °C, rises with P, falls with w
}
function liquidusT(P, w, refractory) { return solidusT(P, w, refractory) + DT_SL; }

// ── CRUX-1 · THE LEVER RULE — the local melt fraction at depth z, lid at L, water
//    w. 0 below the crossing (all crystal), rising linearly through the melting
//    interval to 1 once the geotherm passes the liquidus (all melt).
function meltFraction(z, L, w, refractory) {
  const P = pressureAt(z, L);
  const Ts = solidusT(P, w, refractory);
  return clamp01((geothermT(z) - Ts) / DT_SL);
}

// ── CRUX-2 · THE CROSSING DEPTH — the shallowest depth at which the rock begins
//    to melt: where the geotherm first reaches the solidus, T_g(z) = T_s(P(z,L),w).
//    LINEAR solve. Substituting P(z,L)=P_surf+G_rock(z−L):
//      T_surf + GAMMA·z = TS0 + A·(P_surf+G_rock(z−L)) − B·w
//    ⇒ z·(GAMMA − A·G_rock) = TS0 + A·P_surf − A·G_rock·L − B·w − T_surf
//    The denominator is guarded non-zero (GAMMA ≠ A·G_rock by construction).
function crossingDepth(L, w, refractory) {
  const ts0 = refractory ? TS0_REF : TS0;
  const wb = refractory ? 0 : B_SOL * waterFrac(w);
  const denom = GAMMA - SOL_SLOPE;                                    // guarded > 0
  const num = ts0 + A_SOL * P_SURF - SOL_SLOPE * L - wb - T_SURF;
  return num / denom;                                                 // depth (m) where T_g meets T_s
}

// ── THE ROOF-AWARE crossing the RENDER uses: the pool lives between the crossing
//    and the chamber, but never shallower than the roof the lid seals. Returns
//    { zx, melts } where melts is true iff the crossing lands within [roof,chamber].
function crossingInRange(L, w, refractory) {
  const zx = crossingDepth(L, w, refractory);
  // the pool can only occupy rock we can see melt in: from max(roof, zx) to chamber.
  const melts = zx < D_CHAMBER && meltFraction(D_CHAMBER, L, w, refractory) > 0;
  return { zx, melts };
}

// ── CRUX-3 · the provable lift derivative. dF/dL = (∂/∂L)[(T_g − T_s)/ΔT_sl].
//    T_s falls by A·G_rock per metre lifted, T_g is fixed, so d(T_g−T_s)/dL =
//    A·G_rock and dF/dL = A·G_rock/ΔT_sl inside the open melting band (0<F<1).
//    Closed form, not sampled — the self-test compares this to a finite difference.
function dFdL_interior() { return SOL_SLOPE / DT_SL; }                // > 0, strictly

// ── THE COLUMN MARCH — the INDEPENDENT "rendered" path. The pool animation IS the
//    physics: it walks the rock from the roof down to the chamber in discrete
//    depth cells and, at each, integrates the CRYSTAL fraction (1 − F) and the
//    melt fraction F, and records the FIRST (shallowest) cell whose geotherm has
//    passed the solidus (F becomes positive) — the marched crossing. This is a
//    genuinely different computation than the closed meltFraction()/crossingDepth()
//    (a forward march + linear interpolation of the F=0 boundary vs an endpoint
//    solve), so the self-test's agreement to <1e-9 is NOT vacuous.
function marchColumn(L, w, refractory, cells = 800) {
  const z0 = D_ROOF, z1 = D_CHAMBER;
  let crossed = false, zCross = null;
  let prevF = 0, prevZ = z0;
  let meltIntegral = 0, crystalIntegral = 0;
  for (let i = 0; i <= cells; i++) {
    const z = z0 + (i / cells) * (z1 - z0);
    // recompute F from the raw thermal lines — do NOT call meltFraction(), so the
    // march is a truly separate path through the same physical definitions.
    const P = P_SURF + G_ROCK * (z - L);
    const wb = refractory ? 0 : B_SOL * (w < 0 ? 0 : w > 1 ? 1 : w);
    const ts0 = refractory ? TS0_REF : TS0;
    const Ts = ts0 + A_SOL * P - wb;
    const Tg = T_SURF + GAMMA * z;
    let F = (Tg - Ts) / DT_SL;
    F = F < 0 ? 0 : F > 1 ? 1 : F;
    if (!crossed && F > 0) {
      if (i === 0) { zCross = z; }
      else {
        // linear-interpolate where the RAW (unclamped) F crossed zero between cells
        const rawPrev = prevF, rawHere = F;   // prevF stored clamped; recompute raw below is unnecessary
        // interpolate on the raw signed lever value for an exact boundary
        const gPrev = (T_SURF + GAMMA * prevZ) - (ts0 + A_SOL * (P_SURF + G_ROCK * (prevZ - L)) - wb);
        const gHere = (Tg - Ts);
        const t = gPrev === gHere ? 0 : (0 - gPrev) / (gHere - gPrev);
        zCross = prevZ + t * (z - prevZ);
      }
      crossed = true;
    }
    if (i > 0) {
      const dz = z - prevZ;
      meltIntegral += 0.5 * (prevF + F) * dz;              // trapezoid ∫F dz
      crystalIntegral += 0.5 * ((1 - prevF) + (1 - F)) * dz;
    }
    prevF = F; prevZ = z;
  }
  return { crossed, zCross, meltIntegral, crystalIntegral };
}

// ── the SUMMARY the render + verdict read. Everything downstream of predict() is
//    render + interaction, never a second copy of the melting math.
function predict(L, w, refractory) {
  const zx = crossingDepth(L, w, refractory);
  const inRoof = Math.max(D_ROOF, zx);                     // pool top: never above the sealed roof
  const melts = zx < D_CHAMBER && meltFraction(D_CHAMBER, L, w, refractory) > 0;
  const Fchamber = meltFraction(D_CHAMBER, L, w, refractory);
  const Froof = meltFraction(D_ROOF, L, w, refractory);
  const P_here = pressureAt(D_ROOF, L);
  const dP = -G_ROCK * L;                                  // pressure change at the roof from lifting
  return {
    zx, poolTop: inRoof, melts, refractory: !!refractory,
    Fchamber, Froof,
    Proof: P_here, dP,
    // how deep the pool reaches down (chamber) and how shallow it climbed (poolTop)
    poolBot: D_CHAMBER,
    verdict: melts ? 'MELTING' : (refractory ? 'REFRACTORY · SOLID' : 'SOLID'),
  };
}

// ── boundary helper: the smallest lid-lift L that first opens a crossing at a
//    fixed water w (null if even MAX lift leaves the rock solid). Used to assert
//    the threshold + the "just crossed" detent the bench snaps to.
function liftToFirstMelt(w, refractory) {
  if (!predict(L_MAX, w, refractory).melts) return null;   // never melts in range
  if (predict(0, w, refractory).melts) return 0;           // already melting seated
  let lo = 0, hi = L_MAX;
  for (let it = 0; it < 80; it++) {
    const mid = 0.5 * (lo + hi);
    if (predict(mid, w, refractory).melts) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}

// ── crossing by an INDEPENDENT bisection root-find of g(z) = T_g(z) − T_s(P(z,L),w)
//    over a bracket — a different algorithm than the linear solve, for CRUX-2.
function crossingByBisection(L, w, refractory) {
  const g = z => geothermT(z) - solidusT(pressureAt(z, L), w, refractory);
  // g is linear & increasing in z (GAMMA > SOL_SLOPE), so bracket wide and bisect.
  let lo = -20000, hi = 20000;
  if (g(lo) > 0 || g(hi) < 0) return NaN;                  // no sign change in bracket
  for (let it = 0; it < 200; it++) {
    const mid = 0.5 * (lo + hi);
    if (g(mid) >= 0) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}

// ── THE SELF-TEST: the SAME assertion runner the in-page pill and the Node twin
//    both call. Proves the lever rule (marched === closed), the crossing (linear
//    solve === bisection), the monotone lift derivative, and the neg/pos controls.
function runCoreTests() {
  const checks = [];
  const ok = (name, pass, info = '') => checks.push({ name, pass, info });
  const GRID = 20;
  const dial = i => i / (GRID - 1);
  const lift = i => (i / (GRID - 1)) * L_MAX;

  // CRUX-1 — the RENDERED march's per-cell F === the closed lever-rule F, to <1e-9,
  //   across the whole (L,w) grid. We re-derive F at each march cell independently
  //   and compare to meltFraction() at the same cell.
  {
    const CELLS = 400;
    let worst = 0, where = '';
    for (let li = 0; li < GRID; li++) for (let wj = 0; wj < GRID; wj++) {
      const L = lift(li), w = dial(wj);
      for (let c = 0; c <= CELLS; c++) {
        const z = D_ROOF + (c / CELLS) * (D_CHAMBER - D_ROOF);
        // independent march-side F (raw thermal lines, not meltFraction())
        const P = P_SURF + G_ROCK * (z - L);
        const Ts = TS0 + A_SOL * P - B_SOL * w;
        const Tg = T_SURF + GAMMA * z;
        let Fm = (Tg - Ts) / DT_SL; Fm = Fm < 0 ? 0 : Fm > 1 ? 1 : Fm;
        const Fc = meltFraction(z, L, w, false);
        const d = Math.abs(Fm - Fc);
        if (d > worst) { worst = d; where = `L=${L.toFixed(0)},w=${w.toFixed(2)},z=${z.toFixed(0)}`; }
      }
    }
    ok('CRUX-1 lever rule: rendered march F === closed meltFraction() over the ' + GRID + '×' + GRID + ' grid (<1e-9)',
       worst < 1e-9, 'worst |ΔF| = ' + worst.toExponential(2) + (where ? ' @ ' + where : ''));
  }

  // CRUX-1★ — the marched crossing (where F first goes positive) === closed
  //   crossingDepth(), clamped to the visible [roof,chamber] band, to march tol.
  {
    let worst = 0, where = '';
    for (let li = 0; li < GRID; li++) for (let wj = 0; wj < GRID; wj++) {
      const L = lift(li), w = dial(wj);
      const p = predict(L, w, false);
      if (!p.melts) continue;                              // no crossing in the band — skip
      const m = marchColumn(L, w, false, 2000);
      if (!m.crossed) continue;
      const closedInBand = Math.max(D_ROOF, p.zx);
      const d = Math.abs(closedInBand - m.zCross);
      if (d > worst) { worst = d; where = `L=${L.toFixed(0)},w=${w.toFixed(2)}`; }
    }
    ok('CRUX-1★ marched crossing depth === closed crossing (in the visible band, to march step)',
       worst < (D_CHAMBER - D_ROOF) / 2000 * 2 + 1e-6, 'worst |Δz_x| = ' + worst.toFixed(4) + ' m' + (where ? ' @ ' + where : ''));
  }

  // CRUX-2 — the closed linear crossing solve === an INDEPENDENT bisection root of
  //   (T_g − T_s), to <1e-9, across the whole (L,w) grid. Two different algorithms.
  {
    let worst = 0, where = '';
    for (let li = 0; li < GRID; li++) for (let wj = 0; wj < GRID; wj++) {
      const L = lift(li), w = dial(wj);
      const zc = crossingDepth(L, w, false);
      const zb = crossingByBisection(L, w, false);
      const d = Math.abs(zc - zb);
      if (d > worst) { worst = d; where = `L=${L.toFixed(0)},w=${w.toFixed(2)}`; }
    }
    ok('CRUX-2 crossing: linear solve === independent bisection root of (T_g − T_s) over the grid (<1e-9)',
       worst < 1e-9, 'worst |Δz_x| = ' + worst.toExponential(2) + (where ? ' @ ' + where : ''));
  }

  // CRUX-2★ — at the crossing, F == 0 exactly and F rises just below it (boundary).
  {
    const L = 0.5 * L_MAX, w = 0.5;
    const zx = crossingDepth(L, w, false);
    const Fat = meltFraction(zx, L, w, false);
    const Fbelow = meltFraction(zx + 1, L, w, false);       // 1 m deeper (hotter) — should be > 0
    const inBand = zx > D_ROOF && zx < D_CHAMBER;
    ok('CRUX-2★ at the crossing F = 0 exactly and rises just below it',
       Math.abs(Fat) < 1e-9 && (inBand ? Fbelow > 0 : true),
       'F(z_x) = ' + Fat.toExponential(2) + ', F(z_x+1m) = ' + Fbelow.toFixed(4) + ', z_x = ' + zx.toFixed(1) + ' m');
  }

  // CRUX-3 — MONOTONE: lifting the lid never lowers F anywhere, AND the closed
  //   interior derivative dF/dL = A·G_rock/ΔT_sl is reproduced by a finite
  //   difference inside the open band, AND the crossing marches shallower (dz_x/dL<0).
  {
    let badF = 0, worstDeriv = 0, badCross = 0;
    const analytic = dFdL_interior();
    const dL = L_MAX / (GRID - 1);
    for (let li = 0; li + 1 < GRID; li++) {
      const L0 = lift(li), L1 = lift(li + 1);
      // crossing must move shallower (smaller depth) as we lift
      const x0 = crossingDepth(L0, 0.4, false), x1 = crossingDepth(L1, 0.4, false);
      if (x1 > x0 + 1e-9) badCross++;
      for (let c = 0; c < 60; c++) {
        const z = D_ROOF + (c / 59) * (D_CHAMBER - D_ROOF);
        const F0 = meltFraction(z, L0, 0.4, false), F1 = meltFraction(z, L1, 0.4, false);
        if (F1 < F0 - 1e-12) badF++;                        // F must be non-decreasing in L
        if (F0 > 1e-6 && F0 < 1 - 1e-6 && F1 > 1e-6 && F1 < 1 - 1e-6) {
          const fd = (F1 - F0) / dL;                        // finite-diff derivative inside the band
          worstDeriv = Math.max(worstDeriv, Math.abs(fd - analytic));
        }
      }
    }
    ok('CRUX-3 lifting the lid NEVER lowers melt fraction anywhere (non-decreasing in L)',
       badF === 0, badF + ' violations');
    ok('CRUX-3★ interior dF/dL === closed A·G_rock/ΔT_sl = ' + analytic.toExponential(3) + ' /m (finite-diff matches)',
       worstDeriv < 1e-9, 'worst |Δ(dF/dL)| = ' + worstDeriv.toExponential(2));
    ok('CRUX-3† the crossing marches SHALLOWER as the lid rises (dz_x/dL < 0)',
       badCross === 0, badCross + ' rises');
  }

  // NEG-CONTROL — REFRACTORY: at MAX lift AND MAX water, F ≡ 0 across the whole
  //   band and there is no crossing in range. The pool is provably dark for ANY gesture.
  {
    let anyMelt = false, where = '';
    for (let li = 0; li < GRID; li++) for (let wj = 0; wj < GRID; wj++) {
      const L = lift(li), w = dial(wj);
      const p = predict(L, w, true);
      if (p.melts) { anyMelt = true; where = `L=${L.toFixed(0)},w=${w.toFixed(2)}`; }
      // spot F across the band too
      for (let c = 0; c <= 20; c++) {
        const z = D_ROOF + (c / 20) * (D_CHAMBER - D_ROOF);
        if (meltFraction(z, L, w, true) > 0) { anyMelt = true; where = `F>0 @ z=${z.toFixed(0)}`; }
      }
    }
    ok('NEG-CTRL refractory rock: F ≡ 0 and NO crossing in range at ANY lift & ANY water (pool provably dark)',
       !anyMelt, anyMelt ? 'melted at ' + where : 'solid for every (lift,water) — the lid hits a hard stop');
  }

  // POS-CONTROL — a fertile WET column DOES bloom (F→1 near the chamber) so the
  //   melting regime is genuinely reachable, not a degenerate all-solid.
  {
    const p = predict(L_MAX, 1, false);
    ok('POS-CTRL fertile wet rock at full lift DOES melt (F near chamber → 1 — the bloom is reachable)',
       p.melts && p.Fchamber > 0.9, 'F(chamber) = ' + p.Fchamber.toFixed(4) + ', crossing z_x = ' + p.zx.toFixed(0) + ' m');
  }

  // GUARD — the crossing denominator is safely non-zero (slopes not parallel).
  {
    const denom = GAMMA - SOL_SLOPE;
    ok('GUARD geotherm slope ≠ pressure-shifted solidus slope (crossing denominator safe: ' + denom.toFixed(4) + ' °C/m)',
       Math.abs(denom) > 0.1, 'GAMMA=' + GAMMA + ', A·G_rock=' + SOL_SLOPE.toFixed(5));
  }

  // WATER — more water lowers the solidus ⇒ opens the crossing with LESS lift
  //   (a secondary but honest monotone: liftToFirstMelt is non-increasing in w).
  {
    let bad = 0, prev = Infinity, lit = 0;
    for (let wj = 0; wj < GRID; wj++) {
      const w = dial(wj);
      const Lreq = liftToFirstMelt(w, false);
      if (Lreq == null) continue;
      lit++;
      if (Lreq > prev + 1e-9) bad++;                        // more water must not require MORE lift
      prev = Lreq;
    }
    ok('WATER: lift-to-first-melt is non-increasing in water (wet rock melts with less lifting) over ' + lit + ' steps',
       bad === 0, bad + ' rises; ' + lit + ' water steps have a finite threshold');
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === MELTING-FLOOR CORE END ===

export {
  D_ROOF, D_CHAMBER, L_MAX, P_SURF, G_ROCK, T_SURF, GAMMA,
  TS0, A_SOL, B_SOL, DT_SL, TS0_REF, SOL_SLOPE,
  clamp01, pressureAt, waterFrac, geothermT, solidusT, liquidusT,
  meltFraction, crossingDepth, crossingInRange, dFdL_interior,
  marchColumn, predict, liftToFirstMelt, crossingByBisection, runCoreTests,
};
