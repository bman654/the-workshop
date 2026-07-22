// ============================================================================
//  THE HOUR-GLASS — the PAYOFF-LIVENESS twin (Node side).
//
//  This piece makes NO math claim and carries NO neg-control theorem. What it
//  owes is proof that the EXPERIENCE FIRES: that every span TICKS, that the
//  tiling is exactly ten child-cycles per parent frame, that the gazed span is
//  always watchable, that the fast pole is honest (the persistence glow falls
//  with e, is pinned to 1−1/e at the fusion period, and the animate→steady seam
//  is continuous), and that reduced motion is a real second design.
//
//  It runs the SAME runTimeTest() the in-page ?selftest chip runs (driving the
//  REAL detent entry function — never a synthetic canvas pointer event, which
//  headless cannot deliver), plus Node-only assertions, plus a byte-parity check
//  that the slab forge-inlined into hour-glass/index.html IS the shared core.
//
//  Run:  node ten-fold/hour-glass/hour-glass.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  TIME, TIME_LADDER, TIME_LEGEND, makeAxis,
  spanRate, spanHz, glowOf, spanIsFast, stepPhase, TAU_P, BASE_PERIOD,
  runTimeTest, SPACE,
} from '../glass.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Hour-Glass — hour-glass.test.mjs (liveness, not a theorem)\n');

// ── 1. the shared in-page liveness test ──────────────────────────────────────
console.log('— the shared runTimeTest() (identical to the in-page ?selftest chip) —');
{
  const st = runTimeTest(TIME);
  for (const l of st.lines) ok(l.name, l.ok, l.detail);
  ok('every in-page liveness check is green', st.ok, `${st.passed}/${st.total}`);
}

// ── 2. THE SECONDS LADDER ─────────────────────────────────────────────────────
console.log('\n— the seconds ladder —');
{
  ok('the ladder carries at least 20 drawn spans', TIME_LADDER.length >= 20, `${TIME_LADDER.length} spans`);
  ok('the spans are strictly ascending in decade',
     TIME_LADDER.every((p, i) => i === 0 || p.e > TIME_LADDER[i - 1].e), `10^${TIME.E_MIN} … 10^${TIME.E_MAX} s`);
  ok('at least 30 decades of duration, femtoseconds to deep time',
     TIME.E_MAX - TIME.E_MIN >= 30, `${TIME.E_MAX - TIME.E_MIN} decades`);
  ok('the anchor (a heartbeat) sits at exactly one second',
     TIME_LADDER.some(s => s.e === 0 && s.key === 'heart'));
  ok('every span key is unique', new Set(TIME_LADDER.map(p => p.key)).size === TIME_LADDER.length);
  ok('EVERY detent carries a legend, scene or no scene',
     Array.from({ length: TIME.E_MAX - TIME.E_MIN + 1 }, (_, i) => TIME.E_MIN + i)
          .every(e => typeof TIME_LEGEND[String(e)] === 'string' && TIME_LEGEND[String(e)].length > 0),
     `${TIME.E_MAX - TIME.E_MIN + 1} detents, ${TIME_LADDER.length} of them drawn`);
  const gapless = [];
  for (let e = TIME.E_MIN; e <= TIME.E_MAX; e++) if (!TIME_LADDER.some(p => p.e === e)) gapless.push(e);
  ok('the empty stretches are LEFT empty (a legend, never a fabricated beat)',
     gapless.length === (TIME.E_MAX - TIME.E_MIN + 1) - TIME_LADDER.length,
     `${gapless.length} legend-only detents — e.g. 10^${gapless[0]}s: "${TIME_LEGEND[String(gapless[0])]}"`);
}

// ── 3. THE ONE LAW — spanRate(e,d) = 10^(d−e), reciprocal of the Glass ───────
console.log('\n— the one law: spanRate = reciprocal of the spatial scale —');
{
  // renderPlan hands back k = 10^(e−d) as the size ratio; the temporal rate is 1/k.
  let worst = 0, n = 0;
  const steps = Math.round((TIME.T_MAX - TIME.T_MIN) * 10);
  for (let t = 0; t <= steps; t++) {
    const d = TIME.T_MIN + t * 0.1;
    for (const q of TIME.renderPlan(d, 720)) {
      const k = q.size / 720;                    // spatial scale of this span in-frame
      worst = Math.max(worst, Math.abs(q.rate - 1 / k));
      n++;
    }
  }
  ok('a span\'s temporal rate is EXACTLY the reciprocal of its spatial scale (1/k)',
     worst < 1e-9, `max |rate − 1/k| = ${worst.toExponential(2)} over ${n} drawn spans`);
  ok('the gazed span (e=d) is fixed at rate 1 — the honest, watchable centre',
     [-15, -3, 0, 5, 12, 18].every(d => Math.abs(spanRate(d, d) - 1) < 1e-12));
  ok('one decade deeper runs EXACTLY ten times faster',
     [0, 3, 7, 11].every(d => Math.abs(spanRate(d - 1, d) / spanRate(d, d) - 10) < 1e-12));
}

// ── 4. THE FAST POLE — persistence physics, the honest cinema-literal fuse ───
console.log('\n— the fast pole (persistence-of-vision glow) —');
{
  const d = 0;
  ok('the glow is white-hot at the fast decades and dark at the gaze',
     glowOf(d - 6, d) > 0.999 && glowOf(d, d) < 0.02,
     `glow(fast −6) = ${glowOf(d - 6, d).toFixed(4)}, glow(gaze) = ${glowOf(d, d).toFixed(4)}`);
  ok('the glow falls monotonically as e rises (slower ⇒ dimmer)',
     (() => { let prev = Infinity; for (let e = TIME.E_MIN; e <= TIME.E_MAX; e++) {
       const g = glowOf(e, d); if (g > prev + 1e-15) return false; prev = g; } return true; })());
  const eFuse = d - Math.log10(BASE_PERIOD / TAU_P);
  ok('at the flicker-fusion period the glow is pinned to 1−1/e',
     Math.abs(glowOf(eFuse, d) - (1 - 1 / Math.E)) < 1e-9,
     `glow(fusion) = ${glowOf(eFuse, d).toFixed(9)}`);
  // the ONE split point: a span whose period < a frame returns the closed form.
  ok('a femtosecond span at human gaze is FAST (steady glow, never looped a frame)',
     spanIsFast(-15, 0, 1 / 60) === true && spanIsFast(0, 0, 1 / 60) === false);
  ok('the animate→steady seam is continuous (no brightness pop at T=dt)',
     (() => { const eSeam = d - Math.log10(BASE_PERIOD / (1 / 60));
       return Math.abs(glowOf(eSeam - 1e-6, d) - glowOf(eSeam + 1e-6, d)) < 1e-4; })());
}

// ── 5. THE TICKING, driven for real ──────────────────────────────────────────
console.log('\n— the ticking (the phase accumulator, frame by frame) —');
{
  // over M frames at a fixed gaze, the gazed span advances and wraps exactly once
  // per BASE_PERIOD; none of the non-fast spans freeze.
  // run a hair past BASE_PERIOD (float slack: 144×(1/144) lands a whisker under 1).
  const d = 0, DT = 1 / 60, frames = Math.round(BASE_PERIOD / DT) + 2;
  let ph = 0, wraps = 0, prev = 0;
  for (let f = 0; f < frames; f++) { ph = stepPhase(ph, 0, d, DT, false); if (ph < prev) wraps++; prev = ph; }
  ok('the gazed span completes exactly one loop per BASE_PERIOD',
     wraps === 1, `${wraps} wrap in ${frames} frames (BASE_PERIOD ≈ ${BASE_PERIOD}s)`);
  // a child one decade deeper wraps ~ten times as often — the tiling, in time.
  let ph2 = 0, wraps2 = 0, prev2 = 0;
  for (let f = 0; f < frames; f++) { ph2 = stepPhase(ph2, -1, d, DT, false); if (ph2 < prev2) wraps2++; prev2 = ph2; }
  ok('a child one decade deeper wraps ~ten times per parent loop (the flicker cascade)',
     wraps2 >= 9 && wraps2 <= 11, `${wraps2} child wraps to the parent's ${wraps}`);
  // reduced motion never advances a phase.
  let held = true, p3 = 0.37;
  for (let f = 0; f < 300; f++) { const q = stepPhase(p3, 0, d, DT, true); if (q !== p3) held = false; p3 = q; }
  ok('reduced motion holds every phase — nothing free-runs', held);
}

// ── 6. THE READING — a duration, exact over a down-and-back ──────────────────
console.log('\n— the reading (the exact duration, no drift) —');
{
  ok('on a detent the reading is a whole power of ten',
     TIME.readingAt(0).exp === '0' && TIME.readingAt(-15).exp === '-15' && TIME.readingAt(18).exp === '18');
  ok('off a detent the reading carries its true decimals',
     TIME.readingAt(5.47).exp === '5.47' && TIME.readingAt(-4.5).exp === '−4.50');
  ok('a legend-only detent says so, and names itself',
     TIME.readingAt(4).hasSpan === false && TIME.readingAt(4).title === 'a working morning');
  ok('a scene detent names the scene', TIME.readingAt(5).hasSpan === true && TIME.readingAt(5).title === 'a day and a night');
  // the readout is EXACT over N presses down-and-back (no drift).
  let d = TIME.E_MAX;
  for (let i = 0; i < 40 && d > TIME.E_MIN; i++) d = TIME.stepDetent(d, -1);
  const bottom = d;
  for (let i = 0; i < 40 && d < TIME.E_MAX; i++) d = TIME.stepDetent(d, +1);
  ok('the duration is exact over a full down-and-back (no drift)',
     bottom === TIME.E_MIN && d === TIME.E_MAX, `bottom 10^${bottom}s, back to 10^${d}s`);
}

// ── 7. ONE ENGINE, TWO WORLDS — the shared factory ────────────────────────────
console.log('\n— one engine, two worlds (the shared makeAxis factory) —');
{
  ok('SPACE and TIME are BOTH built by the same makeAxis factory',
     typeof makeAxis === 'function' && typeof SPACE.renderPlan === 'function' && typeof TIME.renderPlan === 'function');
  ok('the two worlds share geometry but differ in ladder',
     SPACE.E_MIN === -15 && TIME.E_MIN === -15 && SPACE.ladder !== TIME.ladder &&
     SPACE.ladder[0].key === 'nucleus' && TIME.ladder[0].key === 'wave');
  // a throwaway third world proves the factory is truly general, not hard-wired.
  const toy = makeAxis({ ladder: [{ e: 0, key: 'a', name: 'a', anchor: [0, 0] }, { e: 1, key: 'b', name: 'b', anchor: [0.1, 0] }],
                         legend: { '0': 'a', '1': 'b' }, bands: [{ lo: -1, hi: 2, col: '1,1,1', name: 'x' }] });
  ok('makeAxis builds a well-formed world for any ladder',
     toy.E_MIN === 0 && toy.E_MAX === 1 && toy.runSelfTest !== undefined);
}

// ── 8. BYTE-PARITY — the page runs THE shared core ───────────────────────────
console.log('\n— byte-parity: the slab inlined into hour-glass/index.html IS the shared core —');
{
  const BEGIN = '// ===== TEN-FOLD CORE (inlined byte-twin of glass.mjs) BEGIN =====';
  const END   = '// ===== TEN-FOLD CORE END =====';
  const region = (s) => { const a = s.indexOf(BEGIN), b = s.indexOf(END);
    return (a < 0 || b < 0) ? null : s.slice(a, b + END.length); };
  const norm = (s) => s.split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
  const mine = region(readFileSync(join(here, '..', 'glass.mjs'), 'utf8'));
  let page = null;
  try { page = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch { /* not built */ }
  ok('glass.mjs carries the sentinels', !!mine, mine ? `${mine.length} chars` : 'MISSING');
  ok('hour-glass/index.html carries the same core, byte for byte',
     !!page && !!mine && norm(page) === norm(mine),
     page ? `${norm(page).length} vs ${norm(mine).length} chars` : 'index.html not built yet (run forge)');
}

console.log(`\n${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'} — ${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
