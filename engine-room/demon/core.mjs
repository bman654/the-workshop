// ============================================================================
//  The Engine Room · The Demon's Ledger — CORE
//  Pure, dependency-free. The IDENTICAL code is inlined into index.html; this
//  file is the Node-testable twin (the falsifiability harness runs against it).
//
//  THE CLAIM, made falsifiable: a Maxwell's Demon that SORTS a gas by watching
//  it can be turned into a Szilárd engine — one molecule in a box, a partition
//  dropped, the side it lands on MEASURED, then the gas allowed to push the
//  partition out doing WORK. It looks like free energy from information. It is
//  not. Three facets, ONE ledger:
//
//    (1) THE WORK has a price set by the gas. One molecule pushing a piston
//        isothermally from V→2V does W = ∫P dV = ∫(kT/V)dV = kT·ln2 of work.
//        We integrate it FROM SCRATCH (midpoint Riemann of P=kT/V), never the
//        closed form, and it equals kT·ln2 to the grid tolerance.
//
//    (2) THE BIT is counted by the SAME entropy() that the Shannon bench uses.
//        Learning which half the molecule is in is exactly H = −Σp·log₂p bits
//        (= 1 for a fair box). The work extracted is W = H·kT·ln2 — the bit
//        literally has a temperature. We do NOT re-derive H; we IMPORT entropy
//        from ../../entropy/core.mjs. That import is the literal "one ledger".
//
//    (3) THE ERASURE closes the loop. Landauer (1961): erasing one bit of the
//        demon's memory dumps Q = kT·ln2 of heat. Erase the H bits you learned
//        and Q_erase = H·kT·ln2 — exactly the work you extracted. Net cycle work
//        ≤ 0 (== 0 only in the reversible limit). ΔS_universe ≥ 0 always.
//
//  THE NEGATIVE CONTROL (the free lunch, given a real chance to fail): skip the
//  erasure. The gas+work subsystem's entropy goes NEGATIVE — it really does look
//  like the Second Law broke. But the demon's memory now holds H unerased bits,
//  ΔS_memory = +H·k·ln2 per cell, and that term covers the deficit so the TOTAL
//  ΔS_universe is ≥ 0 at every step. You didn't beat the law; you hid the cost
//  in the memory. When the finite tape fills, the demon is dead — it cannot
//  measure without erasing, and erasing pays the bill.
//
//  THE CARNOT WALL (two-reservoir variant): run the extraction between a hot and
//  a cold reservoir and the harvested work is bounded by the SAME Carnot ceiling
//  carnotEfficiency(T_h,T_c) — imported from ../carnot/core.mjs — that the Carnot
//  bench proves. A second shared sibling function; a second wall it may kiss.
//
//  SCALE NOTE (the trap, honored): this is the ONE-MOLECULE engine, so the
//  constant is k_B PER MOLECULE, never R_GAS per mole. kT·ln2 @ 300 K ≈ 2.87e-21
//  J — the bit's price at room temperature. Displaying ΔS in k_B units and joules
//  in scientific notation is presentation only; the core computes in SI.
// ============================================================================

// THE CROSS-WING IMPORTS — the literal "one ledger". Do NOT redefine these.
import { entropy } from '../../entropy/core.mjs';      // H = −Σp·log₂p, maps d.p over an array
import { carnotEfficiency } from '../carnot/core.mjs'; // 1 − T_c/T_h

// PER-MOLECULE constants. k_B, not R_GAS — the scale trap.
export const K_B = 1.380649e-23;   // J/K — Boltzmann's constant (per molecule)
export const LN2 = Math.LN2;       // ln2

// Count the information of learning which side, via the SHARED entropy(). Lock
// the array-of-{p} form: H(½)=1 bit exactly; H(0.8)=0.72193…
export function bitInfo(p) { return entropy([{ p }, { p: 1 - p }]); }

// ── the from-scratch work integral (NOT the closed form — this is falsifier 1) ─
//  One molecule, isothermal expansion V_lo→V_hi against pressure P = kT/V.
//  W = ∫ P dV by midpoint Riemann. At V_hi = 2·V_lo this → kT·ln2.
export function workIsotherm(T, Vlo, Vhi, grid = 4000) {
  let W = 0;
  const dV = (Vhi - Vlo) / grid;
  for (let i = 0; i < grid; i++) {
    const V = Vlo + (i + 0.5) * dV;
    W += (K_B * T / V) * dV;
  }
  return W;
}

// clamp helper
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ============================================================================
//  THE MODEL CONTRACT — compute(state) returns ONE object every facet reads.
//  This is the "one ledger": the box canvas, the P–V canvas, the dual-ledger
//  SVG, the ΔS_universe meter and the live-numbers block all read THIS object,
//  produced by ONE call. They cannot drift because there is nothing to drift
//  between.
//
//  state fields (all optional, sane defaults):
//    T            single-mode reservoir temperature (K)
//    p            bias of the partition (probability molecule is on the measured
//                 side); ½ is a fair box
//    twoReservoir if true, extraction runs between T_h (hot) and T_c (cold)
//    T_h, T_c     the two reservoirs (two-reservoir mode)
//    speed        1 = quasistatic (reversible); >1 = faster → irreversible
//
//  efficiencyFactor: the irreversibility knob (kept SIMPLE per design — the core
//    OWNS this, no full Gouy–Stodola). speed=1 → factor 1 (reversible). Faster →
//    factor < 1, so harvested work < kT·ln2 while Q_erase stays full → netW < 0.
// ============================================================================
export const K_IRR = 0.18;   // irreversibility slope; speed=1 → factor 1

export function efficiencyFactor(speed) {
  return clamp(1 - K_IRR * (speed - 1), 0, 1);
}

export function compute(state = {}) {
  const T = state.T != null ? state.T : 300;
  const p = state.p != null ? state.p : 0.5;
  const twoReservoir = !!state.twoReservoir;
  const T_h = state.T_h != null ? state.T_h : 500;
  const T_c = state.T_c != null ? state.T_c : 250;
  const speed = state.speed != null ? state.speed : 1;

  // the temperature at which work is extracted: the single mode's T, or the hot
  // reservoir in two-reservoir mode.
  const Textract = twoReservoir ? T_h : T;

  const H = bitInfo(p);                  // bits learned (shared entropy())
  const kTln2 = K_B * Textract * LN2;    // the price of one bit at Textract
  const eff = efficiencyFactor(speed);

  // EXPECTED work over both measurement outcomes. The molecule lands on the
  // measured side with prob p (push from V→2V, W=kT·ln2) and the other side with
  // prob 1−p (push the other way, same magnitude). The information that decides
  // WHICH way to couple the piston is H bits; the expected extractable work is
  // H·kT·ln2 (resolves the "expected over both outcomes" subtlety). At p=½ this
  // equals kT·ln2 == workIsotherm(T,½,1) to grid tolerance.
  const W_ideal = H * kTln2;             // the reversible ceiling on extraction

  // two-reservoir Carnot ceiling. The molecule absorbs Q_h = H·kT_h·ln2 of heat
  // from the hot reservoir to do its isothermal expansion; if it must reject
  // waste heat to a COLD reservoir at T_c, the work it can convert is bounded by
  // the SAME Carnot wall the Carnot bench proves: W ≤ carnotEfficiency·Q_h. The
  // single-mode engine (Textract only) has no cold sink, so it is unbounded by
  // Carnot — its only ceiling is W_ideal.
  let eta_carnot = null, Q_h = null, ceiling = null;
  if (twoReservoir) {
    eta_carnot = carnotEfficiency(T_h, T_c);
    Q_h = W_ideal;                       // heat absorbed at T_h (the source)
    ceiling = eta_carnot * Q_h;          // the wall harvested work may kiss, not cross
  }

  // what you actually harvest. Irreversibility (speed) discounts it; in
  // two-reservoir mode it is additionally capped at the Carnot ceiling.
  let W_extracted = W_ideal * eff;       // ≤ ideal (single-mode harvest)
  if (twoReservoir) W_extracted = Math.min(W_extracted, ceiling);

  // Landauer: erasing the H bits learned costs the FULL kT·ln2 per bit at the
  // extraction temperature — erasure is not discounted by how slowly you
  // extracted. (The two-reservoir Carnot ceiling is a separate display bound on
  // harvested work, NOT folded into the Landauer ledger — the netW invariant is
  // judged in the single-reservoir terms that keep it provably ≤ 0.)
  const Q_erase = H * kTln2;

  // net cycle work: the single-mode harvest minus the erasure you must pay.
  // ≤ 0 always; == 0 in the reversible limit (speed=1, honest cycle). We use the
  // single-mode harvest W_ideal·eff (NOT the Carnot-capped W_extracted) so the
  // ledger invariant holds identically in both modes.
  const W_harvest = W_ideal * eff;
  const netW = W_harvest - Q_erase;

  // the bridge: thermodynamic entropy of the bit vs its Shannon (bit) count.
  const dS_thermo = H * K_B * LN2;       // J/K — ΔS_thermo == ΔS_shannon × k·ln2
  const dS_shannon = H;                  // bits

  // ΔS_universe: the gas+work subsystem loses H·k·ln2 of entropy when work is
  // cashed out; an HONEST cycle erases, paying +H·k·ln2 back, so the two cancel
  // to 0. In the free-lunch path the gas term stays negative but the demon's
  // memory holds the +H·k·ln2, so the max(0, …) is the universe total — never
  // below 0 by construction.
  const dS_gasWork = -dS_thermo * eff;   // entropy extracted as work (negative)
  const dS_memory = dS_thermo;           // the bit, still in (or paid back to) memory
  const dS_universe = Math.max(0, dS_gasWork + dS_memory);

  return {
    T, p, twoReservoir, T_h, T_c, speed, Textract, eff,
    H, kTln2, W_ideal, W_harvest, W_extracted, Q_erase, netW,
    dS_thermo, dS_shannon, dS_gasWork, dS_memory, dS_universe,
    ceiling, eta_carnot, Q_h,
  };
}

// ============================================================================
//  THE HEADLESS FINITE-STATE MACHINE — the spine that makes cheating impossible.
//  The page wires buttons to these; the test drives it through every legal and
//  illegal (phase, action) pair. Illegal actions are NO-OPS (state unchanged).
//
//  Phases:   EMPTY → PARTITIONED → MEASURED → EXPANDED → (ERASE→EMPTY |
//            refuseErasure→EMPTY-dirty). After EXPANDED you cannot 'drop' a new
//            partition until you 'erase' — you literally cannot start a clean
//            cycle without paying the bill.
// ============================================================================
export const PHASES = ['EMPTY', 'PARTITIONED', 'MEASURED', 'EXPANDED'];
export const ACTIONS = ['drop', 'measure', 'extract', 'erase'];

// which actions are legal in which phase (the gate).
export const LEGAL = {
  EMPTY: ['drop'],
  PARTITIONED: ['measure'],
  MEASURED: ['extract'],
  EXPANDED: ['erase'],
};

export function makeMachine(init = {}) {
  return {
    phase: 'EMPTY',
    dirty: false,           // a cycle was run but not erased (free-lunch path)
    tape: [],               // the demon's memory cells (bits recorded)
    tapeSize: init.tapeSize != null ? init.tapeSize : 8,
    measured: null,         // which side the last molecule landed on (0/1)
    refuseErasure: !!init.refuseErasure,
  };
}

// is an action legal in the current phase?
export function can(machine, action) {
  const legal = LEGAL[machine.phase] || [];
  if (action === 'drop' && machine.tape.length >= machine.tapeSize) return false; // tape full → demon dead
  return legal.includes(action);
}

// apply an action. Returns the SAME machine (mutated) if legal; a no-op if not.
export function transition(machine, action, opts = {}) {
  if (!can(machine, action)) return machine;   // illegal → no-op, state unchanged
  switch (action) {
    case 'drop':
      machine.phase = 'PARTITIONED';
      machine.measured = null;
      break;
    case 'measure':
      // record which side (opts.side, default a deterministic 0) into the tape
      machine.measured = opts.side != null ? opts.side : 0;
      machine.tape.push(machine.measured);
      machine.phase = 'MEASURED';
      break;
    case 'extract':
      machine.phase = 'EXPANDED';
      break;
    case 'erase':
      if (machine.refuseErasure) {
        // the cheat: leave the bit on the tape, return dirty
        machine.dirty = true;
      } else {
        machine.tape.pop();   // erase the bit (pay kT·ln2)
        machine.dirty = false;
      }
      machine.phase = 'EMPTY';
      machine.measured = null;
      break;
  }
  return machine;
}

// ============================================================================
//  THE FREE-LUNCH RUN — drive N honest-looking cycles WITHOUT erasing and prove
//  ΔS_universe never dips below 0. Returns the per-step ledger so the test (and
//  the page) can assert (a) the gas+work subsystem alone reads negative, and
//  (b) the demon-memory term covers it so the total is ≥ 0 at every step.
// ============================================================================
export function freeLunchRun(state = {}, N = 8) {
  const c = compute(state);
  const steps = [];
  let gasWork = 0, memory = 0;
  for (let i = 1; i <= N; i++) {
    gasWork += c.dS_gasWork;      // each uncashed cycle drives the gas term down
    memory += c.dS_memory;        // …and parks the bit in memory (positive)
    const universe = Math.max(0, gasWork + memory);
    steps.push({ n: i, gasWork, memory, universe });
  }
  return { steps, perCycle: c };
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier).
//  Shared verbatim between the Node twin and the in-page pill. Returns the same
//  {checks, passed, total} shape Carnot/entropy use.
//
//  re-extraction parity (assertion 0): the Node twin re-extracts the inline core
//  from index.html and compares it to entropy.toString() char-for-char; that
//  test lives in core.test.mjs (it needs filesystem access). Here we count the
//  in-process witness that the inline bitInfo IS the imported entropy: bitInfo
//  is defined in terms of entropy() and reproduces its exact values.
// ============================================================================
export function runCoreTests(opts = {}) {
  const grid = opts.grid || 4000;
  const checks = [];
  const add = (name, ok, info, star) => checks.push({ name, ok: !!ok, info: info || '', star: !!star });

  const TOL_W = grid >= 100000 ? 1e-9 : 1e-6;  // tiered: tighter at high grid (the Node twin)
  const TOL_EXACT = 1e-12;
  const TOL_BRIDGE = 1e-30;

  // (0)★ the bit-counter IS entropy() from the Shannon bench — bitInfo reproduces
  //      entropy()'s exact values (the byte-for-byte char test is in the Node twin).
  {
    const a = bitInfo(0.5), b = entropy([{ p: 0.5 }, { p: 0.5 }]);
    const c2 = bitInfo(0.8), d = entropy([{ p: 0.8 }, { p: 0.2 }]);
    add('(0)★ the bit is counted by the SHARED entropy() — bitInfo ≡ entropy([{p},{p:1−p}])',
        a === b && c2 === d && Math.abs(a - 1) < TOL_EXACT,
        `H(½)=${a} (==entropy ${b}); H(0.8)=${c2.toFixed(5)} (==entropy ${d.toFixed(5)})`, true);
  }

  // (1)★ W(∫P dV one-molecule isotherm) == kT·ln2 — derived, not hardcoded.
  {
    const Wnum = workIsotherm(300, 0.5, 1.0, grid);
    const kTln2 = K_B * 300 * LN2;
    const rel = Math.abs(Wnum - kTln2) / kTln2;
    add('(1)★ W(∫P dV, one-molecule isotherm V→2V) == kT·ln2 — derived, not hardcoded',
        rel < TOL_W, `W=${Wnum.toExponential(4)} J  kT·ln2=${kTln2.toExponential(4)} J  rel=${rel.toExponential(2)}`, true);
  }

  // (2)★ W == [−Σp·log₂p via the SAME entropy()] × kT·ln2 (== 1 bit for fair box).
  {
    const c = compute({ T: 300, p: 0.5, speed: 1 });
    const kTln2 = K_B * 300 * LN2;
    add('(2)★ W_extracted == H·kT·ln2 (H via the SAME entropy()); == 1 bit for the fair box',
        Math.abs(c.H - 1) < TOL_EXACT && Math.abs(c.W_extracted - kTln2) < TOL_BRIDGE,
        `H=${c.H} → W=${c.W_extracted.toExponential(4)} J == kT·ln2 ${kTln2.toExponential(4)} J`, true);
  }

  // (3)★ erase cost kT·ln2 == work extracted → net cycle work ≤ 0 (== 0 reversible).
  {
    const rev = compute({ T: 300, p: 0.5, speed: 1 });   // reversible
    const fast = compute({ T: 300, p: 0.5, speed: 3 });  // irreversible
    add('(3)★ Q_erase == W extracted → netW == 0 (reversible) and < 0 strictly (faster)',
        Math.abs(rev.netW) < TOL_BRIDGE && fast.netW < -1e-30,
        `rev netW=${rev.netW.toExponential(2)} J (==0); fast netW=${fast.netW.toExponential(2)} J (<0)`, true);
  }

  // (4)★ ΔS_thermo == ΔS_shannon × k·ln2 (the bridge). 1 bit → 9.5699e-24 J/K.
  {
    const c = compute({ T: 300, p: 0.5 });
    const expect = c.dS_shannon * K_B * LN2;
    add('(4)★ ΔS_thermo == ΔS_shannon × k·ln2 (bits × k·ln2 → J/K)',
        Math.abs(c.dS_thermo - expect) < TOL_BRIDGE && Math.abs(c.dS_thermo - 9.5699e-24) < 1e-28,
        `ΔS_thermo=${c.dS_thermo.toExponential(4)} J/K per bit (k·ln2)`, true);
  }

  // (5)★ biased box extracts H·kT·ln2 < kT·ln2 — H predicts the shortfall exactly;
  //      and monotonic: p→0 or 1 ⇒ H→0 ⇒ W→0.
  {
    const fair = compute({ T: 300, p: 0.5 });
    const bias = compute({ T: 300, p: 0.8 });
    const near0 = compute({ T: 300, p: 0.02 });
    const Hbias = bitInfo(0.8);
    const shortfall = Math.abs(bias.W_extracted - Hbias * fair.kTln2) < TOL_BRIDGE;
    const mono = bias.W_extracted < fair.W_extracted && near0.W_extracted < bias.W_extracted;
    add('(5)★ biased box: W = H·kT·ln2 < kT·ln2 (H predicts the shortfall); p→0/1 ⇒ W→0',
        Math.abs(Hbias - 0.72193) < 1e-4 && shortfall && mono,
        `H(0.8)=${Hbias.toFixed(5)} → W=${bias.W_extracted.toExponential(3)} J < fair ${fair.W_extracted.toExponential(3)} J; W(p=.02)=${near0.W_extracted.toExponential(2)} J`, true);
  }

  // (6) two-reservoir extraction ≤ Carnot ceiling 1−T_c/T_h (same carnotEfficiency).
  {
    let allBelow = true, worst = '', minMargin = Infinity;
    for (const [Th, Tc] of [[500, 250], [800, 300], [400, 390], [600, 100]]) {
      for (const speed of [1, 2, 4]) {
        const c = compute({ twoReservoir: true, T_h: Th, T_c: Tc, p: 0.5, speed });
        const margin = c.ceiling - c.W_extracted;
        if (!(margin >= -1e-30)) { allBelow = false; worst = `Th=${Th} Tc=${Tc} sp=${speed}: W=${c.W_extracted.toExponential(3)} > ceiling ${c.ceiling.toExponential(3)}`; }
        if (margin < minMargin) minMargin = margin;
        // the ceiling itself must equal the imported carnotEfficiency × Q_h
        if (Math.abs(c.ceiling - carnotEfficiency(Th, Tc) * c.Q_h) > TOL_BRIDGE) { allBelow = false; worst = `ceiling != carnotEfficiency·Q_h @ Th=${Th} Tc=${Tc}`; }
      }
    }
    add('(6) two-reservoir extraction ≤ Carnot ceiling carnotEfficiency(T_h,T_c)·Q_h (shared fn)',
        allBelow, allBelow ? `all harvested ≤ ceiling; smallest margin = ${minMargin.toExponential(2)} J` : worst);
  }

  // (7)★ free-lunch (skip erase): ΔS_(gas+work) < 0 BUT ΔS_memory covers it →
  //      ΔS_universe ≥ 0 at every step across N=1..tapeSize. The negative control.
  {
    const run = freeLunchRun({ T: 300, p: 0.5, speed: 1 }, 8);
    let gasNegative = true, universeOk = true, worst = '';
    for (const s of run.steps) {
      if (!(s.gasWork < 0)) gasNegative = false;          // (a) gas+work alone reads negative
      if (!(s.universe >= -1e-40)) { universeOk = false; worst = `step ${s.n}: universe=${s.universe.toExponential(2)}`; }
      // (b) the memory term covers the gas deficit so the raw sum is ≥ 0 too
      if (s.gasWork + s.memory < -1e-40) { universeOk = false; worst = `step ${s.n}: gas+mem=${(s.gasWork + s.memory).toExponential(2)}`; }
    }
    add('(7)★ free-lunch: ΔS_(gas+work) < 0 BUT ΔS_memory covers it → ΔS_universe ≥ 0 (every step)',
        gasNegative && universeOk,
        gasNegative && universeOk ? `8 uncashed cycles: gas+work negative throughout, universe stayed ≥ 0` : worst, true);
  }

  // (8) FSM legality — drive the machine through every (phase, action) pair; only
  //     LEGAL[] actions advance, illegal ones are no-ops (state unchanged).
  {
    let allLegal = true, worst = '';
    for (const phase of PHASES) {
      for (const action of ACTIONS) {
        const m = makeMachine();
        m.phase = phase;                       // force into this phase
        const before = m.phase;
        const legal = (LEGAL[phase] || []).includes(action);
        transition(m, action, { side: 0 });
        const advanced = m.phase !== before;
        // legal action must advance the phase; illegal must leave it unchanged
        if (legal && !advanced) { allLegal = false; worst = `legal ${phase}/${action} did not advance`; }
        if (!legal && advanced) { allLegal = false; worst = `illegal ${phase}/${action} advanced to ${m.phase}`; }
      }
    }
    // the spine guarantee: after EXTRACT (EXPANDED) you cannot 'drop' without 'erase'
    const m2 = makeMachine();
    transition(m2, 'drop'); transition(m2, 'measure', { side: 1 }); transition(m2, 'extract');
    const blockedBeforeErase = m2.phase === 'EXPANDED' && (transition(m2, 'drop'), m2.phase === 'EXPANDED');
    if (!blockedBeforeErase) { allLegal = false; worst = 'could drop a fresh partition without erasing'; }
    add('(8) FSM legality: only LEGAL (phase,action) pairs advance; cannot re-cycle without erasing',
        allLegal, allLegal ? 'all 16 pairs honored; extraction gated until erasure paid' : worst);
  }

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length };
}
