#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for THE INFINITE OVERHANG.

   Imports the SAME core.mjs the page inlines and runs the SAME runSelfTest(), then
   adds direct probes asserting the FOUR directive claims. Exits 0 iff every assertion
   passes (CI-true).

   The claims under proof:
     (1) the classic single-wide harmonic stack's optimum overhang = EXACTLY ½·H(n),
         to machine ε, for n up to a few hundred;
     (2) in that optimal stack every top-k sub-stack's CoM sits EXACTLY on its support
         edge — the whole tower balanced on a chain of knife-edges;
     (3) the divergence thresholds: minBooksFor(1)=4, (2)=31, (3)=227, and the bracket
         ½·H(3) < 1 < ½·H(4);
     (4) NEG CONTROLS: a 1px (=1/240) over-nudge of the top book flags topple TRUE at the
         inner failing interface, AND a vertical zero-overhang stack stays stable.

   Run:  node overhang/core.test.mjs
   ════════════════════════════════════════════════════════════════════════════ */
import {
  harmonic, maxOverhang, nudge, optimalLefts, comOf,
  supportTest, topOverhang, minBooksFor, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => {
  if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + m); }
  else { fail++; console.log('  \x1b[31m✗ ' + m + '\x1b[0m'); }
};

console.log('\nTHE INFINITE OVERHANG — core.test.mjs\n');

// ── the in-page self-test, run here verbatim (the SAME runSelfTest the pill calls) ──
console.log('runSelfTest() — the exact suite the in-page pill runs:');
const r = runSelfTest();
r.log.forEach(l => console.log('    ' + l));
ok(r.fail === 0, `runSelfTest() reports ${r.pass} pass / ${r.fail} fail`);

// ── CLAIM (1): the optimal overhang IS ½·H(n) to machine ε, n=1..300. ──────────
console.log('\nclaim (1) — optimal overhang === ½·H(n) to machine ε:');
{
  let worst = 0, worstN = 0;
  for (let n = 1; n <= 300; n++){
    const d = Math.abs(topOverhang(optimalLefts(n)) - maxOverhang(n));
    if (d > worst){ worst = d; worstN = n; }
  }
  ok(worst < 1e-12, `top-block right edge = ½·H(n) for all n≤300 (worst |Δ|=${worst.toExponential(2)} at n=${worstN})`);
  // spot the directive's landmark value: ½·H(31) ≈ 2.0136.
  ok(Math.abs(maxOverhang(31) - 2.0136) < 5e-4, `½·H(31) = ${maxOverhang(31).toFixed(4)} (just clears 2 lengths)`);
  // harmonic is the literal sum (independent recomputation).
  ok(Math.abs(harmonic(4) - (1 + 1/2 + 1/3 + 1/4)) < 1e-15, `harmonic(4) = 1+½+⅓+¼ exactly`);
}

// ── CLAIM (2): every top-k sub-stack CoM sits ON its support edge (max dev < 1e-12). ──
console.log('\nclaim (2) — every sub-stack CoM sits on its support edge:');
for (const n of [3, 7, 31, 100, 300]){
  const lefts = optimalLefts(n);
  const t = supportTest(lefts);
  let maxAbs = 0;
  for (let i = 0; i < n; i++) maxAbs = Math.max(maxAbs, Math.abs(t.margins[i]));
  ok(maxAbs < 1e-12 && t.stable, `n=${n}: on the brink, marginally stable (max |margin|=${maxAbs.toExponential(2)})`);
  // an independent CoM cross-check: the whole-stack CoM sits exactly at the cliff (x=0).
  ok(Math.abs(comOf(lefts) - 0) < 1e-12, `n=${n}: whole-stack CoM sits exactly on the cliff x=0 (comOf=${comOf(lefts).toExponential(2)})`);
}

// ── CLAIM (3): the divergence thresholds AND the bracket. ──────────────────────
console.log('\nclaim (3) — the divergence thresholds:');
ok(minBooksFor(1) === 4,   `minBooksFor(1) = 4  (½·H(4)=${maxOverhang(4).toFixed(4)})`);
ok(minBooksFor(2) === 31,  `minBooksFor(2) = 31 (½·H(31)=${maxOverhang(31).toFixed(4)})`);
ok(minBooksFor(3) === 227, `minBooksFor(3) = 227 (½·H(227)=${maxOverhang(227).toFixed(4)})`);
ok(maxOverhang(3) < 1, `½·H(3) = ${maxOverhang(3).toFixed(4)} < 1 (3 books cannot clear one length)`);
ok(maxOverhang(4) > 1, `½·H(4) = ${maxOverhang(4).toFixed(4)} > 1 (4 books do clear it)`);
// each book buys exactly its diminishing 1/(2k) nudge (the B-graft claim, exact).
ok(Math.abs((maxOverhang(62) - maxOverhang(61)) - nudge(62)) < 1e-12,
   `the 62nd book buys exactly nudge(62)=1/124=${nudge(62).toFixed(4)} (the diminishing crawl)`);

// ── CLAIM (4): NEG CONTROLS — a 1px over-nudge topples; a vertical stack is stable. ──
console.log('\nclaim (4) — negative controls:');
{
  const n = 6, lefts = optimalLefts(n);
  // (a) the optimal stack is on the brink — stable as built…
  ok(supportTest(lefts).stable, `the un-nudged optimal n=6 stack is stable (the brink)`);
  // …and a literal 1px (=1/240 book-length) push of the top book topples it AT i=0.
  const onePx = 1 / 240;
  const nudged = lefts.slice(); nudged[0] += onePx;
  const t = supportTest(nudged);
  ok(!t.stable, `+1px (=1/240) on the top book → topple flagged TRUE`);
  ok(t.firstFail === 0, `the failing interface is exactly the inner one nudged (i=0, top book on block 1)`);
  // a sub-ε push of the same book also trips it — the brink is genuine, not slop.
  const micro = lefts.slice(); micro[0] += 1e-6;
  ok(!supportTest(micro).stable, `even a 1e-6 push past the limit trips it (brink is real, no slop)`);
  // pushing a DEEPER book trips at THAT interface (the topple is localized, not global).
  const deep = lefts.slice(); deep[2] += 1 / 240;
  const td = supportTest(deep);
  ok(td.firstFail === 2, `pushing block 2 trips exactly interface i=2 (localized failure, got ${td.firstFail})`);
  // (b) a perfectly-vertical zero-overhang stack stays STABLE (overhang = 0).
  const vert = new Array(n).fill(-1);
  const tv = supportTest(vert);
  ok(tv.stable, `the vertical zero-overhang stack stays stable (no false topple)`);
  ok(Math.abs(topOverhang(vert)) < 1e-12, `vertical stack overhang = 0`);
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
