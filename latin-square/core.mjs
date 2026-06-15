// === CORE BEGIN ===
// The Latin Square — math core (single source of truth).
// A 5×5 Latin square: symbols 1..5, each appearing exactly once per row & column.
// This module is the SOLE authority for: the exact solution counter (ground truth),
// the deduction-only solver (naked singles + hidden singles, NO backtracking), and
// the generator that digs a minimal set of givens that is BOTH uniquely-solvable AND
// solvable by pure logic. It is inlined byte-identical into index.html between the
// CORE BEGIN / CORE END sentinels, and tested by core.test.mjs — page & test can't drift.

const N = 5;
const SYMS = [1, 2, 3, 4, 5];

// Deterministic PRNG (mulberry32) so every seed reproduces the same board everywhere.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In-place Fisher–Yates using the supplied rng.
function shuffle(a, rng) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Exact solution COUNTER via backtracking — the GROUND TRUTH, independent of the deducer.
// Capped (default 9) so removing several clues can never explode; a return of `cap`
// means "cap or more" and the UI honestly renders it as "cap+".
function countSolutions(givens, cap = 9) {
  const grid = givens.map(r => r.slice());
  let count = 0;
  function ok(r, c, v) {
    for (let i = 0; i < N; i++) { if (grid[r][i] === v) return false; if (grid[i][c] === v) return false; }
    return true;
  }
  function rec(pos) {
    if (count >= cap) return;
    if (pos === N * N) { count++; return; }
    const r = (pos / N) | 0, c = pos % N;
    if (grid[r][c] !== 0) { rec(pos + 1); return; }
    for (const v of SYMS) { if (ok(r, c, v)) { grid[r][c] = v; rec(pos + 1); grid[r][c] = 0; } }
  }
  rec(0);
  return count;
}

// A randomized full Latin square via randomized backtracking.
function fullSquare(rng) {
  const g = Array.from({ length: N }, () => Array(N).fill(0));
  function ok(r, c, v) { for (let i = 0; i < N; i++) { if (g[r][i] === v || g[i][c] === v) return false; } return true; }
  function rec(pos) {
    if (pos === N * N) return true;
    const r = (pos / N) | 0, c = pos % N;
    for (const v of shuffle(SYMS.slice(), rng)) { if (ok(r, c, v)) { g[r][c] = v; if (rec(pos + 1)) return true; g[r][c] = 0; } }
    return false;
  }
  rec(0);
  return g;
}

// DEDUCTION-ONLY solver: candidate sets, naked singles + hidden singles, NO guessing.
// Returns { solved, blanks, val (the worked grid), fillOrder } where fillOrder is the
// ordered list of {r,c,v,rule} of cells the logic FILLED — rule names the technique so
// the page can prove "never a guess" by replaying the reasoning. If a cell ever has zero
// candidates the solver reports a contradiction (used by the negative control); otherwise
// it stalls with blanks>0 when logic alone cannot finish (also the negative control).
function deduce(givens) {
  const val = givens.map(r => r.slice());
  const fillOrder = [];
  function cands(r, c) {
    if (val[r][c] !== 0) return null;
    const used = new Set();
    for (let i = 0; i < N; i++) { if (val[r][i]) used.add(val[r][i]); if (val[i][c]) used.add(val[i][c]); }
    return SYMS.filter(v => !used.has(v));
  }
  let progress = true;
  while (progress) {
    progress = false;
    // naked single: a cell with exactly one candidate.
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (val[r][c]) continue;
      const cs = cands(r, c);
      if (cs.length === 0) return { solved: false, contradiction: true, blanks: val.flat().filter(x => x === 0).length, val, fillOrder };
      if (cs.length === 1) { val[r][c] = cs[0]; fillOrder.push({ r, c, v: cs[0], rule: 'naked-single' }); progress = true; }
    }
    if (progress) continue;
    // hidden single in a row: a value that fits only one cell of its row.
    for (let r = 0; r < N; r++) {
      for (const v of SYMS) {
        let spot = -1, cnt = 0, already = false;
        for (let c = 0; c < N; c++) { if (val[r][c] === v) { already = true; break; } }
        if (already) continue;
        for (let c = 0; c < N; c++) { if (!val[r][c] && cands(r, c).includes(v)) { spot = c; cnt++; } }
        if (cnt === 1) { val[r][spot] = v; fillOrder.push({ r, c: spot, v, rule: 'hidden-single-row' }); progress = true; }
      }
    }
    if (progress) continue;
    // hidden single in a column: a value that fits only one cell of its column.
    for (let c = 0; c < N; c++) {
      for (const v of SYMS) {
        let spot = -1, cnt = 0, already = false;
        for (let r = 0; r < N; r++) { if (val[r][c] === v) { already = true; break; } }
        if (already) continue;
        for (let r = 0; r < N; r++) { if (!val[r][c] && cands(r, c).includes(v)) { spot = r; cnt++; } }
        if (cnt === 1) { val[spot][c] = v; fillOrder.push({ r: spot, c, v, rule: 'hidden-single-col' }); progress = true; }
      }
    }
  }
  const blanks = val.flat().filter(x => x === 0).length;
  return { solved: blanks === 0, blanks, val, fillOrder };
}

// Generator: a random full square, then dig holes in random order, keeping a removal
// ONLY if the board stays BOTH uniquely-solvable AND deduction-only solvable. This is
// the MINIMAL dig (each surviving clue is load-bearing): pulling ANY one given breaks
// at least one of the two guarantees — which is exactly what the Tightening panel shows.
function generate(seed) {
  const rng = mulberry32(seed);
  const full = fullSquare(rng);
  const givens = full.map(r => r.slice());
  const cells = shuffle(Array.from({ length: N * N }, (_, i) => i), rng);
  for (const idx of cells) {
    const r = (idx / N) | 0, c = idx % N;
    const saved = givens[r][c];
    givens[r][c] = 0;
    const unique = countSolutions(givens, 2) === 1;
    const ded = deduce(givens).solved;
    if (!(unique && ded)) givens[r][c] = saved; // revert — this clue is load-bearing
  }
  return { full, givens };
}
// === CORE END ===

export { N, SYMS, mulberry32, shuffle, fullSquare, countSolutions, deduce, generate };
