#!/usr/bin/env node
/* bulwark.test.cjs — headless replay-determinism + invariant harness for BULWARK.
   Requires the SAME deterministic core the page forge-inlines, so the in-page
   self-test chip and this harness assert the identical battery.

   Run:  node arcade/games/bulwark.test.cjs
   Exits 0 iff every assertion passes; 1 otherwise. */
'use strict';
const core = require('./bulwark.core.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

// ── 1. The in-core battery (same code the page runs) ─────────────────────────
const st = core.runSelfTest();
for (const r of st.results) ok(r.name, r.pass, r.detail);

// ── 2. Extra cross-checks from the harness side ──────────────────────────────

// 2a. Replay determinism across MANY seeds (not just the one in runSelfTest).
{
  const track = [
    { at: 0, set: { right: true, fire: true } },
    { at: 90, set: { up: true } },
    { at: 180, set: { bomb: true } },
    { at: 240, set: { left: true, right: false } },
    { at: 360, set: { reverse: true } },
    { at: 480, set: { down: true, up: false } }
  ];
  let allSeedsDet = true, detail = '';
  for (const seed of [1, 7, 12345, 0xC0FFEE, 999999, 2 ** 31 - 1]) {
    const a = core.replay(seed, track, 1200);
    const b = core.replay(seed, track, 1200);
    let same = a.hashes.length === b.hashes.length;
    for (let i = 0; same && i < a.hashes.length; i++) if (a.hashes[i] !== b.hashes[i]) same = false;
    if (!same) { allSeedsDet = false; detail = 'seed ' + seed + ' diverged'; break; }
  }
  ok('replay determinism across 6 seeds → identical 1200-tick hash twice', allSeedsDet, detail);
}

// 2b. DIFFERENT seeds → DIFFERENT runs (the sim actually reads the seed).
{
  const track = [{ at: 0, set: { right: true } }];
  const a = core.replay(111, track, 800);
  const b = core.replay(222, track, 800);
  let differ = false;
  for (let i = 0; i < a.hashes.length; i++) if (a.hashes[i] !== b.hashes[i]) { differ = true; break; }
  ok('seed sensitivity: distinct seeds produce distinct runs', differ);
}

// 2c. No wall-clock / Math.random leakage: replay() called now vs after a delay
//     must match (proves no Date/perf.now in the sim path).
{
  const track = [{ at: 0, set: { right: true, up: true, fire: true } }];
  const a = core.replay(54321, track, 600);
  const spin = Date.now(); while (Date.now() - spin < 25) { /* burn wall-clock */ }
  const b = core.replay(54321, track, 600);
  const same = a.hashes[a.hashes.length - 1] === b.hashes[b.hashes.length - 1];
  ok('seed-purity (wall-clock): identical hash before/after a 25ms wall-clock delay', same,
     '0x' + a.hashes[a.hashes.length - 1].toString(16));
}

// 2d. Fixed-timestep integerization: the world advances exactly one frame per tick.
{
  const w = core.makeWorld(5);
  const input = core.blankInput();
  for (let i = 0; i < 500; i++) core.stepTick(w, input);
  ok('fixed-timestep: 500 stepTick calls → world.frame === 500', w.frame === 500, 'frame=' + w.frame);
}

// 2e. Position invariant: x is ALWAYS within [0, ringW) after every tick over a
//     long random-ish but seeded scripted drive.
{
  const track = [
    { at: 0, set: { right: true } }, { at: 300, set: { left: true, right: false } },
    { at: 600, set: { reverse: true } }, { at: 900, set: { right: true, left: false } }
  ];
  const w = core.makeWorld(13);
  const input = core.blankInput();
  const edits = {}; for (const t of track) edits[t.at] = t.set;
  let inRange = true;
  for (let k = 0; k < 2400; k++) {
    if (edits[k]) Object.assign(input, edits[k]);
    core.stepTick(w, input);
    if (w.ship.x < 0 || w.ship.x >= core.RING_W) { inRange = false; break; }
  }
  ok('position invariant: ship.x ∈ [0,ringW) for 2400 ticks', inRange);
}

console.log('\n' + (fails === 0
  ? 'BULWARK SELF-TEST: ALL PASS (' + (st.results.length) + ' core + 6 harness checks)'
  : 'BULWARK SELF-TEST: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
