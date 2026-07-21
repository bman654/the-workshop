// ============================================================================
//  THE DEEP HEARTH · The Settling Melt — the estate's ONE crystal-settling core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module is
//  the SOLE SOURCE OF TRUTH for the crystallization order, the residual-melt
//  enrichment, and the banded core the drill lifts. The bench page inlines the
//  slab between the SETTLING-MELT CORE BEGIN / END sentinels byte-for-byte;
//  core.test.mjs proves the inlined copy is identical (indentation-normalised) to
//  this file, so the page, the in-page pill and the headless Node twin all run
//  the SAME math.
//
//  ── THE ONE GESTURE, made falsifiable ───────────────────────────────────────
//  You set a cooling history and POUR a body of melt into the chamber. It cools
//  on its own clock. Six phases begin to crystallize in strict order of their
//  LIQUIDUS temperature (Bowen's ladder) — olivine first, quartz last. Every
//  crystal that forms SETTLES to the floor. Then you drive a brass drill down
//  through the pile and lift a slender core.
//
//  The floor lever decides everything:
//    SWEEPING (fractional) — a settled crystal is removed from contact with the
//        liquid. The liquid left behind is a DIFFERENT liquid than the one you
//        poured; the pile is a stratified RECORD, read bottom-up.
//    STILL (equilibrium)   — crystals stay entrained. Nothing is ever separated
//        from anything. The drill lifts the whole body and it comes up BLANK.
//
//  Exact claims (machine-ε, framed as this MODEL'S internal law — not a reading
//  of any particular real intrusion):
//    • CRUX-1 (ORDER) — over the whole run, for all 15 pairs, a phase of higher
//        liquidus T has a strictly earlier onset, and already carries mass at the
//        later phase's onset. The ladder is an ORDERING, not a coincidence.
//    • CRUX-2 (1/F) — the perfectly incompatible stranger (D = 0) never enters a
//        crystal, so its concentration in the residual melt is exactly C₀/F.
//        Checked against an INDEPENDENT step-marched melt ledger (a different
//        computation from the closed lever-rule F) to <1e-9 at every step.
//    • CRUX-3 (MASS) — total mass and per-component mass close to <1e-9 at every
//        step, again as TWO independent computations: the closed-form lever rule
//        Σ frac·(1−fmin)·X versus a ledger that starts full and subtracts what
//        leaves. Never a quantity checked against its own definition.
//    • CRUX-4 (BAND ENRICHMENT) — each band's mean stranger enrichment over the
//        mass it grew from has the closed form ln((1−Sa)/(1−Sb))/(Sb−Sa), matched
//        by Simpson quadrature to <1e-12, and it rises strictly up the core.
//    NEG-CONTROL (STILL) — under equilibrium the enrichment vanishes (×1 exactly),
//        band variance is identically 0, and the pulled core's bulk equals the
//        starting bulk to <1e-12.
//    POS-CONTROL — so the neg-control cannot be vacuous: the SWEPT core's band
//        spread and enrichment spread are both large and non-degenerate.
//
//  MUTATION HARNESS — every claim above is proved FALSIFIABLE in the shipped
//  tests: simulate()/pullCore()/runCoreTests() take an optional mutation name
//  ('order' | 'mass' | 'enrich' | 'still' | 'bandE') that plants one specific bug,
//  and the Node twin asserts the matching check actually TRIPS. A test that
//  cannot fail is not a test.
// ============================================================================

// === SETTLING-MELT CORE BEGIN ===
// ── THE LADDER. Six phases, strictly descending liquidus temperature. `c` is the
//    engraved mineral colour the bench paints the band with; `habit` is the grain
//    shape the falling crystal is drawn as (equant / prism / needle / plate /
//    lath / blocky) so the species read apart by SHAPE as well as hue.
const PHASES = [
  { key: 'ol', name: 'Olivine',   T: 1420, c: [163, 196,  79], base: 0.16, hydrous: false, habit: 'equant' },
  { key: 'px', name: 'Pyroxene',  T: 1310, c: [ 58, 124, 110], base: 0.18, hydrous: false, habit: 'prism'  },
  { key: 'am', name: 'Amphibole', T: 1190, c: [ 44,  66,  98], base: 0.14, hydrous: true,  habit: 'needle' },
  { key: 'bi', name: 'Biotite',   T: 1080, c: [126,  74,  40], base: 0.12, hydrous: true,  habit: 'plate'  },
  { key: 'fs', name: 'Feldspar',  T:  980, c: [226, 212, 190], base: 0.26, hydrous: false, habit: 'lath'   },
  { key: 'qz', name: 'Quartz',    T:  860, c: [198, 214, 222], base: 0.14, hydrous: false, habit: 'blocky' },
];

const CZ0 = 1.0;        // starting concentration of the incompatible "stranger"
const NSTEP = 720;      // cooling steps marched per run

const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

// ── TRAPPED INTERSTITIAL MELT. The residue that never escapes the packing grains
//    — and therefore the FLOOR on F, which sets the headline enrichment ×1/F.
//    A quenched body traps far more than a patient one; a deep body compacts
//    under its own load and traps less than a shallow one. So the number the
//    visitor reads is genuinely THEIRS: it moves with both dials.
function trappedMelt(rate, depth) {
  return 0.014 + 0.086 * Math.pow(cl01(rate), 1.25) + 0.024 * (1 - cl01(depth));
}

// ── A COOLING HISTORY. rate ∈ [0,1] (damper: patient → quenched), depth ∈ [0,1],
//    sweep = the floor lever. Depth shifts every liquidus equally (order-preserving)
//    and swells the hydrous phases' modal share (also order-preserving: the ladder
//    is set by T, not by abundance).
function history(rate, depth, sweep) {
  const r = cl01(rate), d = cl01(depth);
  const W = 55 + 175 * r;                       // crystallization window width, °C
  const shift = 120 * d;                        // pressure shift of every liquidus
  const L = PHASES.map(p => p.T + shift);
  const raw = PHASES.map(p => p.base * (p.hydrous ? 1 + 0.85 * d : 1));
  const s = raw.reduce((a, b) => a + b, 0);
  const frac = raw.map(v => v / s);
  return { W, L, frac, sweep: !!sweep, rate: r, depth: d, shift, fmin: trappedMelt(r, d) };
}

// ── THE RUN. March the temperature down from above the first liquidus to below
//    the last. At each step X_i is the fraction of phase i that has crystallized;
//    dm_i is what newly settled this step. Two ledgers are kept side by side on
//    PURPOSE — a closed-form lever rule and a step-marched subtraction — so the
//    mass-balance claim compares two independent computations, not a quantity
//    against its own definition.
function simulate(h, mut) {
  const { W, frac, fmin } = h;
  const L = (mut === 'order') ? swap(h.L, 2, 3) : h.L;   // MUTATION: break the ladder
  const Tstart = L[0] + 45, Tend = L[5] - W;
  const trace = [], slices = [];
  const onset = PHASES.map(() => -1);
  let prevX = PHASES.map(() => 0);
  let prevS = 0;
  const cum = PHASES.map(() => 0);
  const melt = frac.slice();                    // independent running ledger of the liquid

  for (let k = 0; k <= NSTEP; k++) {
    const T = Tstart + (Tend - Tstart) * (k / NSTEP);
    const X = L.map(Li => cl01((Li - T) / W));
    const dm = X.map((x, i) => frac[i] * (1 - fmin) * (x - prevX[i]));
    for (let i = 0; i < 6; i++) {
      cum[i] += dm[i];
      if (onset[i] < 0 && X[i] > 0) onset[i] = k;
    }
    // closed-form lever rule: the solid fraction, then F = 1 − S
    let S = 0; for (let i = 0; i < 6; i++) S += frac[i] * (1 - fmin) * X[i];
    const F = 1 - S;
    // D = 0 ⇒ every atom of the stranger stays in the shrinking liquid
    let Cz = CZ0 / F;
    if (mut === 'enrich') Cz *= (1 + 1e-6);              // MUTATION: break 1/F
    const dTot = dm.reduce((a, b) => a + b, 0);
    if (dTot > 1e-12) {
      slices.push({ h: dTot, mix: dm.map(v => v / dTot), T, F, Sa: prevS, Sb: S });
    }
    // the INDEPENDENT ledger: start full, subtract what leaves. Never derived from `cum`.
    for (let i = 0; i < 6; i++) melt[i] -= dm[i] * (mut === 'mass' ? (1 + 1e-6) : 1);
    const Fledger = melt.reduce((a, b) => a + b, 0);
    const CzLedger = CZ0 / Fledger;                       // enrichment from the OTHER ledger
    trace.push({ k, T, X: X.slice(), F, Fledger, Cz, CzLedger, S,
                 cum: cum.slice(), melt: melt.slice(), dTot });
    prevX = X; prevS = S;
  }
  return { trace, slices, onset, Tstart, Tend, frac, W, L, fmin };
}

function swap(a, i, j) { const b = a.slice(); const t = b[i]; b[i] = b[j]; b[j] = t; return b; }

// ── BAND ENRICHMENT, closed form. A band grew from the liquid while the solid
//    fraction went Sa → Sb. The stranger's concentration is C₀/F = C₀/(1−S), so
//    the MEAN enrichment over the mass that band grew from is
//        (1/(Sb−Sa)) ∫_Sa^Sb dS/(1−S) = ln((1−Sa)/(1−Sb)) / (Sb−Sa).
//    This is the second readout the bench paints up the core's length.
//    Written with log1p, NOT log((1−Sa)/(1−Sb)): for a hair-thin band the ratio is
//    1+δ with δ ~ 1e-11 and forming it first throws away eleven digits. log1p of
//    d/(1−Sb) is the same value, computed stably — the difference is visible at
//    the tail of a run, where the thinnest bands live.
function meanEnrichment(Sa, Sb) {
  const d = Sb - Sa;
  if (!(d > 1e-13)) return 1 / (1 - Sa);
  return Math.log1p(d / (1 - Sb)) / d;
}
// the same quantity by Simpson quadrature — a genuinely different algorithm, used
// to cross-check the closed form to <1e-12.
function meanEnrichmentQuad(Sa, Sb, n) {
  const d = Sb - Sa;
  if (!(d > 1e-13)) return 1 / (1 - Sa);
  const N = (n || 200) * 2;                    // even panel count for Simpson
  const hstep = d / N;
  const f = S => 1 / (1 - S);
  let sum = f(Sa) + f(Sb);
  for (let i = 1; i < N; i++) sum += f(Sa + i * hstep) * (i % 2 ? 4 : 2);
  return (sum * hstep / 3) / d;
}

// ── WHAT THE DRILL LIFTS, given the floor lever. This is the payoff's own core
//    entry: the bench calls it and racks whatever comes back.
function pullCore(h, sim, mut) {
  const still = !h.sweep && mut !== 'still';           // MUTATION 'still': ignore the lever
  if (!still) {
    // FRACTIONAL — the settled pile, stratified, stranger-free (D = 0 leaves none behind)
    const tot = sim.slices.reduce((a, s) => a + s.h, 0);
    const slices = sim.slices.map(s => ({
      h: s.h / tot, mix: s.mix, T: s.T, F: s.F, Sa: s.Sa, Sb: s.Sb,
      E: (mut === 'bandE') ? 1 : meanEnrichment(s.Sa, s.Sb),
    }));
    return { banded: true, slices, bulkZ: 0, fmin: sim.fmin,
             Ffinal: sim.trace[sim.trace.length - 1].F, mass: tot };
  }
  // EQUILIBRIUM — nothing was ever removed; you lift the WHOLE body at once
  return { banded: false, fmin: sim.fmin,
           slices: [{ h: 1, mix: sim.frac.slice(), T: sim.Tend, F: 1, Sa: 0, Sb: 0, E: 1 }],
           bulkZ: CZ0, Ffinal: sim.trace[sim.trace.length - 1].F, mass: 1 };
}

// ── the mineral-band variance of a core: 0 for a body that never separated.
function bandVar(core) {
  const n = core.slices.length;
  if (n < 2) return 0;
  let tot = 0; for (const s of core.slices) tot += s.h;
  let v = 0;
  for (let i = 0; i < 6; i++) {
    let m = 0; for (const s of core.slices) m += s.mix[i] * s.h;
    m /= tot;
    for (const s of core.slices) v += s.h * (s.mix[i] - m) * (s.mix[i] - m);
  }
  return v;
}
// ── the enrichment spread up a core: max/min of the per-band mean enrichment.
function enrichSpread(core) {
  let lo = Infinity, hi = -Infinity;
  for (const s of core.slices) { if (s.E < lo) lo = s.E; if (s.E > hi) hi = s.E; }
  return hi / lo;
}

/* ── THE SHARED PROOF — run identically by the in-page pill and the Node twin.
   `mut` plants one bug so the tests can be proved falsifiable. ─────────────── */
function runCoreTests(mut) {
  const checks = [];
  const ok = (name, pass, info) => checks.push({ name, pass: !!pass, info: info || '' });

  const HS = [history(0.10, 0.20, true), history(0.62, 0.80, true), history(0.95, 0.00, true)];

  for (let hi = 0; hi < HS.length; hi++) {
    const h = HS[hi];
    const s = simulate(h, mut);
    const tag = `[history ${hi + 1}: rate ${h.rate.toFixed(2)}, depth ${h.depth.toFixed(2)}]`;

    // ── CRUX-1 · ORDER, over the FULL run, all 15 pairs ──────────────────────
    let ordL = true, ordK = true, present = true;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
      if (!(s.L[i] > s.L[j])) ordL = false;
      if (!(s.onset[i] >= 0 && s.onset[j] >= 0 && s.onset[i] < s.onset[j])) ordK = false;
      if (!(s.onset[j] >= 0 && s.trace[s.onset[j]].cum[i] > 0)) present = false;
    }
    ok(`${tag} liquidus ladder strictly descending (all 15 pairs)`, ordL);
    ok(`${tag} onset strictly monotone in liquidus T (all 15 pairs, full run)`, ordK);
    ok(`${tag} every earlier phase already carries mass at the later phase's onset`, present);

    // ── CRUX-2/3 · enrichment and mass, two independent computations ─────────
    let eDef = 0, eLed = 0, mTot = 0, mPer = 0, fLed = 0;
    for (const t of s.trace) {
      eDef = Math.max(eDef, Math.abs(t.Cz * t.F - CZ0));
      eLed = Math.max(eLed, Math.abs(t.Cz - t.CzLedger) / t.Cz);   // RELATIVE: C ~ 1/F blows up as F→fmin
      let sum = 0; for (let i = 0; i < 6; i++) sum += t.melt[i] + t.cum[i];
      mTot = Math.max(mTot, Math.abs(sum - 1));
      for (let i = 0; i < 6; i++) mPer = Math.max(mPer, Math.abs(t.melt[i] + t.cum[i] - h.frac[i]));
      fLed = Math.max(fLed, Math.abs(t.F - t.Fledger));
    }
    ok(`${tag} enrichment ≡ 1/F exactly`, eDef < 1e-12, `max |C·F − C₀| = ${eDef.toExponential(1)}`);
    ok(`${tag} closed-form enrichment === the step-marched ledger's`, eLed < 1e-9,
       `max relative |ΔC|/C = ${eLed.toExponential(1)}`);
    ok(`${tag} closed-form F === step-marched ledger F`, fLed < 1e-9, `max ${fLed.toExponential(1)} < 1e-9`);
    ok(`${tag} total mass closes at every step`, mTot < 1e-9, `max err ${mTot.toExponential(1)} < 1e-9`);
    ok(`${tag} per-component mass closes at every step`, mPer < 1e-9, `max ${mPer.toExponential(1)} < 1e-9`);

    // final residue is exactly the trapped melt ⇒ headline enrichment ×1/fmin
    const fin = s.trace[s.trace.length - 1];
    ok(`${tag} residue F = ${fin.F.toFixed(9)} = trapped melt ⇒ stranger ×${(1 / fin.F).toFixed(3)}`,
       Math.abs(fin.F - h.fmin) < 1e-12 && Math.abs(fin.Cz - 1 / h.fmin) < 1e-9);

    // ── CRUX-4 · band enrichment: closed form === Simpson, and it RISES up the core
    const cf = pullCore(h, s, mut);
    let qWorst = 0, rises = true, prevE = -Infinity;
    for (let i = 0; i < cf.slices.length; i += 7) {
      const sl = cf.slices[i];
      qWorst = Math.max(qWorst, Math.abs(sl.E - meanEnrichmentQuad(sl.Sa, sl.Sb, 120)) / sl.E);
    }
    for (const sl of cf.slices) { if (!(sl.E > prevE - 1e-15)) rises = false; prevE = sl.E; }
    ok(`${tag} band enrichment closed form === Simpson quadrature`, qWorst < 1e-12,
       `max relative |Δ|/E = ${qWorst.toExponential(1)}`);
    ok(`${tag} band enrichment rises monotonically up the core (${cf.slices.length} bands)`, rises);
  }

  // ── NEG-CONTROL vs POS-CONTROL, at one pinned history ─────────────────────
  const hf = history(0.20, 0.40, true), he = history(0.20, 0.40, false);
  const sf = simulate(hf, mut), se = simulate(he, mut);
  const cf = pullCore(hf, sf, mut), ce = pullCore(he, se, mut);
  const vf = bandVar(cf), ve = bandVar(ce);

  ok('POS-CONTROL: the SWEPT core is banded (many slices, large band variance)',
     cf.banded && cf.slices.length > 100 && vf > 1e-3, `${cf.slices.length} bands, variance ${vf.toExponential(2)}`);
  ok('NEG-CONTROL: the STILL core is UNBANDED (one slice, band variance ≡ 0)',
     !ce.banded && ce.slices.length === 1 && ve === 0, `variance ${ve}`);
  ok('POS/NEG contrast is NOT vacuous: swept band variance ≫ still',
     vf / Math.max(ve, 1e-30) > 1e6, `${vf.toExponential(2)} vs ${ve}`);

  let bulkErr = 0;
  for (let i = 0; i < 6; i++) bulkErr = Math.max(bulkErr, Math.abs(ce.slices[0].mix[i] - he.frac[i]));
  ok('NEG-CONTROL: the STILL core\'s bulk returns to the starting bulk',
     bulkErr < 1e-12, `max |Δ| = ${bulkErr.toExponential(1)}`);
  ok('NEG-CONTROL: under equilibrium the enrichment vanishes (×1 exactly, every band)',
     ce.slices.every(s => s.E === 1) && Math.abs(ce.bulkZ - CZ0) < 1e-12 && cf.bulkZ === 0);
  ok('POS-CONTROL: the SWEPT core\'s enrichment spread is large (a real gradient to paint)',
     enrichSpread(cf) > 4, `×${enrichSpread(cf).toFixed(1)} bottom-to-top`);

  // ── the headline number is genuinely the visitor's: it MOVES with the dials ──
  {
    const a = history(0.05, 0.9, true), b = history(0.95, 0.05, true);
    const ea = 1 / a.fmin, eb = 1 / b.fmin;
    ok('the headline ×1/F is not pinned: patient-deep vs quenched-shallow differ ≥ 3×',
       ea / eb >= 3, `×${ea.toFixed(1)} vs ×${eb.toFixed(1)}`);
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === SETTLING-MELT CORE END ===

export {
  PHASES, CZ0, NSTEP, cl01, trappedMelt, history, simulate,
  meanEnrichment, meanEnrichmentQuad, pullCore, bandVar, enrichSpread, runCoreTests,
};
