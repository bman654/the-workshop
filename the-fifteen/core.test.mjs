// Node twin for The Fifteen math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block at the bottom), so the page's self-test and this test can't drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GOAL, mulberry32, gapIndex, isSolved, inversions, blankRowsBelow,
  parityP, isSolvable, legalMoves, slide, dealSolvable, swapTwo, chooseSwapPair, solve
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const N = 4;

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// ── The seal at GOAL reads 0 (solvable) — the convention's anchor. ──
ck('parityP(GOAL) === 0 (GOAL is solvable)', parityP(GOAL) === 0 && isSolvable(GOAL));

// ── (1) P invariant across a long random LEGAL walk from MANY starts (every dealt board + GOAL). ──
const STARTS = 60, WALK = 4000;
let walkClean = 0, walkTotal = 0;
const rngWalk = mulberry32(99991);
for (let s = -1; s < STARTS; s++) {
  let b = (s < 0) ? GOAL.slice() : dealSolvable((s + 1) * 2654435761);
  const p0 = parityP(b); // every legal start has p0 === 0
  let ok = (p0 === 0);
  let prevGap = -1;
  for (let i = 0; i < WALK; i++) {
    const moves = legalMoves(b).filter(ix => ix !== prevGap);
    const pick = moves[(rngWalk() * moves.length) | 0];
    prevGap = gapIndex(b);
    b = slide(b, pick);
    if (parityP(b) !== p0) ok = false;
  }
  walkTotal++; if (ok) walkClean++;
}
ck('P invariant (=0) across ' + WALK + '-step legal walk from ' + (STARTS + 1) + ' starts', walkClean === walkTotal);

// ── (2) Every dealt board isSolvable && solve() reaches GOAL with nodes>0. ──
const DEALS = 400;
let dealsSolvable = 0, dealsReached = 0, dealsNonIdentity = 0, dealsP0 = 0;
for (let s = 1; s <= DEALS; s++) {
  const b = dealSolvable(s * 2654435761);
  if (!isSolved(b)) dealsNonIdentity++;
  if (parityP(b) === 0) dealsP0++;
  if (isSolvable(b)) dealsSolvable++;
  const r = solve(b);
  if (r.solvable && r.reason === 'reached goal' && r.nodes > 0) dealsReached++;
}
ck('all ' + DEALS + ' dealt boards are non-identity', dealsNonIdentity === DEALS);
ck('all ' + DEALS + ' dealt boards read P=0', dealsP0 === DEALS);
ck('all ' + DEALS + ' dealt boards isSolvable', dealsSolvable === DEALS);
ck('all ' + DEALS + ' dealt boards solve()→reached goal, nodes>0', dealsReached === DEALS);

// ── (3) NEGATIVE CONTROL: a two-tile swap flips P 0→1, isSolvable→false, solve()→{false, nodes:0}; ──
//        the un-swapped board solves. chooseSwapPair returns two distinct non-blank indices.
const NEG = 200;
let pairOK = 0, swapFlipP = 0, swapUnsolv = 0, swapSolverNo = 0, swapSolverZeroNodes = 0, unswapSolves = 0;
for (let s = 1; s <= NEG; s++) {
  const b = dealSolvable((s * 40503 + 7) >>> 0);
  const [i, j] = chooseSwapPair(b);
  if (i >= 0 && j >= 0 && i !== j && b[i] !== 0 && b[j] !== 0) pairOK++;
  const sw = swapTwo(b, i, j);
  if (parityP(b) === 0 && parityP(sw) === 1) swapFlipP++;
  if (!isSolvable(sw)) swapUnsolv++;
  const rs = solve(sw);
  if (rs.solvable === false && rs.reason === 'parity') swapSolverNo++;
  if (rs.nodes === 0) swapSolverZeroNodes++;
  const ru = solve(b);
  if (ru.solvable === true && ru.reason === 'reached goal') unswapSolves++;
}
ck('chooseSwapPair → two distinct non-blank indices (' + NEG + '×)', pairOK === NEG);
ck('swap flips P 0→1 (' + NEG + '×)', swapFlipP === NEG);
ck('swap → isSolvable false (' + NEG + '×)', swapUnsolv === NEG);
ck('swap → solve() solvable:false, reason parity (' + NEG + '×)', swapSolverNo === NEG);
ck('swap → solver searched 0 nodes (no search) (' + NEG + '×)', swapSolverZeroNodes === NEG);
ck('the UN-swapped board solves & reaches goal (' + NEG + '×)', unswapSolves === NEG);

// ── (4) The swap is REVERSIBLE: swap back → P=0, solvable again. ──
let reverseOK = 0;
for (let s = 1; s <= NEG; s++) {
  const b = dealSolvable((s * 2246822519) >>> 0);
  const [i, j] = chooseSwapPair(b);
  const back = swapTwo(swapTwo(b, i, j), i, j);
  if (parityP(back) === 0 && isSolvable(back) && back.every((v, k) => v === b[k])) reverseOK++;
}
ck('swap is reversible → P=0, solvable, identical board (' + NEG + '×)', reverseOK === NEG);

// ── (5) LOCKSTEP: over a long walk, every VERTICAL slide flips BOTH parity terms; every ──
//        HORIZONTAL slide flips NEITHER. 0 violations is the instrument's honesty.
const rngLs = mulberry32(13337);
let lsViolations = 0, vertCount = 0, horizCount = 0, lsSteps = 0;
{
  let b = dealSolvable(424242);
  let prevGap = -1;
  for (let i = 0; i < 20000; i++) {
    const invBefore = inversions(b) & 1, rowBefore = blankRowsBelow(b) & 1;
    const gapBefore = gapIndex(b);
    const moves = legalMoves(b).filter(ix => ix !== prevGap);
    const pick = moves[(rngLs() * moves.length) | 0];
    const vertical = Math.floor(pick / N) !== Math.floor(gapBefore / N); // tile & gap in different rows
    prevGap = gapBefore;
    b = slide(b, pick);
    const invAfter = inversions(b) & 1, rowAfter = blankRowsBelow(b) & 1;
    const invFlipped = invBefore !== invAfter, rowFlipped = rowBefore !== rowAfter;
    lsSteps++;
    if (vertical) { vertCount++; if (!(invFlipped && rowFlipped)) lsViolations++; }
    else { horizCount++; if (invFlipped || rowFlipped) lsViolations++; }
  }
}
ck('LOCKSTEP: vertical flips BOTH terms, horizontal flips NEITHER — 0 violations over ' + lsSteps + ' moves',
  lsViolations === 0 && vertCount > 0 && horizCount > 0);

// ── (6) BYTE-TWIN PARITY — the inlined core in index.html is character-identical to core.mjs ──
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
console.log('The Fifteen core.test.mjs');
console.log('  walk: ' + walkClean + '/' + walkTotal + ' starts clean · deals: solvable=' + dealsSolvable +
  '/' + DEALS + ' reached=' + dealsReached + '/' + DEALS);
console.log('  neg-control: flipP=' + swapFlipP + '/' + NEG + ' unsolvable=' + swapUnsolv + '/' + NEG +
  ' solver-no(0 nodes)=' + swapSolverNo + '/' + NEG + ' · reversible=' + reverseOK + '/' + NEG);
console.log('  lockstep: ' + lsSteps + ' moves (' + vertCount + ' vert · ' + horizCount + ' horiz) · violations=' + lsViolations);
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
