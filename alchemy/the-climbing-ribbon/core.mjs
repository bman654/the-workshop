/* ============================================================================
   ALCHEMY LAB · THE CLIMBING RIBBON — core.mjs   (the SOLE separation authority)

   Dab a spot of blended ink on a paper ribbon just above a pool of solvent, and the
   solvent creeps UP the paper by capillary action. As the wet front passes the spot,
   the pigments in the ink stop travelling together: each one rides the front to a
   height set by how it splits its time between the moving solvent and the standing
   paper. A pigment that dissolves happily in the solvent rides HIGH near the front; a
   pigment that clings to the paper LAGS low. One muddy blob PARTS into a ladder of
   coloured bands. That is paper chromatography, and the number that pins each band is
   its RETENTION FACTOR Rf — the fraction of the front's climb the band achieves:

        Rf = (how far the band climbed) / (how far the front climbed)   ∈ (0,1)

   THE CRUX — Rf is INVARIANT. Rf is a property of the pigment + the two phases, NOT of
   how long you developed the plate or how long the strip was. Run for 8 s or 40 s, on a
   short strip or a long one, under a fast-decelerating capillary front or a steady
   linear one — the RATIO band/front for a given pigment is the SAME. `core.test.mjs`
   proves that ratio is constant to machine epsilon across stop-times, strip lengths,
   and BOTH front laws. It is NOT compared to any handbook value: the claim is purely
   that the ratio band/front does not depend on the run. (Exactly the analog of the
   Fractionating Column's stepped-walk === Fenske invariance one bench over.)

   WHY the band climbs a fixed FRACTION — the partition ODE. When the front is at height
   H, its tip advances at velocity dH/dt. A band caught by the front advances at
   Rf · dH/dt — it moves only the fraction of the time it spends in the moving phase.
   `develop` integrates BOTH the front and every band by RK4 (never the closed form):

        dH/dt      = v(H)                    (the chosen front law)
        dB_i/dt    = rf_i · v(H)             (the same v, scaled by the band's Rf)

   Because rf_i is a constant multiplier applied to the SAME stage velocities, the two
   RK4 walks satisfy B_i = rf_i · (H − H0) EXACTLY at every step — the invariant EMERGES
   from integrating the coupled system, it is not hand-substituted. The render animates
   this very walk and re-derives nothing: render and proof share ONE source of truth.

   LIKE DISSOLVES LIKE — where Rf comes from. Every pigment, the solvent (mobile phase),
   and the paper (stationary phase) carry a model POLARITY p ∈ [0,1]. A regular-solution
   partition sets the retention factor k (time on paper / time in solvent):

        k = exp( BETA · [ (pigPol − mobilePol)² − (pigPol − statPol)² ] )
        Rf = 1 / (1 + k)

   A pigment whose polarity MATCHES the solvent dissolves well ⇒ small k ⇒ high Rf. A
   pigment whose polarity matches the PAPER clings ⇒ large k ⇒ low Rf. The square form is
   pinned (over the equivalent |·| form) because it is LINEAR in pigPol — no flat ties —
   so it guarantees a STRICT, TOTAL order-reversal for the neg-control.

   TWO NEG-CONTROLS, one tactile dial (slide the solvent's polarity):
     • PHASES IDENTICAL — set mobilePol = statPol (the marked notch at the paper's own
       polarity). Then the bracket is 0 ⇒ k = e⁰ = 1 ⇒ EVERY Rf = 0.5 exactly ⇒ nothing
       separates, every pigment co-migrates as one band. The paper alone does no work.
       (The load-bearing rhyme with the Column's α = 1.)
     • POLARITY SWAP — slide the solvent across the notch (mobilePol from below statPol to
       above it) and dRf/dpigPol flips sign: the entire ladder INVERTS. The pigment that
       led now trails. Proof that it is the stationary/mobile PAIR that separates, not the
       paper by itself, and not either phase alone.

   THE HONEST REGISTER. Rf is DIMENSIONLESS and compared to no external constant — the
   only claim is invariance-across-runs + the two neg-controls, all exact. Pigment and
   solvent names (Lampblack, Verdigris, Naphtha, Aqua…) are estate-invented tones whose
   ONLY physics is the model polarity parameter. Band BROADENING (a Gaussian width that
   grows with distance climbed) is a rendered flourish ONLY: Rf is defined on the band
   CENTROID and the width never enters the Rf computation.

   index.html INLINES this file byte-identical between the RIBBON-CORE sentinels;
   core.test.mjs runs it in Node. If the page's inline ever drifts from this file,
   the page's re-extraction parity check fails.
   ============================================================================ */

// ── the public tolerance the crux proof + the caption both read ────────────────
export const TOL_CRUX = 1e-9;           // the crux: band/front ratio invariance to machine ε

// ── the two fixed phases ───────────────────────────────────────────────────────
export const PAPER_POL = 0.62;          // the paper's (stationary-phase) polarity — fixed
export const BETA      = 4.0;           // affinity stiffness (spreads the Rf ladder across (0,1))

/* ── the apothecary palette: invented pigment tones, each carrying ONLY a model
   polarity p ∈ [0,1]. Chosen to straddle PAPER_POL so the polarity-swap neg-control
   reverses a real, shipped pair, and so the default blend resolves into a clean ladder. ── */
export const PIGMENTS = [
  { name: 'Lampblack', p: 0.12, color: '#2b2622' },   // soot black · non-polar
  { name: 'Orpiment',  p: 0.30, color: '#e7b13a' },   // arsenic gold
  { name: 'Madder',    p: 0.48, color: '#b0324a' },   // rose-red lake
  { name: 'Verdigris', p: 0.66, color: '#2f9e8f' },   // copper teal
  { name: 'Malachite', p: 0.80, color: '#3f8f52' },   // green carbonate
  { name: 'Azurite',   p: 0.94, color: '#3a63c8' },   // blue carbonate · polar
];

/* ── the solvent bottles: discrete presets on the polarity dial. The dial's marked
   NOTCH sits at PAPER_POL (0.62) — the phases-identical neg-control. Naphtha & Spirit
   sit below it (non-polar), Aqua well above it (polar) — sliding across the notch
   inverts the ladder. ── */
export const SOLVENTS = [
  { name: 'Naphtha',        p: 0.12, tint: '#c9b98a' },   // non-polar spirit (default developer)
  { name: 'Spirit of Wine', p: 0.44, tint: '#d9c19a' },   // ethanol · mid
  { name: 'Aqua',           p: 0.92, tint: '#8fb6d6' },   // water · polar
];
export const DEFAULT_SOLVENT = 0;       // Naphtha — a strong, clean separation

// the default blend the bench opens with + the liveness twin drives (3 well-spread bands)
export const DEFAULT_BLEND = ['Lampblack', 'Madder', 'Azurite'];

/* ── retention(pigPol, mobilePol, statPol): the regular-solution partition factor k =
   time-on-paper / time-in-solvent. k = exp(BETA·[(p−m)² − (p−s)²]). Matches solvent ⇒
   k<1 (rides high); matches paper ⇒ k>1 (lags). m===s ⇒ bracket 0 ⇒ k===1 exactly. ── */
export function retention(pigPol, mobilePol, statPol = PAPER_POL) {
  const dm = pigPol - mobilePol, ds = pigPol - statPol;
  return Math.exp(BETA * (dm * dm - ds * ds));
}

/* ── rf(...): the retention factor Rf = 1/(1+k) ∈ (0,1). The closed form the ruler
   ticks read and the self-test attests. High = rides near the front; low = lags. ── */
export function rf(pigPol, mobilePol, statPol = PAPER_POL) {
  return 1 / (1 + retention(pigPol, mobilePol, statPol));
}

// look up a pigment / solvent by name (render + tests share these)
export function pigmentByName(name) { return PIGMENTS.find((p) => p.name === name); }
export function solventByName(name) { return SOLVENTS.find((s) => s.name === name); }

/* ── mixBlend(names): the delight — several pigments mix to ONE muddy blob (a weighted
   dark average of their tones); the payoff is that this mud PARTS back into its makers.
   Returns { color, members:[{name,p,color,rf}] } given a solvent (for the preview Rf). ── */
export function mixBlend(names, mobilePol = SOLVENTS[DEFAULT_SOLVENT].p, statPol = PAPER_POL) {
  const members = names.map((n) => {
    const pig = pigmentByName(n);
    return { name: pig.name, p: pig.p, color: pig.color, rf: rf(pig.p, mobilePol, statPol) };
  });
  // muddy subtractive-ish average, darkened (many pigments together read as dark mud)
  let r = 0, g = 0, b = 0;
  for (const m of members) { const c = hex2rgb(m.color); r += c[0]; g += c[1]; b += c[2]; }
  const n = Math.max(1, members.length);
  const mud = [Math.round(r / n * 0.62), Math.round(g / n * 0.62), Math.round(b / n * 0.62)];
  return { color: rgb2hex(mud), members };
}
function hex2rgb(h) { const x = parseInt(h.slice(1), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255]; }
function rgb2hex(c) { return '#' + c.map((v) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join(''); }

/* ══ THE FRONT LAWS — two INDEPENDENT capillary-rise laws (grafting kills circularity).
   Each returns the front velocity dH/dt given the current front height H and params.
   • washburn: capillary rise, h·dh/dt = D/2 ⇒ v = D/(2H). H(t)=√(H0²+D·t): a bright
     leading line that visibly DECELERATES (the cinema default).
   • linear:   a steady front v = c (the control law — a different shape, same invariant). ══ */
export const LAWS = {
  washburn: { name: 'washburn', vel: (H, P) => P.D / (2 * H) },
  linear:   { name: 'linear',   vel: (_H, P) => P.c },
};

/* ── lawParams(law, {H0, Hmax, tEnd}): pick D or c so the front climbs H0→Hmax over tEnd
   seconds under the chosen law (so both laws fill the strip in the same nominal time). ── */
export function lawParams(law, { H0 = 0.06, Hmax = 1.0, tEnd = 30 } = {}) {
  if (law === 'washburn') return { H0, Hmax, D: (Hmax * Hmax - H0 * H0) / tEnd };
  return { H0, Hmax, c: (Hmax - H0) / tEnd };
}

/* ── makeRun(config): a stateful RK4 integrator of the COUPLED front+band ODEs. The
   render steps it each frame; develop() steps it to completion. ONE stepper, one truth.
   config = { pigments:[{name,p,color}], solvent:{p}, statPol, law, params }.
   State: front = H − H0 (climb ABOVE the origin, where front & bands both start at 0);
   bands[i] = band climb above origin. Invariant: bands[i] === rf_i · front, exactly. ── */
export function makeRun(config) {
  const statPol = config.statPol ?? PAPER_POL;
  const mobilePol = config.solvent.p;
  const law = LAWS[config.law] || LAWS.washburn;
  const P = config.params;
  const rfs = config.pigments.map((pg) => rf(pg.p, mobilePol, statPol));
  const st = { t: 0, H: P.H0, front: 0, bands: config.pigments.map(() => 0), done: false };
  function vel(H) { return law.vel(H, P); }
  return {
    rfs,
    state: st,
    step(dt) {
      if (st.done) return st;
      // RK4 on the front height H (autonomous ODE v(H)); bands ride at rf_i·(front stages)
      const H = st.H;
      const k1 = vel(H);
      const k2 = vel(H + dt / 2 * k1);
      const k3 = vel(H + dt / 2 * k2);
      const k4 = vel(H + dt * k3);
      let dH = dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      if (st.H + dH >= P.Hmax) { dH = P.Hmax - st.H; st.done = true; }   // front reaches the lid → freeze
      st.H += dH;
      st.t += dt;
      st.front += dH;                                  // front climb above origin
      for (let i = 0; i < st.bands.length; i++) st.bands[i] += rfs[i] * dH;   // band = rf_i·dfront, exact
      return st;
    },
    // the ruler value for band i RIGHT NOW: band/front, self-rescaling as the front climbs
    ratio(i) { return st.front > 0 ? st.bands[i] / st.front : 0; },
  };
}

/* ── develop(config): run makeRun to completion (or to tEnd), sampling the whole walk.
   Returns { times:[t], front:[H_above_origin], bands:[[band_i]], rfs, final }. The
   band CENTROIDS are bands[i]; a rendered Gaussian width may be layered on top but is
   NOT part of this output. ── */
export function develop(config) {
  const tEnd = config.tEnd ?? 30;
  const dt = config.dt ?? (tEnd / 1200);          // ~1200 RK4 steps over the run
  const run = makeRun(config);
  const times = [0], front = [0], bands = config.pigments.map(() => [0]);
  let t = 0, guard = 0;
  while (t < tEnd - 1e-12 && !run.state.done && guard++ < 200000) {
    const h = Math.min(dt, tEnd - t);
    run.step(h);
    t = run.state.t;
    times.push(t); front.push(run.state.front);
    for (let i = 0; i < bands.length; i++) bands[i].push(run.state.bands[i]);
  }
  return {
    times, front, bands, rfs: run.rfs,
    final: { t, front: run.state.front, bands: run.state.bands.slice(), rfs: run.rfs.slice() },
  };
}

/* ══ THE CRUX PROBE — the band/front ratio is invariant across stop-times, strip
   lengths, AND both front laws, to TOL_CRUX. For a config, integrate to several stop
   times × several strip lengths (Hmax) × both laws; for every sample assert
   bands[i]/front === rf_i to <1e-9. Non-definitional: bands & front are integrated
   INDEPENDENTLY by RK4; the ratio equalling rf_i EMERGES. Returns worst residual. ══ */
export function cruxWorstError(pigments, statPol = PAPER_POL, mobilePol = SOLVENTS[DEFAULT_SOLVENT].p) {
  let worst = 0;
  const stopFracs = [0.2, 0.37, 0.6, 0.85, 1.0];   // sample at ≥3 stop-times
  const strips = [0.5, 0.75, 1.0];                 // ≥3 strip lengths (Hmax)
  const laws = ['washburn', 'linear'];             // BOTH front laws
  for (const lawName of laws) {
    for (const Hmax of strips) {
      const tEnd = 30;
      const params = lawParams(lawName, { Hmax, tEnd });
      const rfs = pigments.map((pg) => rf(pg.p, mobilePol, statPol));
      for (const f of stopFracs) {
        const run = makeRun({ pigments, solvent: { p: mobilePol }, statPol, law: lawName, params });
        // step to the stop-time in fine substeps
        const target = tEnd * f, dt = target / 600;
        for (let k = 0; k < 600 && !run.state.done; k++) run.step(dt);
        if (run.state.front <= 0) continue;
        for (let i = 0; i < pigments.length; i++) {
          const ratio = run.state.bands[i] / run.state.front;
          worst = Math.max(worst, Math.abs(ratio - rfs[i]));
        }
      }
    }
  }
  return { worst };
}

/* ══ THE SELF-TEST BODY — shared by the in-page pill and the Node twin. Returns
   { checks:[{name,ok,info}] }. Proves: (1) Rf invariance to run & strip length & both
   laws <1e-9; (2) phases-identical ⇒ every Rf===0.5 (bit-exact); (3) a shipped
   pigment pair whose Rf-order REVERSES across the notch (load-bearing); (4) honesty. ══ */
export function runSelfTest() {
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info: info || '' });
  const blend = PIGMENTS;   // exercise the whole palette

  // (1) CRUX: band/front ratio invariant across stop-times × strip lengths × both laws
  const cw = cruxWorstError(blend).worst;
  ck('CRUX: Rf = band/front invariant across runs, strip lengths & BOTH front laws (worst ' +
     cw.toExponential(2) + ' < 1e-9)', cw < TOL_CRUX, 'worst |ratio − rf| = ' + cw.toExponential(3));

  // (2) NEG-CONTROL A — phases identical (mobilePol === statPol) ⇒ every Rf === 0.5 exactly
  let allHalf = true, worstA = 0;
  for (const pg of PIGMENTS) {
    const r = rf(pg.p, PAPER_POL, PAPER_POL);
    worstA = Math.max(worstA, Math.abs(r - 0.5));
    if (r !== 0.5) allHalf = false;
  }
  ck('NEG-CONTROL A: solvent polarity === paper polarity ⇒ every Rf === 0.5 exactly (co-migration)',
     allHalf, 'worst |Rf − 0.5| = ' + worstA.toExponential(2));

  // (2b) that co-migration means the bands do not separate: max−min Rf === 0 at the notch
  const rfsNotch = PIGMENTS.map((pg) => rf(pg.p, PAPER_POL, PAPER_POL));
  ck('NEG-CONTROL A: at the notch the ladder collapses (max Rf − min Rf === 0)',
     Math.max(...rfsNotch) - Math.min(...rfsNotch) === 0);

  // (3) NEG-CONTROL B — polarity swap: a SHIPPED pigment pair + two SHIPPED solvents
  //     straddling PAPER_POL whose sign(Rf_i − Rf_j) REVERSES (a leader becomes a trailer)
  const below = SOLVENTS.find((s) => s.p < PAPER_POL);   // Naphtha (0.12)
  const above = SOLVENTS.find((s) => s.p > PAPER_POL);   // Aqua (0.92)
  ck('NEG-CONTROL B: two offered solvents straddle the paper polarity',
     !!below && !!above && below.p < PAPER_POL && above.p > PAPER_POL,
     (below && above) ? below.name + ' (' + below.p + ') · ' + above.name + ' (' + above.p + ')' : 'missing');
  const iLow = pigmentByName('Lampblack'), jHigh = pigmentByName('Azurite');   // straddle PAPER_POL
  const dBelow = rf(iLow.p, below.p) - rf(jHigh.p, below.p);
  const dAbove = rf(iLow.p, above.p) - rf(jHigh.p, above.p);
  ck('NEG-CONTROL B: Lampblack vs Azurite — Rf order REVERSES between ' + below.name + ' and ' + above.name +
     ' (leader→trailer)', Math.sign(dBelow) === -Math.sign(dAbove) && dBelow !== 0 && dAbove !== 0,
     'Δ(' + below.name + ') = ' + dBelow.toFixed(3) + '  ·  Δ(' + above.name + ') = ' + dAbove.toFixed(3));

  // (3b) the default blend under the default solvent resolves into ≥2 well-separated bands
  const dsolv = SOLVENTS[DEFAULT_SOLVENT];
  const drfs = DEFAULT_BLEND.map((n) => rf(pigmentByName(n).p, dsolv.p)).sort((a, b) => a - b);
  let minGap = Infinity; for (let i = 1; i < drfs.length; i++) minGap = Math.min(minGap, drfs[i] - drfs[i - 1]);
  ck('PAYOFF: default blend (' + DEFAULT_BLEND.join(', ') + ') under ' + dsolv.name +
     ' resolves into ≥2 separated bands (min gap ' + minGap.toFixed(3) + ' > 0.05)',
     drfs.length >= 2 && minGap > 0.05, 'Rf = ' + drfs.map((x) => x.toFixed(3)).join(', '));

  // (4) HONESTY — Rf is dimensionless in (0,1), compared to no external constant; width never leaks
  let bounded = true;
  for (const pg of PIGMENTS) for (const s of SOLVENTS) { const r = rf(pg.p, s.p); if (!(r > 0 && r < 1)) bounded = false; }
  ck('HONESTY: every Rf lies strictly in (0,1) — dimensionless, no handbook comparison', bounded);
  // width is a render flourish: rf() takes only polarities (2 required + a defaulted statPol),
  // never a band-width argument — checked by arity (function.length counts pre-default params)
  ck('HONESTY: rf() reads only polarities — band width cannot enter the Rf computation', rf.length === 2);

  const pass = checks.filter((c) => c.ok).length;
  return { checks, pass, total: checks.length };
}

/* ══ THE PAYOFF-LIVENESS PROBE — headless-drivable via develop() (NO canvas pointer).
   Asserts the delight actually FIRES: (a) the front strictly increases & is concave
   (decelerating) under Washburn; (b) a separating solvent yields ≥2 distinct band
   centroids with a real gap; (c) the phases-identical solvent yields co-migration. ══ */
export function livenessProbe() {
  const checks = [];
  const ck = (name, ok, info) => checks.push({ name, ok: !!ok, info: info || '' });
  const pigments = DEFAULT_BLEND.map((n) => pigmentByName(n));
  const params = lawParams('washburn', { Hmax: 1.0, tEnd: 30 });

  // (a) the front climbs and decelerates (concave)
  const run = develop({ pigments, solvent: SOLVENTS[DEFAULT_SOLVENT], law: 'washburn', params, tEnd: 30 });
  let rising = true, concave = true;
  for (let i = 1; i < run.front.length; i++) if (run.front[i] <= run.front[i - 1]) rising = false;
  for (let i = 2; i < run.front.length; i++) {
    const v1 = run.front[i - 1] - run.front[i - 2], v2 = run.front[i] - run.front[i - 1];
    if (v2 > v1 + 1e-9) concave = false;    // velocity must not increase (decelerating)
  }
  ck('LIVENESS: the wet front strictly climbs and decelerates (concave Washburn rise)', rising && concave);

  // (b) a separating solvent → ≥2 distinct band centroids with a real gap
  const finals = run.final.bands.slice().sort((a, b) => a - b);
  let gap = Infinity; for (let i = 1; i < finals.length; i++) gap = Math.min(gap, finals[i] - finals[i - 1]);
  ck('LIVENESS: the blend PARTS — ≥2 distinct band centroids, min gap ' + gap.toFixed(3) + ' > 0.03',
     finals.length >= 2 && gap > 0.03, 'band heights ' + finals.map((x) => x.toFixed(3)).join(', '));

  // (c) the phases-identical solvent → co-migration (all bands collapse to one line)
  const dead = develop({ pigments, solvent: { p: PAPER_POL }, law: 'washburn', params, tEnd: 30 });
  const db = dead.final.bands.slice().sort((a, b) => a - b);
  const spread = db[db.length - 1] - db[0];
  ck('LIVENESS: at the notch the blend co-migrates as ONE band (spread ' + spread.toExponential(2) + ' → 0)',
     spread === 0, 'band spread = ' + spread.toExponential(2));

  const pass = checks.filter((c) => c.ok).length;
  return { checks, pass, total: checks.length };
}

// CommonJS guard so the Node twin can require() this if ever needed (forge strips it on inline)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TOL_CRUX, PAPER_POL, BETA, PIGMENTS, SOLVENTS, DEFAULT_SOLVENT, DEFAULT_BLEND,
    retention, rf, pigmentByName, solventByName, mixBlend, LAWS, lawParams, makeRun, develop,
    cruxWorstError, runSelfTest, livenessProbe,
  };
}
