// Node twin for The Acreage math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block at the bottom), so the page's self-test and this test can't drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { candidateRects, countSolutions, deduce, generate } from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

const SIZES = [6, 7, 8, 9];

// Reconstruct the witness owner-grid from a board's `rects` (the carried tiling): every cell
// of rect i is owned by the anchor with index = position of that anchor in row-major order.
function witnessOwners(N, clues, rects) {
  const anchors = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (clues[y][x]) anchors.push(x + ',' + y);
  const idxOf = new Map(anchors.map((k, i) => [k, i]));
  const owner = Array.from({ length: N }, () => Array(N).fill(-1));
  for (const R of rects) {
    const ci = idxOf.get(R.anchor.x + ',' + R.anchor.y);
    for (let dy = 0; dy < R.h; dy++) for (let dx = 0; dx < R.w; dx++) owner[R.y + dy][R.x + dx] = ci;
  }
  return owner;
}

// ── The main claim across many seeds, cycling sizes 6..9 ──
const SEEDS = 200;
let allInvariant = 0, allUnique = 0, allDeduced = 0, allWitness = 0, allFillOK = 0;
let candPrimeOK = 0, candPrimeTotal = 0;
let allCornerAnchored = 0; // PLAYABILITY invariant: every witness anchor is a rect corner
                           // so the page's bbox-from-anchor drag can always reach the plot.

for (let s = 1; s <= SEEDS; s++) {
  const seed = (s * 2654435761) >>> 0;
  const N = SIZES[s % SIZES.length];
  const g = generate(seed, N);
  if (!g) { fails.push('generate returned null (seed ' + seed + ', N=' + N + ')'); fail++; continue; }

  // Σ(clues) === N*N
  let sum = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) sum += g.clues[y][x];
  if (sum === N * N) allInvariant++;

  // unique
  if (countSolutions(N, g.clues, 2) === 1) allUnique++;

  // deduction-only solvable
  const d = deduce(N, g.clues);
  if (d.solved) allDeduced++;

  // deduced owner grid === the witness tiling reconstructed from rects
  const witness = witnessOwners(N, g.clues, g.rects);
  if (JSON.stringify(d.claimedBy) === JSON.stringify(witness)) allWitness++;

  // PLAYABILITY: every anchor sits at a CORNER of its rect (else the page's bbox-from-anchor
  // drag could never produce that plot — see tilingToBoard's note).
  const corners = g.rects.every(R =>
    (R.anchor.x === R.x || R.anchor.x === R.x + R.w - 1) &&
    (R.anchor.y === R.y || R.anchor.y === R.y + R.h - 1));
  if (corners) allCornerAnchored++;

  // fillOrder integrity: every step names a real rule; #placements === #clues on a solved board
  const nClues = g.clues.flat().filter(x => x).length;
  const rulesOK = d.fillOrder.every(f => ['only-fit', 'cell-forced'].includes(f.rule));
  if (rulesOK && (!d.solved || d.fillOrder.length === nClues)) allFillOK++;

  // candidateRects sanity on a PRIME-area anchor: a prime area p yields ONLY 1×p / p×1 strips.
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = g.clues[y][x];
    if (!a) continue;
    const isPrime = a > 1 && Array.from({ length: a - 2 }, (_, i) => i + 2).every(k => a % k !== 0);
    if (!isPrime) continue;
    candPrimeTotal++;
    const cr = candidateRects(N, x, y, a);
    if (cr.every(R => R.w === 1 || R.h === 1)) candPrimeOK++;
  }
}

ck('all ' + SEEDS + ' boards have Σ(clues) === N*N', allInvariant === SEEDS);
ck('all ' + SEEDS + ' boards have EXACTLY one tiling (count===1)', allUnique === SEEDS);
ck('all ' + SEEDS + ' boards solved by deduction alone (no guessing)', allDeduced === SEEDS);
ck('all ' + SEEDS + ' deduced owner-grids === the witness tiling (rects)', allWitness === SEEDS);
ck('all ' + SEEDS + ' fillOrders are rule-named & complete on solve', allFillOK === SEEDS);
ck('all ' + SEEDS + ' witness anchors are corner-anchored (drag-reachable)', allCornerAnchored === SEEDS);
ck('every prime-area clue yields only 1×p / p×1 candidate strips', candPrimeTotal > 0 && candPrimeOK === candPrimeTotal);

// ── THE NEGATIVE CONTROL — the full sweep ──
// Every clue × every legal ±1 (skip 1→0, clamp ≤ N*N) must break uniqueness OR stall/contradict
// deduction. We track firedEither AND firedBoth, but the PASSING assertion is on firedEither
// ("any single clue bumped by a legal ±1 breaks the puzzle"). EITHER is the true invariant:
// verified 100% either vs ~68% both across thousands of perturbations — DO NOT assert BOTH.
let firedEither = 0, firedBoth = 0, perturbations = 0;
for (let s = 1; s <= SEEDS; s++) {
  const seed = (s * 2654435761) >>> 0;
  const N = SIZES[s % SIZES.length];
  const g = generate(seed, N);
  if (!g) continue;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const orig = g.clues[y][x];
    if (!orig) continue;
    for (const delta of [-1, 1]) {
      let nv = orig + delta;
      if (nv < 1) continue;            // skip 1 → 0 (would delete a clue, not bump it)
      nv = Math.min(nv, N * N);        // clamp ≤ N*N
      if (nv === orig) continue;
      const broken = g.clues.map(r => r.slice());
      broken[y][x] = nv;
      const bcnt = countSolutions(N, broken, 2);
      const bded = deduce(N, broken).solved;
      const fe = (bcnt !== 1) || (!bded);
      const fb = (bcnt !== 1) && (!bded);
      perturbations++;
      if (fe) firedEither++;
      if (fb) firedBoth++;
    }
  }
}
ck('negative control: EVERY ±1 clue bump breaks uniqueness OR stalls deduction (firedEither = all)',
  perturbations > 0 && firedEither === perturbations);

// ── BYTE-TWIN PARITY — the inlined core in index.html is character-identical to core.mjs ──
function coreRegion(path) {
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf('// === CORE BEGIN ===');
  const b = src.indexOf('// === CORE END ===');
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + '// === CORE END ==='.length);
}
const fromCore = coreRegion(join(__dirname, 'core.mjs'));
const fromPage = coreRegion(join(__dirname, 'index.html'));
ck('byte-twin: CORE BEGIN..END found in core.mjs', !!fromCore);
ck('byte-twin: CORE BEGIN..END found in index.html', !!fromPage);
ck('byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);

// ── report ──
console.log('The Acreage core.test.mjs');
console.log('  seeds: ' + SEEDS + ' · sizes ' + SIZES.join(',') + ' · perturbations ' + perturbations);
console.log('  invariant=' + allInvariant + '/' + SEEDS + ' unique=' + allUnique + '/' + SEEDS +
  ' deduced=' + allDeduced + '/' + SEEDS + ' witness=' + allWitness + '/' + SEEDS + ' fillOK=' + allFillOK + '/' + SEEDS);
console.log('  negative control: either=' + firedEither + '/' + perturbations +
  ' both=' + firedBoth + '/' + perturbations + ' (assert on EITHER)');
console.log('  prime-strip candidates: ' + candPrimeOK + '/' + candPrimeTotal);
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
