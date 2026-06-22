// Node twin for The Counting-Out Ring. Run: node counting-out-ring/core.test.mjs
// This imports the SAME core the page inlines, runs the full self-test battery,
// plus a few extra independent assertions, and exits non-zero on any failure.

import {
  josephusJ, survivorRecurrence, eliminationOrder, survivorSim,
  decompose2mL, survivorClosedForm2, bitsOf, rotateLeft1,
  clockwiseAfter, deathStep, josephusSlipped, naiveBinaryUnchanged,
  runSelfTest,
} from './core.mjs';

let failed = 0;
function assert(name, cond, detail) {
  if (cond) { console.log('  ✓ ' + name); }
  else { console.log('  ✗ ' + name + (detail ? '  [' + detail + ']' : '')); failed++; }
}

console.log('The Counting-Out Ring — Node twin\n');

// ── the page's own battery ──
const r = runSelfTest();
for (const l of r.lines) assert(l.name, l.ok, l.detail);
assert('battery: all pass', r.pass === r.total, `${r.pass}/${r.total}; fails: ${r.fails.join(' | ')}`);

console.log('\n  — extra independent checks —');

// An utterly independent brute Josephus (different code path: queue rotation)
// to cross-check survivorRecurrence over a wide grid.
function josephusQueue(n, k) {
  let q = [];
  for (let s = 1; s <= n; s++) q.push(s);
  while (q.length > 1) {
    // rotate k-1, then drop the front
    for (let t = 0; t < k - 1; t++) q.push(q.shift());
    q.shift();
  }
  return q[0];
}
{
  let ok = true, ff = '';
  for (let k = 2; k <= 6 && ok; k++)
    for (let n = 1; n <= 200; n++) {
      const a = survivorRecurrence(n, k), b = josephusQueue(n, k), c = survivorSim(n, k);
      if (a !== b || a !== c) { ok = false; ff = `N=${n},k=${k}: rec=${a} queue=${b} sim=${c}`; break; }
    }
  assert('three independent codepaths agree (recurrence == queue == splice-sim), N≤200 k2..6', ok, ff);
}

// classic Josephus k=2 textbook values
assert('survivor(1,2)=1', survivorRecurrence(1, 2) === 1);
assert('survivor(2,2)=1', survivorRecurrence(2, 2) === 1);
assert('survivor(3,2)=3', survivorRecurrence(3, 2) === 3);
assert('survivor(4,2)=1', survivorRecurrence(4, 2) === 1);
assert('survivor(5,2)=3', survivorRecurrence(5, 2) === 3);
assert('survivor(6,2)=5', survivorRecurrence(6, 2) === 5);
assert('survivor(7,2)=7', survivorRecurrence(7, 2) === 7);
assert('survivor(41,2)=19 (the worked example)', survivorRecurrence(41, 2) === 19);

// k=3 textbook check: 41 people, every 3rd, survivor 31 (Josephus classic variant)
assert('survivor(41,3)=31', survivorRecurrence(41, 3) === 31, `got ${survivorRecurrence(41,3)}`);

// powers of two: survivor is always seat 1 for k=2 (L=0)
for (const p of [1, 2, 4, 8, 16, 32, 64, 128]) {
  assert(`power of two N=${p}: survivor(.,2)=1`, survivorRecurrence(p, 2) === 1);
}

// rotateLeft1 sanity on the named word
assert('bitsOf(41) = 101001', bitsOf(41).join('') === '101001');
assert('rotateLeft1(41) = 19 (010011 = the survivor directly)', rotateLeft1(41) === 19, `got ${rotateLeft1(41)}`);
assert('rotateLeft1(N) === survivor(N,2) for all N=1..200', (() => {
  for (let n = 1; n <= 200; n++) if (rotateLeft1(n) !== survivorRecurrence(n, 2)) return false;
  return true;
})());
assert('decompose 41 = 32 + 9, survivor = 2L+1 = 19', (() => {
  const d = decompose2mL(41); return d.pow === 32 && d.L === 9 && (2 * d.L + 1) === 19;
})());

// the fence-post slip and naive readings
assert('slipped(5,2)=5 (wrong), truth=3', josephusSlipped(5, 2) === 5 && survivorRecurrence(5, 2) === 3);
assert('naiveBinaryUnchanged(41)=41 ≠ 19', naiveBinaryUnchanged(41) === 41 && naiveBinaryUnchanged(41) !== survivorRecurrence(41, 2));

// deathStep: the survivor's clockwise neighbour loses (sample)
{
  const n = 41, k = 2;
  const surv = survivorRecurrence(n, k);          // 19
  const nb = clockwiseAfter(surv, n);             // 20
  assert('clockwise neighbour of survivor 19 is 20', nb === 20);
  assert('neighbour 20 ashes before the survivor', deathStep(nb, n, k) <= n - 1, `death-step ${deathStep(nb,n,k)}`);
  assert('survivor 19 death-step === N (outlasts all)', deathStep(surv, n, k) === n);
}

console.log('');
if (failed === 0) console.log(`ALL GREEN — ${r.total} battery lines + extra checks passed.`);
else { console.log(`${failed} CHECK(S) FAILED.`); process.exit(1); }
