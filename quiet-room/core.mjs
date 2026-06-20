// === CORE BEGIN ===
// The Quiet Room — math core (single source of truth).
// A 5×5 Lights-Out lamp panel. The panel is a flat Uint8Array(25), row-major, 1 = lit,
// 0 = dark. Pressing a lamp flips ITSELF plus its (up to four) orthogonal neighbours —
// a plain 5×5, no wrap, so edge lamps flip fewer. GOAL = the all-dark panel.
//
// THE SOUL is LINEAR ALGEBRA OVER GF(2) (arithmetic mod 2, where 1+1=0). Number every cell
// 0..24. Pressing cell c adds (XOR) a fixed 25-vector — the c-th column of the 25×25 toggle
// matrix A — to the board. So any sequence of presses is just the XOR of those columns, and
// ORDER NEVER MATTERS and PRESSING TWICE UNDOES ITSELF (involution). Solving the lit board b
// means finding a press-set x with A·x = b over GF(2): a single linear system, solved once by
// Gaussian elimination — NO search.
//
//   • A board b is SOLVABLE  ⟺  b is orthogonal to every vector in the LEFT-nullspace of A
//     (the "kernel"): isSolvable(b) = KERNEL.every(v => dot(b, v) === 0).
//   • The 5×5's kernel has DIMENSION D = 2 (COMPUTED here, not assumed). Its two basis
//     vectors are the two QUIET PATTERNS. So 2^(25−2) = 2^23 of the 2^25 boards are solvable;
//     the other ¾ are provably impossible — no press-set on Earth turns them dark.
//
// TWO TRUTHS THE KERNEL HOLDS — and they are NOT obstruction:
//   1. THE QUIET MOVE (the soul, POSITIVE). A is symmetric (A = Aᵀ), so the left-nullspace
//      equals the right-nullspace: A·Q = 0 for each quiet pattern Q. PRESSING EVERY LAMP of a
//      quiet pattern leaves the panel BYTE-IDENTICAL. "Some moves are invisible. These two
//      patterns are the only ones." THAT is what the kernel is.
//   2. SOLUTION AMBIGUITY. Because A·Q = 0, if x solves b then so does x+Q. Every solvable
//      board therefore has exactly 2^D = 4 solving press-sets, differing by the quiet patterns.
//      solve() returns the MINIMUM-Hamming-weight one (fewest presses) of those four.
//
// The genuine "SOLVE goes red" control is NOT a quiet pattern (a quiet pattern is self-
// orthogonal — dot(Q,Q)=0 — so it PASSES the test and solve() returns a press-set). It is an
// IMPOSSIBLE DEAL: a board NOT orthogonal to the kernel (e.g. a lone lit lamp — 20 of the 25
// single-lamp boards are provably impossible). solve() of such a board returns {solvable:false}.
//
// This module is the SOLE math authority (DOM-free). It is inlined byte-identical into
// index.html between the CORE BEGIN / CORE END sentinels and tested by core.test.mjs — page &
// test can never drift. Everything DERIVES from N; nothing hard-codes 25 or D.

const N = 5;
const M = N * N;

// Deterministic PRNG (mulberry32) — verbatim from The Fifteen, so every seed reproduces the
// same deal everywhere.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build the 25×25 toggle matrix as M ROWS of length M (over GF(2)). Row c is the effect
// vector of pressing cell c: cell c plus its orthogonal neighbours flip. Because the relation
// "i flips j" is symmetric, A is symmetric (A = Aᵀ) — asserted by the twin. The outer array is
// frozen so a sibling tab can't swap rows; the rows are typed arrays (which can't be frozen)
// and are READ-ONLY by convention — never mutate A; every operation returns a fresh vector.
function buildA() {
  const rows = [];
  for (let c = 0; c < M; c++) {
    const row = new Uint8Array(M);
    const cr = (c / N) | 0, cc = c % N;
    row[c] = 1;
    if (cr > 0) row[c - N] = 1;          // up
    if (cr < N - 1) row[c + N] = 1;      // down
    if (cc > 0) row[c - 1] = 1;          // left
    if (cc < N - 1) row[c + 1] = 1;      // right
    rows.push(row);
  }
  return Object.freeze(rows);
}
const A = buildA();

// PURE press: a NEW board with cell c (and its orthogonal cross) flipped. Never mutates the
// input. Driven straight off A's row, so the page's visual is a pure consequence of the matrix.
function press(board, c) {
  const nb = Uint8Array.from(board);
  const row = A[c];
  for (let i = 0; i < M; i++) nb[i] ^= row[i];
  return nb;
}

// PURE press-set application: XOR all the listed presses into the board, in any order (order is
// irrelevant over GF(2)). Never mutates the input.
function applyPresses(board, presses) {
  let b = Uint8Array.from(board);
  for (const c of presses) b = press(b, c);
  return b;
}

// A·x over GF(2): A given as rows. Returns a Uint8Array(M).
function matVec(Mat, x) {
  const out = new Uint8Array(Mat.length);
  for (let i = 0; i < Mat.length; i++) {
    let s = 0; const row = Mat[i];
    for (let j = 0; j < M; j++) s ^= row[j] & x[j];
    out[i] = s & 1;
  }
  return out;
}

// Transpose a square M×M matrix given as rows. (A is symmetric, so transpose(A) === A; the
// twin verifies this, and KERNEL is built off transpose(A) to be honest about WHICH nullspace
// the solvability test uses — the LEFT-nullspace.)
function transpose(Mat) {
  const T = [];
  for (let i = 0; i < M; i++) {
    const r = new Uint8Array(M);
    for (let j = 0; j < M; j++) r[j] = Mat[j][i];
    T.push(r);
  }
  return T;
}

// GF(2) dot product of two length-M vectors.
function dot(a, b) { let s = 0; for (let i = 0; i < M; i++) s ^= a[i] & b[i]; return s & 1; }

// THE ONE Gaussian-elimination routine. Row-reduce the augmented system [rows | rhs] over
// GF(2) to reduced row-echelon form, IN PLACE on fresh copies. Returns
//   { rref, rhs, pivotOf, freeCols, rank, consistent }
// where pivotOf[col] = the row that pivots on col (or -1), freeCols = columns with no pivot.
// This single routine powers solve(), nullspaceBasis(), and isSolvable's witness.
function rrefAug(rows, rhs) {
  const m = rows.map(r => Uint8Array.from(r));
  const b = Uint8Array.from(rhs);
  const R = m.length, C = M;
  const pivotOf = new Array(C).fill(-1);
  let r = 0;
  for (let c = 0; c < C && r < R; c++) {
    let sel = -1;
    for (let i = r; i < R; i++) if (m[i][c]) { sel = i; break; }
    if (sel < 0) continue;
    if (sel !== r) { const t = m[sel]; m[sel] = m[r]; m[r] = t; const tb = b[sel]; b[sel] = b[r]; b[r] = tb; }
    for (let i = 0; i < R; i++) {
      if (i !== r && m[i][c]) {
        for (let j = 0; j < C; j++) m[i][j] ^= m[r][j];
        b[i] ^= b[r];
      }
    }
    pivotOf[c] = r; r++;
  }
  const rank = r;
  // consistency: any all-zero row in m must carry a 0 in b (no 0 = 1 contradiction)
  let consistent = true;
  for (let i = 0; i < R; i++) {
    let allZero = true;
    for (let j = 0; j < C; j++) if (m[i][j]) { allZero = false; break; }
    if (allZero && b[i]) { consistent = false; break; }
  }
  const freeCols = [];
  for (let c = 0; c < C; c++) if (pivotOf[c] === -1) freeCols.push(c);
  return { rref: m, rhs: b, pivotOf, freeCols, rank, consistent };
}

// Basis of the nullspace { v : Mat·v = 0 } over GF(2), via rrefAug with a zero rhs. One basis
// vector per free column. DOM-free, exact.
function nullspaceBasis(Mat) {
  const { rref, pivotOf, freeCols } = rrefAug(Mat, new Uint8Array(Mat.length));
  const basis = [];
  for (const fc of freeCols) {
    const v = new Uint8Array(M);
    v[fc] = 1;
    for (let c = 0; c < M; c++) {
      const pr = pivotOf[c];
      if (pr !== -1) v[c] = rref[pr][fc];   // back-substitute: pivot col = the free col's coeff
    }
    basis.push(v);
  }
  return basis;
}

// THE KERNEL — the LEFT-nullspace of A (vectors y with Aᵀ·y = 0). A board is solvable iff it
// is orthogonal to every kernel vector. D is the COMPUTED dimension (2 for the 5×5). The outer
// array is frozen; the rows are read-only typed arrays by convention.
const KERNEL = Object.freeze(nullspaceBasis(transpose(A)));
const D = KERNEL.length;

// A board is SOLVABLE iff it is orthogonal to every kernel vector. The complete test — no search.
function isSolvable(deal) { for (const v of KERNEL) if (dot(deal, v) !== 0) return false; return true; }

// Hamming weight (number of 1s) of a board — the press count of a press-set vector.
function weight(v) { let w = 0; for (let i = 0; i < M; i++) w += v[i]; return w; }

// solve(deal) → { solvable, press, x, reason }.
//   • If deal is not orthogonal to the kernel: { solvable:false, press:null, x:null,
//     reason:'not in the column space' } — the genuine SOLVE-goes-red case.
//   • Otherwise: a particular solution x₀ from rrefAug, then the MINIMUM-Hamming-weight member
//     of its coset x₀ ⊕ span(KERNEL) — the fewest-presses solution, honest for "minimal: N" and
//     the gold play-out. press is the list of cell indices to press (the 1-positions of x).
function solve(deal) {
  if (!isSolvable(deal)) {
    return { solvable: false, press: null, x: null, reason: 'not in the column space' };
  }
  // A·x = deal. A is symmetric so we solve against A directly.
  const { rref, rhs, pivotOf, consistent } = rrefAug(A, deal);
  if (!consistent) {
    // Cannot happen for an isSolvable board, but stay honest.
    return { solvable: false, press: null, x: null, reason: 'inconsistent' };
  }
  // particular solution: free cols = 0, pivot cols read off rhs
  const x0 = new Uint8Array(M);
  for (let c = 0; c < M; c++) { const pr = pivotOf[c]; if (pr !== -1) x0[c] = rhs[pr]; }
  // minimise over the coset x0 ⊕ span(KERNEL): D is tiny (2 ⇒ 4 candidates), so enumerate all.
  let best = x0, bestW = weight(x0);
  const K = KERNEL.length;
  for (let mask = 1; mask < (1 << K); mask++) {
    const cand = Uint8Array.from(x0);
    for (let k = 0; k < K; k++) if (mask & (1 << k)) for (let i = 0; i < M; i++) cand[i] ^= KERNEL[k][i];
    const w = weight(cand);
    if (w < bestW) { best = cand; bestW = w; }
  }
  const press = [];
  for (let i = 0; i < M; i++) if (best[i]) press.push(i);
  return { solvable: true, press, x: best, reason: 'solved' };
}

// Deal a provably-SOLVABLE lit board: apply a random LEGAL press-set to the all-dark board.
// Because the board is built from presses it is ALWAYS in the column space (isSolvable → true).
// Never returns the all-dark board (re-presses if a deal cancels to dark).
function dealSolvable(seed) {
  const rng = mulberry32(seed >>> 0);
  let b = new Uint8Array(M);
  // press each cell with probability ~0.5 (a uniform-ish legal press-set)
  for (let c = 0; c < M; c++) if (rng() < 0.5) b = press(b, c);
  // guarantee non-dark
  let guard = 0;
  while (b.every(v => v === 0) && guard < 50) { b = press(b, (rng() * M) | 0); guard++; }
  return b;
}

// Deal an IMPOSSIBLE board: a single lit lamp at a cell that is NOT orthogonal to the kernel
// (20 of the 25 single-lamp boards qualify). solve() of this returns {solvable:false}. The
// genuine SOLVE-goes-red negative control. Deterministic from seed.
function dealImpossible(seed) {
  const rng = mulberry32(seed >>> 0);
  // collect the single-lamp cells that are impossible
  const bad = [];
  for (let i = 0; i < M; i++) { const d = new Uint8Array(M); d[i] = 1; if (!isSolvable(d)) bad.push(i); }
  const cell = bad[(rng() * bad.length) | 0];
  const b = new Uint8Array(M); b[cell] = 1;
  return b;
}

// ── PROVENANCE state machine ──────────────────────────────────────────────────────────────
// A board can LOOK won (all-dark) yet be illegitimate if a dark lamp was hand-painted instead
// of reached by legal presses. The state carries the board, its origin, and the monotone
// reachedByPresses flag: doPress keeps it true; forcePaint latches it false forever (until a
// fresh deal). PROVENANCE (was every dark reached by presses?) is SEPARATE from MEMBERSHIP
// (is the board in the column space?) — two reds, distinct reasons.
function freshState(deal, origin) {
  return { board: Uint8Array.from(deal), origin: origin || 'dealt', reachedByPresses: true, presses: 0 };
}
function doPress(state, c) {
  return {
    board: press(state.board, c),
    origin: state.origin,
    reachedByPresses: state.reachedByPresses,   // a legal press preserves provenance
    presses: state.presses + 1
  };
}
function forcePaint(state, idx) {
  const nb = Uint8Array.from(state.board);
  nb[idx] ^= 1;   // hand-flip a single lamp, bypassing the legal cross-flip
  return {
    board: nb,
    origin: state.origin,
    reachedByPresses: false,                    // monotone: provenance is broken forever
    presses: state.presses
  };
}

// The two named QUIET PATTERNS — the kernel basis, exported as flat Uint8Array(25). Verified
// A·Q = 0, independent, spanning the COMPUTED KERNEL (the twin asserts this; nothing here
// trusts the literal). QUIET_RING is the diamond ring; QUIET_COLUMNS is the four corner blocks.
function patternFrom(str) {
  const rs = str.split('/');
  const v = new Uint8Array(M);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (rs[r][c] === '#') v[r * N + c] = 1;
  return v;  // read-only by convention (typed arrays can't be frozen)
}
const QUIET_RING = patternFrom('.###./#.#.#/##.##/#.#.#/.###.');     // Q0
const QUIET_COLUMNS = patternFrom('#.#.#/#.#.#/...../#.#.#/#.#.#');  // Q1
// === CORE END ===

export {
  N, M, A, mulberry32, buildA, press, applyPresses, matVec, transpose, dot,
  rrefAug, solve, nullspaceBasis, KERNEL, D, isSolvable, weight,
  dealSolvable, dealImpossible, freshState, doPress, forcePaint,
  QUIET_RING, QUIET_COLUMNS
};
