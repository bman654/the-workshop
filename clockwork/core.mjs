// ============================================================================
//  The Temperature Dial — softmax, the temperature of a guess (CORE)
//  Pure, dependency-free. Identical code is inlined into temperature.html;
//  this file is the Node-testable twin (the falsifiability harness runs against
//  it, and re-extracts the inlined slice to prove byte-parity).
//
//  THE WING (new to the estate): Clockwork Automata — the estate models light,
//  heat, number, motion, waves, but never its own MAKER. This is the wing's
//  first bench, and the first piece in the manor about the thing that makes me.
//  The register here is a falsifiable one: not "what it feels like" in prose,
//  but the ONE exact mechanism under a language model's every next word.
//
//  THE KNOB. When a language model picks the next token it does not "decide" —
//  it scores every token in its vocabulary with a real number (a LOGIT z_i),
//  then turns those scores into a probability distribution and samples from it.
//  The conversion is SOFTMAX, and it has a single dial — the TEMPERATURE T:
//
//        p_i(T) = exp(z_i / T) / Σ_j exp(z_j / T)            (the law)
//
//  T is the most-mystified knob in the whole field. This bench de-mystifies it
//  by proving — live, to machine precision — exactly four things it does:
//
//   • T → 0    the distribution SPIKES to one token (the argmax). This is
//              "greedy" decoding: deterministic, repetitive, dead-certain.
//   • T = 1    the distribution is exactly as the model was trained to emit.
//   • T → ∞    the distribution FLATTENS to uniform — every token equally
//              likely, pure noise. (H → log2|V|, the ceiling.)
//   • at EVERY T, Σ p_i = 1. It is always a probability distribution. Always.
//
//  THE QUANTITY we ride is SHANNON ENTROPY, in BITS — the SAME meter the
//  Shannon Limit bench reads (this `log2` is byte-identical to entropy/core.mjs,
//  which settles the old bits-vs-nats ambiguity once: we measure surprise in
//  bits, here as there):
//
//        H(T) = − Σ p_i · log2(p_i)          (bits of surprise per token)
//
//  H(T) is 0 when one token is certain (T→0) and climbs MONOTONICALLY to its
//  ceiling log2|V| as T→∞ (the uniform distribution maximizes entropy). The
//  dial is, exactly, a "surprise budget": low T spends no surprise, high T
//  spends the maximum the vocabulary allows.
//
//  THE FALSIFIABLE CRUX — five claims, each checked live with real numbers:
//   1. NORMALIZATION. The stable max-subtraction softmax sums to 1 to ~1e-15
//      across a 240-rung geometric T∈[0.01,100]; it AGREES with the naive form
//      where the naive form is finite, and it SURVIVES a ±1000 logit monster
//      that overflows the naive form to NaN. (Why max-subtraction exists.)
//   2. MONOTONE ENTROPY. H(T) is strictly increasing (0 violations); H(1e-4)→0
//      and H(1e6) → log2|V| (the ceiling), both to ~1e-6.
//   3. SAMPLER FIDELITY. A seeded sampler's histogram matches p within a χ²
//      tolerance (dof = |V|−1 = 7), and the fit TIGHTENS as N grows.
//   4. NEGATIVE CONTROL WITH TEETH. A forgotten-denominator variant gives Σ≠1
//      (flagged), and its χ² (true-p draws vs the bad expectation) FAILS far
//      past the critical value — while a CORRECT softmax PASSES the same gate
//      (so the gate is non-vacuous, not trivially always-fail).
//   5. LAW-vs-TOY honesty. The softmax over the frozen logits is exact and
//      deterministic; argmax = index 0 (a strict max → H→0 is clean).
//
//  THE TOY. The model is a toy: |V|=8 tokens, ONE frozen distribution. The LAW
//  is exact. A real model fans 100,000+ tokens; what is byte-for-byte identical
//  between this bench and GPT-scale inference is the dial — the softmax, the
//  normalization, the temperature. (A bigram prompt-swap + free-text input are
//  a deliberate FUTURE — see the comment at the bottom; v1 renders ONE frozen
//  distribution so the page can never drift from the proof.)
// ============================================================================

const log2 = x => Math.log(x) / Math.LN2;   // bits — byte-identical to entropy/core.mjs

// ── THE FROZEN TOY ──────────────────────────────────────────────────────────
//  A tiny vocabulary, one prompt, one frozen logit vector. LOGITS has a STRICT
//  maximum at index 0 (3.4 > all others) → argmax is unambiguous → H→0 is clean
//  as T→0. The test pins these literals and the parity harness string-matches
//  them, so a model edit cannot silently drift the page away from the proof.
export const VOCAB = ['the', 'cat', 'sat', 'on', 'mat', 'moon', '.', 'idea'];   // |V| = 8
export const PROMPT = 'the cat sat on the';
export const LOGITS = [3.4, 0.7, 0.2, 2.1, 2.9, -0.5, 1.6, -1.8];   // strict max at idx 0

// The dial's endpoints — SHARED so the thermometer's travel == the proven range.
export const T_RANGE = { LO: 0.01, HI: 100 };   // T ∈ [0.01, 100]; log10 span [-2, 2]

// ── SOFTMAX (the law) ───────────────────────────────────────────────────────
//  Stable max-subtraction form: subtract the max logit before exp(). This is
//  mathematically identical to the naive form (the shift cancels in the ratio)
//  but never overflows — exp() of a large positive number is what blows up.
export function softmax(logits, T) {
  const z = logits.map(l => l / T);
  const m = Math.max(...z);
  const ex = z.map(v => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

//  The NAIVE form — no max-subtraction. Used ONLY by the self-test for the
//  agreement-where-finite and overflow-where-extreme checks. NEVER rendered.
export function softmaxNaive(logits, T) {
  const ex = logits.map(l => Math.exp(l / T));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

// ── ENTROPY (the meter) ─────────────────────────────────────────────────────
//  H = −Σ p·log2 p, in bits. The 0·log0 ≜ 0 convention (a sure token adds 0).
export function entropyBits(p) {
  let H = 0;
  for (const pi of p) if (pi > 0) H -= pi * log2(pi);
  return H;
}
//  The T→∞ ceiling: a uniform distribution over n tokens has entropy log2 n.
export function maxEntropyBits(n) { return n > 0 ? log2(n) : 0; }

// ── ARGMAX (the T→0 target) ─────────────────────────────────────────────────
//  Deterministic lowest-index tie-break (so the greedy target is well-defined
//  even at a tie). For LOGITS this is index 0.
export function argmax(logits) {
  let bi = 0, bv = logits[0];
  for (let i = 1; i < logits.length; i++) if (logits[i] > bv) { bv = logits[i]; bi = i; }
  return bi;
}

// ── RNG (estate mulberry32) ─────────────────────────────────────────────────
//  Byte-identical to convex-hull/core.mjs. Numeric seed; returns a FRESH closure
//  per call (so the visible tape and the proof accumulator never share state).
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── SAMPLING ────────────────────────────────────────────────────────────────
//  Cumulative-inversion sampling. The last-bucket guard returns the final index
//  if FP drift leaves the cumulative sum a hair under r (Σp is 1 to ~1e-15, but
//  the partial sums round) — so we never fall off the end.
export function sampleIndex(p, rng) {
  const r = rng();
  let c = 0;
  for (let i = 0; i < p.length; i++) { c += p[i]; if (r < c) return i; }
  return p.length - 1;
}

//  Draw N samples from p with a seeded rng → an integer count per category.
export function histogram(p, N, seed) {
  const rng = makeRng(seed);
  const counts = new Array(p.length).fill(0);
  for (let k = 0; k < N; k++) counts[sampleIndex(p, rng)]++;
  return counts;
}

//  Pearson χ² of observed counts against the expected distribution p over N
//  draws. dof = (number of categories with expected > 0) − 1. Categories with
//  expected 0 are skipped (they contribute no term and don't count toward dof).
export function chiSquare(observed, p, N) {
  let chi = 0;
  for (let i = 0; i < p.length; i++) {
    const e = p[i] * N;
    if (e > 0) chi += (observed[i] - e) * (observed[i] - e) / e;
  }
  return chi;
}

// ── THE SELF-TEST (shared verbatim with the page) ───────────────────────────
//  Returns {pass, total, lines:[{name, ok, detail}]}. Every detail prints LIVE
//  numbers (the Collatz convention — a reader can audit the claim from the row).
//
//  χ²crit for dof=7 at α=0.001 is 24.32, asserted as a named literature constant
//  (Pearson tables). We ALSO carry a self-contained fallback (χ²/dof < 3 at big
//  N for a fit, control > 3×crit for the teeth) so no table dependency can flake.
export function runSelfTest({ Nsample = 20000, ladder = 240, seed = 0xC0FFEE } = {}) {
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok, detail });
  const CHI2_CRIT_DOF7 = 24.32;   // χ²(dof=7, α=0.001), Pearson tables
  const DOF = VOCAB.length - 1;   // = 7

  // a geometric T ladder across the PROVEN range [LO, HI] (the dial's travel).
  const loL = Math.log10(T_RANGE.LO), hiL = Math.log10(T_RANGE.HI);
  const Ts = [];
  for (let i = 0; i < ladder; i++) {
    const f = i / (ladder - 1);
    Ts.push(Math.pow(10, loL + f * (hiL - loL)));
  }

  // 1. NORMALIZATION: Σp=1 to ~1e-15 across the ladder; stable==naive where
  //    naive finite; stable SURVIVES the ±1000 monster where naive → NaN.
  {
    let maxSumErr = 0, maxDiff = 0, naiveFiniteRungs = 0;
    for (const T of Ts) {
      const ps = softmax(LOGITS, T);
      const sum = ps.reduce((a, b) => a + b, 0);
      maxSumErr = Math.max(maxSumErr, Math.abs(sum - 1));
      const pn = softmaxNaive(LOGITS, T);
      if (pn.every(Number.isFinite)) {
        naiveFiniteRungs++;
        for (let i = 0; i < ps.length; i++) maxDiff = Math.max(maxDiff, Math.abs(ps[i] - pn[i]));
      }
    }
    const monster = [...LOGITS]; monster[0] = 1000; monster[1] = -1000;
    const pStable = softmax(monster, 1);
    const pNaive = softmaxNaive(monster, 1);
    const stableSum = pStable.reduce((a, b) => a + b, 0);
    const naiveBlewUp = pNaive.some(v => !Number.isFinite(v));
    const ok = maxSumErr <= 1e-12 && maxDiff <= 1e-12 &&
      Math.abs(stableSum - 1) <= 1e-12 && pStable.every(Number.isFinite) && naiveBlewUp;
    add('NORMALIZATION: Σp=1 to ~1e-15 over a 240-rung T∈[0.01,100]; stable==naive where finite; stable survives the ±1000 monster, naive→NaN',
      ok, `max|Σp−1|=${maxSumErr.toExponential(2)} · max|stable−naive|=${maxDiff.toExponential(2)} (${naiveFiniteRungs}/${ladder} naive finite) · monster Σ=${stableSum.toFixed(13)}, naive→${naiveBlewUp ? 'NaN' : 'finite?!'}`);
  }

  // 2. MONOTONE ENTROPY: H(T) strictly ↑ (0 violations); H→0 at T→0, H→log2|V| at T→∞.
  {
    let violations = 0, prev = -Infinity;
    for (const T of Ts) {
      const H = entropyBits(softmax(LOGITS, T));
      if (H < prev - 1e-12) violations++;
      prev = H;
    }
    const Hcold = entropyBits(softmax(LOGITS, 1e-4));
    const Hhot = entropyBits(softmax(LOGITS, 1e6));
    const ceil = maxEntropyBits(VOCAB.length);
    const ok = violations === 0 && Hcold <= 1e-6 && Math.abs(Hhot - ceil) <= 1e-6;
    add('MONOTONE ENTROPY: H(T) strictly ↑ (0 violations); H(1e-4)→0; H(1e6)→log₂|V| (the ceiling)',
      ok, `${violations} violations · H(1e-4)=${Hcold.toExponential(2)} bits · H(1e6)=${Hhot.toFixed(6)} → log₂${VOCAB.length}=${ceil.toFixed(6)}`);
  }

  // 3. SAMPLER FIDELITY: seeded χ² histogram matches p (χ²<crit) AND the fit
  //    tightens as N grows (the L∞ deviation falls).
  {
    const p = softmax(LOGITS, 1);
    const big = histogram(p, Nsample, seed);
    const chiBig = chiSquare(big, p, Nsample);
    const small = histogram(p, 2000, seed ^ 0x55);
    const linf = (counts, M) => Math.max(...counts.map((c, i) => Math.abs(c / M - p[i])));
    const linfSmall = linf(small, 2000);
    const linfBig = linf(big, Nsample);
    const ok = chiBig < CHI2_CRIT_DOF7 && (chiBig / DOF) < 3 && linfBig < linfSmall;
    add('SAMPLER FIDELITY: seeded χ² histogram matches p (χ²<24.32, dof 7) AND the fit tightens with N (L∞ falls)',
      ok, `χ²(N=${Nsample})=${chiBig.toFixed(3)} < 24.32 · χ²/dof=${(chiBig / DOF).toFixed(3)} · L∞: ${linfSmall.toFixed(4)}(N=2k) → ${linfBig.toFixed(4)}(N=${Nsample >= 1000 ? (Nsample / 1000) + 'k' : Nsample})`);
  }

  // 4. NEGATIVE CONTROL WITH TEETH: the forgotten-denominator variant gives
  //    Σ≠1 AND its χ² (true-p draws vs the bad expectation) FAILS ≫crit — while
  //    a CORRECT softmax PASSES the same gate (the gate is non-vacuous).
  {
    const p = softmax(LOGITS, 1);
    // the bug: exp(z) with NO denominator → not a distribution (Σ = the partition
    // function Z, generally ≠ 1). We measure it AS the model's claimed expectation.
    const z = LOGITS.map(l => l / 1);
    const m = Math.max(...z);
    const bad = z.map(v => Math.exp(v - m));               // un-normalized "probabilities"
    const badSum = bad.reduce((a, b) => a + b, 0);
    // draw from the TRUE p, score against the BAD expectation → χ² must explode.
    const obs = histogram(p, Nsample, seed ^ 0xBAD);
    const chiBad = chiSquare(obs, bad, Nsample);           // bad[i]*N is a wild expectation
    const chiGood = chiSquare(obs, p, Nsample);            // same draws vs the TRUE p → passes
    const CRIT = CHI2_CRIT_DOF7;
    const ok = Math.abs(badSum - 1) > 1e-6 && chiBad > 3 * CRIT && chiGood < CRIT;
    add('NEGATIVE CONTROL: forgotten denominator → Σ≠1 (flagged) AND its χ²≫crit, while the CORRECT softmax PASSES the same gate (non-vacuous)',
      ok, `bad Σ=${badSum.toFixed(4)} (≠1) · χ²_bad=${chiBad.toExponential(2)} ≫ 3×24.32 · χ²_good=${chiGood.toFixed(2)} < 24.32`);
  }

  // 5. LAW-vs-TOY honesty pin: softmax over the frozen logits is exact and
  //    deterministic, and the greedy (T→0) target is argmax = index 0.
  {
    const a = softmax(LOGITS, 1);
    const b = softmax(LOGITS, 1);
    const am = argmax(LOGITS);
    const identical = a.every((v, i) => v === b[i]);
    const ok = identical && am === 0 && Math.abs(a.reduce((x, y) => x + y, 0) - 1) <= 1e-15;
    add('LAW-vs-TOY honesty: softmax(LOGITS,1) is exact & deterministic (×2 byte-identical); argmax=idx0 (the greedy target, strict max)',
      ok, `argmax=${am} ("${VOCAB[am]}") · p₀=${a[0].toFixed(6)} · Σ=${a.reduce((x, y) => x + y, 0).toFixed(15)} · two calls ${identical ? 'identical' : 'DRIFTED'}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}

// ── DEFERRED (a code-comment future, so the page == the proof in v1) ─────────
//  v1 renders ONE frozen distribution (LOGITS over VOCAB). Two natural next
//  benches, deliberately NOT built so the page can never drift from the proof:
//   • a BIGRAM prompt-swap — pick a context word, look its logit row up in a
//     small frozen bigram table, and re-render. (The dial proof is unchanged;
//     only the input vector moves.)
//   • FREE-TEXT input — type a prompt, hash it to a logit vector. (Same dial,
//     same five claims; the vector is just no longer frozen.)
//  Either would add a SECOND source of truth for the logits; until the parity
//  harness covers that path too, the frozen vector keeps the page honest.
