// ============================================================================
//  THE DEEP HEARTH · The Conduit — the estate's ONE volcano-conduit core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every pressure / viscosity / gas-fraction /
//  fragmentation number the wing shows. The bench page inlines the slab between
//  the DEEP-HEARTH CORE BEGIN / END sentinels byte-for-byte; core.test.mjs proves
//  the inlined copy is identical (indentation-normalised) to this file, so the
//  page, the in-page self-test pill, and the headless Node twin all run the SAME
//  math.
//
//  ── THE ONE CLAIM, made falsifiable ──────────────────────────────────────────
//  Whether a rising magma ERUPTS EFFUSIVELY (a coherent lava ooze) or FRAGMENTS
//  into an EXPLOSIVE jet is decided by ONE inequality on the gas VOLUME fraction:
//  the column fragments iff that fraction reaches φ_c = ¾ somewhere before the
//  vent (Sparks 1978, the foam-disruption criterion). Two dials feed it:
//    • SILICA S  — sets the melt's TYPE viscosity (basalt → rhyolite) and, with
//                  it, the bubble–melt COUPLING: a runny basalt lets bubbles rise
//                  out and DEGAS (open system, φ capped); a stiff rhyolite locks
//                  them in (closed system, φ free to grow).
//    • GAS w     — the dissolved-volatile budget. As the magma rises, pressure
//                  falls, solubility (Henry, C_s = s·√P) falls, and the surplus
//                  EXSOLVES into bubbles that EXPAND as the pressure drops.
//  The gas VOLUME fraction along the column is
//        φ(h) = n·v_g / (n·v_g + (1−n)·v_m),
//  with retained exsolved mass fraction n = χ(S)·max(0, W − C_s(P(h))), gas
//  specific volume v_g = K_gas / P (ideal-gas expansion), melt v_m = 1/ρ_melt.
//  φ is monotone increasing toward the vent (lower P ⇒ more exsolved AND more
//  expansion), so φ_max sits AT the vent. The eruption is EXPLOSIVE iff
//  φ_max ≥ ¾; the FRAGMENTATION PLANE is the height z_f below the vent where
//  φ(z_f) = ¾ (z_f < 0 ⇒ "above the vent" ⇒ effusive, no fragmentation in the
//  column). The render reads z_f and the EFFUSIVE/EXPLOSIVE word DIRECTLY from
//  this predicate, so "rendered === predicate" is structural.
//
//  ── WHY IT IS PROVABLY MONOTONE (the self-test's spine) ──────────────────────
//  The FRAGMENTATION PREDICATE depends on S only through χ(S) (and the type
//  viscosity that sets it) and on w only through the volatile budget W — never
//  through a term that could fight itself. χ(S) increases with S; the exsolved
//  surplus increases with w; φ increases in both; so φ_max(S,w) is monotone
//  increasing in BOTH dials and the EFFUSIVE→EXPLOSIVE boundary is a single
//  monotone curve. (The water-weakening of viscosity is real, but we keep it OUT
//  of the predicate — it only thins the FELT viscosity used to animate bubble &
//  ooze speed, `etaFeltLog` — precisely so the claim stays clean and monotone.)
//  NEG-CONTROLS fall straight out: gas→0 ⇒ no surplus ⇒ φ≡0 ⇒ NO silica
//  fragments; basalt ⇒ χ≈0 ⇒ even MAX gas degasses ⇒ stays effusive (viscosity,
//  not gas alone, gates the blast).
// ============================================================================

// === DEEP-HEARTH CORE BEGIN ===
// ── PHYSICAL CONSTANTS (SI-ish; pressures carried in MPa for readable numbers).
//    These set the DISPLAY scale; the CLAIM (monotone boundary, neg-controls,
//    φ_c=¾) holds for any positive choice — the self-test never hard-codes them.
const H_CONDUIT = 2000;        // conduit length, vent(top) to chamber roof(bottom), metres
const P_VENT = 0.1;            // pressure at the vent, MPa (≈ 1 atm)
const P_GRAD = 0.0225;         // magmastatic gradient, MPa/m (ρ≈2300 kg/m³ · g)
const PHI_C = 0.75;            // fragmentation threshold — Sparks (1978), the ONE number

const W_MAX = 0.06;            // gas dial 1.0 ⇒ 6 wt% dissolved volatiles
const SOL = 0.0042;            // Henry solubility coefficient, C_s = SOL·√P (P in MPa)

const A0 = 2.0, A1 = 6.0;      // type log10-viscosity: aType(S) = A0 + A1·S  (basalt 10² → rhyolite 10⁸ Pa·s)
const KW = 1.5;                // water-weakening of the FELT viscosity (display/animation ONLY, NOT the predicate)
const LOG_DEC = 5.0;           // log10-viscosity at which bubbles 50% couple (≈ dacite); χ is a sigmoid in logη
const CHI_SPREAD = 1.0;        // decades of logη over which coupling turns on

const K_GAS = 5.08e5;          // R_specific·T for water vapour, J/kg (≈462·1100) ⇒ v_g = K_GAS/P_Pa
const RHO_MELT = 2400;         // melt density, kg/m³ ⇒ v_m = 1/RHO_MELT
const V_M = 1 / RHO_MELT;      // melt specific volume, m³/kg

// ── named silica zones for the dial's engraved arcs (equal dial angle = a decade
//    of viscosity; the zone you sit in glows). Boundaries in S∈[0,1].
const SILICA_ZONES = [
  { name: 'BASALT',   s0: 0.00, s1: 0.25 },
  { name: 'ANDESITE', s0: 0.25, s1: 0.50 },
  { name: 'DACITE',   s0: 0.50, s1: 0.75 },
  { name: 'RHYOLITE', s0: 0.75, s1: 1.00 },
];

// ── dial → physical quantities ───────────────────────────────────────────────
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function silicaPct(S) { return 50 + 25 * clamp01(S); }       // SiO₂ wt%, 50 (basalt) → 75 (rhyolite)
function aType(S) { return A0 + A1 * clamp01(S); }           // log10 of the TYPE viscosity (silica only)
function etaTypeLog(S) { return aType(S); }                  // log10 η_type (gates coupling)
function etaFeltLog(S, w) { return aType(S) - KW * clamp01(w); } // log10 η FELT (water thins it) — DISPLAY ONLY
function zoneOf(S) {
  S = clamp01(S);
  for (const z of SILICA_ZONES) if (S >= z.s0 && S <= z.s1) return z.name;
  return SILICA_ZONES[SILICA_ZONES.length - 1].name;
}

// ── bubble–melt COUPLING χ(S) ∈ (0,1): a sigmoid in TYPE log-viscosity. Runny
//    basalt (low logη) ⇒ χ→0 (bubbles rise out, open-system degassing). Stiff
//    rhyolite (high logη) ⇒ χ→1 (bubbles locked in, closed system). Depends on S
//    ONLY — that is what keeps the predicate monotone in w.
function couplingChi(S) {
  const x = (LOG_DEC - aType(S)) / CHI_SPREAD;
  return 1 / (1 + Math.pow(10, x));
}

// ── pressure & solubility along the column. h is HEIGHT above the chamber roof,
//    h=H_CONDUIT at the vent (top). Pressure falls as you rise.
function pressureAt(h) { return P_VENT + P_GRAD * (H_CONDUIT - h); }   // MPa
function solubility(P) { return SOL * Math.sqrt(Math.max(0, P)); }     // saturation mass fraction at P
function volatileW(w) { return W_MAX * clamp01(w); }                   // total dissolved volatile budget

// ── EXSOLVED (mass fraction surplus over saturation) and the RETAINED part after
//    open-system degassing (× the coupling). Retained gas is what builds bubbles.
function exsolvedAt(w, h) { return Math.max(0, volatileW(w) - solubility(pressureAt(h))); }
function retainedAt(S, w, h) { return couplingChi(S) * exsolvedAt(w, h); }

// ── the GAS VOLUME FRACTION φ(h): retained gas mass n expanded as ideal gas at
//    P(h) against the melt. THIS is what fragments at φ_c. Monotone ↑ toward vent.
function phiAt(S, w, h) {
  const n = retainedAt(S, w, h);
  if (n <= 0) return 0;
  const P_Pa = pressureAt(h) * 1e6;
  const vg = K_GAS / P_Pa;
  const num = n * vg;
  return num / (num + (1 - n) * V_M);
}

// ── the EXSOLUTION HORIZON: the height where the melt first reaches saturation
//    (below it: clear undersaturated melt; above it: foaming). P_sat = (W/SOL)².
function exsolutionHeight(w) {
  const W = volatileW(w);
  if (W <= 0) return H_CONDUIT;                 // nothing dissolved ⇒ never foams
  const Psat = (W / SOL) * (W / SOL);
  const h = H_CONDUIT - (Psat - P_VENT) / P_GRAD;
  return Math.max(0, Math.min(H_CONDUIT, h));
}

// ── THE PREDICATE (closed form). φ is monotone ↑ in h, so φ_max = φ(vent). The
//    eruption is EXPLOSIVE iff φ_max ≥ φ_c. The FRAGMENTATION HEIGHT h_f solves
//    φ(h_f)=φ_c by bisection on [h_ex, H]; z_f = depth BELOW the vent = H − h_f.
//    Effusive ⇒ z_f reported NEGATIVE ("above the vent"), found by extrapolating
//    one magmastatic step so the render can slide the ghost plane continuously.
function predict(S, w) {
  const phimax = phiAt(S, w, H_CONDUIT);
  const explosive = phimax >= PHI_C;
  let hf, zf;
  if (explosive) {
    // bisect for φ(h_f) = φ_c on [exsolution horizon, vent]
    let lo = exsolutionHeight(w), hi = H_CONDUIT;
    // guard: φ(lo) ≤ φ_c ≤ φ(hi). If φ(lo) already ≥ φ_c, plane is at/below horizon.
    if (phiAt(S, w, lo) >= PHI_C) { hf = lo; }
    else {
      for (let it = 0; it < 80; it++) {
        const mid = 0.5 * (lo + hi);
        if (phiAt(S, w, mid) >= PHI_C) hi = mid; else lo = mid;
      }
      hf = 0.5 * (lo + hi);
    }
    zf = H_CONDUIT - hf;
  } else {
    // effusive: project how far ABOVE the vent the plane would lie (negative z_f).
    // A small, smooth surrogate = (φ_c − φ_max) scaled to a depth, so the readout
    // and the ghost band move continuously as the dials approach the boundary.
    hf = H_CONDUIT;
    zf = -(PHI_C - phimax) / Math.max(1e-9, PHI_C) * 600;   // ≤ 0, "above vent" metres
  }
  return {
    explosive, phimax, zf, hf,
    style: explosive ? 'EXPLOSIVE' : 'EFFUSIVE',
    silicaPct: silicaPct(S), zone: zoneOf(S),
    etaFeltLog: etaFeltLog(S, w), etaTypeLog: etaTypeLog(S),
    chi: couplingChi(S), exHeight: exsolutionHeight(w),
  };
}

// ── THE COLUMN MARCH — the INDEPENDENT "rendered" path. The animation IS the
//    physics: it walks the column bottom→vent in discrete height steps (exactly
//    what the rising parcel field does) and reports the FIRST height at which the
//    discretely-sampled φ reaches φ_c. This is a genuinely different computation
//    than the closed-form φ_max predicate (a forward march vs an endpoint test);
//    the self-test asserts the two AGREE over the whole dial grid with ZERO
//    disagreements — that is "rendered outcome === analytic predicate".
function marchColumn(S, w, steps = 400) {
  let crossed = false, hCross = -1;
  let prevPhi = 0, prevH = 0;
  for (let i = 0; i <= steps; i++) {
    const h = (i / steps) * H_CONDUIT;
    const phi = phiAt(S, w, h);
    if (!crossed && phi >= PHI_C) {
      // linear-interpolate the crossing height between the last two samples
      if (i === 0) { hCross = h; }
      else { const t = (PHI_C - prevPhi) / Math.max(1e-12, phi - prevPhi); hCross = prevH + t * (h - prevH); }
      crossed = true;
    }
    prevPhi = phi; prevH = h;
  }
  return { explosive: crossed, hCross, zfMarch: crossed ? (H_CONDUIT - hCross) : null };
}

// ── boundary helper: the smallest gas dial w that fragments at a fixed silica S,
//    by bisection (null if even MAX gas stays effusive at this S). Used to draw
//    + assert the monotone boundary curve.
function boundaryWForS(S) {
  if (predict(S, 1).explosive === false) return null;     // never fragments in range
  if (predict(S, 0).explosive === true) return 0;          // always fragments
  let lo = 0, hi = 1;
  for (let it = 0; it < 80; it++) {
    const mid = 0.5 * (lo + hi);
    if (predict(S, mid).explosive) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}

// ── THE SELF-TEST: the SAME assertion runner the in-page pill and the Node twin
//    both call. Proves the predicate is monotone, the rendered march agrees with
//    the closed predicate over an N×N dial grid with ZERO disagreements, the
//    boundary sits at φ=¾ exactly with z_f at the vent, and the neg-controls hold.
function runCoreTests() {
  const checks = [];
  const ok = (name, pass, info = '') => checks.push({ name, pass, info });
  const GRID = 25;
  const dial = i => i / (GRID - 1);

  // CRUX-1 — RENDERED === PREDICATE over the whole (S,w) grid, zero disagreements.
  {
    let disagree = 0, worstZ = 0, where = '';
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
      const S = dial(i), w = dial(j);
      const p = predict(S, w), m = marchColumn(S, w, 600);
      if (p.explosive !== m.explosive) { disagree++; where = `(S=${S.toFixed(2)},w=${w.toFixed(2)})`; }
      else if (p.explosive) {
        const dz = Math.abs(p.zf - m.zfMarch);
        if (dz > worstZ) worstZ = dz;
      }
    }
    ok('CRUX-1 rendered march === analytic predicate over the ' + GRID + '×' + GRID + ' dial grid (ZERO disagreements)',
       disagree === 0, disagree ? (disagree + ' disagreement(s), first @ ' + where) : 'all ' + (GRID * GRID) + ' cells agree');
    ok('CRUX-1★ where explosive, marched fragmentation height === predicate z_f (to grid tol)',
       worstZ < (H_CONDUIT / 600) * 2 + 1e-6, 'worst |z_f − z_march| = ' + worstZ.toFixed(3) + ' m');
  }

  // CRUX-2 — MONOTONE BOUNDARY: more silica OR more gas only ever pushes toward
  //   explosive (never flips explosive→effusive). Checked on the whole grid.
  {
    let badS = 0, badW = 0;
    const E = (i, j) => predict(dial(i), dial(j)).explosive;
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
      if (i + 1 < GRID && E(i, j) && !E(i + 1, j)) badS++;   // +silica must not un-explode
      if (j + 1 < GRID && E(i, j) && !E(i, j + 1)) badW++;   // +gas must not un-explode
    }
    ok('CRUX-2 boundary monotone in SILICA (more silica never un-explodes a column)', badS === 0, badS + ' violations');
    ok('CRUX-2 boundary monotone in GAS (more gas never un-explodes a column)', badW === 0, badW + ' violations');
  }

  // CRUX-3 — ON THE BOUNDARY φ_max = ¾ EXACTLY and z_f = 0 (plane at the vent
  //   lip). Find a boundary gas value for a mid-silica by bisection.
  {
    const S = 0.7;
    const wB = boundaryWForS(S);
    let phiB = NaN, zfB = NaN, marchAtVent = false;
    if (wB != null) {
      // nudge just into the explosive side so the predicate returns a real z_f
      const wJust = Math.min(1, wB + 1e-6);
      const p = predict(S, wJust);
      phiB = phiAt(S, wB, H_CONDUIT);
      zfB = p.zf;
      const m = marchColumn(S, wJust, 4000);
      marchAtVent = m.explosive && (H_CONDUIT - m.hCross) < 5;   // plane within 5 m of the vent
    }
    ok('CRUX-3 on the EFFUSIVE↔EXPLOSIVE boundary φ_max = ¾ exactly', wB != null && Math.abs(phiB - PHI_C) < 1e-6,
       wB != null ? ('φ_max(boundary) = ' + phiB.toFixed(8) + ' @ w=' + wB.toFixed(5)) : 'no boundary found at S=' + S);
    ok('CRUX-3★ at the boundary the fragmentation plane sits at the vent lip (z_f ≈ 0)',
       wB != null && zfB < 5 && marchAtVent, wB != null ? ('z_f = ' + zfB.toFixed(3) + ' m, marched crossing within 5 m of vent') : '—');
  }

  // NEG-A — GAS → 0 ⇒ NO silica value fragments (no volatile, no bubbles, φ≡0).
  {
    let anyFrag = false, where = '';
    for (let i = 0; i < GRID; i++) {
      const S = dial(i);
      if (predict(S, 0).explosive) { anyFrag = true; where = 'S=' + S.toFixed(2); }
      if (phiAt(S, 0, H_CONDUIT) !== 0) { anyFrag = true; where = 'φ≠0 @ S=' + S.toFixed(2); }
    }
    ok('NEG-A gas→0 ⇒ NO silica value fragments (φ_max ≡ 0 across all silica)', !anyFrag, anyFrag ? 'fragmented at ' + where : 'effusive for every silica at zero gas');
  }

  // NEG-B — η PINNED BASALTIC ⇒ even MAX gas stays effusive (viscosity, not gas
  //   alone, gates the blast: a runny basalt degasses through open bubbles).
  {
    const p = predict(0, 1);   // basalt, maximum gas
    ok('NEG-B basalt at MAX gas stays EFFUSIVE — viscosity (coupling), not gas alone, gates the blast',
       !p.explosive, 'φ_max(basalt, max gas) = ' + p.phimax.toFixed(4) + ' < ¾ (χ=' + p.chi.toExponential(2) + ')');
  }

  // POSITIVE CONTROL — a stiff, gassy column DOES fragment (the blast is reachable,
  //   so the boundary genuinely crosses the grid, not a degenerate all-effusive).
  {
    const p = predict(1, 0.6);   // rhyolite, plenty of gas
    ok('POS-CTRL rhyolite + gas DOES fragment (the explosive regime is reachable)',
       p.explosive && p.zf > 0, 'φ_max = ' + p.phimax.toFixed(4) + ' ≥ ¾, plane z_f = ' + p.zf.toFixed(0) + ' m below vent');
  }

  // BOUNDARY MONOTONE CURVE — the per-silica boundary gas threshold w*(S) is
  //   NON-INCREASING in S (more silica ⇒ less gas needed): the curve itself.
  {
    let bad = 0, prev = Infinity, lit = 0;
    for (let i = 0; i < GRID; i++) {
      const S = dial(i);
      const wB = boundaryWForS(S);
      if (wB == null) continue;        // basaltic end: never fragments — fine
      lit++;
      if (wB > prev + 1e-9) bad++;     // threshold must not rise as silica rises
      prev = wB;
    }
    ok('BOUNDARY w*(S) is non-increasing in silica (the monotone boundary curve) over ' + lit + ' lit silica steps',
       bad === 0 && lit >= 3, bad + ' rises; ' + lit + ' silica steps have a finite threshold');
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === DEEP-HEARTH CORE END ===

export {
  H_CONDUIT, P_VENT, P_GRAD, PHI_C, W_MAX, SOL, K_GAS, RHO_MELT, V_M,
  SILICA_ZONES,
  clamp01, silicaPct, aType, etaTypeLog, etaFeltLog, zoneOf, couplingChi,
  pressureAt, solubility, volatileW, exsolvedAt, retainedAt, phiAt, exsolutionHeight,
  predict, marchColumn, boundaryWForS, runCoreTests,
};
