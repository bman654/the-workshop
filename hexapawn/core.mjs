/* ═══════════════════════════════════════════════════════════════════════════
   hexapawn/core.mjs — THE MATCHBOX LEARNER (the sole pure engine for the room).

   This is the DOM-free brain of "The Matchbox That Learns". It carries no render
   code: it builds the matchbox machine over the SOLVED Hexapawn tree, runs the
   MENACE draw/discard loop, and proves — over an enumerated finite loss count —
   that discarding-on-loss monotonically shrinks the machine's forced-loss lines to
   a minimax-optimal subset, while the rewarding-the-loss negative control diverges.

   It does NOT solve Hexapawn itself — that is the engine's job (tools/game/adversary.js
   + tools/game/games/hexapawn.js). The page inlines the engine + def via forge; the
   Node twin (core.test.mjs) requires them. Both hand this module the SAME engine, so
   the green pill in the browser is the same computation as `node core.test.mjs`.

   The body BETWEEN the two sentinel lines is inlined BYTE-IDENTICALLY into index.html
   (byte-parity is asserted by core.test.mjs leg E) — DO NOT edit one copy alone.
   ═══════════════════════════════════════════════════════════════════════════ */

// ===== HEXAPAWN LEARNER CORE (byte-identical to core.mjs) =====
//
// The machine is the SECOND player (Black, turn===1). A "box" is a canonical
// machine-to-move position; a "bead" is one legal reply, coloured by the move it
// votes for. The naive machine starts with every bead present (one vote each).
//
// All functions are PURE over (def, sol) where:
//   def = the Hexapawn game-def (tools/game/games/hexapawn.js)
//   sol = Adversary.solve(def) — the fully-solved retrograde table.
// Both are passed in so the page (forge-inlined engine) and the Node twin (required
// engine) run the identical learner code against their own engine instance.

const WIN_ = 'WIN', LOSS_ = 'LOSS';

// A small deterministic hash → an HSL hue, so a bead's colour is stable forever from
// its FIXED-at-creation move id (canonical "from-to"). No flicker as the rack grows.
function beadHue(moveId) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < moveId.length; i++) { h ^= moveId.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h % 360;
}

// Build the catalog of machine boxes over the solved tree. Returns an ordered Map
// canonicalKey → { key, state, moves, beadIds, hueOf }. `moves` are LIVE moves on
// the representative state; `beadIds[i]` is the canonical move id for moves[i] (the
// learner indexes beads by canonical id; the UI animates the live move via liveMove).
function machineBoxes(def, sol) {
  // one representative state per reachable canonical key (a tiny BFS over the DAG)
  const byKey = new Map();
  const root = def.initState();
  const q = [root];
  byKey.set(def.key(root), root);
  while (q.length) {
    const s = q.shift();
    const t = def.terminal(s);
    if (t.over) continue;
    for (const m of def.legalMoves(s)) {
      const c = def.apply(s, m);
      const ck = def.key(c);
      if (!byKey.has(ck)) { byKey.set(ck, c); q.push(c); }
    }
  }
  const boxes = new Map();
  const keys = [];
  byKey.forEach((st, key) => {
    if (st.turn !== 1) return;                 // machine = the side that moves at turn 1
    const t = def.terminal(st);
    if (t.over) return;
    const moves = def.legalMoves(st);
    if (!moves.length) return;
    keys.push(key);
  });
  keys.sort();                                  // deterministic box order
  for (const key of keys) {
    const st = byKey.get(key);
    const moves = def.legalMoves(st);
    const beadIds = moves.map((m) => def.canonicalMoveId(st, m));
    boxes.set(key, { key, state: st, moves, beadIds, hueOf: beadIds.map(beadHue) });
  }
  return boxes;
}

// Is reply i of `box` a LOSING bead? — i.e. does it hand the HUMAN a won position?
// The child node's value is from the side-to-move's POV at the child; after the
// machine moves it is the human's turn, so child.value===WIN means the human wins.
function beadIsLosing(box, i, def, sol) {
  const node = sol.table.get(def.key(def.apply(box.state, box.moves[i])));
  return !!node && node.value === WIN_;
}
function beadIsWinning(box, i, def, sol) {
  const node = sol.table.get(def.key(def.apply(box.state, box.moves[i])));
  return !!node && node.value === LOSS_;       // child is a LOSS for the human → a machine win
}
function losingBeadsOf(box, def, sol) {
  const out = [];
  for (let i = 0; i < box.moves.length; i++) if (beadIsLosing(box, i, def, sol)) out.push(i);
  return out;
}

// A "support" is the per-box multiset of present beads: Map<boxKey, Map<beadIdx,count>>.
// count 0 = the bead is discarded; count ≥1 = present with that many votes (reward
// raises a count; discard zeroes one). The naive machine: every bead count 1.
function freshSupport(boxes) {
  const sup = new Map();
  boxes.forEach((b, k) => {
    const m = new Map();
    b.moves.forEach((_, i) => m.set(i, 1));
    sup.set(k, m);
  });
  return sup;
}
function liveBeads(supBox) { let n = 0; supBox.forEach((c) => { if (c > 0) n++; }); return n; }

// The boxes actually REACHABLE in play under a given support: BFS from the root
// branching on ALL human moves but only on IN-SUPPORT machine beads. Convergence is
// measured over this set — a box no path can reach no longer matters.
function reachableBoxes(boxes, support, def) {
  const seen = new Set();
  const reached = new Set();
  const q = [def.initState()];
  while (q.length) {
    const s = q.shift();
    const t = def.terminal(s);
    if (t.over) continue;
    const k = def.key(s);
    if (seen.has(k)) continue;
    seen.add(k);
    if (s.turn === 0) {
      for (const m of def.legalMoves(s)) q.push(def.apply(s, m));
    } else {
      const supBox = support.get(k);
      if (!supBox) continue;
      reached.add(k);
      const box = boxes.get(k);
      // MIRROR ROUND-TRIP: a bead is a canonical move id; translate to a live move on s
      // before applying (the representative's move would not advance a mirrored live state).
      supBox.forEach((cnt, bi) => { if (cnt > 0) q.push(def.apply(s, def.liveMove(s, box.beadIds[bi]))); });
    }
  }
  return reached;
}

// R — the convergence measure: the number of REACHABLE, IN-SUPPORT losing beads,
// counting reward multiplicity. R=0 ⟺ no path lets the machine blunder into a loss.
function reachableLossCount(boxes, support, def, sol) {
  const reached = reachableBoxes(boxes, support, def);
  let r = 0;
  reached.forEach((k) => {
    const supBox = support.get(k), box = boxes.get(k);
    supBox.forEach((cnt, bi) => { if (cnt > 0 && beadIsLosing(box, bi, def, sol)) r += cnt; });
  });
  return r;
}

// ONE DISCARD step: scan reachable boxes in key order; in the first box with >1 live
// bead and a reachable losing bead, ZERO the smallest-index losing bead (keep ≥1
// live). Because emptying a box of its losing replies can make a previously-protected
// parent line force a loss, the NEXT step's reachableBoxes re-derivation back-props
// the pruning toward the root automatically (a box reached only via a now-dead bead
// drops out of `reached`). Returns the {boxKey, beadIdx} removed, or null at fixpoint.
function discardStep(boxes, support, def, sol) {
  const reached = reachableBoxes(boxes, support, def);
  for (const k of boxes.keys()) {
    if (!reached.has(k)) continue;
    const supBox = support.get(k), box = boxes.get(k);
    if (liveBeads(supBox) <= 1) continue;
    const losing = [];
    supBox.forEach((cnt, bi) => { if (cnt > 0 && beadIsLosing(box, bi, def, sol)) losing.push(bi); });
    losing.sort((a, b) => a - b);
    if (losing.length) { supBox.set(losing[0], 0); return { boxKey: k, beadIdx: losing[0] }; }
  }
  return null;
}

// ONE REWARD step (the negative control): the SAME schedule, sign flipped — instead
// of removing a reachable losing bead, ADD a vote to it. Rewarding the blunder makes
// the machine more likely to repeat it; R can only grow.
function rewardStep(boxes, support, def, sol) {
  const reached = reachableBoxes(boxes, support, def);
  for (const k of boxes.keys()) {
    if (!reached.has(k)) continue;
    const supBox = support.get(k), box = boxes.get(k);
    const losing = [];
    supBox.forEach((cnt, bi) => { if (beadIsLosing(box, bi, def, sol)) losing.push(bi); });
    losing.sort((a, b) => a - b);
    if (losing.length) { supBox.set(losing[0], supBox.get(losing[0]) + 1); return { boxKey: k, beadIdx: losing[0] }; }
  }
  return null;
}

// Run the complete trainer to its fixpoint, recording R after each step. `mode` is
// 'discard' or 'reward'. For reward we cap at `rewardSteps` (it never terminates).
function completeTrainer(boxes, def, sol, mode, rewardSteps) {
  const support = freshSupport(boxes);
  const rSeq = [reachableLossCount(boxes, support, def, sol)];
  const removals = [];
  let steps = 0;
  const CAP = 200;
  while (steps < CAP) {
    let act;
    if (mode === 'reward') { if (steps >= (rewardSteps || 0)) break; act = rewardStep(boxes, support, def, sol); }
    else { act = discardStep(boxes, support, def, sol); }
    if (!act) break;
    removals.push(act);
    steps++;
    rSeq.push(reachableLossCount(boxes, support, def, sol));
    if (mode === 'discard' && rSeq[rSeq.length - 1] === 0) break;
  }
  return { support, rSeq, steps, removals };
}

// Is a converged support minimax-optimal? — every reachable box must (a) hold NO
// in-support losing bead and (b) still hold ≥1 WINNING reply (a child that is a LOSS
// for the human), so the machine, being the 2nd player of a 2nd-player-win game,
// never loses against any opponent.
function isMinimaxOptimal(boxes, support, def, sol) {
  const reached = reachableBoxes(boxes, support, def);
  let bad = null;
  reached.forEach((k) => {
    if (bad) return;
    const supBox = support.get(k), box = boxes.get(k);
    let hasWin = false;
    supBox.forEach((cnt, bi) => {
      if (cnt <= 0) return;
      if (beadIsLosing(box, bi, def, sol)) bad = k + ' still holds a losing bead';
      if (beadIsWinning(box, bi, def, sol)) hasWin = true;
    });
    if (!bad && !hasWin) bad = k + ' has no winning reply left';
  });
  return { ok: !bad, detail: bad || 'every reachable box keeps only winning replies' };
}

// ── the Menace RUNTIME — hand-play & auto-play share this exact draw/discard path ──
// makeMachine(def, sol) → a live, mutable machine the page (and tests) drive turn by
// turn. draw(state) picks an in-support bead weighted by vote count (seeded RNG);
// recordOutcome() runs the MENACE discard on a machine loss along lineThisGame.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeMachine(def, sol, seed) {
  const boxes = machineBoxes(def, sol);
  const support = freshSupport(boxes);
  const rng = mulberry32(seed == null ? 0x2468ace : seed);
  let lineThisGame = [];                 // [{ boxKey, beadIdx }] of THIS game's machine replies
  const stats = { wins: 0, losses: 0, games: 0 };

  function boxFor(state) { return boxes.get(def.key(state)); }

  // Draw a weighted in-support bead for the machine to move at `state`. Returns
  // { boxKey, beadIdx, move (live), canonicalId } or null if the box is empty/absent.
  function draw(state) {
    const k = def.key(state);
    const box = boxes.get(k);
    const supBox = support.get(k);
    if (!box || !supBox) return null;
    let total = 0; supBox.forEach((c) => { if (c > 0) total += c; });
    if (total <= 0) return null;          // an emptied (resigned) box has no reply
    let pick = rng() * total, chosen = -1;
    supBox.forEach((c, bi) => { if (chosen >= 0 || c <= 0) return; pick -= c; if (pick < 0) chosen = bi; });
    if (chosen < 0) supBox.forEach((c, bi) => { if (chosen < 0 && c > 0) chosen = bi; });
    lineThisGame.push({ boxKey: k, beadIdx: chosen });
    // MIRROR ROUND-TRIP: the bead is indexed by canonical id; translate it back to a
    // LIVE move on `state` so the board animates a real move and never teleports.
    const move = def.liveMove(state, box.beadIds[chosen]);
    return { boxKey: k, beadIdx: chosen, move, canonicalId: box.beadIds[chosen] };
  }

  function newGame() { lineThisGame = []; }

  // Record the finished game's result FROM THE HUMAN's POV. On a human win (machine
  // loss) we run the MENACE discard: remove the last machine bead on the line that
  // still has a sibling (keep ≥1 live). Returns the discards applied (for animation).
  function recordOutcome(humanWon) {
    stats.games++;
    const discards = [];
    if (humanWon) {
      stats.wins++;
      for (let i = lineThisGame.length - 1; i >= 0; i--) {
        const { boxKey, beadIdx } = lineThisGame[i];
        const supBox = support.get(boxKey);
        if (supBox && liveBeads(supBox) > 1 && supBox.get(beadIdx) > 0) {
          supBox.set(beadIdx, supBox.get(beadIdx) - 1);
          discards.push({ boxKey, beadIdx, emptied: liveBeads(supBox) === 1 });
          break;                          // MENACE removes ONE bead per loss (the last live one)
        }
      }
    } else {
      stats.losses++;
    }
    return discards;
  }

  return {
    boxes, support, stats,
    boxFor, draw, newGame, recordOutcome,
    liveBeadCount: (k) => liveBeads(support.get(k)),
    beadCount: (k, bi) => (support.get(k) ? support.get(k).get(bi) || 0 : 0),
    isEmptyBox: (k) => liveBeads(support.get(k)) === 0,
    reset() {
      support.forEach((m) => m.forEach((_, bi) => m.set(bi, 1)));
      stats.wins = 0; stats.losses = 0; stats.games = 0; lineThisGame = [];
    },
    get line() { return lineThisGame.slice(); }
  };
}

// ── runSelfTest(Adversary, def): the in-page green pill's oracle. The page's pill and
// the Node twin both call THIS. Returns { ok, passed, total, checks, facts }. ──
function runSelfTest(Adversary, def) {
  const checks = [];
  const add = (name, pass, info) => checks.push({ name, pass: !!pass, info: info || '' });

  const sol = Adversary.solve(def);

  // (1) the def's 6 engine checks + the literature battery (root LOSS / mate-6 / 71 / 0-draw / mirror)
  const eng = Adversary.runSelfTest([def]);
  add('engine self-test green (6/6) + literature battery', eng.pass === eng.total,
    eng.pass + '/' + eng.total + ' · ' + (eng.checks.find((c) => /literature/.test(c.name)) || {}).detail);
  add('Hexapawn = 2nd-player win, mate in 6 (' + sol.nodeCount + ' nodes)',
    sol.value === LOSS_ && sol.dist === 6 && sol.nodeCount === 71,
    sol.value + ' / mate ' + sol.dist + ' / ' + sol.nodeCount + ' nodes');

  // (2) the naive machine: box & bead counts
  const boxes = machineBoxes(def, sol);
  let beads = 0; boxes.forEach((b) => { beads += b.moves.length; });
  let totalLosing = 0; boxes.forEach((b) => { totalLosing += losingBeadsOf(b, def, sol).length; });
  add('naive machine: 19 boxes, 47 beads, 17 losing replies',
    boxes.size === 19 && beads === 47 && totalLosing === 17,
    boxes.size + ' boxes · ' + beads + ' beads · ' + totalLosing + ' losing');

  // (3) the complete trainer: R strictly decreases every step and reaches 0
  const disc = completeTrainer(boxes, def, sol, 'discard');
  let strictlyDown = true;
  for (let i = 1; i < disc.rSeq.length; i++) if (disc.rSeq[i] >= disc.rSeq[i - 1]) strictlyDown = false;
  const reaches0 = disc.rSeq[disc.rSeq.length - 1] === 0;
  add('discard trainer: R 17→0 in 15 strictly-decreasing steps',
    disc.rSeq[0] === 17 && strictlyDown && reaches0 && disc.steps === 15,
    'R: ' + disc.rSeq.join('→') + '  (' + disc.steps + ' steps)');

  // (4) the fixpoint is minimax-optimal (machine never loses)
  const opt = isMinimaxOptimal(boxes, disc.support, def, sol);
  add('converged machine is minimax-optimal (never loses)', opt.ok, opt.detail);

  // (5) the reward-the-loss neg-control DIVERGES over the same schedule (sign flipped)
  const rew = completeTrainer(boxes, def, sol, 'reward', disc.steps);
  let nonDown = true, strictlyUp = true;
  for (let i = 1; i < rew.rSeq.length; i++) {
    if (rew.rSeq[i] < rew.rSeq[i - 1]) nonDown = false;
    if (rew.rSeq[i] <= rew.rSeq[i - 1]) strictlyUp = false;
  }
  const never0 = rew.rSeq.every((v) => v > 0);
  add('reward neg-control DIVERGES: R 17→' + rew.rSeq[rew.rSeq.length - 1] + ', strictly grows, never 0',
    nonDown && strictlyUp && never0 && rew.rSeq[0] === 17,
    'R: ' + rew.rSeq.join('→'));

  const passed = checks.reduce((a, c) => a + (c.pass ? 1 : 0), 0);
  return {
    ok: passed === checks.length, passed, total: checks.length, checks,
    facts: {
      value: sol.value, mate: sol.dist, nodes: sol.nodeCount,
      boxes: boxes.size, beads, losing: totalLosing,
      discardSteps: disc.steps, discardSeq: disc.rSeq,
      rewardFinal: rew.rSeq[rew.rSeq.length - 1], rewardSeq: rew.rSeq
    }
  };
}
// ===== END HEXAPAWN LEARNER CORE =====

export {
  beadHue, machineBoxes, beadIsLosing, beadIsWinning, losingBeadsOf,
  freshSupport, reachableBoxes, reachableLossCount, discardStep, rewardStep,
  completeTrainer, isMinimaxOptimal, makeMachine, runSelfTest
};
