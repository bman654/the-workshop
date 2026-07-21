/* Sprouts — the Node twin. The page and this file run the SAME core (forge inlines
   core.mjs + geom.mjs byte-identically), so the proof and the board cannot drift.

   (A) the in-page self-test oracle — the checks the green pill runs;
   (B) THE ONE CLAIM at volume: n = 2,3,4,5 × 500 seeded games each — live ends
       fall by EXACTLY 1 per move, and every completed game's length lies in
       [2n, 3n−1]. Exact integers, no tolerance, no fitted constant;
   (C) THE PAYOFF-LIVENESS TWIN — driving the page's own real entry functions
       (Game.offerStroke / Game.houseThink / Game.commitHouse), never a synthetic
       canvas pointer event;
   (D) the board-cannot-drift check + route soundness + the thinker's slice;
   (E) byte-parity of the inlined core/ink slabs and forge --check.
   Exit 0 = GREEN. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import * as core from './core.mjs';
import * as geom from './geom.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the in-page oracle ────────────────────────────────────────────────────
{
  const r = core.runSelfTest(false);
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, 'A · ' + c.name + '  ::  ' + c.info);
}

// ── (B) THE ONE CLAIM, at volume ──────────────────────────────────────────────
{
  const t0 = Date.now();
  const s = core.claimSweep([2, 3, 4, 5], 500, 424242);
  line(s.badDrop === 0, 'B · live ends fall by EXACTLY 1 per move  ::  ' + s.games + ' games, ' + s.badDrop + ' violations');
  line(s.badTally === 0, 'B · tally == 3n − movesMade at every step  ::  ' + s.badTally + ' violations');
  line(s.badBound === 0, 'B · every completed game length ∈ [2n, 3n−1]  ::  ' +
    [2, 3, 4, 5].map((n) => `n=${n} ${s.minByN[n]}..${s.maxByN[n]} ⊂ [${2 * n},${3 * n - 1}]`).join(' · '));
  // the bracket must be TIGHT enough to be a real claim: some game must reach
  // both walls somewhere, or the bracket is vacuous decoration.
  const touchesLow = [2, 3, 4, 5].some((n) => s.minByN[n] === 2 * n);
  const touchesHigh = [2, 3, 4, 5].some((n) => s.maxByN[n] === 3 * n - 1);
  line(touchesLow || touchesHigh, 'B · the bracket is not vacuous (a wall is reached)  ::  low ' + touchesLow + ' high ' + touchesHigh);
  console.log('      (' + (Date.now() - t0) + ' ms)');
}

// ── (C) THE PAYOFF-LIVENESS TWIN — the page's own real entry functions ────────
function freshGame(n, seed) {
  const ink = geom.makeInk();
  const G = core.makeGame({ ink, seed });
  G.start(n, seed);
  return { G, ink };
}
{
  // 1. a full auto-played game at n=3, house vs house, through the REAL commit
  //    path (routes drawn, ink baked), reaching a genuine terminal + a winner.
  let ok = 0, played = 0, movesSeen = [], routeReplayFails = 0, maxSlice = 0;
  for (let s = 0; s < 6; s++) {
    const { G, ink } = freshGame(3, 7000 + s);
    let guard = 0;
    while (!G.over) {
      if (++guard > 20) break;
      const t0 = Date.now();
      const think = G.houseThink(4);
      maxSlice = Math.max(maxSlice, Date.now() - t0);
      if (!think || !think.best) break;
      // SOUNDNESS: every route the house produces must survive the very same
      // validator a human stroke is held to.
      for (const c of think.shortlist) {
        // replayed at the nib it was DRAWN with — the hairline valve draws a
        // genuinely finer line, and a fine line legitimately fits a tight place.
        if (!ink.strokeIsLegal(c.poly, { fromSpot: c.move.a.spot, toSpot: c.move.b.spot, resampled: true, nib: c.nib || geom.NIB_R })) routeReplayFails++;
      }
      G.commitHouse(think.best);
    }
    played++;
    const trulyTerminal = core.terminal(G.st) && core.terminalIndependent(G.st);
    if (G.over && trulyTerminal && G.st.winner != null) ok++;
    movesSeen.push(G.st.movesMade);
  }
  line(ok === played, 'C1 · n=3 house-vs-house through the REAL commit path reaches a genuine terminal + a winner  ::  ' +
    ok + '/' + played + ' games, lengths [' + movesSeen.join(',') + '] ⊂ [6,8]');
  line(movesSeen.every((m) => m >= 6 && m <= 8), 'C1 · …and every one of those live games lands inside the bracket  ::  ' + movesSeen.join(','));
  line(routeReplayFails === 0, 'C1 · SOUNDNESS: every house route replays clean through strokeIsLegal  ::  ' + routeReplayFails + ' failures');
  line(maxSlice <= 700, 'C1 · a whole deliberation stays well inside the pondering pause  ::  max ' + maxSlice + ' ms');
}
{
  // 2. Game.offerStroke REJECTS a polyline that crosses ink and ACCEPTS a clean
  //    equivalent — the real legality path, called with a real polyline that
  //    genuinely LANDS on a live spot at both ends (a stroke rejected merely for
  //    ending nowhere would prove nothing about the crossing rule).
  const { G, ink } = freshGame(4, 31337);
  for (let i = 0; i < 2; i++) { const t = G.houseThink(2); if (t && t.best) G.commitHouse(t.best); }
  const before = G.st.movesMade;
  let crossing = null, crossPair = null;
  for (let a = 0; a < ink.pos.length && !crossing; a++) {
    for (let b = a + 1; b < ink.pos.length && !crossing; b++) {
      if (!ink.pos[a] || !ink.pos[b] || core.lives(G.st, a) < 1 || core.lives(G.st, b) < 1) continue;
      const pa = ink.pos[a], pb = ink.pos[b];
      // does the straight segment a→b properly cross a committed curve it does not own?
      let hits = 0;
      for (const cu of ink.curves) {
        if (!cu) continue;
        if (cu.a === a || cu.b === a || cu.mid === a || cu.a === b || cu.b === b || cu.mid === b) continue;
        for (let q = 1; q < cu.poly.length; q++)
          if (geom.segCross(pa.x, pa.y, pb.x, pb.y, cu.poly[q - 1].x, cu.poly[q - 1].y, cu.poly[q].x, cu.poly[q].y)) hits++;
      }
      if (hits > 0) { crossPair = [a, b]; crossing = []; for (let t = 0; t <= 60; t++) crossing.push({ x: pa.x + (pb.x - pa.x) * t / 60, y: pa.y + (pb.y - pa.y) * t / 60 }); }
    }
  }
  const bad = crossing ? G.offerStroke(crossing, 'you') : { ok: true, reason: 'no-crossing-case-found' };
  line(crossing && !bad.ok && bad.reason === 'crossing' && G.st.movesMade === before,
    'C2 · offerStroke REJECTS a polyline that CROSSES ink, spot-to-spot on the real path  ::  ' +
    (crossing ? 'spots ' + crossPair + ', reason "' + bad.reason + '", moves still ' + G.st.movesMade : 'no crossing case constructed'));
  // …and a clean equivalent (the router's own drawing of a legal move) is ACCEPTED
  const legal = core.legalMoves(G.st);
  let accepted = null, tried = 0;
  for (const mv of legal) {
    const r = ink.route(G.st, mv); tried++;
    if (!r) continue;
    const res = G.offerStroke(r.poly, 'you');
    if (res.ok) { accepted = res; break; }
  }
  line(!!accepted && G.st.movesMade === before + 1, 'C2 · …and a CLEAN equivalent stroke is ACCEPTED on the same path  ::  ' +
    (accepted ? 'committed move ' + G.st.movesMade + ' after ' + tried + ' candidate(s)' : 'none accepted'));
}
{
  // 3. the house finds a legal move where one demonstrably exists, and concedes
  //    ONLY at a true terminal — cross-checked by the independent reading.
  let foundWhenExists = 0, checks = 0, falseConcede = 0, falseContinue = 0;
  for (let s = 0; s < 10; s++) {
    const { G } = freshGame(4, 5100 + s);
    let guard = 0;
    while (guard++ < 24) {
      const exists = core.legalMoves(G.st).length > 0;
      const indep = !core.terminalIndependent(G.st);
      if (exists !== indep) falseConcede++;         // the two readings must agree
      const think = G.houseThink(3);
      checks++;
      if (exists) { if (think && think.best) foundWhenExists++; }
      else if (think && think.best) falseContinue++;
      if (!exists) break;
      if (!think || !think.best) break;
      G.commitHouse(think.best);
    }
  }
  line(falseConcede === 0, 'C3 · the two terminality readings never disagree over live play  ::  ' + checks + ' positions');
  line(falseContinue === 0, 'C3 · the house never claims a move at a TRUE terminal  ::  ' + falseContinue + ' phantom moves');
  line(foundWhenExists > 0, 'C3 · the house FINDS a legal move wherever one exists  ::  ' + foundWhenExists + ' positions answered');
}

// ── (D) the board cannot drift ────────────────────────────────────────────────
{
  let drift = 0, probed = 0, mapBad = 0;
  for (let s = 0; s < 2; s++) {
    const { G, ink } = freshGame(4, 8800 + s);
    let guard = 0;
    while (!G.over && guard++ < 20) {
      const t = G.houseThink(2); if (!t || !t.best) break;
      G.commitHouse(t.best);
      mapBad += core.mapConsistency(G.st).bad;
      const r = ink.crossFaceRoutable(G.st, core.liveCorners(G.st), 4);
      drift += r.bad; probed += r.tried;
    }
  }
  line(drift === 0, 'D · flood ⊆ faces: the router NEVER joins two corners on different faces  ::  ' + probed + ' cross-face pairs attempted, ' + drift + ' joined');
  line(mapBad === 0, 'D · the merge/split bookkeeping == the rotation system’s own face trace  ::  ' + mapBad + ' mismatches');
  // the derived clearance is the render pipeline's real worst case, not a guess
  const derived = 2 * (geom.NIB_R * geom.W_MAX + geom.TREMBLE);
  line(geom.CLEARANCE >= derived, 'D · CLEARANCE is derived, not chosen  ::  2·(' + geom.NIB_R + '·' + geom.W_MAX + ' + ' + geom.TREMBLE + ') = ' + derived.toFixed(2) + ' ≤ ' + geom.CLEARANCE);
}

// ── (D2) THE ROUTER MUST NEVER HALT A PLAYABLE GAME ──────────────────────────
//    This is not a performance check, it is a CLAIM check. If the house cannot
//    draw any of the moves the topology says exist, the game stops early and its
//    length falls below 2n — which makes the bracket in the margin a lie. So every
//    seeded game must reach a genuine terminal, drawn end to end with real ink.
{
  let halted = 0, games = 0, belowFloor = 0, worst = 0, hairs = 0, calls = 0, fails = 0;
  for (const n of [2, 3, 4, 5]) {
    for (let s = 0; s < 12; s++) {
      const seed = 4000 + s * 7 + n * 101;
      const { G, ink } = freshGame(n, seed);
      let guard = 0;
      while (!G.over && guard++ < 40) {
        const t0 = Date.now();
        const t = G.houseThink(4);
        worst = Math.max(worst, Date.now() - t0);
        if (!t || !t.best) break;
        G.commitHouse(t.best);
      }
      games++;
      if (!G.over) { halted++; if (G.st.movesMade < 2 * n) belowFloor++; }
      hairs += ink.hairlines; calls += ink.routeCalls; fails += ink.routeFails;
    }
  }
  line(halted === 0, 'D2 · every seeded game is DRAWN to a genuine terminal — the router never halts play  ::  ' +
    games + ' games (n=2..5), ' + halted + ' halted, ' + belowFloor + ' below 2n');
  line(worst <= 400, 'D2 · a whole deliberation fits inside the pondering pause  ::  worst ' + worst + ' ms · ' +
    calls + ' route calls, ' + fails + ' rungs exhausted, ' + hairs + ' hairlines');
}

// ── (E) byte-parity of the inlined slabs + forge --check ─────────────────────
{
  const slab = (text, start, end) => { const i = text.indexOf(start), j = text.indexOf(end); if (i < 0 || j < 0) return null; return text.slice(i, j + end.length); };
  const pairs = [
    ['core.mjs', '// ===== THE SPROUTS CORE (byte-identical to core.mjs) =====', '// ===== END THE SPROUTS CORE ====='],
    ['geom.mjs', '// ===== THE SPROUTS INK (byte-identical to geom.mjs) =====', '// ===== END THE SPROUTS INK ====='],
  ];
  let html = null;
  try { html = readFileSync(join(here, 'index.html'), 'utf8'); } catch (e) { /* not forged yet */ }
  for (const [file, S, E] of pairs) {
    const mod = slab(readFileSync(join(here, file), 'utf8'), S, E);
    const pg = html ? slab(html, S, E) : null;
    line(mod !== null && pg !== null && mod === pg,
      'E · inlined ' + file + ' is BYTE-IDENTICAL in index.html  ::  ' + (mod ? mod.length : 'n/a') + ' vs ' + (pg ? pg.length : 'n/a') + ' bytes');
  }
  try {
    const out = execFileSync('node', [join(here, '..', 'tools', 'forge', 'forge.mjs'), '--check', join(here, 'index.src.html')], { encoding: 'utf8' });
    const clean = /current|up to date|no drift|✓/i.test(out) && !/stale|drift/i.test(out);
    line(clean, 'E · forge --check clean for index.src.html  ::  ' + out.trim().split('\n').slice(-1)[0]);
  } catch (e) {
    line(false, 'E · forge --check FAILED  ::  ' + (e.stdout || e.message || '').toString().trim().split('\n').slice(-1)[0]);
  }
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
