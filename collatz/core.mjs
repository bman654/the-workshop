// ============================================================================
//  The Collatz Bench — every number falls to 1, checked, never proven   (CORE)
//  Pure, dependency-free. Identical code is inlined into index.html between
//  sentinels; this file is the Node-testable twin (the falsifiability harness
//  runs against it, and re-extracts the inlined copy to prove byte-parity).
//
//  THE MEDIUM: number theory, the THIRD bench of the Numbers Room (after The
//  Best Rational and The Ulam Spiral). Take any positive integer. If it's even,
//  halve it; if it's odd, triple it and add one. Repeat. The Collatz conjecture
//  (Lothar Collatz, 1937; still open in 2026) says you ALWAYS reach 1 — no
//  matter where you start. No one has proved it. No one has found a
//  counterexample either (checked by computer well past 2^68). This bench is
//  honest about exactly that: it CHECKS, exhaustively, and labels the gap.
//
//  WHY PLAIN Number ARITHMETIC IS SAFE (the overflow justification — verified):
//  for all start values n ≤ 1e5 the largest value any trajectory ever touches
//  (its "peak") is 1,570,824,736 — far below Number.MAX_SAFE_INTEGER (2^53−1 ≈
//  9.007e15). So every 3n+1 and n/2 in range is computed EXACTLY in a double;
//  BigInt would be over-engineering theater here. The self-test asserts this
//  overflow bound operationally (no in-range value exceeds MAX_SAFE_INTEGER).
//
//  THE FOUR FALSIFIABLE CLAIMS (each checked to the integer, live):
//   (1) CONVERGENCE-CHECKED (the honest one). Total-stopping-time is built TWO
//       independent ways that must agree, sharing ONLY next() (never a cache):
//       Oracle A stoppingTimesMemo(N) (memoized, the renderer's source) and
//       Oracle B stoppingTimeRaw(n) (a clean re-walk, NO cache). They must agree
//       for every n∈[2..N], 0 disagreements, and every raw walk must actually
//       terminate at 1. ★ANTI-CIRCULARITY: Oracle B must NEVER read Oracle A's
//       st[] array — a refactor that shares the cache collapses this into a
//       tautology. (pinned in stoppingTimeRaw below.)
//   (2) RECORDS EXACT. recordSetters(N) reproduces, LIVE, the known
//       total-stopping-time record-setters (OEIS A006877 / steps A006877-paired)
//       and the peak-record-setters (A006884 / peaks A025586) — and the famous
//       spot checks: 27 → 111 steps, peak 9232; 97 → 118; 871 → 178, peak
//       190996; 6171 → 261; 77031 → 350, peak 21933016.
//   (3) STRUCTURE (two constructions agree). The CANONICAL inverse rule
//       invChildren(n) runs Collatz BACKWARD from 1; the resulting tree depth on
//       every node it reaches must equal the FORWARD stoppingTimeRaw(n) — two
//       independent constructions of the same number. ★HONESTY: the backward
//       tree at finite depth does NOT cover [1..N]; we report coverage as a STAT
//       ("X of N reached"), never "the tree covers [1..N]".
//   (4) NEGATIVE CONTROL WITH TEETH. Swap the map to 3n−1 (nextAlt). Now MANY
//       starts DON'T reach 1 — they fall into other cycles. We assert ≥30 of
//       [1..60] fail, and the two named cycles match exactly. If a refactor ever
//       makes next ≡ nextAlt, this control flips red.
// ============================================================================

// The safety valve: a trajectory that hasn't reached 1 in this many steps is
// treated as non-convergent (st = −1). In range (n ≤ 1e5) the longest trajectory
// is 350 steps (n = 77031), so this is astronomically loose for honest inputs;
// it exists only so the 3n−1 control's runaway/cyclic walks terminate the loop.
export const STEP_CAP = 100000;

// ── THE MAP — the one shared definition every construction is built on. The
//    re-extraction parity harness checks THIS function char-for-char against the
//    page's inlined copy. If the two ever differ, it's a different experiment. ──
export function next(n){ return n % 2 === 0 ? n / 2 : 3 * n + 1; }

// The 3n−1 map — the negative control. Same parity structure, one sign flipped.
export function nextAlt(n){ return n % 2 === 0 ? n / 2 : 3 * n - 1; }

// ── CLAIM 1 ─────────────────────────────────────────────────────────────────
// Oracle B: a clean re-walk of total-stopping-time. NO cache, NO shared state.
// Returns the number of steps to reach 1, or −1 if it caps (never, for honest n
// in range). ★ANTI-CIRCULARITY GUARD: this function MUST NOT read Oracle A's
// st[] array "for speed" — sharing the cache would collapse Claim 1 into a
// tautology (A === A). It walks next() from scratch, every time.
export function stoppingTimeRaw(n){
  let steps = 0, v = n;
  while (v !== 1){
    v = next(v);
    if (++steps > STEP_CAP) return -1;   // safety valve; unreachable for n≤1e5
  }
  return steps;
}

// Oracle A: memoized total-stopping-time for [0..N] → Int32Array st.
// st[n] = number of steps from n to 1 (st[1]=0); st[n] = −1 flags a cap-hit /
// non-convergence. This is the renderer's source. It MAY walk ABOVE N to follow
// a peak, but only memoizes results for indices ≤ N (the cache is bounded). The
// memo shares ONLY next() with Oracle B — never the other way around.
export function stoppingTimesMemo(N){
  const st = new Int32Array(N + 1).fill(-1);
  if (N >= 1) st[1] = 0;
  for (let start = 2; start <= N; start++){
    if (st[start] !== -1) continue;
    // walk forward, remembering the chain, until we hit a known/terminal value
    const chain = [];
    let v = start, steps = 0, base = -1;
    while (true){
      if (v <= N && st[v] !== -1){ base = st[v]; break; }   // known answer
      if (v === 1){ base = 0; break; }
      chain.push(v);
      v = next(v);
      if (++steps > STEP_CAP){ base = -2; break; }          // non-convergent guard
    }
    if (base === -2){
      // unreachable in honest range; mark the whole chain non-convergent
      for (const c of chain) if (c <= N) st[c] = -1;
      continue;
    }
    // back-fill: the last pushed value is `base+1` steps from 1, etc.
    let s = base + chain.length;
    for (let i = 0; i < chain.length; i++){
      const c = chain[i];
      if (c <= N) st[c] = s;
      s--;
    }
  }
  return st;
}

// ── CLAIM 2 ─────────────────────────────────────────────────────────────────
// The SINGLE path/peak/steps computer the whole bench uses (no second, faster
// path-walker anywhere — that would un-couple the claims). Returns the steps to
// 1, the peak (max value touched), and the full path [n, …, 4, 2, 1].
export function trajectory(n){
  const path = [n];
  let v = n, peak = n, steps = 0;
  while (v !== 1){
    v = next(v);
    if (v > peak) peak = v;
    path.push(v);
    if (++steps > STEP_CAP) break;       // honest guard; never trips for n≤1e5
  }
  return { steps, peak, path };
}

// Known total-stopping-time record-setters (OEIS A006877) and their step counts.
// The ASSERTION TARGET only — recordSetters() derives them live and the test
// asserts equality. n[i] is the i-th integer whose total stopping time exceeds
// all smaller starts; steps[i] is that record stopping time.
export const RECORDS_A006877 = {
  n:     [1, 2, 3, 6, 7, 9, 18, 25, 27, 54, 73, 97, 129, 171, 231, 313, 327, 649, 703, 871],
  steps: [0, 1, 7, 8, 16, 19, 20, 23, 111, 112, 115, 118, 121, 124, 127, 130, 143, 144, 170, 178],
};

// Known PEAK (highest-point) record-setters (OEIS A006884) and their peaks
// (OEIS A025586). n[i] sets a new record for the maximum value its trajectory
// ever reaches; peak[i] is that record peak.
export const RECORDS_A006884 = {
  n:    [1, 2, 3, 7, 15, 27, 255, 447, 639, 703, 1819, 4255, 4591, 9663],
  peak: [1, 2, 16, 52, 160, 9232, 13120, 39364, 41524, 250504, 1276936, 6810136, 8153620, 27114424],
};

// Scan 1..N live; return the total-stopping-time record-setters {n, steps} (a
// new record each time a start's stopping time strictly exceeds all before it),
// AND the peak ladder {n, peak}. Uses trajectory() — the one path computer — so
// nothing here is hard-coded; the constants above are only the test's target.
export function recordSetters(N){
  const steps = { n: [], steps: [] };
  const peaks = { n: [], peak: [] };
  let bestSteps = -1, bestPeak = -1;
  for (let n = 1; n <= N; n++){
    const { steps: s, peak: p } = trajectory(n);
    if (s > bestSteps){ bestSteps = s; steps.n.push(n); steps.steps.push(s); }
    if (p > bestPeak){ bestPeak = p; peaks.n.push(n); peaks.peak.push(p); }
  }
  return { steps, peaks };
}

// Is n a total-stopping-time record-setter at or below N? (for the page's ★ star)
export function isStepRecord(n, N = n){
  const { steps } = recordSetters(Math.max(n, N));
  const idx = steps.n.indexOf(n);
  return idx >= 0;
}

// ── CLAIM 3 ─────────────────────────────────────────────────────────────────
// THE CANONICAL inverse rule (Collatz run BACKWARD). Pinned here; both
// inverseTree() and buildTree() and the self-test use THIS one rule.
//   • Every n has the even predecessor 2n (n = (2n)/2).
//   • n MAY have an odd predecessor m where 3m+1 = n, i.e. m = (n−1)/3 — but only
//     when (n−1) is divisible by 3, m is ODD, and m > 1 (m=1 would make the
//     1→4→2→1 cycle a back-edge; we keep the tree acyclic by stopping at 1).
export function invChildren(n){
  const c = [2 * n];
  if ((n - 1) % 3 === 0){
    const m = (n - 1) / 3;
    if (m % 2 === 1 && m > 1) c.push(m);
  }
  return c;
}

// BFS Collatz BACKWARD from the root 1, bounded by maxNode and maxDepth. Returns
// Map<n, depth> for every node REACHED. ★HONESTY: at finite depth this does NOT
// reach all of [1..maxNode] — coverage is a STAT, not "covers [1..N]".
export function inverseTree(maxNode, maxDepth){
  const depth = new Map();
  depth.set(1, 0);
  let frontier = [1];
  for (let d = 0; d < maxDepth && frontier.length; d++){
    const nextFrontier = [];
    for (const n of frontier){
      for (const ch of invChildren(n)){
        if (ch <= maxNode && !depth.has(ch)){
          depth.set(ch, d + 1);
          nextFrontier.push(ch);
        }
      }
    }
    frontier = nextFrontier;
  }
  return depth;
}

// ── CLAIM 4 ─────────────────────────────────────────────────────────────────
// Does n reach 1 under the 3n−1 map? (the negative control's verdict)
export function reachesOneAlt(n){
  let v = n, steps = 0;
  while (v !== 1){
    v = nextAlt(v);
    if (++steps > STEP_CAP) return false;
    if (v < 1) return false;
  }
  return true;
}

// The sorted cycle the 3n−1 map falls into starting from n (the attractor it is
// captured by). Walks until a value repeats, then returns the sorted loop.
export function altCycle(n){
  const seen = new Map();           // value → index first seen
  const seq = [];
  let v = n, i = 0;
  while (!seen.has(v)){
    seen.set(v, i++);
    seq.push(v);
    v = nextAlt(v);
    if (i > STEP_CAP) return [];     // safety
  }
  const start = seen.get(v);
  const cycle = seq.slice(start);
  return cycle.slice().sort((a, b) => a - b);
}

// ── LAYOUT (pure/deterministic → PNG-reproducible) ───────────────────────────
// buildTree(depthCap): a sunburst of the Collatz tree (backward from 1), laid
// out radially by depth (= forward stopping time, by Claim 3). Returns
// {nodes: Map<n,{depth,parent,kids,leaves,angle,x,y}>}. Angular slots: post-order
// leaf-count, then pre-order arc-split proportional to leaf-count. x/y in ring
// units (depth from centre); the renderer scales radius = stopping-time.
export function buildTree(depthCap, maxNode = 1e9){
  // 1. BFS backward to assign depth + parent + kids (the canonical inverse rule)
  const nodes = new Map();
  nodes.set(1, { n: 1, depth: 0, parent: null, kids: [], leaves: 0, angle: 0, x: 0, y: 0 });
  let frontier = [1];
  for (let d = 0; d < depthCap && frontier.length; d++){
    const nf = [];
    for (const pn of frontier){
      const pnode = nodes.get(pn);
      for (const ch of invChildren(pn)){
        if (ch > maxNode || nodes.has(ch)) continue;
        const node = { n: ch, depth: d + 1, parent: pn, kids: [], leaves: 0, angle: 0, x: 0, y: 0 };
        nodes.set(ch, node);
        pnode.kids.push(ch);
        nf.push(ch);
      }
    }
    frontier = nf;
  }
  // 2. post-order leaf count (iterative — order children deterministically)
  for (const node of nodes.values()) node.kids.sort((a, b) => a - b);
  const postOrder = [];
  (function visit(n){
    const node = nodes.get(n);
    if (node.kids.length === 0){ node.leaves = 1; }
    for (const k of node.kids) visit(k);
    postOrder.push(n);
  })(1);
  for (const n of postOrder){
    const node = nodes.get(n);
    if (node.kids.length){
      node.leaves = node.kids.reduce((s, k) => s + nodes.get(k).leaves, 0);
    }
  }
  // 3. pre-order arc split proportional to leaf-count. Root owns [0, 2π).
  const root = nodes.get(1);
  (function assign(n, a0, a1){
    const node = nodes.get(n);
    node.angle = (a0 + a1) / 2;
    node.x = Math.cos(node.angle) * node.depth;
    node.y = Math.sin(node.angle) * node.depth;
    let a = a0;
    const span = a1 - a0;
    for (const k of node.kids){
      const kn = nodes.get(k);
      const frac = kn.leaves / node.leaves;
      const ka1 = a + span * frac;
      assign(k, a, ka1);
      a = ka1;
    }
  })(1, 0, Math.PI * 2);
  void root;
  return { nodes };
}

// pathOf(n) — the lit path HOME to 1 (the single source: trajectory()).
export function pathOf(n){ return trajectory(n).path; }

// ── THE IN-PAGE SELF-TEST (the pill; mirrors the siblings' shape) ────────────
// Returns { pass, total, lines:[{name, ok, detail}] }. Every detail carries LIVE
// numbers, never a hardcoded echo. In-page N capped ~10000; the Node twin runs
// the same runSelfTest plus heavier checks at N up to ~200000.
export function runSelfTest(N = 10000){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // 1. CONVERGENCE-CHECKED: Oracle A (memo) === Oracle B (raw), 0 disagreements,
  //    every raw walk terminates at 1.
  {
    const st = stoppingTimesMemo(N);
    let bad = 0, firstBad = '', nonTerm = 0;
    for (let n = 2; n <= N; n++){
      const raw = stoppingTimeRaw(n);
      if (raw < 0){ nonTerm++; continue; }
      if (st[n] !== raw){ if (!bad) firstBad = `n=${n}: memo ${st[n]} ≠ raw ${raw}`; bad++; }
    }
    T(`two constructions agree: memo st[n] === raw re-walk, n∈[2..${N}]`,
      bad === 0 && nonTerm === 0,
      bad === 0 && nonTerm === 0 ? `${N - 1} starts, 0 disagreements, all terminate at 1` :
        (bad ? `${bad} disagree (first ${firstBad})` : `${nonTerm} did not terminate`));
  }

  // 2. RECORDS EXACT: recordSetters(N) prefix === A006877 + the spot checks.
  {
    const { steps, peaks } = recordSetters(N);
    // step record-setter prefix matches A006877 up to whatever fits in N
    let stepOk = true, sd = '';
    for (let i = 0; i < RECORDS_A006877.n.length; i++){
      if (RECORDS_A006877.n[i] > N) break;
      if (steps.n[i] !== RECORDS_A006877.n[i] || steps.steps[i] !== RECORDS_A006877.steps[i]){
        stepOk = false; sd = `idx ${i}: got n=${steps.n[i]}/${steps.steps[i]}`; break;
      }
    }
    // peak ladder matches A006884/A025586 up to whatever fits in N
    let peakOk = true, pd = '';
    for (let i = 0; i < RECORDS_A006884.n.length; i++){
      if (RECORDS_A006884.n[i] > N) break;
      if (peaks.n[i] !== RECORDS_A006884.n[i] || peaks.peak[i] !== RECORDS_A006884.peak[i]){
        peakOk = false; pd = `idx ${i}: got n=${peaks.n[i]}/${peaks.peak[i]}`; break;
      }
    }
    // the famous spot checks (those that fit in N)
    const spot = [];
    const chk = (n, s, p) => { if (n <= N){ const t = trajectory(n); spot.push(t.steps === s && t.peak === p); } };
    chk(27, 111, 9232); chk(97, 118, 9232); chk(871, 178, 190996);
    chk(6171, 261, 975400); chk(77031, 350, 21933016);
    const spotOk = spot.every(Boolean);
    T('records reproduce live: step-setters===A006877, peaks===A006884/A025586, spot checks',
      stepOk && peakOk && spotOk,
      stepOk && peakOk && spotOk ?
        `27→{111,9232} · 871→{178,190996} · ${steps.n.length} step-records, ${peaks.n.length} peak-records ≤${N}` :
        `step:${stepOk?'ok':sd} peak:${peakOk?'ok':pd} spot:${spotOk}`);
  }

  // 3. STRUCTURE: backward-tree depth === forward stoppingTimeRaw on every node
  //    reached; report coverage as a STAT; every n∈[1..N] terminates; only the
  //    4→2→1 loop is reached (the raw walk always ends at 1).
  {
    const maxDepth = 200;
    const tree = inverseTree(N, maxDepth);
    let bad = 0, firstBad = '';
    for (const [n, d] of tree){
      const fwd = stoppingTimeRaw(n);
      if (fwd !== d){ if (!bad) firstBad = `n=${n}: tree ${d} ≠ fwd ${fwd}`; bad++; }
    }
    // operational: every n∈[1..min(N,..)] terminates at 1 (already covered by #1,
    // re-stated here as the "only 4→2→1 loop reached" guard).
    T(`backward-tree depth === forward stopping time on all ${tree.size} reached nodes`,
      bad === 0,
      bad === 0 ? `${tree.size} of ${N} reached at depth ≤${maxDepth}, 0 disagreements (coverage is a stat — the tree does NOT cover [1..N])` :
        `${bad} disagree (first ${firstBad})`);
  }

  // 4. NEGATIVE CONTROL WITH TEETH: under 3n−1, ≥30 of [1..60] FAIL to reach 1,
  //    and the two named cycles match exactly.
  {
    let fail = 0;
    for (let n = 1; n <= 60; n++) if (!reachesOneAlt(n)) fail++;
    const c5 = altCycle(5).join(',');
    const c17 = altCycle(17).join(',');
    const C5 = '5,7,10,14,20';
    const C17 = '17,25,34,37,41,50,55,61,68,74,82,91,110,122,136,164,182,272';
    const ok = fail >= 30 && c5 === C5 && c17 === C17;
    T('negative control (3n−1) has teeth: ≥30/60 fail to reach 1; named cycles exact',
      ok,
      ok ? `${fail}/60 fail · cycle(5)=[${C5}] · cycle(17) 18-long matches` :
        `fail=${fail} · c5=${c5 === C5} · c17=${c17 === C17}`);
  }

  // 5. THE MAP IS THE EXPECTED MAP (the shared definition under test):
  //    next is even→/2, odd→3n+1, and is NOT the 3n−1 control.
  {
    const ok = next(2) === 1 && next(3) === 10 && next(8) === 4 && next(1) === 4 &&
               nextAlt(3) === 8 && next(3) !== nextAlt(3);
    T('the map: next(n)=n/2 | 3n+1, distinct from the 3n−1 control', ok,
      ok ? 'next(3)=10, next(8)=4 · nextAlt(3)=8 (next≠nextAlt)' : 'MAP DRIFTED');
  }

  // 6. OVERFLOW SAFETY: no in-range trajectory value exceeds MAX_SAFE_INTEGER
  //    (the justification for plain Number arithmetic). Check the peak ladder's
  //    largest peak ≤N and a dense scan of peaks.
  {
    let maxPeak = 0, over = 0;
    const M = Math.min(N, 100000);
    for (let n = 1; n <= M; n++){
      const p = trajectory(n).peak;
      if (p > maxPeak) maxPeak = p;
      if (p > Number.MAX_SAFE_INTEGER) over++;
    }
    T(`overflow-safe: max peak (n≤${M}) ≪ MAX_SAFE_INTEGER → plain Number is exact`,
      over === 0 && maxPeak <= Number.MAX_SAFE_INTEGER,
      `max peak = ${maxPeak.toLocaleString()} (cap ${Number.MAX_SAFE_INTEGER.toLocaleString()}); ${over} overflow`);
  }

  // 7. DETERMINISM / PURITY: trajectory(27) is byte-identical across two calls
  //    (no RNG, no shared mutable state).
  {
    const a = trajectory(27), b = trajectory(27);
    const ok = a.steps === b.steps && a.peak === b.peak && a.path.length === b.path.length &&
               a.path.join(',') === b.path.join(',');
    T('deterministic & pure: trajectory(27) is byte-identical across calls', ok,
      ok ? `27 → 1 in ${a.steps} steps, peak ${a.peak.toLocaleString()} (×2 identical)` : 'NON-DETERMINISTIC');
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
