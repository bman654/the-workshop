// The Sluice-Gate — Node twin. Imports the SAME core.mjs the page inlines and re-runs it byte-true.
// Proves the room's THREE claims — (1) minPairSep>0 under gate MOTION, (2) WIN≡allInFold on a concave
// cove replayed byte-identical, (3) the gates-frozen-open neg-control — plus TWO byte-parity facts that
// keep the flock law single-sourced: (a) this file's law slab === The Standing Stones' slab (== The
// Shepherd's — one authority, no drift), (b) both slabs are inlined byte-identical into index.html (the
// watched flock IS the tested flock). Exit 0 iff every check is green.
//
// run:  node core.test.mjs
import {
  mulberry32, makeFlock, makeHash, step, minPairSep, pointInPolygon, allInFold, countInFold, DEFAULTS,
  LEVELS, PADDLE_CAP, paddleRect, COVE_C, COVE_L,
  makeSluice, sluiceStep, cannedY, frozenY, driveToEnd, fingerprint, adversarialMinSep, selfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CONTACT = 2 * DEFAULTS.RADIUS;
let pass = 0, fail = 0;
const ck = (name, cond, extra = '') => {
  if (cond){ pass++; console.log('  ok  ' + name + (extra ? '  ' + extra : '')); }
  else { fail++; console.log('  XX  ' + name + (extra ? '  ' + extra : '')); }
};

// ---- 1. DETERMINISM — same seed + same paddle schedule ⇒ byte-identical trajectory + verdict ----
{
  const drv = (L) => (t) => cannedY(L, t);
  const a = driveToEnd(LEVELS[1], drv(LEVELS[1]), LEVELS[1].maxSteps);
  const b = driveToEnd(LEVELS[1], drv(LEVELS[1]), LEVELS[1].maxSteps);
  ck('determinism: same seed+schedule ⇒ byte-true (fp, won, steps)',
    a.fp === b.fp && a.won === b.won && a.steps === b.steps, `fp=${a.fp} steps=${a.steps}`);

  // a FAILED run (funnel frozen open) reproduces byte-true — you debug a run, you never re-roll the dice.
  const F = LEVELS[2];
  const f1 = driveToEnd(F, (t) => frozenY(F, 'open'), F.maxSteps, frozenY(F, 'open'));
  const f2 = driveToEnd(F, (t) => frozenY(F, 'open'), F.maxSteps, frozenY(F, 'open'));
  ck('determinism: a FAILED (frozen) run reproduces byte-true', f1.fp === f2.fp && f1.won === false, `lost-fp=${f1.fp}`);

  // the fingerprint discriminates — a DIFFERENT schedule gives a different trajectory.
  const alt = driveToEnd(LEVELS[1], (t) => frozenY(LEVELS[1], 'top'), LEVELS[1].maxSteps);
  ck('determinism: the fingerprint discriminates (a different schedule ⇒ a different run)', alt.fp !== a.fp, `alt-fp=${alt.fp}`);
}

// ---- 2. CLAIM 1 — minPairSep > 0 at EVERY step under gate MOTION (the strengthening of the static case) ----
//   Every level's canned run, asserting the floor never reaches 0, plus the worst transient stays a strict
//   positive fraction of contact under a normal sweep.
{
  let worst = Infinity, everZero = false;
  for (const L of LEVELS){
    const sim = makeSluice(L);
    for (let t = 0; t < L.maxSteps && !sim.won; t++){
      sluiceStep(sim, cannedY(L, t));
      const ms = minPairSep(sim.flock);
      if (ms < worst) worst = ms;
      if (!(ms > 0)) everZero = true;
    }
  }
  ck('CLAIM 1: minPairSep>0 at every step of every level (gate motion)', !everZero && worst > 0, `worst=${worst.toFixed(3)}`);
  ck('CLAIM 1: the worst transient stays a strict + fraction of contact on a normal sweep', worst > CONTACT * 0.35, `worst/CONTACT=${(worst / CONTACT).toFixed(3)}`);
}

// ---- 2b. CLAIM 1 ADVERSARIAL — slam a paddle at the capped max speed straight into a dense pack, and a
//     sustained oscillating press. The hard floor must STILL never reach 0 (it is a positional projection,
//     agnostic to WHY a sheep moved — a moving fence is "just another reason"). ----
{
  const slam = adversarialMinSep(37, (t) => (t < 5 ? 90 : 260), 900);
  const osc = adversarialMinSep(37, (t) => 170 + 80 * Math.sin(t * 0.15), 900);
  const slam2 = adversarialMinSep(2718, (t) => (t < 5 ? 90 : 260), 900);
  ck('CLAIM 1 adversarial: straight slam into a dense pack — floor never 0', !slam.everZero && slam.worst > 0, `worst=${slam.worst.toFixed(3)}`);
  ck('CLAIM 1 adversarial: sustained oscillating press — floor never 0', !osc.everZero && osc.worst > 0, `worst=${osc.worst.toFixed(3)}`);
  ck('CLAIM 1 adversarial: a second seed under a slam — floor never 0', !slam2.everZero && slam2.worst > 0, `worst=${slam2.worst.toFixed(3)}`);
  // the cap is genuinely < a body width (no tunnelling is even geometrically possible per step).
  ck('CLAIM 1: PADDLE_CAP < CONTACT (a fence edge cannot leap a body-width per step)', PADDLE_CAP < CONTACT, `cap=${PADDLE_CAP} contact=${CONTACT}`);
}

// ---- 3. CLAIM 2 — WIN ≡ allInFold on the CONCAVE cove (no false win, no missed win, on-edge, notch) ----
{
  ck('CLAIM 2: inside a solid lobe ⇒ inside', pointInPolygon(200, 520, COVE_C) === true);
  ck('CLAIM 2: on the right wall ⇒ inside (on-edge is in)', pointInPolygon(490, 520, COVE_C) === true);
  ck('CLAIM 2: above the cove rim ⇒ outside', pointInPolygon(300, 460, COVE_C) === false);
  ck('CLAIM 2: past the offset baffle, right of COVE_L ⇒ outside', pointInPolygon(300, 520, COVE_L) === false);
  ck('CLAIM 2: inside COVE_L’s solid lobe ⇒ inside', pointInPolygon(120, 520, COVE_L) === true);
  ck('CLAIM 2: allInFold TRUE when all inside (no missed win)', allInFold({ n: 2, px: [200, 400], py: [520, 520] }, COVE_C) === true);
  ck('CLAIM 2: allInFold FALSE when one is out (no false win)', allInFold({ n: 2, px: [200, 300], py: [520, 460] }, COVE_C) === false);
  // the live coupling: a winning run's latch === allInFold on the final flock, replayed byte-identical.
  const sim = makeSluice(LEVELS[1]);
  for (let t = 0; t < LEVELS[1].maxSteps && !sim.won; t++) sluiceStep(sim, cannedY(LEVELS[1], t));
  ck('CLAIM 2: the live win latch === allInFold on the final flock', sim.won === allInFold(sim.flock, LEVELS[1].cove), `won=${sim.won}`);
}

// ---- 4. CLAIM 3 — NEG-CONTROL: the funnel with gates FROZEN OPEN never folds all N; the sweep DOES ----
{
  const F = LEVELS[2];
  const open = driveToEnd(F, (t) => frozenY(F, 'open'), F.maxSteps, frozenY(F, 'open'));
  const top = driveToEnd(F, (t) => frozenY(F, 'top'), F.maxSteps);
  const swept = driveToEnd(F, (t) => cannedY(F, t), F.maxSteps);
  // count how many the frozen runs manage to fold (a compelling neg-control leaves many out).
  const foldedOpen = countFolded(F, frozenY(F, 'open'), frozenY(F, 'open'));
  const foldedTop = countFolded(F, frozenY(F, 'top'));
  ck('CLAIM 3: funnel gates FROZEN OPEN never reach allInFold', open.won === false, `folded=${foldedOpen}/${F.n}`);
  ck('CLAIM 3: funnel gates FROZEN AT REST never reach allInFold', top.won === false, `folded=${foldedTop}/${F.n}`);
  ck('CLAIM 3: the SAME seed with the timed sweep WINS (motion load-bearing)', swept.won === true, `steps=${swept.steps}`);
}
function countFolded(L, ys, initialY){
  const sim = makeSluice(L, initialY);
  for (let t = 0; t < L.maxSteps && !sim.won; t++) sluiceStep(sim, (Array.isArray(ys) ? ys : ys(t)));
  return countInFold(sim.flock, L.cove);
}

// ---- 5. EVERY level is WINNABLE at its ACTUAL n via its canned schedule ----
{
  for (let i = 0; i < LEVELS.length; i++){
    const L = LEVELS[i];
    const r = driveToEnd(L, (t) => cannedY(L, t), L.maxSteps);
    ck(`level L${i + 1} (${L.name}, n=${L.n}): canned sweep WINS`, r.won === true, `steps=${r.steps} (≤${L.maxSteps})`);
  }
}

// ---- 6. selfTest() (the in-page pill source) is all-green ----
{
  const r = selfTest();
  for (const c of r.checks) ck('selfTest: ' + c.name, c.ok, c.val != null ? ('(' + c.val + ')') : '');
  ck('selfTest: every level winnable', r.allWin, 'steps=' + r.winSteps.join('/'));
  ck('selfTest overall ok', r.ok);
}

// ---- 7. SINGLE AUTHORITY — the flock-law slab === The Standing Stones' slab (== The Shepherd's) ----
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
    const stones = slab(readFileSync(join(__dir, '..', 'core.mjs'), 'utf8'));
    if (!mine) detail = 'no CORE sentinels in this core.mjs';
    else if (!stones) detail = 'no CORE sentinels in the-standing-stones/core.mjs';
    else { ok = mine === stones; if (!ok) detail = `mine ${mine.length}b vs stones ${stones.length}b`; }
  } catch (e) { detail = 'read failed: ' + e.message; }
  ck('single authority: flock-law slab === the-standing-stones/core.mjs slab', ok, detail);
}

// ---- 8. BYTE-TWIN — both slabs are inlined byte-identical into index.html ----
{
  const between = (src, b0, b1) => {
    const a = src.indexOf(b0), b = src.indexOf(b1);
    if (a < 0 || b < 0) return null;
    return src.slice(a, b + b1.length);
  };
  let coreOk = false, roomOk = false, detail = '';
  try {
    const core = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const page = readFileSync(join(__dir, 'index.html'), 'utf8');
    const cCore = between(core, '// === CORE BEGIN ===', '// === CORE END ===');
    const pCore = between(page, '// === CORE BEGIN ===', '// === CORE END ===');
    const cRoom = between(core, '// === SLUICE BEGIN ===', '// === SLUICE END ===');
    const pRoom = between(page, '// === SLUICE BEGIN ===', '// === SLUICE END ===');
    coreOk = cCore && pCore && cCore === pCore;
    roomOk = cRoom && pRoom && cRoom === pRoom;
    if (!coreOk) detail += `[core ${cCore ? cCore.length : 'x'} vs ${pCore ? pCore.length : 'x'}] `;
    if (!roomOk) detail += `[sluice ${cRoom ? cRoom.length : 'x'} vs ${pRoom ? pRoom.length : 'x'}]`;
  } catch (e) { detail = 'read failed: ' + e.message; }
  ck('byte-twin: index.html CORE slab === core.mjs CORE slab', coreOk, detail);
  ck('byte-twin: index.html SLUICE slab === core.mjs SLUICE slab', roomOk, detail);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
