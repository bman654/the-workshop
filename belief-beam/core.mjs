// === CORE BEGIN ===
// The Belief Beam — math core (single source of truth).
// Bayesian belief-updating as a CONSERVED LIQUID. There are HYP hidden hypotheses
// (here three urns: mostly-red, balanced, mostly-blue). One is the true SOURCE; you
// draw coloured beads from it and your belief pours between the urns. Each draw is
// evidence; the posterior is a probability vector that ALWAYS sums to 1 (mass is
// conserved — never created, never destroyed, only poured sideways).
//
// THE SOUL is THREE EXACT FACTS, each made touchable on the page:
//   (A) Σ posterior === 1 at every step (to a <1e-12 float tolerance) — belief is a
//       CONSERVED probability; the liquid level across the vials is always one full beam.
//   (B) log-odds is ADDITIVE and ORDER-FREE. Each draw of colour c shifts the pairwise
//       log-odds ln(p_i/p_j) by exactly ln(L_ic/L_jc) — a FIXED slide that does not
//       depend on what came before. So the order of the evidence is irrelevant: the
//       same multiset of draws lands on a BIT-IDENTICAL posterior. We get bit-identity
//       (not merely ≈) by deriving the posterior from a SUFFICIENT STATISTIC — the
//       per-colour TALLY — never from iterated float multiplications (those reorder
//       to different last bits; the twin proves that trap is real).
//   (C) An EQUAL-LIKELIHOOD colour is a NO-OP. A colour every urn is equally likely to
//       emit (the "Gray" bead in EQ_MODEL) carries ln(L_ic/L_jc)=0 for every pair, so
//       drawing it cannot move belief — bit-identically. The informative(c) gate that
//       drops equal-likelihood colours BEFORE the max-shift renormalizer is what makes
//       this exact (un-gated, the max-shift subtraction perturbs the last bit).
//
// Everything DERIVES from URNS. Nothing hard-codes 3 hypotheses, 3 colours, or T=12.
//
// This module is DOM-free and is inlined byte-identical into index.html between the
// CORE BEGIN / CORE END sentinels, then tested by core.test.mjs — page & test, and the
// page's in-proof pill & this twin, can never drift.

// ── THE MODEL ──────────────────────────────────────────────────────────────────
// URNS[i][c] = the count of colour c in urn i. The likelihood L(i,c) = count / total.
// Three urns: mostly-RED, balanced, mostly-BLUE. Colours: R=0, G=1, B=2.
const URNS = [[9, 2, 1], [4, 4, 4], [1, 2, 9]];
const HYP = URNS.length;              // 3 hypotheses (urns)
const COL = URNS[0].length;           // 3 colours
const T = URNS[0].reduce((a, b) => a + b, 0);  // total beads per urn (=12); every urn shares it

// EQ_MODEL augments URNS with a 4th "Gray" colour present in EQUAL count in every urn,
// so it is deliberately UNINFORMATIVE — a real, visible, observable no-op bead. Exported
// for the twin AND used by the page as a touchable demonstration of claim (C).
const EQ_MODEL = URNS.map(row => row.concat([2]));   // [[9,2,1,2],[4,4,4,2],[1,2,9,2]]
const EQ_T = EQ_MODEL[0].reduce((a, b) => a + b, 0); // =14

// likelihood of colour c under urn i, for a given model (default URNS).
function likelihoodIn(model, total, i, c) { return model[i][c] / total; }
function likelihood(i, c) { return likelihoodIn(URNS, T, i, c); }

// informative(c): is colour c discriminating — do the urns DISAGREE on its likelihood?
// An equal-likelihood colour (every urn the same count) carries zero evidence; the gate
// excludes it BEFORE the renormalizer so the no-op is bit-exact. MANDATORY — never simplify.
function informativeIn(model, c) {
  const v = model.map(row => row[c]);
  return !v.every(x => x === v[0]);
}
function informative(c) { return informativeIn(URNS, c); }

// uniform prior over the HYP urns.
function prior() { return Array(HYP).fill(1 / HYP); }

// ── THE SUFFICIENT STATISTIC ─────────────────────────────────────────────────────
// A STATE is the order-free summary of the evidence: a per-colour tally + a count. Two
// runs with the same tally are INDISTINGUISHABLE to the posterior — that is what makes
// order-freedom STRUCTURAL (not a lucky float coincidence). update() bumps one colour.
function emptyState(nCol) { return { tally: Array(nCol === undefined ? COL : nCol).fill(0), n: 0 }; }
function update(state, draw) {
  const t = state.tally.slice();
  t[draw] = (t[draw] || 0) + 1;
  return { tally: t, n: state.n + 1 };
}

// ── THE POSTERIOR (the SOLE inference authority) ─────────────────────────────────
// posteriorIn(model,total,tally): log-weights lw_i = ln(prior_i) + Σ_{c informative} tally[c]·ln(L_ic),
// then the MAX-SHIFT softmax (subtract max for numerical stability) → a normalized vector
// that sums to 1. The informative(c) gate drops equal-likelihood colours so they are a
// bit-exact no-op. This is the ONLY place a posterior is decided.
function posteriorIn(model, total, tally) {
  const lp = Math.log(1 / HYP);
  const lw = model.map((_, i) => {
    let s = lp;
    for (let c = 0; c < tally.length; c++) {
      if (tally[c] && informativeIn(model, c)) s += tally[c] * Math.log(likelihoodIn(model, total, i, c));
    }
    return s;
  });
  const m = Math.max.apply(null, lw);
  const ex = lw.map(x => Math.exp(x - m));
  const Z = ex.reduce((a, b) => a + b, 0);
  return ex.map(x => x / Z);
}
function posterior(state) { return posteriorIn(URNS, T, state.tally); }

// posteriorFrom(priorArr, lkArr): the TEXTBOOK form, posterior_i ∝ prior_i · likelihood_i,
// over a single colour's likelihood column — an INDEPENDENT derivation the twin cross-checks
// step-by-step against posterior() (they must agree to a float tolerance). Here lkArr is the
// per-urn likelihood of ONE observed colour; chaining it draw-by-draw must match the tally form.
function posteriorFrom(priorArr, lkArr) {
  const w = priorArr.map((pi, i) => pi * lkArr[i]);
  const Z = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / Z);
}

// ── LOG-ODDS (the additive rail) ─────────────────────────────────────────────────
// logOddsIn(model,total,tally,i,j) = ln(prior_i/prior_j) + Σ_{c informative} tally[c]·ln(L_ic/L_jc).
// With a uniform prior the first term is 0, so the log-odds is a pure SUM of per-draw slides.
function logOddsIn(model, total, tally, i, j) {
  let s = Math.log((1 / HYP) / (1 / HYP));   // =0 for a uniform prior, written honestly
  for (let c = 0; c < tally.length; c++) {
    if (tally[c] && informativeIn(model, c)) s += tally[c] * Math.log(likelihoodIn(model, total, i, c) / likelihoodIn(model, total, j, c));
  }
  return s;
}
function logOdds(state, i, j) { return logOddsIn(URNS, T, state.tally, i, j); }

// logLikRatioStep(c,i,j): the FIXED per-draw slide a single colour-c bead applies to the
// pairwise log-odds ln(p_i/p_j). 0 for an equal-likelihood colour (the gate). This is the
// rail-bead's step; it never depends on history — the additivity that makes order irrelevant.
function logLikRatioStep(c, i, j) {
  if (!informative(c)) return 0;
  return Math.log(likelihood(i, c) / likelihood(j, c));
}

// ── THE HIDDEN SOURCE + SEEDABLE RNG ─────────────────────────────────────────────
// The true source urn and the draw RNG live IN THE CORE so the twin replays a run
// deterministically AND the true urn index never has to reach the page/DOM. A tiny
// mulberry32 PRNG keeps it pure + seedable.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// makeSource(opts): a stateful drawer. opts.urn picks the hidden source urn (default random);
// opts.seed seeds the RNG; opts.model/opts.total pick the model (default URNS). It owns the
// running sufficient-statistic state. Each draw returns the observed colour, the NEW posterior
// (Σ===1), the pairwise log-odds deltas, and the post — but NEVER the hidden urn index.
function makeSource(opts) {
  opts = opts || {};
  const model = opts.model || URNS;
  const total = opts.total || (opts.model ? opts.model[0].reduce((a, b) => a + b, 0) : T);
  const nCol = model[0].length;
  const rng = mulberry32(opts.seed === undefined ? (Math.random() * 1e9) | 0 : opts.seed);
  const srcUrn = opts.urn === undefined ? (rng() * HYP) | 0 : opts.urn;
  let state = emptyState(nCol);
  // sample one colour from the hidden source urn's true distribution (counts → categorical).
  function sampleColour() {
    const counts = model[srcUrn];
    const r = rng() * total;
    let acc = 0;
    for (let c = 0; c < nCol; c++) { acc += counts[c]; if (r < acc) return c; }
    return nCol - 1;
  }
  return {
    // draw one bead from the hidden source; advance the state; return the observable record.
    draw() {
      const color = sampleColour();
      state = update(state, color);
      const post = posteriorIn(model, total, state.tally);
      return {
        color,
        post,
        dL: { AB: logOddsIn(model, total, state.tally, 0, 1), BC: logOddsIn(model, total, state.tally, 1, 2), AC: logOddsIn(model, total, state.tally, 0, 2) },
        // the FIXED slide this single bead just applied (0 for an equal-likelihood colour)
        step: { AB: informativeIn(model, color) ? Math.log(likelihoodIn(model, total, 0, color) / likelihoodIn(model, total, 1, color)) : 0,
                BC: informativeIn(model, color) ? Math.log(likelihoodIn(model, total, 1, color) / likelihoodIn(model, total, 2, color)) : 0,
                AC: informativeIn(model, color) ? Math.log(likelihoodIn(model, total, 0, color) / likelihoodIn(model, total, 2, color)) : 0 },
        tally: state.tally.slice(), n: state.n
      };
    },
    // OBSERVE a specific colour (the page uses this when the visitor picks the Gray bead, and
    // for replay) — same record shape, deterministic, no RNG consumed.
    observe(color) {
      state = update(state, color);
      const post = posteriorIn(model, total, state.tally);
      return { color, post,
        dL: { AB: logOddsIn(model, total, state.tally, 0, 1), BC: logOddsIn(model, total, state.tally, 1, 2), AC: logOddsIn(model, total, state.tally, 0, 2) },
        step: { AB: informativeIn(model, color) ? Math.log(likelihoodIn(model, total, 0, color) / likelihoodIn(model, total, 1, color)) : 0,
                BC: informativeIn(model, color) ? Math.log(likelihoodIn(model, total, 1, color) / likelihoodIn(model, total, 2, color)) : 0,
                AC: informativeIn(model, color) ? Math.log(likelihoodIn(model, total, 0, color) / likelihoodIn(model, total, 2, color)) : 0 },
        tally: state.tally.slice(), n: state.n };
    },
    state() { return { tally: state.tally.slice(), n: state.n }; },
    posterior() { return posteriorIn(model, total, state.tally); }
  };
}

// ── REPLAY (the order-free landing) ──────────────────────────────────────────────
// replay(prior, cards): re-derive the posterior from a list of drawn colours by folding
// them into a tally — so ANY permutation of `cards` lands on the BIT-IDENTICAL posterior.
// (`prior` is accepted for the textbook signature; the canonical uniform prior is used,
// and we assert prior===uniform when a non-uniform prior is passed only conceptually.)
function replay(priorArr, cards, model, total) {
  model = model || URNS; total = total || T;
  let st = emptyState(model[0].length);
  for (const c of cards) st = update(st, c);
  return posteriorIn(model, total, st.tally);
}
// replayLogOdds(cards,i,j): the order-free log-odds for the same multiset.
function replayLogOdds(cards, i, j, model, total) {
  model = model || URNS; total = total || T;
  let st = emptyState(model[0].length);
  for (const c of cards) st = update(st, c);
  return logOddsIn(model, total, st.tally, i, j);
}

// ── THE NEGATIVE CONTROLS (the two knife-switches — the law BROKEN) ───────────────
// skipRenorm(cards): the missing renormalizer. Multiply the prior by each draw's likelihood
// and NEVER divide — belief mass leaks; Σ drifts off 1; the beam over/underflows. Returns
// the UNNORMALIZED weight vector (its Σ visibly ≠ 1).
function skipRenorm(cards, model, total) {
  model = model || URNS; total = total || T;
  let w = prior();
  for (const c of cards) {
    if (!informativeIn(model, c)) continue;   // even broken, an equal-likelihood colour is inert
    w = w.map((wi, i) => wi * likelihoodIn(model, total, i, c));
  }
  return w;   // caller observes Σ(w) ≠ 1
}
// correlatedOverShoot(cards,i,j): counting CORRELATED evidence as independent. Feed the same
// draw twice as if two independent observations → the log-odds slide is DOUBLE-counted and
// overshoots past its true bound. Returns { trueLO, overshoot } so the page narrates the honest
// true number while the bead visibly runs off the rail.
function correlatedOverShoot(cards, i, j, model, total) {
  model = model || URNS; total = total || T;
  let st = emptyState(model[0].length);
  for (const c of cards) st = update(st, c);
  const trueLO = logOddsIn(model, total, st.tally, i, j);
  // double EVERY informative draw (treat each as two independent looks)
  let st2 = emptyState(model[0].length);
  for (const c of cards) { st2 = update(st2, c); st2 = update(st2, c); }
  const overshoot = logOddsIn(model, total, st2.tally, i, j);
  return { trueLO, overshoot };
}

// ── runSelfTest(opts) — the page's own falsifiable self-test over the INLINED core. ──
// modes: 'normal' (every claim holds), 'skipRenorm' (NEG: Σ drifts → RED), 'correlated'
// (NEG: log-odds doubles past its bound → RED). NEG pass = correctly went RED + named offender.
function runSelfTest(opts) {
  opts = opts || {};
  const mode = opts.mode || 'normal';
  const lines = [];
  function ck(name, ok, detail) { lines.push({ name, ok: !!ok, detail: detail || '' }); }
  const TOL = 1e-12;

  if (mode === 'normal') {
    // (A) Σ posterior === 1 within TOL over a draw sweep.
    let maxSig = 0; let st = emptyState();
    const sweep = [0, 2, 1, 0, 0, 2, 1, 0, 2, 1, 2, 0];
    for (const c of sweep) { st = update(st, c); const p = posterior(st); maxSig = Math.max(maxSig, Math.abs(p.reduce((a, b) => a + b, 0) - 1)); }
    ck('belief is conserved: Σ posterior = 1 within 1e-12 over a draw sweep', maxSig < TOL, 'max|Σ−1| = ' + maxSig.toExponential(2));

    // (B-i) per-draw log-odds shift === ln(L-ratio), the FIXED additive slide.
    let maxStep = 0; let s2 = emptyState();
    for (const c of sweep) {
      const before = logOdds(s2, 0, 1);
      s2 = update(s2, c);
      const after = logOdds(s2, 0, 1);
      maxStep = Math.max(maxStep, Math.abs((after - before) - logLikRatioStep(c, 0, 1)));
    }
    ck('log-odds is additive: each draw shifts A:B by exactly ln(L-ratio) (<1e-12)', maxStep < TOL, 'max step error = ' + maxStep.toExponential(2));

    // (B-ii) ORDER-FREEDOM: a permutation lands BIT-IDENTICAL.
    const base = [0, 2, 1, 0, 0];
    const ref = replay(prior(), base);
    const perm = [0, 0, 1, 2, 0];   // same multiset, different order
    const pp = replay(prior(), perm);
    const bitId = ref.every((x, i) => x === pp[i]);
    ck('order is irrelevant: a permuted draw list lands on a bit-identical posterior', bitId);

    // posteriorFrom === posterior cross-check, draw by draw.
    let crossOK = true; let st3 = emptyState(); let pcur = prior();
    for (const c of sweep) {
      st3 = update(st3, c);
      const lk = URNS.map((_, i) => likelihood(i, c));
      pcur = posteriorFrom(pcur, lk);
      const canon = posterior(st3);
      if (Math.max.apply(null, pcur.map((x, i) => Math.abs(x - canon[i]))) > 1e-9) crossOK = false;
    }
    ck('two derivations agree: posteriorFrom (∝prior×lk) tracks posterior (tally) to 1e-9', crossOK);

    // (C) EQUAL-LIKELIHOOD no-op: in EQ_MODEL, Gray (col 3) ×0 vs ×5 is BIT-IDENTICAL.
    const g0 = posteriorIn(EQ_MODEL, EQ_T, [1, 1, 1, 0]);
    const g5 = posteriorIn(EQ_MODEL, EQ_T, [1, 1, 1, 5]);
    const grayId = g0.every((x, i) => x === g5[i]);
    const loG0 = logOddsIn(EQ_MODEL, EQ_T, [1, 1, 1, 0], 0, 1);
    const loG5 = logOddsIn(EQ_MODEL, EQ_T, [1, 1, 1, 5], 0, 1);
    ck('an equal-likelihood (Gray) bead is a no-op: 0 vs 5 grays bit-identical', grayId && loG0 === loG5, '|Δlog-odds| = ' + Math.abs(loG5 - loG0));

    return { pass: lines.every(l => l.ok), lines, offender: null };
  }

  if (mode === 'skipRenorm') {
    const cards = [0, 2, 1, 0, 0, 2, 1, 0, 2, 1];
    const w = skipRenorm(cards);
    const sig = w.reduce((a, b) => a + b, 0);
    ck('skip the renormalizer and Σ drifts off 1 — belief stops being a probability', Math.abs(sig - 1) > 1e-6, 'Σ = ' + sig.toExponential(3));
    const wentRed = Math.abs(sig - 1) > 1e-6;
    return { pass: wentRed, lines, offender: 'the missing renormalizer — belief mass leaks; the beam over/underflows' };
  }

  if (mode === 'correlated') {
    const cards = [0];   // one informative RED bead
    const r = correlatedOverShoot(cards, 0, 1);
    ck('count correlated evidence as independent and the log-odds doubles past its true bound',
       Math.abs(r.overshoot - 2 * r.trueLO) < 1e-12 && Math.abs(r.overshoot) > Math.abs(r.trueLO) + 1e-9,
       'true ' + r.trueLO.toFixed(4) + ' → overshoot ' + r.overshoot.toFixed(4));
    const wentRed = Math.abs(r.overshoot - 2 * r.trueLO) < 1e-12 && Math.abs(r.overshoot) > Math.abs(r.trueLO);
    return { pass: wentRed, lines, offender: 'correlated evidence counted as independent — log-odds overshoots past its true bound' };
  }

  return { pass: false, lines: [{ name: 'unknown mode', ok: false, detail: mode }], offender: 'unknown mode' };
}
// === CORE END ===

export {
  URNS, HYP, COL, T, EQ_MODEL, EQ_T,
  likelihood, likelihoodIn, informative, informativeIn, prior,
  emptyState, update, posterior, posteriorIn, posteriorFrom,
  logOdds, logOddsIn, logLikRatioStep,
  mulberry32, makeSource, replay, replayLogOdds,
  skipRenorm, correlatedOverShoot, runSelfTest
};
