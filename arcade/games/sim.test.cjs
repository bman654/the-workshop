#!/usr/bin/env node
/* sim.test.cjs — the PAYOFF-LIVENESS twin for SIM, over the DOM-free state core
   (sim.core.js) that the page forge-inlines. This is the honest half of the
   green chip: it proves the closing-triangle FLASH + LOSS/WIN reveal actually
   FIRE on a forced-end game, driving commitMove — the SAME entry a real stud-tap
   ends at — never a synthetic canvas event. Deterministic: a hand-authored
   forced-end script, no solve-budget dependence.

   Run:  node arcade/games/sim.test.cjs
   Exits 0 iff every assertion passes; 1 otherwise. */
'use strict';
const core = require('./sim.core.js');
const Adversary = require('../../tools/game/adversary.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

// ── the forced-end script: walk RED into its own triangle {studs 0,1,2}. ──────
// Edges (canonical lex order): 0=(0,1) 1=(0,2) 5=(1,2) form the Red triangle;
// Blue plays two harmless chords in between. commitMove flips turn each call, so
// Red moves on calls 1,3,5 and Blue on 2,4 — Red's third move closes the trap.
const SCRIPT = [0, /*B*/3, 1, /*B*/12, 5];   // final Red claim of edge 5 closes {0,1,2}

function playForced(humanSeat) {
  const ctx = core.createHeadlessCtx({ humanSeat });
  const accepted = [];
  for (const e of SCRIPT) accepted.push(core.commitMove(ctx, e));
  return { ctx, accepted };
}

// ── 1. the reveal fires with the right shape (default seat = P2 = Blue) ───────
{
  const { ctx, accepted } = playForced(1);
  ok('every scripted move committed on the live entry (commitMove)', accepted.every(Boolean), 'accepted=' + JSON.stringify(accepted));
  ok('game reached the OVER phase', ctx.state === 'over', 'state=' + ctx.state);
  ok('the reveal FIRED', ctx.reveal.fired === true, 'fired=' + ctx.reveal.fired);

  const tri = ctx.reveal.triangle;
  ok('the closed triangle is 3 edges spanning exactly 3 studs',
     Array.isArray(tri) && tri.length === 3 && core.triangleStuds(tri).length === 3,
     'tri=' + JSON.stringify(tri) + ' studs=' + JSON.stringify(tri && core.triangleStuds(tri)));

  const cols = tri.map(e => ctx.edgeColor[e]);
  ok('all three closing edges are the SAME colour (a mono triangle)',
     cols[0] !== 0 && cols[0] === cols[1] && cols[1] === cols[2], 'edge colours=' + JSON.stringify(cols));

  ok('losingColor is a real def-colour and matches the closed triangle',
     (ctx.reveal.losingColor === 'R' || ctx.reveal.losingColor === 'B') && ctx.reveal.losingColor === cols[0],
     'losingColor=' + ctx.reveal.losingColor);

  ok('each closing edge is flagged pulsing (edgeFx)', tri.every(e => ctx.edgeFx[e].pulsing === true),
     'pulsing=' + JSON.stringify(tri.map(e => ctx.edgeFx[e].pulsing)));

  ok('all three triangle studs glow (studFx)', core.triangleStuds(tri).every(v => ctx.studFx[v].glow === true),
     'glow=' + JSON.stringify(core.triangleStuds(tri).map(v => ctx.studFx[v].glow)));

  ok('RED closed → the Blue human WINS (misère POV)', ctx.reveal.losingColor === 'R' && ctx.reveal.outcome === 'WIN',
     'losingColor=' + ctx.reveal.losingColor + ' outcome=' + ctx.reveal.outcome);
}

// ── 2. seat-agnostic reveal: the doomed seat (human = P1 = Red) FEELS the loss ─
{
  const { ctx } = playForced(0);
  ok('same forced end, human = Red → outcome LOSS', ctx.reveal.fired && ctx.reveal.losingColor === 'R' && ctx.reveal.outcome === 'LOSS',
     'losingColor=' + ctx.reveal.losingColor + ' outcome=' + ctx.reveal.outcome);
}

// ── 3. no false reveal: a partial game with no mono triangle stays live ───────
{
  const ctx = core.createHeadlessCtx({ humanSeat: 1 });
  core.commitMove(ctx, 0);   // R (0,1)
  core.commitMove(ctx, 2);   // B (0,3)
  core.commitMove(ctx, 5);   // R (1,2)  — R has (0,1),(1,2): no triangle yet
  ok('no triangle closed yet → still playing, reveal not fired',
     ctx.state === 'playing' && ctx.reveal.fired === false, 'state=' + ctx.state + ' fired=' + ctx.reveal.fired);
  ok('commitMove rejects an already-claimed chord', core.commitMove(ctx, 0) === false, 'replaying edge 0 was accepted?!');
}

// ── 4. the reveal outcome agrees with the SOLVED ROOT for the seat under test ─
//    (root LOSS = the mover P1/Red is the doomed seat; P2/Blue is the winner).
//    Our forced end has Red lose — the perfect-play outcome — so the winning seat
//    (Blue) reads WIN and the doomed seat (Red) reads LOSS, matching the solve.
{
  const sol = Adversary.solve(core.GAME);
  const blue = playForced(1).ctx.reveal.outcome;   // P2 seat
  const red = playForced(0).ctx.reveal.outcome;    // P1 seat
  ok('solved root is a P2 win (LOSS for the P1 mover)', sol.ok && sol.value === 'LOSS', 'value=' + sol.value + ' dist=' + sol.dist);
  ok('winning seat (P2/Blue) reveal WIN, doomed seat (P1/Red) reveal LOSS — agrees with the solved root',
     blue === 'WIN' && red === 'LOSS', 'blue=' + blue + ' red=' + red);

  // machine seam smoke: from a fresh ctx the perfect machine returns a legal move.
  const fresh = core.createHeadlessCtx({ humanSeat: 1 });
  const mv = core.machineMove(fresh, sol);
  ok('machineMove returns a legal move from the opening', mv && typeof mv.edge === 'number' && fresh.edgeColor[mv.edge] === 0,
     'move=' + JSON.stringify(mv));
}

// ── 5. threats geometry: SAFE = open − poison, and poison edges are real self-mates ─
{
  const ctx = core.createHeadlessCtx({ humanSeat: 1 });
  ctx.edgeColor[0] = 'R'; ctx.edgeColor[1] = 'R';   // Red owns (0,1),(0,2): edge 5=(1,2) is poison for Red
  const th = core.threats(ctx, 'R');
  const poisonEdges = th.poison.map(p => p.edge);
  ok('poison for Red includes the self-mating chord (1,2)=edge 5', poisonEdges.indexOf(5) >= 0, 'poison=' + JSON.stringify(poisonEdges));
  ok('SAFE count = open − poison', th.safe === th.open - th.poison.length, 'open=' + th.open + ' poison=' + th.poison.length + ' safe=' + th.safe);
}

console.log('\n' + (fails === 0
  ? 'SIM PAYOFF-LIVENESS TWIN: ALL PASS'
  : 'SIM PAYOFF-LIVENESS TWIN: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
