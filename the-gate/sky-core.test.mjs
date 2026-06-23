/* ═══════════════════════════════════════════════════════════════════════════
   sky-core.test.mjs — pins the Front Gate's moon-phase math.

   Run:  node --test the-gate/sky-core.test.mjs       (from repo root /tmp/gate-worktree)
     or: node the-gate/sky-core.test.mjs

   The J2000 anchors are the load-bearing tests: they are REAL lunar events, and
   they only pass if the elongation is computed geocentrically WITHOUT the orrery's
   +180° correction (the "moon 180° landmine"). If the fix regressed, the New Moon
   would read fully lit and the Full Moon dark, and these would fail hard.
   ═══════════════════════════════════════════════════════════════════════════ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  julianDate, sunLongitude, moonLongitude, moonPhase, terminator,
} from './sky-core.mjs';

const utc = (y, mo, d, h = 0, mi = 0) => new Date(Date.UTC(y, mo - 1, d, h, mi));

/* ── J2000 anchors — the +180 proof ─────────────────────────────────────── */

test('2000-01-06 18:14 UTC is a New Moon (fraction ≈ 0, name "New")', () => {
  const ph = moonPhase(julianDate(utc(2000, 1, 6, 18, 14)));
  assert.ok(ph.illuminatedFraction < 0.02,
    `expected illuminatedFraction < 0.02 at new moon, got ${ph.illuminatedFraction}`);
  assert.equal(ph.phaseName, 'New');
});

test('2000-01-21 04:40 UTC is a Full Moon (fraction ≈ 1, name "Full")', () => {
  const ph = moonPhase(julianDate(utc(2000, 1, 21, 4, 40)));
  assert.ok(ph.illuminatedFraction > 0.98,
    `expected illuminatedFraction > 0.98 at full moon, got ${ph.illuminatedFraction}`);
  assert.equal(ph.phaseName, 'Full');
});

/* ── quarter-moon sanity (fraction ≈ 0.5, correct waxing flag) ───────────── */

test('2000-01-14 13:34 UTC is First Quarter (fraction ≈ 0.5, waxing)', () => {
  const ph = moonPhase(julianDate(utc(2000, 1, 14, 13, 34)));
  assert.ok(Math.abs(ph.illuminatedFraction - 0.5) < 0.03,
    `expected fraction ≈ 0.5, got ${ph.illuminatedFraction}`);
  assert.equal(ph.phaseName, 'First Quarter');
  assert.equal(ph.waxing, true, 'first quarter must be waxing');
  assert.ok(Math.abs(ph.phaseAngle - 90) < 5, `phaseAngle ≈ 90°, got ${ph.phaseAngle}`);
});

test('2000-01-28 07:57 UTC is Last Quarter (fraction ≈ 0.5, waning)', () => {
  const ph = moonPhase(julianDate(utc(2000, 1, 28, 7, 57)));
  assert.ok(Math.abs(ph.illuminatedFraction - 0.5) < 0.03,
    `expected fraction ≈ 0.5, got ${ph.illuminatedFraction}`);
  assert.equal(ph.phaseName, 'Last Quarter');
  assert.equal(ph.waxing, false, 'last quarter must be waning');
  assert.ok(Math.abs(ph.phaseAngle - 270) < 5, `phaseAngle ≈ 270°, got ${ph.phaseAngle}`);
});

/* ── invariants over a whole synodic cycle ──────────────────────────────── */

test('illuminatedFraction is always in [0, 1] across a synodic month', () => {
  // sample every ~3h for 30 days starting at the J2000 new moon
  const startJD = julianDate(utc(2000, 1, 6, 18, 14));
  for (let h = 0; h <= 30 * 24; h += 3) {
    const ph = moonPhase(startJD + h / 24);
    assert.ok(ph.illuminatedFraction >= 0 && ph.illuminatedFraction <= 1,
      `fraction out of range at +${h}h: ${ph.illuminatedFraction}`);
    assert.ok(ph.phaseAngle >= 0 && ph.phaseAngle < 360,
      `phaseAngle out of range at +${h}h: ${ph.phaseAngle}`);
  }
});

test('phaseName cycles monotonically through the 8 bins as elongation grows', () => {
  // Sweep the phase ANGLE directly via synthetic JDs is hard; instead sweep real
  // time across one synodic month and assert the visited names appear in the
  // canonical order with no out-of-order regressions (each step advances 0 or 1
  // bin forward, wrapping once at the New→…→New seam).
  const order = [
    'New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
  ];
  const idxOf = (name) => order.indexOf(name);
  const startJD = julianDate(utc(2000, 1, 6, 18, 14)); // a new moon
  let prev = idxOf(moonPhase(startJD).phaseName);
  let wraps = 0;
  for (let h = 1; h <= 30 * 24; h += 1) {
    const cur = idxOf(moonPhase(startJD + h / 24).phaseName);
    assert.notEqual(cur, -1, 'phaseName must be one of the 8 canonical names');
    if (cur === prev) continue;
    const forward = (cur - prev + 8) % 8;   // bins advanced this step
    assert.equal(forward, 1, `phase jumped ${forward} bins (${prev}→${cur}); must advance 1 at a time`);
    if (cur === 0) wraps++;                  // returned to New
    prev = cur;
  }
  assert.equal(wraps, 1, `expected exactly one New→…→New wrap in ~30 days, saw ${wraps}`);
});

/* ── sunLongitude / moonLongitude basic well-formedness ─────────────────── */

test('sunLongitude and moonLongitude return normalized degrees', () => {
  for (let d = 0; d < 400; d += 7) {
    const JD = julianDate(utc(2020, 1, 1)) + d;
    const ls = sunLongitude(JD), lm = moonLongitude(JD);
    assert.ok(ls >= 0 && ls < 360, `sunLongitude out of range: ${ls}`);
    assert.ok(lm >= 0 && lm < 360, `moonLongitude out of range: ${lm}`);
  }
});

test('Sun advances ~0.9856°/day (≈360° per tropical year)', () => {
  const JD0 = julianDate(utc(2020, 3, 20)); // near an equinox, mid-range
  // wrap the difference into [-180,180] so the 360°→0° seam doesn't read as a -359° jump
  const wrap180 = (d) => { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; };
  const d1 = wrap180(sunLongitude(JD0 + 0.5) - sunLongitude(JD0 - 0.5)); // ≈ 1 day of motion
  assert.ok(Math.abs(d1 - 360 / 365.2422) < 0.05,
    `Sun daily motion ≈ 0.9856°, got ${d1}`);
});

/* ── julianDate edge cases ──────────────────────────────────────────────── */

test('julianDate matches the J2000.0 epoch and rolls over at noon UTC', () => {
  // 2000-01-01 12:00 UTC ≈ JD 2451545.0 (J2000; UT≈TT to within seconds here)
  assert.ok(Math.abs(julianDate(utc(2000, 1, 1, 12, 0)) - 2451545.0) < 1e-6);
  // midnight UTC is half a day earlier
  assert.ok(Math.abs(julianDate(utc(2000, 1, 1, 0, 0)) - 2451544.5) < 1e-6);
});

test('julianDate rejects invalid input', () => {
  assert.throws(() => julianDate('2000-01-01'), TypeError);
  assert.throws(() => julianDate(new Date('not a date')), TypeError);
  assert.throws(() => julianDate(null), TypeError);
});

/* ── terminator geometry contract ───────────────────────────────────────── */

test('terminator: quarter is a straight diameter, lit side follows waxing', () => {
  const q = terminator(0.5, true);
  assert.equal(q.curvature, 0, 'quarter terminator is straight (curvature 0)');
  assert.equal(q.terminatorBulge, 0);
  assert.equal(q.litSide, 'right');
  assert.equal(terminator(0.5, false).litSide, 'left');
});

test('terminator: crescent cuts into the lit side, gibbous bulges into the dark', () => {
  const crescent = terminator(0.2, true);   // k < 0.5
  assert.ok(crescent.curvature > 0, 'crescent curvature > 0 (cuts into lit)');
  assert.equal(crescent.terminatorBulge, 1);

  const gibbous = terminator(0.8, false);    // k > 0.5
  assert.ok(gibbous.curvature < 0, 'gibbous curvature < 0 (bulges into dark)');
  assert.equal(gibbous.terminatorBulge, -1);
});

test('terminator: full/new flags and fraction clamping', () => {
  assert.equal(terminator(1, true).isFull, true);
  assert.equal(terminator(0, true).isNew, true);
  // clamps out-of-range fractions to [0,1]
  assert.equal(terminator(1.5, true).illuminatedFraction, 1);
  assert.equal(terminator(-0.3, true).illuminatedFraction, 0);
});

/* ── the global attaches when present (browser dual-use smoke test) ──────── */

test('GateSkyCore is attached to globalThis with the full API', () => {
  assert.ok(globalThis.GateSkyCore, 'GateSkyCore global should be attached');
  for (const fn of ['julianDate', 'sunLongitude', 'moonLongitude', 'moonPhase', 'terminator']) {
    assert.equal(typeof globalThis.GateSkyCore[fn], 'function', `GateSkyCore.${fn} missing`);
  }
});
