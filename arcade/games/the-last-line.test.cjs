#!/usr/bin/env node
/* the-last-line.test.cjs — headless proof harness for THE LAST LINE.
   Requires the SAME deterministic core the page forge-inlines, so the in-page
   self-test chip and this harness assert the IDENTICAL battery (chip === twin),
   PLUS extra multi-seed replay-determinism cross-checks.

   Run:  node arcade/games/the-last-line.test.cjs
   Exits 0 iff every assertion passes; 1 otherwise. */
'use strict';
const core = require('./the-last-line.core.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

// ── 1. The in-core battery (the FOUR proven claims + neg-controls — the verbatim
//       code the page runs in its chip; this is the byte-twin requirement). ─────
const st = core.runSelfTest();
for (const r of st.results) ok(r.name, r.pass, r.detail);

// ── 2. Extra cross-checks from the harness side ──────────────────────────────

// 2a. MULTI-SEED replay determinism: for several seeds, two independent replays of
//     the SAME scripted controller end byte-identical (the core proves one seed;
//     this widens it). Different seeds may diverge (UFO/bomb timing) — that's fine.
{
  const seeds = [1, 2, 7, 42, 1337, 90210];
  let allMatch = true, distinct = new Set();
  for (const seed of seeds) {
    const a = core.makeGame(2, { seed });
    const b = core.makeGame(2, { seed });
    const track = (g) => core.winController(g);
    core.replay(a, track, 5000);
    core.replay(b, track, 5000);
    const ha = core.hashGame(a), hb = core.hashGame(b);
    if (ha !== hb) allMatch = false;
    distinct.add(ha);
  }
  ok('multi-seed replay determinism: ' + seeds.length + ' seeds each replay byte-identical across two runs',
     allMatch, 'allMatch=' + allMatch + ' distinctEndStates=' + distinct.size + '/' + seeds.length);
}

// 2b. The scripted controller wins EVERY wave 1..4 (bombs off so the win is purely
//     the march/clear logic, not luck) — proving the formation is always clearable.
{
  let allWon = true, details = [];
  for (let wave = 1; wave <= 4; wave++) {
    const g = core.makeGame(wave, { bombsEnabled: false, ufoEnabled: false, seed: 5 });
    const got = core.winSolve(g, 30000);
    if (!got.won || !got.alive) allWon = false;
    details.push('w' + wave + '=' + (got.won ? 'WON@' + got.ticks + 't' : 'LOST'));
  }
  ok('every wave (1..4) is clearable by the scripted controller (cannon alive at clear)',
     allWon, details.join(' '));
}

// 2c. Fixed-timestep: N stepTick calls → world.frame === N (or capped at over).
{
  const g = core.makeGame(1, { bombsEnabled: false, ufoEnabled: false });
  const input = core.blankInput();
  for (let i = 0; i < 300; i++) core.stepTick(g, input);
  ok('fixed-timestep: 300 stepTick calls → frame === 300 (or capped at game-over)',
     g.frame === 300 || g.over, 'frame=' + g.frame + ' over=' + g.over);
}

// 2d. Loss condition is real: an IDLE cannon (never firing) eventually loses as the
//     formation marches down to its row (the descending line is genuinely lethal).
{
  const g = core.makeGame(1, { bombsEnabled: false, ufoEnabled: false });
  const idle = core.blankInput();
  for (let i = 0; i < 60000 && !g.over; i++) core.stepTick(g, idle);
  ok('descending line is lethal: an idle cannon (never fires) loses as the grid descends to its row',
     g.over && g.dead && !g.won, 'over=' + g.over + ' dead=' + g.dead + ' won=' + g.won + ' frame=' + g.frame);
}

// 2e. A rim touch drops the formation EXACTLY one invader row (MARCH_DY), and only
//     a rim touch changes ay — independently re-derived from the public predicate.
{
  const f = core.makeFormation(1);
  let drops = 0, badDrops = 0;
  for (let s = 0; s < 1000; s++) {
    const before = f.ay, touch = core.marchTouchesRim(f);
    core.marchStep(f);
    const dy = f.ay - before;
    if (touch) { if (dy !== core.MARCH_DY) badDrops++; drops++; }
    else if (dy !== 0) badDrops++;
  }
  ok('rim drop is exactly one invader row (MARCH_DY) and only a rim touch moves ay',
     drops > 0 && badDrops === 0, 'drops=' + drops + ' badDrops=' + badDrops + ' MARCH_DY=' + core.MARCH_DY);
}

// 2f. Speed schedule end-points are sane: full-grid interval is the slowest, a lone
//     survivor is STEP_FAST, and a later wave's full grid is faster than wave 1's.
{
  const total = core.GRIDC * core.GRIDR;
  const w1full = core.stepInterval(total, total, 1);
  const w1one  = core.stepInterval(1, total, 1);
  const w3full = core.stepInterval(total, total, 3);
  ok('speed schedule end-points: full grid slowest, lone survivor === STEP_FAST, deeper wave\'s full grid is faster',
     w1full > w1one && w1one === core.STEP_FAST && w3full < w1full,
     'w1full=' + w1full + ' w1one=' + w1one + '(STEP_FAST=' + core.STEP_FAST + ') w3full=' + w3full);
}

console.log('\n' + (fails === 0
  ? 'THE LAST LINE SELF-TEST: ALL PASS (' + st.results.length + ' core claims + 6 harness checks)'
  : 'THE LAST LINE SELF-TEST: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
