/* sim.test.mjs — the MATH twin for Sim on K6 (the game that can't be drawn).
   Headless correctness harness: the three headline assertions + the engine's own
   self-test battery + a 500-game perfect-play sweep. Run:

       node tools/game/games/sim.test.mjs

   Asserts (exit 0 iff all pass):
     (1) 0 draw-boards among all 2^15 = 32768 complete K6 colourings (R(3,3)=6);
     (2) solve() returns a P2 win (root LOSS for the mover) at exact mate-in-15;
     (3) K5 neg-control yields ≥1 triangle-free colouring (the pentagon/pentagram);
   plus the perfect P2 player never loses to a random P1 over 500 seeded games. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Adversary = require('../adversary.js');
const GAME_sim = require('./sim.js');

let fails = 0;
function ok(name, cond, detail) {
  const pass = !!cond;
  if (!pass) fails++;
  console.log((pass ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
}

const sol = Adversary.solve(GAME_sim);
console.log('solve ok:', sol.ok, '· nodeCount:', sol.nodeCount, '· root:', sol.value, 'dist:', sol.dist);

// ── the engine's full self-test battery (the SAME runSelfTest the page chip calls) ──
const st = Adversary.runSelfTest([GAME_sim]);
for (const c of st.checks) ok(c.name, c.pass, c.detail);

// ── the three headline assertions, explicit ──
const V = { WIN: 'WIN', LOSS: 'LOSS', DRAW: 'DRAW' };
const bat = GAME_sim.literatureBattery(Adversary.solve, V);
ok('literature battery ok', bat.ok, bat.detail);

// (1) 0 draw-boards among all 32768 K6 colourings
ok('DoD-1: 0 draw-boards among all 2^15 K6 colourings', bat.counts.k6.total === 32768 && bat.counts.k6.drawFree === 0,
   'K6 total=' + bat.counts.k6.total + ' triangle-free=' + bat.counts.k6.drawFree);

// (2) root LOSS (P2 win) at exact mate-in-15
ok('DoD-2: solve() → root LOSS (P2 win) at exact mate-in-15', sol.ok && sol.value === V.LOSS && sol.dist === 15,
   'value=' + sol.value + ' dist=' + sol.dist);

// (3) K5 neg-control: ≥1 triangle-free colouring
ok('DoD-3: K5 neg-control yields ≥1 triangle-free colouring', bat.counts.k5.total === 1024 && bat.counts.k5.drawFree >= 1,
   'K5 total=' + bat.counts.k5.total + ' triangle-free=' + bat.counts.k5.drawFree);

// ── perfect P2 player sanity: Red(P1) random, Blue(P2)=perfectMove → P2 never loses ──
function playP2Perfect(seed) {
  let s = GAME_sim.initState();
  const rng = Adversary.mulberry32(seed);
  let plies = 0;
  while (true) {
    const t = GAME_sim.terminal(s);
    if (t.over) {
      const sideToMove = plies % 2;                 // 0=Red(P1), 1=Blue(P2)
      return t.value === 'WIN' ? sideToMove : (sideToMove ^ 1);   // winner: 0=P1, 1=P2
    }
    const moves = GAME_sim.legalMoves(s);
    const mv = (plies % 2 === 1) ? GAME_sim.perfectMove(s, sol)   // Blue = P2 perfect
                                 : moves[Math.floor(rng() * moves.length)]; // Red = random
    s = GAME_sim.apply(s, mv);
    plies++;
  }
}
let p2wins = 0, N = 500;
for (let i = 0; i < N; i++) if (playP2Perfect(1000 + i * 7) === 1) p2wins++;
ok('perfect P2 vs random P1: P2 wins all ' + N + ' games', p2wins === N, 'P2 won ' + p2wins + '/' + N);

console.log('\n' + (fails === 0
  ? 'SIM MATH TWIN: ALL PASS (' + st.checks.length + ' engine checks + 4 headline assertions)'
  : 'SIM MATH TWIN: ' + fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
