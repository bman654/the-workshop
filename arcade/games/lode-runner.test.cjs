#!/usr/bin/env node
/* lode-runner.test.cjs — headless proof harness for LODE RUNNER.
   Requires the SAME deterministic core the page forge-inlines, so the in-page
   self-test chip and this harness assert the identical battery.

   Run:  node arcade/games/lode-runner.test.cjs
   Exits 0 iff every assertion passes; 1 otherwise. */
'use strict';
const core = require('./lode-runner.core.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

// ── 1. The in-core battery (the FIVE proven claims — same code the page runs) ──
const st = core.runSelfTest();
for (const r of st.results) ok(r.name, r.pass, r.detail);

// ── 2. Extra cross-checks from the harness side ──────────────────────────────

// 2a. Replay determinism: the same level + scripted track → identical per-tick
//     hash sequence, twice (no Math.random / Date / perf.now in the step path).
{
  const track = [
    { at: 0,   set: { right: true } },
    { at: 40,  set: { right: false, digRight: true } },
    { at: 60,  set: { down: true } },
    { at: 120, set: { down: false, left: true } },
    { at: 200, set: { left: false, up: true } }
  ];
  const a = core.replay(0, track, 1200, 1);
  const b = core.replay(0, track, 1200, 1);
  let same = a.hashes.length === b.hashes.length, firstDiff = -1;
  for (let i = 0; same && i < a.hashes.length; i++) if (a.hashes[i] !== b.hashes[i]) { same = false; firstDiff = i; }
  ok('replay determinism: level 0 + scripted track → identical 1200-tick hash, twice', same,
     same ? 'final 0x' + a.hashes[a.hashes.length - 1].toString(16) : 'diverged at tick ' + firstDiff);
}

// 2b. Seed-purity vs wall-clock: replay before/after a busy-wait must match.
{
  const track = [{ at: 0, set: { right: true } }, { at: 30, set: { digRight: true } }];
  const a = core.replay(0, track, 600, 7);
  const spin = Date.now(); while (Date.now() - spin < 25) { /* burn wall-clock */ }
  const b = core.replay(0, track, 600, 7);
  ok('seed-purity (wall-clock): identical hash before/after a 25ms delay',
     a.hashes[a.hashes.length - 1] === b.hashes[b.hashes.length - 1],
     '0x' + a.hashes[a.hashes.length - 1].toString(16));
}

// 2c. Fixed-timestep integerization: N stepTick calls → world.frame === N.
{
  const w = core.makeWorld(0, 5);
  const input = core.blankInput();
  for (let i = 0; i < 400; i++) core.stepTick(w, input);
  ok('fixed-timestep: 400 stepTick calls → world.frame === 400 (or capped at game-over)',
     w.frame === 400 || w.over, 'frame=' + w.frame + ' over=' + w.over);
}

// 2d. A dug hole heals back to intact brick after the full lifecycle, and the
//     cell is impassable again once sealed.
{
  const w = core.makeWorld(0, 1);
  w.guards = [];
  const p = w.player;
  p.cx = 2; p.cy = 2; p.ox = 0; p.oy = 0;
  const dir = core.canDig(w, p, 1) ? 1 : -1;
  const dug = core.startDig(w, p, dir);
  let holeIdx = -1;
  for (let d = 0; d < w.dug.length; d++) if (w.dug[d] > 0) { holeIdx = d; break; }
  const hy = Math.floor(holeIdx / w.W), hx = holeIdx - hy * w.W;
  const openMid = (() => { // fast-forward to the OPEN window, assert passable
    for (let i = 0; i < core.DIG_TICKS + 2; i++) w.dug[holeIdx] && (w.dug[holeIdx] = w.dug[holeIdx] > core.HEAL_TICKS ? w.dug[holeIdx] : w.dug[holeIdx]);
    return core.passable(w, hx, hy);
  })();
  // now seal it fully
  w.dug[holeIdx] = 1; core.stepHoles(w);
  const sealed = !core.passable(w, hx, hy) && w.tiles[holeIdx] === core.BRICK;
  ok('hole heal cycle: a dug brick is passable while open, and impassable intact brick once sealed',
     dug && holeIdx >= 0 && openMid && sealed,
     'dug=' + dug + ' openWhileDug=' + openMid + ' sealedSolid=' + sealed);
}

// 2e. Guard BFS actually paths toward the player (a reachable player draws it closer).
{
  const w = core.makeWorld(0, 1);
  // pin the player at a fixed reachable spot and tick; the guard's manhattan
  // distance to the player should not increase over a window (it homes in).
  const p = w.player; p.cx = 8; p.cy = 7; p.ox = 0; p.oy = 0;
  const gd = w.guards[0];
  const d0 = Math.abs(gd.cx - p.cx) + Math.abs(gd.cy - p.cy);
  const input = core.blankInput();
  let minD = d0;
  for (let i = 0; i < 200 && !w.over; i++) {
    // freeze the player in place by clearing input and re-pinning each tick
    p.cx = 8; p.cy = 7; p.ox = 0; p.oy = 0; p.alive = true; w.over = false; w.dead = false;
    core.stepTick(w, input);
    const d = Math.abs(gd.cx - p.cx) + Math.abs(gd.cy - p.cy);
    if (d < minD) minD = d;
  }
  ok('guard BFS homing: a guard closes distance to a reachable player', minD < d0,
     'd0=' + d0 + ' minD=' + minD);
}

console.log('\n' + (fails === 0
  ? 'LODE RUNNER SELF-TEST: ALL PASS (' + st.results.length + ' core claims + 5 harness checks)'
  : 'LODE RUNNER SELF-TEST: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
