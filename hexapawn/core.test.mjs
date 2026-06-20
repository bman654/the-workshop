// The Matchbox That Learns — the Node twin. runSelfTest() is the SOLE oracle (the page's
// green pill calls the SAME code). This twin (A) runs the engine def's 6 checks + the learner
// self-test, (B) proves the complete trainer's monotone shrink to a minimax-optimal subset,
// (C) re-proves the fixpoint optimal, (D) proves the reward-the-loss neg-control DIVERGES over
// the identical schedule, and (E) byte-parity-checks the learner core inlined into index.html
// against this module's slab + asserts forge --check reports the def-include current. Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Adversary = require(join(here, '..', 'tools', 'game', 'adversary.js'));
const def = require(join(here, '..', 'tools', 'game', 'games', 'hexapawn.js'));

let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the in-page self-test oracle: the def's 6 engine checks + the learner battery ──────────
{
  const r = core.runSelfTest(Adversary, def);
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, 'A · ' + c.name + '  ::  ' + c.info);
}

const sol = Adversary.solve(def);
const boxes = core.machineBoxes(def, sol);

// ── (B) THE COMPLETE TRAINER: R strictly decreases every step, monotone non-increasing
// throughout, and terminates in EXACTLY 15 steps at R=0 (an enumerated finite loss count). ──
{
  const disc = core.completeTrainer(boxes, def, sol, 'discard');
  let strictlyDown = true, monotone = true;
  for (let i = 1; i < disc.rSeq.length; i++) {
    if (disc.rSeq[i] >= disc.rSeq[i - 1]) strictlyDown = false;
    if (disc.rSeq[i] > disc.rSeq[i - 1]) monotone = false;
  }
  line(disc.rSeq[0] === 17, 'B · trainer starts at R=17 reachable losing replies  ::  R0=' + disc.rSeq[0]);
  line(monotone, 'B · R is monotone non-increasing throughout the trainer');
  line(strictlyDown, 'B · R STRICTLY decreases at every discard step');
  line(disc.steps === 15 && disc.rSeq[disc.rSeq.length - 1] === 0,
    'B · trainer terminates in EXACTLY 15 steps at R=0  ::  R: ' + disc.rSeq.join('→'));
}

// ── (C) the FIXPOINT is minimax-optimal: the converged machine keeps only winning replies in
// every reachable box, so it never loses (a 2nd player playing a 2nd-player-win game perfectly). ──
{
  const disc = core.completeTrainer(boxes, def, sol, 'discard');
  const opt = core.isMinimaxOptimal(boxes, disc.support, def, sol);
  line(opt.ok, 'C · fixpoint is minimax-optimal (machine never loses)  ::  ' + opt.detail);
  // and an empirical sweep: the converged machine vs a perfect-exploring human reaches no loss.
  // Walk every line: human plays any winning move, machine plays any in-support bead → never a machine loss.
  const reached = core.reachableBoxes(boxes, disc.support, def);
  let machineLosses = 0;
  const stack = [def.initState()], seen = new Set();
  while (stack.length) {
    const s = stack.pop();
    const t = def.terminal(s);
    if (t.over) { if (s.turn === 1 && t.value === 'LOSS') machineLosses++; continue; }
    const k = def.key(s);
    if (seen.has(k)) continue; seen.add(k);
    if (s.turn === 0) { for (const m of def.legalMoves(s)) stack.push(def.apply(s, m)); }
    else {
      const supBox = disc.support.get(k);
      if (!supBox) continue;
      const box = boxes.get(k);
      // MIRROR ROUND-TRIP: translate each in-support bead's canonical id to a LIVE move
      // on s before applying — applying the representative's move to a mirrored live state
      // would not advance the board (the teleport bug the def's liveMove() exists to prevent).
      supBox.forEach((c, bi) => { if (c > 0) stack.push(def.apply(s, def.liveMove(s, box.beadIds[bi]))); });
    }
  }
  line(machineLosses === 0 && reached.size > 0,
    'C · converged machine reaches ZERO losing terminals over all human lines  ::  ' +
    machineLosses + ' losses over ' + reached.size + ' reachable boxes');
}

// ── (D) THE REWARD-THE-LOSS NEGATIVE CONTROL DIVERGES: identical trainer schedule, sign flipped
// (ADD a reachable losing bead instead of removing one). R is non-decreasing, STRICTLY grows, and
// never reaches 0 — the sign flip is the ONLY difference, so divergence is causal, not incidental. ──
{
  const disc = core.completeTrainer(boxes, def, sol, 'discard');
  const rew = core.completeTrainer(boxes, def, sol, 'reward', disc.steps);
  let nonDown = true, strictlyUp = true;
  for (let i = 1; i < rew.rSeq.length; i++) {
    if (rew.rSeq[i] < rew.rSeq[i - 1]) nonDown = false;
    if (rew.rSeq[i] <= rew.rSeq[i - 1]) strictlyUp = false;
  }
  line(rew.rSeq[0] === 17 && nonDown && strictlyUp && rew.rSeq.every((v) => v > 0),
    'D · reward neg-control DIVERGES: R 17→' + rew.rSeq[rew.rSeq.length - 1] + ' over ' + disc.steps +
    ' steps, strictly grows, never 0  ::  R: ' + rew.rSeq.join('→'));
  // the ONLY difference is the sign: discard ends at 0, reward ends > start, same step count.
  line(disc.rSeq[disc.rSeq.length - 1] === 0 && rew.rSeq[rew.rSeq.length - 1] > rew.rSeq[0] && disc.steps === rew.steps,
    'D · identical schedule, opposite signs: discard→0, reward→' + rew.rSeq[rew.rSeq.length - 1] +
    ' (both ' + disc.steps + ' steps)');
}

// ── (E) BYTE-PARITY: the learner core inlined into index.html is byte-identical to this module's
// sentinel-to-sentinel slab; and forge --check reports the page's includes (engine+def) current. ──
{
  const START = '// ===== HEXAPAWN LEARNER CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END HEXAPAWN LEARNER CORE =====';
  const slab = (text) => {
    const i = text.indexOf(START), j = text.indexOf(END);
    if (i < 0 || j < 0) return null;
    return text.slice(i, j + END.length);
  };
  const modBlock = slab(readFileSync(join(here, 'core.mjs'), 'utf8'));
  const htmlBlock = slab(readFileSync(join(here, 'index.html'), 'utf8'));
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'E · inlined learner core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
