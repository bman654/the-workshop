#!/usr/bin/env node
/* tiltyard.test.cjs — headless proof harness for THE TILTYARD.
   Requires the SAME deterministic core the page forge-inlines, so the in-page
   self-test chip and this harness assert the IDENTICAL battery (chip === twin),
   PLUS wide-seed cross-checks the chip can't afford to run.

   Run:  node arcade/games/tiltyard.test.cjs
   Exits 0 iff every assertion passes; 1 otherwise. */
'use strict';
const core = require('./tiltyard.core.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

// ── 1. The in-core battery (the verbatim claims the page runs in its chip — the
//       byte-twin requirement: chip === twin). ────────────────────────────────
const st = core.runSelfTest();
for (const r of st.results) ok(r.name, r.pass, r.detail);

// ── 2. Wide-seed cross-checks from the harness side ──────────────────────────

// 2a. 200-seed PERFECTNESS sweep: every generated board is |E|=V−1 + connected +
//     acyclic (⇒ a perfect maze with exactly one path between any two cells).
{
  let allPerfect = true, bad = '';
  for (let seed = 1; seed <= 200; seed++) {
    const m = core.genMaze(seed * 2654435761 >>> 0, 9, 9);
    const perfect = core.edgeCount(m) === m.V - 1 && core.isConnected(m) && core.isAcyclic(m);
    if (!perfect) { allPerfect = false; bad = 'seed#' + seed + ' |E|=' + core.edgeCount(m) + ' conn=' + core.isConnected(m) + ' acy=' + core.isAcyclic(m); break; }
  }
  ok('200-seed perfectness sweep: every board is |E|=V−1 + connected + acyclic (a true spanning tree)', allPerfect, bad || 'all 200 perfect');
}

// 2b. 200-seed BRAID-DISCRIMINATION sweep: every braided board is connected with
//     |E|=V and NOT acyclic (the neg-control discriminates on every seed, not just one).
{
  let allDiscriminate = true, bad = '';
  for (let seed = 1; seed <= 200; seed++) {
    const m = core.genBraided(seed * 40503 >>> 0, 9, 9);
    const discriminates = core.isConnected(m) && core.edgeCount(m) === m.V && !core.isAcyclic(m);
    if (!discriminates) { allDiscriminate = false; bad = 'seed#' + seed + ' conn=' + core.isConnected(m) + ' |E|=' + core.edgeCount(m) + '(V=' + m.V + ') acy=' + core.isAcyclic(m); break; }
  }
  ok('200-seed braid-discrimination sweep: every braided board stays connected but |E|=V and is NOT acyclic (cyclic ⇒ >1 path) — the test discriminates on every seed', allDiscriminate, bad || 'all 200 discriminate');
}

// 2c. SIZE-INVARIANCE: the generator stays perfect at 5×5, 15×15, and a big 25×25.
{
  let allOk = true, dims = [], detail = [];
  for (const [w, h] of [[5, 5], [15, 15], [25, 25]]) {
    const m = core.genMaze(0xBEEF, w, h);
    const perfect = core.edgeCount(m) === m.V - 1 && core.isConnected(m) && core.isAcyclic(m);
    if (!perfect) allOk = false;
    detail.push(w + 'x' + h + '=' + (perfect ? 'perfect' : 'BROKEN'));
  }
  ok('size-invariance: the generator is perfect at 5×5, 15×15, and 25×25 (the proof scales with the board)', allOk, detail.join(' '));
}

// 2d. CROSS-FACET HANDSHAKE: every genMaze edge ⟺ the physics passability view
//     (isOpen). The collision code and the proof read the SAME wall presence.
{
  let allAgree = true, bad = '';
  for (let seed = 1; seed <= 50; seed++) {
    const m = core.genMaze(seed * 99991 >>> 0, 9, 9);
    if (!core.openMatchesEdges(m)) { allAgree = false; bad = 'seed#' + seed + ' open[]≠edges'; break; }
    // spot-check: every edge corresponds to an isOpen-passable boundary in both cells
    for (const [a, b] of m.edges) {
      const ax = a % m.W, ay = (a / m.W) | 0, bx = b % m.W, by = (b / m.W) | 0;
      const east = (bx === ax + 1 && by === ay);
      const south = (by === ay + 1 && bx === ax);
      const okEdge = east ? (core.isOpen(m, ax, ay, core.E) && core.isOpen(m, bx, by, core.W))
                          : south ? (core.isOpen(m, ax, ay, core.S) && core.isOpen(m, bx, by, core.N)) : false;
      if (!okEdge) { allAgree = false; bad = 'seed#' + seed + ' edge ' + a + '-' + b + ' not bidirectionally open'; break; }
    }
    if (!allAgree) break;
  }
  ok('cross-facet handshake: across 50 seeds every maze edge is bidirectionally passable in the physics isOpen() view (collision + proof read one source of truth)', allAgree, bad || 'all edges agree');
}

// 2e. MULTI-SEED REPLAY DETERMINISM: several seeds each replay byte-identical
//     across two independent runs of the same scripted controller.
{
  const seeds = [1, 2, 7, 42, 1337, 90210];
  let allMatch = true, distinct = new Set();
  for (const seed of seeds) {
    const a = core.makeGame(2, { seed });
    const b = core.makeGame(2, { seed });
    const track = (w) => core.winController(w);
    for (let t = 0; t < 3000 && !a.over; t++) core.stepTick(a, track(a));
    for (let t = 0; t < 3000 && !b.over; t++) core.stepTick(b, track(b));
    const ha = core.hashGame(a), hb = core.hashGame(b);
    if (ha !== hb) allMatch = false;
    distinct.add(ha);
  }
  ok('multi-seed replay determinism: ' + seeds.length + ' seeds each replay byte-identical across two runs', allMatch, 'allMatch=' + allMatch + ' distinctEndStates=' + distinct.size + '/' + seeds.length);
}

// 2f. THE SCRIPTED SOLVER WINS EVERY LEVEL 1..6 with clock to spare (the boards
//     are always genuinely winnable, not just level 1).
{
  let allWon = true, details = [];
  for (let lvl = 1; lvl <= 6; lvl++) {
    const w = core.makeGame(lvl, { seed: 300 + lvl });
    const got = core.winSolve(w, 80000);
    if (!got.won || got.clockLeft <= 0) allWon = false;
    details.push('L' + lvl + '=' + (got.won ? 'WON+' + got.clockLeft + 't' : (got.fell ? 'FELL' : 'TIMEOUT')));
  }
  ok('every level (1..6) is winnable by the scripted controller with clock to spare', allWon, details.join(' '));
}

console.log('\n' + (fails === 0
  ? 'THE TILTYARD SELF-TEST: ALL PASS (' + st.results.length + ' core claims + 6 harness checks)'
  : 'THE TILTYARD SELF-TEST: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
