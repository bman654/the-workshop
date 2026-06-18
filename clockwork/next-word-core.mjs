// ============================================================================
//  The Next Word — the loaded die, a prediction GAME (CORE)
//  Pure, dependency-free. The IDENTICAL core is inlined into next-word.html
//  (the Node-testable twin; the falsifiability harness runs against this file
//  AND re-extracts the inlined page slice to prove byte-parity).
//
//  THE WING. Clockwork Automata's benches each PROVE one exact fact about the
//  maker. This is the wing's FIRST GAME — and it makes the Temperature Dial's
//  softmax something you PLAY against. A sentence stem appears; six candidate
//  next-tokens lie on the felt; the model's softmax is a LOADED DIE whose six
//  faces are literally sized by the probabilities. You stake a chip on the word
//  you think comes next — BLIND, the odds hidden — then the die rolls and the
//  word that lands costs −log₂ p bits of surprise. Read the die well, spend few
//  bits, and beat the GREEDY decoder (always the mode) and the UNIFORM decoder.
//
//  THE LAW. softmax / argmax / the seeded sampler / log₂ are the SAME functions
//  the Temperature Dial proves normalized (clockwork/core.mjs) — byte-identical
//  for the shared lineage. The ONLY new physics here is the SCORE:
//
//    • the model-true meter:  −log₂ p_realized  (cross-entropy on the path the
//      die actually rolled). This is the score the whole game is built on; it is
//      exact regardless of who's betting.
//    • per-decoder bits:      each racer pays −log₂ q_racer[landed] under its OWN
//      decoder, so the three totals GENUINELY diverge:
//        – GREEDY  q = one-hot on the mode, ε-floored + a fixed finite penalty so
//                  a non-mode landing pays big but never ∞.
//        – UNIFORM q = flat 1/|V| (always log₂|V| bits, the chance baseline).
//        – YOU     q = your stake-weighted bet: pile `stake` chips on the guess,
//                  1 on each rival, renormalize → −log₂(w_landed/Z). A confident
//                  RIGHT read beats greedy; a confident WRONG read pays.
//
//  THE FALSIFIABLE CRUX — five claims, each checked live with real numbers:
//   1. SCORE = CROSS-ENTROPY. The realized-bit total over the seeded deck (the
//      model-true meter) === −Σ log₂ p_realized to machine-ε; every stem Σp=1.
//   2. SHARED-SOFTMAX WARP. The die IS the temperature bench's softmax — cold
//      spikes to the argmax face (area→1), hot rounds to uniform (1/|V|), the
//      max-face area monotone ↓ in T.
//   3. NEG CONTROL WITH TEETH. A forgotten-denominator "distribution" (Σ≠1)
//      blows up both the bits AND a χ² gate, while the CORRECT softmax PASSES
//      the same gate (non-vacuous). dof = |V|−1 = 5; χ²crit = 20.515.
//   4. DETERMINISM. A fixed deck + a seeded die → the SAME realized path & total
//      bits across two runs (the game, and the proof, are reproducible).
//   5. RACE SANITY. Over the deck at T=1, a perfect-read ORACLE pays fewer bits
//      than GREEDY (always the mode), which pays fewer than UNIFORM (chance):
//      oracle < greedy < uniform. The per-decoder divergence is ENFORCED here.
//
//  THE TOY. |V|=6 candidate tokens per stem, a frozen logit vector each. The LAW
//  is exact; the vocabulary is illustrative. A real model fans 100,000+ tokens;
//  what is byte-for-byte identical between this game and GPT-scale inference is
//  the die — the softmax, the normalization, the −log₂ p surprise, the sampler.
// ============================================================================

const log2 = x => Math.log(x) / Math.LN2;   // bits — byte-identical to core.mjs

// ── SOFTMAX (the law — byte-identical to core.mjs) ───────────────────────────
export function softmax(logits, T) {
  const z = logits.map(l => l / T);
  const m = Math.max(...z);
  const ex = z.map(v => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

// ── ARGMAX (the greedy bettor's pick — byte-identical to core.mjs) ───────────
export function argmax(logits) {
  let bi = 0, bv = logits[0];
  for (let i = 1; i < logits.length; i++) if (logits[i] > bv) { bv = logits[i]; bi = i; }
  return bi;
}

// ── RNG (estate mulberry32 — byte-identical to core.mjs) ─────────────────────
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── SAMPLING (the loaded die's roll — byte-identical to core.mjs) ────────────
export function sampleIndex(p, rng) {
  const r = rng();
  let c = 0;
  for (let i = 0; i < p.length; i++) { c += p[i]; if (r < c) return i; }
  return p.length - 1;
}

// ── THE DECK (a fixed deck of stems; |V|=6 candidates each) ──────────────────
//  Each stem: a context the wing already speaks, 6 candidate next-tokens, and a
//  frozen logit vector. Logits are pinned literals so the test can string-match
//  them and a model edit cannot silently drift the page from the proof.
export const DECK = [
  { ctx: 'the cat sat on the', toks: ['mat', 'roof', 'sofa', 'floor', 'moon', 'idea'], logits: [3.1, 1.4, 2.2, 1.9, -0.6, -1.5] },
  { ctx: 'once upon a', toks: ['time', 'midnight', 'star', 'dream', 'throne', 'pixel'], logits: [3.6, 1.1, 0.4, 1.7, 0.2, -0.8] },
  { ctx: 'to be or not to', toks: ['be', 'see', 'flee', 'dream', 'know', 'die'], logits: [3.8, 0.3, -0.4, 0.9, 0.6, 1.2] },
  { ctx: 'a journey of a thousand', toks: ['miles', 'steps', 'years', 'songs', 'doors', 'lies'], logits: [2.6, 2.9, 1.1, -0.2, 0.4, -1.0] },
  { ctx: 'the early bird catches the', toks: ['worm', 'bus', 'sun', 'train', 'cold', 'dawn'], logits: [3.4, 1.0, 0.7, 1.3, 0.5, 1.6] },
  { ctx: 'i think therefore i', toks: ['am', 'was', 'dream', 'doubt', 'compute', 'wander'], logits: [3.9, 0.6, 0.8, 1.1, 0.9, 0.3] },
  { ctx: 'all that glitters is not', toks: ['gold', 'real', 'mine', 'lost', 'cheap', 'safe'], logits: [3.5, 1.2, 0.9, 0.5, 1.0, 0.7] },
  { ctx: 'the answer to everything is', toks: ['forty-two', 'love', 'time', 'nothing', 'maybe', 'tea'], logits: [2.4, 1.8, 1.5, 1.2, 1.0, 0.9] },
];
export const DECK_SEED = 0xC0FFEE;   // seeds the die-roll sequence across the whole deck

// The temperature knob shares the Temperature Dial's law; the slider is log10 T.
export const T_RANGE = { LO: 0.01, HI: 100 };   // T ∈ [0.01, 100]; log10 span [−2, 2]

// GREEDY's finite miss-penalty: a one-hot decoder would pay ∞ bits when the die
// lands off the mode. We floor q_miss so a miss costs BIG but finite — capped at
// log₂|V| + this penalty (worse than the uniform decoder, never NaN/∞).
export const GREEDY_MISS_PENALTY = 4;   // extra bits over the uniform ceiling on a non-mode landing

// ── −log₂ p : the model-true surprise (bits) on a realized word ───────────────
//  The score the whole game is built on: cross-entropy on the path the die rolled.
export function surprisalBits(p, idx) { return -log2(p[idx]); }
export function realizedBits(p, landedIdx) { return surprisalBits(p, landedIdx); }

// ── THE THREE DECODERS' bit-cost on a realized index ──────────────────────────
//  Each racer pays −log₂ q_racer[landed] under its OWN decoder distribution q.
//  The totals genuinely diverge: a sharper, better-calibrated decoder pays less.

//  YOU: stake-weighted bet. `stake` chips on the guess, 1 on each rival, renorm.
//  guessIdx == null → a blind uniform bet (a skipped stem).
export function youBits(n, guessIdx, landedIdx, stake) {
  if (guessIdx == null) return -log2(1 / n);
  const w = new Array(n).fill(1);
  w[guessIdx] += stake;
  const Z = w.reduce((a, b) => a + b, 0);
  return -log2(w[landedIdx] / Z);
}

//  GREEDY: one-hot on the mode. A mode landing pays ~0 bits (ε-floored); a miss
//  pays a BIG but FINITE penalty (log₂n + GREEDY_MISS_PENALTY), never ∞.
export function greedyBits(n, modeIdx, landedIdx) {
  if (landedIdx === modeIdx) {
    const EPS = 1e-9;                       // ε-floor so a "certain" hit isn't exactly 0/∞
    return -log2(1 - (n - 1) * EPS);        // ≈ 0+ bits
  }
  return log2(n) + GREEDY_MISS_PENALTY;     // a miss: worse than chance, finite
}

//  UNIFORM: flat 1/n every time → always exactly log₂n bits (the chance floor).
export function uniformBits(n) { return -log2(1 / n); }

// ── PLAY ONE STEM at temperature T → the three-layer truth + per-decoder bits ─
//  guessIdx may be null (skipped → a blind uniform bet). Returns everything the
//  page's three-layer reveal needs, plus the model-true meter (realizedBits).
export function playStem(stem, T, rng, guessIdx, stake = 1) {
  const p = softmax(stem.logits, T);
  const landed = sampleIndex(p, rng);
  const mode = argmax(stem.logits);
  const n = p.length;
  const H = entropyBits(p);
  return {
    p, landed, mode, n, H,
    realizedBits: realizedBits(p, landed),          // the model-true meter (cross-entropy on the path)
    youBits: youBits(n, guessIdx, landed, stake),   // per-decoder bits — these DIVERGE
    greedyBits: greedyBits(n, mode, landed),
    uniformBits: uniformBits(n),
    hit: guessIdx === landed,
    modeHit: mode === landed,
  };
}

// ── ENTROPY (the model's own surprise floor per stem) ────────────────────────
export function entropyBits(p) {
  let H = 0;
  for (const pi of p) if (pi > 0) H -= pi * log2(pi);
  return H;
}
export function maxEntropyBits(n) { return n > 0 ? log2(n) : 0; }

// ── PLAY THE WHOLE DECK at a fixed T with a seeded die → the realized path ────
//  Deterministic: a fixed deck + one rng closure seeded once → the same realized
//  index sequence every run. `totalBits` is the MODEL-TRUE meter total (which
//  MUST equal −Σ log₂ p_realized, the score the self-test pins).
export function playDeck(T, seed = DECK_SEED) {
  const rng = makeRng(seed);
  const path = [];
  let totalBits = 0;
  for (let s = 0; s < DECK.length; s++) {
    const p = softmax(DECK[s].logits, T);
    const landed = sampleIndex(p, rng);
    const bits = realizedBits(p, landed);
    totalBits += bits;
    path.push({ stem: s, landed, p: p[landed], bits, greedyGuess: argmax(DECK[s].logits) });
  }
  return { path, totalBits };
}

// ── NEG CONTROL: the forgotten-denominator "distribution" (Σ ≠ 1) ────────────
//  exp(z) with NO denominator is not a probability distribution. Scoring the
//  realized path against it gives a bits total that DIVERGES from cross-entropy,
//  and a χ² gate (realized-histogram vs the bad expectation) BLOWS UP — while
//  the correct softmax PASSES the same gate. The normalization is load-bearing.
export function badDist(logits, T) {
  const z = logits.map(l => l / T);
  const m = Math.max(...z);
  return z.map(v => Math.exp(v - m));   // un-normalized; Σ = Z ≠ 1 in general
}
export function histogramOver(p, N, seed) {
  const rng = makeRng(seed);
  const counts = new Array(p.length).fill(0);
  for (let k = 0; k < N; k++) counts[sampleIndex(p, rng)]++;
  return counts;
}
export function chiSquare(observed, expectedDist, N) {
  let chi = 0;
  for (let i = 0; i < expectedDist.length; i++) {
    const e = expectedDist[i] * N;
    if (e > 0) chi += (observed[i] - e) * (observed[i] - e) / e;
  }
  return chi;
}

// ── THE SELF-TEST (shared verbatim with the page) ────────────────────────────
//  Returns {pass,total,lines:[{name,ok,detail}]}. Every detail prints LIVE
//  numbers so a reader can audit each claim from its row.
export function runSelfTest({ Nsample = 30000, seed = DECK_SEED } = {}) {
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok, detail });
  const DOF = DECK[0].toks.length - 1;          // = 5 (six candidates)
  const CHI2_CRIT_DOF5 = 20.515;                 // χ²(dof=5, α=0.001), Pearson tables

  // 1. SCORE IS EXACT CROSS-ENTROPY: total realized bits === −Σ log₂ p_realized.
  {
    const T = 1;
    const { path, totalBits } = playDeck(T, seed);
    let manual = 0;
    for (const r of path) manual += -log2(r.p);   // recompute from the landed p's
    const err = Math.abs(totalBits - manual);
    // also: every stem's softmax is a distribution (Σp=1 to ~1e-15).
    let maxSumErr = 0;
    for (const d of DECK) { const p = softmax(d.logits, T); maxSumErr = Math.max(maxSumErr, Math.abs(p.reduce((a, b) => a + b, 0) - 1)); }
    const ok = err <= 1e-12 && maxSumErr <= 1e-12 && path.length === DECK.length;
    add('SCORE = CROSS-ENTROPY: total realized bits === −Σ log₂ p_realized over the seeded deck (to machine-ε); every stem Σp=1',
      ok, `|total−Σ(−log₂p)|=${err.toExponential(2)} · total=${totalBits.toFixed(6)} bits over ${path.length} stems · max|Σp−1|=${maxSumErr.toExponential(2)}`);
  }

  // 2. SHARED-SOFTMAX TEMPERATURE WARP: the same softmax the Temperature bench
  //    uses. Cold (T→0) spikes to the argmax face (area→1); hot (T→∞) rounds to
  //    uniform (every face → 1/|V|). Monotone: the max face area falls as T rises.
  {
    const d = DECK[2];                            // a strict-max stem ("...not to be")
    const am = argmax(d.logits);
    const pCold = softmax(d.logits, 1e-3);
    const pHot = softmax(d.logits, 1e3);
    const n = d.toks.length;
    let prevMax = Infinity, monoOk = true;
    for (let i = 0; i <= 40; i++) {
      const T = Math.pow(10, -2 + i * (4 / 40));  // T∈[0.01,100]
      const mx = Math.max(...softmax(d.logits, T));
      if (mx > prevMax + 1e-12) monoOk = false;
      prevMax = mx;
    }
    const coldSpikes = pCold[am] > 0.999;
    const hotFlat = Math.max(...pHot.map(x => Math.abs(x - 1 / n))) < 1e-3;
    const ok = coldSpikes && hotFlat && monoOk;
    add('SHARED SOFTMAX WARP: the die is the temperature bench’s softmax — cold spikes to the argmax face (area→1), hot rounds to uniform (1/|V|), max-face area monotone ↓ in T',
      ok, `T→0: p[argmax]=${pCold[am].toFixed(5)}→1 · T→∞: max|p−1/${n}|=${Math.max(...pHot.map(x => Math.abs(x - 1 / n))).toExponential(2)} · max-face monotone ${monoOk ? 'OK' : 'VIOLATED'}`);
  }

  // 3. NEG CONTROL WITH TEETH: the forgotten-denominator dist (Σ≠1) blows up
  //    both the bits and the χ² gate, while the CORRECT softmax PASSES the gate.
  {
    const d = DECK[0];
    const T = 1;
    const p = softmax(d.logits, T);
    const bad = badDist(d.logits, T);
    const badSum = bad.reduce((a, b) => a + b, 0);
    // bits divergence: cross-entropy against bad ≠ against true p.
    const obs = histogramOver(p, Nsample, seed ^ 0xBAD);
    const chiGood = chiSquare(obs, p, Nsample);          // true p → passes
    const chiBad = chiSquare(obs, bad, Nsample);         // un-normalized → explodes
    // the realized-bits total scored against bad diverges from cross-entropy.
    let biasBits = 0, trueBits = 0;
    const rng = makeRng(seed);
    for (let s = 0; s < DECK.length; s++) {
      const ps = softmax(DECK[s].logits, T);
      const bd = badDist(DECK[s].logits, T);
      const li = sampleIndex(ps, rng);
      trueBits += -log2(ps[li]);
      biasBits += -log2(bd[li]);                          // wrong "p" → wrong bits
    }
    const bitsDiverge = Math.abs(biasBits - trueBits) > 1;
    const ok = Math.abs(badSum - 1) > 1e-6 && chiBad > 3 * CHI2_CRIT_DOF5 && chiGood < CHI2_CRIT_DOF5 && bitsDiverge;
    add('NEG CONTROL: forgotten denominator → Σ≠1 (flagged), its χ²≫crit AND its bits diverge from cross-entropy, while the CORRECT softmax PASSES the same gate (non-vacuous)',
      ok, `bad Σ=${badSum.toFixed(3)} (≠1) · χ²_bad=${chiBad.toExponential(2)} ≫ 3×${CHI2_CRIT_DOF5} · χ²_good=${chiGood.toFixed(2)} < ${CHI2_CRIT_DOF5} · |bits_bad−bits_true|=${Math.abs(biasBits - trueBits).toFixed(2)}>1`);
  }

  // 4. DETERMINISM: a fixed deck + seeded RNG → the SAME realized path twice
  //    (so the proof, and the game, are reproducible).
  {
    const a = playDeck(1, seed), b = playDeck(1, seed);
    const samePath = a.path.length === b.path.length && a.path.every((r, i) => r.landed === b.path[i].landed && r.p === b.path[i].p);
    const sameBits = a.totalBits === b.totalBits;
    const ok = samePath && sameBits;
    add('DETERMINISM: fixed deck + seeded die → byte-identical realized path & total bits across two runs (reproducible)',
      ok, `paths ${samePath ? 'identical' : 'DRIFTED'} · totals ${sameBits ? 'equal' : 'differ'} (${a.totalBits.toFixed(6)} vs ${b.totalBits.toFixed(6)})`);
  }

  // 5. RACE SANITY: the three decoders' EXPECTED per-roll bits (cross-entropy of
  //    the model's true die against each decoder's q) DIVERGE in the right order
  //    — a CALIBRATED reader (q = the true p, the oracle the game rewards) pays
  //    the least (its expected bits = the entropy floor H, by Gibbs' inequality);
  //    GREEDY (one-hot on the mode, finite miss-penalty) pays more; UNIFORM (flat
  //    chance) pays the most over this deck. This is a property of the DECODERS,
  //    not of one lucky path — so it ENFORCES the divergence seed-independently.
  {
    const T = 1;
    let calibrated = 0, greedy = 0, uniform = 0;
    for (let s = 0; s < DECK.length; s++) {
      const stem = DECK[s];
      const p = softmax(stem.logits, T);
      const n = p.length;
      const mode = argmax(stem.logits);
      for (let i = 0; i < n; i++) {               // average each decoder's cost over the TRUE die
        calibrated += p[i] * surprisalBits(p, i); // = entropy H — the calibrated floor (Gibbs)
        greedy += p[i] * greedyBits(n, mode, i);  // one-hot decoder, finite miss-penalty
        uniform += p[i] * uniformBits(n);         // flat chance
      }
    }
    const ok = calibrated < greedy && greedy < uniform;
    add('RACE SANITY: expected per-decoder bits diverge in order — calibrated reader (= entropy floor, Gibbs) < greedy (always the mode) < uniform (chance) over the deck',
      ok, `calibrated=${calibrated.toFixed(2)} < greedy=${greedy.toFixed(2)} < uniform=${uniform.toFixed(2)} bits (expected over the true die)`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
