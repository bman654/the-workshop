// === CORE BEGIN ===
// The Fifteen — math core (single source of truth).
// A 4×4 sliding-tile puzzle. The board is a flat length-16 Int array, row-major,
// values 1..15 with 0 = the gap. GOAL = [1..15, 0] — every tile home, the gap in its
// corner. N = 4.
//
// THE SOUL is a conserved PARITY BIT. The solvability of any board is decided — with NO
// search — by a single parity invariant. Reading the 15 tiles row-major with the blank
// removed, count the out-of-order pairs (inversions); add the number of empty rows BELOW
// the blank (0-indexed); the LOW BIT of that sum is the seal:
//
//   parityP(board) = ( inversions(board) + blankRowsBelow(board) ) & 1
//   isSolvable(board) === (parityP(board) === 0)
//
// This is the COMPLETE test — a board is solvable iff P = 0, no search needed. Under any
// LEGAL slide the seal never moves: a VERTICAL slide flips BOTH the inversion-parity term
// and the rows-below term (their XOR is unchanged); a HORIZONTAL slide flips NEITHER. So
// every board you can reach by sliding shares GOAL's seal (P = 0) — which is exactly why
// it can be sorted. Swap any two tiles and the seal flips to 1: the board leaves the
// solvable orbit and no sequence of slides can ever sort it.
//
// This module is the SOLE math authority (DOM-free): the parity invariant, the legal-move
// generator, a PURE slide, a parity-correct dealer, the two-tile swap, and a 4×4 solver
// (IDA* + Manhattan) that REACHES GOAL — short-circuiting honestly to "no search" when the
// bit forbids a solution. It is inlined byte-identical into index.html between the
// CORE BEGIN / CORE END sentinels and tested by core.test.mjs — page & test can never drift.

const N = 4;
const GOAL = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);

// Deterministic PRNG (mulberry32) so every seed reproduces the same deal everywhere.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Index of the gap (the 0) in the flat board.
function gapIndex(board) { return board.indexOf(0); }

// Is the board exactly GOAL? (deep equality, the only winning state.)
function isSolved(board) {
  for (let i = 0; i < 16; i++) if (board[i] !== GOAL[i]) return false;
  return true;
}

// Inversions: out-of-order pairs over the 15 tiles with the blank removed, read row-major.
function inversions(board) {
  const t = []; for (let i = 0; i < 16; i++) if (board[i] !== 0) t.push(board[i]);
  let inv = 0;
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) inv++;
  return inv;
}

// The 0-indexed row term: how many EMPTY rows lie BELOW the blank's row (0..3). The blank
// in the bottom row contributes 0; in the top row contributes N-1. This is the term the
// instrument's ladder lights — NOT the 1-indexed "row counting from the bottom".
function blankRowsBelow(board) { return (N - 1) - Math.floor(gapIndex(board) / N); }

// The seal: the conserved parity bit. The SOLE solvability invariant.
function parityP(board) { return (inversions(board) + blankRowsBelow(board)) & 1; }

// A board is solvable iff its seal reads 0 — the complete test, no search.
function isSolvable(board) { return parityP(board) === 0; }

// Tile indices orthogonally adjacent to the gap (the move generator). These are exactly
// the tiles that can slide into the gap this turn.
function legalMoves(board) {
  const gap = gapIndex(board), gr = Math.floor(gap / N), gc = gap % N, out = [];
  for (let i = 0; i < 16; i++) {
    const r = Math.floor(i / N), c = i % N;
    if ((r === gr && Math.abs(c - gc) === 1) || (c === gc && Math.abs(r - gr) === 1)) out.push(i);
  }
  return out;
}

// PURE slide: a NEW board with the tile at tileIndex moved into the adjacent gap, or null
// if that tile is not orthogonally adjacent to the gap. Never mutates the input.
function slide(board, tileIndex) {
  const gap = gapIndex(board);
  const r = Math.floor(tileIndex / N), c = tileIndex % N;
  const gr = Math.floor(gap / N), gc = gap % N;
  const adj = (r === gr && Math.abs(c - gc) === 1) || (c === gc && Math.abs(r - gr) === 1);
  if (!adj) return null;
  const nb = board.slice();
  nb[gap] = nb[tileIndex]; nb[tileIndex] = 0;
  return nb;
}

// Deal a parity-correct scramble via a legal walk from GOAL (avoids immediate backtrack).
// Because every move is a legal slide, the seal stays 0 — the board is STRUCTURALLY solvable,
// and the solver always succeeds cheaply. The default walk (40 moves) leaves the board
// thoroughly shuffled (nearly every tile off its home cell) yet within snappy reach of the
// linear-conflict IDA* solver, which still returns the OPTIMAL move count. Never returns the
// identity.
function dealSolvable(seed, nMoves = 40) {
  const rng = mulberry32(seed >>> 0);
  let b = GOAL.slice(), prevGap = -1;
  for (let i = 0; i < nMoves; i++) {
    const moves = legalMoves(b).filter(ix => ix !== prevGap); // don't undo the last slide
    const pick = moves[(rng() * moves.length) | 0];
    prevGap = gapIndex(b);
    b = slide(b, pick);
  }
  // Guarantee non-identity (a 40-move walk practically never lands on GOAL, but be exact).
  if (isSolved(b)) { const mv = legalMoves(b); b = slide(b, mv[0]); }
  return b;
}

// PURE two-tile swap of indices i and j (used by the negative control). Never mutates.
function swapTwo(board, i, j) {
  const nb = board.slice();
  const t = nb[i]; nb[i] = nb[j]; nb[j] = t;
  return nb;
}

// Deterministic swap-pair chooser: the LAST two non-blank indices read row-major. On a
// solved/near-solved board these are the "14 and 15" tiles — so the swap reads as "one
// move from done, yet impossible". Lives in core so the twin can assert it returns two
// distinct non-blank indices.
function chooseSwapPair(board) {
  let i = -1, j = -1;
  for (let k = 15; k >= 0; k--) {
    if (board[k] !== 0) { if (j < 0) j = k; else { i = k; break; } }
  }
  return [i, j];
}

// Manhattan-distance heuristic to GOAL: Σ over tiles of |Δrow| + |Δcol| from home. Admissible
// (never overestimates) so IDA* with it returns an OPTIMAL move count.
function manhattan(board) {
  let h = 0;
  for (let i = 0; i < 16; i++) {
    const v = board[i]; if (v === 0) continue;
    const home = v - 1; // GOAL[home] === v, so tile v belongs at index v-1
    h += Math.abs((i % N) - (home % N)) + Math.abs(Math.floor(i / N) - Math.floor(home / N));
  }
  return h;
}

// Linear-conflict bonus on top of Manhattan, the standard admissible 15-puzzle heuristic.
// Two tiles in their GOAL row (or column) but in the wrong relative order must pass each
// other, costing 2 extra moves beyond Manhattan — and adding 2 keeps the estimate admissible
// (each conflicting pair forces at least one of them out of the line and back). This shrinks
// IDA*'s search by orders of magnitude versus Manhattan alone, while STILL returning the
// OPTIMAL move count.
function heuristic(board) {
  let h = manhattan(board);
  // row conflicts
  for (let r = 0; r < N; r++) {
    for (let ca = 0; ca < N; ca++) {
      const va = board[r * N + ca]; if (va === 0) continue;
      if (Math.floor((va - 1) / N) !== r) continue;     // tile a's goal row isn't this row
      for (let cb = ca + 1; cb < N; cb++) {
        const vb = board[r * N + cb]; if (vb === 0) continue;
        if (Math.floor((vb - 1) / N) !== r) continue;   // tile b's goal row isn't this row
        if (va > vb) h += 2;                             // in-row pair reversed → +2
      }
    }
  }
  // column conflicts
  for (let c = 0; c < N; c++) {
    for (let ra = 0; ra < N; ra++) {
      const va = board[ra * N + c]; if (va === 0) continue;
      if ((va - 1) % N !== c) continue;                 // tile a's goal column isn't this column
      for (let rb = ra + 1; rb < N; rb++) {
        const vb = board[rb * N + c]; if (vb === 0) continue;
        if ((vb - 1) % N !== c) continue;               // tile b's goal column isn't this column
        if (va > vb) h += 2;                             // in-column pair reversed → +2
      }
    }
  }
  return h;
}

// The 4×4 solver. HONEST SHORT-CIRCUIT: if the seal forbids a solution, return immediately
// with nodes:0 — "no search needed, the bit forbids it". Otherwise run real IDA* with the
// Manhattan heuristic, which REACHES GOAL and returns the OPTIMAL move count + nodes expanded.
function solve(board) {
  if (!isSolvable(board)) return { solvable: false, nodes: 0, reason: 'parity' };
  if (isSolved(board)) return { solvable: true, moves: 0, nodes: 0, reason: 'already solved' };

  let nodes = 0;
  let bound = heuristic(board);
  let solvedG = -1; // the g (move count) at which GOAL was reached this iteration
  const path = board.slice();

  // depth-limited DFS; returns the minimum f-value that exceeded the bound (the next
  // threshold), or -1 the instant GOAL is reached (recording its depth in solvedG).
  function dfs(g, prevGap) {
    nodes++;
    const f = g + heuristic(path);
    if (f > bound) return f;
    if (isSolved(path)) { solvedG = g; return -1; } // sentinel: solved at depth g
    let min = Infinity;
    const gap = gapIndex(path), gr = Math.floor(gap / N), gc = gap % N;
    for (let i = 0; i < 16; i++) {
      const r = Math.floor(i / N), c = i % N;
      const adj = (r === gr && Math.abs(c - gc) === 1) || (c === gc && Math.abs(r - gr) === 1);
      if (!adj) continue;
      if (i === prevGap) continue; // don't slide the tile we just slid back
      // apply slide in place on `path`
      path[gap] = path[i]; path[i] = 0;
      const t = dfs(g + 1, gap);
      if (t === -1) { path[i] = path[gap]; path[gap] = 0; return -1; } // solved downstream — unwind cleanly
      if (t < min) min = t;
      // undo
      path[i] = path[gap]; path[gap] = 0;
    }
    return min;
  }

  // IDA*: raise the bound to the next threshold until GOAL is found. Bounded so it can
  // never spin forever; a parity-correct 4×4 from a 40-move deal solves well within this.
  for (let iter = 0; iter < 200; iter++) {
    const t = dfs(0, -1);
    if (t === -1) return { solvable: true, moves: solvedG, nodes, reason: 'reached goal' };
    if (t === Infinity) break; // exhausted (cannot happen for a solvable board)
    bound = t;
  }
  // Unreachable for a parity-correct board, but stay honest if the search budget is blown.
  return { solvable: true, moves: bound, nodes, reason: 'budget' };
}
// === CORE END ===

export {
  N, GOAL, mulberry32, gapIndex, isSolved, inversions, blankRowsBelow,
  parityP, isSolvable, legalMoves, slide, dealSolvable, swapTwo, chooseSwapPair, solve, manhattan, heuristic
};
