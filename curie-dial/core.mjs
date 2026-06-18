// The Curie Dial — logic core (an order you can MELT).
//
// THE WHOLE POINT: a single brass-framed PANE of glowing metal — a 48×48 Ising lattice run by
// the Metropolis rule — where you DRAG a thermostat bead up a vertical track and WATCH order
// dissolve. Cold: a few crisp incandescent seams outline big breathing gold/slate continents.
// Heat it: the seams fray, branch, migrate. Past the Curie tick (the 2-D scale Tc ≈ 2.27) the
// seams are everywhere — shimmering molten static. The DOMAIN WALLS are the hero: wall-density
// IS the visible order parameter. You WATCH order dissolve; you never read it off an axis.
// A magnet is a crowd that agrees; heat is the argument.
//
// WHY THE PROOF IS HONEST (for a finite 48×48 torus): the ferromagnetic Ising model on a 2-D
// torus has a thermodynamic-limit critical temperature Tc = 2/ln(1+√2) ≈ 2.269. A finite lattice
// ROUNDS the knee — and critical slowing-down means a single seed can sit metastable (e.g. a
// stripe) at an intermediate T. So we do NOT claim M at any single near-critical T. We claim the
// robust facts: (a) the LOW band ⟨|M|⟩ is HIGH while the HIGH band is COLLAPSED, with a wide gap;
// (b) ⟨|M|⟩ is MONOTONE non-increasing across a temperature sweep with the big drop straddling
// the Curie tick, mirrored by wall-density rising MONOTONE; (c) the two hard limits T→0 ⇒ ⟨|M|⟩→1
// and T→∞ ⇒ ⟨|M|⟩→0. The NEGATIVE CONTROL `flatAlwaysOrdered` ignores T and always reports
// ⟨|M|⟩ ≈ 1 — a magnet that never melts; the suite asserts the REAL core DISAGREES with it in the
// high-T regime, so the test cannot pass vacuously.
//
// SOURCING (anti-drift, encoded in core.test.mjs): the page inlines this core byte-for-byte
// between the CURIE-DIAL CORE sentinels; core.test.mjs byte-parity-checks the inlined copy in
// index.html against this file's body so it can never silently drift.
//
// ALL randomness the CLAIM rests on lives HERE behind the seeded mulberry32 path — no Math.random
// and no wall-clock in any asserted number. The live render reads lattice state only and may use
// its own rng instance for the visible sweep.
//
// Zero-dep ESM. Coordinates are lattice cells (i,j) on an N×N torus; a spin is ±1 (Int8).

// ===== CURIE-DIAL CORE (byte-identical to core.mjs) =====
"use strict";

// The 2-D Ising critical temperature in the thermodynamic limit: Tc = 2/ln(1+√2) ≈ 2.269185.
// On a finite 48×48 torus the knee is rounded — this is a LANDMARK on the dial, never a knife-edge.
const TC = 2 / Math.log(1 + Math.sqrt(2));

// The canonical lattice edge. Do NOT bump N — 48 keeps the live render smooth and the seeded
// run reproducible; a larger N would slow the page AND shift the finite-size band.
const N_DEFAULT = 48;

// The canonical fixed seed — both the page's self-test and the Node twin run THIS seed so the
// asserted numbers are byte-reproducible.
const SEED = 0xC0FFEE;

// The estate's mulberry32 PRNG (the same generator iron-filings/giant-component/sandpile share).
// Deterministic: a fixed seed gives a fixed stream of doubles in [0,1).
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── THE LATTICE ──────────────────────────────────────────────────────────────────────────
// A grid is an Int8Array of N*N spins, each ±1, indexed row-major (idx = i*N + j).

// A random ±1 lattice (a hot disordered start). rng is a mulberry32 instance.
function makeGrid(N, rng){
  const g = new Int8Array(N*N);
  for (let k = 0; k < g.length; k++) g[k] = (rng() < 0.5) ? -1 : 1;
  return g;
}

// The T→0 reference: every spin +1 (one saturated domain, ⟨|M|⟩ = 1 exactly).
function coldGrid(N){
  const g = new Int8Array(N*N);
  g.fill(1);
  return g;
}

// ── THE METROPOLIS RULE ──────────────────────────────────────────────────────────────────
// One single-spin-flip sweep = N² attempted flips on random sites, periodic (torus) boundaries.
// For the nearest-neighbour ferromagnet H = −Σ s_i s_j, flipping spin s changes the energy by
//   dE = 2·s·(sum of its 4 neighbours).
// Accept if dE ≤ 0; else accept with probability exp(−dE/T). Returns { grid, mAbs } where
// mAbs = |Σ s| / N² is the post-sweep magnetization-per-spin magnitude (the order parameter).
function sweep(grid, N, T, nSweeps, rng){
  const g = grid;
  const sweeps = (nSweeps == null) ? 1 : nSweeps;
  // Precompute the (at most) two positive dE Boltzmann factors. dE ∈ {−8,−4,0,4,8}; only +4,+8
  // need the exp. T may be 0 in the cold limit → guard: at T=0 no uphill flip is ever accepted.
  const invT = (T > 0) ? 1/T : Infinity;
  const w4 = Math.exp(-4*invT);     // exp(−4/T)  (→ 0 as T→0)
  const w8 = Math.exp(-8*invT);     // exp(−8/T)
  for (let s = 0; s < sweeps; s++){
    for (let n = 0; n < N*N; n++){
      const i = (rng()*N) | 0;
      const j = (rng()*N) | 0;
      const idx = i*N + j;
      const up    = ((i-1+N)%N)*N + j;
      const down  = ((i+1)%N)*N + j;
      const left  = i*N + ((j-1+N)%N);
      const right = i*N + ((j+1)%N);
      const sij = g[idx];
      const nb = g[up] + g[down] + g[left] + g[right];
      const dE = 2 * sij * nb;          // ∈ {−8,−4,0,4,8}
      if (dE <= 0){
        g[idx] = -sij;
      } else {
        const w = (dE === 4) ? w4 : w8; // dE === 8 otherwise
        if (rng() < w) g[idx] = -sij;
      }
    }
  }
  let sum = 0;
  for (let k = 0; k < g.length; k++) sum += g[k];
  return { grid: g, mAbs: Math.abs(sum) / (N*N) };
}

// ── THE ORDER PARAMETER ──────────────────────────────────────────────────────────────────
// Time-averaged ⟨|M|⟩ at temperature T: burn in `burn` sweeps to equilibrate, then average |M|
// over `samples` measurements spaced `gap` sweeps apart. Deterministic in seed. `start` chooses
// the initial state: 'hot' (random ±1, the default) or 'cold' (the all-up ground state). The
// T→0 EQUILIBRIUM limit is measured from the cold start — a hot quench to near-zero T freezes
// into a metastable stripe (honest finite-size physics), so it is NOT the equilibrium ⟨|M|⟩.
function avgMabs(N, T, opts){
  const o = Object.assign({ seed: SEED, burn: 800, samples: 30, gap: 4, start: 'hot' }, opts || {});
  const rng = mulberry32(o.seed);
  const g = (o.start === 'cold') ? coldGrid(N) : makeGrid(N, rng);
  sweep(g, N, T, o.burn, rng);                 // burn-in
  let acc = 0;
  for (let s = 0; s < o.samples; s++){
    const r = sweep(g, N, T, o.gap, rng);
    acc += r.mAbs;
  }
  return acc / o.samples;
}

// ── THE DOMAIN WALLS (the hero quantity + an independent disorder witness) ────────────────
// A wall cell is one whose 4-neighbour MAJORITY disagrees with it (i.e. at least 2 of its 4
// neighbours have the opposite sign — the cell sits on or inside a domain boundary). Cold lattice
// ⇒ few wall cells (thin seams); hot lattice ⇒ walls everywhere. This is the rendered hero AND a
// monotone-in-disorder witness that rises as ⟨|M|⟩ falls — measured through the same seeded path.
function wallMask(grid, N){
  const g = grid;
  const mask = new Uint8Array(N*N);
  for (let i = 0; i < N; i++){
    const iu = ((i-1+N)%N), id = ((i+1)%N);
    for (let j = 0; j < N; j++){
      const idx = i*N + j;
      const sij = g[idx];
      const nb = g[iu*N + j] + g[id*N + j] + g[i*N + ((j-1+N)%N)] + g[i*N + ((j+1)%N)];
      // disagreeing neighbours = (4 − sij·nb)/2 ; majority disagrees ⇔ ≥ 2 disagree ⇔ sij·nb ≤ 0
      if (sij * nb <= 0) mask[idx] = 1;
    }
  }
  return mask;
}

// Fraction of cells that are wall cells — the visible order parameter (0 = one solid domain).
function wallDensity(grid, N){
  const mask = wallMask(grid, N);
  let c = 0;
  for (let k = 0; k < mask.length; k++) c += mask[k];
  return c / (N*N);
}

// Equilibrated time-average of wall-density at T (mirror of avgMabs; rises monotone with T).
function avgWallDensity(N, T, opts){
  const o = Object.assign({ seed: SEED, burn: 800, samples: 30, gap: 4 }, opts || {});
  const rng = mulberry32(o.seed);
  const g = makeGrid(N, rng);
  sweep(g, N, T, o.burn, rng);
  let acc = 0;
  for (let s = 0; s < o.samples; s++){
    sweep(g, N, T, o.gap, rng);
    acc += wallDensity(g, N);
  }
  return acc / o.samples;
}

// ── THE NEGATIVE CONTROL ─────────────────────────────────────────────────────────────────
// A magnet that NEVER melts: it ignores T and reports ⟨|M|⟩ ≈ 1 always. A vacuous "is the lattice
// ordered?" checker would pass on this at every temperature; the real core must DISAGREE with it in
// the high-T regime (real collapses, this stays pinned) or the whole suite is meaningless.
function flatAlwaysOrdered(N, T){
  return 1.0;       // deliberately T-independent — the foil the test must beat
}

// ── THE TEMPERATURE LADDER (canonical sweep the page + twin both use) ─────────────────────
// The big drop straddles the Curie tick (between 2.0 and 3.0). Burn longer where equilibration is
// slow (low T) so the seeded run sits reproducibly in-band.
const LADDER = [1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

// ── THE SELF-TEST — the pane proves its own claim ─────────────────────────────────────────
// (1) SEPARATION: a LOW band is high, a HIGH band is collapsed, with a wide gap.
// (2) MONOTONE COLLAPSE: ⟨|M|⟩ non-increasing across the ladder (with tolerance), the big drop
//     straddling Tc; mirror witness: wall-density rising monotone.
// (3) TWO HARD LIMITS: T=0.1 ⇒ ⟨|M|⟩ > 0.95 ; T=50 ⇒ ⟨|M|⟩ < 0.05.
// (4) NEG-CONTROL TEETH: the real core's HIGH-band ⟨|M|⟩ is LOW while flatAlwaysOrdered stays HIGH
//     — they DISAGREE in the high-T regime, so the suite can't pass vacuously.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const N = N_DEFAULT;

  // generous burn-in: low band equilibrates slowly, high band fast.
  const LOW = { burn: 1200, samples: 30, gap: 4 };
  const HIGH = { burn: 700, samples: 30, gap: 4 };

  // CLAIM 1 — SEPARATION. Low band high, high band collapsed, gap wide.
  const mLow15 = avgMabs(N, 1.5, LOW), mLow18 = avgMabs(N, 1.8, LOW);
  const mHi35  = avgMabs(N, 3.5, HIGH), mHi50  = avgMabs(N, 5.0, HIGH);
  const lowMin = Math.min(mLow15, mLow18);
  const hiMax  = Math.max(mHi35, mHi50);
  const sepOk = lowMin > 0.7 && hiMax < 0.15 && (lowMin - hiMax) > 0.6;
  log('1 · separation  (⟨|M|⟩ low band > 0.7, high band < 0.15, gap > 0.6)',
      sepOk,
      'low{1.5,1.8}=' + mLow15.toFixed(3) + ',' + mLow18.toFixed(3) +
      '  high{3.5,5.0}=' + mHi35.toFixed(3) + ',' + mHi50.toFixed(3));

  // CLAIM 2 — MONOTONE COLLAPSE + wall-density mirror across the ladder.
  const mLad = LADDER.map(T => avgMabs(N, T, { burn: 900, samples: 30, gap: 4 }));
  const wLad = LADDER.map(T => avgWallDensity(N, T, { burn: 900, samples: 30, gap: 4 }));
  const TOL = 0.03;                                  // finite-size jitter tolerance
  let monoM = true;
  for (let k = 1; k < mLad.length; k++) if (mLad[k] > mLad[k-1] + TOL) monoM = false;
  let monoW = true;
  for (let k = 1; k < wLad.length; k++) if (wLad[k] < wLad[k-1] - TOL) monoW = false;
  const bigDrop = (mLad[1] - mLad[3]) > 0.5;         // value at 2.0 ≫ value at 3.0 (straddles Tc)
  const monoOk = monoM && monoW && bigDrop;
  log('2 · monotone collapse  (⟨|M|⟩ ↓ & wall-density ↑ across the ladder, big drop straddles Tc)',
      monoOk,
      'M=[' + mLad.map(v=>v.toFixed(2)).join(',') + ']  walls=[' + wLad.map(v=>v.toFixed(2)).join(',') + ']');

  // CLAIM 3 — TWO HARD LIMITS. Cold from the ground state (the T→0 EQUILIBRIUM, not a quench);
  // hot from random (T→∞ erases order regardless of start).
  const mCold = avgMabs(N, 0.1, { burn: 200, samples: 12, gap: 2, start: 'cold' });
  const mHot  = avgMabs(N, 50,  { burn: 200, samples: 12, gap: 2 });
  const limitsOk = mCold > 0.95 && mHot < 0.05;
  log('3 · two hard limits  (T=0.1 ⇒ ⟨|M|⟩ > 0.95, T=50 ⇒ ⟨|M|⟩ < 0.05)',
      limitsOk, 'cold=' + mCold.toFixed(3) + '  hot=' + mHot.toExponential(2));

  // CLAIM 4 — NEG-CONTROL TEETH. Real HIGH band collapses; the flat foil stays pinned at 1.
  const realHigh = Math.max(mHi35, mHi50);            // already collapsed above
  const flatHigh = Math.max(flatAlwaysOrdered(N, 3.5), flatAlwaysOrdered(N, 5.0));
  const teeth = realHigh < 0.15 && flatHigh > 0.95 && (flatHigh - realHigh) > 0.8;
  log('4 · NEGATIVE CONTROL: flat-always-ordered stays HIGH where the real core collapses',
      teeth,
      'real high=' + realHigh.toFixed(3) + '  flat high=' + flatHigh.toFixed(3) + '  (they disagree)');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END CURIE-DIAL CORE =====

export {
  TC, N_DEFAULT, SEED, LADDER,
  mulberry32, makeGrid, coldGrid, sweep,
  avgMabs, wallMask, wallDensity, avgWallDensity,
  flatAlwaysOrdered, runSelfTest,
};
