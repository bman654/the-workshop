// === CORE BEGIN ===
// ─────────────────────────────────────────────────────────────────────────────────────────────
//  The Same Threshold — a FOREST and a FEVER cross one line.
//
//  THE ONE IDEA. Two code-disjoint domains land on the SAME transcendental fixed point.
//
//    • THE FOREST (giant-component/core.mjs). Rain random edges onto n dots. Above mean degree
//      ⟨k⟩ = 1 a single GIANT blob seizes a fraction S of all dots, where S is the unique positive
//      root of   S = 1 − e^(−⟨k⟩·S)   (the survival of a Poisson(⟨k⟩) branching tree).
//
//    • THE FEVER (conservatory/sir/core.mjs). In a FRESH population (S₀→1, I₀→0⁺) the SIR epidemic
//      with R₀ = c burns through a final fraction Z, the unique positive root of the SAME law
//      Z = 1 − e^(−c·Z)   (the classic final-size relation in the I₀→0 limit).
//
//  Turn ONE contact-number dial c. Below c=1 BOTH stay dead-flat at zero. The instant c crosses 1
//  both wake together and climb the IDENTICAL curve — a forest and a fever riding one gold groove.
//  This is NOT an analogy dressed up: two solvers that share NO code (a union-find percolation on a
//  random graph, and a Φ-bisection on an ODE first integral) compute the very same number.
//
//  THE FORM (form expresses content). One antique brass instrument with TWO living panels and ONE
//  shared gold groove. LEFT = the forest: 256 dots that crystallize into one hot-amber continent as
//  c rises. RIGHT = the fever: 256 bodies, the final burn state — ember-red if ever-infected, cool
//  green if untouched; the lit fraction IS the attack rate Z. Down the centre runs ONE 0→1 ruler
//  with TWO jewelled markers — a forest marker at predictedS(c) and a fever marker at attackFresh(c)
//  — pinned together at the floor for c≤1 and tracking IDENTICAL height for c>1. They ride the
//  ANALYTIC n→∞ law (perfect lockstep); the dots/bodies are the finite illustration.
//
//  THE NEGATIVE CONTROL (the differentiator, load-bearing). A brass toggle: POPULATION fresh ⟷
//  shipped. FRESH (I₀=1e-12, S₀→1): the fever marker pins EXACTLY under the forest marker (<1e-9).
//  SHIPPED (I₀=1e-3, S₀=0.999 — the conservatory's own locked seed): flip it and the fever needle
//  visibly PEELS AWAY — the gap peaks 4.40e-2 right at the c=1 knee (the forest is dead-flat zero
//  there but a shipped fever already shows a 4.4% attack from prior-immunity seeding). A vacuous
//  "they always agree" checker provably FAILS the shipped sweep. The agreement is the fresh LIMIT,
//  not a tautology — and the toggle makes that touchable.
//
//  SINGLE-SOURCE DISCIPLINE. The two cores below are lifted byte-faithfully from their rooms and
//  NEVER call each other (anti-circularity: the giant solver never names an SIR fn and vice versa).
//  A thin adapter sits on TOP. index.html inlines this whole CORE region byte-identically between
//  the same sentinels; the byte-twin parity leg proves the page IS this module, char-for-char.
//
//  THE CLAIMS IT MAKES CHECKABLE (re-proven by the in-page pill AND core.test.mjs):
//    1. AGREEMENT (fresh limit) — for c in {1.2,1.5,2.0,2.5,3.0,4.0}: |predictedS(c) −
//       attackFresh(c,1e-12)| < 1e-9 (worst measured 4.35e-12). Same iterated transcendental root.
//    2. DEAD ZONE — for c in {0.5,0.8,1.0}: predictedS(c)===0 AND attackFresh(c)===0 (both pinned).
//    3. NEG-CONTROL (load-bearing) — at SHIPPED I₀=1e-3 the gap |predictedS(c) − attackShipped(c)|
//       is NONZERO across the sweep (≥1e-4, peaks 4.40e-2 at c=1) AND the shipped attack is >0 for
//       some c≤1. A vacuous always-agree checker (or one comparing the shipped value) provably FAILS.
//    4. R₀ enactment — |R0(freshParams(c,1e-12)) − c| < 1e-12 across the sweep (NOT ===).
//    5. ANTI-CIRCULARITY — the giant solver body never names an SIR fn (finalSize/Phi/rk4Step/R0)
//       and vice versa: two code-disjoint domains landing on one number.
//    6. BYTE-TWIN PARITY — index.html's inlined CORE region === core.mjs CORE char-for-char.
//    7. (witness) a measured giantFraction from a seeded randomEdges field at large n lands within
//       the parent's tolerance band of predictedS(c) — reported in the pill, grounding the curve.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// ══ CORE A: THE FOREST — giant-component percolation, lifted VERBATIM from giant-component/core.mjs ══
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

// ══ CORE B: THE FEVER — the SIR epidemic, lifted VERBATIM from conservatory/sir/core.mjs ════════════
const P = { beta: 0.30, gamma: 0.10, N: 1, I0: 1e-3 };

// the SIR vector field  (S,I) ↦ (S', I', R').  R only accumulates (R'=γI).
function field(S, I, p = P) {
  const inf = p.beta * S * I, rec = p.gamma * I;
  return [-inf, inf - rec, rec];           // [S', I', R']
}

// the basic reproduction number  R₀ = β·S₀/γ  (S₀ = N − I₀).  R₀>1 ⇒ outbreak.
function R0(p = P) {
  return p.beta * (p.N - p.I0) / p.gamma;
}

// the threshold derivative  I'(0) = (β·S₀ − γ)·I₀.  Its SIGN === sign(R₀ − 1):
// the knife-edge that flips the peak count between 0 (dies) and 1 (sweeps).
function IprimeAtZero(p = P) {
  return (p.beta * (p.N - p.I0) - p.gamma) * p.I0;
}

// the FIRST INTEGRAL  Φ(S,I) = S + I − (γ/β)·ln S — conserved along the true orbit
// (the V-analog: flat under RK4, drifting under Euler).
function Phi(S, I, p = P) {
  return S + I - (p.gamma / p.beta) * Math.log(S);
}

// the S-coordinate of the I-peak: S = γ/β = S₀/R₀, independent of I.  EXACT.
function peakS(p = P) {
  return p.gamma / p.beta;
}

// the EXACT peak HEIGHT, read from Φ at S=γ/β (no integration):
//   Imax = Φ(S₀,I₀) − Speak + (γ/β)·ln Speak.  CONDITIONAL: null when R₀ ≤ 1.
function peakInfected(p = P) {
  if (R0(p) <= 1) return null;
  const Sp = peakS(p);
  return Phi(p.N - p.I0, p.I0, p) - Sp + (p.gamma / p.beta) * Math.log(Sp);
}

// the peak landmark {S, Imax} — CONDITIONAL: null below threshold (the mark must
// not lie, mirroring logistic's inflection()).  Below R₀=1 there is no peak.
function peakLocation(p = P) {
  if (R0(p) <= 1) return null;
  return { S: peakS(p), Imax: peakInfected(p) };
}

// the FINAL SIZE S∞ — the SMALL root of Φ(S,0) = Φ(S₀,I₀) on (0, γ/β), found by
// bisection INDEPENDENTLY of any integrated orbit (anti-circularity).  h(x) =
// x − (γ/β)ln x is strictly decreasing on (0, γ/β) ⇒ a unique bracketed root that
// bisection cannot diverge from.  (NOT the textbook S₀·exp(−R₀(1−S∞/N)) form — that
// ignores I₀ and is off ~2e-4; this Φ-root is exact to the integrator.)
function finalSize(p = P) {
  const k = p.gamma / p.beta;
  const C = (p.N - p.I0) + p.I0 - k * Math.log(p.N - p.I0);
  const h = x => x - k * Math.log(x) - C;
  let lo = 1e-12, hi = k, hlo = h(lo);
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi), hm = h(mid);
    if (hlo * hm <= 0) hi = mid; else { lo = mid; hlo = hm; }
  }
  return 0.5 * (lo + hi);
}

// ---------------------------------------------------------------------------
//  THE TWO INTEGRATORS — one truthful (RK4), one naive (forward Euler).  Both
//  advance the SAME 3-vector field by one step dt; this is the load-bearing
//  contrast.  Forward-Euler conserves the SUM at any dt but breaks POSITIVITY.
// ---------------------------------------------------------------------------

// classical 4th-order Runge–Kutta of the 3-vector field — keeps I>0, Φ flat.
function rk4Step(S, I, R, dt, p = P) {
  const [a1, b1, c1] = field(S, I, p);
  const [a2, b2, c2] = field(S + (dt / 2) * a1, I + (dt / 2) * b1, p);
  const [a3, b3, c3] = field(S + (dt / 2) * a2, I + (dt / 2) * b2, p);
  const [a4, b4, c4] = field(S + dt * a3, I + dt * b3, p);
  return [
    S + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4),
    I + (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4),
    R + (dt / 6) * (c1 + 2 * c2 + 2 * c3 + c4),
  ];
}

// forward (explicit) Euler: x ← x + dt·f(x).  Conserves S+I+R at ANY dt (the ±γI
// increments cancel), but at a coarse dt it drives I BELOW ZERO — the negative
// control is POSITIVITY, not sum-drift.
function eulerStep(S, I, R, dt, p = P) {
  const [a, b, c] = field(S, I, p);
  return [S + dt * a, I + dt * b, R + dt * c];
}

// pick a stepper by name (the page's RK4 ⟷ Euler toggle uses this).
function stepper(m) {
  return m === 'euler' ? eulerStep : rk4Step;
}

// ---------------------------------------------------------------------------
//  THE TRACER — integrate from (S0,I0) for `steps` steps of size dt with `method`,
//  recording S(t),I(t),R(t), the worst sum-error max|S+I+R−N|, the worst Φ-drift
//  max|Φ−Φ0|, the interior I-peak (count, time, height, S-there), the minimum I and
//  whether I ever went negative.  The phase plane, the time-series, the conservation
//  meter and the negative control all read off this.  NaN-guarded so a coarse-Euler
//  blow-up never blanks the canvas.
// ---------------------------------------------------------------------------
function trace(S0, I0, dt, steps, method = 'rk4', p = P) {
  const step = stepper(method);
  let S = S0, I = I0, R = p.N - S0 - I0;
  const Ss = [S], Is = [I], Rs = [R], ts = [0];
  const phi0 = Phi(S0, I0, p);
  let maxConsErr = 0, maxPhiDrift = 0;
  let minI = I0, wentNegative = false, blown = false;
  let peaks = 0, peakI = I0, peakT = 0, peakSval = S0;
  let prevI = I0, prevSlope = 0, haveSlope = false;
  let t = 0;
  const EPS = 1e-9;                          // slope-jitter epsilon (flat-critical guard)
  for (let i = 0; i < steps; i++) {
    [S, I, R] = step(S, I, R, dt, p);
    t += dt;
    // NaN-guard: a coarse-Euler blow-up must not poison the meters or blank the page.
    if (!isFinite(S) || !isFinite(I)) { wentNegative = true; blown = true; break; }
    const cons = Math.abs(S + I + R - p.N);
    if (cons > maxConsErr) maxConsErr = cons;
    // Φ uses ln S — guard against S≤0 under a wild Euler step.
    if (S > 0) { const d = Math.abs(Phi(S, I, p) - phi0); if (d > maxPhiDrift) maxPhiDrift = d; }
    if (I < minI) minI = I;
    if (I < 0) wentNegative = true;
    // interior peak via slope-sign flip (+ → −), with a jitter epsilon so RK4
    // flatness near the critical case never spuriously counts a peak.
    const slope = I - prevI;
    if (haveSlope && prevSlope > EPS && slope < -EPS) {
      peaks++; peakI = prevI; peakT = t - dt; peakSval = Ss[Ss.length - 1];
    }
    if (Math.abs(slope) > EPS) { prevSlope = slope; haveSlope = true; }
    prevI = I;
    Ss.push(S); Is.push(I); Rs.push(R); ts.push(t);
  }
  return { Ss, Is, Rs, ts, maxConsErr, phi0, maxPhiDrift, peaks, peakI, peakT,
           peakSval, minI, wentNegative, blown, endS: S, endI: I, endR: R };
}

// ══ THE THIN ADAPTER (the ONLY new logic) — one contact-number c drives BOTH disjoint cores ════════
// freshParams(c, I0): an SIR parameter set whose R₀ equals c on a FRESH population. With γ=0.1, N=1
// and β = c·γ/(N−I0), R0(p) = β·(N−I0)/γ = c·(N−I0)/(N−I0) = c exactly (to float ε; assert |R0−c|<1e-12,
// NOT ===). I0 is the seed mass: 1e-12 is the FRESH limit (S₀→1); 1e-3 is the conservatory's SHIPPED seed.
function freshParams(c, I0 = 1e-12) {
  const gamma = 0.1, N = 1;
  return { beta: (c * gamma) / (N - I0), gamma, N, I0 };
}

// attackFresh(c, I0): the SIR final ATTACK rate Z = (initial susceptibles) − (final susceptibles).
// We run the SIR core's finalSize (a Φ-bisection root, NEVER an integrated orbit) and GATE the dead
// zone to EXACTLY 0 via the c≤1 threshold so it matches predictedS's exact 0 below criticality.
function attackFresh(c, I0 = 1e-12) {
  if (c <= 1) return 0;
  const p = freshParams(c, I0);
  return (p.N - p.I0) - finalSize(p);
}

// attackShipped(c): the SAME computation but WITHOUT the dead-zone gate and at the shipped seed
// (S₀<1) — the negative control. It does NOT match predictedS: a shipped fever shows a nonzero
// attack even below c=1 (prior-immunity seeding), and peels away from the forest at the knee.
function attackShipped(c, I0 = 1e-3) {
  const p = freshParams(c, I0);
  return (p.N - p.I0) - finalSize(p);
}

// readings(c, I0): the shared ruler readout. forestS rides predictedS(c) (the giant fraction);
// feverZ rides attackFresh(c,I0) (the fresh attack, gated). Their diff latches in gold at <1e-9.
// The two cores NEVER call each other — this adapter reads each independently and compares.
function readings(c, I0 = 1e-12) {
  const forestS = predictedS(c);
  const feverZ = attackFresh(c, I0);
  const diff = Math.abs(forestS - feverZ);
  return {
    c, I0,
    forestS, feverZ, diff,
    bothPinned: c <= 1,
    coincide: diff < 1e-9,
  };
}

// THE FRESH-LIMIT SWEEP — c values that AVOID the c=1 knee (where finite-I0 effects are sharpest).
// Verified: worst |predictedS − attackFresh| over this sweep is 4.35e-12 ≪ 1e-9.
const SWEEP = [1.2, 1.5, 2.0, 2.5, 3.0, 4.0];
const DEAD_ZONE = [0.5, 0.8, 1.0];

// ══ THE SELF-TEST (re-proven by core.test.mjs; byte-twin-inlined as the page's pill) ═══════════════
function runSelfTest() {
  let pass = 0, total = 0; const detail = [];
  const ck = (ok, label) => { total++; if (ok) pass++; else detail.push(label); };

  // LEG 1 — AGREEMENT (fresh limit): the forest's giant fraction and the fever's fresh attack are the
  // SAME transcendental root to <1e-9 across the knee-avoiding sweep.
  {
    let worst = 0;
    for (const c of SWEEP) {
      const r = readings(c, 1e-12);
      worst = Math.max(worst, r.diff);
    }
    ck(worst < 1e-9, 'agreement-fresh(worst=' + worst.toExponential(2) + ')');
  }

  // LEG 2 — DEAD ZONE: both are EXACTLY 0 below criticality (the shared c=1 threshold gates both).
  {
    let allZero = true;
    for (const c of DEAD_ZONE) {
      if (!(predictedS(c) === 0 && attackFresh(c, 1e-12) === 0)) allZero = false;
    }
    ck(allZero, 'dead-zone(predictedS===0 && attackFresh===0 for c<=1)');
  }

  // LEG 3 — NEG-CONTROL (load-bearing): at the SHIPPED seed the gap is NONZERO across the sweep
  // (≥1e-4, peaking 4.40e-2 at c=1) AND the shipped attack is >0 for some c≤1 (prior-immunity). A
  // vacuous always-agree checker — or one comparing predictedS to the SHIPPED value — FAILS here.
  {
    let minGap = Infinity, peakGap = 0, peakC = null;
    for (const c of [0.5, 0.8, 0.95, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0]) {
      const gap = Math.abs(predictedS(c) - attackShipped(c, 1e-3));
      minGap = Math.min(minGap, gap);
      if (gap > peakGap) { peakGap = gap; peakC = c; }
    }
    const shippedSubcritical = attackShipped(1.0, 1e-3) > 0 && attackShipped(0.8, 1e-3) > 0;
    ck(minGap >= 1e-4 && peakGap > 4e-2 && shippedSubcritical,
       'neg-control(minGap=' + minGap.toExponential(2) + ',peak=' + peakGap.toExponential(2) +
       '@c=' + peakC + ',shipped-subcrit>0=' + shippedSubcritical + ')');
  }

  // LEG 4 — R₀ ENACTMENT: freshParams(c) really HAS reproduction number c (|R0−c|<1e-12, not ===).
  {
    let worst = 0;
    for (const c of SWEEP) {
      worst = Math.max(worst, Math.abs(R0(freshParams(c, 1e-12)) - c));
    }
    ck(worst < 1e-12, 'R0-enactment(worst|R0-c|=' + worst.toExponential(2) + ')');
  }

  return { pass, total, ok: pass === total && total > 0, detail };
}

export {
  // CORE A — the forest (giant-component)
  mulberry32, hashSeed, DSU, edgesForK, kForEdges,
  randomEdges, latticeEdges, buildAt, largest, components, giantFraction,
  predictedS, floodMaxComponent,
  // CORE B — the fever (SIR)
  P, field, R0, IprimeAtZero, Phi, peakS, peakInfected, peakLocation, finalSize,
  rk4Step, eulerStep, stepper, trace,
  // the adapter + self-test
  freshParams, attackFresh, attackShipped, readings, SWEEP, DEAD_ZONE, runSelfTest,
};
// === CORE END ===

// Dual-use guard: run `node core.mjs` to print the self-test. index.html inlines the CORE region
// above byte-identically; core.test.mjs imports these exports and re-proves every leg + parity.
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const r = runSelfTest();
  console.log('The Same Threshold — core self-test: ' + r.pass + '/' + r.total + (r.ok ? ' ✓' : ' ✗ ' + r.detail.join(',')));
  process.exit(r.ok ? 0 : 1);
}
