/* ═══════════════════════════════════════════════════════════════════════════
   WARREN — the headless Node twin. Requires the SAME engine the page inlines
   (warren/engine/warren.js) and the SAME pure-data floors the page inlines
   (warren/floors/*.json), so a green run here is a green run in the browser.

   Run:  node warren/warren.test.mjs    (exit 0 = all pass, 1 = any fail)

   Proves, PRINTING THE VALUES:
     1. THE CROSSING is SURVIVABLE — a guaranteed start→exit step/wait path exists
        against the monster's deterministic rule; prints the proven path length (15)
        and that WAITING is LOAD-BEARING (4 waits; a greedy no-wait walk dies).
     2. THE PINCER is UNSURVIVABLE (negative control) — 'no safe path'; the solver
        DISCRIMINATES (yes to one floor, no to the other — not a rubber stamp).
     3. DETERMINISM (same state+action → same monster step) + TOTALITY (legalActions
        never illegally empties) + the grafted NO-SOFTLOCK reverse-reachability check.
   ═══════════════════════════════════════════════════════════════════════════ */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const W = require('./engine/warren.js');
const loadFloor = name => JSON.parse(readFileSync(join(HERE, 'floors', name), 'utf8'));

const CROSSING = loadFloor('the-crossing.json');
const PINCER   = loadFloor('the-pincer.json');

let pass = 0, fail = 0;
const ok  = (cond, label, detail) => {
  (cond ? pass++ : fail++);
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  —  ' + detail : ''}`);
};
const fresh = f => JSON.parse(JSON.stringify(f));   // a clean copy (drop derived caches)

console.log('\n── WARREN · headless self-test ' + '─'.repeat(40));

/* 1 ── THE CROSSING is SURVIVABLE, and WAIT is load-bearing ─────────────── */
console.log('\n[1] The Crossing — survivable, and stillness is a move');
const cross = W.solve(fresh(CROSSING));
const waits = cross.path.filter(a => a === 'wait').length;
ok(cross.survivable, 'The Crossing is SURVIVABLE',
   `BFS found a safe path in ${cross.path.length} turns over ${cross.statesExplored} states`);
ok(cross.path.length === 15, 'proven shortest path length == 15',
   `path = [${cross.path.join(' ')}]`);
ok(waits === 4, 'WAITING is load-bearing — the shortest path spends 4 waits',
   `${waits} of ${cross.path.length} actions are WAIT`);

// A greedy no-wait walker (the path the engine returns with every wait deleted)
// must DIE — proving the waits aren't decoration. We replay the path minus waits.
function replay(floor, actions) {
  const f = W.prepFloor(fresh(floor));
  let s = W.initState(f), dead = false;
  for (const a of actions) {
    const r = W.apply(f, s, a);
    s = r.state;
    if (r.dead) { dead = true; break; }
    if (W.isWin(f, s)) break;
  }
  return { state: s, dead, won: W.isWin(f, s) };
}
const greedy = replay(CROSSING, cross.path.filter(a => a !== 'wait'));
ok(greedy.dead || !greedy.won, 'the greedy no-wait variant FAILS',
   greedy.dead ? 'caught in the corridor without the waits' : 'never reaches the exit without the waits');

/* 2 ── THE PINCER is UNSURVIVABLE; the solver discriminates ─────────────── */
console.log('\n[2] The Pincer — the load-bearing negative control');
const pincer = W.solve(fresh(PINCER));
ok(!pincer.survivable, 'The Pincer is UNSURVIVABLE — no safe path',
   `BFS exhausted ${pincer.statesExplored} states, every crossing caught → REJECTED`);
ok(cross.survivable && !pincer.survivable, 'the solver DISCRIMINATES',
   'says YES to The Crossing and NO to The Pincer — not a rubber stamp');

/* 3 ── determinism · totality · no-softlock ─────────────────────────────── */
console.log('\n[3] Engine invariants — determinism, totality, no-softlock');
ok(cross.deterministicOK && pincer.deterministicOK, 'DETERMINISM',
   'same state + action → identical monster step on both floors');
ok(cross.totalityOK && pincer.totalityOK, 'TOTALITY',
   'legalActions never illegally empties — wait is always legal');
ok(!cross.softlock, 'NO SOFTLOCK (reverse reachability)',
   'every reachable live state on The Crossing can still reach the exit');
ok(cross.errors.length === 0, 'The Crossing has no static/structural errors',
   'start & exit in bounds, patrol well-formed, no softlock');

/* 3b ── solverPlayer continues from a LIVE state, not a reset ───────────── */
console.log('\n[3b] solverPlayer — the hint solves from RIGHT HERE');
{
  const f = W.prepFloor(fresh(CROSSING));
  let s = W.initState(f);
  // walk the first 5 proven actions, then ask for the rest from the live state
  for (let i = 0; i < 5; i++) s = W.apply(f, s, cross.path[i]).state;
  const rest = W.solverPlayer(fresh(CROSSING), s);
  // replay full = first 5 + the live-solved remainder; must reach the exit alive
  const full = cross.path.slice(0, 5).concat(rest);
  const out = replay(CROSSING, full);
  ok(out.won && !out.dead, 'solverPlayer(floor, liveState) finishes the floor from mid-run',
     `5 played + ${rest.length} live-solved = ${full.length} total → reached the exit`);
}

/* ── verdict ─────────────────────────────────────────────────────────────── */
console.log('\n' + '─'.repeat(72));
console.log(`WARREN self-test: ${pass}/${pass + fail} PASS${fail ? `  (${fail} FAILED)` : '  ✓'}`);
console.log('');
process.exit(fail ? 1 : 0);
