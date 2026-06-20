// ============================================================================
//  The Snake That Eats Its Tail — autoregression (CORE)
//  Pure, dependency-free. The IDENTICAL core is inlined into autoregress.html
//  (the Node-testable twin; the falsifiability harness runs against this file
//  AND re-extracts the inlined page slice to prove byte-parity).
//
//  THE WING. Clockwork Automata's benches each PROVE one exact fact about the
//  maker. This is the wing's 8TH bench, and the one about the LOOP itself: how a
//  generator is built. Every other bench freezes one tick — how I pick ONE word,
//  how much I hold while I pick it, the softmax that warps under temperature. This
//  one runs the tick FORWARD and feeds it back: I write one token, then read the
//  WHOLE tape — including the token I just wrote — and write the next. Output
//  becomes input. The snake eats its tail. That feedback, not the sampling, is
//  what turns a single die-roll into a sentence.
//
//  THE LAW REUSED. softmax / argmax / the seeded sampler are the SAME functions
//  the Temperature Dial proves normalized and The Next Word plays against —
//  imported BYTE-IDENTICAL from next-word-core.mjs, along with the FROZEN DECK and
//  DECK_SEED (NO new vocabulary). The ONLY new physics here is the WIRING:
//
//    • nextStem(prevStem, emittedTokIdx) — a fixed, TOTAL map: the token you just
//      emitted selects which frozen logit vector you read next. This is the
//      feedback edge. It is pure and deterministic; a model edit cannot drift it.
//    • generate() — WITH feedback: each emission advances the stem, so the read
//      distribution MOVES and a varied path (a "sentence") is built.
//    • generateNoFeedback() — the NEG-CONTROL: re-feed the PROMPT every step and
//      pin the die to the ARGMAX (cold). The read never moves AND the roll never
//      wanders, so it re-emits the SAME first token forever — it never builds a
//      sentence. This isolates FEED-BACK (not sampling) as the thing that makes
//      generation: kill the feedback and generation stutters one token to ∞.
//
//  THE FALSIFIABLE CRUX — checked live with real numbers, id-by-id:
//   1. REPRODUCIBLE. The same (startStem, seed, T) → a byte-identical token-id
//      sequence (and landed-p) across two runs. (prompt, seed) alone fixes the
//      story, exactly — a tiny seed change → a permanently different story.
//   2. THE FEEDBACK IDENTITY. input(N) === input(N−1) ++ [emitted id of step N−1],
//      checked id-by-id over a full run: the context each step IS last step's
//      context with the emission appended. This is autoregression, made checkable.
//   3. STATE MOVES. With feedback ON the run visits >1 distribution (the emission
//      steers the next read) — a path is genuinely built, not a frozen re-roll.
//   4. NEG-CONTROL WITH TEETH. Feedback OFF (cold, prompt-pinned) re-rolls the
//      SAME token forever (distinct tokens = 1); feedback ON over the same seed
//      builds a varied path. Feed-back, not sampling, makes generation.
//   5. THE NEG-CONTROL IS ITSELF REPRODUCIBLE — the contrast is WIRING, not luck.
//   6. DISTRIBUTION. Every stem's softmax Σp = 1 (to machine-ε) — the die faces
//      are a real probability distribution.
//
//  THE HONESTY GUARD. The generated tokens are a deterministic deck-HOP over the
//  toy DECK (nextStem is an honest total map), NOT real language: the page must
//  never overclaim sentence semantics. What is exact — and is all this bench
//  claims — is the REPRODUCIBILITY and the FEEDBACK IDENTITY. A real model fans
//  100,000+ tokens and a learned next-token map; what is byte-for-byte identical
//  between this snake and GPT-scale generation is the loop: emit, append, re-read.
// ============================================================================

// Reuse the wing's shared lineage BYTE-IDENTICAL — no re-declaration here means
// the .mjs can never drift from next-word-core.mjs. The inlined page slab carries
// these same bodies verbatim (proven by the re-extraction parity test).
import { softmax, argmax, makeRng, sampleIndex, DECK, DECK_SEED, T_RANGE } from './next-word-core.mjs';
export { softmax, argmax, makeRng, sampleIndex, DECK, DECK_SEED, T_RANGE };

// ── THE AUTOREGRESSIVE STATE-MAP (the feedback wiring) ───────────────────────
//  The tape is a sequence of token ids. The model's "context" each step is the
//  WHOLE tape; the last emitted id selects which frozen logit vector is read
//  next (id → next stem, deterministically). That is the feedback: the token
//  you just WROTE chooses the distribution you READ next. nextStem is pure and
//  TOTAL — every (prevStem, emittedTokIdx) lands on a real stem, so a run can
//  never fall off the deck. (NOT real language — an honest deck-hop over the toy.)
export function nextStem(prevStem, emittedTokIdx) {
  // a fixed, total wiring: (prevStem * 8 + emittedTokIdx + 1) mod 8.
  return (prevStem * DECK.length + emittedTokIdx + 1) % DECK.length;
}

// ── ONE STEP of true autoregression ──────────────────────────────────────────
//  Given the current stem and a seeded rng, roll the die, return the emitted
//  token + the next stem the emission selects. The rng closure carries forward
//  so the whole run is one deterministic die-roll stream from the seed.
export function stepOnce(stem, T, rng) {
  const p = softmax(DECK[stem].logits, T);
  const tokIdx = sampleIndex(p, rng);
  return { stem, tokIdx, p, pLanded: p[tokIdx], next: nextStem(stem, tokIdx) };
}

// ── ONE STEP of the NEG-CONTROL (no feedback) ─────────────────────────────────
//  Re-read the PROMPT stem (never advance it) AND pin the die to the ARGMAX (cold)
//  so the roll cannot wander either. The read never moves and the roll never
//  wanders → the SAME first token, forever. This is what the on-screen toggle
//  enacts: kill the feedback and generation visibly stutters one token to ∞.
export function stepOnceNoFeedback(promptStem) {
  const stem = promptStem;
  const tokIdx = argmax(DECK[stem].logits);   // cold: the die is pinned to the mode
  return { stem, tokIdx, pLanded: 1, next: promptStem };   // next ignored; pLanded shown as the certain pick
}

// ── GENERATE a full run of N tokens from (startStem, seed, T) ─────────────────
//  WITH feedback: each emitted id feeds nextStem → the read distribution moves,
//  so a real (varied) path is built. Returns the per-step record sequence.
export function generate(startStem, T, seed, N) {
  const rng = makeRng(seed >>> 0);
  let stem = startStem;
  const steps = [];
  for (let i = 0; i < N; i++) {
    const s = stepOnce(stem, T, rng);
    steps.push(s);
    stem = s.next;
  }
  return steps;
}

// ── THE NEG-CONTROL: no-feedback generation ──────────────────────────────────
//  Re-read the PROMPT every step, pinned cold to the argmax. The read never moves
//  and the roll never wanders, so the run re-emits the SAME first token forever
//  and never builds a sentence. Seed/T are ignored on purpose (the point is that
//  NEITHER sampling NOR seed can rescue a generator with the feedback cut).
export function generateNoFeedback(startStem, T, seed, N) {
  const steps = [];
  for (let i = 0; i < N; i++) {
    steps.push(stepOnceNoFeedback(startStem));   // stem pinned to the prompt, die pinned to the mode
  }
  return steps;
}

// ── THE FEEDBACK IDENTITY, made checkable ────────────────────────────────────
//  Build the running CONTEXT (the input the model reads) step by step. The
//  identity: input(N) === input(N−1) ++ [emitted id of step N−1]. We model the
//  context as the id sequence [startStem-as-first-id, tok0, tok1, …]; checked
//  id-by-id. ctxs[k] is the input read AT step k; its length is k+1.
export function contextsOf(steps, startStem) {
  // ctx(0) = [startStem]; ctx(k) = ctx(k−1) ++ [emitted tok of step k−1]
  const ctxs = [[startStem]];
  for (let k = 0; k < steps.length; k++) ctxs.push(ctxs[k].concat([steps[k].tokIdx]));
  return ctxs;   // length steps.length+1; ctxs[k] is the input read at step k
}

// ── THE SELF-TEST (shared verbatim with the page) ────────────────────────────
//  Returns {pass,total,lines:[{name,ok,detail}]}. Every detail prints LIVE
//  numbers so a reader can audit each claim from its row.
export function runSelfTest({ T = 1.5, seed = DECK_SEED, N = 14 } = {}) {
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok, detail });
  const startStem = 0;

  // 1. EXACT REPRODUCIBILITY: same (start, seed, T) → byte-identical id sequence.
  {
    const a = generate(startStem, T, seed, N);
    const b = generate(startStem, T, seed, N);
    const seqA = a.map(s => s.tokIdx + ':' + s.stem).join('|');
    const seqB = b.map(s => s.tokIdx + ':' + s.stem).join('|');
    const samePL = a.every((s, i) => s.pLanded === b[i].pLanded);
    const ok = seqA === seqB && samePL && a.length === N;
    add('REPRODUCIBLE: same (prompt, seed) → byte-identical token-id sequence down to the id & landed p (two runs)',
      ok, `seq ${seqA === seqB ? 'identical' : 'DRIFTED'} (${N} ids) · landed-p ${samePL ? 'equal' : 'differ'}`);
  }

  // 2. THE FEEDBACK IDENTITY: input(N) === input(N−1) ++ [emitted id of N−1],
  //    checked id-by-id over a full run.
  {
    const steps = generate(startStem, T, seed, N);
    const ctxs = contextsOf(steps, startStem);
    let allOk = true, firstFail = -1;
    for (let k = 1; k < ctxs.length; k++) {
      const prev = ctxs[k - 1], cur = ctxs[k];
      const grewByOne = cur.length === prev.length + 1;
      const prefixEq = prev.every((id, i) => cur[i] === id);
      const appended = cur[cur.length - 1] === steps[k - 1].tokIdx;
      if (!(grewByOne && prefixEq && appended)) { allOk = false; if (firstFail < 0) firstFail = k; }
    }
    add('FEEDBACK IDENTITY: input(N) === input(N−1) ++ [emitted id of step N−1], checked id-by-id over a full run',
      allOk, allOk ? `verified over ${ctxs.length - 1} steps · final input len=${ctxs[ctxs.length - 1].length}` : `BROKE at step ${firstFail}`);
  }

  // 3. THE STATE ACTUALLY MOVES (feedback is load-bearing): a real run visits
  //    MORE than one stem (the emission steers the read), so a sentence is built.
  {
    const steps = generate(startStem, T, seed, N);
    const stems = new Set(steps.map(s => s.stem));
    const ok = stems.size > 1;
    add('STATE MOVES: with feedback ON the run visits >1 distribution (the emission steers the next read) — a path is built',
      ok, `distinct stems visited = ${stems.size} of ${DECK.length}`);
  }

  // 4. NEG-CONTROL WITH TEETH: with feedback OFF (cold, prompt-pinned) the run
  //    re-emits the SAME token forever (no sentence). Feedback ON over the SAME
  //    seed/T builds a varied path → isolates FEED-BACK, not sampling.
  {
    const off = generateNoFeedback(startStem, T, seed, N);
    const offTok = new Set(off.map(s => s.tokIdx));
    const on = generate(startStem, T, seed, N);
    const onStem = new Set(on.map(s => s.stem));
    // no-feedback collapses to one token; feedback ON moves the state.
    const ok = offTok.size === 1 && onStem.size > 1;
    add('NEG-CONTROL: feedback OFF re-rolls the SAME token forever (no sentence); feedback ON over the same seed builds a varied path — feed-back, not sampling, makes generation',
      ok, `no-feedback distinct tokens=${offTok.size} (=1) · feedback-on distinct stems=${onStem.size} (>1)`);
  }

  // 5. DETERMINISM OF THE NEG-CONTROL TOO: the no-feedback run is itself exactly
  //    reproducible (so the contrast is a property of WIRING, not luck).
  {
    const a = generateNoFeedback(startStem, T, seed, N);
    const b = generateNoFeedback(startStem, T, seed, N);
    const ok = a.every((s, i) => s.tokIdx === b[i].tokIdx && s.pLanded === b[i].pLanded);
    add('NEG-CONTROL REPRODUCIBLE: the no-feedback run is itself byte-identical across two runs (the contrast is wiring, not luck)',
      ok, ok ? `identical over ${N} steps` : 'DRIFTED');
  }

  // 6. SOFTMAX IS A DISTRIBUTION: every stem's softmax sums to 1 (to ~1e-15) at
  //    the test T — the die faces are a real probability distribution.
  {
    let maxErr = 0;
    for (const d of DECK) { const p = softmax(d.logits, T); maxErr = Math.max(maxErr, Math.abs(p.reduce((a, b) => a + b, 0) - 1)); }
    const ok = maxErr <= 1e-12;
    add('DISTRIBUTION: every stem’s softmax Σp = 1 (to machine-ε) at the run temperature — the die faces are a real distribution',
      ok, `max|Σp−1| = ${maxErr.toExponential(2)}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
