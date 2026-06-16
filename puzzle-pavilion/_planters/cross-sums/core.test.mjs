// Node twin for the Cross-Sums (Kakuro) math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs inlined byte-identical into index.html, so the page's self-test
// and this test can never drift. Asserts the conditional math claim:
//   (a) every generated board has EXACTLY one solution (countSolutions===1);
//   (b) it is reachable by PURE DEDUCTION (deduce solves it, trace carries only named rules);
//   (c) NEGATIVE CONTROL: most clues are load-bearing — loosening one breaks the board;
// plus structural invariants (distinct digits per run, runs sum to their clue).
import {
  DIGITS, comboSets, allowedMask, maskToDigits,
  deriveRuns, countSolutions, deduce, BASES, baseToBoard, verifyBase, generate, loadBearing,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// ── the combinatorial table — checkable canonical Kakuro facts (the quiet math layer) ──
// These "magic blocks" are standard, falsifiable: a sum in k cells has a UNIQUE digit-set
// at the extremes. (e.g. 6-in-3 is only {1,2,3}; 24-in-3 only {7,8,9}.)
ck('combo: 6 in 3 cells = {1,2,3} only', JSON.stringify(comboSets(6, 3).map(m => maskToDigits(m))) === JSON.stringify([[1, 2, 3]]));
ck('combo: 24 in 3 cells = {7,8,9} only', JSON.stringify(comboSets(24, 3).map(m => maskToDigits(m))) === JSON.stringify([[7, 8, 9]]));
ck('combo: 3 in 2 cells = {1,2} only', JSON.stringify(comboSets(3, 2).map(m => maskToDigits(m))) === JSON.stringify([[1, 2]]));
ck('combo: 17 in 2 cells = {8,9} only', JSON.stringify(comboSets(17, 2).map(m => maskToDigits(m))) === JSON.stringify([[8, 9]]));
ck('combo: 10 in 4 cells = {1,2,3,4} only', JSON.stringify(comboSets(10, 4).map(m => maskToDigits(m))) === JSON.stringify([[1, 2, 3, 4]]));
// a known count: the number of 3-cell sets summing to 15 is 8 (a classic magic-square fact)
ck('combo: 15 in 3 cells has exactly 8 sets', comboSets(15, 3).length === 8);
// allowedMask sanity: digits that can appear in a 17-in-2 run are exactly {8,9}
ck('allowedMask(17,2) === {8,9}', JSON.stringify(maskToDigits(allowedMask(17, 2))) === JSON.stringify([8, 9]));

// structural validator: is `cells` (a clue-bearing board) satisfied by numeric `sol`?
function structurallyValid(cells, sol) {
  const { across, down } = deriveRuns(cells);
  for (const run of [...across, ...down]) {
    const seen = new Set(); let s = 0;
    for (const p of run.cells) {
      const v = sol[p.r][p.c];
      if (!DIGITS.includes(v)) return false;     // every fill is 1..9
      if (seen.has(v)) return false;             // DISTINCT within the run
      seen.add(v); s += v;
    }
    if (s !== run.sum) return false;             // run SUMS to its clue
  }
  return true;
}

// ── every base board passes, byte-for-byte ──
let basesOk = 0;
for (const base of BASES) {
  const { cells, sol } = baseToBoard(base);
  if (verifyBase(base) && structurallyValid(cells, sol)) basesOk++;
}
ck('all ' + BASES.length + ' base boards: unique + guess-free + structurally valid', basesOk === BASES.length);

// ── the main claim across many GENERATED boards (base + seeded dihedral transform) ──
const SEEDS = 240;
let allUnique = 0, allDeduced = 0, allMatch = 0, allStruct = 0, ruleOk = 0;
let controlFired = 0;            // ≥1 load-bearing clue exists on every board
let bearingSum = 0, clueSum = 0; // aggregate load-bearing fraction
const RULES = ['combo', 'naked', 'unique'];

for (let s = 1; s <= SEEDS; s++) {
  const seed = (s * 2654435761) >>> 0;
  const g = generate(seed);
  if (!g) { fails.push('generate returned null (seed ' + seed + ')'); fail++; continue; }
  const { cells, sol, fillOrder } = g;

  if (countSolutions(cells, 9) === 1) allUnique++;
  const d = deduce(cells);
  if (d.solved) allDeduced++;
  if (structurallyValid(cells, d.val)) allStruct++;
  // the deduced grid equals the stored answer on every fill cell
  let match = true;
  for (let r = 0; r < cells.length && match; r++) for (let c = 0; c < cells[0].length; c++)
    if (cells[r][c].t === 'fill' && d.val[r][c] !== sol[r][c]) { match = false; break; }
  if (match) allMatch++;
  // every fill step carries a NAMED rule (never a guess) and count === blanks-at-start
  const blanks = cells.flat().filter(x => x.t === 'fill').length;
  if (fillOrder.every(f => RULES.includes(f.rule)) && (!d.solved || fillOrder.length === blanks)) ruleOk++;

  // negative control: count load-bearing clues; at least one must break the board
  const lb = loadBearing(cells);
  if (lb.bearing >= 1) controlFired++;
  bearingSum += lb.bearing; clueSum += lb.total;
}

ck('all ' + SEEDS + ' generated boards have EXACTLY one solution', allUnique === SEEDS);
ck('all ' + SEEDS + ' solved by deduction alone (no guessing)', allDeduced === SEEDS);
ck('all ' + SEEDS + ' deduced grids equal the stored answer', allMatch === SEEDS);
ck('all ' + SEEDS + ' deduced grids are structurally valid (distinct runs sum to clue)', allStruct === SEEDS);
ck('all ' + SEEDS + ' fill-traces are guess-free (named rules, complete)', ruleOk === SEEDS);
ck('negative control: every board has ≥1 load-bearing clue', controlFired === SEEDS);
ck('negative control: ≥half of all clues are load-bearing', bearingSum * 2 >= clueSum);

// ── report ──
console.log('Cross-Sums (Kakuro) core.test.mjs');
console.log('  bases: ' + basesOk + '/' + BASES.length + ' · seeds: ' + SEEDS);
console.log('  unique=' + allUnique + '/' + SEEDS + ' deduced=' + allDeduced + '/' + SEEDS +
  ' match=' + allMatch + '/' + SEEDS + ' struct=' + allStruct + '/' + SEEDS);
console.log('  load-bearing clues: ' + bearingSum + '/' + clueSum +
  ' (' + (100 * bearingSum / clueSum).toFixed(0) + '% pull weight) · control fired ' + controlFired + '/' + SEEDS);
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
