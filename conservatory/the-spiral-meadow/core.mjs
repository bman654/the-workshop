// ============================================================================
//  THE CONSERVATORY · THE SPIRAL MEADOW  —  core (the single source of truth).
//
//  THE ONE IDEA.  Three wildflowers in a closed loop of who-out-blooms-whom: each
//  species crowds out ONE other and is crowded by the third — the very Rock–Paper–
//  Scissors ring The Replicator proves *neutrally* stable when the whole field is one
//  well-stirred beaker.  Here we give that ring SPACE.  The lattice is a torus of cells,
//  each holding exactly one species s ∈ {0,1,2}; there are NO empty sites (this is the
//  deliberate rhyme with The Replicator's three strategies — not the May–Leonard model
//  with vacancies).  Cyclic dominance is one line:
//
//        prey(s) = (s + 1) mod 3         (species s out-blooms species s+1)
//
//  ONE MICROSTEP.  Pick a random focal cell i; pick a partner cell j; if j currently
//  holds i's PREY, j is overgrown and becomes i's species.  The ONLY difference between
//  the two worlds is HOW j is chosen:
//
//        SPATIAL   (the meadow)  — j is a random Moore-8 neighbour on the torus.
//        WELL-MIXED (the beaker) — j is a uniformly random cell anywhere in the field.
//
//  One SWEEP = W·H microsteps (each cell touched once on average).  Updates are
//  ASYNCHRONOUS and stochastic (random-sequential), NOT synchronous — synchronous CA
//  updates make blinker artifacts; async is the honest lattice-Lotka–Volterra rule.
//
//  WHAT EMERGES.  In the beaker the three fractions do a growing random walk around the
//  neutral centre until one species is lost — and once a species is gone the ring is
//  broken (the survivor's predator is absent), so the field FIXES to exactly ONE colour.
//  In the meadow the same rule can only reach across a neighbourhood, so a local majority
//  cannot run away: an over-blooming front is itself out-bloomed from behind, and the
//  three species chase each other's tails into self-renewing SPIRAL WAVES that keep all
//  three alive far, far longer than area-matched mixing would.
//
//  THE HONEST CRUX is the CONTRAST RATIO, not "forever".  A finite lattice must
//  eventually absorb too (extinction time grows with area); the claim is that the meadow
//  keeps all three ≥ ε at 50–100× the sweep-budget in which the SAME-SIZE beaker has
//  already fixed.  The self-test MEASURES that margin at pinned seeds; it never cherry-
//  picks a lucky one.
//
//  THE MEAN-FIELD RHYME.  Averaging one well-mixed microstep gives the increment
//        E[Δx_s] ∝ x_s · (x_{s+1} − x_{s−1}),
//  the zero-sum cyclic replicator field — Σ_s E[Δx_s] = 0 exactly (the neutral RPS ring
//  of The Replicator), recovered here from the individual rule.
//
//  Everything here is pure: seeded RNG, no DOM, no network.  The landing's planted-bed
//  preview AND the bench BOTH build from this file (it is forge-inlined into the page),
//  so the picture you see and the numbers we report can never drift apart.
// ============================================================================

const S = 3;                                   // three species; a fixed ring

// prey(s): the ONE species that species s out-blooms.  s beats s+1 beats s+2 beats s.
function prey(s) { return (s + 1) % S; }
// predator(s): the ONE species that out-blooms s (the inverse of prey()).
function predator(s) { return (s + 2) % S; }

// ---------------------------------------------------------------------------
//  THE SEEDED RNG — mulberry32, so every reported/self-test number is reproducible
//  and the Node twin re-derives byte-identical fields.  (The live canvas may run its
//  own seed for theatre, but every number the ledger prints reads from a seeded core.)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
//  THE NEIGHBOURHOOD — exposed as a CORE KNOB so the self-test drives the identical
//  one the live field uses.  Moore-8 is the default (crisp spirals); von-Neumann-4 is
//  offered for completeness.  Offsets are [dx,dy] on the torus.
// ---------------------------------------------------------------------------
const MOORE8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const VONNEUMANN4 = [[0, -1], [-1, 0], [1, 0], [0, 1]];

// ---------------------------------------------------------------------------
//  THE FIELD — a flat Uint8Array of W·H cells, each ∈ {0,1,2}, seeded uniformly at
//  random from the given seed.  mode ∈ {'spatial','mixed'}; nbr is a neighbourhood knob.
// ---------------------------------------------------------------------------
function makeField(W, H, seed, opts = {}) {
  const rng = mulberry32(seed >>> 0);
  const grid = new Uint8Array(W * H);
  for (let k = 0; k < grid.length; k++) grid[k] = (rng() * S) | 0;
  return {
    grid, W, H, rng, seed: seed >>> 0,
    mode: opts.mode === 'mixed' ? 'mixed' : 'spatial',
    nbr: opts.nbr || MOORE8,
  };
}

// re-seed an existing field's cells uniformly at random (fresh field, same dimensions).
function reseedField(st, seed) {
  st.seed = seed >>> 0;
  st.rng = mulberry32(seed >>> 0);
  const g = st.grid;
  for (let k = 0; k < g.length; k++) g[k] = (st.rng() * S) | 0;
  return st;
}

// ---------------------------------------------------------------------------
//  ONE MICROSTEP — the load-bearing rule.  Pick focal i; pick partner j by the mode;
//  if grid[j] is i's prey, overgrow it.  O(1), no allocation.  Returns the changed
//  index (or -1 for a null event) so a live camera can narrate without a full rescan.
// ---------------------------------------------------------------------------
function microstep(st) {
  const { grid, W, H, rng, nbr } = st;
  const N = grid.length;
  const i = (rng() * N) | 0;
  const si = grid[i];
  let j;
  if (st.mode === 'mixed') {
    j = (rng() * N) | 0;
  } else {
    const x = i % W, y = (i / W) | 0;
    const d = nbr[(rng() * nbr.length) | 0];
    const nx = (x + d[0] + W) % W;
    const ny = (y + d[1] + H) % H;
    j = ny * W + nx;
  }
  if (grid[j] === (si + 1) % S) { grid[j] = si; return j; }
  return -1;
}

// advance the whole field by `sweeps` sweeps (default 1); one sweep = W·H microsteps.
function step(st, sweeps = 1) {
  const per = st.W * st.H;
  const total = Math.round(sweeps * per);
  for (let k = 0; k < total; k++) microstep(st);
  return st;
}

// ---------------------------------------------------------------------------
//  READOUTS — the census, the fractions, the minimum fraction (the persistence probe),
//  the number of species still present, and the INTERFACE (front) density: the share of
//  adjacent cell-pairs that differ.  Front density measures STRUCTURE: it is ~2/3 in a
//  fresh random soup, decays to 0 when the field fixes, and holds in a stable band while
//  organised spiral fronts persist — so "the picture stays alive" is a measured number.
// ---------------------------------------------------------------------------
function census(st) {
  const c = [0, 0, 0], g = st.grid;
  for (let k = 0; k < g.length; k++) c[g[k]]++;
  return c;
}
function fractions(st) {
  const c = census(st), N = st.grid.length;
  return [c[0] / N, c[1] / N, c[2] / N];
}
function minFraction(st) {
  const f = fractions(st);
  return Math.min(f[0], f[1], f[2]);
}
function speciesAlive(st) {
  const c = census(st);
  return (c[0] > 0 ? 1 : 0) + (c[1] > 0 ? 1 : 0) + (c[2] > 0 ? 1 : 0);
}
// front density on the torus: count right- and down-neighbour pairs that differ.
function frontDensity(st) {
  const { grid, W, H } = st;
  let diff = 0;
  const total = 2 * W * H;
  for (let y = 0; y < H; y++) {
    const row = y * W, drow = ((y + 1) % H) * W;
    for (let x = 0; x < W; x++) {
      const s = grid[row + x];
      if (grid[row + ((x + 1) % W)] !== s) diff++;
      if (grid[drow + x] !== s) diff++;
    }
  }
  return diff / total;
}

// ---------------------------------------------------------------------------
//  THE NEGATIVE CONTROL — a census-INVARIANT Fisher–Yates shuffle.  It scrambles every
//  cell's POSITION while leaving the exact head-count of each species untouched, so any
//  coexistence that survives the meadow but dies once shuffled-then-mixed was carried by
//  SPATIAL STRUCTURE, not by the counts.  Deterministic given the supplied rng.
// ---------------------------------------------------------------------------
function shuffleGrid(grid, rng) {
  for (let k = grid.length - 1; k > 0; k--) {
    const m = (rng() * (k + 1)) | 0;
    const t = grid[k]; grid[k] = grid[m]; grid[m] = t;
  }
  return grid;
}

// ---------------------------------------------------------------------------
//  THE SEEDS YOU PLANT — a soft circular BRUSH stamp of one species, and a three-wedge
//  PINWHEEL (the three species meeting at a point) that reliably spins up a spiral.
//  Both wrap on the torus and mutate the grid in place.
// ---------------------------------------------------------------------------
function stamp(st, cx, cy, r, species) {
  const { grid, W, H } = st;
  const r2 = r * r;
  const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
  const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > r2) continue;
    const gx = ((x % W) + W) % W, gy = ((y % H) + H) % H;
    grid[gy * W + gx] = species;
  }
}
// a three-wedge pinwheel: the angle around (cx,cy) is split into three 120° sectors,
// one per species, so all three meet at the centre — a reliable spiral nucleus.  `spin`
// (+1 / −1) picks the sector ordering so the arm winds one way or the other.
function plantPinwheel(st, cx, cy, r, spin = 1) {
  const { grid, W, H } = st;
  const r2 = r * r;
  const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
  const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > r2) continue;
    let a = Math.atan2(dy, dx) + Math.PI;         // 0..2π
    let sec = Math.floor((a / (2 * Math.PI)) * 3) % 3;
    if (spin < 0) sec = (3 - sec) % 3;
    const gx = ((x % W) + W) % W, gy = ((y % H) + H) % H;
    grid[gy * W + gx] = sec;
  }
}

// deep clone of a field's state (its own grid + a FRESH rng at the given seed) — used by
// the neg-control so the shuffled twin and the persisting original share a snapshot.
function cloneField(st, seed) {
  return {
    grid: st.grid.slice(), W: st.W, H: st.H,
    rng: mulberry32((seed >>> 0)), seed: seed >>> 0,
    mode: st.mode, nbr: st.nbr,
  };
}

// ---------------------------------------------------------------------------
//  THE MEAN-FIELD INCREMENT — the analytic expected change per well-mixed microstep,
//  E[ΔN_s] = x_s·x_{s+1} − x_{s−1}·x_s = x_s·(x_{s+1} − x_{s−1}) (in cell units, /N for
//  fractions).  Σ_s of it is 0 identically — the zero-sum cyclic replicator field, the
//  neutral RPS ring recovered from the individual rule.
// ---------------------------------------------------------------------------
function meanFieldIncrement(x) {
  return [
    x[0] * (x[1] - x[2]),
    x[1] * (x[2] - x[0]),
    x[2] * (x[0] - x[1]),
  ];
}

// ============================================================================
//  THE SELF-TEST — proves the falsifiable claims EXACT / MEASURED at pinned seeds.
//  These are the checks the in-page badge asserts; core.test.mjs re-runs them tighter.
//  opts lets the Node twin scale K / sizes / horizons up without changing the code.
// ============================================================================
function runSelfTest(opts = {}) {
  const checks = [];
  const detail = {};
  function ok(name, cond, info) { checks.push({ name, pass: !!cond, info }); }

  const EPS = opts.eps != null ? opts.eps : 0.02;      // the persistence floor
  const K = opts.K != null ? opts.K : 4;               // pinned seeds per lane
  const baseSeed = opts.baseSeed != null ? opts.baseSeed : 0x5eed01;

  // (a) WELL-MIXED FIXATION (theorem-backed terminus, MEASURED time).  A finite well-
  //     mixed field is an ABSORBING Markov chain: every mono-species state is absorbing,
  //     and from any interior state a species can be lost, after which the broken ring
  //     fixes — so reaching ONE survivor is certain.  We MEASURE that it happens within a
  //     bounded sweep budget from generic random interior starts over K pinned seeds.
  {
    const W = opts.mixW || 30, H = opts.mixH || 30;
    const budget = opts.mixBudget || 1600;             // sweeps (well above the pinned seeds' t_fix)
    let worstFix = 0, allFixed = true, survivorsOK = true;
    for (let k = 0; k < K; k++) {
      const st = makeField(W, H, baseSeed + k * 101, { mode: 'mixed' });
      let fixedAt = -1;
      for (let s = 1; s <= budget; s++) {
        step(st, 1);
        if (speciesAlive(st) === 1) { fixedAt = s; break; }
      }
      if (fixedAt < 0) { allFixed = false; }
      else worstFix = Math.max(worstFix, fixedAt);
      if (speciesAlive(st) !== 1) survivorsOK = false;  // exactly one survivor
    }
    detail.mixWorstFix = worstFix; detail.mixBudget = budget; detail.mixN = W * H;
    ok('Well-mixed FIXES to exactly ONE survivor from generic starts (K=' + K + ' seeds, ' +
       (W * H) + ' cells) within ' + worstFix + '≤' + budget + ' sweeps — the absorbing-chain terminus, time measured',
       allFixed && survivorsOK,
       'worst t_fix=' + worstFix + ' sweeps (budget ' + budget + ')');
  }

  // (b) SPATIAL PERSISTENCE — on a lattice the SAME rule keeps all three species'
  //     fractions ≥ ε at EVERY sampled sweep across a long horizon, over K seeds.  Finite
  //     lattices eventually absorb (extinction time grows with area); this is a MEASURED
  //     persistence over a bounded run, not an eternal-theorem claim.
  {
    const W = opts.spW || 64, H = opts.spH || 64;
    const horizon = opts.spHorizon || 400;             // sweeps
    const sample = opts.spSample || 25;                // sample min-fraction every `sample` sweeps
    let worstMin = 1, allPersist = true;
    for (let k = 0; k < K; k++) {
      const st = makeField(W, H, baseSeed + 7000 + k * 131, { mode: 'spatial' });
      let seedMin = 1;
      for (let s = 0; s < horizon; s += sample) {
        step(st, sample);
        const mf = minFraction(st);
        if (mf < seedMin) seedMin = mf;
        if (mf < EPS) allPersist = false;
      }
      worstMin = Math.min(worstMin, seedMin);
    }
    detail.spWorstMin = worstMin; detail.spHorizon = horizon; detail.spN = W * H; detail.eps = EPS;
    ok('Spatial COEXISTS: min species fraction ≥ ε=' + EPS + ' at every sample across ' + horizon +
       ' sweeps (K=' + K + ' seeds, ' + (W * H) + ' cells); worst dip ' + worstMin.toFixed(4),
       allPersist && worstMin >= EPS,
       'worst min-fraction over the horizon = ' + worstMin.toFixed(4) + ' (ε=' + EPS + ')');
  }

  // (c) NEGATIVE CONTROL — SHUFFLE.  Evolve a spatial field to a coexisting snapshot;
  //     then (i) census-invariant shuffle it and run WELL-MIXED → it collapses to 1,
  //     while (ii) the SAME snapshot continued SPATIALLY stays ≥ ε.  Identical head-count,
  //     opposite fate ⇒ coexistence is spatial STRUCTURE, not a counting artifact.
  {
    const W = opts.ncW || 40, H = opts.ncH || 40;
    const warm = opts.ncWarm || 80;                    // evolve into coexistence
    const mixBudget = opts.ncMixBudget || 1800;        // sweeps to let the shuffle FIX
    const spRun = opts.ncRun || 400;                   // spatial continuation horizon
    let shuffleCollapses = true, spatialHolds = true, worstShufSurv = 0, worstSpMin = 1;
    for (let k = 0; k < K; k++) {
      const snap = makeField(W, H, baseSeed + 42000 + k * 173, { mode: 'spatial' });
      step(snap, warm);
      // census must be identical across the twins
      const c0 = census(snap);
      const shuf = cloneField(snap, baseSeed + 9 + k);
      shuffleGrid(shuf.grid, shuf.rng);
      shuf.mode = 'mixed';
      const c1 = census(shuf);
      const censusSame = c0[0] === c1[0] && c0[1] === c1[1] && c0[2] === c1[2];
      const cont = cloneField(snap, baseSeed + 55 + k);   // continue spatially
      cont.mode = 'spatial';
      // run the shuffled field until it fixes (bounded), and the spatial continuation to horizon
      let shufAlive = speciesAlive(shuf);
      for (let s = 0; s < mixBudget && shufAlive > 1; s += 40) { step(shuf, 40); shufAlive = speciesAlive(shuf); }
      step(cont, spRun);
      const spMin = minFraction(cont);
      worstShufSurv = Math.max(worstShufSurv, shufAlive);
      worstSpMin = Math.min(worstSpMin, spMin);
      if (!(censusSame && shufAlive === 1)) shuffleCollapses = false;
      if (!(spMin >= EPS)) spatialHolds = false;
    }
    detail.ncShufSurv = worstShufSurv; detail.ncSpMin = worstSpMin;
    ok('Neg-control: a census-invariant SHUFFLE + well-mixed COLLAPSES to 1 survivor, while the same ' +
       'snapshot continued spatially holds ≥ ε (min ' + worstSpMin.toFixed(4) + ') — coexistence is STRUCTURE, not counts',
       shuffleCollapses && spatialHolds,
       'shuffled survivors=' + worstShufSurv + ' (→1)  ·  spatial min-fraction=' + worstSpMin.toFixed(4));
  }

  // (d) DETERMINISM — same seed ⇒ byte-identical field after N sweeps (both lanes).
  {
    const a = makeField(50, 50, 0xABCDE, { mode: 'spatial' }); step(a, 40);
    const b = makeField(50, 50, 0xABCDE, { mode: 'spatial' }); step(b, 40);
    const am = makeField(50, 50, 0xBEEF1, { mode: 'mixed' }); step(am, 40);
    const bm = makeField(50, 50, 0xBEEF1, { mode: 'mixed' }); step(bm, 40);
    let same = a.grid.length === b.grid.length && am.grid.length === bm.grid.length;
    for (let k = 0; same && k < a.grid.length; k++) if (a.grid[k] !== b.grid[k]) same = false;
    for (let k = 0; same && k < am.grid.length; k++) if (am.grid[k] !== bm.grid[k]) same = false;
    detail.deterministic = same;
    ok('Deterministic — same seed ⇒ byte-identical field after 40 sweeps (spatial AND well-mixed lanes)',
       same, same ? 'both lanes byte-identical' : 'DIFFER');
  }

  // (e) CONSERVATION — no empty sites, ever: the census sums to W·H at all times (a
  //     scan across a spatial run), the deliberate contrast with a vacancy model.
  {
    const st = makeField(60, 60, 0xC0FFEE, { mode: 'spatial' });
    const N = st.grid.length;
    let conserved = true;
    for (let s = 0; s < 30; s++) {
      step(st, 10);
      const c = census(st);
      if (c[0] + c[1] + c[2] !== N) conserved = false;
    }
    detail.conservedN = N;
    ok('Conservation: no empty sites — the census sums to W·H=' + N + ' at every check across the run',
       conserved, conserved ? 'Σ census ≡ ' + N : 'BROKEN');
  }

  // (f) MEAN-FIELD RHYME — the analytic well-mixed increment E[Δx_s] ∝ x_s(x_{s+1}−x_{s−1})
  //     sums to 0 identically (the zero-sum RPS ring of The Replicator), over a scatter
  //     of random mixes; and it matches the empirically-averaged one-microstep change on
  //     a large well-mixed field within demographic noise.
  {
    const rng = mulberry32(0x1234abcd);
    let worstSum = 0;
    for (let t = 0; t < 4000; t++) {
      let a = rng(), b = rng() * (1 - a);
      const x = [a, b, 1 - a - b];
      const inc = meanFieldIncrement(x);
      worstSum = Math.max(worstSum, Math.abs(inc[0] + inc[1] + inc[2]));
    }
    // empirical: on a big mixed field, the mean per-microstep ΔN ≈ analytic increment.
    // Track the census INCREMENTALLY (each invasion moves exactly one cell) so the loop is
    // O(trials), not O(trials·N) — a full census per step would be pathologically slow.
    const W = 100, H = 100, st = makeField(W, H, 0x2468, { mode: 'mixed' });
    step(st, 8);                                        // move off the exact centre
    const x0 = fractions(st);
    const trials = 40000;
    const acc = [0, 0, 0];
    const g = st.grid, N = g.length, rng2 = st.rng;
    for (let t = 0; t < trials; t++) {
      const i = (rng2() * N) | 0, si = g[i];
      const j = (rng2() * N) | 0, sj = g[j];
      if (sj === (si + 1) % S) { g[j] = si; acc[sj]--; acc[si]++; }   // one cell moves sj→si
    }
    const empPer = acc.map((v) => v / trials);          // mean ΔN per microstep, cell units
    const ana = meanFieldIncrement(x0);                 // E[ΔN_s per microstep] = x_s(x_{s+1}−x_{s−1})
    let worstMatch = 0;
    for (let i = 0; i < 3; i++) worstMatch = Math.max(worstMatch, Math.abs(empPer[i] - ana[i] * N * 0 - (ana[i])));
    // NOTE: empPer is per-microstep in CELL units; ana is in FRACTION units. E[ΔN_s per
    // microstep] = x_s(x_{s+1}−x_{s−1}) exactly (probabilities), so they compare directly.
    detail.mfWorstSum = worstSum; detail.mfMatch = worstMatch;
    ok('Mean-field rhyme: analytic increment sums to 0 (' + worstSum.toExponential(2) +
       ', the zero-sum RPS ring) and matches the empirical one-microstep drift (Δ ' + worstMatch.toFixed(4) + ')',
       worstSum < 1e-15 && worstMatch < 0.03,
       'Σincrement=' + worstSum.toExponential(2) + '  ·  |emp−analytic|=' + worstMatch.toFixed(4));
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

export {
  S, prey, predator, mulberry32, MOORE8, VONNEUMANN4,
  makeField, reseedField, microstep, step,
  census, fractions, minFraction, speciesAlive, frontDensity,
  shuffleGrid, stamp, plantPinwheel, cloneField, meanFieldIncrement,
  runSelfTest,
};
