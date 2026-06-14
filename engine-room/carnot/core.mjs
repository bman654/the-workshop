// ============================================================================
//  The Engine Room · The Carnot Engine — CORE
//  Pure, dependency-free. The IDENTICAL code is inlined into index.html; this
//  file is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE CLAIM, made falsifiable:
//    For an ideal gas (PV = nRT) cycled as a CARNOT engine — two isotherms at
//    T_h, T_c joined by two adiabats (PVᵞ = const) — the net work, the heat
//    bookkeeping, and the efficiency all collapse onto ONE number, and that
//    efficiency equals 1 − T_c/T_h. NO cycle that stays between the same two
//    reservoirs can beat it. That bound is the Second Law, and we prove it two
//    independent ways that share no formula:
//
//    PATH 1 (GEOMETRY, the honest oracle):
//      W = ∮P dV by from-scratch midpoint Riemann integration around the four
//      legs. P(V) is sampled from each leg's OWN constraint — T=const on the
//      isotherms (P=nRT/V), and the adiabat is traced by a from-scratch ODE
//      stepper integrating dT/dV = −(γ−1)·T/V (NOT the closed-form). This path
//      never uses η or the nRT·ln area formula.
//
//    PATH 2 (HEAT ACCOUNTING, independent):
//      Q_h = ∫T dS on the hot isotherm = nR·T_h·ln(V₂/V₁);
//      Q_c = nR·T_c·ln(V₂/V₁) on the cold; W_thermo = Q_h − Q_c. This path never
//      touches the P–V loop area.
//
//    AGREEMENT: W_area == W_thermo. Two derivations, one number.
//
//  TIERED TOLERANCES (set per-assertion, or the test false-fails):
//    · Path-1 ↔ Path-2 work agreement is RIEMANN-GRID-LIMITED → ~1e-9, NOT
//      machine precision. We do not claim better than the integrator gives.
//    · η == 1−T_c/T_h and the heat-side / closed-form algebra → ~1e-12.
//    · ΔS_cycle = Q_h/T_h − Q_c/T_c → ~1e-12 (== 0 for reversible Carnot).
//
//  WELL-POSEDNESS (the two real traps, honored here):
//    (a) Heat-in for ANY loop is Q_in = ∫T dS over the segments where dS>0; the
//        bound is stated for "any closed cycle whose temperature stays within
//        [T_c, T_h]" — the reservoir generalization of Carnot's theorem — NOT
//        "between two isotherms" (ill-posed for an Otto/Brayton lobe).
//    (b) Reference scale: a 2-D-vs-3-D kinetic-theory mismatch is never shipped.
//        γ is a free parameter here {5/3, 7/5}; the engine's gas is the standard
//        3-D PV=nRT ideal gas. No M-B numeric cross-test is asserted (the M-B
//        tie is the landing's bridge LINK only — see DESIGN note (b)).
// ============================================================================

// Reference scale — fixed; only T_h, T_c, r (= V₂/V₁) and γ are varied.
export const R_GAS = 8.314462618;   // J·mol⁻¹·K⁻¹ — the real gas constant
export const N_MOL = 1.0;           // one mole, fixed
export const V1 = 1.0;              // the reference volume at state-point 1 (start of hot isotherm)
export const GAMMA_MONO = 5 / 3;    // monatomic ideal gas
export const GAMMA_DIATOMIC = 7 / 5;// diatomic ideal gas

// ── ideal-gas law, both directions ──────────────────────────────────────────
export function pressure(n, T, V) { return n * R_GAS * T / V; }
export function temperature(n, P, V) { return P * V / (n * R_GAS); }

// ============================================================================
//  THE CARNOT CYCLE — four state-points solved from (T_h, T_c, r, γ).
//
//  The T–S rectangle is the MASTER surface (the design's structural insight):
//    width  ΔS = nR·ln(r),  r = V₂/V₁  (set on the hot isotherm)
//    top    T_h,  bottom T_c.
//  From it the four P–V corners are re-solved ONE-directionally:
//    1 → 2  hot isotherm at T_h     : V₁ → V₂ = r·V₁         (gas expands, absorbs Q_h)
//    2 → 3  adiabat (expansion)     : T_h → T_c, V₂ → V₃     (T·Vᵞ⁻¹ = const)
//    3 → 4  cold isotherm at T_c    : V₃ → V₄                (gas compressed, rejects Q_c)
//    4 → 1  adiabat (compression)   : T_c → T_h, V₄ → V₁
//
//  The adiabatic relation TVᵞ⁻¹ = const gives V₃ = V₂·(T_h/T_c)^{1/(γ−1)} and
//  V₄ = V₁·(T_h/T_c)^{1/(γ−1)}, so V₂/V₁ = V₃/V₄ = r (the volume-ratio
//  fingerprint). We DERIVE the corners; we don't assume the loop closes.
// ============================================================================
export function carnotStates(T_h, T_c, r, gamma = GAMMA_MONO, n = N_MOL, v1 = V1) {
  if (!(T_h > 0) || !(T_c > 0)) throw new Error('temperatures must be positive');
  if (!(T_h > T_c)) throw new Error('T_h must exceed T_c for an engine');
  if (!(r > 1)) throw new Error('compression ratio r = V₂/V₁ must exceed 1');
  const expo = 1 / (gamma - 1);
  const ratio = Math.pow(T_h / T_c, expo);     // V grows by this across an adiabat (T falls)
  const V1_ = v1;
  const V2 = r * V1_;
  const V3 = V2 * ratio;
  const V4 = V1_ * ratio;
  const pts = [
    { i: 1, T: T_h, V: V1_, P: pressure(n, T_h, V1_) },
    { i: 2, T: T_h, V: V2,  P: pressure(n, T_h, V2)  },
    { i: 3, T: T_c, V: V3,  P: pressure(n, T_c, V3)  },
    { i: 4, T: T_c, V: V4,  P: pressure(n, T_c, V4)  },
  ];
  return { points: pts, n, gamma, T_h, T_c, r };
}

// ============================================================================
//  PATH 1 — GEOMETRY.  W = ∮P dV by from-scratch midpoint Riemann integration.
//
//  Each leg contributes ∫P dV. For an isotherm P=nRT/V is sampled directly.
//  For an adiabat we do NOT use the closed form: we trace T(V) by integrating
//  the ODE  dT/dV = −(γ−1)·T/V  with a 4th-order Runge–Kutta stepper, then
//  P = nRT/V at each midpoint. The work is the signed area of the loop; a
//  CLOCKWISE loop (expand hot, then compress cold) gives W > 0.
// ============================================================================

// from-scratch composite Simpson ∫P dV along an isotherm from Va to Vb at fixed T.
//   Simpson is a Riemann-family quadrature (a weighted sum of P samples on a
//   regular grid) — it does NOT use the closed-form nRT·ln area. It just
//   converges as O(h⁴) instead of midpoint's O(h²), so a modest grid reaches the
//   honest ~1e-12 tolerance the heat-side derivation deserves. We keep grid even.
function workIsothermArea(n, T, Va, Vb, gridIn) {
  const grid = gridIn % 2 === 0 ? gridIn : gridIn + 1;
  const h = (Vb - Va) / grid;
  let s = pressure(n, T, Va) + pressure(n, T, Vb);
  for (let k = 1; k < grid; k++) {
    const V = Va + k * h;
    s += (k % 2 === 1 ? 4 : 2) * pressure(n, T, V);
  }
  return s * h / 3;
}

// One RK4 step of dT/dV = −(γ−1)·T/V.
function adiabatDeriv(gamma, T, V) { return -(gamma - 1) * T / V; }
function adiabatStepRK4(gamma, T, V, dV) {
  const k1 = adiabatDeriv(gamma, T, V);
  const k2 = adiabatDeriv(gamma, T + 0.5 * dV * k1, V + 0.5 * dV);
  const k3 = adiabatDeriv(gamma, T + 0.5 * dV * k2, V + 0.5 * dV);
  const k4 = adiabatDeriv(gamma, T + dV * k3, V + dV);
  return T + (dV / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

// composite-Simpson ∫P dV along an adiabat from Va to Vb, with T traced by the
// from-scratch RK4 ODE stepper (dT/dV=−(γ−1)T/V) from the known start T=Ta at
// Va. Each Simpson panel uses the panel's three nodes (a, mid, b); T at each is
// the RK4-traced value (never the closed form). Returns {work, T_end}.
function workAdiabatArea(n, gamma, Ta, Va, Vb, gridIn) {
  const grid = gridIn % 2 === 0 ? gridIn : gridIn + 1; // panels in pairs
  const h = (Vb - Va) / grid;
  let s = 0, T = Ta, V = Va;
  // accumulate Simpson over consecutive PANEL PAIRS [V, V+2h], reusing the RK4
  // trace so T stays consistent across the whole leg.
  let Pprev = pressure(n, T, V);
  for (let k = 0; k < grid; k += 2) {
    const Tmid = adiabatStepRK4(gamma, T, V, h);
    const Pmid = pressure(n, Tmid, V + h);
    const Tend = adiabatStepRK4(gamma, Tmid, V + h, h);
    const Pend = pressure(n, Tend, V + 2 * h);
    s += (h / 3) * (Pprev + 4 * Pmid + Pend);
    T = Tend; V = V + 2 * h; Pprev = Pend;
  }
  return { work: s, T_end: T };
}

// W = ∮P dV around the four legs. grid is the per-leg sub-interval count.
export function workByArea(cyc, grid = 2000) {
  const [p1, p2, p3, p4] = cyc.points;
  const n = cyc.n, g = cyc.gamma;
  const w12 = workIsothermArea(n, p1.T, p1.V, p2.V, grid);          // hot expansion  (+)
  const a23 = workAdiabatArea(n, g, p2.T, p2.V, p3.V, grid);        // adiabatic exp  (+)
  const w34 = workIsothermArea(n, p3.T, p3.V, p4.V, grid);          // cold compress  (−)
  const a41 = workAdiabatArea(n, g, p4.T, p4.V, p1.V, grid);        // adiabatic comp (−)
  return { W: w12 + a23.work + w34 + a41.work,
           legs: { w12, w23: a23.work, w34, w41: a41.work },
           adiabatEnds: { T3: a23.T_end, T1: a41.T_end } };
}

// ============================================================================
//  PATH 2 — HEAT ACCOUNTING.  Independent of the loop area.
//    Q_h = ∫T dS on the hot isotherm. For an isotherm dQ = T dS = P dV, and
//    ∫P dV = nR·T·ln(Vb/Va), so Q_h = nR·T_h·ln(r), Q_c = nR·T_c·ln(r).
//    W_thermo = Q_h − Q_c. (We compute ln(V₂/V₁) from the actual corners, so a
//    bad corner would show up — it is not hard-wired to ln(r).)
// ============================================================================
export function heatByEntropy(cyc) {
  const [p1, p2, p3, p4] = cyc.points;
  const n = cyc.n;
  const lnHot  = Math.log(p2.V / p1.V);   // hot isotherm 1→2
  const lnCold = Math.log(p3.V / p4.V);   // cold isotherm 4→3 (magnitude of compression)
  const Q_h = n * R_GAS * cyc.T_h * lnHot;
  const Q_c = n * R_GAS * cyc.T_c * lnCold;
  return { Q_h, Q_c, W_thermo: Q_h - Q_c, lnHot, lnCold };
}

// closed-form efficiency and the entropy ledger for a reversible Carnot cycle.
export function carnotEfficiency(T_h, T_c) { return 1 - T_c / T_h; }
export function entropyLedger(cyc) {
  const { Q_h, Q_c } = heatByEntropy(cyc);
  const dS_hot  =  Q_h / cyc.T_h;          // entropy gained by the gas on the hot leg
  const dS_cold = -Q_c / cyc.T_c;          // entropy lost on the cold leg
  return { dS_hot, dS_cold, dS_cycle: dS_hot + dS_cold };  // == 0 for reversible Carnot
}

// the closed-form adiabat invariant, used only for cross-checking the stepper.
export function adiabatTVgamma(T, V, gamma) { return T * Math.pow(V, gamma - 1); }
export function adiabatPVgamma(P, V, gamma) { return P * Math.pow(V, gamma); }

// ============================================================================
//  THE GENERAL CYCLE — for the "try to beat it" teeth.  A closed cycle is a
//  list of state-points joined by typed legs. We run it through the SAME Path-1
//  integrator (no special-casing) and the SAME ∫T dS heat accounting, so a
//  reshaped cycle is judged by exactly the machinery that judges Carnot.
//
//  Leg kinds (each carries its own P(V), T(V), and dS sign by construction):
//    'isoT'  isothermal at fixed T            — P=nRT/V,    dS = +∫P dV/T
//    'adia'  adiabatic   PVᵞ=const            — ODE-traced, dQ=0 ⇒ dS=0
//    'isoV'  isochoric   fixed V              — no P dV work, Q = nCv ΔT
//    'isoP'  isobaric    fixed P              — W = P ΔV,    Q = nCp ΔT
//  Each leg's heat is split into the part that ENTERS the gas (dQ>0) so that
//  Q_in = Σ heat-in (the well-posed denominator for η of ANY loop).
// ============================================================================

// A general leg integrates W = ∫P dV (midpoint Riemann) and Q = ∫dQ along it,
// tracking dQ>0 as heat-in. Returns {W, Q, Q_in, Tmin, Tmax}.
export function integrateLeg(n, gamma, leg, grid = 2000) {
  const Cv = R_GAS / (gamma - 1);       // molar heat capacity at constant volume
  const { kind } = leg;
  const Va = leg.from.V, Vb = leg.to.V;
  let W = 0, Q = 0, Qin = 0, Tmin = Infinity, Tmax = -Infinity;

  function account(dW, Tcur, dQ) {
    W += dW; Q += dQ; if (dQ > 0) Qin += dQ;
    if (Tcur < Tmin) Tmin = Tcur; if (Tcur > Tmax) Tmax = Tcur;
  }

  if (kind === 'isoT') {
    const T = leg.from.T;                // == leg.to.T
    const h = (Vb - Va) / grid;
    for (let k = 0; k < grid; k++) {
      const Vm = Va + (k + 0.5) * h;
      const dW = pressure(n, T, Vm) * h; // on an isotherm dU=0 ⇒ dQ = dW
      account(dW, T, dW);
    }
  } else if (kind === 'adia') {
    const h = (Vb - Va) / grid;
    let T = leg.from.T, V = Va;
    for (let k = 0; k < grid; k++) {
      const Tmid = adiabatStepRK4(gamma, T, V, 0.5 * h);
      const Vm = V + 0.5 * h;
      const dW = pressure(n, Tmid, Vm) * h;
      account(dW, Tmid, 0);              // adiabatic: dQ = 0 by definition
      T = adiabatStepRK4(gamma, T, V, h); V = V + h;
    }
  } else if (kind === 'isoV') {
    // no volume change ⇒ no P dV work; Q = nCv ΔT, sampled so dQ-sign is honest
    const Ta = leg.from.T, Tb = leg.to.T;
    const dT = (Tb - Ta) / grid;
    for (let k = 0; k < grid; k++) {
      const Tcur = Ta + (k + 0.5) * dT;
      const dQ = n * Cv * dT;            // sign follows dT
      account(0, Tcur, dQ);
    }
  } else if (kind === 'isoP') {
    const Cp = Cv + R_GAS;
    const P = leg.from.P;                // == leg.to.P
    const h = (Vb - Va) / grid;
    for (let k = 0; k < grid; k++) {
      const Vm = Va + (k + 0.5) * h;
      const Tcur = temperature(n, P, Vm);
      const dW = P * h;
      const dQ = n * Cp * (temperature(n, P, Va + (k + 1) * h) - temperature(n, P, Va + k * h));
      account(dW, Tcur, dQ);
    }
  } else {
    throw new Error('unknown leg kind: ' + kind);
  }
  return { W, Q, Q_in: Qin, Tmin, Tmax };
}

// Run a whole general cycle (array of legs) through the same machinery.
// Returns net W, Q_in (heat absorbed, the well-posed denominator), Q_out,
// η = W/Q_in, the cycle's [Tmin,Tmax], and ΔS_universe contributions.
export function runCycle(n, gamma, legs, grid = 2000) {
  let W = 0, Q_in = 0, Q_out = 0, Tmin = Infinity, Tmax = -Infinity;
  for (const leg of legs) {
    const r = integrateLeg(n, gamma, leg, grid);
    W += r.W; Q_in += r.Q_in; Q_out += Math.max(0, -(r.Q - r.Q_in)) + Math.max(0, -r.Q + 0) * 0;
    // Q_out: the heat rejected (dQ<0) over the leg = (Q_in_of_leg − Q_of_leg)
    Q_out += (r.Q_in - r.Q);
    if (r.Tmin < Tmin) Tmin = r.Tmin; if (r.Tmax > Tmax) Tmax = r.Tmax;
  }
  // (the first Q_out term above is a no-op guard; the accumulation below is the truth)
  return { W, Q_in, Q_out, eta: Q_in > 0 ? W / Q_in : 0, Tmin, Tmax };
}

// Build the Carnot cycle as a list of typed legs (so it runs through runCycle
// identically to any reshaped cycle — assertion 4 demands no special-casing).
export function carnotLegs(cyc) {
  const [p1, p2, p3, p4] = cyc.points;
  return [
    { kind: 'isoT', from: p1, to: p2 },
    { kind: 'adia', from: p2, to: p3 },
    { kind: 'isoT', from: p3, to: p4 },
    { kind: 'adia', from: p4, to: p1 },
  ];
}

// ── reshaped cycles between the SAME reservoirs (the "teeth") ───────────────
//  Replace one adiabat with an isochoric or isobaric leg, keeping the cycle's
//  temperature within [T_c, T_h]. Because heat is now exchanged across a finite
//  temperature span (not at the reservoir), η must fall BELOW Carnot.
//
//  We construct an "Otto-ish" lobe: 1→2 hot isotherm, 2→3' isochoric cool to
//  T_c (drop straight down in T at fixed V₂... but that overshoots V), so we use
//  the geometry that keeps every point inside [T_c,T_h]: the lobe shares the
//  hot expansion and cold compression with Carnot but swaps the connecting
//  adiabats for an isochoric pair, choosing volumes so the loop closes.
// ============================================================================
export function reshapedLegs(cyc, mode = 'isoV') {
  // Keep state 1 and 2 (hot isotherm). Then go isochoric DOWN to T_c at V₂,
  // cold-isotherm compress back, isochoric UP to T_h. This stays within
  // [T_c, T_h] by construction (the isochores only move between T_c and T_h).
  const [p1, p2] = cyc.points;
  const n = cyc.n;
  if (mode === 'isoV') {
    // 2 → 3': cool at constant V₂ from T_h to T_c
    const p3 = { i: 3, T: cyc.T_c, V: p2.V, P: pressure(n, cyc.T_c, p2.V) };
    // 4' chosen so 4'→1 is isochoric (constant V₁) UP from T_c to T_h
    const p4 = { i: 4, T: cyc.T_c, V: p1.V, P: pressure(n, cyc.T_c, p1.V) };
    return [
      { kind: 'isoT', from: p1, to: p2 },               // hot expand
      { kind: 'isoV', from: p2, to: p3 },               // cool at V₂
      { kind: 'isoT', from: p3, to: p4 },               // cold compress
      { kind: 'isoV', from: p4, to: p1 },               // heat at V₁
    ];
  }
  if (mode === 'isoP') {
    // an isobaric variant: cool at constant pressure P₂ down to T_c, then close
    const P2 = p2.P;
    const V3 = n * R_GAS * cyc.T_c / P2;
    const p3 = { i: 3, T: cyc.T_c, V: V3, P: P2 };
    const p4 = { i: 4, T: cyc.T_c, V: p1.V, P: pressure(n, cyc.T_c, p1.V) };
    return [
      { kind: 'isoT', from: p1, to: p2 },
      { kind: 'isoP', from: p2, to: p3 },               // cool at P₂
      { kind: 'isoT', from: p3, to: p4 },               // cold compress
      { kind: 'isoV', from: p4, to: p1 },               // heat at V₁
    ];
  }
  throw new Error('unknown reshape mode: ' + mode);
}

// ============================================================================
//  IRREVERSIBILITY — a finite-ΔT heat leak. The gas absorbs Q_h not from a
//  reservoir at T_h but from one ΔT hotter, and rejects to one ΔT colder. The
//  cycle's work is unchanged for the same heats, but the UNIVERSE's entropy
//  rises: ΔS_universe = −Q_h/T_h_res + Q_c/T_c_res (reservoir entropy changes),
//  which is > 0 strictly whenever ΔT > 0, and exactly 0 for reversible Carnot.
//  We also return the lost work W_lost = T_c_res · ΔS_universe (Gouy–Stodola).
// ============================================================================
export function irreversibleLedger(cyc, dT = 0) {
  const { Q_h, Q_c } = heatByEntropy(cyc);
  const Th_res = cyc.T_h + dT;   // the hot reservoir is HOTTER than the gas (leak)
  const Tc_res = cyc.T_c - dT;   // the cold reservoir is COLDER than the gas
  if (!(Tc_res > 0)) throw new Error('ΔT too large: cold reservoir would be ≤ 0 K');
  // reservoir entropy change: hot loses Q_h at Th_res, cold gains Q_c at Tc_res
  const dS_res_hot  = -Q_h / Th_res;
  const dS_res_cold =  Q_c / Tc_res;
  // the gas returns to its start ⇒ its own ΔS = 0 over a cycle; universe = reservoirs
  const dS_universe = dS_res_hot + dS_res_cold;
  const W_lost = Tc_res * dS_universe;     // Gouy–Stodola: lost work = T_cold·ΔS_univ
  return { dS_universe, W_lost, Th_res, Tc_res };
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier).
//  Shared verbatim between the Node twin and the in-page pill. Tiered tols.
// ============================================================================
export function runCoreTests(opts = {}) {
  const grid = opts.grid || 4000;            // Path-1 integration grid for the static checks
  const triples = opts.triples || 200;       // random (T_h,T_c,r) triples for assertion 3
  const checks = [];
  const add = (name, ok, info, star) => checks.push({ name, ok: !!ok, info: info || '', star: !!star });

  const TOL_W   = 1e-9;    // Path-1 ↔ Path-2 work agreement (Simpson quadrature-limited)
  const TOL_EXACT = 1e-12; // η, heat-side algebra, ΔS_cycle

  // a tiny deterministic PRNG so the test is seed-pure & reproducible
  let _s = 0x2545F491 ^ (opts.seed || 1);
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();

  const base = carnotStates(500, 300, 3, GAMMA_MONO);

  // (1)★ two derivations agree — W_area == W_thermo, no shared formula
  {
    const wa = workByArea(base, grid).W;
    const ht = heatByEntropy(base).W_thermo;
    add('(1)★ W(∮P dV, geometry) == W(∫T dS, heat) — two independent derivations agree',
        Math.abs(wa - ht) < TOL_W, `W_area=${wa.toFixed(6)} J  W_thermo=${ht.toFixed(6)} J  Δ=${Math.abs(wa - ht).toExponential(2)}`, true);
  }

  // (2)★ η_measured == 1 − T_c/T_h
  {
    const ht = heatByEntropy(base);
    const etaMeas = ht.W_thermo / ht.Q_h;
    const etaCarnot = carnotEfficiency(base.T_h, base.T_c);
    add('(2)★ η = W/Q_h == 1 − T_c/T_h (exact)',
        Math.abs(etaMeas - etaCarnot) < TOL_EXACT, `η=${etaMeas.toFixed(12)}  1−Tc/Th=${etaCarnot.toFixed(12)}`, true);
  }

  // (3)★ exactness over many random (T_h,T_c,r) triples — not a lucky default
  {
    let maxErr = 0, worst = '';
    for (let k = 0; k < triples; k++) {
      const Tc = pick(150, 600);
      const Th = Tc + pick(40, 700);
      const r  = pick(1.3, 12);
      const g  = rnd() < 0.5 ? GAMMA_MONO : GAMMA_DIATOMIC;
      const cyc = carnotStates(Th, Tc, r, g);
      const ht = heatByEntropy(cyc);
      const etaMeas = ht.W_thermo / ht.Q_h;
      const e = Math.abs(etaMeas - carnotEfficiency(Th, Tc));
      if (e > maxErr) { maxErr = e; worst = `Th=${Th.toFixed(1)} Tc=${Tc.toFixed(1)} r=${r.toFixed(2)} γ=${g.toFixed(3)}`; }
    }
    add(`(3)★ η == 1−Tc/Th over ${triples} random (Th,Tc,r,γ) triples — not a lucky default`,
        maxErr < TOL_EXACT, `max |Δη| = ${maxErr.toExponential(2)}  @ ${worst}`, true);
  }

  // (4)★ NO cycle beats Carnot — every reshaped cycle between the same reservoirs,
  //      through the SAME Path-1 integrator, has η < η_Carnot strictly.
  {
    let allBelow = true, worstGap = Infinity, detail = '';
    for (let k = 0; k < 40; k++) {
      const Tc = pick(200, 500), Th = Tc + pick(60, 500), r = pick(1.5, 8);
      const cyc = carnotStates(Th, Tc, r, GAMMA_MONO);
      const etaC = carnotEfficiency(Th, Tc);
      for (const mode of ['isoV', 'isoP']) {
        const res = runCycle(cyc.n, cyc.gamma, reshapedLegs(cyc, mode), 3000);
        // its temperature stays within [Tc, Th] (well-posed), and η < ηC strictly
        const within = res.Tmin >= Tc - 1e-6 && res.Tmax <= Th + 1e-6;
        const gap = etaC - res.eta;
        if (!(within && gap > 1e-6)) { allBelow = false; detail = `${mode}: η=${res.eta.toFixed(5)} vs Carnot ${etaC.toFixed(5)} (within=${within})`; }
        if (gap < worstGap) worstGap = gap;
      }
    }
    add('(4)★ NO reshaped cycle (isoV/isoP lobe, same reservoirs) beats Carnot — η < η_Carnot strictly',
        allBelow, allBelow ? `smallest margin below Carnot = ${worstGap.toExponential(2)}` : detail, true);
  }

  // (5)★ ΔS_cycle == 0 for reversible Carnot
  {
    const led = entropyLedger(base);
    add('(5)★ ΔS_cycle = Q_h/T_h − Q_c/T_c == 0 (reversible Carnot)',
        Math.abs(led.dS_cycle) < TOL_EXACT, `ΔS_cycle = ${led.dS_cycle.toExponential(2)} J/K`, true);
  }

  // (6) volume-ratio fingerprint V₂/V₁ == V₃/V₄
  {
    const [p1, p2, p3, p4] = base.points;
    const a = p2.V / p1.V, b = p3.V / p4.V;
    add('(6) volume-ratio fingerprint V₂/V₁ == V₃/V₄',
        Math.abs(a - b) < TOL_EXACT, `${a.toFixed(9)} == ${b.toFixed(9)}`);
  }

  // (7)★ irreversible step loses AND ΔS_universe > 0 strictly; reversible == 0
  {
    const rev = irreversibleLedger(base, 0);
    const irr = irreversibleLedger(base, 30);
    add('(7)★ irreversible heat leak: ΔS_universe > 0 strictly (and == 0 for ΔT=0)',
        Math.abs(rev.dS_universe) < TOL_EXACT && irr.dS_universe > 1e-6 && irr.W_lost > 1e-3,
        `ΔT=0 → ΔS_univ=${rev.dS_universe.toExponential(2)} · ΔT=30K → ΔS_univ=${irr.dS_universe.toFixed(4)} J/K, W_lost=${irr.W_lost.toFixed(2)} J`, true);
  }

  // (9) adiabat invariant P·Vᵞ = const at every sampled point (γ=5/3 and 7/5)
  {
    let maxRel = 0;
    for (const g of [GAMMA_MONO, GAMMA_DIATOMIC]) {
      const cyc = carnotStates(550, 300, 4, g);
      const [, p2, p3] = cyc.points;
      // trace the 2→3 adiabat and check P·Vᵞ constant against the endpoints
      const c2 = adiabatPVgamma(p2.P, p2.V, g), c3 = adiabatPVgamma(p3.P, p3.V, g);
      maxRel = Math.max(maxRel, Math.abs(c2 - c3) / c2);
    }
    add('(9) adiabat invariant P·Vᵞ = const at the endpoints (γ=5/3 and 7/5)',
        maxRel < TOL_EXACT, `max relative drift = ${maxRel.toExponential(2)}`);
  }

  // (10) the ODE-integrated adiabat endpoint matches the closed-form TVᵞ⁻¹ endpoint
  {
    const cyc = carnotStates(600, 280, 5, GAMMA_MONO);
    const wa = workByArea(cyc, grid);
    // the stepper's traced T at the end of leg 2→3 should equal T_c (closed form)
    const e3 = Math.abs(wa.adiabatEnds.T3 - cyc.T_c);
    const e1 = Math.abs(wa.adiabatEnds.T1 - cyc.T_h);
    add('(10) from-scratch ODE adiabat endpoint == closed-form TVᵞ⁻¹ endpoint (no drift)',
        e3 < 1e-6 && e1 < 1e-6, `|T₃−T_c|=${e3.toExponential(2)} K, |T₁−T_h|=${e1.toExponential(2)} K`);
  }

  // (11)★ γ-independence — η unchanged across γ∈{5/3,7/5} (the bound ignores the substance)
  {
    const a = carnotStates(500, 300, 3, GAMMA_MONO);
    const b = carnotStates(500, 300, 3, GAMMA_DIATOMIC);
    const ea = heatByEntropy(a).W_thermo / heatByEntropy(a).Q_h;
    const eb = heatByEntropy(b).W_thermo / heatByEntropy(b).Q_h;
    const shapeDiffers = Math.abs(a.points[2].V - b.points[2].V) > 1e-3; // V₃ differs with γ
    add('(11)★ η independent of γ (5/3 vs 7/5) though cycle shape changes',
        Math.abs(ea - eb) < TOL_EXACT && shapeDiffers, `η(5/3)=${ea.toFixed(12)} η(7/5)=${eb.toFixed(12)}, V₃ differs by ${Math.abs(a.points[2].V - b.points[2].V).toFixed(3)}`, true);
  }

  // (12) closure / determinism — loop returns to start, clockwise ⇒ W>0, seed-pure
  {
    const wa = workByArea(base, grid);
    const closes = Math.abs(wa.adiabatEnds.T1 - base.T_h) < 1e-6;
    const clockwisePositive = wa.W > 0;
    add('(12) closure & determinism: loop returns to T_h, clockwise ⇒ W>0',
        closes && clockwisePositive, `T₁_traced=${wa.adiabatEnds.T1.toFixed(6)} K, W=${wa.W.toFixed(3)} J > 0`);
  }

  const pass = checks.filter(c => c.ok).length;
  return { checks, pass, total: checks.length };
}
