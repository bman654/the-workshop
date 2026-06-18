#!/usr/bin/env node
/* the-climb.test.cjs — headless proof harness for THE CLIMB.
   Requires the SAME deterministic core the page forge-inlines, so the in-page
   self-test chip and this harness assert the IDENTICAL battery (chip === twin).

   Run:  node arcade/games/the-climb.test.cjs
   Exits 0 iff every assertion passes; 1 otherwise. */
'use strict';
const core = require('./the-climb.core.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

// ── 1. The in-core battery (the FIVE proven claims — the verbatim code the page
//       runs in its chip; this is the byte-twin requirement). ──────────────────
const st = core.runSelfTest();
for (const r of st.results) ok(r.name, r.pass, r.detail);

// ── 2. Extra cross-checks from the harness side ──────────────────────────────

// 2a. Both levels are winnable (level 2 keeps the spine).
{
  for (let li = 0; li < core.LEVELS.length; li++) {
    const w = core.makeWorld(li, { spawnEnabled: false });
    const input = core.blankInput();
    const got = core.winSolve(w, input, 6000);
    ok('level ' + (li + 1) + ' winnable by a scripted climb', got.won,
       'won=' + got.won + ' end=' + got.cell + ' ticks=' + got.ticks);
  }
}

// 2b. Fixed-timestep integerization: N stepTick calls → world.frame === N.
{
  const w = core.makeWorld(0, {});
  const input = core.blankInput();
  for (let i = 0; i < 400; i++) core.stepTick(w, input);
  ok('fixed-timestep: 400 stepTick calls → world.frame === 400 (or capped at game-over)',
     w.frame === 400 || w.over, 'frame=' + w.frame + ' over=' + w.over);
}

// 2c. No-tunnel: a barrel moving FASTER than the body width still cannot pass
//     through the grounded figure between ticks (the swept collision graft).
{
  const w = core.makeWorld(0, { spawnEnabled: false });
  w.barrelSpeed = core.BODY_W + 4;   // deliberately faster than a body width per tick
  const p = w.player; p.cx = 8; p.cy = 11; p.px = 8 * core.FRAC; p.py = 11 * core.FRAC;
  p.onGround = true; p.alive = true;
  const b = core.mkBarrel(0, 2, 11, 1); w.barrels = [b];
  let died = false;
  for (let i = 0; i < 60 && !w.over; i++) { core.stepTick(w, core.blankInput()); if (w.dead) died = true; }
  ok('no-tunnel: a barrel faster than a body-width per tick still collides (swept, no skip-through)',
     died, 'died=' + died + ' barrelSpeed=' + w.barrelSpeed);
}

// 2d. A hopped barrel is scored exactly once (never double-counts across the arc).
{
  const w = core.makeWorld(0, { spawnEnabled: false });
  const p = w.player; p.cx = 8; p.cy = 11; p.px = 8 * core.FRAC; p.py = 11 * core.FRAC;
  p.onGround = true; p.alive = true;
  const b = core.mkBarrel(0, 4, 11, 1); w.barrels = [b];
  const input = core.blankInput();
  for (let i = 0; i < 120 && !w.over; i++) {
    const dist = Math.abs(w.player.px - (w.barrels[0] ? w.barrels[0].px : 1e9));
    input.jump = (w.player.onGround && dist <= 2 * core.FRAC && dist > core.FRAC);
    core.stepTick(w, input);
    if (input.jump) input.jump = false;
  }
  ok('hop scores exactly once: a single cleared barrel yields one hop / HOP_SCORE',
     w.hops === 1 && w.score === core.HOP_SCORE, 'hops=' + w.hops + ' score=' + w.score);
}

console.log('\n' + (fails === 0
  ? 'THE CLIMB SELF-TEST: ALL PASS (' + st.results.length + ' core claims + 5 harness checks)'
  : 'THE CLIMB SELF-TEST: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
