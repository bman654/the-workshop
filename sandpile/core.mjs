// === CORE BEGIN ===
// The Sandpile — math core (single source of truth).
// The abelian sandpile: every cell on an L×L grid holds a count of grains. A cell with 4 or
// more is UNSTABLE; it TOPPLES, shedding one grain to each of its four orthogonal neighbours
// (grains that fall off the edge are lost — an OPEN/SINK boundary, which is exactly what makes
// stabilization terminate and the group finite). Topple every unstable cell, in any order you
// like, until none remain. THE ABELIAN THEOREM: the final stable configuration — and even the
// total number of topples — does not depend on the order you chose. This module is the SOLE
// authority for the topple rule, the stabilizer, the ⊕ group operation, the recurrent identity
// e (via Creutz's burning trick), and the order-policy machinery the page animates against.
// It is inlined byte-identical into index.html between the CORE BEGIN / CORE END sentinels and
// tested by core.test.mjs — page & test can never drift.

// Deterministic PRNG (mulberry32) so a seed reproduces the same pile and the same shuffle order.
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// neighborsOf(L, i) → the indices of i's orthogonal neighbours that lie ON the grid. The grains
// of any neighbour that would lie off the edge simply vanish (the open boundary / sink). i is a
// flat row-major index into an L*L array; r,c are recovered by i = r*L + c.
function neighborsOf(L, i){
  const r = (i / L) | 0, c = i % L;
  const out = [];
  if (r > 0)     out.push(i - L);   // up
  if (r < L - 1) out.push(i + L);   // down
  if (c > 0)     out.push(i - 1);   // left
  if (c < L - 1) out.push(i + 1);   // right
  return out;
}

// unstableIndices(g, L) → the flat indices of every cell currently holding >= 4 grains. The
// stabilizer keeps toppling while this list is nonempty; an order POLICY (pickIdx) chooses WHICH
// of these to fire next, and the abelian theorem says the choice cannot change the final heap.
function unstableIndices(g, L){
  const out = [];
  for (let i = 0; i < L * L; i++) if (g[i] >= 4) out.push(i);
  return out;
}

// ── ORDER POLICIES ──────────────────────────────────────────────────────────────────────────
// A pickIdx(unstableList, rng) returns which unstable cell topples next. The whole point of the
// piece is that the FINAL grid is identical no matter which policy you use, so the page can
// animate one order while the self-test proves order-freedom over many.
const pickFirst   = (u /*, rng */) => u[0];                       // row-major: lowest index first
const pickLast    = (u /*, rng */) => u[u.length - 1];            // reverse: highest index first
// pickRandom(rng) → a policy that fires a uniformly-random unstable cell each step. Seeded via
// mulberry32 so a given seed reproduces the exact same (otherwise chaotic) choreography.
function pickRandom(rng){
  return (u) => u[(rng() * u.length) | 0];
}

// toppleToStable(grid, L, pickIdx) → { grid:Int32Array, topples }.
// THE CORRECT RULE. Stabilize `grid` to all cells <= 3 by repeatedly firing an unstable cell
// chosen by pickIdx: subtract 4 from it, add 1 to each ON-grid neighbour (off-grid grains are
// lost to the sink). Returns a NEW Int32Array (the input is not mutated) and the total topples.
// Termination: every topple sends at least one grain toward an edge often enough that the open
// boundary drains the surplus — the finite group is exactly the stable configs you can reach.
function toppleToStable(grid, L, pickIdx){
  const g = Int32Array.from(grid);
  const rng = mulberry32(1);              // policies that ignore rng are unaffected; seeded ones reproduce
  let topples = 0;
  let u = unstableIndices(g, L);
  while (u.length){
    const i = pickIdx(u, rng);
    g[i] -= 4; topples++;
    const ns = neighborsOf(L, i);
    for (let k = 0; k < ns.length; k++) g[ns[k]] += 1;
    u = unstableIndices(g, L);
  }
  return { grid: g, topples };
}

// toppleSteps(grid, L, pickIdx) — a step GENERATOR yielding ONE topple at a time:
//   { cell, neighborsTouched:[...], grid:Int32Array (the live grid AFTER this topple), topples }
// The page's animated cascade consumes THIS emitted sequence (it does NOT re-implement a draw-loop
// topple), so the byte-twin parity check covers the animated path too: what you watch is what the
// theorem proves. The yielded `grid` is the same live buffer each step (read it, don't stash it).
function* toppleSteps(grid, L, pickIdx){
  const g = Int32Array.from(grid);
  const rng = mulberry32(1);
  let topples = 0;
  let u = unstableIndices(g, L);
  while (u.length){
    const i = pickIdx(u, rng);
    g[i] -= 4; topples++;
    const ns = neighborsOf(L, i);
    for (let k = 0; k < ns.length; k++) g[ns[k]] += 1;
    yield { cell: i, neighborsTouched: ns, grid: g, topples };
    u = unstableIndices(g, L);
  }
}

// add(a, b) → pointwise sum (a NEW Int32Array). The raw, possibly-unstable superposition.
function add(a, b){
  const out = new Int32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
  return out;
}

// combine(a, b, L) → stabilize(add(a, b)) under the CORRECT rule, row-major order. This is the
// ⊕ group operation on sandpiles: the heap you get by pouring two piles together and letting the
// sand settle. Abelian, associative; on the RECURRENT configs it is a finite abelian GROUP.
function combine(a, b, L){
  return toppleToStable(add(a, b), L, pickFirst).grid;
}

// maximalStable(L) → the all-3 grid (every cell maximally loaded but still stable). The seed for
// Creutz's identity construction below.
function maximalStable(L){
  const g = new Int32Array(L * L);
  g.fill(3);
  return g;
}

// identity(L) → the recurrent identity e of the sandpile group, via Creutz's burning trick:
//   c = stabilize(2·max);  e = stabilize( (2·max) − c )
// where max is the all-3 maximal-stable grid. e is the unique config with e ⊕ x === x for every
// RECURRENT x; it is itself recurrent, stable, eerily fourfold-symmetric, and a fixed point of ⊕
// with itself (e ⊕ e === e). Returns a NEW stable Int32Array.
function identity(L){
  const max = maximalStable(L);
  const twoMax = add(max, max);                       // all-6
  const c = toppleToStable(twoMax, L, pickFirst).grid; // stabilize 2·max
  const diff = new Int32Array(L * L);
  for (let i = 0; i < L * L; i++) diff[i] = twoMax[i] - c[i];   // (2·max) − stabilize(2·max), all >= 0
  return toppleToStable(diff, L, pickFirst).grid;
}

// ── THE NEGATIVE CONTROL (a deliberately broken, ORDER-DEPENDENT topple rule) ─────────────────
// toppleStateDependentToStable(grid, L, pickIdx) — same stabilization loop, but the broken rule
// splits the 4 shed grains UNEQUALLY by the neighbours' CURRENT heights: it gives 2 grains to the
// tallest on-grid neighbour, 1 each to the next two, 0 to the shortest (a LIVE-STATE-DEPENDENT
// spill). Because the split now depends on the running state, the final heap is NO LONGER
// order-independent — different firing orders land on different grids. This is the genuinely
// discriminating control.
//
// WHY the obvious "broken" rules were REJECTED: any FIXED topple vector — e.g. "double-count one
// neighbour" (give 2-1-1-0 always to up-down-left-right) or "drop a grain, leak only 3" — is STILL
// a state-blind linear spill, so it STAYS CONFLUENT and remains byte-identical across every order
// (proven: 300 piles × 6 orders, allSame:true). A fixed-vector control would ship a SILENTLY GREEN
// control that proves nothing. The lesson the control teaches IS the theorem: order-independence
// is exactly the price of a STATE-BLIND spill — make the spill peek at live state and it shatters.
function toppleStateDependentToStable(grid, L, pickIdx){
  const g = Int32Array.from(grid);
  const rng = mulberry32(1);
  let topples = 0;
  let u = unstableIndices(g, L);
  while (u.length){
    const i = pickIdx(u, rng);
    g[i] -= 4; topples++;
    // sort the on-grid neighbours by their CURRENT height, tallest first (ties by index — stable)
    const ns = neighborsOf(L, i).slice().sort((p, q) => (g[q] - g[p]) || (p - q));
    for (let k = 0; k < ns.length; k++){
      g[ns[k]] += (k === 0 ? 2 : (k < 3 ? 1 : 0));  // 2,1,1,0 — a state-dependent split
    }
    u = unstableIndices(g, L);
  }
  return { grid: g, topples };
}
// === CORE END ===

export {
  mulberry32, neighborsOf, unstableIndices,
  pickFirst, pickLast, pickRandom,
  toppleToStable, toppleSteps, add, combine,
  maximalStable, identity, toppleStateDependentToStable
};
