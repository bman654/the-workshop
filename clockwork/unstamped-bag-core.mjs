// ============================================================================
//  The Unstamped Bag — why I can't tell dog-bites-man from man-bites-dog  (CORE)
//  Pure, dependency-free, Node-importable. Identical code is inlined into
//  unstamped-bag.html between sentinels; this file is the Node-testable twin (the
//  falsifiability harness runs against it, and re-extracts the inlined copy to
//  prove byte-parity — the wing's standard mold, the same one core.test.mjs /
//  spotlight-core.test.mjs / next-word-core.test.mjs use).
//
//  THE WING: Clockwork Automata — the estate's wing about its own maker. This is
//  the wing's 9th TEAL BENCH, and it names a blunt self-fact the others lack: a
//  bare self-attention block is ORDER-BLIND. Strip the position stamp and the
//  maker reads a sentence as a BAG OF WORDS — "dog bites man" and "man bites dog"
//  produce the byte-identical pooled reading and the byte-identical next-word die.
//  Order is not in attention; it is a thing that has to be ADDED, by slot.
//
//  THE ONE IDEA. Permutation-equivariance. One hand-built self-attention head:
//      Q = X·WQ   K = X·WK   V = X·WV          (WQ/WK/WV NON-symmetric, so once
//      S = QKᵀ / √d                              order is stamped in, it WOULD matter)
//      A = rowsoftmax(S)                         (the wing's stable max-subtraction
//      OUT = A·V                                  softmax — byte-equal to core.mjs)
//  Permute the input rows by π and EVERY output row permutes by EXACTLY π:
//      P_π · attend(X)  =  attend(P_π · X)       (exact in ℝ; only float dust)
//  Mean-pool the rows and the readout is permutation-INVARIANT — the order is
//  gone. The page makes this a thing you OPERATE: drag the token tiles into a new
//  order and the output GEMS travel in lockstep with your hand, while the gilded
//  MEAN-POOL NEEDLE and the NEXT-WORD DIE sit dead-still. No chart. The dance IS
//  the equivariance; the dead-still needle IS the invariance.
//
//  THE STAMP (the sole symmetry-breaker). The position stamp adds a sinusoidal
//  PE(slot) = [sin(slot·ω), cos(slot·ω)] to each SLOT FRAME — added to the slot,
//  NOT carried by the token. Flip it on and a tile dragged to a new slot picks up
//  THAT slot's stamp: order finally enters the math. Now the SAME reorder moves
//  every gem's color/size, swings the needle, and re-rolls the die. One toggle
//  isolates the stamp as the only thing that breaks order-blindness. A COPY pin
//  proves it is the position-DEPENDENCE, not "adding anything": a constant stamp
//  (the same vector on every row) keeps the symmetry; only the sinusoid breaks it.
//
//  THE BYTE-IDENTICAL READOUT (the settled correctness fork). The naive slot-order
//  mean-pool is permutation-invariant only to a ~1e-16 float floor (the sum order
//  changes). To make the die TRULY byte-identical across reorders, the readout
//  reduces in a canonical token-id order (gistCanon) — and the self-test PROVES
//  that canonical readout equals the honest slot-order pool to <1e-12, so the
//  byte-identity is honest, not a sort trick. The naive floor is printed alongside.
//
//  THE TOY. |V|=6 vocab tokens {dog,bites,man,the,cat,sat}, d=2 embeddings, one
//  2×2 head, a |V|×2 output map for the die. The LAW is exact at any d; the toy is
//  small so the page can never drift from the proof.
// ============================================================================

const log2 = x => Math.log(x) / Math.LN2;   // bits — byte-identical to core.mjs

// ── THE FROZEN GENESIS ──────────────────────────────────────────────────────
//  Every literal here is string-pinned by the parity harness, so a model edit is
//  loud. The vocabulary is illustrative; the self-attention law is exact. EMB is
//  a token's embedding (carried by the TILE); WQ/WK/WV are the head's NON-symmetric
//  projections (so order WOULD matter once stamped); Wout maps the pool to the
//  next-word die over the vocab; PE(slot)=[sin(slot·ω),cos(slot·ω)] is the stamp,
//  added BY SLOT; CONST is the position-INDEPENDENT control stamp (the COPY pin).
export const GENESIS = {
  VOCAB: ['dog', 'bites', 'man', 'the', 'cat', 'sat'],   // |V| = 6
  D: 2,                                                   // embedding dimension (2-D)
  OMEGA: 0.9,                                             // the stamp's angular rate ω
  EMB: [
    [ 0.90, -0.30],   // dog
    [-0.60,  0.70],   // bites
    [ 0.20,  0.90],   // man
    [-0.80, -0.50],   // the
    [ 0.70,  0.40],   // cat
    [-0.20, -0.90],   // sat
  ],
  WQ: [[ 0.80, -0.50], [ 0.30,  0.90]],   // query projection (non-symmetric)
  WK: [[ 0.60,  0.40], [-0.70,  0.50]],   // key projection   (non-symmetric)
  WV: [[ 0.50,  0.90], [-0.40,  0.60]],   // value projection (non-symmetric)
  Wout: [
    [ 1.60, -0.40],   // → dog
    [-0.90,  1.40],   // → bites
    [ 0.50,  1.60],   // → man
    [-1.30, -0.70],   // → the
    [ 1.10,  0.90],   // → cat
    [-0.50, -1.40],   // → sat
  ],
  CONST: [0.37, -0.21],   // the position-INDEPENDENT control stamp (added to EVERY row)
};

// the hero bag is three DISTINCT tokens so the permutation is unique.
export const HERO_DBM = [0, 1, 2];   // dog · bites · man
export const HERO_MBD = [2, 1, 0];   // man · bites · dog

// ── SOFTMAX (the law — byte-identical to core.mjs) ───────────────────────────
//  Stable max-subtraction form: subtract the max logit before exp(). This is the
//  shared lineage — the SAME softmax the Temperature Dial / Partition / Next Word
//  benches prove normalized. Used here BOTH for the row-softmax of attention and
//  for the next-word die.
export function softmax(logits, T) {
  const z = logits.map(l => l / T);
  const m = Math.max(...z);
  const ex = z.map(v => Math.exp(v - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
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

// ── mv / dot — the linear-algebra atoms (general at any d, honest about it) ───
export function mv(M, v) {
  const out = new Array(M.length).fill(0);
  for (let i = 0; i < M.length; i++) { let s = 0; for (let j = 0; j < v.length; j++) s += M[i][j] * v[j]; out[i] = s; }
  return out;
}
export function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

// ── posEnc — the position stamp (sinusoidal, BY SLOT) ────────────────────────
//  PE(slot) = [sin(slot·ω), cos(slot·ω)]. Added to the SLOT FRAME, never carried
//  with the token — that is the whole point: drag a tile to a new slot and it
//  picks up THAT slot's stamp.
export function posEnc(slot) {
  const w = slot * GENESIS.OMEGA;
  return [Math.sin(w), Math.cos(w)];
}

// ── inputs(tokens, {stamp, constStamp}) — build the input rows X ─────────────
//  X[slot] = EMB[token at slot]  (+ PE(slot) if stamp)  (+ CONST if constStamp).
//  With NO position stamp this is a pure ELEMENTWISE map over tokens, so it
//  commutes with permutation: inputs(P_π·tokens) === P_π·inputs(tokens). The
//  position stamp is the only term that breaks that commute (PE is by slot).
export function inputs(tokens, { stamp = false, constStamp = false } = {}) {
  return tokens.map((t, slot) => {
    const e = GENESIS.EMB[t];
    let x = e[0], y = e[1];
    if (stamp) { const pe = posEnc(slot); x += pe[0]; y += pe[1]; }
    if (constStamp) { x += GENESIS.CONST[0]; y += GENESIS.CONST[1]; }
    return [x, y];
  });
}

// ── attend(X) — one real self-attention head, in SLOT ORDER ──────────────────
//  Q=X·WQ, K=X·WK, V=X·WV; S=QKᵀ/√d; A=rowsoftmax(S); OUT=A·V. Returns the rows
//  in slot order (the GEMS the page draws). This is the PROOF path for
//  equivariance: permuting X's rows permutes OUT's rows by exactly the same π.
export function attend(X) {
  const n = X.length, d = GENESIS.D, invSqrtD = 1 / Math.sqrt(d);
  const Q = X.map(x => mv(GENESIS.WQ, x));
  const K = X.map(x => mv(GENESIS.WK, x));
  const V = X.map(x => mv(GENESIS.WV, x));
  const A = [], OUT = [];
  for (let i = 0; i < n; i++) {
    const s = new Array(n);
    for (let j = 0; j < n; j++) s[j] = dot(Q[i], K[j]) * invSqrtD;   // scaled logits row
    const a = softmax(s, 1);                                          // row-softmax (shared lineage)
    A.push(a);
    const o = new Array(d).fill(0);
    for (let j = 0; j < n; j++) for (let k = 0; k < d; k++) o[k] += a[j] * V[j][k];   // OUT = A·V
    OUT.push(o);
  }
  return { Q, K, V, A, OUT };
}

// ── meanpoolSlot(OUT) — the NAIVE slot-order mean (the ~1e-16 float floor) ────
//  The mean of the output rows in slot order. Permutation-invariant only to a
//  float floor (the summation order changes under a reorder, ~1e-16) — shown on
//  the page so nothing is hidden; the BYTE-identical readout is gistCanon below.
export function meanpoolSlot(OUT) {
  const d = OUT[0].length, p = new Array(d).fill(0);
  for (let i = 0; i < OUT.length; i++) for (let k = 0; k < d; k++) p[k] += OUT[i][k];
  for (let k = 0; k < d; k++) p[k] /= OUT.length;
  return p;
}

// ── gistCanon(tokens, {stamp, constStamp}) — the BYTE-IDENTICAL readout ──────
//  With NO position stamp the pooled reading is a pure function of the token
//  MULTISET, so we reduce in a canonical token-id order: the bytes are then
//  IDENTICAL under ANY input permutation (the bag reading), AND — proven by the
//  self-test — equal to the honest slot-order pool to <1e-12, so it is honest,
//  not a sort trick. With the position stamp ON there is no bag: order is real,
//  and the gist IS the honest slot-order pool (so the same reorder moves it).
export function gistCanon(tokens, { stamp = false, constStamp = false } = {}) {
  if (stamp) return meanpoolSlot(attend(inputs(tokens, { stamp: true, constStamp })).OUT);
  const order = tokens.map((t, i) => i).sort((a, b) => tokens[a] - tokens[b] || a - b);
  const canon = order.map(i => tokens[i]);
  return meanpoolSlot(attend(inputs(canon, { stamp: false, constStamp })).OUT);
}

// ── nextWordDie(pool) — the loaded die over the vocab (Next-Word kinship) ─────
//  logits = Wout·pool, then the SAME softmax → a real distribution (Σ=1) whose
//  faces are sized by probability. This is the genuine next-word die: stamp-off it
//  is byte-identical for dog-bites-man and man-bites-dog (the title claim).
export function nextWordDie(pool) {
  const logits = GENESIS.Wout.map(row => dot(row, pool));
  return softmax(logits, 1);
}

// ── permutations ─────────────────────────────────────────────────────────────
//  permute(arr, perm) gives result[i] = arr[perm[i]] (i.e. P_perm applied to arr).
export function permute(arr, perm) { return perm.map(i => arr[i]); }
export function randPerm(n, rng) {
  const p = []; for (let i = 0; i < n; i++) p.push(i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  return p;
}
export function invPerm(perm) { const inv = new Array(perm.length); for (let i = 0; i < perm.length; i++) inv[perm[i]] = i; return inv; }

// ── solve(tokens, {stamp, constStamp}) — THE SINGLE SOURCE OF TRUTH ──────────
//  The page render AND the self-test both call this. Returns the slot-order
//  attention (the gems = OUT), the naive slot pool (the float floor), the
//  byte-stable gist (what the needle + die read), and the next-word die.
export function solve(tokens, { stamp = false, constStamp = false } = {}) {
  const X = inputs(tokens, { stamp, constStamp });
  const att = attend(X);
  const poolSlot = meanpoolSlot(att.OUT);
  const gist = gistCanon(tokens, { stamp, constStamp });
  const die = nextWordDie(gist);
  return { tokens, X, Q: att.Q, K: att.K, V: att.V, A: att.A, OUT: att.OUT, poolSlot, gist, die };
}

// total-variation distance between two distributions (for the die-moves teeth).
export function tvDist(p, q) { let s = 0; for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]); return 0.5 * s; }
// ∞-norm of the entry-wise difference of two row-lists (for the equivariance gap).
export function maxAbsDiffRows(A, B) {
  let m = 0;
  for (let i = 0; i < A.length; i++) for (let k = 0; k < A[i].length; k++) m = Math.max(m, Math.abs(A[i][k] - B[i][k]));
  return m;
}

// ── THE SELF-TEST (shared verbatim with the page) ───────────────────────────
//  Returns {pass, total, lines:[{name, ok, detail}]}. Every detail prints LIVE
//  numbers (the estate convention — a reader can audit the claim from the row).
//  Five claims:
//   1. PERMUTATION-EQUIVARIANCE (stamp off) — ‖P_π·attend(X)−attend(P_π·X)‖∞<1e-12
//      over a seeded ladder of random π × bags, AND A === softmax(scaled logits).
//   2. MEAN-POOL INVARIANCE, BYTE-IDENTICAL (stamp off) — gistCanon === under ANY
//      π (0 ULP) AND gist(dbm)===gist(mbd); AND the canonical readout equals the
//      honest slot-order pool to <1e-12 (the naive ~1e-16 floor printed alongside).
//   3. NEG-CONTROL WITH TEETH (stamp on) — the SAME π changes per-token output by
//      O(1) (max|Δ|>τ) AND moves the die (TV>thresh), while stamp-OFF on the
//      IDENTICAL config still passes claims 1+2 (only the stamp breaks it).
//   4. COPY PIN — a constant (position-INDEPENDENT) stamp PRESERVES equivariance
//      (<1e-12) and keeps the gist byte-identical; only the sinusoid breaks it.
//   5. DETERMINISM + DIE KINSHIP — two solves byte-identical; die===softmax(Wout·
//      pool) with Σ=1; and stamp-OFF the die for DBM is byte-identical to MBD.
export function runSelfTest({ ladder = 64, seed = 0xBA6217 } = {}) {
  const lines = [];
  const add = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const rng = makeRng(seed);
  const nV = GENESIS.VOCAB.length;

  // a ladder of random bags (len 3..6) each with a random π over its slots.
  const rungs = [];
  for (let i = 0; i < ladder; i++) {
    const n = 3 + Math.floor(rng() * 4);
    const toks = [];
    for (let j = 0; j < n; j++) toks.push(Math.floor(rng() * nV));
    rungs.push({ toks, pi: randPerm(n, rng) });
  }

  // 1. PERMUTATION-EQUIVARIANCE (stamp off): P_π·attend(X) === attend(P_π·X).
  {
    let maxEqErr = 0, maxLawErr = 0;
    for (const r of rungs) {
      const X = inputs(r.toks, { stamp: false });
      const out0 = attend(X).OUT;
      const outPiOfOrig = permute(out0, r.pi);                       // P_π · attend(X)
      const outOfPi = attend(inputs(permute(r.toks, r.pi), { stamp: false })).OUT;  // attend(P_π·X)
      maxEqErr = Math.max(maxEqErr, maxAbsDiffRows(outPiOfOrig, outOfPi));
      // lineage tie: each attention row === softmax of its scaled-logit row.
      const att = attend(X), n = X.length, invSqrtD = 1 / Math.sqrt(GENESIS.D);
      for (let ii = 0; ii < n; ii++) {
        const s = new Array(n);
        for (let jj = 0; jj < n; jj++) s[jj] = dot(att.Q[ii], att.K[jj]) * invSqrtD;
        const law = softmax(s, 1);
        for (let jj = 0; jj < n; jj++) maxLawErr = Math.max(maxLawErr, Math.abs(att.A[ii][jj] - law[jj]));
      }
    }
    const ok = maxEqErr < 1e-12 && maxLawErr < 1e-12;
    add('PERMUTATION-EQUIVARIANCE (stamp off): over a seeded ladder of random π × bags, ‖P_π·attend(X) − attend(P_π·X)‖∞ < 1e-12 (exact in ℝ), and every row A === softmax((QKᵀ)/√d) to machine-ε',
      ok, `max‖P_π·attend(X)−attend(P_π·X)‖∞=${maxEqErr.toExponential(2)} · max|A−softmax(scaled)|=${maxLawErr.toExponential(2)} over ${rungs.length} rungs`);
  }

  // 2. MEAN-POOL INVARIANCE, BYTE-IDENTICAL (stamp off): gistCanon === under ANY
  //    π (0 ULP) AND gist(dbm)===gist(mbd); the canonical readout equals the
  //    honest slot-order pool to <1e-12; the naive slot floor printed alongside.
  {
    let ulp = 0, maxHonest = 0, naiveFloor = 0;
    for (const r of rungs) {
      const g0 = gistCanon(r.toks, { stamp: false });
      const gPi = gistCanon(permute(r.toks, r.pi), { stamp: false });
      for (let k = 0; k < g0.length; k++) if (gPi[k] !== g0[k]) ulp++;     // must be 0 (byte-identical)
      // honest framing: canonical readout === honest slot-order pool to <1e-12.
      const honest = meanpoolSlot(attend(inputs(r.toks, { stamp: false })).OUT);
      for (let k = 0; k < g0.length; k++) maxHonest = Math.max(maxHonest, Math.abs(g0[k] - honest[k]));
      // the naive slot floor: the slot pool DOES wobble by float dust under π.
      const honestPi = meanpoolSlot(attend(inputs(permute(r.toks, r.pi), { stamp: false })).OUT);
      for (let k = 0; k < honest.length; k++) naiveFloor = Math.max(naiveFloor, Math.abs(honestPi[k] - honest[k]));
    }
    const gDbm = gistCanon(HERO_DBM, { stamp: false }), gMbd = gistCanon(HERO_MBD, { stamp: false });
    const heroIdentical = gDbm.every((v, k) => v === gMbd[k]);
    const ok = ulp === 0 && heroIdentical && maxHonest < 1e-12;
    add('MEAN-POOL INVARIANCE, BYTE-IDENTICAL (stamp off): gistCanon is byte-identical (0 ULP) under ANY π AND gist(dog·bites·man)===gist(man·bites·dog); the canonical readout equals the honest slot-order pool to <1e-12 (honest, not a sort trick)',
      ok, `ULP-drift=${ulp} (0 = byte-identical) · gist(dbm)===gist(mbd)=${heroIdentical} · |canonical−honest|max=${maxHonest.toExponential(2)} · naive slot-pool floor under π ≈ ${naiveFloor.toExponential(2)}`);
  }

  // 3. NEG-CONTROL WITH TEETH (stamp on): the SAME π that left everything still
  //    stamp-off now changes per-token output by O(1) AND moves the die, while
  //    the stamp-OFF path on the IDENTICAL config still passes claims 1+2.
  {
    const TAU = 0.1;
    // hero config + its (unique) reversal. stamp ON: equivariance is BROKEN.
    const onBrk = maxAbsDiffRows(
      permute(attend(inputs(HERO_DBM, { stamp: true })).OUT, HERO_MBD.map((_, i) => HERO_MBD.length - 1 - i)),
      attend(inputs(HERO_MBD, { stamp: true })).OUT);
    const dieDbmOn = nextWordDie(gistCanon(HERO_DBM, { stamp: true }));
    const dieMbdOn = nextWordDie(gistCanon(HERO_MBD, { stamp: true }));
    const tvOn = tvDist(dieDbmOn, dieMbdOn);
    // the IDENTICAL config, stamp OFF, still passes the honest gates:
    const offEq = maxAbsDiffRows(
      permute(attend(inputs(HERO_DBM, { stamp: false })).OUT, HERO_MBD.map((_, i) => HERO_MBD.length - 1 - i)),
      attend(inputs(HERO_MBD, { stamp: false })).OUT);
    const dieDbmOff = nextWordDie(gistCanon(HERO_DBM, { stamp: false }));
    const dieMbdOff = nextWordDie(gistCanon(HERO_MBD, { stamp: false }));
    const offByteIdentical = dieDbmOff.every((v, k) => v === dieMbdOff[k]);
    const teeth = onBrk > TAU && tvOn > 0.02;
    const honestStillClears = offEq < 1e-12 && offByteIdentical;
    const ok = teeth && honestStillClears;
    add('NEG-CONTROL WITH TEETH (stamp on): the SAME π changes per-token output by O(1) (max|Δ|>τ=0.1) AND moves the die (TV>thresh), while the stamp-OFF path on the IDENTICAL config still passes claims 1+2 (the stamp is the SOLE symmetry-breaker)',
      ok, `stamp-on: max|Δout|=${onBrk.toFixed(4)}>${TAU} · die TV=${tvOn.toFixed(4)}>0.02 · stamp-off SAME config: ‖Δ‖∞=${offEq.toExponential(2)}<1e-12 die byte-identical=${offByteIdentical}`);
  }

  // 4. COPY PIN: a constant (position-INDEPENDENT) stamp PRESERVES equivariance
  //    AND keeps the gist byte-identical — so it is the position-DEPENDENCE, not
  //    "adding anything", that breaks order-blindness (defends the slot-branding).
  {
    let maxEqErr = 0, ulp = 0;
    for (const r of rungs) {
      const out0 = attend(inputs(r.toks, { constStamp: true })).OUT;
      const outPiOfOrig = permute(out0, r.pi);
      const outOfPi = attend(inputs(permute(r.toks, r.pi), { constStamp: true })).OUT;
      maxEqErr = Math.max(maxEqErr, maxAbsDiffRows(outPiOfOrig, outOfPi));
      const g0 = gistCanon(r.toks, { constStamp: true });
      const gPi = gistCanon(permute(r.toks, r.pi), { constStamp: true });
      for (let k = 0; k < g0.length; k++) if (gPi[k] !== g0[k]) ulp++;
    }
    const ok = maxEqErr < 1e-12 && ulp === 0;
    add('COPY PIN: a position-INDEPENDENT CONSTANT stamp preserves equivariance (<1e-12) and keeps the gist byte-identical (0 ULP) — only the position-DEPENDENT sinusoid breaks the symmetry (it is the position-dependence, not the adding)',
      ok, `const-stamp ‖P_π·out−out(P_π·x)‖∞=${maxEqErr.toExponential(2)}<1e-12 · gist ULP-drift=${ulp} (0)`);
  }

  // 5. DETERMINISM + DIE KINSHIP: two solves byte-identical; die===softmax(Wout·
  //    pool) Σ=1; stamp-OFF the DBM die is byte-identical to the MBD die.
  {
    const a = solve(HERO_DBM, { stamp: false }), b = solve(HERO_DBM, { stamp: false });
    const det = a.gist.every((v, k) => v === b.gist[k]) && a.die.every((v, k) => v === b.die[k]);
    const dieSum = a.die.reduce((x, y) => x + y, 0);
    const lawDie = softmax(GENESIS.Wout.map(row => dot(row, a.gist)), 1);
    const dieLaw = a.die.every((v, k) => v === lawDie[k]) && Math.abs(dieSum - 1) <= 1e-12;
    const dDbm = solve(HERO_DBM, { stamp: false }).die, dMbd = solve(HERO_MBD, { stamp: false }).die;
    const titleClaim = dDbm.every((v, k) => v === dMbd[k]);
    const ok = det && dieLaw && titleClaim;
    add('DETERMINISM + DIE KINSHIP: two solves byte-identical; die === softmax(Wout·pool) with Σ=1; and stamp-OFF the next-word die for dog-bites-man is byte-identical to man-bites-dog (the title claim, proven)',
      ok, `two solves ${det ? 'identical' : 'DRIFTED'} · die===softmax(Wout·pool)=${a.die.every((v, k) => v === lawDie[k])} Σdie=${dieSum.toFixed(12)} · die(dbm)===die(mbd)=${titleClaim}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
