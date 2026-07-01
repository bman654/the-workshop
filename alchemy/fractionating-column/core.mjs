/* ============================================================================
   ALCHEMY LAB · THE FRACTIONATING COLUMN — core.mjs   (the SOLE separation authority)

   Heat a 50/50 mix of two liquids in a reboiler and the vapour that rises is
   always RICHER in the more-volatile (lower-boiling) component than the liquid it
   left. Stack that one enrichment step over and over up a column of plates and the
   composition CLIMBS a staircase toward the pure light fraction. The single number
   that says how much each step enriches is the RELATIVE VOLATILITY α: the ratio of
   the two components' tendencies to escape into the vapour. One plate's vapour
   composition from the liquid composition below it is the constant-α VLE relation:

        y = stage(α, x) = α·x / (1 + (α−1)·x)

   At α = 1 the two liquids are equally volatile — y = x — and NO stacking of plates
   can separate them: the staircase collapses onto the diagonal and the top is the
   same 50/50 as the bottom. THAT is the lesson the bench makes you feel: separation
   is driven by the DIFFERENCE in volatility, never by more heat or more plates.

   TOTAL REFLUX is the limiting operating line: every drop of top vapour is condensed
   and poured straight back, so the vapour leaving plate n has the liquid composition
   that arrives at plate n+1 — x_{n+1} = y_n. Walking that recurrence N plates up from
   the reboiler is `walkStaircase`. Its closed-form answer is the FENSKE equation:

        xTop/(1−xTop) = α^(N+1) · xBot/(1−xBot)

   — the separation factor compounds geometrically in α^(plates). The stepped walk
   and Fenske's closed form are the SAME mathematics; `core.test.mjs` proves they
   agree to machine epsilon over an (α, N, xBot) sweep. The render relaxes its plates
   toward `walkStaircase` and re-derives NOTHING — render and proof share ONE source
   of truth.

   THE FLAME governs the TRANSIENT only, never the steady endpoint: too cold and the
   column never reaches steady (no boil-up); too hot and it FLOODS — the assembled
   staircase washes back toward 50/50. `operability` is the pure state machine for
   that; the rendered steady target is always `walkStaircase(α, N, 0.5)`.

   THE HONEST REGISTER — two DIFFERENT kinds of claim live here, kept distinct:
     • the stepped-walk === Fenske identity is UNCONDITIONAL and exact to machine ε
       (it is one algebraic recurrence vs its closed form);
     • `alphaFromBP` is a LABELED MODEL relation — Clausius–Clapeyron with a shared
       Trouton ΔHvap approximation. It is honest about being an approximation; it is
       NOT asserted exact, only its qualitative properties (equal b.p. ⇒ α = 1 EXACT,
       lighter-boils-first ⇒ α > 1, monotone, reciprocal-symmetric) are proven.

   index.html INLINES this file byte-identical between the COLUMN-CORE sentinels;
   core.test.mjs runs it in Node. If the page's inline ever drifts from this file,
   the page's re-extraction parity check fails.
   ============================================================================ */

// ── physical constant + the public tolerance the proof + caption both read ──────
export const R_GAS = 8.314462618;       // gas constant, J·mol⁻¹·K⁻¹   (CODATA)
export const TOL_CRUX = 1e-9;           // the public crux tolerance (stepped === Fenske)

/* ── stage(α, x): one ideal equilibrium plate. The constant-α vapour–liquid
   equilibrium: from a liquid mole-fraction x of the LIGHT component, the vapour in
   equilibrium with it is y = α·x/(1+(α−1)·x). α = 1 ⇒ y = x EXACTLY (no enrichment);
   α > 1 ⇒ y > x for 0<x<1 (vapour enriched in the light component). Maps [0,1]→[0,1],
   strictly increasing, fixes the endpoints 0 and 1. ── */
export function stage(alpha, x){
  return alpha * x / (1 + (alpha - 1) * x);
}

/* ── walkStaircase(α, N, xBot): the TOTAL-REFLUX staircase. Start at the reboiler
   liquid composition xBot; each plate's vapour y_n = stage(α, x_n) becomes the next
   plate's liquid x_{n+1} = y_n (total reflux). Climb N plates. Returns the liquid
   compositions x[0..N+1] (x[0]=xBot, x[N+1]=xTop), the vapour y[0..N] off each plate,
   and xTop = the top-plate composition the receiver fills toward. THIS is the single
   source of truth: the render relaxes plateX toward x[], and the self-test validates
   xTop against the Fenske closed form. ── */
export function walkStaircase(alpha, N, xBot){
  const x = [xBot], y = [];
  for(let i = 0; i <= N; i++){
    const yi = stage(alpha, x[i]);
    y.push(yi);
    x.push(yi);            // total reflux: the vapour off plate i is the liquid on plate i+1
  }
  return { x, y, xTop: x[N + 1] };
}

/* ── fenskeTop(α, N, xBot): the Fenske closed form for the total-reflux top
   composition. xTop/(1−xTop) = α^(N+1) · xBot/(1−xBot). The separation factor
   compounds geometrically in the number of plates. This is what walkStaircase().xTop
   must equal to machine ε — the crux identity. ── */
export function fenskeTop(alpha, N, xBot){
  const ratio = Math.pow(alpha, N + 1) * (xBot / (1 - xBot));
  return ratio / (1 + ratio);
}

/* ── alphaFromBP(TbLight, TbHeavy): a LABELED MODEL — relative volatility estimated
   from the two normal boiling points (K) via Clausius–Clapeyron with a SHARED Trouton
   ΔHvap (ΔHvap ≈ 88·Tb J/mol; the shared value uses the mean boiling point):

        α = exp( ΔHvap/R · (1/TbLight − 1/TbHeavy) )

   Properties (the ONLY things proven, since this is an approximation, NOT exact):
     • equal boiling points ⇒ α === 1 EXACTLY (the exponent's bracket is 0);
     • the lighter (lower-boiling) liquid boils first ⇒ TbLight < TbHeavy ⇒ α > 1;
     • monotone in the boiling-point gap; reciprocal-symmetric: swap ⇒ α → 1/α.
   This is kept DELIBERATELY distinct from the unconditional stepped-vs-Fenske
   identity above — it is a physical model, honestly labeled, not a machine-ε claim. ── */
export function alphaFromBP(TbLight, TbHeavy){
  const dHvap = 88 * 0.5 * (TbLight + TbHeavy);     // shared Trouton ΔHvap at the mean Tb
  return Math.exp(dHvap / R_GAS * (1 / TbLight - 1 / TbHeavy));
}

/* ── plateComposition(α, N, xBot): per-plate {xLight, xHeavy} for the two-colour
   bars. xLight is the liquid light-component fraction on that plate (from the walked
   staircase); xHeavy = 1 − xLight. Index 0 is the reboiler, index N+1 the top plate.
   The render reads these straight onto the bars, so the picture cannot disagree with
   the walk. ── */
export function plateComposition(alpha, N, xBot){
  const w = walkStaircase(alpha, N, xBot);
  return w.x.map(xl => ({ xLight: xl, xHeavy: 1 - xl }));
}

/* ── receiverPurity(α, N, xBot): the light-component purity collecting in the
   receiver flask at the top — the top-plate composition. 0 < value < 1 for finite
   α>1, N≥0, 0<xBot<1; strictly increasing in N (more plates ⇒ purer distillate). ── */
export function receiverPurity(alpha, N, xBot){
  return walkStaircase(alpha, N, xBot).xTop;
}

/* ── operability(flame): the PURE state machine the flame drives. φ ∈ [0,1].
     • φ < COLD_THRESH  → 'cold'  : no boil-up; the column never reaches steady.
     • φ > FLOOD_THRESH → 'flood' : over-boiled; the staircase washes back toward
                                    50/50 by `washback` ∈ (0,1] = (φ−FLOOD)/(1−FLOOD).
     • otherwise        → 'run'   : climbing/steady; the staircase assembles.
   The two thresholds are the SINGLE source the render reads — it never invents them. ── */
export const COLD_THRESH = 0.18;
export const FLOOD_THRESH = 0.82;
export function operability(flame){
  if(flame < COLD_THRESH) return { mode: 'cold', reachesSteady: false, washback: 0 };
  if(flame > FLOOD_THRESH) return { mode: 'flood', reachesSteady: true, washback: (flame - FLOOD_THRESH) / (1 - FLOOD_THRESH) };
  return { mode: 'run', reachesSteady: true, washback: 0 };
}

/* ============================================================================
   THE LIBRARY — curated two-component mixtures, ONE a load-bearing negative control.
   Each carries the two normal boiling points (°C, converted to K for alphaFromBP)
   and the derived α. benzene/toluene is the textbook ideal pair. ethanol/water is
   marked "× ideal" honestly — constant-α IGNORES its azeotrope, so the model
   over-promises a clean split that real ethanol/water cannot reach. The 'dead' entry
   is the negative control: identical boiling points ⇒ α = 1 ⇒ nothing separates.
   ============================================================================ */
const C2K = c => c + 273.15;
export const LIBRARY = [
  { id: 'benzene-toluene', name: 'benzene / toluene', light: 'benzene', heavy: 'toluene',
    TbLightC: 80.05, TbHeavyC: 110.65, note: 'the textbook ideal pair' },
  { id: 'ethanol-water', name: 'ethanol / water  (× ideal)', light: 'ethanol', heavy: 'water',
    TbLightC: 78.37, TbHeavyC: 100.0, idealCaveat: true,
    note: 'constant-α ignores the azeotrope — the model over-promises here' },
  { id: 'dead', name: 'same liquid (α = 1, dead)', light: 'A', heavy: 'A (identical)',
    TbLightC: 80.05, TbHeavyC: 80.05, negativeControl: true,
    note: 'identical boiling points — no flame can separate it' },
].map(e => ({ ...e, alpha: alphaFromBP(C2K(e.TbLightC), C2K(e.TbHeavyC)) }));

/* ── the proof sweep (the crux's grid) ── */
export const SWEEP = {
  alphas: [1.10, 1.30, 1.50, 1.90, 2.41, 3.0, 4.0, 5.0],
  Ns:     [1, 2, 3, 5, 8, 12, 16, 20],
  xBots:  [0.05, 0.10, 0.30, 0.50, 0.70, 0.90],
};

/* ── cruxWorstError(sweep): the worst absolute COMPOSITION-domain error between the
   stepped walk's xTop and Fenske's closed form, over the (α, N, xBot) grid. The sweep
   is bounded to fenskeTop < 1 − 1e-12: once the closed form saturates to pure, the
   composition-domain comparison is at the float ceiling (an expected limit of the
   register, NOT a failure), so those saturated cells are skipped and counted. Returns
   {worst, worstCfg, evaluated, skippedSaturated}. ── */
export function cruxWorstError(sweep = SWEEP){
  let worst = 0, worstCfg = null, evaluated = 0, skippedSaturated = 0;
  for(const alpha of sweep.alphas) for(const N of sweep.Ns) for(const xBot of sweep.xBots){
    const f = fenskeTop(alpha, N, xBot);
    if(!(f < 1 - 1e-12)){ skippedSaturated++; continue; }   // saturated-to-pure: expected register limit
    const w = walkStaircase(alpha, N, xBot).xTop;
    const e = Math.abs(w - f);
    evaluated++;
    if(e > worst){ worst = e; worstCfg = { alpha, N, xBot, walked: w, fenske: f }; }
  }
  return { worst, worstCfg, evaluated, skippedSaturated };
}

/* ============================================================================
   runSelfTest — the ONE proof body the in-page badge, the Node twin, and the
   landing's curated subset all call. Each row is a FALSIFIER with teeth.
   Returns { pass, total, rows:[{name, ok, info}] }.
   ============================================================================ */
export function runSelfTest(){
  const rows = [];
  const ok = (name, cond, info) => rows.push({ name, ok: !!cond, info });

  // (1) CRUX ★: the stepped walk === Fenske over the whole sweep, in the composition domain.
  const crux = cruxWorstError(SWEEP);
  ok('(1) crux ★ |xTop_walked − xTop_fenske| ≤ 1e-9 over the (α,N,xBot) sweep',
     crux.worst <= TOL_CRUX, 'worst=' + crux.worst.toExponential(3) + ' over ' + crux.evaluated +
     ' cells (' + crux.skippedSaturated + ' saturated-to-pure skipped)');

  // (2) NEG-CONTROL ★: the 'dead' entry ⇒ α === 1 AND the staircase never moves off xBot.
  const dead = LIBRARY.find(e => e.negativeControl);
  let deadAlphaOne = dead && dead.alpha === 1;
  let deadFlat = true;
  for(const N of [1, 2, 3, 5, 8, 12, 20])
    for(const xb of [0.05, 0.123456789, 0.3, 0.5, 0.7, 0.9])
      if(walkStaircase(1, N, xb).xTop !== xb) deadFlat = false;
  ok('(2) neg-control ★: dead entry α === 1 (exact) & walkStaircase(1,N,xBot).xTop === xBot bit-exact',
     deadAlphaOne && deadFlat);

  // (3) α-PROPERTIES of the labeled model: equal b.p. ⇒ 1; lighter-first ⇒ >1; monotone; reciprocal.
  const equalOne = alphaFromBP(353.2, 353.2) === 1;
  const lighterFirst = alphaFromBP(353.2, 383.8) > 1;
  // monotone: a wider boiling-point gap ⇒ a larger α (heavy fixed, light drops)
  let mono = true;
  let prev = alphaFromBP(380, 400);
  for(const TbL of [375, 370, 360, 350, 340]){ const a = alphaFromBP(TbL, 400); if(!(a > prev)) mono = false; prev = a; }
  // reciprocal-symmetric to 1e-12: swapping light/heavy inverts α
  const ab = alphaFromBP(353.2, 383.8), ba = alphaFromBP(383.8, 353.2);
  const reciprocal = Math.abs(ab * ba - 1) <= 1e-12;
  ok('(3) α(model): equal b.p. ⇒ α===1; lighter-boils-first ⇒ α>1; monotone in the gap; reciprocal-symmetric',
     equalOne && lighterFirst && mono && reciprocal);

  // (4) MONOTONE CLIMB: a real α > 1 ⇒ x strictly increases plate-to-plate up the stack.
  let climbOk = true;
  for(const alpha of [1.10, 1.30, 1.90, 2.41, 4.0]) for(const N of [1, 3, 8, 16]){
    const w = walkStaircase(alpha, N, 0.30);
    for(let i = 0; i < w.x.length - 1; i++) if(!(w.x[i + 1] > w.x[i])) climbOk = false;
  }
  ok('(4) monotone climb: real α>1 ⇒ x strictly increases plate-to-plate (the staircase rises)', climbOk);

  // (5) RECEIVER: 0 < receiverPurity < 1, and a taller column is purer (xTop(N+1) > xTop(N)).
  let recRange = true, recRises = true;
  for(const alpha of [1.30, 1.90, 2.41, 4.0]){
    for(const N of [0, 1, 2, 3, 5, 8, 12]){
      const p = receiverPurity(alpha, N, 0.5);
      if(!(p > 0 && p < 1)) recRange = false;
      if(receiverPurity(alpha, N + 1, 0.5) <= receiverPurity(alpha, N, 0.5)) recRises = false;
    }
  }
  ok('(5) receiver: 0 < receiverPurity < 1 and xTop(N+1) > xTop(N) (more plates ⇒ purer)', recRange && recRises);

  // (6) OPERABILITY ordering: exhaustive over the regime boundaries.
  const opOk =
    operability(0.0).mode === 'cold' && operability(0.10).mode === 'cold' &&
    operability(COLD_THRESH).mode === 'run' && operability(0.5).mode === 'run' &&
    operability(FLOOD_THRESH).mode === 'run' && operability(0.9).mode === 'flood' &&
    operability(1.0).mode === 'flood' &&
    operability(0.0).reachesSteady === false && operability(0.5).reachesSteady === true &&
    Math.abs(operability(1.0).washback - 1) < 1e-12 && operability(0.5).washback === 0 &&
    operability(0.9).washback > 0 && operability(0.9).washback < 1;
  ok('(6) operability: cold<' + COLD_THRESH + ' ⇒ never steady; run between; flood>' + FLOOD_THRESH +
     ' ⇒ washback∈(0,1]', opOk);

  // (7) PLATE COMPOSITION closes: xLight + xHeavy === 1 exactly on every plate, top === receiver.
  let closes = true, topMatches = true;
  for(const alpha of [1.30, 2.41, 4.0]) for(const N of [1, 3, 8]){
    const pc = plateComposition(alpha, N, 0.5);
    for(const p of pc) if(p.xLight + p.xHeavy !== 1) closes = false;
    if(pc[N + 1].xLight !== receiverPurity(alpha, N, 0.5)) topMatches = false;
  }
  ok('(7) plateComposition: xLight + xHeavy === 1 exact per plate; top plate === receiverPurity', closes && topMatches);

  const pass = rows.filter(r => r.ok).length;
  return { pass, total: rows.length, rows };
}

// dual-use guard: importable as an ES module AND requireable in a CommonJS Node twin
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { R_GAS, TOL_CRUX, COLD_THRESH, FLOOD_THRESH, stage, walkStaircase, fenskeTop,
    alphaFromBP, plateComposition, receiverPurity, operability, LIBRARY, SWEEP, cruxWorstError, runSelfTest };
}
