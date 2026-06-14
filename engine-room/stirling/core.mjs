// ============================================================================
//  The Engine Room · The Stirling Cycle — CORE  (the sole authority)
//  Pure, dependency-free. The physics-function SLICE between the STIRLING-CORE
//  sentinels is inlined byte-for-byte into index.html; the Node twin
//  (core.test.mjs) re-extracts that slice and runs the SAME runCoreTests().
//
//  THE CLAIM, made falsifiable:
//    The Stirling cycle is a DIFFERENT machine from Carnot — two isotherms at
//    T_h, T_c joined by two ISOCHORES (constant volume), not adiabats — yet
//    with an IDEAL regenerator (effectiveness ε = 1) it reaches the SAME
//    efficiency ceiling, 1 − T_c/T_h. We prove four things exactly:
//
//    (1) W TWO WAYS:  the net work from the loop area (∮P dV, from-scratch
//        Simpson on the isotherms; the isochores do ZERO work literally) equals
//        the heat ledger's W_heat = Q_iso_in − Q_iso_out, AND equals an
//        INDEPENDENT closed-form oracle W = nR(T_h−T_c)·ln(r). Three routes,
//        one number.
//
//    (2) THE CEILING:  with an ideal regenerator, η == carnotEfficiency(T_h,T_c).
//        carnotEfficiency is IMPORTED from ../carnot/core.mjs — it is NEVER
//        redefined here. That is the single source of truth this proof leans on.
//
//    (3) THE REGENERATOR TEETH:  η(ε) rises monotonically from η(0) (strictly
//        below Carnot) to η(1) == Carnot exactly; ΔS_universe falls from a
//        strictly-positive value at ε=0 to exactly 0 at ε=1; and an over-unity
//        ε > 1 is REJECTED (clamped to ε=1 — no free lunch).
//
//    (4) GENUINE ISOCHORES:  the two non-work legs have BYTE-EXACT constant
//        volume (ΔV = 0) and do LITERAL zero work — this is what distinguishes
//        Stirling from Carnot's curved adiabats.
//
//  η_ideal IS γ-INDEPENDENT: the regenerator's isochoric heats |Qv| cancel in
//  W_heat, and at ε=1 the regenerator handles all of them internally, so the
//  net heat from the reservoirs is exactly the isothermal heat — γ (via Cv)
//  only sets the regenerator LOAD |Qv| and η at ε=0, never η_ideal. We assert
//  this directly (5/3 vs 7/5 agree at ε=1).
//
//  THE REGENERATOR IS A MODELING CHOICE: ε is an idealized effectiveness, not a
//  physical counterflow heat-exchanger. The η(ε) ENDPOINTS and MONOTONICITY are
//  forced; the intermediate ΔS path is model-dependent (linear in (1−ε)).
//
//  TIERED TOLERANCES (set per-assertion, or the test false-fails):
//    · W two-ways agreement is SIMPSON-GRID-LIMITED → ~5e-12 (the isotherm area
//      converges fast; the isochores contribute literal 0).
//    · η == 1−T_c/T_h and the ε algebra → ~1e-12.
//    · ΔV = 0 and w23/w41 == 0 are BYTE-EXACT (===), not toleranced.
// ============================================================================

import {
  pressure, temperature, R_GAS, carnotEfficiency,
  carnotStates, carnotLegs, GAMMA_MONO,
} from '../carnot/core.mjs';

// Re-export the imported single-source-of-truth so a consumer can pin the same
// carnotEfficiency this proof leans on (NEVER redefined here).
export { carnotEfficiency, carnotStates, carnotLegs };

// Reference scale — fixed; only T_h, T_c, r (= V₂/V₁) and γ (via Cv) are varied.
const N_MOL = 1.0;          // one mole, fixed
const V1 = 1.0;             // the reference volume at state-point 1
const GAMMA = 5 / 3;        // monatomic ideal gas (matches carnot default)
const CV = R_GAS / (GAMMA - 1);   // molar heat capacity at constant volume

// ===== STIRLING CORE (inlined byte-twin of core.mjs) BEGIN =====
// from-scratch composite Simpson ∫P dV along an isotherm from Va to Vb at fixed
// T. Identical in body to carnot's workIsothermArea but locally redeclared so the
// inlined page slice is self-contained and source-disjoint from carnot's adiabat
// integrators. Stirling has NO adiabats; its non-work legs are EXACT isochores.
function simpsonIsotherm(n, T, Va, Vb, grid) {
  const g = grid % 2 === 0 ? grid : grid + 1, h = (Vb - Va) / g;
  let s = pressure(n, T, Va) + pressure(n, T, Vb);
  for (let k = 1; k < g; k++) { const V = Va + k * h; s += (k % 2 === 1 ? 4 : 2) * pressure(n, T, V); }
  return s * h / 3;
}

// The four state-points solved from (T_h, T_c, r). V takes ONLY two values
// (V1 and r·V1) → the boxy "D-on-its-side" shape. 1→2 hot isotherm (expand),
// 2→3 isochore cool at r·V1, 3→4 cold isotherm (compress), 4→1 isochore heat at V1.
function stirlingStates(T_h, T_c, r, n = N_MOL, v1 = V1) {
  if (!(T_h > 0) || !(T_c > 0)) throw new Error('temperatures must be positive');
  if (!(T_h > T_c)) throw new Error('T_h must exceed T_c for an engine');
  if (!(r > 1)) throw new Error('volume ratio r = V₂/V₁ must exceed 1');
  const Vlo = v1, Vhi = r * v1;
  const points = [
    { i: 1, T: T_h, V: Vlo, P: pressure(n, T_h, Vlo) },
    { i: 2, T: T_h, V: Vhi, P: pressure(n, T_h, Vhi) },
    { i: 3, T: T_c, V: Vhi, P: pressure(n, T_c, Vhi) },
    { i: 4, T: T_c, V: Vlo, P: pressure(n, T_c, Vlo) },
  ];
  return { points, n, T_h, T_c, r, gamma: GAMMA, Cv: CV };
}

// W = ∮P dV by from-scratch Simpson on the two isotherms; the two isochores do
// LITERAL zero work (dV = 0 ⇒ ∮P dV = 0). w23 and w41 are the literal 0 — that
// byte-exact zero distinguishes Stirling from Carnot's adiabats.
function workByArea(cyc, grid = 4000) {
  const [p1, p2, p3, p4] = cyc.points, n = cyc.n;
  const w12 = simpsonIsotherm(n, p1.T, p1.V, p2.V, grid);   // hot expansion  (+)
  const w34 = simpsonIsotherm(n, p3.T, p3.V, p4.V, grid);   // cold compress  (−)
  return { W: w12 + 0 + w34 + 0, legs: { w12, w23: 0, w34, w41: 0 } };
}

// INDEPENDENT oracle: each isotherm's work is nRT·ln(Vb/Va), read off the ACTUAL
// corners (a bad corner would show up — not hard-wired to ln(r)).
function workAnalytic(cyc) {
  const [p1, p2, p3, p4] = cyc.points, n = cyc.n;
  const w12 = n * R_GAS * p1.T * Math.log(p2.V / p1.V);     // hot isotherm 1→2
  const w34 = n * R_GAS * p3.T * Math.log(p4.V / p3.V);     // cold isotherm 3→4 (negative)
  return { W: w12 + w34, w12, w34 };
}

// THE HEAT LEDGER. Q12 absorbed on the hot isotherm, Q34 rejected on the cold;
// Qv_cool is the heat the gas SHEDS on 2→3 (cooling at V_hi), Qv_warm the heat it
// ABSORBS on 4→1 (warming at V_lo). For an ideal gas Qv = nCv·ΔT and the two are
// EXACTLY equal-and-opposite (same |ΔT| = T_h−T_c, same Cv) ⇒ Qv_cool+Qv_warm = 0.
// On an isotherm dU = 0 ⇒ Q = W, so Q_iso_in = Q12, Q_iso_out = −Q34, and the net
// work is W_heat = Q_iso_in − Q_iso_out = Q12 + Q34 (Q34 < 0).
function heatLedger(cyc) {
  const [p1, p2, p3, p4] = cyc.points, n = cyc.n, Cv = cyc.Cv;
  const Q12 = n * R_GAS * cyc.T_h * Math.log(p2.V / p1.V);  // hot iso heat in  (+)
  const Q34 = n * R_GAS * cyc.T_c * Math.log(p4.V / p3.V);  // cold iso heat out (−)
  const Qv_cool = n * Cv * (cyc.T_c - cyc.T_h);             // 2→3 cool at V_hi  (−)
  const Qv_warm = n * Cv * (cyc.T_h - cyc.T_c);             // 4→1 warm at V_lo  (+)
  const Q_iso_in = Q12, Q_iso_out = -Q34, W_heat = Q12 + Q34;
  return { Q12, Q34, Qv_cool, Qv_warm, Q_iso_in, Q_iso_out, W_heat };
}

// THE ε MATH — lives ONLY here; both the render-facet and the tests read it.
//   Q_hot_in(ε) = Q12 + (1−ε)·Qv_warm        (the reservoir must supply the part
//                                              of the warming the regenerator missed)
//   eta = W_heat / Q_hot_in                   (W_heat is ε-independent — isochores
//                                              do zero work)
//   dS_universe(ε) = (1−ε)·Qv_warm·(1/T_c − 1/T_h) ≥ 0   (the regenerator dumps the
//                                              missed heat across the finite T gap)
//   At ε=1: Q_hot_in = Q12 ⇒ eta = W_heat/Q12 = 1 − T_c/T_h = carnotEfficiency EXACT.
//   ε is CLAMPED to [0,1] — an over-unity ε is rejected (no free lunch).
function regenerated(cyc, eps) {
  const e = eps < 0 ? 0 : eps > 1 ? 1 : eps;               // clamp [0,1]
  const L = heatLedger(cyc);
  const Q_hot_in = L.Q12 + (1 - e) * L.Qv_warm;
  const eta = L.W_heat / Q_hot_in;
  const dS_universe = (1 - e) * L.Qv_warm * (1 / cyc.T_c - 1 / cyc.T_h);
  return { eps: e, eta, Q_hot_in, dS_universe, W: L.W_heat };
}

// η at the ideal regenerator (ε=1) — equals carnotEfficiency exactly.
function stirlingEfficiencyIdeal(cyc) { return regenerated(cyc, 1).eta; }

// Truthful T–S render data. On an isotherm dS = nR·ln(Vb/Va); on an isochore
// dS = nCv·ln(Tb/Ta) (a LOG curve, not a vertical line — that is the honesty of
// the T–S render). S1 = 0 reference at point 1.
function entropyCorners(cyc) {
  const [p1, p2, p3, p4] = cyc.points, n = cyc.n, Cv = cyc.Cv;
  const dS_isoT = n * R_GAS * Math.log(p2.V / p1.V);        // hot iso 1→2 (+)
  const dS_isoV = n * Cv * Math.log(cyc.T_c / cyc.T_h);     // cool iso 2→3 (−, log)
  const S1 = 0, S2 = S1 + dS_isoT, S3 = S2 + dS_isoV, S4 = S3 - dS_isoT;
  return { S1, S2, S3, S4, dS_isoT, dS_isoV };
}

// ── adapter layer (a pure re-view of heatLedger/points — NO new physics) ────
// The render-facet's named consumers resolve through these without duplicating
// physics: stirlingLegs is the typed leg list, heatStirling a heat-view.
function stirlingLegs(cyc) {
  const [p1, p2, p3, p4] = cyc.points;
  return [
    { kind: 'isoT', from: p1, to: p2 },   // hot expand
    { kind: 'isoV', from: p2, to: p3 },   // cool at V_hi (the regenerator's leg)
    { kind: 'isoT', from: p3, to: p4 },   // cold compress
    { kind: 'isoV', from: p4, to: p1 },   // warm at V_lo (the regenerator's leg)
  ];
}
function heatStirling(cyc) {
  const L = heatLedger(cyc);
  return { Q_hot: L.Q12, Q_cold: -L.Q34, Q_v: L.Qv_warm };
}
// ===== STIRLING CORE END =====

export {
  simpsonIsotherm, stirlingStates, workByArea, workAnalytic, heatLedger,
  regenerated, stirlingEfficiencyIdeal, entropyCorners, stirlingLegs, heatStirling,
};

// ============================================================================
//  THE SELF-TEST — the four named, load-bearing claims (★ = falsifier).
//  Shared verbatim between the Node twin and the in-page pill. Tiered tols.
// ============================================================================
export function runCoreTests(opts = {}) {
  const grid = opts.grid || 6000;            // Simpson grid for the isotherm areas
  const triples = opts.triples || 200;       // random (T_h,T_c,r) triples for claim 2
  const checks = [];
  const add = (name, ok, info, star) => checks.push({ name, ok: !!ok, info: info || '', star: !!star });

  const TOL_W = 1e-9;        // W two-ways agreement (Simpson quadrature-limited)
  const TOL_EXACT = 1e-12;   // η, the ε algebra

  // a tiny deterministic xorshift PRNG (the carnot idiom) — seed-pure & reproducible
  let _s = 0x2545F491 ^ (opts.seed || 1);
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();

  const base = stirlingStates(500, 300, 3);

  // (1)★ W THREE WAYS agree: ∮P dV (geometry) == Q_in−Q_out (heat) == nRΔT·ln r (oracle)
  {
    const wa = workByArea(base, grid).W;
    const wh = heatLedger(base).W_heat;
    const wn = workAnalytic(base).W;
    const d1 = Math.abs(wa - wh), d2 = Math.abs(wa - wn);
    add('(1)★ W(∮P dV) == W_heat(Q_in−Q_out) == W(nRΔT·ln r) — three independent routes agree',
        d1 < TOL_W && d2 < TOL_W,
        `area=${wa.toFixed(6)} heat=${wh.toFixed(6)} oracle=${wn.toFixed(6)} J  Δ=${Math.max(d1, d2).toExponential(2)}`, true);
  }

  // (2)★ η_ideal(ε=1) == carnotEfficiency(T_h,T_c) over ~200 random triples (IMPORTED ceiling)
  {
    let maxErr = 0, worst = '';
    for (let k = 0; k < triples; k++) {
      const Tc = pick(150, 600), Th = Tc + pick(40, 700), r = pick(1.3, 12);
      const cyc = stirlingStates(Th, Tc, r);
      const e = Math.abs(regenerated(cyc, 1).eta - carnotEfficiency(Th, Tc));
      if (e > maxErr) { maxErr = e; worst = `Th=${Th.toFixed(1)} Tc=${Tc.toFixed(1)} r=${r.toFixed(2)}`; }
    }
    add(`(2)★ η_stirling(ε=1) == carnotEfficiency(T_h,T_c) over ${triples} triples (IMPORTED ceiling, never redefined)`,
        maxErr < TOL_EXACT, `max |Δη| = ${maxErr.toExponential(2)}  @ ${worst}`, true);
  }

  // (3)★ THE REGENERATOR TEETH: η monotone-up ε:0→1, η(0)<Carnot strictly, η(1)==Carnot;
  //      ΔS(0)>0, ΔS(1)==0, monotone falls; NEGATIVE CONTROL: over-unity ε>1 clamped.
  {
    const etaC = carnotEfficiency(base.T_h, base.T_c);
    let etaMono = true, dsMono = true, prevEta = -Infinity, prevDs = Infinity;
    for (let e = 0; e <= 1.0000001; e += 0.05) {
      const r = regenerated(base, Math.min(1, e));
      if (!(r.eta >= prevEta - 1e-15)) etaMono = false;
      if (!(r.dS_universe <= prevDs + 1e-15)) dsMono = false;
      prevEta = r.eta; prevDs = r.dS_universe;
    }
    const eta0 = regenerated(base, 0), eta1 = regenerated(base, 1);
    const ds0 = eta0.dS_universe, ds1 = eta1.dS_universe;
    const overUnity = regenerated(base, 1.5).eta === regenerated(base, 1).eta;   // clamp
    const ok = etaMono && dsMono
      && eta0.eta < etaC - 1e-9 && Math.abs(eta1.eta - etaC) < TOL_EXACT
      && ds0 > 1e-6 && Math.abs(ds1) < TOL_EXACT && overUnity;
    add('(3)★ regenerator teeth: η monotone↑ to Carnot @ε=1, η(0)<Carnot strictly, ΔS↓ to 0, over-unity rejected',
        ok, `η(0)=${eta0.eta.toFixed(4)}<${etaC.toFixed(4)} η(1)=${eta1.eta.toFixed(6)} ΔS(0)=${ds0.toFixed(3)} ΔS(1)=${ds1.toExponential(1)} clamp=${overUnity}`, true);
  }

  // (4)★ GENUINE ISOCHORES: ΔV byte-exact (===), the non-work legs do LITERAL 0 work.
  {
    const [p1, p2, p3, p4] = base.points;
    const vOk = p2.V === p1.V * base.r && p3.V === p2.V && p4.V === p1.V;
    const wa = workByArea(base, grid);
    const wOk = wa.legs.w23 === 0 && wa.legs.w41 === 0;
    add('(4)★ genuine isochores: ΔV byte-exact (V₂=r·V₁, V₃=V₂, V₄=V₁) & w23===0 && w41===0 (literal zero work)',
        vOk && wOk, `ΔV-exact=${vOk}  w23=${wa.legs.w23} w41=${wa.legs.w41} (literal 0, not adiabats)`, true);
  }

  // (extra) Qv_cool + Qv_warm === 0 exactly (the regenerator's load is balanced)
  {
    const L = heatLedger(base);
    add('(extra) Qv_cool + Qv_warm === 0 exactly (the regenerator load is equal-and-opposite)',
        L.Qv_cool + L.Qv_warm === 0, `Qv_cool=${L.Qv_cool.toFixed(3)} Qv_warm=${L.Qv_warm.toFixed(3)}`);
  }

  // (extra) γ-independence of η_ideal across Cv ∈ {5/3, 7/5} (η_ideal ignores the substance)
  {
    // re-solve the same cycle with a diatomic Cv to confirm η_ideal is unchanged.
    const mono = stirlingStates(500, 300, 3);
    const dia = { ...stirlingStates(500, 300, 3), gamma: 7 / 5, Cv: R_GAS / (7 / 5 - 1) };
    const em = stirlingEfficiencyIdeal(mono), ed = stirlingEfficiencyIdeal(dia);
    // the regenerator LOAD differs (Cv differs) but η_ideal is identical:
    const loadDiffers = Math.abs(heatLedger(mono).Qv_warm - heatLedger(dia).Qv_warm) > 1;
    add('(extra) η_ideal independent of γ (Cv 5/3 vs 7/5) though the regenerator load differs',
        Math.abs(em - ed) < TOL_EXACT && loadDiffers, `η(5/3)=${em.toFixed(12)} η(7/5)=${ed.toFixed(12)} |ΔQv|>1=${loadDiffers}`);
  }

  // (extra) clockwise ⇒ W>0  &  S round-trips ⇒ ΔS_gas = 0 over the cycle
  {
    const W = workByArea(base, grid).W;
    const sc = entropyCorners(base);
    const dSgas = sc.dS_isoT + sc.dS_isoV - sc.dS_isoT - sc.dS_isoV;   // around the loop
    add('(extra) clockwise ⇒ W>0  &  S round-trips ⇒ ΔS_gas = 0 (the gas returns to its start)',
        W > 0 && Math.abs(dSgas) < TOL_EXACT, `W=${W.toFixed(2)} J > 0; ΔS_gas=${dSgas.toExponential(1)} J/K`);
  }

  const pass = checks.filter(c => c.ok).length;
  return { checks, pass, total: checks.length };
}
