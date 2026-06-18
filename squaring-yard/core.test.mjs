#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin proving THE SQUARING YARD exact. Exit 0 = green.

   Proves, against the SAME core.mjs the page inlines (chip↔twin parity), over
   n = 1..200 with INTEGER arithmetic (so "machine precision" is literal ===):
     (1) Σ_{k=1}^{n} (2k−1) = n²            — the odd gnomons build the square
     (2) T_n + T_{n−1} = n²                 — two triangles tile that same square
     (3) H_n = T_{2n−1}, both by closed form AND by built pebble coordinates
   plus the NEG-CONTROL: drop one gnomon pebble and the assembled count is NOT a
   perfect square (the honesty floor — a vacuous "always square" renderer fails).

   The whole battery is runChecks() in core.mjs, so the page's chip consumes the
   IDENTICAL function and result. This file asserts runChecks() is green AND
   re-derives a few claims independently here (so the twin isn't just a mirror).
   ════════════════════════════════════════════════════════════════════════════ */

import {
  triangular, hexagonal, gnomon, loopGnomonSum, squareClosed,
  hexAsTriangle, hexFigure, assembledCount, isPerfectSquare, runChecks, RANGE,
} from './core.mjs';

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + `  (got ${a}, want ${b})`); }

// ── the shared battery the page's chip also runs (chip↔twin parity) ───────────
const r = runChecks(RANGE);
ok(r.fails.length === 0, `runChecks() over n=1..${RANGE} is green` +
  (r.fails.length ? ' — first failures: ' + r.fails.slice(0, 5).join(' · ') : ''));
eq(r.pass, r.total, 'runChecks() pass === total (no partial credit)');
ok(r.total >= RANGE * 5, `runChecks() actually exercised the range (total=${r.total})`);

// ── independent re-derivation (NOT just trusting runChecks) ────────────────────
// (1) gnomon sum, summed a third way (formula for sum of first n odds)
for (let n = 1; n <= RANGE; n++) {
  eq(loopGnomonSum(n), squareClosed(n), `Σ(2k−1)=n² at n=${n}`);
}
// (2) triangle pair
for (let n = 1; n <= RANGE; n++) {
  eq(triangular(n) + triangular(n - 1), n * n, `T_n + T_{n−1} = n² at n=${n}`);
}
// (3) hexagonal = triangular, closed form AND by BOTH built figures
for (let n = 1; n <= RANGE; n++) {
  eq(hexagonal(n), triangular(2 * n - 1), `H_n = T_{2n−1} (closed) at n=${n}`);
  eq(hexAsTriangle(n).length, hexagonal(n), `H_n = built triangle cell-count at n=${n}`);
  const fig = hexFigure(n);
  eq(fig.length, hexagonal(n), `H_n = built hexagon-figure dot-count at n=${n}`);
  eq(new Set(fig.map(p => p.q + '|' + p.r)).size, hexagonal(n), `hexagon figure has H_n DISTINCT dots at n=${n}`);
}

// the built triangle is a genuine left-justified triangle of side 2n−1
(function () {
  for (const n of [1, 2, 3, 5, 12, 50, 200]) {
    const s = 2 * n - 1;
    const cells = hexAsTriangle(n);
    // row r must have exactly r+1 cells, cols 0..r contiguous
    const byRow = new Map();
    for (const { row, col } of cells) {
      if (!byRow.has(row)) byRow.set(row, []);
      byRow.get(row).push(col);
    }
    let good = byRow.size === s;
    for (let row = 0; row < s; row++) {
      const cols = (byRow.get(row) || []).slice().sort((a, b) => a - b);
      if (cols.length !== row + 1) { good = false; break; }
      for (let c = 0; c <= row; c++) if (cols[c] !== c) { good = false; break; }
    }
    ok(good, `hexAsTriangle(${n}) is a contiguous left-justified triangle of side ${s}`);
  }
})();

// ── NEG-CONTROL: drop one pebble ⇒ honest non-square (the floor) ───────────────
for (let n = 2; n <= RANGE; n++) {
  const c = assembledCount(n, 1);
  ok(!isPerfectSquare(c), `NEG-CONTROL: n=${n}, 1 dropped → ${c} is NOT a perfect square`);
}
// and dropping NOTHING is always a square (positive control)
for (let n = 1; n <= RANGE; n++) {
  ok(isPerfectSquare(assembledCount(n, 0)), `POS-CONTROL: n=${n} complete → perfect square`);
}
// dropping a pebble really lowers the count by exactly that many
eq(assembledCount(10, 0) - assembledCount(10, 3), 3, 'dropping 3 pebbles lowers the count by exactly 3');

// ── isPerfectSquare is a sound oracle (the neg-control leans on it) ────────────
eq(isPerfectSquare(24), false, 'isPerfectSquare(24) === false (near-miss below 25)');
eq(isPerfectSquare(26), false, 'isPerfectSquare(26) === false (near-miss above 25)');
eq(isPerfectSquare(25), true, 'isPerfectSquare(25) === true');
eq(isPerfectSquare(0), true, 'isPerfectSquare(0) === true');
eq(isPerfectSquare(40000), true, 'isPerfectSquare(200²) === true (large)');
eq(isPerfectSquare(40001), false, 'isPerfectSquare(200²+1) === false (large near-miss)');

// ── spot constants ────────────────────────────────────────────────────────────
eq(triangular(4), 10, 'T_4 = 10');
eq(hexagonal(3), 15, 'H_3 = 15');
eq(triangular(5), 15, 'T_5 = 15  (= H_3)');
eq(gnomon(7), 13, '7th gnomon = 13');
eq(loopGnomonSum(5), 25, '1+3+5+7+9 = 25');

// ── report ──────────────────────────────────────────────────────────────────
console.log(`\nThe Squaring Yard — core self-test: ${pass} passed, ${fail} failed`);
if (fail === 0) {
  console.log('GREEN: Σ(2k−1)=n², T_n+T_{n−1}=n², H_n=T_{2n−1} all exact (integer ===) for ' +
    `n=1..${RANGE}; the hexagonal-as-triangle picture is the proof by construction; ` +
    'drop one pebble and the count is an honest non-square (neg-control bites).');
}
process.exit(fail === 0 ? 0 : 1);
