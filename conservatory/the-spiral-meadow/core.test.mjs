// The Spiral Meadow — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() at TIGHTER settings (more pinned seeds, longer
//   horizons), adds INDEPENDENT re-derivations not routed through runSelfTest, and
//   confirms the page's inlined core is the same core.  Because index.html forge-INLINES
//   core.mjs verbatim (the estate build gate `forge --check` fails on any drift), the
//   page core === this module core by construction; we still re-extract the inlined block
//   and assert it carries the load-bearing rule bodies, as a belt-and-suspenders parity.
//
//   Run:  node conservatory/the-spiral-meadow/core.test.mjs
import * as Core from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Conservatory · The Spiral Meadow — Node cross-check\n');

// ── 1. the shared self-test, TIGHTER (more seeds, longer horizons) ───────────
console.log('— shared runSelfTest() at K=6, longer horizons (same assertions the in-page badge runs) —');
{
  const res = Core.runSelfTest({
    K: 6, eps: 0.02,
    mixW: 30, mixH: 30, mixBudget: 2000,
    spW: 72, spH: 72, spHorizon: 600, spSample: 25,
    ncW: 40, ncH: 40, ncWarm: 90, ncMixBudget: 2400, ncRun: 500,
  });
  for (const c of res.checks) ok(c.name, c.pass, c.info);
}

// ── 2. INDEPENDENT re-derivation of ONE microstep (hand-rolled, not via microstep()) ─
console.log('\n— independent re-derivations (hand-expanded, NOT routed through the core rule) —');
{
  // Replay a well-mixed run with a hand-written rule using the SAME mulberry32 stream and
  // the SAME draw ORDER as microstep(), and assert byte-identical to the core's grid.
  const W = 32, H = 32, N = W * H, seed = 0xA11CE;
  const core = Core.makeField(W, H, seed, { mode: 'mixed' });
  // hand build the same initial field + rng draws
  const rng = Core.mulberry32(seed >>> 0);
  const hand = new Uint8Array(N);
  for (let k = 0; k < N; k++) hand[k] = (rng() * 3) | 0;   // same seeding order
  // step both by the same number of microsteps, hand-rolling the mixed rule
  const SW = 20, steps = SW * N;
  Core.step(core, SW);
  for (let t = 0; t < steps; t++) {
    const i = (rng() * N) | 0;
    const si = hand[i];
    const j = (rng() * N) | 0;
    if (hand[j] === (si + 1) % 3) hand[j] = si;           // overgrow prey
  }
  let same = true;
  for (let k = 0; k < N; k++) if (hand[k] !== core.grid[k]) { same = false; break; }
  ok('hand-rolled well-mixed rule (same RNG stream + draw order) reproduces microstep() byte-for-byte',
     same, same ? W + '×' + H + ' identical after ' + SW + ' sweeps' : 'DIVERGED');
}
{
  // cyclic-dominance invariants: prey/predator are inverse, and each species beats
  // exactly one and is beaten by exactly one.
  let good = true;
  for (let s = 0; s < 3; s++) {
    if (Core.prey(s) !== (s + 1) % 3) good = false;
    if (Core.predator(Core.prey(s)) !== s) good = false;
    if (Core.prey(Core.predator(s)) !== s) good = false;
  }
  ok('cyclic-dominance ring: prey(s)=(s+1)%3, predator∘prey = id — each beats one, is beaten by one', good);
}
{
  // mean-field increment sums to zero at a dense grid of mixes (the zero-sum RPS ring),
  // AND equals x_s(x_{s+1}−x_{s−1}) hand-expanded.
  let worstSum = 0, worstMatch = 0;
  for (let a = 0; a <= 30; a++) for (let b = 0; a + b <= 30; b++) {
    const x = [a / 30, b / 30, 1 - a / 30 - b / 30];
    const inc = Core.meanFieldIncrement(x);
    worstSum = Math.max(worstSum, Math.abs(inc[0] + inc[1] + inc[2]));
    const hand = [x[0] * (x[1] - x[2]), x[1] * (x[2] - x[0]), x[2] * (x[0] - x[1])];
    for (let i = 0; i < 3; i++) worstMatch = Math.max(worstMatch, Math.abs(inc[i] - hand[i]));
  }
  ok('mean-field increment: Σ=0 (zero-sum ring) and matches x_s(x_{s+1}−x_{s−1}) over a dense grid',
     worstSum < 1e-15 && worstMatch < 1e-15, 'maxΣ=' + worstSum.toExponential(2) + ' maxΔ=' + worstMatch.toExponential(2));
}
{
  // no empty sites, ever: every cell is always in {0,1,2}, and the census sums to N.
  const st = Core.makeField(50, 50, 0xBADCAB, { mode: 'spatial' });
  let good = true;
  for (let s = 0; s < 25 && good; s++) {
    Core.step(st, 8);
    const c = Core.census(st);
    if (c[0] + c[1] + c[2] !== st.grid.length) good = false;
    for (let k = 0; k < st.grid.length; k++) if (st.grid[k] > 2) { good = false; break; }
  }
  ok('no empty sites: every cell ∈ {0,1,2} and Σcensus ≡ W·H across a spatial run', good);
}
{
  // the shuffle is census-invariant: shuffling never changes any head-count.
  const st = Core.makeField(60, 60, 0xF00D, { mode: 'spatial' });
  Core.step(st, 60);
  const before = Core.census(st);
  Core.shuffleGrid(st.grid, Core.mulberry32(99));
  const after = Core.census(st);
  ok('shuffle is census-invariant: head-counts unchanged by the Fisher–Yates scramble',
     before[0] === after[0] && before[1] === after[1] && before[2] === after[2],
     '[' + before.join(',') + '] === [' + after.join(',') + ']');
}

// ── 3. the CONTRAST at a shared N, measured (the headline claim) ─────────────
console.log('\n— the contrast at a shared N (measured, pinned seed) —');
{
  const N = 48, seed = 20260721;
  const bk = Core.makeField(N, N, seed, { mode: 'mixed' });
  let tmix = -1;
  for (let s = 1; s <= 20000; s++) { Core.step(bk, 1); if (Core.speciesAlive(bk) === 1) { tmix = s; break; } }
  const md = Core.makeField(N, N, seed, { mode: 'spatial' });
  const target = tmix * 50; let worst = 1;
  for (let s = 0; s < target; s += Math.max(60, tmix)) { Core.step(md, Math.max(60, tmix)); worst = Math.min(worst, Core.minFraction(md)); }
  ok('contrast: same ' + N + '×' + N + ' seed #' + seed + ' — beaker FIXES in ' + tmix +
     ' sweeps; meadow holds all three ≥ ε at ≥50× t_mix (worst min ' + worst.toFixed(4) + ')',
     tmix > 0 && Core.speciesAlive(md) === 3 && worst >= 0.02,
     't_mix=' + tmix + '  meadow worst-min=' + worst.toFixed(4) + ' at ' + target + ' sweeps (' + (target / tmix).toFixed(0) + '×)');
}

// ── 4. PARITY — the page's inlined core carries the load-bearing rule bodies ──
console.log('\n— page-parity: the inlined core in index.html is the module core (forge gate + spot-check) —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); } catch (e) { html = ''; }
  const marks = [
    'function prey(s) { return (s + 1) % S; }',
    'if (grid[j] === (si + 1) % S) { grid[j] = si; return j; }',
    'function shuffleGrid(grid, rng)',
    'function runSelfTest(opts = {})',
  ];
  const present = marks.every((m) => html.includes(m));
  ok('index.html inlines core.mjs verbatim — the microstep rule, prey(), shuffle, and self-test bodies are present',
     present && html.length > 0, present ? 'all ' + marks.length + ' load-bearing bodies found' : 'MISSING (rebuild: forge)');
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.');
process.exit(pass === total ? 0 : 1);
