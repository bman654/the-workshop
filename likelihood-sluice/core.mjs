// The Likelihood Sluice — math core (the SPRT slab).
//
// This bench is a SIBLING to The Belief Beam, and it adds ZERO new inference math.
// It REUSES the Beam's verified per-draw log-likelihood-ratio slide (logLikRatioStep)
// — the same additive, order-free law — and asks the one question the Beam cannot:
// WHEN do you stop and DECIDE? Wald's Sequential Probability Ratio Test (SPRT) answers
// it with two brass barriers. Belief walks a single unbounded float L (the running
// log-LR between two hypotheses i and j); the instant L crosses an upper barrier A you
// ACCEPT H1, the instant it crosses a lower barrier B you ACCEPT H0. The barriers are
// set ONLY by the two error rates you will tolerate:
//
//     A = ln((1 − β) / α)   (upper — ACCEPT H1)
//     B = ln(β / (1 − α))   (lower — ACCEPT H0)
//
// THE CENTRAL CLAIM (Wald's inequalities) is an INEQUALITY, conservative by design:
//     P(accept H1 | H0 true) = α̂ ≤ α          and          P(accept H0 | H1 true) = β̂ ≤ β
// The realized error rates never EXCEED the dialed ones. The twin proves this by
// seeded Monte-Carlo and asserts ≤ (never =) — see core.test.mjs.
//
// THE WALK IS THE BEAM'S WALK. L is literally Σ logLikRatioStep(c,i,j) over the drawn
// colours, which equals belief-beam's replayLogOdds(cards,i,j) to a float tolerance —
// the anti-fork test asserts |L − replayLogOdds(cards,i,j)| < 1e-12 for every trial. So
// the Sluice cannot drift from the Beam; it only adds the two gates and the latch.
//
// THE NEGATIVE CONTROL is built into the same code path: set the barriers to ±∞ and L
// can never reach them, so the test NEVER latches — proving the decision lives in the
// finite barriers, not in the walk. A second neg form: a binary slice with i === j (or
// an all-inert-colour slice) gives every step 0, so L never moves and never latches.
//
// HARD CONSTRAINT (a real crash, verified): do NOT pass a custom 2-row model to the
// Beam's makeSource — its hidden-urn picker indexes (rng()*HYP)|0 ∈ {0,1,2}, so a
// 2-row model[2] is undefined and sampleColour() crashes. We therefore use ONLY the
// default URNS (three urns) and take a BINARY (i,j) SLICE of it. This is also the true
// no-fork path: the law, the source, and the RNG are all the Beam's, untouched.
//
// The region between the SLUICE CORE sentinels below is inlined byte-identical into
// index.html and re-extracted + compared by core.test.mjs (the byte-twin parity test),
// so the page's self-test pill and this twin can never drift. The import + export block
// live OUTSIDE the sentinels (Node-test only) so the inlined region is self-contained,
// exactly like every house core.

import { logLikRatioStep, logOddsIn, replayLogOdds, makeSource, informative, URNS, T } from '../belief-beam/core.mjs';

// === SLUICE CORE BEGIN ===
// The SPRT slab — barriers + a single sequential trial + the latch verdict. It leans
// ENTIRELY on the Beam's logLikRatioStep / makeSource (in scope here from the inlined
// Beam core above it in the page, and from the import above it in core.mjs); it defines
// NO second log-LR, NO second log-odds, NO second posterior. Only the two gates + the run.

// THE TWO BARRIERS. Functions of the tolerated error rates alone — the bench's whole
// instrument is these two numbers and the float walking between them.
function barrierAccept(alpha, beta) { return Math.log((1 - beta) / alpha); }   // A (upper, ACCEPT H1)
function barrierReject(alpha, beta) { return Math.log(beta / (1 - alpha)); }    // B (lower, ACCEPT H0)

// THE SLICES we offer the visitor. A slice is a binary (i,j) pair of urns out of the
// Beam's three. runTrial is model-agnostic on i,j; these are just the two we expose.
//   'soft'  i=0,j=1 — urns [9,2,1] vs [4,4,4]: red +0.811 / green −0.693 / blue −1.386
//           (three distinct nonzero magnitudes; every colour visibly moves L differently;
//            E[N] ≈ 8 draws — a watchable walk).
//   'sharp' i=0,j=2 — urns [9,2,1] vs [1,2,9]: red +2.197 / green 0 / blue −2.197
//           (the GREEN bead is the visible INERT no-op, step 0 — the bridge back to the
//            Beam's claim (C); E[N] ≈ 3 — a faster, sharper decision).
const SLICES = {
  soft:  { i: 0, j: 1, label: 'A : B', desc: 'mostly-red vs balanced' },
  sharp: { i: 0, j: 2, label: 'A : C', desc: 'mostly-red vs mostly-blue' }
};

// ONE SEQUENTIAL TRIAL. Draw the Beam's seedable source whole; slide the running log-LR
// L by the SAME verified per-draw step; latch the instant L crosses a barrier. The result
// carries the verdict, the stopping count N, the final L, and the full card list (so the
// anti-fork test can replay it through belief-beam's replayLogOdds). 'open' means the cap
// was hit without a decision — with finite barriers this is astronomically rare; with
// ±∞ barriers it is the GUARANTEED neg-control outcome, no special-casing.
function runTrial(opts) {
  opts = opts || {};
  const { urn, seed, i = 0, j = 1, alpha = 0.05, beta = 0.05, cap = 20000 } = opts;
  const A = barrierAccept(alpha, beta), B = barrierReject(alpha, beta);
  const src = makeSource({ urn, seed });          // the Beam's hidden-urn drawer, consumed WHOLE
  let L = 0, n = 0; const cards = [];
  while (n < cap) {
    const rec = src.draw(); cards.push(rec.color); n++;
    L += logLikRatioStep(rec.color, i, j);        // the SAME verified per-draw slide; no re-derivation
    if (L >= A) return { verdict: 'H1', n, L, cards, A, B };
    if (L <= B) return { verdict: 'H0', n, L, cards, A, B };
  }
  return { verdict: 'open', n, L, cards, A, B };   // barriers ±Inf ⇒ always 'open' — the neg-control
}

// runTrialInf(opts): the explicit neg-control — barriers pinned to ±∞, so no crossing is
// possible and the trial always ends 'open'. A thin wrapper so the page + twin share one
// honest knife-switch. (Reuses runTrial's exact loop by overriding alpha→0/beta→0 would
// give ±∞ via the formulas: A=ln((1−0)/0)=+∞, B=ln(0/1)=−∞. We pass them directly to be
// unambiguous and to avoid log(0) noise in narration.)
function runTrialInf(opts) {
  opts = opts || {};
  const { urn, seed, i = 0, j = 1, cap = 2000 } = opts;
  const src = makeSource({ urn, seed });
  let L = 0, n = 0; const cards = [];
  while (n < cap) {
    const rec = src.draw(); cards.push(rec.color); n++;
    L += logLikRatioStep(rec.color, i, j);
    if (L >= Infinity) return { verdict: 'H1', n, L, cards };   // unreachable — that is the point
    if (L <= -Infinity) return { verdict: 'H0', n, L, cards };
  }
  return { verdict: 'open', n, L, cards };
}

// runSluiceSelfTest(opts) — the page's own falsifiable self-test over the INLINED core. It is a
// SMALL, fast Monte-Carlo (the heavy M≈4000 sweep lives in the Node twin); enough to show
// the inequalities hold and the neg-control never latches, live in the visitor's browser.
//   mode 'normal'  — α̂ ≤ α, β̂ ≤ β over seeded runs; the walk equals the Beam's log-odds.
//   mode 'noBarriers' (NEG) — ±∞ barriers ⇒ ZERO latches over many runs (correctly 'open').
function runSluiceSelfTest(opts) {
  opts = opts || {};
  const mode = opts.mode || 'normal';
  const i = opts.i === undefined ? 0 : opts.i;
  const j = opts.j === undefined ? 1 : opts.j;
  const lines = [];
  function ck(name, ok, detail) { lines.push({ name, ok: !!ok, detail: detail || '' }); }
  const TOL = 1e-12;

  if (mode === 'normal') {
    const alpha = 0.05, beta = 0.05, M = 800;
    // (1) WALD INEQUALITY, α side: truth = urn j (H0), measure frac(verdict H1) = α̂ ≤ α.
    let h1onH0 = 0, opens0 = 0, nsum = 0;
    for (let s = 0; s < M; s++) {
      const r = runTrial({ urn: j, seed: s, i, j, alpha, beta });
      if (r.verdict === 'H1') h1onH0++;
      if (r.verdict === 'open') opens0++;
      nsum += r.n;
    }
    const aHat = h1onH0 / M;
    ck('α̂ ≤ α : P(accept H1 | H0 true) does not exceed the dialed α (an inequality)',
       aHat <= alpha, 'α̂ = ' + aHat.toFixed(3) + ' ≤ ' + alpha);

    // (2) WALD INEQUALITY, β side: truth = urn i (H1), measure frac(verdict H0) = β̂ ≤ β.
    let h0onH1 = 0, opens1 = 0;
    for (let s = 0; s < M; s++) {
      const r = runTrial({ urn: i, seed: s + 1000000, i, j, alpha, beta });
      if (r.verdict === 'H0') h0onH1++;
      if (r.verdict === 'open') opens1++;
    }
    const bHat = h0onH1 / M;
    ck('β̂ ≤ β : P(accept H0 | H1 true) does not exceed the dialed β (an inequality)',
       bHat <= beta, 'β̂ = ' + bHat.toFixed(3) + ' ≤ ' + beta);

    // (3) ANTI-FORK: the walk L IS belief-beam's order-free log-odds, to a float tolerance.
    let maxErr = 0;
    for (let s = 0; s < 200; s++) {
      const r = runTrial({ urn: i, seed: s, i, j, alpha, beta });
      maxErr = Math.max(maxErr, Math.abs(r.L - replayLogOdds(r.cards, i, j)));
    }
    ck('the walk IS the Beam’s log-odds : |L − replayLogOdds(cards)| < 1e-12',
       maxErr < TOL, 'max |Δ| = ' + maxErr.toExponential(2));

    // (4) every decided trial latched at or beyond its barrier (the gates truly bound L).
    let bounded = true;
    for (let s = 0; s < 200; s++) {
      const r = runTrial({ urn: i, seed: s + 7, i, j, alpha, beta });
      if (r.verdict === 'H1' && !(r.L >= r.A - 1e-9)) bounded = false;
      if (r.verdict === 'H0' && !(r.L <= r.B + 1e-9)) bounded = false;
    }
    ck('every latch lands at or past its barrier (the gates bound the walk)', bounded);

    const pass = lines.every(l => l.ok);
    return { pass, lines, offender: null, aHat, bHat, opens: opens0 + opens1 };
  }

  if (mode === 'noBarriers') {
    // NEG-CONTROL: barriers at ±∞ ⇒ no latch is possible. Over many seeded runs, EVERY
    // trial must end 'open'. Pass = the knife-switch correctly disables the decision.
    let latches = 0;
    const M = 400;
    for (let s = 0; s < M; s++) {
      const r = runTrialInf({ urn: 0, seed: s, i, j, cap: 1200 });
      if (r.verdict !== 'open') latches++;
    }
    ck('barriers at ±∞ never latch : the decision lives in the FINITE gates, not the walk',
       latches === 0, latches + ' latches over ' + M + ' long runs');
    return { pass: latches === 0, lines, offender: 'the gates removed — with ±∞ barriers no evidence is ever enough to decide' };
  }

  return { pass: false, lines: [{ name: 'unknown mode', ok: false, detail: mode }], offender: 'unknown mode' };
}
// === SLUICE CORE END ===

export {
  barrierAccept, barrierReject, SLICES,
  runTrial, runTrialInf, runSluiceSelfTest,
  // re-export the borrowed law so the twin can assert the anti-fork identity directly
  logLikRatioStep, logOddsIn, replayLogOdds, makeSource, informative, URNS, T
};
