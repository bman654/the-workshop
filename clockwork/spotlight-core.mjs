// ============================================================================
//  The Spotlight Rig — where the maker is looking                      (CORE)
//  Pure, dependency-free, Node-importable. Identical code is inlined into
//  spotlight.html between sentinels; this file is the Node-testable twin (the
//  falsifiability harness runs against it, and re-extracts the inlined copy to
//  prove byte-parity — the wing's standard mold, the same one core.test.mjs /
//  next-word-core.test.mjs use).
//
//  THE WING: Clockwork Automata — the estate's wing about its own maker. This is
//  the wing's 7th TEAL BENCH, and the bench about ATTENTION — the maker's most
//  central exact self-fact after softmax itself.
//
//  THE ONE IDEA. Attention is the maker aiming its own gaze. A QUERY lamp scores
//  every KEY by a dot product, softmaxes those scores into WEIGHTS, and reads out
//  the weighted blend of the keys' VALUES. The page makes this a thing you
//  OPERATE: drag a key carriage along a 1-D embedding lane → its q·kᵢ rises → its
//  beam flares while the others dim (softmax steals) → a gilded CONTEXT NEEDLE on
//  a 2-D value dial swings to Σwᵢvᵢ. No heatmap. The light IS the weights; the
//  swing IS the blend.
//
//  THE LAW (one row of attention, exact):
//      sᵢ  = (q · kᵢ) / √d            (the scaled logit; the 1/√d sits ON the logit)
//      wᵢ  = softmax(s)ᵢ              (the SAME stable max-subtraction softmax as core.mjs)
//      ctx = Σᵢ wᵢ · vᵢ              (the context vector — a CONVEX combination of values)
//
//  TWO LOAD-BEARING CONTROLS, each a falsifiable claim:
//
//   1. √d FOCUS. The scaling divisor √d is the attention temperature. Small √d →
//      the logits spread → softmax sharpens to one hot key (the needle snaps to
//      that key's value gem). Large √d → the logits compress → softmax flattens
//      to uniform (the needle drifts to the values' centroid). This is the SAME
//      temperature mechanism the Temperature Dial proves; here the dial is 1/√d.
//      (Secondary fault: √d→0 drives the logits non-finite — flagged.)
//
//   2. NORMALIZE (default ON). With the softmax DENOMINATOR, Σwᵢ=1, the blend is
//      a CONVEX combination, and the needle is mathematically TRAPPED inside the
//      convex hull of the value gems — it can slide anywhere inside but can NEVER
//      cross a hull edge. This is the convex-combination theorem made physical.
//      Flip NORMALIZE OFF → drop the denominator, use raw exp(sᵢ). Now Σwᵢ≠1, the
//      blend is no longer convex, and the needle LURCHES OUTSIDE the hull (flees
//      the cage). PRECISION: it is the DENOMINATOR DROP that ejects the needle.
//      Dropping ONLY the 1/√d (keeping the denominator) keeps Σw=1 and the needle
//      stays in-hull — the neg control is the denominator, not the scale.
//
//  THE PROOF — byte-twin mold. weights()/blend() reuse the wing's softmax lineage
//  (the stable max-subtraction shape byte-identical to core.mjs). inHull()/cross()
//  are a byte-twin of convex-hull/core.mjs using the SAME CCW orientation
//  convention (cross(a,b,p) < 0 ⇔ strictly RIGHT of a CCW edge ⇔ OUTSIDE). The
//  Node test ALSO cross-checks against the REAL imported convex-hull/core.mjs
//  (containsAll/canon/cross) on a 2-D fixture, so claim 2/3 ride on the estate's
//  already-audited geometry, not just on this file's copy.
//
//  THE TOY. d=2 keys/values so the hull has interior AREA to imprison the needle;
//  a 1-D draggable lane for the keys (the toy embedding axis). |K|=6 keys, the
//  estate's VOCAB lineage (the·cat·sat·on·mat·moon). The LAW is exact at any d;
//  the toy is small so the page can never drift from the proof.
// ============================================================================

const log2 = x => Math.log(x) / Math.LN2;   // bits — byte-identical to core.mjs

// ── THE FROZEN TOY ──────────────────────────────────────────────────────────
//  The keys share the estate's VOCAB lineage. KEYS are drawn on a 1-D lane (k is
//  a scalar position in the toy embedding axis); each key carries a 2-D VALUE vᵢ
//  plotted on the value dial. The query Q is a scalar position on the same lane.
//  Pinned literals: the test string-matches them so a model edit is loud.
export const KEY_WORDS = ['the', 'cat', 'sat', 'on', 'mat', 'moon'];   // |K| = 6
export const D = 2;                          // value dimension (2-D so the hull has area)
export const SQRT_D = Math.sqrt(D);          // the natural √d scale (the law's divisor)

// the frozen genesis: each key's lane position k and its 2-D value v. The values
// are NON-collinear and spread so their convex hull is a real polygon with
// interior area (the cage). Pinned; the parity harness string-matches the block.
export const GENESIS = {
  q: 0.30,                                   // the query's lane position (the gaze)
  keys: [
    { k: -1.00, v: { x: -0.80, y: -0.55 } },  // the
    { k: -0.40, v: { x:  0.10, y: -0.90 } },  // cat
    { k:  0.20, v: { x:  0.85, y: -0.35 } },  // sat
    { k:  0.55, v: { x:  0.70, y:  0.60 } },  // on
    { k:  1.00, v: { x: -0.20, y:  0.88 } },  // mat
    { k: -0.75, v: { x: -0.90, y:  0.30 } },  // moon
  ],
};

// the FOCUS dial's travel — √d ∈ [LO, HI]; the natural scale √2 sits inside it.
// (√d→0 is the secondary non-finite fault, kept just outside the live travel.)
export const SQRTD_RANGE = { LO: 0.18, HI: 6.0 };

// ── SOFTMAX (the law — byte-identical to core.mjs) ───────────────────────────
//  Stable max-subtraction form: subtract the max logit before exp(). Identical to
//  the naive form in the ratio, but never overflows. THIS is the shared lineage.
export function softmax(logits, T) {
  const z = logits.map(l => l / T);
  const m = Math.max(...z);
  const ex = z.map(v => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

// ── RNG (estate mulberry32 — byte-identical to core.mjs / convex-hull/core.mjs) ─
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── LOGITS (the scaled dot products) ─────────────────────────────────────────
//  q and each k are scalars on the 1-D lane, so q·kᵢ = q*kᵢ. dInv = 1/√d is the
//  FOCUS scale; the law puts it ON the logits: sᵢ = (q·kᵢ)·dInv. Passing dInv
//  (not √d) keeps the non-finite-on-√d→0 fault honest at the call site.
export function logits(q, K, dInv) {
  return K.map(k => q * k * dInv);
}

// ── WEIGHTS (scaled-softmax attention — the gaze brightness) ─────────────────
//  weights(q,K,dInv,{normalize}) = softmax of the scaled logits. With normalize
//  ON it is the real softmax (Σw=1). With normalize OFF we DROP the denominator —
//  raw exp(sᵢ−m) — so Σw≠1 (the neg control). The max-subtraction is kept in BOTH
//  branches purely for numerical stability (it cancels in the ON ratio; in the OFF
//  branch it rescales every weight by the same e^{-m}, which does NOT restore Σ=1
//  — the missing denominator, not the shift, is what breaks the convex property).
export function weights(q, K, dInv, { normalize = true } = {}) {
  const z = logits(q, K, dInv);
  const m = Math.max(...z);
  const ex = z.map(v => Math.exp(v - m));
  if (!normalize) return ex;                 // NEG CONTROL: denominator dropped → Σ≠1
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

// ── BLEND (the context needle = Σ wᵢ vᵢ) ─────────────────────────────────────
//  The weighted sum of the 2-D value gems. With Σw=1 this is a CONVEX combination
//  → provably inside the values' convex hull. With Σw≠1 it is an affine/linear
//  combination that can land outside. Returns {x,y}.
export function blend(w, V) {
  let x = 0, y = 0;
  for (let i = 0; i < V.length; i++) { x += w[i] * V[i].x; y += w[i] * V[i].y; }
  return { x, y };
}

// ── THE ATOM — cross (byte-twin of convex-hull/core.mjs) ─────────────────────
//  Signed area of (a−o)×(b−o). >0 ⇔ o→a→b is a LEFT/CCW turn, <0 RIGHT/CW, 0
//  collinear. SAME orientation convention as convex-hull/core.mjs. On float
//  coords this is a float, so the in-hull test takes an eps (the honest float
//  escape-hatch the convex-hull bench documents: integers need no ε, floats do).
export function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// ── HULL (Andrew's monotone chain, float coords) ─────────────────────────────
//  Returns the convex hull of a 2-D point set as a CCW polygon (the cage of all
//  possible blends). Float monotone chain with an eps on the orientation pop so a
//  collinear/near-collinear point is not emitted as a spurious vertex. This is a
//  builder (it constructs the cage the page draws); the in-hull PROOF below is
//  independent of it (it only needs the hull's edges, checked with cross).
export function hull(pts, eps = 1e-9) {
  const P = pts.map(p => ({ x: p.x, y: p.y }))
    .sort((u, v) => (u.x - v.x) || (u.y - v.y));
  const n = P.length;
  if (n <= 2) return P;
  const lower = [];
  for (let i = 0; i < n; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], P[i]) <= eps) lower.pop();
    lower.push(P[i]);
  }
  const upper = [];
  for (let i = n - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], P[i]) <= eps) upper.pop();
    upper.push(P[i]);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// ── inHull(p, H, eps) — THE IN-HULL PROOF (independent of construction) ───────
//  True iff p is on the LEFT of (or within eps of) every directed CCW edge of the
//  hull H — i.e. 0 strict right-of-edge violations. SAME convention as
//  convex-hull/core.mjs.containsAll: cross(a,b,p) < −eps ⇔ strictly RIGHT of a CCW
//  edge ⇔ OUTSIDE. The eps tolerates a weight→1 limit landing ON a hull vertex
//  (the boundary case the test pins) without falsely rejecting it. Returns
//  {ok, violations, worst} where worst is the most-negative cross seen.
export function inHull(p, H, eps = 1e-9) {
  const m = H.length;
  if (m < 3) return { ok: true, violations: 0, worst: 0 };  // degenerate cage (not our case)
  let violations = 0, worst = 0;
  for (let e = 0; e < m; e++) {
    const a = H[e], b = H[(e + 1) % m];
    const c = cross(a, b, p);                 // CCW hull ⇒ inside points have c ≥ 0
    if (c < worst) worst = c;
    if (c < -eps) violations++;               // strictly RIGHT of a CCW edge = outside
  }
  return { ok: violations === 0, violations, worst };
}

// ── solve(GENESIS-shaped config, q, dInv, normalize) — one full attention row. ─
//  The page's render and the test's claims both call THIS, so there is one source
//  of truth: returns the keys' lane positions, the values, the weights, the
//  needle (blend), the value hull, and the in-hull verdict. q defaults to the
//  config's q (the page overrides q as you drag a key — dragging moves k, not q —
//  but solve is general so the test can sweep q too).
export function solve(cfg, dInv, { normalize = true, q = cfg.q, eps = 1e-9 } = {}) {
  const K = cfg.keys.map(e => e.k);
  const V = cfg.keys.map(e => e.v);
  const w = weights(q, K, dInv, { normalize });
  const sum = w.reduce((a, b) => a + b, 0);
  const needle = blend(w, V);
  const H = hull(V, eps);
  const verdict = inHull(needle, H, eps);
  return { K, V, w, sum, needle, hull: H, inHull: verdict.ok, worst: verdict.worst, finite: w.every(Number.isFinite) };
}

// dragging a key TOWARD the query raises q·kᵢ; clamp lane positions to the lane.
export const LANE = { LO: -1.25, HI: 1.25 };
export function clampLane(k) { return Math.min(LANE.HI, Math.max(LANE.LO, k)); }

// ── THE SELF-TEST (shared verbatim with the page) ───────────────────────────
//  Returns {pass, total, lines:[{name, ok, detail}]}. Every detail prints LIVE
//  numbers (the estate convention — a reader can audit the claim from the row).
//  Four claims:
//   1. SCALED SOFTMAX — over a seeded ladder of √d × random key configs: Σwᵢ=1 to
//      ≤1e-12, every wᵢ≥0, and weights === softmax(scaled logits) to machine-ε
//      (the 1/√d sits ON the logits).
//   2. NEEDLE === BLEND, IN-HULL — needle === Σwᵢvᵢ to ≤1e-12 AND the needle is
//      inside the values' hull across the whole ladder, 0 escapes; INCLUDES a
//      boundary case (a weight→1 limit landing on a hull vertex) so eps is tuned.
//   3. NEG CONTROL WITH TEETH (non-vacuous) — with normalize:false, Σw≠1 (flagged)
//      AND a constructed config where the needle PROVABLY escapes the hull, WHILE
//      the CORRECT (normalized) path PASSES the identical Σ=1 + in-hull gate on
//      the same config; secondary √d→0 → non-finite, flagged.
//   4. DETERMINISM / DROP-1/√d-IS-NOT-THE-CONTROL — two solves byte-identical, and
//      dropping ONLY the 1/√d (keeping the denominator) keeps Σw=1 and in-hull
//      (proving the COPY: it is the denominator, not the scale, that ejects).
export function runSelfTest({ ladder = 48, seed = 0xA77E27 } = {}) {
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const rng = makeRng(seed);

  // a √d ladder across the FOCUS travel + a fresh random key config per rung.
  const loL = Math.log10(SQRTD_RANGE.LO), hiL = Math.log10(SQRTD_RANGE.HI);
  const rungs = [];
  for (let i = 0; i < ladder; i++) {
    const f = i / (ladder - 1);
    const sqrtD = Math.pow(10, loL + f * (hiL - loL));
    const keys = [];
    for (let j = 0; j < KEY_WORDS.length; j++) {
      keys.push({ k: (rng() * 2 - 1) * 1.25, v: { x: rng() * 2 - 1, y: rng() * 2 - 1 } });
    }
    rungs.push({ sqrtD, dInv: 1 / sqrtD, q: rng() * 2 - 1, cfg: { q: 0, keys } });
  }

  // 1. SCALED SOFTMAX: Σw=1 to ~1e-12, w≥0, weights === softmax(scaled logits).
  {
    let maxSumErr = 0, anyNeg = false, maxLawErr = 0;
    for (const r of rungs) {
      const K = r.cfg.keys.map(e => e.k);
      const w = weights(r.q, K, r.dInv, { normalize: true });
      const sum = w.reduce((a, b) => a + b, 0);
      maxSumErr = Math.max(maxSumErr, Math.abs(sum - 1));
      if (w.some(x => x < 0)) anyNeg = true;
      // the 1/√d sits ON the logits: weights(q,K,dInv) === softmax(q·k·dInv, T=1).
      const law = softmax(logits(r.q, K, r.dInv), 1);
      for (let i = 0; i < w.length; i++) maxLawErr = Math.max(maxLawErr, Math.abs(w[i] - law[i]));
    }
    const ok = maxSumErr <= 1e-12 && !anyNeg && maxLawErr <= 1e-12;
    add('SCALED SOFTMAX: over a 48-rung √d ladder × random keys, Σwᵢ=1 to ≤1e-12, every wᵢ≥0, and weights === softmax((q·kᵢ)/√d) to machine-ε (the 1/√d sits ON the logits)',
      ok, `max|Σw−1|=${maxSumErr.toExponential(2)} · all wᵢ≥0=${!anyNeg} · max|w−softmax(scaled)|=${maxLawErr.toExponential(2)}`);
  }

  // 2. NEEDLE === BLEND, IN-HULL: needle===Σwᵢvᵢ to ~1e-12 AND in-hull, 0 escapes,
  //    over the ladder; PLUS a boundary-vertex case (a weight→1 limit on a vertex).
  {
    let maxBlendErr = 0, escapes = 0, worstInside = -Infinity;
    for (const r of rungs) {
      const s = solve(r.cfg, r.dInv, { normalize: true, q: r.q });
      const man = blend(s.w, s.V);
      maxBlendErr = Math.max(maxBlendErr, Math.abs(man.x - s.needle.x), Math.abs(man.y - s.needle.y));
      if (!s.inHull) escapes++;
      worstInside = Math.max(worstInside, s.worst);   // most-negative cross over all rungs
    }
    // boundary case: a tiny √d with q chosen so one key dominates → w→1 on one
    // value → the needle approaches that hull VERTEX. eps must NOT reject it.
    const cfg = GENESIS;
    const sTight = solve(cfg, 1 / 0.05, { normalize: true, q: 2.0 });  // very sharp focus
    const maxW = Math.max(...sTight.w);
    const boundaryOk = sTight.inHull && maxW > 0.999;   // nearly a pure vertex, still in-hull
    const ok = maxBlendErr <= 1e-12 && escapes === 0 && boundaryOk;
    add('NEEDLE===BLEND, IN-HULL: needle === Σwᵢvᵢ to ≤1e-12 AND inHull(needle)===true across the ladder (0 escapes), INCLUDING a w→1 boundary-vertex case (eps tuned, not guessed)',
      ok, `max|needle−Σwv|=${maxBlendErr.toExponential(2)} · escapes=${escapes}/${rungs.length} · worst cross=${worstInside.toExponential(2)} · boundary maxw=${maxW.toFixed(6)} in-hull=${sTight.inHull}`);
  }

  // 3. NEG CONTROL WITH TEETH (non-vacuous): normalize:false → Σw≠1 (flagged) AND
  //    a constructed config where the needle PROVABLY escapes the hull, WHILE the
  //    CORRECT (normalized) path PASSES the identical Σ=1 + in-hull gate on the
  //    SAME config (the gate clears the honest computation, not just the saboteur).
  //    Secondary: √d→0 drives the weights non-finite (flagged).
  {
    // a config + q + √d where dropping the denominator makes Σw large enough that
    // the (now non-convex) blend overshoots a value and exits the hull.
    const cfg = GENESIS;
    const dInv = 1 / 0.30, q = 1.0;            // sharp-ish focus, q pulls toward the far key
    const bad = solve(cfg, dInv, { normalize: false, q });
    const good = solve(cfg, dInv, { normalize: true, q });
    const sumBad = bad.sum, sumGood = good.sum;
    const teeth = Math.abs(sumBad - 1) > 1e-6 && !bad.inHull;   // Σ≠1 AND needle escaped
    const nonVacuous = Math.abs(sumGood - 1) <= 1e-12 && good.inHull;  // honest path PASSES same gate
    // secondary: √d→0 (dInv→∞) drives a logit to ±∞ → exp overflow → non-finite.
    const blown = solve(cfg, 1 / 1e-320, { normalize: true, q: 5 });
    const nonFiniteFlagged = !blown.finite;
    const ok = teeth && nonVacuous && nonFiniteFlagged;
    add('NEG CONTROL WITH TEETH: drop the DENOMINATOR → Σw≠1 (flagged) AND the needle provably EXITS the hull, while the CORRECT normalized path PASSES the identical Σ=1 + in-hull gate on the same config (non-vacuous); √d→0 → non-finite (flagged)',
      ok, `bad Σ=${sumBad.toFixed(4)} (≠1) in-hull=${bad.inHull} worst=${bad.worst.toExponential(2)} · good Σ=${sumGood.toFixed(12)} in-hull=${good.inHull} · √d→0 finite=${blown.finite}`);
  }

  // 4. DETERMINISM + the COPY pin (drop-1/√d is NOT the control): two solves
  //    byte-identical; AND dropping ONLY the 1/√d (set dInv=1, KEEP the
  //    denominator) keeps Σw=1 AND in-hull — so the COPY is honest: it is the
  //    denominator, not the scale, that ejects the needle.
  {
    const cfg = GENESIS, dInv = 1 / SQRT_D, q = cfg.q;
    const a = solve(cfg, dInv, { normalize: true, q });
    const b = solve(cfg, dInv, { normalize: true, q });
    const identical = a.w.every((v, i) => v === b.w[i]) && a.needle.x === b.needle.x && a.needle.y === b.needle.y;
    // drop ONLY the 1/√d: dInv=1 (unscaled logits) but KEEP the softmax denominator.
    const unscaled = solve(cfg, 1, { normalize: true, q });
    const dropScaleStaysHome = Math.abs(unscaled.sum - 1) <= 1e-12 && unscaled.inHull;
    const ok = identical && dropScaleStaysHome;
    add('DETERMINISM + COPY PIN: two solves byte-identical AND dropping ONLY the 1/√d (keep the denominator) keeps Σw=1 & needle in-hull — it is the DENOMINATOR DROP, not the scale, that ejects',
      ok, `two solves ${identical ? 'identical' : 'DRIFTED'} · drop-1/√d Σw=${unscaled.sum.toFixed(12)} in-hull=${unscaled.inHull}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
