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

// 2e. The knob-derived arc is FRACTIONAL (not the old integer JUMP_VY=-6/GRAV=1) and lasts
//     ~JUMP_SEC. Cross-check the derivation directly: |JUMP_VY| and GRAV are sub-lattice, and
//     the apex over the air-tick count lands in the target band (clears a barrel, under a floor).
{
  const fracArc = (core.JUMP_VY % 1 !== 0) || (core.GRAV % 1 !== 0);
  // analytic integer-rounded apex of the fractional arc:
  let pyf = 0, vy = core.JUMP_VY, apex = 0, T = 0;
  for (let k = 0; k < 200; k++) { vy += core.GRAV; pyf += vy; const py = Math.round(pyf); const rise = -py; if (rise > apex) apex = rise; T++; if (vy >= 0 && pyf >= 0) break; }
  ok('knob-derived arc: JUMP_VY/GRAV are FRACTIONAL (not the old -6/1 integer impulse); apex clears a barrel & stays under a floor; air ≈ JUMP_SEC',
     fracArc && apex >= core.BARREL_H && apex < core.FRAC && Math.abs(T - core.JUMP_AIR_TICKS) <= 3,
     'JUMP_VY=' + core.JUMP_VY.toFixed(3) + ' GRAV=' + core.GRAV.toFixed(4) + ' apex=' + apex + ' (barrelH=' + core.BARREL_H + ', floor=' + core.FRAC + ') airTicks=' + T + '/' + core.JUMP_AIR_TICKS);
}

// 2f. BONUS budget is grounded in the REAL traversal: the board-derived fair estimate exceeds
//     the actual scripted-win tick count (so the budget can't be shorter than a clean run), and
//     a perfect L1 win leaves bonus > 0 while an idle dawdler of the same budget burns to 0.
{
  const w1 = core.makeWorld(0, { spawnEnabled: false });
  const fairTicks = core.fairTraversalTicks(w1.W, w1.H, w1.runSpeed, w1.climbSpeed);
  const winRun = core.makeWorld(0, { spawnEnabled: false });
  const got = core.winSolve(winRun, core.blankInput(), 6000);
  const w2 = core.makeWorld(0, { spawnEnabled: false });
  const dawdle = w2.bonusBudgetTicks + 60;
  for (let i = 0; i < dawdle && !w2.over; i++) core.stepTick(w2, core.blankInput());
  ok('bonus budget is fair: estimate exceeds the actual win path; perfect win keeps bonus > 0; dawdler burns to 0',
     fairTicks >= got.ticks && got.won && winRun.bonus > 0 && w2.bonus === 0,
     'fairEst=' + fairTicks + 't winPath=' + got.ticks + 't budget=' + winRun.bonusBudgetTicks + 't winBonus=' + winRun.bonus + ' dawdleBonus=' + w2.bonus);
}

console.log('\n' + (fails === 0
  ? 'THE CLIMB SELF-TEST: ALL PASS (' + st.results.length + ' core claims + 7 harness checks)'
  : 'THE CLIMB SELF-TEST: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
