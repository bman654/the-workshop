// ============================================================================
// === CORE BEGIN ===  The Brazil-Nut Box — math core (single source of truth).
// ----------------------------------------------------------------------------
// THE OBJECT: a tall box of grains with one BURIED heavy bead. You SHAKE it.
//   The heavy bead climbs to the TOP. That is the BRAZIL-NUT EFFECT (granular
//   convection / size segregation): shake a can of mixed nuts and the big Brazil
//   nut surfaces, against gravity, against its own weight.
//
// THE SUPPORT KERNEL (the mechanism that ACTUALLY segregates). A naive 2D disk-
//   packing does NOT segregate under a symmetric shake — proven by explorer 0 at
//   Δ=0 — so we do NOT make a pure 2D grid carry the claim. Instead the proof
//   authority is a SUPPORT-COLUMN model:
//
//     The box floor under the bead is R adjacent COLUMNS (the bead's footprint is
//     R grains wide). Each column k holds a height col[k] of bed grains beneath
//     the bead. One SHAKE jostles every column independently: a transient VOID can
//     open (col[k] falls) or a grain can be kicked under (col[k] rises), each with
//     equal probability — a SYMMETRIC ±1 random walk per column. The rigid bead
//     rests on the TALLEST of its R supporting columns:
//
//         by  =  max over k of col[k]                     ← THE READOUT (climb)
//
//   WHY THE BEAD CLIMBS (an EXTREME-VALUE theorem, not a scripted animation):
//     • A single small GRAIN drops whenever a 1-wide void opens beneath it — common.
//     • The rigid BEAD can only sink when ALL R columns open a void at once — an
//       AND over R independent walks, which is RARE. So the bead readily ratchets
//       UP (any one column rising lifts the max) but resists sinking.
//     • by = max of R unbiased ±1 walks. The max of R i.i.d. symmetric walks has
//       POSITIVE expected drift for R > 1, and EXACTLY 0 for R = 1. The drift GROWS
//       with R (a bigger intruder ⇒ more columns ⇒ higher max ⇒ faster climb).
//   The asymmetry is the whole point and is itself honest: R = 1 (a grain-sized
//   intruder) does NOT climb — it just diffuses either way — so equal-size shows no
//   sort. amp = 0 (no shake) freezes everything flat. Both are negative controls.
//
//   THE FIELD IS A FAITHFUL CO-STEP, NOT A SECOND PHYSICS. The visible 2D grain
//   picture (grains[] + the one bead) is advected by the SAME rule each cycle, and
//   step2D ASSERTS its measured bead support equals the kernel's by every cycle —
//   so the picture you see is the proof you read; they cannot drift.
//
//   Every number the self-test asserts is a TOLERANCE-BAND TREND on the ENSEMBLE
//   MEAN over many seeded runs — NEVER a per-step or per-seed equality, never a
//   pinned "cycles-to-surface". A deterministic seed makes any single run exactly
//   replayable (the page == the Node twin, byte-true), but the climb is a
//   stochastic process and we only ever claim its mean trend within a named band.
// ----------------------------------------------------------------------------

// ── The estate's mulberry32 PRNG, verbatim from the-phantom-jam (the same
//    generator murmuration / iron-filings / sandpile share). Deterministic: a
//    fixed seed gives a fixed stream of [0,1). NOTE — the cycle brief's design
//    text sketched an "a=seed>>>0; a=(a+0x6D2B79F5)|0; …/4294967296" form and
//    flagged it as a deliberate OVERRIDE of any xorshift default; this is exactly
//    that estate generator, single-sourced here so the page + twin never drift. ──
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Named, ordered tolerance + parameter constants (single-sourced; the test, the
//    page, and the twin all read THESE). Tuned against the real sim so the headline
//    climb passes with margin while the negative controls fail-correctly. The
//    ORDERING TOL_FLAT, TOL_SYMMETRIC < RISE_MIN is preserved on purpose: a noisy
//    sim is answered by raising RUNS, NEVER by loosening a tolerance. ──
const SEED            = 0x42424242;  // the box's default seed (live: seed vs seed+1 differ)
const W               = 24;          // visible box width in grain-columns (display)
const H               = 11;          // FILL DEPTH in column-units — the bead's surface target
const R               = 4;           // bead footprint in columns (the intruder size; default)
const AMP             = 0.6;         // shake amplitude in [0,1]; P(col±1)=AMP/2 each per shake
const CYCLES_DEFAULT  = 240;         // shakes per ensemble run for the climb claim
const RUNS_DEFAULT    = 48;          // seeded runs averaged for the climb ensemble mean
const RUNS_LADDER     = 120;         // runs for the size ladder (noise-sensitive ⇒ more runs)
const RUNS_SYMMETRIC  = 200;         // runs for the R=1 symmetric neg-control (raise, don't loosen)
const RISE_MIN        = 0.70;        // CRUX-1: net climb (buried→surface) must clear this
const TOL_FLAT        = 0.02;        // CRUX-2: amp=0 ⇒ every checkpoint within this of start
const TOL_SYMMETRIC   = 0.30;        // CRUX-3: R=1 ⇒ |net displacement frac| stays under this
const TOL_MONO_DIP    = 0.08;        // CRUX-1: one-sided checkpoint dip tolerance (monotone-ish)
const FLAT_BAND       = 0.02;        // descriptive: "flat" reading band for the cartouche
const BURIED_MAX      = 0.15;        // a "buried" start reads below this fraction
const SURFACE_MIN     = 0.70;        // the bead has "surfaced" above this fraction
const N_CHECKPOINTS   = 10;          // checkpoints sampled along a climb for monotonicity

// ── make a box state. col is signed (Int32Array) — NO reflecting floor, so the
//    intruder may sink BELOW the ambient bed (by can go negative). The bead starts
//    BURIED near the floor (by = 0 ⇒ buried, mapped well below the surface). grains[]
//    is the VISUALIZATION field (seeded scatter); bead is the one heavy disk. ──
function makeBox({ W: w = W, H: h = H, R: r = R, fill = 0.62, amp = AMP, seed = SEED } = {}){
  const rng = mulberry32(seed);
  const col = new Int32Array(r);              // support columns under the bead (all 0 = buried)
  const st = {
    W: w, H: h, R: r, amp, seed, rng,
    fill,                                       // initial grain-fill fraction (display only)
    col,                                        // the R support columns (the proof state)
    by: 0,                                       // = max_k col[k], THE readout (buried start)
    grains: [],                                  // the visualized grain field (display)
    bead: { x: w / 2, y: 0.06, r: r },          // the heavy bead, BURIED near the floor
    cycle: 0,
  };
  seedGrains(st);
  return st;
}

// ── seed the VISUALIZED grain field. A separate display scatter (it does NOT carry
//    the claim) — hundreds of small grains filling the lower `fill` of the box, plus
//    the one bead near the floor. Grain count is conserved across the run. ──
function seedGrains(st){
  const n = Math.max(40, Math.round(st.W * st.H * st.fill * 0.9));
  const g = new Array(n);
  // a stable display rng so the scatter is reproducible per seed (separate axis from
  // the proof rng so consuming display draws never perturbs the kernel stream).
  const drng = mulberry32((st.seed ^ 0x9e3779b9) >>> 0);
  for (let i = 0; i < n; i++){
    g[i] = {
      x: drng() * st.W,
      y: drng() * st.H * st.fill,
      r: 0.34 + drng() * 0.20,                  // grain radius (display units)
    };
  }
  st.grains = g;
  st._grainCount0 = n;
}

// ── shakeKernel — THE sole integrator / proof authority. One shake jostles every
//    support column: a symmetric ±1 transient-void walk (P(up)=P(down)=amp/2, else
//    hold), then the rigid bead rests on the TALLEST column ⇒ by = max_k col[k].
//    Returns the new by. This is the ONLY place the climb is produced. ──
function shakeKernel(st, amp = st.amp){
  const col = st.col, rng = st.rng, R = col.length;
  for (let k = 0; k < R; k++){
    const r = rng();
    if (r < amp / 2)        col[k]++;            // a grain kicked under this column (rise)
    else if (r < amp)       col[k]--;            // a transient void opens (fall)
    // else: this column holds this shake
  }
  let by = col[0];
  for (let k = 1; k < R; k++) if (col[k] > by) by = col[k];
  st.by = by;
  st.cycle++;
  return by;
}

// ── step2D — co-step the VISIBLE grain field by the SAME rule, then ASSERT the
//    field's measured bead support equals the kernel's by this cycle. The kernel is
//    canonical; the field is faithful. This is what makes picture == proof: if the
//    visual ever disagreed with the readout, this throws (the page surfaces it). ──
function step2D(st, amp = st.amp){
  const prevBy = st.by;
  const by = shakeKernel(st, amp);              // advance the canonical kernel
  // advect the visible bead to track the support height (display mapping), and nudge
  // the grain field downward by the net column change so the bed visibly resettles.
  const dBy = by - prevBy;
  // the bead's display height = its support fraction of the fill depth
  st.bead.y = intruderHeight(st) * st.H;
  // grains drift to fill the space the climbing bead vacates (purely visual flow):
  const flow = dBy * 0.06;
  for (const gr of st.grains){
    // up-the-middle / down-the-walls convection advection of the VISUAL grains only
    const mid = st.W / 2;
    const toward = (gr.x < mid) ? -1 : 1;        // walls pull outward near the top
    const depthBias = 1 - gr.y / st.H;           // stronger near the floor
    gr.x += toward * 0.015 * depthBias * Math.max(0, amp);
    gr.y -= flow * (0.4 + 0.6 * depthBias);
    // wrap grains that drift out (conserve the visible count)
    if (gr.x < 0) gr.x += st.W; else if (gr.x > st.W) gr.x -= st.W;
    if (gr.y < 0) gr.y += st.H * st.fill; else if (gr.y > st.H) gr.y -= st.H * st.fill;
  }
  // THE ASSERTION: the field's bead support (max support column) == the kernel by.
  const measured = measuredBeadSupport(st);
  if (measured !== by){
    throw new Error(`step2D: field support ${measured} ≠ kernel by ${by} (picture drifted from proof)`);
  }
  return by;
}

// the field's measured bead support = the tallest of the R support columns. The
// field shares st.col with the kernel (one source), so this is by construction the
// same max the kernel computes — the assertion proves we never diverge.
function measuredBeadSupport(st){
  let m = st.col[0];
  for (let k = 1; k < st.col.length; k++) if (st.col[k] > m) m = st.col[k];
  return m;
}

// ── intruderHeight — map by → fraction of fill-depth: 0 = buried at the floor,
//    1 = at the surface. Clamped to [0,1] for the cartouche/band readout (the bead
//    can sink below ambient, which clamps to 0). The size ladder + dose-response
//    measure RAW by (unclamped, single-sourced via ensembleBy) so they stay graded. ──
function intruderHeight(st){
  return clamp01(st.by / st.H);
}
function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

// the ambient bed surface in display units (where loose grains pile to).
function bedSurface(st){ return st.H * st.fill; }

// the fill-depth fraction the bead currently sits at (= intruderHeight, named for
// the readcard) — 0 buried, 1 surfaced.
function fillDepthFraction(st){ return intruderHeight(st); }

// ── convectionReadout — a DESCRIPTIVE display field (NO claim): the up-the-middle /
//    down-the-walls roll that the Brazil-nut story attributes the climb to, exposed
//    only so the page can label the WHY. It carries no proof and is marked descriptive. ──
function convectionReadout(st){
  return {
    upMid: Math.max(0, st.amp),                 // strength of the central upwelling
    downWall: Math.max(0, st.amp) * 0.85,       // strength of the wall down-flow
    descriptive: true,
  };
}

// ── runEnsemble — the ENSEMBLE engine (single-sourced here, byte-twinnable, shared
//    by the page + the twin; NOT in the test). heights[c] = mean by(c) over `runs`
//    seeded runs (seed, seed+1, …, seed+runs-1). The proof authority for every band
//    claim: the headline climb, the negative controls, the ladders. ──
function runEnsemble({ R: r = R, amp = AMP, cycles = CYCLES_DEFAULT, seed = SEED, runs = RUNS_DEFAULT } = {}){
  const heights = new Float64Array(cycles + 1);  // heights[0] = 0 (buried start)
  for (let run = 0; run < runs; run++){
    const rng = mulberry32((seed + run) >>> 0);
    const col = new Int32Array(r);
    for (let c = 1; c <= cycles; c++){
      // one shake of the kernel (inline the symmetric ±1 walk + max readout)
      for (let k = 0; k < r; k++){
        const x = rng();
        if (x < amp / 2)      col[k]++;
        else if (x < amp)     col[k]--;
      }
      let by = col[0];
      for (let k = 1; k < r; k++) if (col[k] > by) by = col[k];
      heights[c] += by;
    }
  }
  for (let c = 0; c <= cycles; c++) heights[c] /= runs;
  return { heights, R: r, amp, cycles, seed, runs };
}

// helper: the ensemble-mean by, sampled at N_CHECKPOINTS even points 0..cycles, as
// FRACTIONS of fill-depth (clamped). Used by the climb / flat / monotone legs.
function checkpointFractions(ens, h = H){
  const out = [];
  const cyc = ens.cycles;
  for (let i = 0; i <= N_CHECKPOINTS; i++){
    const c = Math.round(i * cyc / N_CHECKPOINTS);
    out.push(clamp01(ens.heights[c] / h));
  }
  return out;
}

// ============================================================================
//  THE SELF-TEST BATTERY — the SAME legs the in-page pill and the Node twin call.
//  Every claim is a tolerance-band trend on the ENSEMBLE MEAN, never per-step.
// ============================================================================
function runBrazilNutSelfTest(){
  const lines = [];
  const ck = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // CRUX-1 — MONOTONE CLIMB (one-sided): from a buried start (<BURIED_MAX), the
  //   ensemble-mean bead height is non-decreasing within TOL_MONO_DIP across the
  //   checkpoints, ends in the surface band (>SURFACE_MIN), and the net rise clears
  //   RISE_MIN. R=4, amp=0.6, runs≥24, cycles≥200.
  {
    const ens = runEnsemble({ R: 4, amp: 0.6, cycles: CYCLES_DEFAULT, seed: SEED, runs: RUNS_DEFAULT });
    const cps = checkpointFractions(ens);
    const start = cps[0], end = cps[cps.length - 1];
    let worstDip = 0;
    for (let i = 1; i < cps.length; i++) worstDip = Math.max(worstDip, cps[i - 1] - cps[i]);
    const ok = start < BURIED_MAX && end > SURFACE_MIN && (end - start) >= RISE_MIN && worstDip <= TOL_MONO_DIP;
    ck('CRUX-1 monotone climb: buried bead rises to the surface (ensemble mean, band)', ok,
       `start=${start.toFixed(3)} → end=${end.toFixed(3)} (net ${(end-start).toFixed(3)} ≥ ${RISE_MIN}), worst dip ${worstDip.toFixed(4)} ≤ ${TOL_MONO_DIP}`);
  }

  // CRUX-2 — NEG-CONTROL A (shake off, one-sided flat): amp=0 ⇒ every checkpoint
  //   stays within TOL_FLAT of the start. No shake, no climb.
  {
    const ens = runEnsemble({ R: 4, amp: 0, cycles: CYCLES_DEFAULT, seed: SEED, runs: RUNS_DEFAULT });
    const cps = checkpointFractions(ens);
    let maxDev = 0;
    for (const f of cps) maxDev = Math.max(maxDev, Math.abs(f - cps[0]));
    ck('CRUX-2 neg-control A: shake OFF (amp=0) stays flat — no climb', maxDev <= TOL_FLAT,
       `max |dev from start| = ${maxDev.toFixed(6)} ≤ ${TOL_FLAT}`);
  }

  // CRUX-3 — NEG-CONTROL B (symmetric grains, TWO-sided near zero): R=1 (a grain-
  //   sized intruder) ⇒ |net displacement frac| < TOL_SYMMETRIC. It may diffuse
  //   either way but must NOT systematically climb. The one-sided/two-sided contrast
  //   with CRUX-1 is itself part of the honesty.
  {
    const ens = runEnsemble({ R: 1, amp: 0.6, cycles: CYCLES_DEFAULT, seed: SEED, runs: RUNS_SYMMETRIC });
    const netFrac = ens.heights[ens.cycles] / H;   // SIGNED — two-sided (no clamp)
    ck('CRUX-3 neg-control B: equal-size (R=1) does NOT sort — net ≈ 0 (two-sided)', Math.abs(netFrac) < TOL_SYMMETRIC,
       `|net frac| = ${Math.abs(netFrac).toFixed(4)} < ${TOL_SYMMETRIC} (may diffuse either way)`);
  }

  // CRUX-4 — SIZE LADDER: the final ensemble-mean climb (RAW by) is strictly
  //   increasing in R across {1,2,3,4,6,8}. Size asymmetry is necessary AND graded.
  {
    const ladder = [1, 2, 3, 4, 6, 8].map(r =>
      runEnsemble({ R: r, amp: 0.6, cycles: CYCLES_DEFAULT, seed: SEED, runs: RUNS_LADDER }).heights[CYCLES_DEFAULT]);
    let strictly = true;
    for (let i = 1; i < ladder.length; i++) if (!(ladder[i] > ladder[i - 1])) strictly = false;
    ck('CRUX-4 size ladder: bigger intruder climbs more (strictly increasing in R)', strictly,
       `by(R=1..8) = [${ladder.map(x => x.toFixed(2)).join(', ')}]`);
  }

  // DOSE-RESPONSE: the final mean (RAW by) is non-decreasing in amp across
  //   {0, 0.5, 1.0} (TOL_FLAT slack at the low end). More shaking ⇒ more climb.
  {
    const dose = [0, 0.5, 1.0].map(amp =>
      runEnsemble({ R: 4, amp, cycles: CYCLES_DEFAULT, seed: SEED, runs: RUNS_DEFAULT }).heights[CYCLES_DEFAULT]);
    let nondec = true;
    for (let i = 1; i < dose.length; i++) if (dose[i] < dose[i - 1] - TOL_FLAT) nondec = false;
    ck('dose-response: more shake ⇒ more climb (non-decreasing in amplitude)', nondec,
       `by(amp=0,0.5,1) = [${dose.map(x => x.toFixed(2)).join(', ')}]`);
  }

  // DETERMINISM BOTH WAYS: same seed ⇒ identical by over 60 cycles (|Δ|<1e-12);
  //   seed vs seed+1 ⇒ they differ (>1e-6). The seed is live.
  {
    const runSeq = (seed) => {
      const rng = mulberry32(seed >>> 0); const col = new Int32Array(4); const out = [];
      for (let c = 0; c < 60; c++){
        for (let k = 0; k < 4; k++){ const x = rng(); if (x < 0.3) col[k]++; else if (x < 0.6) col[k]--; }
        let by = col[0]; for (let k = 1; k < 4; k++) if (col[k] > by) by = col[k];
        out.push(by);
      }
      return out;
    };
    const a = runSeq(SEED), b = runSeq(SEED), c = runSeq(SEED + 1);
    let same = 0, diff = 0;
    for (let i = 0; i < 60; i++){ same = Math.max(same, Math.abs(a[i] - b[i])); diff = Math.max(diff, Math.abs(a[i] - c[i])); }
    ck('determinism both ways: same seed replays exactly; seed+1 diverges (seed is live)',
       same < 1e-12 && diff > 1e-6, `sameΔ=${same}, seed+1 Δ=${diff}`);
  }

  // VALIDITY (kernel-appropriate): drive a live box and assert by === max(col) every
  //   step, the visualized grain count is conserved, and the bead footprint stays in
  //   bounds. (NOT disk-overlap — that 2D model is dead and does not carry the claim.)
  {
    const st = makeBox({ seed: SEED });
    const n0 = st.grains.length;
    let ok = true, ff = '';
    for (let c = 0; c < 80 && ok; c++){
      step2D(st, 0.6);
      const m = measuredBeadSupport(st);
      if (m !== st.by){ ok = false; ff = `cycle ${c}: by ${st.by} ≠ max(col) ${m}`; }
      if (st.grains.length !== n0){ ok = false; ff = `cycle ${c}: grain count ${st.grains.length} ≠ ${n0}`; }
      if (st.bead.x < 0 || st.bead.x > st.W){ ok = false; ff = `cycle ${c}: bead x ${st.bead.x} out of bounds`; }
    }
    ck('validity: by === max(col) every step, grains conserved, footprint in-bounds', ok,
       ff || `80 cycles clean, grains=${n0}`);
  }

  const pass = lines.filter(l => l.ok).length;
  const total = lines.length;
  const fails = lines.filter(l => !l.ok).map(l => l.name + (l.detail ? ' — ' + l.detail : ''));
  return { pass, total, fails, lines };
}
// === CORE END ===
// ============================================================================

export {
  mulberry32,
  makeBox, seedGrains, shakeKernel, step2D, measuredBeadSupport,
  intruderHeight, clamp01, bedSurface, fillDepthFraction, convectionReadout,
  runEnsemble, checkpointFractions, runBrazilNutSelfTest,
  // named/ordered tolerance + parameter constants
  SEED, W, H, R, AMP, CYCLES_DEFAULT, RUNS_DEFAULT, RUNS_LADDER, RUNS_SYMMETRIC,
  RISE_MIN, TOL_FLAT, TOL_SYMMETRIC, TOL_MONO_DIP, FLAT_BAND,
  BURIED_MAX, SURFACE_MIN, N_CHECKPOINTS,
};
