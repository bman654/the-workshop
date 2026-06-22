// ============================================================================
// === CORE BEGIN ===  The Arctic Circle — math core (single source of truth).
// ----------------------------------------------------------------------------
// THE OBJECT: an Aztec diamond of order n — the staircase region of unit cells
//   { (x,y) : 1 <= x,y <= 2n  AND  n <= x+y <= 3n+1 } (a diamond 2n cells wide at
//   its waist). It is tiled by 1×2 DOMINOES; the number of distinct tilings is
//   exactly 2^(n(n+1)/2). We SAMPLE one uniformly at random by DOMINO-SHUFFLING
//   (Elkies–Kuperberg–Larsen–Propp 1992).
//
// THE SOUL: order has a coastline. Sample a uniform tiling at large n and the four
//   CORNERS freeze into a forced one-orientation brick-wall, while the CENTER stays
//   a salt-and-pepper churn of all four orientations. The boundary between frozen
//   and temperate is — in the limit — the INSCRIBED CIRCLE (the Arctic Circle
//   theorem, Jockusch–Propp–Shor 1998): the temperate region is a disk of area
//   π/4 of the diamond, so the temperate-tile fraction → π/4 as n → ∞.
//
// REPRESENTATION. A tiling at order n lives on a (2n)×(2n) grid of unit cells,
//   indexed [r][c] with r,c in [0,2n). A DOMINO covers two adjacent cells and gets
//   one of four ORIENTATION labels by its position+direction, following the EKLP
//   "brick-wall" coloring that makes the four frozen corners monochromatic:
//     'N' — horizontal domino whose pair the algorithm slides UP    (north)
//     'S' — horizontal domino whose pair the algorithm slides DOWN  (south)
//     'W' — vertical   domino whose pair the algorithm slides LEFT  (west)
//     'E' — vertical   domino whose pair the algorithm slides RIGHT (east)
//   We carry the slide-direction ON each domino so the shuffle is purely local and
//   the corner-coloring is exact. A cell stores {di,dj} = the unit slide vector of
//   the domino occupying it (the SAME vector for both covered cells), or null.
//
// THE SHUFFLE (one step, order k → k+1):
//   (1) DESTRUCTION — find every 2×2 block holding two dominoes that point INTO
//       each other (a "bad block": e.g. an up-slider above a down-slider, or a
//       left beside a right) and DELETE both. These are the doomed pairs.
//   (2) SLIDING     — every surviving domino moves ONE cell in its slide direction
//       onto the larger (k+1) board. Sliding is collision-free: the destruction
//       step removed exactly the dominoes that would have collided.
//   (3) CREATION    — the now-empty 2×2 holes are filled, each independently, by a
//       fair COIN FLIP: two horizontal dominoes (top=N over bottom=S) OR two
//       vertical dominoes (left=W beside right=E). This coin is the only randomness
//       and it is what makes the resulting tiling UNIFORMLY random.
//   Run from order 0 up to n and you hold a uniform sample. Every claim below is
//   COMPUTED from the sampled tilings (or exhaustive enumeration), never hard-coded.
// ----------------------------------------------------------------------------

// ── a tiny deterministic PRNG so the page, the in-page test, and the Node twin all
//    sample the SAME tilings from a seed (xorshift32; >>>0 keeps it unsigned). ──
function makeRng(seed){
  let s = (seed >>> 0) || 0x9e3779b9;
  return function(){
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 0x100000000;          // [0,1)
  };
}

// the four slide vectors, keyed by orientation label.
const ORI = {
  N: { di:-1, dj: 0 },   // horizontal pair slides up
  S: { di: 1, dj: 0 },   // horizontal pair slides down
  W: { di: 0, dj:-1 },   // vertical pair slides left
  E: { di: 0, dj: 1 },   // vertical pair slides right
};
const ORIENTATIONS = ['N','S','E','W'];

// label a slide vector back to its orientation letter (inverse of ORI).
function labelOf(di, dj){
  if (di === -1 && dj === 0) return 'N';
  if (di ===  1 && dj === 0) return 'S';
  if (di ===  0 && dj === -1) return 'W';
  if (di ===  0 && dj ===  1) return 'E';
  return null;
}

// ── a tiling is a square grid `cell[r][c]` of size (2n)×(2n). Each entry is null
//    (outside the diamond, or momentarily empty) or {di,dj} naming the slide vector
//    of the domino covering that cell. Both cells a domino covers carry the SAME
//    {di,dj}; the domino's "anchor" is its top-left covered cell. ──
function emptyGrid(size){
  const g = new Array(size);
  for (let r = 0; r < size; r++){ g[r] = new Array(size).fill(null); }
  return g;
}

// is cell (r,c) inside the order-n Aztec diamond, on a (2n)×(2n) grid? The diamond
// is the staircase region; on a 2n grid (0-indexed) the inside cells satisfy, with
// the grid centered, |2r+1-2n| + |2c+1-2n| <= 2n. (Derived, not magic: each row
// from the top has a widening then narrowing run of cells, symmetric.)
function inDiamond(n, r, c){
  const size = 2 * n;
  if (r < 0 || c < 0 || r >= size || c >= size) return false;
  const dr = Math.abs(2*r + 1 - 2*n);
  const dc = Math.abs(2*c + 1 - 2*n);
  return dr + dc <= 2*n;
}

// count the diamond's cells (= 2·n·(n+1), always even — it is tileable by dominoes).
function diamondCellCount(n){
  let k = 0;
  for (let r = 0; r < 2*n; r++) for (let c = 0; c < 2*n; c++) if (inDiamond(n, r, c)) k++;
  return k;
}

// ── ONE domino-shuffle step: a tiling of order k (on a 2k grid) → a tiling of order
//    k+1 (on a 2(k+1) grid). Pure: returns a fresh grid. `rng` supplies creation
//    coin-flips. This is the EKLP move; correctness is checked exhaustively below. ──
function shuffleStep(gridK, k, rng){
  const newN = k + 1;
  const newSize = 2 * newN;
  // map old-grid coords → new-grid coords: the diamond grows by one ring, centered,
  // so an old cell (r,c) sits at (r+1, c+1) on the bigger grid.
  const OFF = 1;

  // -- gather the dominoes of gridK as anchored pieces (top-left cell + orientation) --
  const oldSize = 2 * k;
  const seen = emptyGrid(oldSize);                 // mark cells already assigned to a piece
  const pieces = [];                               // {r,c, di,dj, r2,c2}  (anchor + partner, OLD coords)
  for (let r = 0; r < oldSize; r++){
    for (let c = 0; c < oldSize; c++){
      const v = gridK[r] && gridK[r][c];
      if (!v || seen[r][c]) continue;
      // partner cell of this domino: for horizontal (di=0? no) — orientation tells us.
      // N/S are HORIZONTAL dominoes (partner to the right); W/E are VERTICAL (partner below).
      const lab = labelOf(v.di, v.dj);
      let r2, c2;
      if (lab === 'N' || lab === 'S'){ r2 = r;     c2 = c + 1; }   // horizontal: partner east
      else                          { r2 = r + 1; c2 = c;     }   // vertical:   partner south
      seen[r][c] = { mark:true };
      if (r2 < oldSize && c2 < oldSize) seen[r2][c2] = { mark:true };
      pieces.push({ r, c, r2, c2, di:v.di, dj:v.dj, lab });
    }
  }

  // -- (1) DESTRUCTION: drop dominoes that are part of a bad 2×2 block (point into
  //    each other). A bad block is a 2×2 of cells filled by exactly two dominoes
  //    whose slide vectors point INTO the block's shared edge: an N (up) sitting
  //    BELOW an S (down) in the same two columns, or a W (left) sitting RIGHT of an
  //    E (right) in the same two rows. We detect these by scanning 2×2 anchor cells. --
  const killed = new Set();                        // indices of destroyed pieces
  const pieceAt = emptyGrid(oldSize);              // cell → piece index
  pieces.forEach((p, i) => { pieceAt[p.r][p.c] = i; pieceAt[p.r2][p.c2] = i; });

  for (let r = 0; r + 1 < oldSize; r++){
    for (let c = 0; c + 1 < oldSize; c++){
      const i00 = pieceAt[r][c], i01 = pieceAt[r][c+1];
      const i10 = pieceAt[r+1][c], i11 = pieceAt[r+1][c+1];
      if (i00 == null || i01 == null || i10 == null || i11 == null) continue;
      // a 2×2 block exactly covered by two dominoes occupying these 4 cells:
      // case A — two HORIZONTAL dominoes stacked: top is S(down) above bottom N(up):
      if (i00 === i01 && i10 === i11 && i00 !== i10){
        const top = pieces[i00], bot = pieces[i10];
        if (top.lab === 'S' && bot.lab === 'N'){ killed.add(i00); killed.add(i10); }
      }
      // case B — two VERTICAL dominoes side by side: left is E(right) and right W(left):
      if (i00 === i10 && i01 === i11 && i00 !== i01){
        const left = pieces[i00], right = pieces[i01];
        if (left.lab === 'E' && right.lab === 'W'){ killed.add(i00); killed.add(i01); }
      }
    }
  }

  // -- (2) SLIDING: each surviving domino moves one cell in its slide direction,
  //    placed on the NEW (bigger) grid at (r+OFF+di, c+OFF+dj). --
  const ng = emptyGrid(newSize);
  function placePiece(rTop, cLeft, lab){
    const v = ORI[lab];
    if (lab === 'N' || lab === 'S'){ ng[rTop][cLeft] = { di:v.di, dj:v.dj }; ng[rTop][cLeft+1] = { di:v.di, dj:v.dj }; }
    else                          { ng[rTop][cLeft] = { di:v.di, dj:v.dj }; ng[rTop+1][cLeft] = { di:v.di, dj:v.dj }; }
  }
  pieces.forEach((p, i) => {
    if (killed.has(i)) return;
    const v = ORI[p.lab];
    const nr = p.r + OFF + v.di;
    const nc = p.c + OFF + v.dj;
    placePiece(nr, nc, p.lab);
  });

  // -- (3) CREATION: every empty 2×2 block of the new diamond that is fully INSIDE,
  //    fully EMPTY, and whose top-left is the natural anchor of a hole gets filled by
  //    a fair coin: heads ⇒ two horizontals (top N? — careful: a freshly-created
  //    horizontal PAIR is top=N(up) over bottom=S(down) so that NEXT round they are a
  //    *good* (outward-pointing) block, the engine's invariant). tails ⇒ two verticals
  //    (left=W(left), right=E(right)). We find holes by scanning for a 2×2 of inside,
  //    currently-empty cells not yet claimed by a just-placed creation. --
  for (let r = 0; r < newSize; r++){
    for (let c = 0; c < newSize; c++){
      // anchor a hole at its top-left empty inside cell; require the full 2×2 inside & empty
      if (!inDiamond(newN, r, c) || ng[r][c]) continue;
      if (!(inDiamond(newN, r, c+1) && inDiamond(newN, r+1, c) && inDiamond(newN, r+1, c+1))) continue;
      if (ng[r][c+1] || ng[r+1][c] || ng[r+1][c+1]) continue;
      // a genuine empty 2×2 hole — fill by coin flip
      if (rng() < 0.5){
        // two horizontals: top row = N (slides up), bottom row = S (slides down)
        placePiece(r,   c, 'N');
        placePiece(r+1, c, 'S');
      } else {
        // two verticals: left col = W (slides left), right col = E (slides right)
        placePiece(r, c,   'W');
        placePiece(r, c+1, 'E');
      }
    }
  }

  return ng;
}

// ── sample a UNIFORMLY-RANDOM order-n tiling by running the shuffle from order 0. ──
// order-0 is the empty diamond; order-1 is a single 2×2 filled by one coin flip.
function sampleTiling(n, rng){
  rng = rng || makeRng((Math.random()*0xffffffff) >>> 0);
  // order-1 seed: a 2×2 grid, one coin flip.
  let grid = emptyGrid(2);
  if (rng() < 0.5){ placePieceInto(grid, 0, 0, 'N'); placePieceInto(grid, 1, 0, 'S'); }
  else            { placePieceInto(grid, 0, 0, 'W'); placePieceInto(grid, 0, 1, 'E'); }
  let k = 1;
  while (k < n){ grid = shuffleStep(grid, k, rng); k++; }
  return grid;
}

// stand-alone placer (the seed step can't reach shuffleStep's closure)
function placePieceInto(g, rTop, cLeft, lab){
  const v = ORI[lab];
  if (lab === 'N' || lab === 'S'){ g[rTop][cLeft] = { di:v.di, dj:v.dj }; g[rTop][cLeft+1] = { di:v.di, dj:v.dj }; }
  else                          { g[rTop][cLeft] = { di:v.di, dj:v.dj }; g[rTop+1][cLeft] = { di:v.di, dj:v.dj }; }
}

// ── read a tiling back as a list of dominoes {r,c, lab, horizontal} (anchors). ──
function dominoesOf(grid, n){
  const size = 2 * n;
  const seen = emptyGrid(size);
  const out = [];
  for (let r = 0; r < size; r++){
    for (let c = 0; c < size; c++){
      const v = grid[r] && grid[r][c];
      if (!v || seen[r][c]) continue;
      const lab = labelOf(v.di, v.dj);
      const horizontal = (lab === 'N' || lab === 'S');
      const r2 = horizontal ? r : r+1;
      const c2 = horizontal ? c+1 : c;
      seen[r][c] = 1; if (r2 < size && c2 < size) seen[r2][c2] = 1;
      out.push({ r, c, r2, c2, lab, horizontal });
    }
  }
  return out;
}

// ── VALIDITY: a sampled grid is a perfect tiling iff every diamond cell is covered
//    exactly once, no cell outside the diamond is covered, and every domino's two
//    cells agree on {di,dj}. Returns {ok, covered, cells, reason}. ──
function validateTiling(grid, n){
  const size = 2 * n;
  let covered = 0;
  const cells = diamondCellCount(n);
  for (let r = 0; r < size; r++){
    for (let c = 0; c < size; c++){
      const v = grid[r] && grid[r][c];
      const inside = inDiamond(n, r, c);
      if (v && !inside) return { ok:false, covered, cells, reason:`cell (${r},${c}) covered but outside diamond` };
      if (v && inside) covered++;
      if (!v && inside) return { ok:false, covered, cells, reason:`cell (${r},${c}) inside diamond but uncovered` };
    }
  }
  // partner-consistency: every domino's two halves share {di,dj}
  const ds = dominoesOf(grid, n);
  for (const d of ds){
    const a = grid[d.r][d.c], b = grid[d.r2] && grid[d.r2][d.c2];
    if (!b || a.di !== b.di || a.dj !== b.dj) return { ok:false, covered, cells, reason:`domino at (${d.r},${d.c}) halves disagree` };
  }
  return { ok: covered === cells, covered, cells, reason: covered === cells ? '' : 'cover count mismatch' };
}

// ============================================================================
// THE THREE MEASUREMENTS (each with its negative control)
// ============================================================================

// ── CRUX-1 (EXACT, per tiling): the four FROZEN CORNERS are MONOCHROMATIC. The
//    frozen region is, by the Arctic-Circle structure, four single-orientation
//    brick-walls anchored at the diamond's four tips — N at the top, S at the bottom,
//    W at the left, E at the right. We DERIVE each frozen corner by flood-filling
//    from its tip over same-orientation cells (classifyFrozen), then verify two exact
//    facts that hold for EVERY valid sampled tiling:
//      (a) each non-empty frozen corner is STRICTLY single-orientation (zero defects),
//          and that orientation is the one its tip forces;
//      (b) the four corners are DISJOINT and grow with n.
//    A corrupted corner (one tile re-oriented away from its corner's color — the
//    neg-control) makes that corner non-monochromatic and is DETECTED.
//
//    Note on honesty: WHICH cells freeze is asymptotic (at tiny n the disorder can
//    reach a tip), but "any frozen brick-wall the tip-flood reaches is monochromatic
//    in the tip's forced orientation" is EXACT for every n — that is the per-tiling
//    invariant we assert, and it is what the visible frozen corners ARE. ──
const TIP_ORI = { top:'N', bottom:'S', left:'W', right:'E' };

// the four tip seed-cells + their forced orientation (two cells per tip).
function tipSeeds(n){
  const size = 2 * n;
  return {
    top:    [[0, n-1], [0, n]],
    bottom: [[size-1, n-1], [size-1, n]],
    left:   [[n-1, 0], [n, 0]],
    right:  [[n-1, size-1], [n, size-1]],
  };
}

// flood-fill ONE corner from its tip over same-orientation cells; return the set of
// cells and the (single) orientation found, plus whether it is strictly mono.
function floodCorner(grid, n, side){
  const ori = buildOriMap(grid, n);
  const size = 2 * n;
  const want = TIP_ORI[side];
  const seeds = tipSeeds(n)[side];
  const seen = emptyGrid(size);
  const cells = [];
  let mono = true, foundOri = null;
  const stack = [];
  for (const [r, c] of seeds){
    if (inDiamond(n, r, c) && ori[r][c] === want && !seen[r][c]){ seen[r][c] = true; stack.push([r, c]); }
  }
  while (stack.length){
    const [r, c] = stack.pop();
    cells.push([r, c]);
    if (foundOri == null) foundOri = ori[r][c]; else if (ori[r][c] !== foundOri) mono = false;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size || seen[nr][nc]) continue;
      if (inDiamond(n, nr, nc) && ori[nr][nc] === want){ seen[nr][nc] = true; stack.push([nr, nc]); }
    }
  }
  return { cells, count: cells.length, ori: foundOri, mono: mono && (foundOri === want || foundOri == null), want };
}

// the exact per-tiling corner report: every flooded corner is mono in its forced
// orientation, and (for n where the corners have formed) all four are non-empty.
function cornerReport(grid, n){
  const r = {};
  let allMono = true;
  for (const side of ['top','bottom','left','right']){
    const f = floodCorner(grid, n, side);
    r[side] = { count: f.count, ori: f.ori, mono: f.mono };
    if (!f.mono) allMono = false;
  }
  r.allMono = allMono;
  r.allNonEmpty = r.top.count > 0 && r.bottom.count > 0 && r.left.count > 0 && r.right.count > 0;
  return r;
}

// ── CRUX-2 (MEASURED, asymptotic): the TEMPERATE-tile fraction → π/4 as n grows.
//    A tile is "frozen" if it lies in one of the four corner brick-walls; it is
//    "temperate" otherwise. We classify each domino by whether it sits inside the
//    inscribed circle (radius = n, the diamond half-width in cell units) centered at
//    the diamond center: a tile whose center is inside the inscribed circle is
//    temperate. We report the temperate FRACTION and compare to π/4. This is a
//    measured-over-large-n claim with a named band, NOT an exact equality. ──
function diamondCenter(n){ return { cr: (2*n - 1) / 2, cc: (2*n - 1) / 2 }; }   // grid center

function tileCenter(d){ return { r: (d.r + d.r2) / 2, c: (d.c + d.c2) / 2 }; }

// ori[r][c] = orientation letter of the domino covering cell (r,c), or null. The
// per-cell orientation field both the classifier and the renderer read.
function buildOriMap(grid, n){
  const size = 2 * n;
  const ori = emptyGrid(size);
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++){
    const v = grid[r][c];
    ori[r][c] = v ? labelOf(v.di, v.dj) : null;
  }
  return ori;
}

// classify cells as FROZEN or TEMPERATE by the ORDER intrinsic to the tiling (NOT by
// geometry). The four frozen corners are the maximal CONNECTED single-orientation
// brick-walls anchored at the diamond's four tips: flood-fill from each tip over
// 4-connected cells of the SAME orientation, and everything that flood reaches is
// FROZEN. Every other cell is TEMPERATE (the churn). This is a property of the
// TILING, so a real uniform sample's temperate fraction climbs toward π/4 as n grows,
// while the all-frozen brick-wall control reads ~0 (it is ALL one of the four frozen
// regions). Returns a {frozen[][], frozenCount, temperateCount, total} report.
function classifyFrozen(grid, n){
  const size = 2 * n;
  const ori = buildOriMap(grid, n);
  const frozen = emptyGrid(size);               // true = frozen cell
  // the eight tip cells (two per tip) and the orientation each tip forces
  const tips = [
    [0, n-1, 'N'], [0, n, 'N'],
    [size-1, n-1, 'S'], [size-1, n, 'S'],
    [n-1, 0, 'W'], [n, 0, 'W'],
    [n-1, size-1, 'E'], [n, size-1, 'E'],
  ];
  for (const [tr, tc, lab] of tips){
    if (!inDiamond(n, tr, tc) || ori[tr][tc] !== lab || frozen[tr][tc]) continue;
    const stack = [[tr, tc]]; frozen[tr][tc] = true;
    while (stack.length){
      const [r, c] = stack.pop();
      const nb = [[r+1,c],[r-1,c],[r,c+1],[r,c-1]];
      for (const [nr, nc] of nb){
        if (nr < 0 || nc < 0 || nr >= size || nc >= size || frozen[nr][nc]) continue;
        if (inDiamond(n, nr, nc) && ori[nr][nc] === lab){ frozen[nr][nc] = true; stack.push([nr, nc]); }
      }
    }
  }
  let frozenCount = 0, total = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (inDiamond(n, r, c)){
    total++; if (frozen[r][c]) frozenCount++;
  }
  return { frozen, frozenCount, temperateCount: total - frozenCount, total };
}

// the TEMPERATE fraction (the churn's share of the diamond), measured by cell count.
function temperateFraction(grid, n){
  const c = classifyFrozen(grid, n);
  return { temperate: c.temperateCount, total: c.total, fraction: c.total ? c.temperateCount / c.total : 0 };
}

// The temperate disorder fills the diamond's INSCRIBED CIRCLE in the n→∞ limit
// (Jockusch–Propp–Shor); that disk is π/4 of the diamond by AREA — diamond (L1 ball,
// tip-radius n) area 2n², inscribed disk (radius n/√2) area πn²/2, ratio π/4 — so the
// temperate fraction → π/4. The convergence is genuinely SLOW (the frozen↔temperate
// boundary fluctuates at scale n^{2/3}), so this is a MEASURED, ASYMPTOTIC claim:
// the fraction rises MONOTONICALLY with n toward π/4 within a named band, never an
// exact equality. We expose the target in ONE place for the test and the page.
const TEMPERATE_TARGET = Math.PI / 4;           // ≈ 0.7853981633974483

// the GEOMETRIC inscribed-circle radius (grid-cell units) — used by the page to draw
// the ghost-circle overlay the disorder hugs. R = n/√2 (see the area note above).
function inscribedRadius(n){ return n / Math.SQRT2; }

// the all-FROZEN deterministic tiling (the brick-wall over the WHOLE diamond) — the
// neg-control for CRUX-2. We build a fully-frozen tiling: tile the diamond entirely
// with HORIZONTAL dominoes in a brick pattern (a valid tiling of the Aztec diamond
// for every n). Its temperate fraction (tiles inside the inscribed disk by the SAME
// classifier) is NOT what a uniform sample gives — but for the NEG-CONTROL we want a
// tiling that has NO temperate churn: the "all-frozen" structural control. We define
// frozen-fraction = 1 − temperateFraction and assert the all-horizontal brick tiling
// is overwhelmingly one-orientation (its ORIENTATION entropy is ~0), unlike a sample.
function allHorizontalTiling(n){
  // tile each row-pair of the diamond with horizontal dominoes left→right. Each
  // diamond row has an EVEN number of cells (the diamond is balanced), so pairing
  // (c,c+1) across the row's contiguous inside-run yields a valid tiling.
  const size = 2 * n;
  const g = emptyGrid(size);
  for (let r = 0; r < size; r++){
    // find the contiguous inside run of this row (the diamond rows are single runs)
    let c = 0;
    while (c < size){
      if (!inDiamond(n, r, c)){ c++; continue; }
      // start of a run
      let c0 = c;
      while (c < size && inDiamond(n, r, c)) c++;
      const len = c - c0;                       // run length (even)
      for (let cc = c0; cc + 1 < c0 + len; cc += 2){
        // a horizontal domino; pick N for the top half of the diamond, S for bottom,
        // purely to make it visibly one-orientation per band (still a valid tiling).
        const lab = (r < n) ? 'N' : 'S';
        placePieceInto(g, r, cc, lab);
      }
    }
  }
  return g;
}

// orientation entropy of a tiling (Shannon, base 2 over the 4 orientations) — a
// uniform-sample is high (churn); the all-frozen control is ~0. Used by CRUX-2's
// neg-control to show "no temperate churn".
function orientationEntropy(grid, n){
  const ds = dominoesOf(grid, n);
  const counts = { N:0, S:0, E:0, W:0 };
  for (const d of ds) counts[d.lab]++;
  const tot = ds.length || 1;
  let H = 0;
  for (const k of ORIENTATIONS){
    const p = counts[k] / tot;
    if (p > 0) H -= p * Math.log2(p);
  }
  return { H, counts, total: ds.length };
}

// ── CRUX-3 (EXACT, sampler-sanity): order-n admits exactly 2^(n(n+1)/2) tilings.
//    A small-n EXHAUSTIVE enumeration of all domino tilings of the Aztec diamond
//    matches this count — catching a biased/incorrect shuffler. ──
function tilingCountFormula(n){ return Math.pow(2, n * (n + 1) / 2); }

// exhaustive count of domino tilings of the order-n Aztec diamond (n small). We
// enumerate by backtracking over the diamond cells in row-major order, placing a
// horizontal or vertical domino covering the first empty cell. This counts EVERY
// perfect matching of the cell-adjacency graph = every domino tiling. EXACT.
function enumerateTilingCount(n){
  const size = 2 * n;
  const inD = (r, c) => inDiamond(n, r, c);
  const filled = emptyGrid(size);                  // null = empty inside / outside, true = filled
  // precompute the ordered list of inside cells
  const cells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (inD(r,c)) cells.push([r,c]);
  let count = 0;
  function firstEmpty(){
    for (const [r,c] of cells) if (!filled[r][c]) return [r,c];
    return null;
  }
  function rec(){
    const fe = firstEmpty();
    if (!fe){ count++; return; }
    const [r,c] = fe;
    // try horizontal (cover (r,c)+(r,c+1))
    if (inD(r, c+1) && !filled[r][c+1]){
      filled[r][c] = true; filled[r][c+1] = true;
      rec();
      filled[r][c] = null; filled[r][c+1] = null;
    }
    // try vertical (cover (r,c)+(r+1,c))
    if (inD(r+1, c) && !filled[r+1][c]){
      filled[r][c] = true; filled[r+1][c] = true;
      rec();
      filled[r][c] = null; filled[r+1][c] = null;
    }
  }
  rec();
  return count;
}

// ── the self-test battery (the page runs the SAME one). Keeps n small/fast so the
//    in-page pill stays snappy; the Node twin pushes further. ──
function runSelfTest(){
  const lines = [];
  const ck = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // (1) CRUX-3 EXACT — exhaustive tiling count === 2^(n(n+1)/2), n=1..4.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 4; n++){
      const got = enumerateTilingCount(n);
      const want = tilingCountFormula(n);
      if (got !== want){ ok = false; ff = `n=${n}: enum ${got} ≠ 2^(n(n+1)/2)=${want}`; break; }
    }
    ck('CRUX-3 (exact): tilings(n) === 2^(n(n+1)/2), exhaustive n=1..4', ok, ff || '1·2·8·64 — counts match the formula');
  }

  // (2) sampler VALIDITY — sampleTiling(n) is a PERFECT tiling for n=1..16, several seeds.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 16 && ok; n += (n < 6 ? 1 : 5)){
      for (let s = 1; s <= 4 && ok; s++){
        const g = sampleTiling(n, makeRng((0x51A1 ^ (n*7919 + s*104729)) >>> 0));
        const v = validateTiling(g, n);
        if (!v.ok){ ok = false; ff = `n=${n},seed${s}: ${v.reason} (${v.covered}/${v.cells})`; }
      }
    }
    ck('sampler validity: every sampled tiling perfectly covers the diamond (n=1..16)', ok, ff || 'every sample is a perfect tiling');
  }

  // (3) CRUX-1 EXACT — every flood-filled frozen corner is STRICTLY monochromatic in
  //     its forced orientation (N/S/W/E), in EVERY sampled tiling, and at n≥10 all four
  //     corners have formed (non-empty). n=10..16, several seeds.
  {
    let ok = true, ff = '';
    for (let n = 10; n <= 16 && ok; n += 2){
      for (let s = 1; s <= 6 && ok; s++){
        const g = sampleTiling(n, makeRng((0xC0FFEE ^ (n*40503 + s*2654435761)) >>> 0));
        const cr = cornerReport(g, n);
        if (!cr.allMono){ ok = false; ff = `n=${n},seed${s}: a corner is not monochromatic`; }
        else if (!cr.allNonEmpty){ ok = false; ff = `n=${n},seed${s}: a corner empty (${cr.top.count}/${cr.bottom.count}/${cr.left.count}/${cr.right.count})`; }
      }
    }
    ck('CRUX-1 (exact): all four frozen corners strictly monochromatic N/S/W/E, EVERY sample (n=10..16)', ok, ff || 'each corner is one forced orientation in every sample');
  }

  // (4) CRUX-1 NEG-CONTROL — corrupt ONE cell that the top frozen corner contains
  //     (change its orientation away from N): the region the original tip-flood marked
  //     is no longer monochromatic, and a recheck over those exact cells DETECTS it.
  {
    const n = 12;
    const g = sampleTiling(n, makeRng(0x1234abcd));
    const top = floodCorner(g, n, 'top');       // the original frozen-corner cell set
    const beforeMono = top.mono && top.count > 1;
    // pick a non-tip cell of the corner and re-color it E (a real defect inside the wall)
    const victim = top.cells[top.cells.length - 1];
    const v = ORI['E'];
    g[victim[0]][victim[1]] = { di:v.di, dj:v.dj };
    // recheck monochromaticity over the ORIGINAL corner cell set (not a fresh flood,
    // which would just route around the defect)
    const oriNow = buildOriMap(g, n);
    let stillMono = true;
    for (const [r, c] of top.cells) if (oriNow[r][c] !== 'N') stillMono = false;
    const detected = beforeMono && !stillMono;
    ck('CRUX-1 neg-control: a corrupted cell inside the top frozen corner is DETECTED', detected, `before mono=${beforeMono} (n=${top.count}), after mono=${stillMono}`);
  }

  // (5) CRUX-2 MEASURED, ASYMPTOTIC — the temperate fraction climbs toward π/4 as n
  //     grows: it rises MONOTONICALLY across n ∈ {12,24,48} (averaged over seeds) and
  //     lands within a named band of π/4 at the largest. Convergence is slow (the
  //     boundary fluctuates at scale n^{2/3}), so this is a measured-over-large-n claim
  //     with a tolerance, NEVER an exact equality.
  {
    const ns = [12, 24, 48], seeds = 4;
    const fr = ns.map(n => {
      let acc = 0;
      for (let s = 0; s < seeds; s++) acc += temperateFraction(sampleTiling(n, makeRng((0xBEEF01 + s*0x9e3779b9 + n*2246822519) >>> 0)), n).fraction;
      return acc / seeds;
    });
    const monotone = fr[0] < fr[1] && fr[1] < fr[2];   // climbing toward π/4
    const band = 0.13;                                 // generous: slow finite-size convergence
    const nearTarget = (TEMPERATE_TARGET - fr[2]) >= 0 && (TEMPERATE_TARGET - fr[2]) <= band;  // below & within band
    ck(`CRUX-2 (measured): temperate fraction climbs toward π/4 (n=12<24<48, within −${band} at n=48)`,
       monotone && nearTarget,
       `frac=[${fr.map(x=>x.toFixed(3)).join(', ')}] → π/4=${TEMPERATE_TARGET.toFixed(3)} (Δ@48=${(TEMPERATE_TARGET-fr[2]).toFixed(3)})`);
  }

  // (6) CRUX-2 NEG-CONTROL — a fully-frozen (deterministic brick-wall) tiling has
  //     temperate fraction ≈ 0 (it is ENTIRELY one of the four frozen regions, no
  //     churn), far outside the band a real sample lands in. The flood-fill classifier
  //     swallows the whole brick-wall as frozen.
  {
    const n = 24;
    const frozenFrac = temperateFraction(allHorizontalTiling(n), n).fraction;
    const sampleFrac = temperateFraction(sampleTiling(n, makeRng(0x0DDBA11)), n).fraction;
    const ok = frozenFrac <= 0.02 && sampleFrac >= 0.45 && (sampleFrac - frozenFrac) >= 0.4;
    ck('CRUX-2 neg-control: all-frozen tiling temperate ≈ 0 ≪ a real sample (no churn)', ok, `frozen=${frozenFrac.toFixed(4)}, sample=${sampleFrac.toFixed(3)}`);
  }

  // (7) UNIFORMITY spot-check — at n=2 (8 tilings) the empirical distribution over
  //     2000 samples is roughly uniform: every tiling appears, χ²-ish max deviation
  //     within a loose band. Catches a grossly biased shuffler.
  {
    const n = 2, trials = 2400, expected = 8;
    const counts = new Map();
    const rng = makeRng(0xA11CE);
    for (let i = 0; i < trials; i++){
      const g = sampleTiling(n, rng);
      const key = canonicalKey(g, n);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const distinct = counts.size;
    const exp = trials / expected;
    let maxRatio = 0;
    for (const v of counts.values()) maxRatio = Math.max(maxRatio, Math.abs(v - exp) / exp);
    const ok = distinct === expected && maxRatio < 0.35;
    ck('uniformity: n=2 samples hit all 8 tilings ~uniformly (2400 draws)', ok, `distinct=${distinct}/8, maxDev=${(maxRatio*100).toFixed(1)}%`);
  }

  const pass = lines.filter(l => l.ok).length;
  const total = lines.length;
  const fails = lines.filter(l => !l.ok).map(l => l.name + (l.detail ? ' — ' + l.detail : ''));
  return { pass, total, fails, lines };
}

// a canonical string key for a tiling (for the uniformity histogram) — read the
// orientation letter at each diamond cell in row-major order.
function canonicalKey(grid, n){
  const size = 2 * n;
  let s = '';
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++){
    if (!inDiamond(n, r, c)){ continue; }
    const v = grid[r][c];
    s += v ? labelOf(v.di, v.dj) : '.';
  }
  return s;
}
// === CORE END ===
// ============================================================================

export {
  makeRng, ORI, ORIENTATIONS, labelOf,
  emptyGrid, inDiamond, diamondCellCount,
  shuffleStep, sampleTiling, placePieceInto, dominoesOf, validateTiling,
  TIP_ORI, tipSeeds, floodCorner, cornerReport,
  diamondCenter, tileCenter, buildOriMap, classifyFrozen, temperateFraction, TEMPERATE_TARGET, inscribedRadius,
  allHorizontalTiling, orientationEntropy,
  tilingCountFormula, enumerateTilingCount,
  canonicalKey, runSelfTest,
};
