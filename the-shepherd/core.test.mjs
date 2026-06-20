// The Shepherd — Node twin. Imports the SAME core.mjs the page inlines and re-runs it byte-true.
// Asserts the two decidable claims + the grafted couplings (dog spring, one-way valve, fences) +
// the estate-standard inline byte-parity check. Exit 0 iff every check is green.
//
// run:  node core.test.mjs
import {
  mulberry32, makeFlock, makeHash, step, stepDog,
  minPairSep, pointInPolygon, allInFold, countInFold,
  runSelfTest, DEFAULTS,
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

function centroid(fl){ let x = 0, y = 0; for (let i = 0; i < fl.n; i++){ x += fl.px[i]; y += fl.py[i]; } return { x: x / fl.n, y: y / fl.n }; }
function spread(fl){ const c = centroid(fl); let s = 0; for (let i = 0; i < fl.n; i++){ s += Math.hypot(fl.px[i] - c.x, fl.py[i] - c.y); } return s / fl.n; }

// ---- 1. HARD FLOOR over a long fixed-seed run with the shepherd PRESSING the flock ----
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  const rng = mulberry32(777);
  const fl = makeFlock({ n: 50, rng, x0: 30, y0: 30, x1: 340, y1: 340 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let worst = Infinity, everZero = false;
  for (let t = 0; t < 3000; t++){
    const c = centroid(fl);
    const shep = { x: c.x + Math.cos(t * 0.05) * 8, y: c.y + Math.sin(t * 0.05) * 8 }; // sit on them
    step(fl, H, { shepherd: shep, bounds, separation: true }, rng);
    const ms = minPairSep(fl);
    if (ms < worst) worst = ms;
    if (!(ms > 0)) everZero = true;
  }
  // CLAIM 1 (the guarantee): min sep NEVER reaches 0 — even under an adversarial shepherd glued to
  // the flock centroid (a player can't do this; the flee force forbids it). The HONEST bound is
  // floor>0; the worst transient stays a strict + fraction of CONTACT, not "always exactly contact".
  ck('CLAIM 1: min sep never reached 0 over 3000 steps (adversarial shepherd)', !everZero && worst > 0, `worst=${worst.toFixed(4)} CONTACT=${CONTACT}`);
  ck('worst transient stayed a strict + fraction of contact (no deep penetration)', worst > CONTACT * 0.4, `worst/CONTACT=${(worst / CONTACT).toFixed(3)}`);
}

// ---- 1b. STEADY-STATE: with a realistic gameplay shepherd (kept at a distance) the min sep
//          settles AT contact (the flock packs without overlap; the floor is tight, not loose). ----
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  const rng = mulberry32(321);
  const fl = makeFlock({ n: 45, rng, x0: 60, y0: 60, x1: 320, y1: 320 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let worst = Infinity;
  for (let t = 0; t < 1500; t++){
    const shep = t < 300 ? null : { x: 300 + Math.cos(t * 0.01) * 200, y: 300 + Math.sin(t * 0.01) * 200 };
    step(fl, H, { shepherd: shep, bounds, separation: true }, rng);
    if (t > 400){ const ms = minPairSep(fl); if (ms < worst) worst = ms; }
  }
  ck('steady-state min sep stays a healthy fraction of contact (realistic play)', worst > CONTACT * 0.45, `worst=${worst.toFixed(3)} CONTACT=${CONTACT}`);
}

// ---- 1c. (NEW) FLOOR HOLDS with flee ON inside FENCED / GAP geometry (facet-1 risk #5) ----
//   A bisecting fence with a narrow gate gap; the shepherd presses the flock toward+through it.
//   The hard floor must hold regardless of the wall projection (it runs after the floor).
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  // a vertical fence at x≈300 with a gap from y=250..350 (two rects above & below)
  const fences = [{ x0: 292, y0: 0, x1: 308, y1: 250 }, { x0: 292, y0: 350, x1: 308, y1: 600 }];
  const fold = [380, 200, 560, 200, 560, 400, 380, 400];
  const rng = mulberry32(4242);
  const fl = makeFlock({ n: 40, rng, x0: 40, y0: 220, x1: 250, y1: 380 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let worst = Infinity, everZero = false;
  for (let t = 0; t < 2000; t++){
    const c = centroid(fl);
    // push them rightward toward the gap, hugging the gap centre line
    const shep = { x: c.x - 60 + Math.cos(t * 0.04) * 10, y: 300 + Math.sin(t * 0.04) * 30 };
    step(fl, H, { shepherd: shep, bounds, fences, fold, separation: true }, rng);
    const ms = minPairSep(fl);
    if (ms < worst) worst = ms;
    if (!(ms > 0)) everZero = true;
  }
  ck('CLAIM 1 (fenced+gap, flee ON): min sep never reached 0', !everZero && worst > 0, `worst=${worst.toFixed(4)}`);
}

// ---- 1d. (NEW) FLOOR HOLDS pinned into a FENCE CORNER (the projection wins everywhere) ----
//   Drive the flock hard into the inside corner of an L of two fence rects + the world wall; the
//   sheep are crushed against three converging constraints — the floor must still never reach 0.
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  // an L-corner: a vertical wall and a horizontal wall meeting near (200,200)
  const fences = [{ x0: 190, y0: 60, x1: 206, y1: 210 }, { x0: 60, y0: 194, x1: 210, y1: 210 }];
  const rng = mulberry32(909);
  const fl = makeFlock({ n: 36, rng, x0: 70, y0: 70, x1: 180, y1: 180 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let worst = Infinity, everZero = false;
  for (let t = 0; t < 1800; t++){
    // shepherd parked to the lower-right of the corner → presses sheep INTO the corner
    const shep = { x: 250 + Math.cos(t * 0.03) * 6, y: 250 + Math.sin(t * 0.03) * 6 };
    step(fl, H, { shepherd: shep, bounds, fences, separation: true }, rng);
    const ms = minPairSep(fl);
    if (ms < worst) worst = ms;
    if (!(ms > 0)) everZero = true;
  }
  ck('CLAIM 1 (pinned into a fence corner): min sep never reached 0', !everZero && worst > 0, `worst=${worst.toFixed(4)}`);
}

// ---- 2. NEG-CONTROL collapses ----
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  const rng = mulberry32(777);
  const fl = makeFlock({ n: 50, rng, x0: 30, y0: 30, x1: 340, y1: 340 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let best = Infinity;
  for (let t = 0; t < 600; t++){
    step(fl, H, { shepherd: { x: 500, y: 500 }, bounds, separation: false }, rng);
    const ms = minPairSep(fl);
    if (ms < best) best = ms;
  }
  ck('NEG-CONTROL: separation OFF collapses flock toward a point', best < CONTACT * 0.25, `best=${best.toFixed(4)}`);
}

// ---- 3. DETERMINISM (flock) ----
{
  const run = (seed) => {
    const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
    const rng = mulberry32(seed);
    const fl = makeFlock({ n: 40, rng, x0: 30, y0: 30, x1: 340, y1: 340 });
    const H = makeHash(DEFAULTS.PERCEPT);
    for (let t = 0; t < 500; t++){
      const shep = { x: 200 + Math.cos(t * 0.02) * 150, y: 200 + Math.sin(t * 0.02) * 150 };
      step(fl, H, { shepherd: shep, bounds, separation: true }, rng);
    }
    return Array.from(fl.px).concat(Array.from(fl.py));
  };
  const a = run(2024), b = run(2024), c = run(2025);
  ck('same seed -> bit-identical final positions', JSON.stringify(a) === JSON.stringify(b));
  ck('different seed -> different run', JSON.stringify(a) !== JSON.stringify(c));
}

// ---- 3b. (NEW) the per-step DOG spring is deterministic same-target-stream (facet-1) ----
{
  const driveDog = () => {
    const dog = { x: 300, y: 300, vx: 0, vy: 0 };
    const trail = [];
    for (let t = 0; t < 600; t++){
      const tgt = { x: 300 + Math.cos(t * 0.03) * 220, y: 300 + Math.sin(t * 0.017) * 200 };
      stepDog(dog, tgt);
      trail.push(dog.x, dog.y);
    }
    return trail;
  };
  const a = driveDog(), b = driveDog();
  ck('dog spring: same target stream -> bit-identical path', JSON.stringify(a) === JSON.stringify(b));
  // it has WEIGHT (lags the cursor) and a TOP SPEED (bounded per-step displacement)
  {
    const dog = { x: 0, y: 0, vx: 0, vy: 0 };
    let maxDisp = 0; let lagged = false;
    let prevX = dog.x, prevY = dog.y;
    const tgt = { x: 590, y: 10 }; // a far cursor: the dog must not teleport
    for (let t = 0; t < 200; t++){
      stepDog(dog, tgt);
      const disp = Math.hypot(dog.x - prevX, dog.y - prevY);
      if (disp > maxDisp) maxDisp = disp;
      prevX = dog.x; prevY = dog.y;
      if (t === 0 && Math.hypot(dog.x - tgt.x, dog.y - tgt.y) > 50) lagged = true; // didn't snap
    }
    ck('dog spring: top speed bounded by DOG_MAX (never teleports)', maxDisp <= DEFAULTS.DOG_MAX + 1e-9, `maxDisp=${maxDisp.toFixed(3)} DOG_MAX=${DEFAULTS.DOG_MAX}`);
    ck('dog spring: lags the cursor on step 1 (has weight)', lagged);
    // critically damped: it ARRIVES (settles near the target) without sustained oscillation
    ck('dog spring: arrives at the target (settles, no overshoot blow-up)', Math.hypot(dog.x - tgt.x, dog.y - tgt.y) < 1, `residual=${Math.hypot(dog.x - tgt.x, dog.y - tgt.y).toFixed(4)}`);
  }
}

// ---- 4. WIN PREDICATE exactness (concave + on-edge) ----
{
  const concave = [400, 400, 560, 400, 560, 560, 480, 500, 400, 560];
  ck('inside solid lobe -> inside', pointInPolygon(420, 430, concave) === true);
  ck('in the concave notch -> OUTSIDE', pointInPolygon(480, 555, concave) === false);
  ck('on a horizontal edge -> inside', pointInPolygon(480, 400, concave) === true);
  ck('on a vertical edge -> inside', pointInPolygon(560, 480, concave) === true);
  ck('on a vertex -> inside', pointInPolygon(400, 400, concave) === true);
  ck('just outside right wall -> outside', pointInPolygon(561, 480, concave) === false);
  ck('just inside right wall -> inside', pointInPolygon(559, 480, concave) === true);
  const inFlock = { n: 3, px: [420, 540, 450], py: [430, 420, 450] };
  const outFlock = { n: 3, px: [420, 540, 480], py: [430, 420, 555] };
  ck('allInFold true when all inside (no missed win)', allInFold(inFlock, concave) === true);
  ck('allInFold false when one in the notch (no false win)', allInFold(outFlock, concave) === false);
}

// ---- 4b. (NEW) THE ONE-WAY VALVE: a folded sheep stays counted (facet-1 risk #6) ----
//   Place a flock entirely inside the fold, then PRESS them with a shepherd parked inside the fold
//   trying to drive them OUT through the rim. countInFold must stay === N (the valve holds), and the
//   WIN latch, once true, must remain true for the rest of the run.
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  const fold = [380, 380, 560, 380, 560, 560, 380, 560];
  const rng = mulberry32(55);
  // seed a small flock comfortably inside the fold
  const fl = makeFlock({ n: 12, rng, x0: 410, y0: 410, x1: 530, y1: 530 });
  const H = makeHash(DEFAULTS.PERCEPT);
  // let it settle inside, confirming all-in to begin
  for (let t = 0; t < 60; t++) step(fl, H, { bounds, fold, separation: true }, rng);
  const startAllIn = countInFold(fl, fold) === fl.n;
  let stayedAllIn = true, latchHeld = true, latched = false;
  for (let t = 0; t < 1500; t++){
    // a shepherd parked at the fold centre, trying to scatter them out through the rim
    const shep = { x: 470 + Math.cos(t * 0.06) * 8, y: 470 + Math.sin(t * 0.06) * 8 };
    step(fl, H, { shepherd: shep, bounds, fold, separation: true }, rng);
    const c = countInFold(fl, fold);
    if (c !== fl.n) stayedAllIn = false;
    // model the page's decidable latch: latch once allInFold, then it must never drop
    if (allInFold(fl, fold)) latched = true;
    else if (latched) latchHeld = false;
  }
  ck('one-way valve: flock started all-inside the fold', startAllIn);
  ck('one-way valve: a folded sheep stays counted under an inside shepherd (countInFold === N)', stayedAllIn);
  ck('one-way valve: the WIN latch, once true, never drops (monotone)', latched && latchHeld);
}

// ---- 4c. (NEW) OVERTIME EDGE: the last-sheep grace window produces no FALSE latch ----
//   A flock with one stray OUTSIDE the fold: allInFold must be false for the whole window — the
//   grace timer can never manufacture a win the predicate doesn't agree with.
{
  const fold = [380, 380, 560, 380, 560, 560, 380, 560];
  // 11 inside, 1 stray just outside the left rim
  const fl = { n: 12, px: [], py: [] };
  for (let i = 0; i < 11; i++){ fl.px.push(420 + (i % 4) * 20); fl.py.push(420 + ((i / 4) | 0) * 20); }
  fl.px.push(370); fl.py.push(470); // the stray, 10px outside the left wall
  let falseWin = false;
  for (let t = 0; t < 200; t++){ // simulate a long grace window of polls
    if (allInFold(fl, fold)) falseWin = true;
  }
  ck('overtime edge: a stray outside the rim never yields a false win', !falseWin && countInFold(fl, fold) === 11);
}

// ---- 5. runSelfTest (the in-page pill source) ----
{
  const r = runSelfTest({});
  for (const c of r.checks) ck('selfTest: ' + c.name, c.ok, c.detail != null ? ('(' + (typeof c.detail === 'number' ? c.detail.toFixed(3) : c.detail) + ')') : '');
  ck('runSelfTest overall ok', r.ok);
}

// ---- 6. ALIVENESS ----
{
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  const rng = mulberry32(99);
  const fl = makeFlock({ n: 40, rng, x0: 60, y0: 60, x1: 300, y1: 300 });
  const H = makeHash(DEFAULTS.PERCEPT);
  let spreadMin = Infinity, spreadMax = 0, totalMove = 0;
  const prev = { x: [...fl.px], y: [...fl.py] };
  for (let t = 0; t < 1200; t++){
    const shep = { x: 300 + Math.cos(t * 0.018) * 180, y: 300 + Math.sin(t * 0.018) * 180 };
    step(fl, H, { shepherd: shep, bounds, separation: true }, rng);
    if (t % 30 === 0){ const s = spread(fl); spreadMin = Math.min(spreadMin, s); spreadMax = Math.max(spreadMax, s); }
    for (let i = 0; i < fl.n; i++){ totalMove += Math.hypot(fl.px[i] - prev.x[i], fl.py[i] - prev.y[i]); prev.x[i] = fl.px[i]; prev.y[i] = fl.py[i]; }
  }
  const avg = totalMove / (fl.n * 1200);
  ck('flock stays cohesive (does not scatter to walls)', spreadMax < 280, `spreadMax=${spreadMax.toFixed(0)}`);
  ck('flock not a frozen blob (spread varies)', (spreadMax - spreadMin) > 15, `range=${(spreadMax - spreadMin).toFixed(0)} min=${spreadMin.toFixed(0)} max=${spreadMax.toFixed(0)}`);
  ck('flock is alive (meaningful move/step)', avg > 0.12 && avg < DEFAULTS.MAX_SPEED, `avg=${avg.toFixed(3)}`);
}

// ---- 7. (NEW) BYTE-PARITY: the core inlined into index.html is byte-identical to core.mjs ----
//   The estate's standard inline-parity check (kin to The Wrinkling). The watched flock IS the
//   tested flock: the region between the CORE BEGIN / CORE END sentinels in index.html must equal
//   the same region in core.mjs, byte-for-byte.
{
  const slab = (src) => {
    const a = src.indexOf('// === CORE BEGIN ===');
    const b = src.indexOf('// === CORE END ===');
    if (a < 0 || b < 0) return null;
    return src.slice(a, b + '// === CORE END ==='.length);
  };
  let parityOk = false, detail = '';
  try {
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8');
    const cSlab = slab(coreSrc), pSlab = slab(pageSrc);
    if (!cSlab) detail = 'no sentinels in core.mjs';
    else if (!pSlab) detail = 'no sentinels in index.html';
    else { parityOk = cSlab === pSlab; if (!parityOk) detail = `core ${cSlab.length}b vs page ${pSlab.length}b`; }
  } catch (e) { detail = 'read failed: ' + e.message; }
  ck('inline byte-parity: index.html core slab === core.mjs core slab', parityOk, detail);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
