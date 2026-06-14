// ============================================================================
//  The Engine Room · The Brownian Ratchet — CORE
//  Pure, dependency-free. The IDENTICAL code is inlined into index.html; this
//  file is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE CLAIM, made falsifiable: Feynman's ratchet-and-pawl (Smoluchowski 1912;
//  Feynman Lectures I·46, 1963) is a microscopic engine that LOOKS like it turns
//  random thermal jiggling into one-way rotation — useful work from pure noise.
//  Run honestly, it provably CANNOT, once the pawl sits in the same bath as the
//  gas. Four falsifiable claims, ONE ledger (compute):
//
//    (1)★ THE NULL — at T_pawl == T_gas the net drift ⟨ω⟩ is zero to within the
//         measured Poisson error bars, for ANY tooth asymmetry a. The pawl is in
//         the bath too: thermal fluctuations lift it exactly as often as the gas
//         pushes the wheel, so forward and backward hops detail-balance. THE HEART.
//
//    (2)★ THE TILT — break the symmetry with ΔΘ = Θ_gas − Θ_pawl and the wheel
//         turns: sign(⟨ω⟩) == sign(ΔΘ), monotone in ΔΘ, and → 0 as ΔΘ → 0. It is
//         a real engine — but only because two baths at different T is a real
//         temperature difference, the same fuel every engine in this wing burns.
//
//    (3)★ THE CEILING — load the ratchet against a torque τ and the extractable
//         work efficiency η = W_out/Q_h never exceeds carnotEfficiency(Θg,Θp),
//         IMPORTED from ../carnot/core.mjs — the SAME Carnot wall the Carnot bench
//         proves. At stall ⟨ω⟩ → 0 ⇒ W → 0; in the quasi-static corner η → ceiling.
//
//    (4)★ THE CONTROLS — (4a) a symmetric wheel (a = 0.5) rectifies NOTHING even
//         under a real ΔΘ; (4b) remove the pawl (one bath, detailed balance) and
//         ⟨ω⟩ = 0. Two negative controls, each given a real chance to break.
//
//  HONEST FRAMING (à la the Demon's efficiencyFactor — "the core OWNS this"):
//  this is a REDUCED dimensionless RATE model. The forward/backward hop rates are
//  Arrhenius factors exp(−ΔE/Θ_eff) with geometry-weighted effective temperatures;
//  it is NOT a from-first-principles Kramers escape-rate derivation. We MEASURE the
//  null (a Monte-Carlo of independent Poisson hops with computed σ error bars); we
//  do not CLAIM to "prove the Second Law". The honesty IS the point: the model is
//  built so the null falls out of detailed balance, and the test would catch it if
//  the geometry ever rectified the symmetric case.
//
//  REDUCED / DIMENSIONLESS UNITS — ONE degree of freedom. k_B is per DOF (NEVER
//  per mole). Θ are dimensionless reduced temperatures O(1); to convert to kelvin
//  for the Carnot ceiling we map Θ → K by T_SCALE (the scale cancels in 1−Θp/Θg).
// ============================================================================

// THE CROSS-WING IMPORT — the literal "one ledger". ONE HOP (Carnot is a sibling
// of this folder, not two levels up). Do NOT redefine carnotEfficiency.
import { carnotEfficiency } from '../carnot/core.mjs'; // 1 − T_c/T_h

// PER-DEGREE-OF-FREEDOM constants (k_B per DOF, never R_GAS per mole — the trap).
export const K_B = 1.380649e-23;   // J/K — Boltzmann's constant (per DOF, display only)
export const E_B = 1.0;            // the reduced barrier height ΔE (dimensionless)
export const ASYM = 0.2;           // default tooth asymmetry a ∈ (0,0.5]; 0.5 = symmetric
export const T_SCALE = 300;        // Θ → kelvin map for the (scale-cancelling) Carnot ceiling

// ── the seedable xorshift32 PRNG — IDENTICAL to carnot/demon's generator ──────
//  s = (0x2545F491 ^ (seed>>>0)) >>> 0; then xorshift; returns [0,1).
export function makeRng(seed = 1) {
  let s = (0x2545F491 ^ (seed >>> 0)) >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ── the sawtooth potential (cosmetic geometry; the wheel's teeth) ─────────────
//  U(x) over one tooth of fractional width: a steep face (fraction a) and a gentle
//  ramp (fraction 1−a). x in [0,1) is the phase within one tooth. Returns reduced
//  potential height; sawForce is −dU/dx. These shape the DRAWN teeth and the
//  cosmetic Langevin jiggle — never the hop statistics (those are ratchetRates).
export function sawU(x, Eb = E_B, a = ASYM) {
  let t = x - Math.floor(x);                 // wrap into [0,1)
  if (t < a) return Eb * (t / a);            // steep rising face over fraction a
  return Eb * (1 - (t - a) / (1 - a));       // gentle falling ramp over fraction 1−a
}
export function sawForce(x, Eb = E_B, a = ASYM) {
  let t = x - Math.floor(x);
  if (t < a) return -Eb / a;                 // steep slope (large restoring force)
  return Eb / (1 - a);                       // gentle slope (small force, the other way)
}

// ============================================================================
//  THE RATE MODEL — the heart of the falsifiability. Geometry-weighted effective
//  temperatures so the NULL holds for ALL asymmetries a (the mandatory fix that
//  makes claim 4a pass and keeps claims 1,2 honest):
//
//    Teff_f = (1−a)·Θg + a·Θp   forward: gas-weighted at small a (the gentle face)
//    Teff_b = a·Θg + (1−a)·Θp   backward: pawl-weighted at small a (the steep face)
//
//  WHY this is honest & correct:
//   · at Θg == Θp both Teff collapse to Θ ⇒ r_fwd == r_bwd (τ=0) ⇒ net 0 for EVERY
//     a — the NULL (claims 1, 4b-shape) by detailed balance.
//   · the drift ∝ Teff_f − Teff_b = (1−2a)(Θg − Θp): it vanishes at a = 0.5 (the
//     symmetric control, claim 4a) AND at ΔΘ = 0 (the null) — ONE formula, both.
//   · away from those it is monotone and sign-flipping with ΔΘ (claim 2).
//  A load torque τ is the resistance the engine works AGAINST: it RAISES the
//  forward barrier (Eb + τ) and LOWERS the backward one (Eb − τ), so a positive
//  load opposes the forward drift and drives ⟨ω⟩ toward zero (stall). Below stall
//  the engine still turns forward and does work W = ⟨ω⟩·τ ≥ 0 against the load.
// ============================================================================
export function ratchetRates(Tg, Tp, tau = 0, Eb = E_B, a = ASYM) {
  const Teff_f = (1 - a) * Tg + a * Tp;      // forward: gas-weighted at small a (gentle face)
  const Teff_b = a * Tg + (1 - a) * Tp;      // backward: pawl-weighted at small a (steep face)
  return { r_fwd: Math.exp(-(Eb + tau) / Teff_f), r_bwd: Math.exp(-(Eb - tau) / Teff_b) };
}

// the negative-control rates: NO pawl ⇒ one bath, plain detailed balance. Both
// directions see the SAME temperature T, so r_fwd == r_bwd at τ=0 ⇒ ⟨ω⟩ = 0.
export function symmetricRates(T, tau = 0, Eb = E_B) {
  return { r_fwd: Math.exp(-(Eb + tau) / T), r_bwd: Math.exp(-(Eb - tau) / T) };
}

// ============================================================================
//  THE MONTE-CARLO STEPPER — a rate-MC of independent forward/backward hops.
//  One rng() draw + two compares per step (cheap). The honest yardstick is the
//  COMPUTED Poisson σ: the net displacement is a difference of two independent
//  Poisson counts (fwd, bwd), whose variance is exactly fwd + bwd, so the standard
//  error on ⟨ω⟩ = net/steps is sqrt(fwd+bwd)/steps. The null is judged against
//  THIS computed σ — never an eyeballed threshold.
//
//  Determinism: identical args ⇒ byte-identical omega & net (seeded rng, no float
//  order dependence). pF + pB < 1 is asserted (dtRate keeps the per-step prob < 1).
// ============================================================================
export function simulate({ Tg, Tp, tau = 0, a = ASYM, hasPawl = true, steps = 2_000_000, seed = 1, dtRate = 0.5 } = {}) {
  const { r_fwd, r_bwd } = hasPawl ? ratchetRates(Tg, Tp, tau, E_B, a) : symmetricRates(Tg, tau, E_B);
  const pF = r_fwd * dtRate, pB = r_bwd * dtRate;
  if (!(pF + pB < 1)) throw new Error(`pF+pB must be < 1 (got ${(pF + pB).toFixed(4)}); lower dtRate`);
  const rng = makeRng(seed);
  let net = 0, fwd = 0, bwd = 0;
  const pFB = pF + pB;
  for (let i = 0; i < steps; i++) {
    const u = rng();
    if (u < pF) { net++; fwd++; }
    else if (u < pFB) { net--; bwd++; }
  }
  return {
    omega: net / steps, net, fwd, bwd,
    sigmaOmega: Math.sqrt(fwd + bwd) / steps,   // computed Poisson std-error on ⟨ω⟩
    steps, r_fwd, r_bwd, pF, pB,
  };
}

// ── the COSMETIC Langevin walk (overdamped Euler–Maruyama + Box–Muller) ───────
//  Drives ONLY the display-θ / vane jiggle of the apparatus — a faithful, down-
//  sampled sample of the SAME thermal walk, never the statistics and never a fake.
//  Returns a short trajectory of θ for the animation. dt small; D ∝ Θ (jiggle ∝ √Θ).
export function simulateLangevin({ Theta = 1.0, n = 64, dt = 0.02, seed = 7, a = ASYM, Eb = E_B } = {}) {
  const rng = makeRng(seed);
  const gauss = () => {
    // Box–Muller (one of the pair; cheap and adequate for cosmetic jiggle)
    const u1 = Math.max(1e-12, rng()), u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const D = Math.max(0, Theta);                 // diffusion ∝ Θ
  let x = 0; const traj = [];
  for (let i = 0; i < n; i++) {
    // overdamped: dx = −U'(x) dt + sqrt(2D dt) ξ  (the force is the cosmetic saw)
    const drift = sawForce(x, Eb, a) * dt * 0.04; // damped so the jiggle reads, not bolts
    x += drift + Math.sqrt(2 * D * dt) * gauss() * 0.06;
    traj.push(x);
  }
  return traj;
}

// the stall load: the torque τ at which forward and backward rates balance (⟨ω⟩=0)
//  set r_fwd == r_bwd: (Eb−τ)/Teff_f == (Eb+τ)/Teff_b  ⇒ solve for τ. Below stall
//  the loaded engine still turns forward and does work; at/above it, it can't.
export function stallLoad(Tg, Tp, a = ASYM, Eb = E_B) {
  const Tf = (1 - a) * Tg + a * Tp, Tb = a * Tg + (1 - a) * Tp;
  // r_fwd==r_bwd: (Eb+τ)/Tf = (Eb−τ)/Tb ⇒ τ·(Tf+Tb) = Eb·(Tf−Tb) ⇒ τ = Eb·(Tf−Tb)/(Tf+Tb)
  // Tg>Tp ⇒ Tf>Tb ⇒ stall τ > 0: the opposing torque that brings ⟨ω⟩ to zero.
  return Eb * (Tf - Tb) / (Tf + Tb);
}

// ============================================================================
//  THE ONE LEDGER — compute(state). Every dial, meter, plot, needle and verdict
//  reads THIS one call (demon-style), so they can never drift. Seed-averaged.
//
//  KSIG is the SINGLE source of truth for the null band, shared by compute(), the
//  needle wedge, and runCoreTests. |omega| ≤ KSIG·omegaSigma ⇒ "consistent with 0".
// ============================================================================
export const KSIG = 4;

export function compute(state = {}) {
  const Tg = state.Tg != null ? state.Tg : 1.0;
  const Tp = state.Tp != null ? state.Tp : 1.0;
  const load = state.load != null ? state.load : 0;     // dimensionless torque τ
  const a = state.a != null ? state.a : ASYM;
  const hasPawl = state.hasPawl != null ? state.hasPawl : true;
  const seeds = state.seeds && state.seeds.length ? state.seeds : [1, 2, 3];
  const steps = state.steps != null ? state.steps : 300_000;
  const dtRate = state.dtRate != null ? state.dtRate : 0.5;
  const teeth = state.teeth != null ? state.teeth : 18;

  // seed-average the MC; pool the per-seed σ as rms σ / √N (independent runs).
  let omegaSum = 0, fwdSum = 0, bwdSum = 0, sig2 = 0, r_fwd = 0, r_bwd = 0;
  for (const s of seeds) {
    const r = simulate({ Tg, Tp, tau: load, a, hasPawl, steps, seed: s, dtRate });
    omegaSum += r.omega; fwdSum += r.fwd; bwdSum += r.bwd;
    sig2 += r.sigmaOmega * r.sigmaOmega;
    r_fwd = r.r_fwd; r_bwd = r.r_bwd;       // rates are seed-independent
  }
  const N = seeds.length;
  const omega = omegaSum / N;
  const omegaSigma = Math.sqrt(sig2) / N;   // rms( per-seed σ ) / √N  (std-error of the mean)
  const netRevs = omega;                     // revs per step (the odometer integrates this)

  // drift classification against the shared KSIG band.
  let driftClass = 'null';
  if (Math.abs(omega) > KSIG * omegaSigma) driftClass = omega > 0 ? 'fwd' : 'rev';

  // η / Carnot ceiling — ONLY when loaded AND Tg > Tp > 0 (an engine needs a hot
  // gas, a cold pawl, and a load to do work). GUARD before calling carnotEfficiency
  // (which has no ordering guard). W_out = net·τ ; Q_h = fwd·E_b.
  let eta = null, etaCeil = null, stall = null;
  if (load > 0 && Tg > Tp && Tp > 0) {
    const W_out = omega * load;             // work per step against the load torque
    const fwdRevs = (fwdSum / N) / steps;   // forward hops per step (seed-averaged)
    const Qh = fwdRevs * E_B;               // heat drawn from the hot bath per step
    eta = Qh > 0 ? W_out / Qh : 0;
    etaCeil = carnotEfficiency(Tg * T_SCALE, Tp * T_SCALE); // == 1 − Tp/Tg (scale cancels)
    stall = stallLoad(Tg, Tp, a);
  }

  const theta = omega;                       // the wheel's reduced angle proxy (revs/step)
  const pawlLifted = hasPawl;                // the pawl exists (cosmetic lift state)

  return {
    Tg, Tp, load, a, hasPawl, seeds, steps, teeth,
    omega, omegaSigma, netRevs, eta, etaCeil, stall,
    driftClass, r_fwd, r_bwd, pawlLifted, theta,
  };
}

// ============================================================================
//  THE SELF-TEST — the four falsifiable claims (★). Shared verbatim between the
//  Node twin and the in-page pill. KSIG is identical everywhere. Returns the same
//  {checks, passed, total} shape the Demon/Carnot benches use.
//
//  In-page defaults: steps≈300k, seeds=[1,2,3] (+ a coarse grid for claim 2) →
//  tens of ms. The Node twin (core.test.mjs) cranks steps & seed-count so the
//  null bites harder (tighter σ). Thresholds (KSIG) are identical — only the σ
//  shrinks with more samples.
// ============================================================================
export function runCoreTests(opts = {}) {
  const steps = opts.steps || 300_000;
  const seeds = opts.seeds || [1, 2, 3];
  const checks = [];
  const add = (name, ok, info, star) => checks.push({ name, ok: !!ok, info: info || '', star: !!star });

  // (1)★ THE NULL — Θg == Θp, τ=0, a=0.2. Per-seed |omega| ≤ KSIG·σ; pooled
  //      |mean(omega)| ≤ KSIG·rms(σ)/√M. The heart.
  {
    let allPerSeed = true, worst = '';
    for (const T of [0.5, 1.0]) {
      // per-seed band
      let om = 0, sig2 = 0;
      for (const s of seeds) {
        const r = simulate({ Tg: T, Tp: T, tau: 0, a: 0.2, hasPawl: true, steps, seed: s });
        if (Math.abs(r.omega) > KSIG * r.sigmaOmega) { allPerSeed = false; worst = `T=${T} seed=${s}: |ω|=${Math.abs(r.omega).toExponential(2)} > ${KSIG}σ=${(KSIG * r.sigmaOmega).toExponential(2)}`; }
        om += r.omega; sig2 += r.sigmaOmega * r.sigmaOmega;
      }
      const mean = om / seeds.length, pooledSig = Math.sqrt(sig2) / seeds.length;
      if (Math.abs(mean) > KSIG * pooledSig) { allPerSeed = false; worst = `T=${T} pooled: |mean ω|=${Math.abs(mean).toExponential(2)} > ${KSIG}·rms(σ)/√M=${(KSIG * pooledSig).toExponential(2)}`; }
    }
    add('(1)★ NULL: ⟨ω⟩ == 0 at Θ_pawl == Θ_gas within ±KSIG·σ (per-seed AND pooled), τ=0',
        allPerSeed, allPerSeed ? `all seeds & pooled means inside the ${KSIG}σ band at Θ∈{0.5,1.0}` : worst, true);
  }

  // (2)★ THE TILT — sweep ΔΘ about Θ̄=0.6. sign(⟨ω⟩)==sign(ΔΘ) when clear of noise;
  //      |⟨ω⟩|≤KSIG·σ at ΔΘ=0; monotone non-decreasing (with per-point slack).
  {
    const Tbar = 0.6;
    const dthetas = [-0.4, -0.2, -0.05, 0, 0.05, 0.2, 0.4];
    let signOk = true, nullOk = true, monoOk = true, worst = '', prev = -Infinity;
    for (const d of dthetas) {
      const Tg = Tbar + d / 2, Tp = Tbar - d / 2;
      const c = compute({ Tg, Tp, load: 0, a: 0.2, hasPawl: true, steps, seeds });
      if (d === 0) {
        if (Math.abs(c.omega) > KSIG * c.omegaSigma) { nullOk = false; worst = `ΔΘ=0: |ω|=${Math.abs(c.omega).toExponential(2)} > ${KSIG}σ`; }
      } else {
        const clear = Math.abs(c.omega) > KSIG * c.omegaSigma;
        if (clear && Math.sign(c.omega) !== Math.sign(d)) { signOk = false; worst = `ΔΘ=${d}: sign(ω)=${Math.sign(c.omega)} != sign(ΔΘ)=${Math.sign(d)}`; }
      }
      // monotone non-decreasing in ΔΘ (omega rises with ΔΘ), with σ slack per point
      if (c.omega < prev - KSIG * c.omegaSigma) { monoOk = false; worst = `monotonicity broke at ΔΘ=${d}: ω=${c.omega.toExponential(2)} < prev ${prev.toExponential(2)}`; }
      prev = c.omega;
    }
    add('(2)★ TILT: sign(⟨ω⟩)==sign(ΔΘ) (clear of noise), ==0 at ΔΘ=0, monotone in ΔΘ',
        signOk && nullOk && monoOk, (signOk && nullOk && monoOk) ? `7-pt sweep about Θ̄=0.6: sign-flips with ΔΘ, null at 0, monotone` : worst, true);
  }

  // (3)★ THE CEILING — η ≤ carnotEfficiency()+TOL over a (Θg>Θp, load) grid, with
  //      the IMPORTED carnotEfficiency never redefined. At stall ⟨ω⟩→0 ⇒ W→0.
  {
    const TOL_CEIL = 5e-3;
    let allBelow = true, worst = '', maxEta = 0;
    // small-ceiling pairs so it BITES (0.6/0.5 ⇒ ceiling 1−0.5/0.6 = 0.1667)
    for (const [Tg, Tp] of [[0.6, 0.5], [1.0, 0.6], [0.8, 0.4]]) {
      const ceil = carnotEfficiency(Tg * T_SCALE, Tp * T_SCALE);
      const stall = stallLoad(Tg, Tp, 0.2);
      for (const frac of [0.1, 0.3, 0.5, 0.7, 0.9]) {       // load below stall
        const load = frac * stall;
        const c = compute({ Tg, Tp, load, a: 0.2, hasPawl: true, steps, seeds });
        if (c.eta != null) {
          if (c.eta > c.etaCeil + TOL_CEIL) { allBelow = false; worst = `Tg=${Tg} Tp=${Tp} load=${load.toFixed(3)}: η=${c.eta.toFixed(4)} > ceil ${c.etaCeil.toFixed(4)}`; }
          if (c.eta > maxEta) maxEta = c.eta;
          // the imported ceiling must equal 1 − Tp/Tg (scale cancels)
          if (Math.abs(c.etaCeil - (1 - Tp / Tg)) > 1e-9) { allBelow = false; worst = `etaCeil != 1−Tp/Tg @ Tg=${Tg} Tp=${Tp}`; }
        }
      }
      // at/above stall the engine can't turn forward against the load ⇒ W → 0
      const cStall = compute({ Tg, Tp, load: stall, a: 0.2, hasPawl: true, steps, seeds });
      if (cStall.omega > KSIG * cStall.omegaSigma) { allBelow = false; worst = `at stall Tg=${Tg} Tp=${Tp}: ω=${cStall.omega.toExponential(2)} still forward`; }
    }
    add('(3)★ CEILING: η = W/Q_h ≤ carnotEfficiency(Θg,Θp) IMPORTED (never redefined); stall ⇒ W→0',
        allBelow, allBelow ? `all loaded η ≤ Carnot ceiling (max η=${maxEta.toFixed(4)}); ceiling == 1−Θp/Θg` : worst, true);
  }

  // (4)★ THE CONTROLS — (4a) a=0.5 + real ΔΘ ⇒ |⟨ω⟩| ≤ KSIG·σ; (4b) hasPawl=false
  //      (symmetricRates) ⇒ ⟨ω⟩ = 0 by detailed balance.
  {
    // 4a: symmetric wheel under a strong ΔΘ rectifies nothing
    const sym = compute({ Tg: 1.0, Tp: 0.4, load: 0, a: 0.5, hasPawl: true, steps, seeds });
    const ok4a = Math.abs(sym.omega) <= KSIG * sym.omegaSigma;
    // 4b: no pawl (one bath) ⇒ detailed balance ⇒ null even with a "ΔΘ" passed
    const nopawl = compute({ Tg: 1.0, Tp: 0.4, load: 0, a: 0.2, hasPawl: false, steps, seeds });
    const ok4b = Math.abs(nopawl.omega) <= KSIG * nopawl.omegaSigma;
    add('(4)★ CONTROLS: (4a) symmetric wheel a=0.5 under ΔΘ rectifies nothing; (4b) no-pawl ⇒ ⟨ω⟩=0',
        ok4a && ok4b,
        `4a: |ω|=${Math.abs(sym.omega).toExponential(2)} ≤ ${KSIG}σ=${(KSIG * sym.omegaSigma).toExponential(2)} · 4b: |ω|=${Math.abs(nopawl.omega).toExponential(2)} ≤ ${KSIG}σ=${(KSIG * nopawl.omegaSigma).toExponential(2)}`, true);
  }

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length };
}
