// The Standing Stones — Node twin. Imports the SAME core.mjs the page inlines and re-runs it byte-true.
// Proves the four EXACT claims of the bench, the multi-source generalization that powers it, and TWO
// byte-parity facts that keep the law single-sourced: (a) the flock-law slab === The Shepherd's slab
// (one authority, no drift), (b) both slabs are inlined byte-identical into index.html (the watched
// flock IS the tested flock). Exit 0 iff every check is green.
//
// run:  node core.test.mjs
import {
  mulberry32, makeFlock, makeHash, step,
  minPairSep, pointInPolygon, allInFold, countInFold, DEFAULTS,
  LEVELS, makeSim, simStep, runToEnd, fingerprint, selfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CONTACT = 2 * DEFAULTS.RADIUS;
const MAX = 2600;
let pass = 0, fail = 0;
const ck = (name, cond, extra = '') => {
  if (cond){ pass++; console.log('  ok  ' + name + (extra ? '  ' + extra : '')); }
  else { fail++; console.log('  XX  ' + name + (extra ? '  ' + extra : '')); }
};

// ---- 1. DETERMINISM — same {placement, seed, level} ⇒ byte-identical trajectory + verdict ----
//   Run to byte-parity (the fingerprint, the won flag, AND the step count all match), twice. And a
//   FAILED run reproduces byte-true (the iterate-on-placement promise): a deliberately bad placement
//   loses, and loses IDENTICALLY twice — you debug a loss, you never re-roll the dice.
{
  const a = runToEnd(LEVELS[2], LEVELS[2].solution, MAX);
  const b = runToEnd(LEVELS[2], LEVELS[2].solution, MAX);
  ck('determinism: same placement+seed+level ⇒ byte-true (fp, won, steps)',
    a.fp === b.fp && a.won === b.won && a.steps === b.steps, `fp=${a.fp} steps=${a.steps}`);

  const bad = [{ x: 50, y: 50 }];
  const f1 = runToEnd(LEVELS[1], bad, MAX), f2 = runToEnd(LEVELS[1], bad, MAX);
  ck('determinism: a FAILED run reproduces byte-true (debug a loss, never re-roll)',
    f1.fp === f2.fp && f1.won === false && f2.won === false, `lost-fp=${f1.fp}`);

  // also: a fingerprint discriminates — a DIFFERENT placement gives a different trajectory.
  const alt = runToEnd(LEVELS[2], [{ x: 246, y: 196 }, { x: 423, y: 128 }, { x: 160, y: 434 }, { x: 380, y: 551 }], MAX);
  ck('determinism: the fingerprint discriminates (a moved stone ⇒ a different run)', alt.fp !== a.fp, `alt-fp=${alt.fp}`);
}

// ---- 2. INVARIANT minPairSep > 0 at EVERY step under MULTI-SOURCE flee ----
//   A full 4-stone L3 run, asserting the hard floor at every single step (not just the final min). The
//   floor is a positional projection — unconditionally stable — so it holds for ANY number of stones.
{
  const sim = makeSim(LEVELS[2], LEVELS[2].solution);
  let worst = Infinity, everZero = false;
  for (let t = 0; t < MAX && !sim.won; t++){
    simStep(sim);
    const ms = minPairSep(sim.flock);
    if (ms < worst) worst = ms;
    if (!(ms > 0)) everZero = true;
  }
  ck('invariant: minPairSep>0 at EVERY step of the 4-stone L3 run', !everZero && worst > 0, `worst=${worst.toFixed(4)} CONTACT=${CONTACT}`);
  ck('invariant: the worst transient stays a strict + fraction of contact (no deep penetration)', worst > CONTACT * 0.4, `worst/CONTACT=${(worst / CONTACT).toFixed(3)}`);
}

// ---- 2b. INVARIANT under an ADVERSARIAL cluster of many stones squeezing the flock ----
//   Five stones boxing the scatter in — far harsher than any level. The floor must STILL never reach 0.
{
  const stones = [{ x: 120, y: 120 }, { x: 360, y: 120 }, { x: 120, y: 360 }, { x: 360, y: 360 }, { x: 240, y: 240 }];
  const rng = mulberry32(2718);
  const fl = makeFlock({ n: 44, rng, x0: 160, y0: 160, x1: 320, y1: 320 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let worst = Infinity, everZero = false;
  for (let t = 0; t < 2200; t++){
    step(fl, H, { stones, bounds: { x0: 0, y0: 0, x1: 600, y1: 600 }, separation: true }, rng);
    const ms = minPairSep(fl);
    if (ms < worst) worst = ms;
    if (!(ms > 0)) everZero = true;
  }
  ck('invariant: 5-stone adversarial squeeze — min sep never reached 0', !everZero && worst > 0, `worst=${worst.toFixed(4)}`);
}

// ---- 3. WIN ≡ allInFold (no false win, no missed win) — exhaustive incl. concave + notch + on-edge ----
{
  const concave = [400, 400, 560, 400, 560, 560, 480, 500, 400, 560];
  ck('win: inside the solid lobe ⇒ inside', pointInPolygon(420, 430, concave) === true);
  ck('win: in the concave NOTCH ⇒ OUTSIDE', pointInPolygon(480, 555, concave) === false);
  ck('win: on a horizontal edge ⇒ inside', pointInPolygon(480, 400, concave) === true);
  ck('win: on a vertical edge ⇒ inside', pointInPolygon(560, 480, concave) === true);
  ck('win: on a vertex ⇒ inside', pointInPolygon(400, 400, concave) === true);
  ck('win: just outside the right wall ⇒ outside', pointInPolygon(561, 480, concave) === false);
  ck('win: just inside the right wall ⇒ inside', pointInPolygon(559, 480, concave) === true);
  ck('win: allInFold TRUE when all inside (no missed win)', allInFold({ n: 3, px: [420, 540, 450], py: [430, 420, 450] }, concave) === true);
  ck('win: allInFold FALSE when one in the notch (no false win)', allInFold({ n: 3, px: [420, 540, 480], py: [430, 420, 555] }, concave) === false);
  // and the LIVE coupling: a winning run's verdict agrees with allInFold on the final flock.
  const sim = makeSim(LEVELS[0], LEVELS[0].solution);
  for (let t = 0; t < MAX && !sim.won; t++) simStep(sim);
  ck('win: the live sim verdict === allInFold on the final flock', sim.won === allInFold(sim.flock, sim.level.fold), `won=${sim.won}`);
}

// ---- 4. NEG-CONTROL — zero stones loses on EVERY gated level (assert on BOTH L2 AND L3) ----
//   Cohesion alone cannot thread a gate; the stones are load-bearing on every gated geometry. This is
//   the STRICT version: a full win/lose verdict per gated level, not a soft "not-all-folded" count.
{
  const z2 = runToEnd(LEVELS[1], [], MAX);
  const z3 = runToEnd(LEVELS[2], [], MAX);
  ck('neg-control: zero stones LOSES on L2 (The Bottleneck)', z2.won === false, `folded=?`);
  ck('neg-control: zero stones LOSES on L3 (The Funnel)', z3.won === false);
  ck('neg-control: stones are load-bearing on BOTH gated levels', z2.won === false && z3.won === false);
}

// ---- 5. EVERY hand-authored level is WINNABLE at its ACTUAL n (no inherited n hardcode) ----
//   Run each level's solution at the level's OWN n and assert the win + report the step count.
{
  for (let i = 0; i < LEVELS.length; i++){
    const L = LEVELS[i];
    const r = runToEnd(L, L.solution, MAX);
    ck(`level L${i + 1} (${L.name}, n=${L.n}, budget ${L.budget}): solution WINS`, r.won === true, `steps=${r.steps} (≤${MAX})`);
    ck(`level L${i + 1}: the solution fits the budget (${L.solution.length} ≤ ${L.budget})`, L.solution.length <= L.budget);
  }
}

// ---- 6. K-STONE DETERMINISM — the multi-source path is itself deterministic (re-run byte-true) ----
{
  const drive = () => {
    const rng = mulberry32(424242);
    const fl = makeFlock({ n: 30, rng, x0: 60, y0: 60, x1: 320, y1: 320 });
    const H = makeHash(DEFAULTS.PERCEPT);
    const stones = [{ x: 100, y: 100 }, { x: 300, y: 120 }, { x: 180, y: 320 }];
    for (let t = 0; t < 450; t++) step(fl, H, { stones, bounds: { x0: 0, y0: 0, x1: 600, y1: 600 }, separation: true }, rng);
    return Array.from(fl.px).concat(Array.from(fl.py), Array.from(fl.fear));
  };
  ck('K-stone determinism: same stones+seed ⇒ byte-true (px, py, fear)', JSON.stringify(drive()) === JSON.stringify(drive()));
}

// ---- 7. selfTest (the in-page pill source) is all-green ----
{
  const r = selfTest();
  for (const c of r.checks) ck('selfTest: ' + c.name, c.ok, c.val != null ? ('(' + c.val + ')') : '');
  ck('selfTest: a failed run reproduces (detReproOK)', r.detReproOK);
  ck('selfTest: every level winnable (allWin)', r.allWin, 'steps=' + r.winSteps.join('/'));
  ck('selfTest overall ok', r.ok);
}

// ---- 8. SINGLE AUTHORITY — the flock-law slab === The Shepherd's slab (one law, no drift) ----
{
  const slab = (src) => {
    const a = src.indexOf('// === CORE BEGIN ===');
    const b = src.indexOf('// === CORE END ===');
    if (a < 0 || b < 0) return null;
    return src.slice(a, b + '// === CORE END ==='.length);
  };
  let ok = false, detail = '';
  try {
    const mine = slab(readFileSync(join(__dir, 'core.mjs'), 'utf8'));
    const shep = slab(readFileSync(join(__dir, '..', 'the-shepherd', 'core.mjs'), 'utf8'));
    if (!mine) detail = 'no CORE sentinels in this core.mjs';
    else if (!shep) detail = 'no CORE sentinels in the-shepherd/core.mjs';
    else { ok = mine === shep; if (!ok) detail = `mine ${mine.length}b vs shepherd ${shep.length}b`; }
  } catch (e) { detail = 'read failed: ' + e.message; }
  ck('single authority: flock-law slab === the-shepherd/core.mjs slab', ok, detail);
}

// ---- 9. BYTE-TWIN — both slabs are inlined byte-identical into index.html ----
{
  const between = (src, b0, b1) => {
    const a = src.indexOf(b0), b = src.indexOf(b1);
    if (a < 0 || b < 0) return null;
    return src.slice(a, b + b1.length);
  };
  let coreOk = false, stonesOk = false, detail = '';
  try {
    const core = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const page = readFileSync(join(__dir, 'index.html'), 'utf8');
    const cCore = between(core, '// === CORE BEGIN ===', '// === CORE END ===');
    const pCore = between(page, '// === CORE BEGIN ===', '// === CORE END ===');
    const cStones = between(core, '// === STONES BEGIN ===', '// === STONES END ===');
    const pStones = between(page, '// === STONES BEGIN ===', '// === STONES END ===');
    coreOk = cCore && pCore && cCore === pCore;
    stonesOk = cStones && pStones && cStones === pStones;
    if (!coreOk) detail += `[core ${cCore ? cCore.length : 'x'} vs ${pCore ? pCore.length : 'x'}] `;
    if (!stonesOk) detail += `[stones ${cStones ? cStones.length : 'x'} vs ${pStones ? pStones.length : 'x'}]`;
  } catch (e) { detail = 'read failed: ' + e.message; }
  ck('byte-twin: index.html CORE slab === core.mjs CORE slab', coreOk, detail);
  ck('byte-twin: index.html STONES slab === core.mjs STONES slab', stonesOk, detail);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
