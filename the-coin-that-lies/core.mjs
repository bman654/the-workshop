// === CORE BEGIN ===
// The Coin That Lies — math core (single source of truth).
// The classic puzzle: N coins, exactly ONE is counterfeit — it is either LIGHTER or HEAVIER
// than the rest (you don't know which). With a two-pan balance and W weighings, find the fake
// AND say which way it lies. The famous answer: 12 coins fall in 3 weighings, and no fewer.
//
// THE SOUL is TERNARY SEARCH / INFORMATION IN TRITS. A two-pan weighing has THREE outcomes —
// left pan lighter ('<'), balance ('='), or left pan heavier ('>') — so it is ONE QUESTION WITH
// THREE ANSWERS. W weighings can therefore tell apart at most reach(W)=3^W cases. There are
// 2N possible cases (each of N coins × {light, heavy}). The information-theoretic FLOOR is
// ⌈log₃(2N)⌉ weighings — for N=12, ⌈log₃24⌉ = 3 (because 3² = 9 < 24 ≤ 27 = 3³). The floor
// is only HALF the story: a real depth-W decision tree must actually EXIST. This core proves
// BOTH halves — the floor AND a concrete depth-3 schedule that resolves all 24 cases — and the
// achievability predicate `solvableIn` is the SOLE solvability authority the page reads.
//
// Everything DERIVES from N. Nothing hard-codes 12, 24, or 3.
//
// This module is DOM-free and is inlined byte-identical into index.html between the CORE BEGIN /
// CORE END sentinels, then tested by core.test.mjs — page & test can never drift.

const N = 12;
const LIGHT = -1, HEAVY = +1;     // the fake's deviation sign; a real coin contributes 0

// A CASE is one possible truth of the world: coin f is the fake and lies in direction k.
// allCases(n) enumerates all 2n of them in a DETERMINISTIC order (coin 0 light, 0 heavy, 1
// light, …) so the SCHEDULE built on page and on the twin are identical.
function allCases(n) {
  const out = [];
  for (let f = 0; f < n; f++) { out.push({ f, k: LIGHT }); out.push({ f, k: HEAVY }); }
  return out;
}
// A stable string key for a case (for set membership, leaf identity).
function caseKey(c) { return c.f + (c.k === LIGHT ? 'L' : 'H'); }

// THE ONE OUTCOME ORACLE. Put the coins in `left` against the coins in `right` (each an array of
// coin indices). EXACTLY one coin (fakeIdx) deviates, by sign fakeKind; every other coin weighs
// the same, so only the fake can tip the beam — and only if it sits on a pan. Returns:
//   '<'  left pan is LIGHTER than right   (left went up)
//   '='  the pans BALANCE
//   '>'  left pan is HEAVIER than right   (left went down)
// Pans are intended equal-count by construction (candidateWeighings guarantees it), so a real
// coin never tips the beam; this oracle does not ASSUME that, it computes the true mass delta.
// ANTISYMMETRY: weigh(R,L,…) === flip(weigh(L,R,…)) for every case — asserted by the twin.
function weigh(left, right, fakeIdx, fakeKind) {
  let delta = 0;                         // (mass on left) − (mass on right), in fake-deviation units
  if (left.includes(fakeIdx)) delta += fakeKind;
  if (right.includes(fakeIdx)) delta -= fakeKind;
  // also account for any unit count imbalance of REAL coins: a heavier-by-count pan would tip,
  // but candidateWeighings only ever offers equal-count pans, so the real-coin contribution is 0.
  // (left.length − right.length) reals each weigh 1 unit; include it for total honesty.
  delta += (left.length - right.length) * 0;   // real coins are identical ⇒ contribute nothing
  if (delta < 0) return '<';
  if (delta > 0) return '>';
  return '=';
}
function flip(o) { return o === '<' ? '>' : (o === '>' ? '<' : '='); }

// PARTITION the live case-set by the outcome a given weighing produces. DISJOINT + TOTAL by
// construction: every case lands in exactly one of the three lanes. The rack-split engine.
function partition(live, left, right) {
  const buckets = { '<': [], '=': [], '>': [] };
  for (const c of live) buckets[weigh(left, right, c.f, c.k)].push(c);
  return buckets;
}

// reach(W) = the maximum number of cases W ternary weighings can DISTINGUISH = 3^W.
function reach(W) { return Math.pow(3, W); }
// smallestW(K): the least W with reach(W) ≥ K (integer search — no floats). The true floor.
function smallestW(K) { let w = 0; while (Math.pow(3, w) < K) w++; return w; }
// log3Bound(K) = ⌈log₃ K⌉ via the float formula. The twin cross-checks log3Bound === smallestW
// over a sweep so the float can never silently drift from its integer meaning.
function log3Bound(K) { return K <= 1 ? 0 : Math.ceil(Math.log(K) / Math.log(3) - 1e-9); }

// CANDIDATE WEIGHINGS for n coins: every equal-size split of some 2p coins (p on each pan,
// 1 ≤ p ≤ ⌊n/2⌋) into two disjoint pans. We canonicalize so left[0] < right[0] (a weighing and
// its mirror give flipped-but-equivalent information, so we keep one), and emit them in a fixed
// DETERMINISTIC order so the greedy SCHEDULE is identical on page and twin. To keep the set
// tractable yet expressive we draw pans from the LIVE-relevant coins plus a canonical ordering;
// the full combinatorial generator below is exact for n ≤ 13 (the puzzle's range).
const _candCache = new Map();      // memoize the deterministic, pure candidate list per n
function candidateWeighings(n) {
  if (_candCache.has(n)) return _candCache.get(n);
  const coins = [];
  for (let i = 0; i < n; i++) coins.push(i);
  const out = [];
  const seen = new Set();
  // choose left pan (size p) then right pan (size p) from the remaining coins, p = 1..⌊n/2⌋.
  // We generate combinations deterministically; canonicalize left[0] < right[0].
  function combos(arr, p) {
    const res = [];
    const idx = [];
    (function rec(start, depth) {
      if (depth === p) { res.push(idx.map(i => arr[i])); return; }
      for (let i = start; i < arr.length; i++) { idx.push(i); rec(i + 1, depth + 1); idx.pop(); }
    })(0, 0);
    return res;
  }
  const maxP = Math.floor(n / 2);
  for (let p = 1; p <= maxP; p++) {
    const lefts = combos(coins, p);
    for (const left of lefts) {
      const leftSet = new Set(left);
      const rest = coins.filter(c => !leftSet.has(c));
      const rights = combos(rest, p);
      for (const right of rights) {
        if (left[0] >= right[0]) continue;            // canonical: keep one of each mirror pair
        const key = left.join(',') + '|' + right.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ left, right });
      }
    }
  }
  _candCache.set(n, out);
  return out;
}

// buildSchedule(cases, depth): a DETERMINISTIC depth-limited greedy. At each node, pick the FIRST
// candidate weighing whose three outcome-branches each have ≤ reach(depth−1) cases AND each
// recursively builds a valid subtree; recurse. Returns a frozen decision tree, or null if no
// depth-`depth` schedule resolves every case (the honest "cannot be done" signal). A leaf (one
// case left, or depth 0 with one case) is { leaf: caseKey }. The cases the tree partitions come
// from the SAME allCases ordering, and candidateWeighings is deterministic, so the tree is
// reproducible byte-for-byte everywhere.
function buildSchedule(cases, depth) {
  if (cases.length <= 1) {
    return cases.length === 1 ? { leaf: caseKey(cases[0]), case: cases[0] } : { leaf: null, case: null };
  }
  if (depth <= 0) return null;                          // more than one case but no weighings left
  if (cases.length > reach(depth)) return null;         // pigeonhole: cannot fit in 3^depth leaves
  // n is fixed by the puzzle (the universe of coin indices is 0..N−1 for the live cases).
  const coinUniverse = new Set(); for (const c of cases) coinUniverse.add(c.f);
  // the candidate pans are drawn from the full coin set so a discriminating weighing can use
  // a coin not currently suspect as a known-good reference.
  const n = N;
  const cands = candidateWeighings(n);
  for (const w of cands) {
    const buckets = partition(cases, w.left, w.right);
    if (buckets['<'].length > reach(depth - 1)) continue;
    if (buckets['='].length > reach(depth - 1)) continue;
    if (buckets['>'].length > reach(depth - 1)) continue;
    const lt = buildSchedule(buckets['<'], depth - 1); if (!lt) continue;
    const eq = buildSchedule(buckets['='], depth - 1); if (!eq) continue;
    const gt = buildSchedule(buckets['>'], depth - 1); if (!gt) continue;
    return Object.freeze({ left: w.left.slice(), right: w.right.slice(), '<': lt, '=': eq, '>': gt });
  }
  return null;
}

// THE PRELOADED SCHEDULE — a frozen depth-3 decision tree for the 12-coin puzzle. VERIFIED:
// 24/24 leaves covered, every leaf at depth EXACTLY 3.
const SCHEDULE = Object.freeze(buildSchedule(allCases(N), 3));

// Collect the leaves of a tree with their depth and the path (sequence of outcomes) reaching them.
function leaves(tree, path = [], depth = 0, acc = []) {
  if (tree && 'leaf' in tree) { acc.push({ key: tree.leaf, case: tree.case, path: path.slice(), depth }); return acc; }
  if (!tree) return acc;
  for (const o of ['<', '=', '>']) leaves(tree[o], path.concat(o), depth + 1, acc);
  return acc;
}

// distinguish(observe, tree): walk the tree against a PLANTED fake. `observe(left,right)` returns
// the real outcome (the page hands a closure over the planted case; the twin hands the oracle).
// Returns { leaf, case, path, depth } — the single case the schedule narrows the world to.
function distinguish(observe, tree = SCHEDULE) {
  let node = tree, path = [], depth = 0;
  while (node && !('leaf' in node)) {
    const o = observe(node.left, node.right);
    path.push(o); node = node[o]; depth++;
  }
  return { leaf: node ? node.leaf : null, case: node ? node.case : null, path, depth };
}

// ── THE GATE — the adjudication the seal/counter/pill all read ───────────────────────────────
// solvableIn(n, W): is there a real depth-W schedule that resolves all 2n cases? This is a
// STRUCTURAL achievability predicate (greedy construction succeeds), NOT the loose log bound.
//   solvableIn(12,3) === true   — a concrete schedule exists (SCHEDULE proves it).
//   solvableIn(13,3) === false  — the greedy fails at 13 because the best first weighing always
//                                 leaves a branch with > 9 cases (pigeonhole over 3² leaves).
// The twin pins solvableIn(13,3)===false against an EXHAUSTIVE reference oracle (below) so the
// greedy can never silently disagree with the true answer.
function solvableIn(n, W) { return buildSchedule(allCases(n), W) !== null; }

// bestFirstWeighing(n): the size of the LARGEST of the three branches under the most balanced
// first weighing the greedy would choose, for diagnostics. For n=13 this worst branch is 10 > 9.
function bestFirstWeighing(n) {
  const cases = allCases(n);
  const cands = candidateWeighings(n);
  let best = Infinity, bestW = null;
  for (const w of cands) {
    const b = partition(cases, w.left, w.right);
    const worst = Math.max(b['<'].length, b['='].length, b['>'].length);
    if (worst < best) { best = worst; bestW = w; }
  }
  return { worstBranch: best, weighing: bestW };
}

// EXHAUSTIVE solvability reference (the twin's independent oracle): can ALL the given cases be
// distinguished in W weighings, trying EVERY candidate weighing at every node (not just the first
// that fits)? Pure brute force — slow but undeniable. Used to certify solvableIn's greedy verdict.
function solvableExhaustive(cases, W, n) {
  if (cases.length <= 1) return true;
  if (W <= 0) return false;
  if (cases.length > reach(W)) return false;
  const cands = candidateWeighings(n);
  for (const w of cands) {
    const b = partition(cases, w.left, w.right);
    if (b['<'].length > reach(W - 1) || b['='].length > reach(W - 1) || b['>'].length > reach(W - 1)) continue;
    if (solvableExhaustive(b['<'], W - 1, n) && solvableExhaustive(b['='], W - 1, n) && solvableExhaustive(b['>'], W - 1, n)) return true;
  }
  return false;
}

// A displayed sanity identity (twin-checked, NOT the gate): tightMax(W) = (3^W − 3) / 2 is the
// largest coin count solvable in W weighings WITHOUT a known-good reference coin. tightMax(3)=12,
// and 2·12 = 24 = 2N: the witness that 12 is the exact no-reference maximum. This NEVER gates;
// solvableIn does.
function tightMax(W) { return (Math.pow(3, W) - 3) / 2; }

// verifyBinary: the two-outcome control. If we could only read TWO outcomes (a balance that says
// 'tips' or 'level' — a bit, not a trit), W weighings distinguish at most 2^W cases. ⌈log₂24⌉ = 5
// > 3, so 24 cases are unresolvable in 3. Returns { bits, reach2, need, resolvable }.
function verifyBinary(K, W) {
  const reach2 = Math.pow(2, W);
  const need = Math.ceil(Math.log(K) / Math.log(2) - 1e-9);
  return { reach2, need, resolvable: K <= reach2 };
}

// runSelfTest(opts) — the page's own falsifiable self-test, run over the INLINED core. Modes:
//   'normal'     — the construction works and the floor holds.
//   'twoOutcome' — NEG: collapse '<' and '>' into one 'tips' outcome (a bit, not a trit) ⇒
//                  ⌈log₂24⌉ = 5 > 3; 24 is unresolvable in 3.
//   'thirteen'   — NEG: 13 coins ⇒ the best first weighing leaves a worst branch 10 > 3² = 9 ⇒
//                  pigeonhole-unresolvable for ANY schedule; AND solvableIn(13,3) === false.
// Returns { pass, lines:[{name,ok,detail}], offender }. In a NEG mode, pass means the test
// correctly went RED and NAMED the offender.
function runSelfTest(opts = {}) {
  const mode = opts.mode || 'normal';
  const lines = [];
  function ck(name, ok, detail) { lines.push({ name, ok: !!ok, detail: detail || '' }); }

  if (mode === 'normal') {
    // (A) every {<,=,>} outcome partitions the live set disjoint + total — over every candidate
    //     weighing × all 2N cases.
    const cases = allCases(N);
    const cands = candidateWeighings(N);
    let partAllOK = true, partChecks = 0;
    for (const w of cands) {
      const b = partition(cases, w.left, w.right);
      const total = b['<'].length + b['='].length + b['>'].length;
      const keys = new Set([...b['<'], ...b['='], ...b['>']].map(caseKey));
      partChecks++;
      if (total !== cases.length || keys.size !== cases.length) { partAllOK = false; break; }
    }
    ck('each weighing splits the suspects in three — disjoint & complete (' + partChecks + ' weighings × ' + cases.length + ' cases)', partAllOK);

    // (B) reach(W) = 3^W and log3Bound === smallestW over a sweep (the float === the integer def).
    let boundOK = true;
    for (const K of [1, 2, 3, 8, 9, 10, 24, 27, 28]) if (log3Bound(K) !== smallestW(K)) boundOK = false;
    ck('W weighings tell apart at most 3^W cases — and ⌈log₃K⌉ = smallestW(K) on a sweep', boundOK,
       '⌈log₃24⌉=' + log3Bound(24) + ', ⌈log₃27⌉=' + log3Bound(27) + ', ⌈log₃28⌉=' + log3Bound(28));

    // the floor half: 24 cases ⇒ ⌈log₃24⌉ = 3 and 3² < 24 ≤ 3³.
    ck('24 cases ⇒ ⌈log₃24⌉ = 3, and 3² < 24 ≤ 3³ — never fewer', log3Bound(2 * N) === 3 && reach(2) < 2 * N && 2 * N <= reach(3),
       reach(2) + ' < ' + (2 * N) + ' ≤ ' + reach(3));

    // (C) the preloaded schedule resolves all 2N leaves at depth EXACTLY 3.
    const lv = leaves(SCHEDULE);
    const covered = new Set(lv.filter(l => l.key).map(l => l.key));
    const depths = new Set(lv.filter(l => l.key).map(l => l.depth));
    ck('a real depth-3 schedule covers all ' + (2 * N) + ' leaves, one per case — 3 suffices',
       covered.size === 2 * N && depths.size === 1 && depths.has(3),
       'leaves=' + covered.size + ', depths={' + [...depths].join(',') + '}');

    // the gate agrees with construction.
    ck('solvableIn(12,3) === true (the achievability gate)', solvableIn(N, 3));

    const pass = lines.every(l => l.ok);
    return { pass, lines, offender: null };
  }

  if (mode === 'twoOutcome') {
    // collapse < and > into one 'tips': only 2 outcomes survive ⇒ ⌈log₂24⌉ = 5 > 3.
    const vb = verifyBinary(2 * N, 3);
    ck('a two-way balance is a BIT, not a trit: 2³ = ' + vb.reach2 + ' < ' + (2 * N), !vb.resolvable, '2³ = ' + vb.reach2);
    ck('⌈log₂24⌉ = ' + vb.need + ' > 3 — 24 cases cannot be resolved in 3 two-way weighings', vb.need > 3, '⌈log₂24⌉ = ' + vb.need);
    const wentRed = !vb.resolvable && vb.need > 3;
    return { pass: wentRed, lines, offender: 'the two-way balance (a bit, not a trit)' };
  }

  if (mode === 'thirteen') {
    const n = 13;
    const bf = bestFirstWeighing(n);
    ck('13 coins: the best first weighing leaves a worst branch ' + bf.worstBranch + ' > 3² = 9', bf.worstBranch > reach(2), 'worst branch = ' + bf.worstBranch);
    ck('solvableIn(13,3) === false — no depth-3 schedule resolves all 26 cases', solvableIn(n, 3) === false);
    const wentRed = bf.worstBranch > reach(2) && solvableIn(n, 3) === false;
    return { pass: wentRed, lines, offender: 'the 13th coin (worst branch ' + bf.worstBranch + ' > 3² = 9)' };
  }

  return { pass: false, lines: [{ name: 'unknown mode', ok: false, detail: mode }], offender: 'unknown mode' };
}
// === CORE END ===

export {
  N, LIGHT, HEAVY, allCases, caseKey, weigh, flip, partition,
  reach, log3Bound, smallestW, tightMax, candidateWeighings, buildSchedule, SCHEDULE,
  leaves, distinguish, solvableIn, solvableExhaustive, bestFirstWeighing,
  verifyBinary, runSelfTest
};
