// === CORE BEGIN ===
// ─────────────────────────────────────────────────────────────────────────────────────────────
//  The Giant Component — pure, dependency-free CORE (the single source of truth).
//
//  ONE IDEA. Scatter n dots on a field and rain edges onto them. As the AVERAGE DEGREE
//  ⟨k⟩ = 2·(#edges)/n rises, the dots fuse into ever-larger connected blobs. Erdős–Rényi (1959):
//  there is a SHARP THRESHOLD at ⟨k⟩ = 1. Below it every blob is tiny — the largest is O(log n) —
//  so the field stays a dust of specks. Above it a single GIANT component appears holding a Θ(n)
//  fraction S of all the dots, and S is the unique positive root of the self-consistency
//      S = 1 − e^(−⟨k⟩·S)            (the survival probability of a Poisson(⟨k⟩) branching tree).
//
//  THE SHOW IS THE NEGATIVE CONTROL. We run TWO fields fed the SAME edge count by one ⟨k⟩ knob.
//  LEFT = RANDOM wiring (edges land anywhere). RIGHT = a LATTICE (edges are short local hops on a
//  fixed √n×√n grid). Scrub up: the random field SNAPS into one continent at ⟨k⟩≈1 while the
//  lattice merely creeps. Same edges — only the wiring differs. The divergence IS the proof.
//
//  THE REVERSIBLE PROCESS (what makes the knob scrubbable both ways). For each field we fix, ONCE,
//  a seeded shuffled ordering of candidate edges. The knob value k maps to a prefix length
//  m = round(k·n/2) of that list. The live graph at ⟨k⟩ is ALWAYS the first m edges of one fixed
//  ordering — a MONOTONE process: raising k only adds edges, lowering k only removes them. We
//  rebuild union-find from the prefix each frame (trivially fast at this n), so the state is a PURE
//  FUNCTION of (ordering, m) and never of history. Drag right → edges rain in; drag left → exactly
//  those edges peel back out. Same k ⇒ same graph, every time — deterministic, history-free.
//
//  UNION-FIND (path-compression + union-by-size) is the VISIBLE engine and the sole authority on
//  component sizes; the page recolors a dot the instant its root changes. An INDEPENDENT BFS/flood
//  that shares no code cross-checks it. This module is inlined BYTE-IDENTICAL into index.html
//  between the CORE BEGIN / CORE END sentinels and exercised by core.test.mjs — page & test can
//  never drift.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// ── a tiny seeded PRNG (mulberry32): deterministic, portable, fast ────────────────────────────
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// hashSeed(str) → a 32-bit int, so a text seed ("component") maps to a reproducible stream.
function hashSeed(str){
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

// ── UNION-FIND — the VISIBLE ENGINE (path-compression + union-by-size) ─────────────────────────
// DSU(n) builds n singleton blobs. find collapses a node to its blob root (compressing the path it
// walks). union merges two blobs, hanging the SMALLER under the LARGER (so trees stay shallow) and
// tracking each root's size and a live component count. This is the single source of truth for
// component sizes: the page recolors a dot the instant union() changes its root.
class DSU{
  constructor(n){
    this.parent = new Int32Array(n);
    this.size = new Int32Array(n);
    for (let i = 0; i < n; i++){ this.parent[i] = i; this.size[i] = 1; }
    this.n = n;
    this.comps = n;                 // live component count
    this.maxSize = n > 0 ? 1 : 0;
  }
  find(x){                          // path compression (iterative — no stack blowups)
    let r = x;
    while (this.parent[r] !== r) r = this.parent[r];
    while (this.parent[x] !== r){ const nx = this.parent[x]; this.parent[x] = r; x = nx; }
    return r;
  }
  union(a, b){                      // union by size (ra is the larger root)
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[ra] < this.size[rb]){ const t = ra; ra = rb; rb = t; }
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    this.comps--;
    if (this.size[ra] > this.maxSize) this.maxSize = this.size[ra];
    return true;
  }
}

// ── ⟨k⟩  ⇄  edge-count m  (the knob's mapping) ────────────────────────────────────────────────
// average degree ⟨k⟩ = 2m / n  ⇒  m = round(k·n/2). Reversible & monotone in k.
function edgesForK(k, n){ return Math.max(0, Math.round(k * n / 2)); }
function kForEdges(m, n){ return (2 * m) / n; }

// ── THE TWO EDGE GENERATORS — the experiment & its negative control ────────────────────────────
// Both return a SHUFFLED list of candidate edges; the knob pours the first m of them as ⟨k⟩ rises.
// Both feed the SAME per-edge union process — the ONLY thing that differs is WHERE edges may land.
//
//   randomEdges(n, rng) — the experiment. Erdős–Rényi G(n,p): every candidate joins two dots
//   chosen UNIFORMLY at random, anywhere on the field (long-range wiring permitted). We emit
//   round(2.2·n) distinct candidate pairs — comfortably more than the n·k_max/2 we ever pour.
function randomEdges(n, rng){
  const want = Math.round(2.2 * n);
  const seen = new Set();
  const edges = [];
  let guard = 0;
  while (edges.length < want && guard < want * 8){
    guard++;
    let a = (rng() * n) | 0, b = (rng() * n) | 0;
    if (a === b) continue;
    if (a > b){ const t = a; a = b; b = t; }
    const key = a * n + b;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push([a, b]);
  }
  return edges;
}
//   latticeEdges(n, rng, R) — the NEGATIVE CONTROL. The dots live on a √n×√n grid; the only
//   candidate edges are SHORT LOCAL HOPS to grid neighbours within Chebyshev radius R. We SHUFFLE
//   that local candidate list with the SAME kind of rng, so the page pours the same NUMBER of
//   edges in a comparable random temporal order — the sole difference from ER is the GEOMETRIC
//   CONSTRAINT (an edge must stay local). That isolates "random long-range wiring" as the cause of
//   the snap, holding edge-count fixed.
//
// WHY a constrained-local control (not a regular ring of fixed shells): a regular ring added in
// SHELL order (all i↔i+1, then all i↔i+2 …) makes ONE long chain immediately, so its "giant" looks
// huge at tiny ⟨k⟩ — a silently misleading control that would teach the OPPOSITE of the truth.
// Pouring the SAME local candidates in SHUFFLED order reproduces the real lesson: a low-dimensional
// lattice has NO sharp giant-component threshold near ⟨k⟩=1 (2-D bond percolation only spans near
// mean degree ≈ 2, and even then the spanning cluster grows CONTINUOUSLY, with no O(log n)→Θ(n)
// discontinuity). The largest blob climbs smoothly and lags the random field badly through the
// whole neighbourhood of the threshold.
function latticeEdges(n, rng, R){
  R = R || 1;
  const side = Math.max(1, Math.round(Math.sqrt(n)));
  const idx = (r, c) => r * side + c;
  const edges = [];
  const seen = new Set();
  for (let r = 0; r < side; r++){
    for (let c = 0; c < side; c++){
      const a = idx(r, c);
      if (a >= n) continue;
      for (let dr = -R; dr <= R; dr++){
        for (let dc = -R; dc <= R; dc++){
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= side || nc >= side) continue;
          const b = idx(nr, nc);
          if (b >= n) continue;
          const lo = Math.min(a, b), hi = Math.max(a, b);
          const key = lo * n + hi;
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push([lo, hi]);
        }
      }
    }
  }
  // Fisher–Yates shuffle the local candidates so edges arrive in a comparable random temporal order.
  for (let i = edges.length - 1; i > 0; i--){
    const j = (rng() * (i + 1)) | 0;
    const t = edges[i]; edges[i] = edges[j]; edges[j] = t;
  }
  return edges;
}

// ── build the graph state at a given prefix length m of an edge ordering ───────────────────────
// Returns the DSU plus the per-node root and the giant root, so the renderer can paint each dot by
// which blob it's in. DSU is rebuilt from scratch for the prefix — which is what makes the knob
// reversible: state is a PURE FUNCTION of (ordering, m), never of history.
function buildAt(edges, m, n){
  const dsu = new DSU(n);
  const mm = Math.min(m, edges.length);
  for (let e = 0; e < mm; e++){
    const pair = edges[e];
    dsu.union(pair[0], pair[1]);
  }
  let giantRoot = -1, best = -1;
  const roots = new Int32Array(n);
  for (let i = 0; i < n; i++){
    const r = dsu.find(i); roots[i] = r;
    if (dsu.size[r] > best){ best = dsu.size[r]; giantRoot = r; }
  }
  return { dsu, roots, giantRoot, giantSize: best, comps: dsu.comps, m: mm };
}

// largest(edges, m, n) → the size of the biggest component at prefix m (the meter's authority).
function largest(edges, m, n){ return buildAt(edges, m, n).giantSize; }
// components(edges, m, n) → the live number of connected components at prefix m.
function components(edges, m, n){ return buildAt(edges, m, n).comps; }
// giantFraction(edges, m, n) → S, the giant's mass as a fraction of n (drives the meter & ribbon).
function giantFraction(edges, m, n){ return n > 0 ? buildAt(edges, m, n).giantSize / n : 0; }

// ── THE PREDICTED GIANT FRACTION — the self-consistency root S = 1 − e^(−k·S) ──────────────────
// For k ≤ 1 the only root in [0,1] is S = 0 (the subcritical phase — no giant). For k > 1 there is
// a UNIQUE positive root, found by a damped fixed-point iteration (a contraction on (0,1]). This is
// the curve the measured random giant must track above threshold, and the faint shadow the page
// draws. It is EXACT in the n→∞ limit; on a finite field the measured S lands in a tolerance band.
function predictedS(k){
  if (k <= 1) return 0;
  let S = 0.5;
  for (let i = 0; i < 400; i++){
    const next = 1 - Math.exp(-k * S);
    S = 0.5 * S + 0.5 * next;       // damped — guaranteed convergence to the positive fixed point
  }
  return S;
}

// ── THE INDEPENDENT ORACLE — a BFS/flood cross-check of union-find ─────────────────────────────
// floodMaxComponent builds an adjacency list from the first m edges and flood-fills with an
// explicit stack (NO union-find), returning the largest connected-component size and the component
// count. The test asserts this EXACTLY equals union-find's report for the SAME prefix — two
// independent algorithms agreeing is the proof that the VISIBLE engine reports true sizes.
function floodMaxComponent(edges, m, n){
  const adj = Array.from({ length: n }, () => []);
  const mm = Math.min(m, edges.length);
  for (let e = 0; e < mm; e++){
    const pair = edges[e]; adj[pair[0]].push(pair[1]); adj[pair[1]].push(pair[0]);
  }
  const seen = new Uint8Array(n);
  let max = 0, compCount = 0;
  const stack = [];
  for (let s = 0; s < n; s++){
    if (seen[s]) continue;
    compCount++;
    let sz = 0; stack.length = 0; stack.push(s); seen[s] = 1;
    while (stack.length){
      const u = stack.pop(); sz++;
      const nbrs = adj[u];
      for (let i = 0; i < nbrs.length; i++){ const v = nbrs[i]; if (!seen[v]){ seen[v] = 1; stack.push(v); } }
    }
    if (sz > max) max = sz;
  }
  return { max, comps: compCount };
}
// === CORE END ===

export {
  mulberry32, hashSeed,
  DSU, edgesForK, kForEdges,
  randomEdges, latticeEdges,
  buildAt, largest, components, giantFraction,
  predictedS, floodMaxComponent
};
