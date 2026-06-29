// ============================================================================
//  THE CONSERVATORY · SCHELLING'S TIPPING TOWN  —  core math (single source of truth).
//
//  THE ONE IDEA.  Lay out a town of two resident colours on a grid of lots, ~10% of
//  them vacant.  Every resident has a MILD wish: it is content as long as at least a
//  fraction `tol` of its OCCUPIED Moore-8 neighbours share its colour.  Set the wish
//  low — tol = ⅓, "I just want one neighbour in three to be like me" — start from a
//  random salt-and-pepper mix, and let every UNHAPPY resident relocate.  The town
//  AVALANCHES into near-total apartheid: the settled segregation index (mean same-
//  colour-neighbour share) climbs to ~0.75, FAR above anyone's ⅓ wish.  The macro
//  outcome is far harsher than any individual's mild preference.  (Schelling 1971.)
//
//  TWO MOVE RULES — and they carry DIFFERENT claims, kept honestly separate:
//
//   • RANDOM-RELOCATION (the headline living sim).  An unhappy resident hops to a
//     RANDOM empty lot, accepted regardless of whether it is happier there.  This is
//     the classic Schelling dynamic and the one the board animates.  Its march to
//     near-total segregation is a MODELED, MEASURED observation — we run a bounded
//     number of sweeps and READ the settled index; we claim NO guaranteed halt and
//     NO global-monotone convergence under these arbitrary moves.
//
//   • SATISFIED-SWAP (the rigorous mode).  An unhappy resident moves only to an empty
//     lot where its like-COUNT strictly increases (b′ > a).  THIS rule provably HALTS.
//
//  THE HALTING ARGUMENT (exact — for the satisfied-swap rule ONLY).
//    Let Φ(grid) = total number of unordered same-colour Moore-8 adjacent pairs.  Φ is
//    a non-negative INTEGER bounded above by E = the total number of Moore-8 adjacent
//    cell-pairs in the grid — a fixed constant independent of the colouring,
//        E = 4·W·H − 3·W − 3·H + 2   (honest edges; verified by brute count).
//    LEMMA (single-move potential identity).  Relocating one resident of colour c from
//    occupied lot u to empty lot v changes Φ by EXACTLY Δ = b′ − a, where a = #same-
//    colour occupied neighbours of u (current config) and b′ = #same-colour occupied
//    neighbours of v with u vacated.  PROOF: the only same-colour pairs created or
//    destroyed touch the moving resident — it loses its a pairs at u and gains b′ at v
//    (computing b′ with u vacated handles the case u,v adjacent); every other pair is
//    untouched.  ∎  (The self-test verifies Δ===b′−a to the integer over thousands of
//    seeded single moves, including adjacent u,v.)
//    Therefore each ACCEPTED satisfied-swap move (b′ > a) raises Φ by b′−a ≥ 1.  A
//    strictly increasing integer sequence bounded above by E is finite ⇒ only finitely
//    many accepted moves ⇒ GUARANTEED HALT.  ∎
//    General-move convergence (the random rule) is the SOFTER, modeled part — NOT a
//    theorem and never claimed as one.
//
//  THE NEG-CONTROL (segregation is BORN of the wish, not the colours).  Set tol = 0:
//    nobody is ever unhappy, ZERO residents move, the random mix stays put and the
//    segregation index holds at ≈ 0.5.  The starkness is the preference's doing — take
//    the preference away and the colours stay perfectly mixed.
//
//  Everything here is pure: no DOM, no network.  The Conservatory landing's planter-
//  light AND the bench BOTH import this file, so they can never drift apart.
// ============================================================================

// ===== SCHELLING CORE (byte-identical to core.mjs) =====
// P — the SINGLE source of truth for the town's constants & test bands, shared by the
// engine, the self-test, and the page's tolerance ribbon (gene-jar / drift-jar precedent).
const P = {
  W: 42, H: 42,            // default town size (honest edges, Moore-8 — no wraparound)
  EMPTY_FRAC: 0.10,        // fraction of vacant lots in a fresh town
  MIX: 0.5,                // colour-A share among residents (50/50 ⇒ neg-control sits at 0.5)
  TOL_DEFAULT: 0.33,       // the mild wish: happy iff like-share ≥ 1/3
  SEG_NEG_BAND: 0.04,      // |index − 0.5| tolerance for the neg-control (measured maxdev ≤ 0.021)
  SEG_SETTLE_MIN: 0.70,    // headline: settled index exceeds this (measured ≈ 0.75)
  MAX_SWEEPS: 400,         // safety cap (satisfied rule provably halts in ~10 sweeps; random is modeled)
};
const EMPTY = 0, A = 1, B = 2;   // lot states: vacant / colour-A / colour-B

// ── the seedable xorshift32 PRNG — BYTE-IDENTICAL to the gene-jar / drift-jar / pond /
//    selection-jar benches.  s = (0x2545F491 ^ seed) >>> 0; xorshift; returns [0,1).
function makeRng(seed = 1) {
  let s = (0x2545F491 ^ (seed >>> 0)) >>> 0;
  return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ── geometry: the honest Moore-8 neighbour index lists (no wraparound; corners have 3,
//    edges 5, interior 8).  Precomputed once per town as an array-of-arrays of indices.
function buildNeighbours(W, H) {
  const NB = new Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const list = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      list.push(ny * W + nx);
    }
    NB[y * W + x] = list;
  }
  return NB;
}

// edgeCount(W,H): E = total Moore-8 adjacent cell-pairs = 4WH − 3W − 3H + 2 (closed form,
// the Φ upper bound).  Derivation: H(W−1) horizontal + W(H−1) vertical + 2(W−1)(H−1) diagonal.
function edgeCount(W, H) { return 4 * W * H - 3 * W - 3 * H + 2; }

// ── per-lot reads (all pure, given grid + neighbour list) ──────────────────
// likeCount(i,c): #occupied neighbours of lot i that share colour c.
function likeCount(grid, NB, i, c) {
  let like = 0; const nb = NB[i];
  for (let k = 0; k < nb.length; k++) if (grid[nb[k]] === c) like++;
  return like;
}
// occupiedNeighbours(i): #neighbours of lot i that are not vacant.
function occupiedNeighbours(grid, NB, i) {
  let occ = 0; const nb = NB[i];
  for (let k = 0; k < nb.length; k++) if (grid[nb[k]] !== EMPTY) occ++;
  return occ;
}
// likeFraction(i,c): like-share among OCCUPIED neighbours.  A lot with NO occupied
// neighbours is defined content (fraction 1) — it has no one to be unlike.
function likeFraction(grid, NB, i, c) {
  let like = 0, occ = 0; const nb = NB[i];
  for (let k = 0; k < nb.length; k++) { const v = grid[nb[k]]; if (v !== EMPTY) { occ++; if (v === c) like++; } }
  return occ === 0 ? 1 : like / occ;
}
// likeCountExcluding(v,c,u): #colour-c occupied neighbours of v, ignoring lot u (used to
// score a candidate destination while u still visibly holds its resident — gives b′).
function likeCountExcluding(grid, NB, v, c, u) {
  let like = 0; const nb = NB[v];
  for (let k = 0; k < nb.length; k++) { const j = nb[k]; if (j === u) continue; if (grid[j] === c) like++; }
  return like;
}

// ── town-wide metrics ──────────────────────────────────────────────────────
// potential(grid): Φ = total unordered same-colour Moore-8 adjacent pairs (each once).
function potential(grid, NB) {
  let phi = 0;
  for (let i = 0; i < grid.length; i++) {
    const c = grid[i]; if (c === EMPTY) continue;
    const nb = NB[i];
    for (let k = 0; k < nb.length; k++) { const j = nb[k]; if (j > i && grid[j] === c) phi++; }
  }
  return phi;
}
// segregationIndex(grid): mean same-colour-neighbour share over occupied lots that have
// at least one occupied neighbour (lots with none are undefined and excluded).
function segregationIndex(grid, NB) {
  let sum = 0, n = 0;
  for (let i = 0; i < grid.length; i++) {
    const c = grid[i]; if (c === EMPTY) continue;
    let like = 0, occ = 0; const nb = NB[i];
    for (let k = 0; k < nb.length; k++) { const v = grid[nb[k]]; if (v !== EMPTY) { occ++; if (v === c) like++; } }
    if (occ === 0) continue;
    sum += like / occ; n++;
  }
  return n === 0 ? 0 : sum / n;
}
// unhappyCells(grid,tol): indices of occupied lots whose like-fraction < tol.
function unhappyCells(grid, NB, tol) {
  const out = [];
  for (let i = 0; i < grid.length; i++) {
    const c = grid[i]; if (c === EMPTY) continue;
    if (likeFraction(grid, NB, i, c) < tol) out.push(i);
  }
  return out;
}

// ── the town & its dynamics ─────────────────────────────────────────────────
// makeTown: a fresh seeded town.  rule ∈ {'random','satisfied'}.  Carries its own RNG
// stream so successive steps stay deterministic for a fixed (seed, params).
function makeTown({ W = P.W, H = P.H, emptyFrac = P.EMPTY_FRAC, mix = P.MIX,
                    tol = P.TOL_DEFAULT, rule = 'random', seed = 1 } = {}) {
  const rng = makeRng(seed);
  const N = W * H;
  const grid = new Int8Array(N);
  const empties = [];
  for (let i = 0; i < N; i++) {
    if (rng() < emptyFrac) { grid[i] = EMPTY; empties.push(i); }
    else grid[i] = rng() < mix ? A : B;
  }
  const NB = buildNeighbours(W, H);
  return {
    W, H, grid, NB, empties, rng, seed, tol, rule,
    occupied: N - empties.length,
    queue: [], qpos: 0, sweeps: 0, movesThisSweep: 0, totalMoves: 0, halted: false,
  };
}

function shuffleInPlace(arr, rng) {
  for (let k = arr.length - 1; k > 0; k--) { const r = (rng() * (k + 1)) | 0; const t = arr[k]; arr[k] = arr[r]; arr[r] = t; }
}

// chooseDest(town,u,c,a): pick a destination among empties for resident c leaving u.
// Returns { pos, v, b } (pos = index into empties, v = lot, b = like-count at v with u
// vacated) or { pos: -1 } if no admissible move.  'random' takes any empty; 'satisfied'
// takes a random empty where b > a (strict like-count improvement ⇒ Φ rises by ≥ 1).
function chooseDest(town, u, c, a) {
  const { empties, grid, NB, rng, rule } = town;
  if (empties.length === 0) return { pos: -1 };
  if (rule === 'random') {
    const pos = (rng() * empties.length) | 0;
    const v = empties[pos];
    return { pos, v, b: likeCountExcluding(grid, NB, v, c, u) };
  }
  // satisfied: collect strictly-improving empties, pick one uniformly at random
  const cand = [];
  for (let e = 0; e < empties.length; e++) {
    const v = empties[e];
    if (likeCountExcluding(grid, NB, v, c, u) > a) cand.push(e);
  }
  if (cand.length === 0) return { pos: -1 };
  const pos = cand[(rng() * cand.length) | 0];
  const v = empties[pos];
  return { pos, v, b: likeCountExcluding(grid, NB, v, c, u) };
}

// stepOnce(town): advance the simulation by ONE atomic resident relocation (the unit the
// board animates and the unit the halting argument is about).  Re-derives the unhappy
// queue (seeded-shuffled) at each sweep boundary.  Returns one of:
//   { kind:'move', from, to, colour, a, b, dPhi }  — a relocation happened (dPhi = b − a)
//   { kind:'stay', cell, a }                       — unhappy but no admissible destination
//   { kind:'skip', cell }                          — became happy / vacated mid-sweep
//   { kind:'halt' }                                — a full sweep moved nobody: settled
function stepOnce(town) {
  if (town.halted) return { kind: 'halt' };
  if (town.qpos >= town.queue.length) {                       // sweep boundary
    if (town.sweeps > 0 && town.movesThisSweep === 0) { town.halted = true; return { kind: 'halt' }; }
    town.queue = unhappyCells(town.grid, town.NB, town.tol);
    shuffleInPlace(town.queue, town.rng);
    town.qpos = 0; town.movesThisSweep = 0; town.sweeps++;
    if (town.queue.length === 0) { town.halted = true; return { kind: 'halt' }; }
  }
  const u = town.queue[town.qpos++];
  const c = town.grid[u];
  if (c === EMPTY) return { kind: 'skip', cell: u };
  if (likeFraction(town.grid, town.NB, u, c) >= town.tol) return { kind: 'skip', cell: u };
  const a = likeCount(town.grid, town.NB, u, c);
  const { pos, v, b } = chooseDest(town, u, c, a);
  if (pos < 0) return { kind: 'stay', cell: u, a };
  // apply: u -> v.  swap-pop empties[pos], then vacate u.
  town.grid[v] = c; town.grid[u] = EMPTY;
  town.empties[pos] = town.empties[town.empties.length - 1]; town.empties.pop();
  town.empties.push(u);
  town.movesThisSweep++; town.totalMoves++;
  return { kind: 'move', from: u, to: v, colour: c, a, b, dPhi: b - a };
}

// runToHalt(town, maxSweeps): drive stepOnce until the town settles or the sweep cap
// bites.  Returns a summary; if trace=true also records Φ after every accepted move (for
// the monotone self-test).  For the satisfied rule the town always halts well under cap.
function runToHalt(town, { maxSweeps = P.MAX_SWEEPS, trace = false } = {}) {
  const phiTrace = trace ? [potential(town.grid, town.NB)] : null;
  let strictlyIncreasing = true, minDPhi = Infinity;
  while (!town.halted && town.sweeps <= maxSweeps) {
    const r = stepOnce(town);
    if (r.kind === 'move' && trace) {
      if (r.dPhi < minDPhi) minDPhi = r.dPhi;
      const prev = phiTrace[phiTrace.length - 1];
      const now = potential(town.grid, town.NB);
      if (now < prev) strictlyIncreasing = false;             // never decreases under satisfied rule
      phiTrace.push(now);
    }
    if (r.kind === 'halt') break;
  }
  return {
    sweeps: town.sweeps, moves: town.totalMoves, halted: town.halted,
    index: segregationIndex(town.grid, town.NB), phi: potential(town.grid, town.NB),
    phiTrace, strictlyIncreasing, minDPhi: minDPhi === Infinity ? null : minDPhi,
    cappedOut: town.sweeps > maxSweeps,
  };
}

// metrics(town): the live ledger every UI facet reads each frame.
function metrics(town) {
  return {
    index: segregationIndex(town.grid, town.NB),
    phi: potential(town.grid, town.NB),
    unhappy: unhappyCells(town.grid, town.NB, town.tol).length,
    occupied: town.occupied, empty: town.empties.length,
    sweeps: town.sweeps, moves: town.totalMoves, halted: town.halted,
  };
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier).  Shared verbatim
//  between the Node twin and the in-page pill.  Returns { pass, total, checks, detail }
//  (the convention this wing's landing reads); each check is { name, pass, info }.
//  In-page defaults use modest town sizes (tens of ms); the Node twin cranks them.
// ============================================================================
function runSelfTest(opts = {}) {
  const big = opts.W || 40;                 // headline town size (Node twin passes larger)
  const satW = opts.satW || 30;             // satisfied-rule town size (the heavier scan)
  const checks = [];
  const detail = {};
  const ok = (name, cond, info) => checks.push({ name, pass: !!cond, info: info || '' });

  // (1)★ SINGLE-MOVE POTENTIAL IDENTITY — over many seeded random single moves (incl.
  //      adjacent u,v), the measured global ΔΦ equals the predicted b′−a EXACTLY.  This
  //      is the crux lemma the whole halting argument rests on.
  {
    const W = 12, H = 12; const NB = buildNeighbours(W, H);
    const rng = makeRng(99); let worst = 0, trials = 0, adj = 0;
    for (let t = 0; t < 4000; t++) {
      const g = new Int8Array(W * H), empt = [], occ = [];
      for (let i = 0; i < g.length; i++) { const r = rng(); g[i] = r < 0.15 ? EMPTY : (r < 0.575 ? A : B); (g[i] === EMPTY ? empt : occ).push(i); }
      if (!occ.length || !empt.length) continue;
      const u = occ[(rng() * occ.length) | 0], v = empt[(rng() * empt.length) | 0], c = g[u];
      const a = likeCount(g, NB, u, c);
      const before = potential(g, NB);
      const bp = likeCountExcluding(g, NB, v, c, u);
      g[v] = c; g[u] = EMPTY;
      const after = potential(g, NB);
      worst = Math.max(worst, Math.abs((bp - a) - (after - before)));
      if (NB[u].includes(v)) adj++; trials++;
    }
    detail.identityErr = worst; detail.identityAdj = adj;
    ok('(1)★ single-move identity: ΔΦ === b′−a exactly over ' + trials + ' seeded moves (' + adj + ' adjacent u,v)',
       worst === 0, worst === 0 ? 'exact to the integer (incl. adjacent u,v)' : 'VIOLATED by ' + worst);
  }

  // (2)★ SATISFIED-SWAP MONOTONE + GUARANTEED HALT — under the satisfied rule Φ never
  //      decreases, every accepted move raises it by ≥ 1, and the town HALTS far under
  //      both the sweep cap and the Φ ceiling E.  ΔΦ_total > 0.
  {
    let allOK = true, worst = '', sumSweeps = 0, n = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const town = makeTown({ W: satW, H: satW, tol: P.TOL_DEFAULT, rule: 'satisfied', seed });
      const phi0 = potential(town.grid, town.NB);
      const r = runToHalt(town, { trace: true });
      const E = edgeCount(satW, satW);
      const monotone = r.strictlyIncreasing;
      const eachUp = r.minDPhi !== null && r.minDPhi >= 1;
      const halted = r.halted && !r.cappedOut;
      const grew = r.phi > phi0;
      const underCeiling = r.phi <= E;
      if (!(monotone && eachUp && halted && grew && underCeiling)) {
        allOK = false; worst = 'seed=' + seed + ' mono=' + monotone + ' eachUp=' + eachUp + ' halted=' + halted + ' grew=' + grew + ' ≤E=' + underCeiling;
      }
      sumSweeps += r.sweeps; n++;
    }
    detail.satMeanSweeps = sumSweeps / n;
    ok('(2)★ satisfied-swap: Φ non-decreasing, every accepted move ΔΦ≥1, guaranteed halt (Φ≤E=4WH−3W−3H+2)',
       allOK, allOK ? 'all seeds halted in ~' + (sumSweeps / n).toFixed(1) + ' sweeps; Φ strictly climbs each move' : worst);
  }

  // (3)★ HEADLINE SEGREGATION (modeled/measured — NOT a theorem) — random-relocation at
  //      tol=0.33 settles a mean segregation index above SEG_SETTLE_MIN over several
  //      seeds: the macro outcome is FAR harsher than the ⅓ wish.
  {
    let sum = 0, minIdx = Infinity; const seeds = [1, 2, 3, 4, 5, 6];
    for (const seed of seeds) {
      const town = makeTown({ W: big, H: big, tol: P.TOL_DEFAULT, rule: 'random', seed });
      const r = runToHalt(town, {});
      sum += r.index; minIdx = Math.min(minIdx, r.index);
    }
    const mean = sum / seeds.length; detail.headlineMean = mean; detail.headlineMin = minIdx;
    ok('(3)★ headline (modeled): random-relocation tol=0.33 settles mean segregation index > ' + P.SEG_SETTLE_MIN,
       mean > P.SEG_SETTLE_MIN, 'mean=' + mean.toFixed(3) + ' (min seed ' + minIdx.toFixed(3) + ') vs wish 0.333');
  }

  // (4)★ NEG-CONTROL — tol=0: nobody is ever unhappy ⇒ ZERO moves, and the random mix
  //      holds at index ≈ 0.5.  Segregation is BORN of the mild wish, not the colours.
  {
    let zeroMoves = true, maxDev = 0, sum = 0; const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    for (const seed of seeds) {
      const town = makeTown({ W: big, H: big, tol: 0, rule: 'random', seed });
      const r = runToHalt(town, {});
      if (r.moves !== 0) zeroMoves = false;
      maxDev = Math.max(maxDev, Math.abs(r.index - 0.5)); sum += r.index;
    }
    const mean = sum / seeds.length; detail.negMean = mean; detail.negMaxDev = maxDev;
    ok('(4)★ neg-control: tol=0 ⇒ 0 moves and index ≈ 0.5 (|index−0.5| < ' + P.SEG_NEG_BAND + ')',
       zeroMoves && maxDev < P.SEG_NEG_BAND,
       'moves=' + (zeroMoves ? '0' : 'NONZERO') + '; mean=' + mean.toFixed(4) + ', maxdev=' + maxDev.toFixed(4));
  }

  // (5)★ Φ CEILING — the closed-form edge count E = 4WH−3W−3H+2 equals the brute Moore-8
  //      adjacent-pair count, and Φ of an all-one-colour config equals E exactly.
  {
    let formulaOK = true, boundOK = true, worst = '';
    for (const [W, H] of [[5, 5], [7, 4], [12, 12], [30, 30]]) {
      const NB = buildNeighbours(W, H);
      let brute = 0;
      for (let i = 0; i < W * H; i++) brute += NB[i].length;   // ordered adjacencies
      brute /= 2;                                              // unordered pairs
      if (brute !== edgeCount(W, H)) { formulaOK = false; worst = W + 'x' + H + ': brute=' + brute + ' formula=' + edgeCount(W, H); }
      const full = new Int8Array(W * H).fill(A);               // all one colour ⇒ Φ === E
      if (potential(full, NB) !== edgeCount(W, H)) { boundOK = false; worst = W + 'x' + H + ' all-A Φ≠E'; }
    }
    ok('(5)★ Φ ceiling: E=4WH−3W−3H+2 === brute Moore-8 pair count, and all-one-colour Φ===E',
       formulaOK && boundOK, formulaOK && boundOK ? 'closed form matches brute over 4 grids; Φ≤E' : worst);
  }

  // (6)★ SEGREGATION-INDEX ANCHOR — an all-one-colour town has index exactly 1.0 (every
  //      occupied neighbour is like), pinning the metric's top endpoint.  (The ≈0.5
  //      random anchor is pinned by the neg-control.)
  {
    const W = 16, H = 16; const NB = buildNeighbours(W, H);
    const full = new Int8Array(W * H).fill(B);
    const idx = segregationIndex(full, NB);
    detail.anchorOne = idx;
    ok('(6)★ index anchor: an all-one-colour town reads exactly 1.0', Math.abs(idx - 1) < 1e-12,
       'index=' + idx.toFixed(12));
  }

  // (7) DETERMINISM — identical (seed, params) ⇒ byte-identical settled grid AND move count.
  {
    const a = makeTown({ W: 28, H: 28, tol: P.TOL_DEFAULT, rule: 'random', seed: 4242 });
    const b = makeTown({ W: 28, H: 28, tol: P.TOL_DEFAULT, rule: 'random', seed: 4242 });
    const ra = runToHalt(a, {}), rb = runToHalt(b, {});
    const same = ra.moves === rb.moves && a.grid.length === b.grid.length &&
                 a.grid.every((v, i) => v === b.grid[i]);
    detail.deterministic = same;
    ok('(7) determinism: identical seed+params ⇒ byte-identical settled grid AND move count',
       same, same ? 'two runs identical (' + ra.moves + ' moves)' : 'DIFFER');
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}
// ===== END SCHELLING CORE =====

export {
  P, EMPTY, A, B, makeRng, buildNeighbours, edgeCount,
  likeCount, occupiedNeighbours, likeFraction, likeCountExcluding,
  potential, segregationIndex, unhappyCells,
  makeTown, shuffleInPlace, chooseDest, stepOnce, runToHalt, metrics, runSelfTest,
};
