#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin proving THE DIVIDING YARD exact. Exit 0 = green.

   Proves, against the SAME core.mjs the page inlines (chip↔twin parity), with
   INTEGER arithmetic (so "machine precision" is literal ===):
     (1) EULER          — #{distinct partitions of n} === #{odd partitions of n},
                          n = 1..40, by INDEPENDENT enumeration of both sieves
     (2) CONJUGATION    — the Ferrers transpose is sum-preserving AND an
                          involution (conjugate∘conjugate = id) over ALL
                          partitions of n = 1..24
     (3) NEG-CONTROL    — loosen "distinct" to allow repeats ⇒ it collapses to
                          ALL partitions, whose count STRICTLY overshoots the odd
                          count for n ≥ 2 (= p(n) > #odd(n))

   The whole battery is runChecks() in core.mjs, so the page's chip consumes the
   IDENTICAL function and result. This file asserts runChecks() is green AND
   INDEPENDENTLY re-derives (not just mirroring) each claim a second way. It also
   guards the forge byte-parity: the slab inlined into index.html must be the
   verbatim module.
   ════════════════════════════════════════════════════════════════════════════ */

import {
  partitionsDistinct, partitionsOdd, partitionsAll, partitionsDistinctCheat,
  countDistinct, countOdd, partSum, conjugate, ferrersCells,
  defaultPartition, transferBead, randomPartition, isPartition,
  runChecks, RANGE, CONJ_RANGE,
} from './core.mjs';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + `  (got ${a}, want ${b})`); }
function jeq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), msg + `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ── the shared battery the page's chip also runs (chip↔twin parity) ───────────
const r = runChecks(RANGE);
ok(r.fails.length === 0, `runChecks() over n=1..${RANGE} is green` +
  (r.fails.length ? ' — first failures: ' + r.fails.slice(0, 5).join(' · ') : ''));
eq(r.pass, r.total, 'runChecks() pass === total (no partial credit)');
ok(r.total >= RANGE * 4, `runChecks() actually exercised the range (total=${r.total})`);

// ══ INDEPENDENT RE-DERIVATIONS (not mirroring runChecks) ══════════════════════

// (1) EULER, re-counted a SECOND way: count distinct parts by filtering ALL
//     partitions for "strictly decreasing"; count odd parts by filtering ALL
//     partitions for "every part odd". Then cross the two filtered counts.
function isStrictlyDescending(p) { for (let i = 1; i < p.length; i++) if (p[i] >= p[i - 1]) return false; return true; }
function allPartsOdd(p) { for (const x of p) if (x % 2 === 0) return false; return true; }
for (let n = 1; n <= RANGE; n++) {
  const all = partitionsAll(n);
  const dCount = all.filter(isStrictlyDescending).length;
  const oCount = all.filter(allPartsOdd).length;
  eq(dCount, oCount, `Euler (re-derived by filtering ALL) #distinct=#odd at n=${n}`);
  // and that re-derivation agrees with the dedicated sieves
  eq(dCount, countDistinct(n), `filtered distinct count agrees with partitionsDistinct at n=${n}`);
  eq(oCount, countOdd(n), `filtered odd count agrees with partitionsOdd at n=${n}`);
}

// the n=7 literal SETS, re-verified
jeq(partitionsDistinct(7), [[7], [6, 1], [5, 2], [4, 3], [4, 2, 1]], 'distinct(7) SET');
jeq(partitionsOdd(7), [[7], [5, 1, 1], [3, 3, 1], [3, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1]], 'odd(7) SET');
jeq([1, 2, 3, 4, 5, 6, 7, 8].map(countDistinct), [1, 1, 2, 2, 3, 4, 5, 6], 'distinct prefix n=1..8');
eq(countDistinct(40), 1113, 'q(40) = 1113');

// (2) CONJUGATION re-derived a SECOND independent way: build a boolean Ferrers
//     CELL-MATRIX from ferrersCells(p), TRANSPOSE it, read the row sums of the
//     transpose, and assert that equals conjugate(p). This crosses two
//     implementations (cell-matrix transpose vs the counting formula), not a
//     mirror of conjugate.
function conjugateViaMatrix(p) {
  const cells = ferrersCells(p);
  if (cells.length === 0) return [];
  let maxRow = 0, maxCol = 0;
  for (const { row, col } of cells) { if (row > maxRow) maxRow = row; if (col > maxCol) maxCol = col; }
  // boolean matrix M[row][col]
  const M = Array.from({ length: maxRow + 1 }, () => new Array(maxCol + 1).fill(false));
  for (const { row, col } of cells) M[row][col] = true;
  // transpose: T[col][row]; the conjugate part for column c is #beads in column c
  const conj = [];
  for (let c = 0; c <= maxCol; c++) {
    let cnt = 0;
    for (let rr = 0; rr <= maxRow; rr++) if (M[rr][c]) cnt++;
    conj.push(cnt);
  }
  return conj;
}
let conjCount = 0;
for (let n = 1; n <= CONJ_RANGE; n++) {
  for (const p of partitionsAll(n)) {
    conjCount++;
    const viaFormula = conjugate(p);
    const viaMatrix = conjugateViaMatrix(p);
    jeq(viaMatrix, viaFormula, `conjugate via matrix-transpose === conjugate formula for ${JSON.stringify(p)}`);
    eq(partSum(viaFormula), n, `conjugate sum-preserving for ${JSON.stringify(p)}`);
    jeq(conjugate(viaFormula), p, `conjugate involution for ${JSON.stringify(p)}`);
  }
}
ok(conjCount === 7337, `crossed conjugation over all ${conjCount} partitions of n=1..${CONJ_RANGE} (want 7337)`);
jeq(conjugate([4, 2, 1]), [3, 2, 1, 1], 'conj([4,2,1]) = [3,2,1,1]');

// (3) NEG-CONTROL re-derived: the cheat is LITERALLY all partitions, so
//     cheat(n) === p(n) > odd(n) for n ≥ 2.
for (let n = 2; n <= RANGE; n++) {
  const cheat = partitionsDistinctCheat(n).length;
  const pAll = partitionsAll(n).length;
  eq(cheat, pAll, `cheat(n) === p(n) at n=${n}`);
  ok(cheat > countOdd(n), `NEG-CONTROL: cheat(${n})=${cheat} > odd(${n})=${countOdd(n)}`);
}
eq(partitionsDistinctCheat(7).length, 15, 'cheat(7) = 15 (= p(7))');

// ── the board's authorities behave (the page leans on these) ──────────────────
// defaultPartition is a strictly-descending staircase summing to n
for (let n = 1; n <= 12; n++) {
  const p = defaultPartition(n);
  eq(partSum(p), n, `defaultPartition(${n}) sums to ${n}`);
  ok(isStrictlyDescending(p), `defaultPartition(${n}) strictly descending`);
}
jeq(defaultPartition(6), [3, 2, 1], 'defaultPartition(6) = [3,2,1]');
jeq(defaultPartition(7), [4, 2, 1], 'defaultPartition(7) = [4,2,1]');
jeq(defaultPartition(10), [4, 3, 2, 1], 'defaultPartition(10) = [4,3,2,1]');

// ferrersCells length === partSum, row-major descending order
for (const p of [[4, 2, 1], [3, 3], [5], [1, 1, 1, 1], [6, 3, 2, 1]]) {
  const cells = ferrersCells(p);
  eq(cells.length, partSum(p), `ferrersCells(${JSON.stringify(p)}).length === partSum`);
  // verify row-major descending: row indices non-decreasing, within a row cols ascending
  let goodOrder = true;
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1], b = cells[i];
    if (b.row < a.row) goodOrder = false;
    if (b.row === a.row && b.col <= a.col) goodOrder = false;
  }
  ok(goodOrder, `ferrersCells(${JSON.stringify(p)}) is row-major descending`);
}

// transferBead always returns a valid descending partition of the SAME n (count pinned)
(function () {
  let good = true;
  for (const base of [[4, 2, 1], [6, 3, 2, 1], [3, 3], [5, 1, 1], [4, 4, 4]]) {
    const n = partSum(base);
    for (let row = 0; row < base.length; row++) {
      for (const delta of [+1, -1]) {
        const moved = transferBead(base, row, delta);
        if (!isPartition(moved)) good = false;
        if (partSum(moved) !== n) good = false;            // count pinned to n
      }
    }
  }
  ok(good, 'transferBead keeps a valid descending partition of the SAME n (count pinned)');
})();
// a concrete legal reshape
jeq(transferBead([4, 2, 1], 0, -1), [3, 3, 1], 'transferBead([4,2,1],0,-1) = [3,3,1]');
// randomPartition is a valid partition of n
for (let trial = 0; trial < 50; trial++) {
  const n = 1 + (trial % 12);
  const p = randomPartition(n);
  ok(isPartition(p) && partSum(p) === n, `randomPartition(${n}) is a valid partition of ${n}`);
}

// ══ FORGE BYTE-PARITY GUARD ═══════════════════════════════════════════════════
// The slab inlined into index.html between the forge:include region must be the
// VERBATIM module (forge strips `export `, the module guard, and bare imports —
// there are no bare imports here). We assert the module's BODY appears inside the
// built index.html with each `export ` keyword removed, byte-for-byte.
(function () {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const moduleSrc = fs.readFileSync(path.join(__dirname, 'core.mjs'), 'utf8').replace(/\r\n/g, '\n');
  const htmlPath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    ok(false, 'index.html exists (run forge first)');
    return;
  }
  const html = fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');
  // reproduce forge's strip: remove a leading `export ` before declarations
  const stripped = moduleSrc
    .split('\n')
    .map(line => line.replace(/^(\s*)export\s+(?=(default\s+)?(const|let|var|function|class|async)\b)/, '$1'))
    .join('\n')
    .replace(/\n$/, '');           // forge trims one trailing newline on the include
  ok(html.includes(stripped),
     'FORGE BYTE-PARITY: the inlined core slab in index.html is byte-identical to core.mjs (export-stripped)');
})();

// ── report ──────────────────────────────────────────────────────────────────
console.log(`\nThe Dividing Yard — core self-test: ${pass} passed, ${fail} failed`);
if (fail === 0) {
  console.log('GREEN: Euler #distinct=#odd (n=1..40, independent enumeration); conjugation is an ' +
    'n-preserving involution (conjugate²=id, sum preserved, re-derived by matrix transpose over all ' +
    '7337 partitions of n=1..24); the allow-repeats neg-control overshoots odd (cheat=p(n)>#odd, n≥2). ' +
    'All integer ===; the page chip runs the identical runChecks().');
}
process.exit(fail === 0 ? 0 : 1);
