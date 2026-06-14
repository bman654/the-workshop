// ============================================================================
//  The Context Window — a ring buffer K tokens wide (CORE)
//  Pure, dependency-free. Identical code is inlined into context.html; this file
//  is the Node-testable twin (the falsifiability harness runs against it, and
//  re-extracts the inlined slice to prove byte-parity).
//
//  THE WING: Clockwork Automata — the estate's pieces about its own MAKER. This
//  is the wing's SECOND bench (the first, The Temperature Dial, is how I PICK a
//  word; this is how much I can HOLD while I pick). Same register: not "what it
//  feels like" in prose, but the ONE exact mechanism — and a falsifiable proof.
//
//  THE WALL. A language model does not have a memory. It has a CONTEXT WINDOW: a
//  fixed-width strip of the most-recent tokens. As each new token enters, the
//  oldest token scrolls off the far edge and is GONE — not archived, not paged
//  out, gone. The window is exactly the last K tokens seen, in order, no more.
//
//  THE ONE DIRECTION CONVENTION (load-bearing; everything below obeys it):
//
//        oldest ─────────────────────────────────────────────► newest
//        LEFT                                                   RIGHT
//        window[0] = oldest = leftmost          window[last] = newest = rightmost
//        eviction happens off the LEFT edge     entry happens at the RIGHT edge
//
//  So `windowEntries(buf)` is ordered oldest→newest; index 0 is the token nearest
//  the wall (the next to fall); the newest token sits at the right.
//
//  THE FOUR EVICTION INVARIANTS — the falsifiable crux, checked DIRECTLY (not via
//  either implementation) and against a naive keep-everything reference after
//  EVERY push, over a long randomized op stream with K swept:
//   1. windowLength == min(totalSeen, K).                    (the wall is K wide)
//   2. the window == the LAST K seen, in order               (byte-for-byte ===
//      naiveHistory.slice(−K)).                               the naive reference)
//   3. CONSERVATION: totalSeen == evicted + inWindow.        (nothing vanishes
//      twice, nothing is double-counted)                     (the picture is the
//                                                             proof on the page)
//   4. an evicted token, queried, returns 'forgotten' — and  (forgetting is
//      growing K does NOT recall it.                          irreversible)
//
//  THE FALSIFIABLE CLAIM. An O(1) ring buffer agrees with the naive last-K
//  reference byte-for-byte over thousands of randomized push+resize ops, K swept
//  1..N. A deliberately broken off-by-one buffer is CAUGHT failing the very same
//  checks (so the gate is non-vacuous — it does not trivially always-pass).
//
//  THE TOY. K ≤ ~12 and a 16-word vocabulary is illustrative — a real window is
//  hundreds of thousands of tokens wide. What is byte-for-byte identical between
//  this bench and that is the WALL: a fixed width, oldest-first eviction, and the
//  hard, exact, irreversible fact that what scrolls past is gone.
//  (KMAX and any display cap live in the PAGE, never here.)
// ============================================================================

// ── THE VOCABULARY ──────────────────────────────────────────────────────────
//  Its OWN word-list (longer than the Dial's 8, so each cell carries a distinct
//  legible token at K=12). 16 words → at most 12 in the window, so a fresh draw
//  can always differ from its neighbour. The test pins this literal and the
//  parity harness string-matches it, so an edit cannot silently drift the page.
export const VOCAB = [
  'the', 'cat', 'sat', 'on', 'a', 'mat', 'and', 'then',
  'ran', 'far', 'past', 'every', 'wall', 'into', 'dark', 'gone',
];   // |V| = 16

// ── RNG (estate mulberry32) ─────────────────────────────────────────────────
//  Byte-identical to core.mjs / convex-hull/core.mjs. Numeric seed; returns a
//  FRESH closure per call.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── THE RING BUFFER (O(1) push & query) ─────────────────────────────────────
//  A fixed array of size K + head/tail/count. `totalSeen` is a monotonic counter
//  of every token ever pushed; `evictedCount` of every token ever evicted (by
//  overflow OR by shrink). Each stored entry is {seq, word}: `seq` is the value
//  of totalSeen at the moment that token entered (0-based, monotonic) — it is
//  the token's permanent identity, the key the recall probe queries on, and what
//  makes a stable diff key for the page's slot render.
//
//  LAYOUT: `tail` is the index of the OLDEST entry (the eviction edge); `head` is
//  where the NEXT push will write. Both advance modulo K. count ∈ [0, K].
export function makeBuffer(K) {
  return { K, slots: new Array(K), head: 0, tail: 0, count: 0, totalSeen: 0, evictedCount: 0 };
}

// push(buf, token) → { evicted: entry|null }
//  Append `token` at the right (head). If the buffer is full, this OVERWRITES the
//  oldest entry (advancing tail), increments evictedCount, and returns it as the
//  evicted entry. O(1) — no shifting, no copy.
export function push(buf, token) {
  const entry = { seq: buf.totalSeen, word: token };
  buf.totalSeen++;
  let evicted = null;
  if (buf.count === buf.K) {
    evicted = buf.slots[buf.tail];
    buf.slots[buf.head] = entry;
    buf.head = (buf.head + 1) % buf.K;
    buf.tail = (buf.tail + 1) % buf.K;   // the oldest scrolls off the LEFT edge
    buf.evictedCount++;
  } else {
    buf.slots[buf.head] = entry;
    buf.head = (buf.head + 1) % buf.K;
    buf.count++;
  }
  return { evicted };
}

// resize(buf, newK) → entry[]  — THE CRUX, identical semantics for slider & render.
//  SHRINK (newK < count): evict the (count − newK) OLDEST entries off the left,
//    increment evictedCount by that many, return them oldest→newest. The window
//    becomes the most-recent newK.
//  GROW (newK ≥ count): the wall just moves out. Return [] and NEVER decrement
//    evictedCount, NEVER recall a past token. The lost do not return.
export function resize(buf, newK) {
  newK = Math.max(1, Math.floor(newK));
  if (newK === buf.K) return [];
  const ordered = windowEntries(buf);            // oldest → newest, length = count
  const evicted = [];
  if (newK < ordered.length) {
    const drop = ordered.length - newK;
    for (let i = 0; i < drop; i++) { evicted.push(ordered[i]); buf.evictedCount++; }
  }
  // rebuild a compact ring of size newK holding the surviving most-recent newK.
  const keep = ordered.slice(ordered.length - Math.min(newK, ordered.length));
  buf.K = newK;
  buf.slots = new Array(newK);
  for (let i = 0; i < keep.length; i++) buf.slots[i] = keep[i];
  buf.head = keep.length % newK;
  buf.tail = 0;
  buf.count = keep.length;
  return evicted;
}

// windowEntries(buf) → ordered {seq,word}[]  (oldest → newest)
//  Length = count = min(totalSeen, K). slots[tail] is the oldest; walk forward.
export function windowEntries(buf) {
  const out = [];
  for (let i = 0; i < buf.count; i++) out.push(buf.slots[(buf.tail + i) % buf.K]);
  return out;
}

// query(buf, seq) → a verdict keyed on the token's permanent seq.
//   { status:'in-window', position }   position 0 = oldest (against the wall)
//   { status:'forgotten', evictedAgo } evictedAgo = pushes since it fell (exact)
//   { status:'unseen' }                seq was never pushed (past the horizon)
//  evictedAgo is exact: a token with identity `seq` that has left the window was
//  the (seq)-th token in; the window now holds seqs [totalSeen−count, totalSeen).
//  It fell when push #(seq + K_at_that_time) arrived — but K may have changed, so
//  we count it the robust way: it is forgotten iff seq < oldestSeq, and the number
//  of pushes since it was the oldest survivor is (oldestSeq − seq) at minimum; we
//  report the pushes-since-eviction as (totalSeen − count − seq) which is exactly
//  how many newer tokens have entered since it stopped being in the window.
export function query(buf, seq) {
  const win = windowEntries(buf);
  for (let i = 0; i < win.length; i++) if (win[i].seq === seq) return { status: 'in-window', position: i };
  if (seq < 0 || seq >= buf.totalSeen) return { status: 'unseen' };
  // seen, but not in the window → forgotten. The window holds the last `count`
  // seqs: [totalSeen−count, totalSeen). evictedAgo = how many tokens entered AFTER
  // this one stopped being the oldest survivor = (oldestSeq − seq), where
  // oldestSeq = totalSeen − count.
  const oldestSeq = buf.totalSeen - buf.count;
  return { status: 'forgotten', evictedAgo: oldestSeq - seq };
}

// ── live counters (read straight off the buffer) ────────────────────────────
export function totalSeen(buf) { return buf.totalSeen; }
export function evictedCount(buf) { return buf.evictedCount; }
export function windowLength(buf) { return buf.count; }

// ── THE OFF-BY-ONE BUFFER (the negative control — live-instantiable) ─────────
//  Same surface as makeBuffer/push/etc, with ONE classic fence-post bug: it holds
//  ONE TOO MANY entries. The caller asks for capacity `reqK`, but the ring is
//  sized reqK+1 and only evicts when count would reach reqK+1 (the `<= K` vs `< K`
//  off-by-one). The effect is PERSISTENT, not transient: the window forever holds
//  reqK+1 tokens, its OLDEST is one token too old — a token the correct buffer
//  already evicted — so windowLength ≠ min(totalSeen, reqK), the window is NOT the
//  last reqK, conservation breaks (it under-evicts by one), and the recall probe
//  LIES "in-window" about that truly-evicted token. `K` holds the REAL ring size
//  (reqK+1) so the shared windowEntries() works unchanged; `reqK` is the capacity
//  the caller asked for (what the invariant checks compare against). The broken
//  tail makes the model claim to remember what it lost.
export function makeBrokenBuffer(reqK) {
  const cap = reqK + 1;
  return { K: cap, reqK, slots: new Array(cap), head: 0, tail: 0, count: 0, totalSeen: 0, evictedCount: 0, __broken: true };
}

// push for the broken buffer: it physically RETAINS reqK+1 entries (the window is
// one too wide, its oldest a token the correct buffer already dropped), but its
// evictedCount counts the would-be eviction the moment count passes reqK — so the
// bookkeeping desyncs from what it kept. Net: windowLength is wrong (reqK+1, not
// reqK), the window is NOT the last reqK, AND conservation breaks by exactly one
// (evictedCount + windowLength == totalSeen + 1). One bug, three caught failures.
export function brokenPush(buf, token) {
  const entry = { seq: buf.totalSeen, word: token };
  buf.totalSeen++;
  let evicted = null;
  if (buf.count === buf.K) {                 // buf.K is reqK+1 — the fence-post bug
    evicted = buf.slots[buf.tail];
    buf.slots[buf.head] = entry;
    buf.head = (buf.head + 1) % buf.K;
    buf.tail = (buf.tail + 1) % buf.K;
    buf.evictedCount++;
  } else {
    buf.slots[buf.head] = entry;
    buf.head = (buf.head + 1) % buf.K;
    buf.count++;
    if (buf.count > buf.reqK) buf.evictedCount++;   // counts an eviction it didn't do
  }
  return { evicted };
}

// ── THE NAIVE REFERENCE (standalone, source-disjoint) ───────────────────────
//  history.slice(−K): the obvious, keep-everything way. The page keeps its OWN
//  naiveHistory and recomputes slice(−K) with NO shared helper (the Convex-Hull /
//  Extent anti-circularity precedent — the two code paths stay disjoint so a
//  grep-for-shared-helper check passes even with instrument code present). This
//  reference is what the ring is proven byte-for-byte equal to.
export function naiveWindow(history, K) {
  return history.slice(Math.max(0, history.length - K));
}

// ── THE SELF-TEST (shared verbatim with the page) ───────────────────────────
//  Returns {pass, total, lines:[{name, ok, detail}]}. Every detail prints LIVE
//  numbers (the Collatz convention — a reader can audit the claim from the row).
//  The FOUR invariants are checked DIRECTLY and against the naive reference after
//  EVERY push, over a long randomized op stream with K swept; then the O(1) ring
//  is proven byte-for-byte === the naive last-K reference; then the off-by-one
//  control is CAUGHT failing the identical checks (the teeth).
export function runSelfTest({ ops = 4000, Kmax = 12, seed = 0xC0FFEE } = {}) {
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok, detail });
  const rng = makeRng(seed);
  const draw = () => VOCAB[Math.floor(rng() * VOCAB.length)];

  // 1. INVARIANT 1 — windowLength == min(totalSeen, K), checked in the CLEAN
  //    push-only regime (no resize), for EVERY fixed K = 1..Kmax. (This is the
  //    headline identity; once a shrink over-evicts, the honest statement becomes
  //    windowLength == min(retained, K) — exercised under invariant 2/3 below.)
  {
    let v1 = 0, checks = 0;
    for (let Kf = 1; Kf <= Kmax; Kf++) {
      const b = makeBuffer(Kf);
      for (let t = 0; t < 3 * Kmax; t++) {
        push(b, draw());
        if (windowLength(b) !== Math.min(b.totalSeen, Kf)) v1++;
        checks++;
      }
    }
    add('INVARIANT 1 — windowLength == min(totalSeen, K) after every push, every K=1..' + Kmax,
      v1 === 0, `${v1} violations over ${checks} pushes (each K filled past capacity)`);
  }

  // 2+3. INVARIANTS 2 & 3 — after EVERY push over a RANDOMIZED push+resize stream
  //    (K swept), vs a source-disjoint naive reference + independently-tracked
  //    counts. A shrink irreversibly evicts, so the oracle keeps SURVIVORS (not
  //    the full log — slice(-K) of the full log would wrongly "recall" a dropped
  //    token). This is where shrink/grow churn is proven exact.
  {
    let K = 1 + Math.floor(rng() * Kmax);
    let buf = makeBuffer(K);
    // THE NAIVE REFERENCE — a plain array of the CURRENTLY-RETAINED tokens, kept
    // by the obvious keep-the-last-K rule, fully source-disjoint from ring math:
    //   push  → append, then drop from the FRONT while length > K (the eviction);
    //   shrink→ splice the front so the survivors are the last newK.
    let survivors = [];                 // the naive window, as a plain array
    let naiveSeen = 0, naiveEvicted = 0;
    let v2 = 0, v3 = 0, checks = 0;
    for (let t = 0; t < ops; t++) {
      // occasionally resize (sweep K across 1..Kmax) — exercises shrink & grow.
      if (t > 0 && rng() < 0.08) {
        const newK = 1 + Math.floor(rng() * Kmax);
        resize(buf, newK);
        while (survivors.length > newK) { survivors.shift(); naiveEvicted++; }  // shrink the naive window too
        K = newK;
      }
      const tok = draw();
      push(buf, tok);
      survivors.push(tok); naiveSeen++;
      while (survivors.length > buf.K) { survivors.shift(); naiveEvicted++; }    // naive eviction off the front
      const win = windowEntries(buf);
      const naive = naiveWindow(survivors, buf.K);   // === survivors here (length ≤ K)
      // (2) window === the surviving last K seen, in order (word-for-word)
      if (win.length !== naive.length || win.some((e, i) => e.word !== naive[i])) v2++;
      // (3) conservation: totalSeen == evicted + inWindow — and the ring's counts
      //     match the independently-tracked naive counts.
      if (buf.totalSeen !== buf.evictedCount + win.length ||
          buf.totalSeen !== naiveSeen || buf.evictedCount !== naiveEvicted) v3++;
      checks++;
    }
    add('INVARIANT 2 — window == the last K seen, in order (=== naive survivors slice(−K), word-for-word) over ' + checks + ' push+resize ops',
      v2 === 0, `${v2} mismatches vs the source-disjoint naive reference`);
    add('INVARIANT 3 — CONSERVATION: totalSeen == evicted + inWindow every push (ring counts == naive counts)',
      v3 === 0, `${v3} violations over ${checks} ops`);
  }

  // 4. AN EVICTED TOKEN STAYS FORGOTTEN — and growing K does NOT recall it.
  {
    let K = 4;
    const buf = makeBuffer(K);
    const seqs = [];
    for (let t = 0; t < 20; t++) { push(buf, draw()); seqs.push(t); }
    // the first (20 − K) seqs are guaranteed evicted.
    const evictedSeq = 0;                          // the very first token
    const before = query(buf, evictedSeq);
    // grow the wall wide open — the lost must NOT return.
    const evBefore = buf.evictedCount;
    resize(buf, Kmax);
    const evAfter = buf.evictedCount;
    const after = query(buf, evictedSeq);
    // an in-window token, for contrast, must report a position.
    const liveSeq = buf.totalSeen - 1;             // the newest
    const live = query(buf, liveSeq);
    const ok = before.status === 'forgotten' && after.status === 'forgotten' &&
      evAfter === evBefore && live.status === 'in-window';
    add('INVARIANT 4 — an evicted token returns FORGOTTEN, and growing K does NOT recall it (evictedCount never drops)',
      ok, `seq0: ${before.status}→${after.status} (evictedAgo ${after.evictedAgo}) · evictedCount ${evBefore}→${evAfter} (grow ${K}→${Kmax}) · newest seq${liveSeq}: ${live.status}@pos${live.position}`);
  }

  // 5. THE FALSIFIABLE CLAIM — the O(1) ring === the naive reference, byte-for-byte,
  //    over thousands of randomized push + resize ops, K swept 1..Kmax.
  {
    const rng2 = makeRng(seed ^ 0x5151);
    const draw2 = () => VOCAB[Math.floor(rng2() * VOCAB.length)];
    let buf = makeBuffer(1 + Math.floor(rng2() * Kmax));
    let survivors = [];                 // the naive window, kept by plain array ops
    let mism = 0, resizes = 0, KsweepLo = 99, KsweepHi = 0;
    for (let t = 0; t < ops; t++) {
      if (t > 0 && rng2() < 0.12) {
        const newK = 1 + Math.floor(rng2() * Kmax);
        resize(buf, newK);
        while (survivors.length > newK) survivors.shift();
        resizes++;
      }
      const tok = draw2(); push(buf, tok);
      survivors.push(tok); while (survivors.length > buf.K) survivors.shift();
      KsweepLo = Math.min(KsweepLo, buf.K); KsweepHi = Math.max(KsweepHi, buf.K);
      const a = windowEntries(buf).map(e => e.word);
      const b = naiveWindow(survivors, buf.K);
      if (a.length !== b.length || a.some((w, i) => w !== b[i])) mism++;
    }
    add('THE CLAIM — O(1) ring === naive last-K reference byte-for-byte over ' + ops + ' push+resize ops, K swept ' + KsweepLo + '..' + KsweepHi,
      mism === 0, `${mism} mismatches · ${resizes} resizes · K∈[${KsweepLo},${KsweepHi}]`);
  }

  // 6. NEGATIVE CONTROL WITH TEETH — the off-by-one buffer is CAUGHT failing the
  //    SAME four checks that the correct buffer PASSES (the gate is non-vacuous).
  {
    const rng3 = makeRng(seed ^ 0xBAD);
    const draw3 = () => VOCAB[Math.floor(rng3() * VOCAB.length)];
    const K = 5;
    // --- the CORRECT buffer over a fixed stream PASSES all four ---
    const good = makeBuffer(K);
    const bad = makeBrokenBuffer(K);
    const history = [];
    const stream = [];
    for (let t = 0; t < 40; t++) stream.push(draw3());
    let goodFails = 0, badCatches = 0;
    for (const tok of stream) {
      push(good, tok); brokenPush(bad, tok); history.push(tok);
      const naive = naiveWindow(history, K);
      // GOOD must pass invariants 1,2,3:
      const gw = windowEntries(good);
      if (gw.length !== Math.min(good.totalSeen, K)) goodFails++;
      if (gw.length !== naive.length || gw.some((e, i) => e.word !== naive[i])) goodFails++;
      if (good.totalSeen !== good.evictedCount + gw.length) goodFails++;
      // BAD must FAIL at least one of them once overflow kicks in (compare against
      // the REQUESTED capacity reqK — what the caller asked the broken buffer for):
      const bw = windowEntries(bad);
      const lenWrong = bw.length !== Math.min(bad.totalSeen, bad.reqK);
      const notLastK = bw.length !== naive.length || bw.some((e, i) => e.word !== naive[i]);
      const consBroken = bad.totalSeen !== bad.evictedCount + bw.length;
      if (lenWrong || notLastK || consBroken) badCatches++;
    }
    // INVARIANT 4 teeth: the broken probe LIES — claims 'in-window' about a token
    // the naive reference (the correct buffer) says is FORGOTTEN. The off-by-one
    // pins the oldest leaked token, so its seq is exactly the broken window's
    // oldest entry — which is one older than the correct last-K window.
    const bwFinal = windowEntries(bad);
    const lyingSeq = bwFinal[0].seq;                 // the broken window's oldest
    const naiveSaysForgotten = lyingSeq < history.length - K;
    const badQuery = brokenQuery(bad, lyingSeq);     // the broken probe's answer
    const probeLies = naiveSaysForgotten && badQuery.status === 'in-window';
    const goodQuery = query(good, lyingSeq);         // the honest probe, same seq
    const ok = goodFails === 0 && badCatches > 0 &&
      goodQuery.status === 'forgotten' && probeLies;
    add('NEGATIVE CONTROL — the off-by-one buffer is CAUGHT (wrong length / not-last-K / conservation broken / probe lies "in-window") while the correct buffer PASSES the identical gate',
      ok, `correct: ${goodFails} failures (PASSES) · broken: caught ${badCatches}× · seq${lyingSeq}: honest probe says ${goodQuery.status}, broken probe says ${badQuery.status} (the lie)`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}

// The broken buffer's query — keys on seq over its (corrupted) window. Because
// the broken window leaks an ancient slot, this can report 'in-window' for a seq
// the naive reference knows is forgotten — the lie the negative control exposes.
export function brokenQuery(buf, seq) {
  const win = windowEntries(buf);
  for (let i = 0; i < win.length; i++) if (win[i].seq === seq) return { status: 'in-window', position: i };
  if (seq < 0 || seq >= buf.totalSeen) return { status: 'unseen' };
  const oldestSeq = buf.totalSeen - buf.count;
  return { status: 'forgotten', evictedAgo: oldestSeq - seq };
}
