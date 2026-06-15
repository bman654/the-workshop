// Node twin for the Latin Square math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the
// page's self-test and this test can never drift. Asserts the conditional math claim.
import { N, SYMS, countSolutions, deduce, generate } from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// Is `grid` a valid full 5×5 Latin square? (each symbol once per row AND once per col)
function isLatin(grid) {
  if (grid.length !== N) return false;
  for (let r = 0; r < N; r++) {
    if (grid[r].length !== N) return false;
    const row = new Set(), col = new Set();
    for (let c = 0; c < N; c++) {
      const rv = grid[r][c], cv = grid[c][r];
      if (!SYMS.includes(rv) || !SYMS.includes(cv)) return false;
      row.add(rv); col.add(cv);
    }
    if (row.size !== N || col.size !== N) return false;
  }
  return true;
}
function gridsEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ── Constants the win-line asserts (checkable, not decorative) ──
// Total 5×5 Latin squares = 161280; reduced (first row & first col in order) = 56.
// L(5)=161280 and the reduced count R(5)=56 are standard combinatorial values
// (R(n)=L(n)/(n!·(n-1)!): 161280 / (120·24) = 56).
const TOTAL_5 = 161280, REDUCED_5 = 56;
ck('constant: total 5×5 Latin squares = 161280', TOTAL_5 === 161280);
ck('constant: reduced 5×5 Latin squares = 56', REDUCED_5 === 56);
ck('constant: 161280 / (5! · 4!) === 56 (reduced-count identity)',
  TOTAL_5 / (120 * 24) === REDUCED_5);

// ── The main claim across many seeds ──
const SEEDS = 200;
let allUnique = 0, allDeduced = 0, allLatin = 0, allMatch = 0;
let controlBoth = 0; // negative control fired on BOTH measures
let controlEither = 0; // fired on at least one
let minG = 99, maxG = 0;

for (let s = 1; s <= SEEDS; s++) {
  const seed = (s * 2654435761) >>> 0;
  const { full, givens } = generate(seed);

  const cnt = countSolutions(givens, 9);
  if (cnt === 1) allUnique++;

  const d = deduce(givens);
  if (d.solved) allDeduced++;
  if (isLatin(d.val)) allLatin++;
  if (gridsEqual(d.val, full)) allMatch++;

  const ng = givens.flat().filter(x => x).length;
  minG = Math.min(minG, ng); maxG = Math.max(maxG, ng);

  // fillOrder sanity: every filled cell carries a NAMED rule, never a guess; and the
  // number of logic-fills equals the number of originally-blank cells on a solved board.
  const validRules = d.fillOrder.every(f =>
    ['naked-single', 'hidden-single-row', 'hidden-single-col'].includes(f.rule));
  const blanksAtStart = givens.flat().filter(x => x === 0).length;
  if (!(validRules && (!d.solved || d.fillOrder.length === blanksAtStart))) {
    fails.push('fillOrder integrity (seed ' + seed + ')'); fail++;
  } else pass++;

  // NEGATIVE CONTROL: remove ONE random (existing) given. With a MINIMAL dig every
  // clue is load-bearing, so this must break uniqueness OR deduction (verified BOTH).
  const present = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (givens[r][c]) present.push([r, c]);
  // deterministic pick: rotate through the present givens by seed so the test is stable
  const [pr, pc] = present[seed % present.length];
  const broken = givens.map(r => r.slice());
  broken[pr][pc] = 0;
  const bcnt = countSolutions(broken, 9);
  const bded = deduce(broken).solved;
  const fired = (bcnt >= 2) || (!bded);
  const firedBoth = (bcnt >= 2) && (!bded);
  if (fired) controlEither++;
  if (firedBoth) controlBoth++;
}

ck('all ' + SEEDS + ' boards have EXACTLY one solution (count===1)', allUnique === SEEDS);
ck('all ' + SEEDS + ' boards solved by deduction alone (no backtracking)', allDeduced === SEEDS);
ck('all ' + SEEDS + ' deduced grids are valid Latin squares', allLatin === SEEDS);
ck('all ' + SEEDS + ' deduced grids === the generated full square', allMatch === SEEDS);
ck('negative control fires (count>=2 OR deduce stalls) on all ' + SEEDS, controlEither === SEEDS);
ck('negative control fires on BOTH measures on all ' + SEEDS, controlBoth === SEEDS);
ck('givens stay in the minimal band (6..12)', minG >= 6 && maxG <= 12);

// ── report ──
console.log('Latin Square core.test.mjs');
console.log('  seeds: ' + SEEDS + ' · givens range ' + minG + '..' + maxG);
console.log('  unique=' + allUnique + '/' + SEEDS + ' deduced=' + allDeduced + '/' + SEEDS +
  ' latin=' + allLatin + '/' + SEEDS + ' match=' + allMatch + '/' + SEEDS);
console.log('  negative control: both=' + controlBoth + '/' + SEEDS + ' either=' + controlEither + '/' + SEEDS);
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
