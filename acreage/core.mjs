// === CORE BEGIN ===
// The Acreage — math core (single source of truth).
// A surveyed yard: an N×N grid (N a size parameter, 6..9). Each clue is an anchor cell
// carrying a NUMBER = the AREA of the rectangular plot it belongs to. A solution assigns
// every cell to exactly one clue's axis-aligned rectangle; the rectangle CONTAINS its
// anchor and has area === the clue. The rectangles TILE the grid: no gaps, no overlaps.
// Because every cell is owned, Σ(clues) === N*N is the carried invariant of every board.
//
// This module is the SOLE authority for: the exact solution COUNTER (ground truth), the
// deduction-ONLY solver (PRUNE + only-fit + cell-forced, NO guessing) and the generator
// that digs a board that is BOTH uniquely-solvable AND deduction-solvable. It is inlined
// byte-identical into index.html between the CORE BEGIN / CORE END sentinels and tested by
// core.test.mjs — page & test can never drift.

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

// All candidate rectangles for an anchor clue: every factor pair w·h === area with
// w,h ≤ N, every legal top-left so the rect stays in-bounds AND covers the anchor.
// A PRIME area therefore yields only the 1×p and p×1 strips through the anchor.
function candidateRects(N, ax, ay, area) {
  const out = [];
  for (let w = 1; w <= area; w++) {
    if (area % w) continue;
    const h = area / w;
    if (w > N || h > N) continue;
    // top-left x ∈ [ax-w+1, ax] ∩ [0, N-w]; same for y.
    const x0 = Math.max(0, ax - w + 1), x1 = Math.min(ax, N - w);
    const y0 = Math.max(0, ay - h + 1), y1 = Math.min(ay, N - h);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ x, y, w, h });
  }
  return out;
}

// Collect the anchor clues (cells with a non-zero value) of a board, row-major.
function anchorsOf(N, clues) {
  const anchors = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (clues[y][x]) anchors.push({ x, y, area: clues[y][x] });
  return anchors;
}

// Exact solution COUNTER (GROUND TRUTH, independent of the deducer). Backtracking exact
// cover: place each clue's rectangle in turn; a placement fits iff it covers no occupied
// cell and no OTHER clue's anchor. Because Σ(areas) === N*N is the board invariant, any
// full non-overlapping assignment is necessarily a perfect tiling, so reaching the last
// clue counts as one solution. Capped (default 9) so it can never explode; a return of
// `cap` honestly means "cap or more".
function countSolutions(N, clues, cap = 9) {
  const anchors = anchorsOf(N, clues);
  const cand = anchors.map(a => candidateRects(N, a.x, a.y, a.area));
  const occ = Array.from({ length: N }, () => Array(N).fill(0));
  const anchorAt = Array.from({ length: N }, () => Array(N).fill(-1));
  anchors.forEach((a, i) => { anchorAt[a.y][a.x] = i; });
  let count = 0;
  function fits(ci, R) {
    for (let dy = 0; dy < R.h; dy++) for (let dx = 0; dx < R.w; dx++) {
      const cx = R.x + dx, cy = R.y + dy;
      if (occ[cy][cx]) return false;
      const oa = anchorAt[cy][cx];
      if (oa !== -1 && oa !== ci) return false; // would cover another clue's anchor
    }
    return true;
  }
  function mark(R, v) { for (let dy = 0; dy < R.h; dy++) for (let dx = 0; dx < R.w; dx++) occ[R.y + dy][R.x + dx] += v; }
  function rec(i) {
    if (count >= cap) return;
    if (i === anchors.length) { count++; return; }
    for (const R of cand[i]) {
      if (fits(i, R)) { mark(R, 1); rec(i + 1); mark(R, -1); if (count >= cap) return; }
    }
  }
  rec(0);
  return count;
}

// DEDUCTION-ONLY solver: constraint propagation to a fixpoint, NO branching.
//   PRUNE        — drop any candidate that overlaps a claimed cell of another clue or
//                  covers a foreign anchor; a clue left with zero candidates = contradiction.
//   R1 only-fit  — a clue with exactly ONE live candidate → place it.
//   R2 cell-forced — an unclaimed cell coverable by exactly one (clue,candidate) pair →
//                  that candidate is forced for that clue → place it.
// Returns { solved, contradiction, blanks, fillOrder, claimedBy } where claimedBy is the
// owner grid (clue index per cell; -1 = unclaimed) and every fillOrder step names its rule
// ∈ {'only-fit','cell-forced'} so the page can prove "never a guess".
function deduce(N, clues) {
  const anchors = anchorsOf(N, clues);
  const claimed = Array.from({ length: N }, () => Array(N).fill(false));
  const claimedBy = Array.from({ length: N }, () => Array(N).fill(-1));
  const placed = new Array(anchors.length).fill(false);
  let cand = anchors.map(a => candidateRects(N, a.x, a.y, a.area));
  const fillOrder = [];

  function rectValid(ci, R) {
    for (let dy = 0; dy < R.h; dy++) for (let dx = 0; dx < R.w; dx++) {
      const cx = R.x + dx, cy = R.y + dy;
      if (claimed[cy][cx] && claimedBy[cy][cx] !== ci) return false;
      if (clues[cy][cx]) { // a clue cell — only allowed if it is THIS clue's own anchor
        if (!(cx === anchors[ci].x && cy === anchors[ci].y)) return false;
      }
    }
    return true;
  }
  function place(ci, R, rule) {
    for (let dy = 0; dy < R.h; dy++) for (let dx = 0; dx < R.w; dx++) { claimed[R.y + dy][R.x + dx] = true; claimedBy[R.y + dy][R.x + dx] = ci; }
    placed[ci] = true; cand[ci] = [R];
    fillOrder.push({ ci, anchor: anchors[ci], rect: R, rule });
  }

  let progress = true, contradiction = false;
  while (progress && !contradiction) {
    progress = false;
    // PRUNE
    for (let ci = 0; ci < anchors.length; ci++) {
      if (placed[ci]) continue;
      cand[ci] = cand[ci].filter(R => rectValid(ci, R));
      if (cand[ci].length === 0) { contradiction = true; break; }
    }
    if (contradiction) break;
    // R1 only-fit
    for (let ci = 0; ci < anchors.length; ci++) {
      if (placed[ci]) continue;
      if (cand[ci].length === 1) { place(ci, cand[ci][0], 'only-fit'); progress = true; }
    }
    if (progress) continue;
    // R2 cell-forced
    for (let y = 0; y < N && !progress; y++) for (let x = 0; x < N && !progress; x++) {
      if (claimed[y][x]) continue;
      let owner = -1, ownerR = null, cnt = 0;
      for (let ci = 0; ci < anchors.length; ci++) {
        if (placed[ci]) continue;
        for (const R of cand[ci]) {
          if (x >= R.x && x < R.x + R.w && y >= R.y && y < R.y + R.h) { owner = ci; ownerR = R; cnt++; if (cnt > 1) break; }
        }
        if (cnt > 1) break;
      }
      if (cnt === 1) { place(owner, ownerR, 'cell-forced'); progress = true; }
    }
  }
  let blanks = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!claimed[y][x]) blanks++;
  return { solved: blanks === 0 && !contradiction, contradiction, blanks, fillOrder, claimedBy };
}

// A random rectangular tiling of N×N (the witness). Guillotine-style recursive split:
// split a region fully horizontally or vertically at a random line, or stop and emit a
// rectangle — always a perfect tiling.
function randomTiling(N, rng, minStop) {
  const rects = [];
  function split(x, y, w, h) {
    const area = w * h;
    if (area === 1 || (rng() < minStop && area <= N)) { rects.push({ x, y, w, h }); return; }
    const canV = w > 1, canH = h > 1;
    let vertical;
    if (canV && canH) vertical = rng() < 0.5; else vertical = canV;
    if (vertical) { const cut = 1 + ((rng() * (w - 1)) | 0); split(x, y, cut, h); split(x + cut, y, w - cut, h); }
    else { const cut = 1 + ((rng() * (h - 1)) | 0); split(x, y, w, cut); split(x, y + cut, w, h - cut); }
  }
  split(0, 0, N, N);
  return rects;
}

// Place an anchor at a random CORNER of each rect and write clue = area there. Anchoring at a
// corner (not an interior cell) is what lets the page's drag model — the bounding box of
// {anchor, current cell} — reach the plot's true rectangle: with an interior anchor a single
// bounding box could never span both sides of it. The solver/counter still consider EVERY
// rectangle that contains the anchor, so uniqueness and deduction are unaffected by the choice.
function tilingToBoard(N, rects, rng) {
  const clues = Array.from({ length: N }, () => Array(N).fill(0));
  rects.forEach((R) => {
    const ax = R.x + ((rng() < 0.5) ? 0 : (R.w - 1)), ay = R.y + ((rng() < 0.5) ? 0 : (R.h - 1));
    clues[ay][ax] = R.w * R.h;
    R.anchor = { x: ax, y: ay };
  });
  return clues;
}

// Generator: dig a board that is uniquely-solvable AND deduction-solvable. Produce a random
// tiling, place anchors (the full clue-set always tiles), and accept ONLY if Σ(clues)===N*N
// AND countSolutions===1 (unique) AND deduce().solved (deduction-only). N is a parameter
// (6..9). Returns { N, clues, rects } (rects carries the witness tiling + anchors) or null
// if the tries cap is missed.
function generate(seed, N = 7, tries = 400) {
  const rng = mulberry32(seed);
  for (let t = 0; t < tries; t++) {
    const rects = randomTiling(N, rng, 0.30 + 0.4 * rng());
    if (rects.length < 3 || rects.length > N * N - 1) continue;
    const clues = tilingToBoard(N, rects, rng);
    let sum = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) sum += clues[y][x];
    if (sum !== N * N) continue;
    if (countSolutions(N, clues, 2) !== 1) continue; // unique
    if (!deduce(N, clues).solved) continue;          // deduction-only solvable
    return { N, clues, rects };
  }
  return null;
}
// === CORE END ===

export { mulberry32, shuffle, candidateRects, countSolutions, deduce, generate };
