/* ═══════════════════════════════════════════════════════════════════════════
   hive.test.mjs — the Node twin.   node the-hive/hive.test.mjs

   Everything The Hive claims, checked here against something that did not
   produce it.  Where a number is a CALIBRATION rather than a law, the test
   says so and checks only that it is self-consistent and invertible.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  norm360, angDiff, declination, sunPosition, sunAzimuthRate, noonAzimuthRate,
  daylight, CAL, waggleSeconds, secondsToMetres, danceKind, encodeDance,
  decodeDance, NOISE, rng, releaseRecruits, circStats, dancePhase, dancePoint,
  renderDanceSignal, toBearing, toRange, fromPolar,
} from './hive.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, note = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}${note ? '   ' + note : ''}`); }
  else { fail++; console.log(`  ✗ ${name}   ${note}`); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const head = (s) => console.log(`\n${s}`);
const f = (x, n = 4) => Number(x).toFixed(n);

/* ══ A · THE SUN IS A REAL SUN ═════════════════════════════════════════════ */
head('PART A — the sun is computed, not faked');
{
  /* the solstices and equinoxes fall where they should, to the accuracy of a
     cosine fit for declination (a third of a degree) */
  ok('declination ≈ +23.44° at the June solstice',
    near(declination(172), 23.44, 0.35), `got ${f(declination(172), 3)}°`);
  ok('declination ≈ −23.44° at the December solstice',
    near(declination(355), -23.44, 0.35), `got ${f(declination(355), 3)}°`);
  ok('declination ≈ 0 at the March equinox',
    Math.abs(declination(80)) < 0.6, `got ${f(declination(80), 3)}°`);

  /* at solar noon in the northern mid-latitudes the sun is exactly due south */
  let worstNoon = 0;
  for (let d = 1; d <= 365; d += 7) for (const lat of [40, 45, 52, 60]) {
    worstNoon = Math.max(worstNoon, Math.abs(angDiff(sunPosition(d, 12, lat).azimuth, 180)));
  }
  ok('solar noon is due south for every day at 40–60°N', worstNoon < 1e-9,
    `worst |az−180| = ${worstNoon.toExponential(2)}°`);

  /* noon altitude has an exact closed form: 90 − |φ − δ|.  (Not 90 − φ + δ:
     that only holds when the sun culminates SOUTH of the zenith, and inside
     the tropics in summer it does not — the first draft of this test asserted
     the wrong one and got caught by 46.7° at the equator in June.) */
  let worstAlt = 0;
  for (let d = 1; d <= 365; d += 11) for (const lat of [0, 25, 52, 66]) {
    const p = sunPosition(d, 12, lat);
    worstAlt = Math.max(worstAlt, Math.abs(p.altitude - (90 - Math.abs(lat - declination(d)))));
  }
  ok('noon altitude ≡ 90 − |φ − δ|', worstAlt < 1e-9, `worst = ${worstAlt.toExponential(2)}°`);

  /* the sun is on the horizon at the sunrise the daylight formula predicts */
  let worstRise = 0;
  for (let d = 20; d <= 340; d += 13) for (const lat of [10, 35, 52]) {
    const dl = daylight(d, lat);
    worstRise = Math.max(worstRise, Math.abs(sunPosition(d, dl.rise, lat).altitude));
  }
  ok('altitude is 0 at the predicted sunrise', worstRise < 1e-9,
    `worst = ${worstRise.toExponential(2)}°`);

  const midsummer = daylight(172, 52);
  ok('midsummer at 52°N is ~16 h 40 m of daylight',
    near(midsummer.set - midsummer.rise, 16.66, 0.25),
    `${f(midsummer.set - midsummer.rise, 2)} h`);
  ok('the sun does not set at 70°N in June', daylight(172, 70).polar === 'day');
}

/* ══ B · THE SPINE: THE BEARING DOES NOT SWEEP AT 15° AN HOUR ══════════════ */
head('PART B — the sun\'s COMPASS BEARING, and how fast it is really moving');
{
  /* the closed-form rate agrees with a numerical derivative of the azimuth
     itself — two different objects, agreeing */
  let worst = 0, worstAt = null;
  for (let d = 1; d <= 365; d += 9) for (const lat of [0, 20, 40, 52, 60]) {
    const dl = daylight(d, lat);
    const lo = (dl.polar === 'day') ? 0.2 : dl.rise + 0.35;
    const hi = (dl.polar === 'day') ? 23.8 : dl.set - 0.35;
    if (!(hi > lo)) continue;
    for (let h = lo; h <= hi; h += 0.25) {
      const eps = 1e-5;
      const num = angDiff(sunPosition(d, h + eps, lat).azimuth,
        sunPosition(d, h - eps, lat).azimuth) / (2 * eps);
      const err = Math.abs(num - sunAzimuthRate(d, h, lat));
      if (err > worst) { worst = err; worstAt = [d, lat, f(h, 2)]; }
    }
  }
  ok('closed-form azimuth rate ≡ d(azimuth)/dt, everywhere in daylight',
    worst < 1e-4, `worst ${worst.toExponential(2)} °/h at ${JSON.stringify(worstAt)}`);

  /* the noon shortcut is the general rate evaluated at noon */
  let worstNoon = 0;
  for (let d = 1; d <= 365; d += 5) for (const lat of [30, 45, 52, 64]) {
    worstNoon = Math.max(worstNoon, Math.abs(noonAzimuthRate(d, lat) - sunAzimuthRate(d, 12, lat)));
  }
  ok('noonAzimuthRate ≡ sunAzimuthRate at h = 12', worstNoon < 1e-9,
    `worst ${worstNoon.toExponential(2)}`);

  /* THE HEADLINE.  Midsummer, an English orchard. */
  const rNoon = noonAzimuthRate(172, 52);
  const dl = daylight(172, 52);
  const rRise = Math.abs(sunAzimuthRate(172, dl.rise, 52));
  /* A thing that fell out of the room while it was being built, and turns out
     to be exact: AT SUNRISE AND SUNSET the azimuth rate is 15·sin(φ), on every
     day of the year.  The season cancels completely.  So the whole variation
     across a year, at one place, lives entirely in the middle of the day. */
  let worstRise2 = 0;
  for (const lat of [5, 20, 30, 45, 52, 60, 70]) for (let d = 1; d <= 365; d += 3) {
    const dd = daylight(d, lat);
    if (dd.polar) continue;
    const pred = 15 * Math.sin(lat * Math.PI / 180);
    worstRise2 = Math.max(worstRise2,
      Math.abs(Math.abs(sunAzimuthRate(d, dd.rise, lat)) - pred),
      Math.abs(Math.abs(sunAzimuthRate(d, dd.set, lat)) - pred));
  }
  ok('the sunrise/sunset azimuth rate is EXACTLY 15·sin(φ), every day of the year',
    worstRise2 < 1e-9, `worst ${worstRise2.toExponential(2)} °/h over 7 latitudes × 122 days`);

  ok('midsummer 52°N: the bearing sweeps ~28.8°/h at noon — nearly double 15',
    near(rNoon, 28.8, 0.5), `${f(rNoon, 2)} °/h`);
  ok('…and ~11.8°/h at sunrise, well under 15',
    near(rRise, 11.8, 0.5), `${f(rRise, 2)} °/h`);
  ok('so the rate varies 2.4-fold within one day', near(rNoon / rRise, 2.4, 0.2),
    `ratio ${f(rNoon / rRise, 2)}×`);
  /* and in midwinter the same sky is nearly the textbook 15 — so "it's not 15"
     is a fact about the SEASON as much as about the hour */
  ok('midwinter at the same place is a nearly-honest 14.2°/h at noon',
    near(noonAzimuthRate(355, 52), 14.2, 0.4), `${f(noonAzimuthRate(355, 52), 2)} °/h`);

  /* THE SHARP ONE.  On the Tropic of Cancer at the June solstice the sun is
     exactly overhead at noon: it has no compass bearing, and the rate blows up.
     A bee there has, for a moment, no sun compass at all. */
  const tropic = Math.abs(noonAzimuthRate(172, 23.44));
  ok('on the Tropic of Cancer at the solstice the noon rate is astronomically large',
    tropic > 1e4, `${tropic.toExponential(2)} °/h — the sun is in the zenith`);
  const tBefore = sunPosition(172, 11.99, 23.44).azimuth, tAfter = sunPosition(172, 12.01, 23.44).azimuth;
  ok('…the bearing flips E→W across 72 seconds there',
    Math.abs(angDiff(tAfter, tBefore)) > 175,
    `${f(tBefore, 1)}° → ${f(tAfter, 1)}°`);

  /* the day's total sweep is not 15 × hours-of-daylight, and the error a
     fifteen-degree bee would make is large and real */
  let sweep = 0;
  const step = 1 / 120;
  for (let h = dl.rise; h < dl.set; h += step) {
    sweep += Math.abs(angDiff(sunPosition(172, h + step, 52).azimuth,
      sunPosition(172, h, 52).azimuth));
  }
  ok('the whole day\'s sweep is ~256°, not 15°×16.7h = 250°',
    near(sweep, 256, 6), `${f(sweep, 1)}°`);

  /* the damage: hold a flower still for two hours around noon and let a bee
     "add 15° an hour" instead of watching the sky */
  const trueChange = angDiff(sunPosition(172, 13, 52).azimuth, sunPosition(172, 11, 52).azimuth);
  const naive = 30;
  ok('a 15°/h rule is >25° wrong across two hours at midsummer noon',
    Math.abs(trueChange - naive) > 25, `real ${f(trueChange, 1)}° vs assumed ${naive}°`);

  /* the whole point, restated as a number a bee would care about: hold the
     flower still and ask how far the dance angle drifts in ten minutes */
  const drift = Math.abs(angDiff(sunPosition(172, 12.0833, 52).azimuth, sunPosition(172, 12, 52).azimuth));
  ok('a dance learned ten minutes ago is already ~2.4° out at midsummer noon',
    near(drift, 2.4, 0.3), `${f(drift, 2)}°`);
}

/* ══ C · THE TWO WORDS OF THE DANCE ════════════════════════════════════════ */
head('PART C — encode and decode are inverses, written the two different ways');
{
  const rand = rng(20260730);
  let worstB = 0, worstD = 0, n = 0;
  for (let i = 0; i < 200000; i++) {
    const bearing = rand() * 360;
    const metres = 60 + rand() * 2500;
    const sun = rand() * 360;
    const dance = encodeDance(bearing, metres, sun);
    const back = decodeDance(dance, sun);
    worstB = Math.max(worstB, Math.abs(angDiff(back.bearing, bearing)));
    worstD = Math.max(worstD, Math.abs(back.metres - metres));
    n++;
  }
  ok(`decode(encode(·)) recovers the bearing — ${n.toLocaleString()} random flowers`,
    worstB < 1e-9, `worst ${worstB.toExponential(2)}°`);
  ok('…and the distance', worstD < 1e-8, `worst ${worstD.toExponential(2)} m`);

  /* the wrap-around case a naïve implementation gets wrong */
  const d1 = encodeDance(5, 800, 350);
  ok('a bearing 15° clockwise of a sun near north gives a 15° dance',
    near(d1.angle, 15, 1e-12), `${f(d1.angle, 6)}°`);
  ok('…and decodes back through the wrap', near(decodeDance(d1, 350).bearing, 5, 1e-9));

  ok('food straight at the sun ⇒ she runs straight UP',
    near(encodeDance(123.4, 900, 123.4).angle, 0, 1e-12));
  ok('food straight away from the sun ⇒ she runs straight DOWN',
    near(encodeDance(123.4, 900, 303.4).angle, 180, 1e-12));

  /* the distance line is a calibration; all we may claim is that it is
     monotone, linear, and invertible on its own terms */
  ok('waggle duration is strictly increasing in distance',
    [100, 200, 400, 800, 1600, 3000].every((d, i, a) => i === 0 || waggleSeconds(d) > waggleSeconds(a[i - 1])));
  const lin = [200, 700, 1400].map((d) => (waggleSeconds(d) - CAL.t0) / d);
  ok('…and exactly linear (same slope everywhere)',
    Math.max(...lin) - Math.min(...lin) < 1e-15, `slope ${(lin[0] * 1000).toFixed(3)} s/km`);
  let worstInv = 0;
  for (let d = 60; d < 4000; d += 7) worstInv = Math.max(worstInv, Math.abs(secondsToMetres(waggleSeconds(d)) - d));
  ok('…and invertible', worstInv < 1e-9, `worst ${worstInv.toExponential(2)} m`);
  ok(`1 km ⇒ a ${f(waggleSeconds(1000), 2)} s run;  200 m ⇒ ${f(waggleSeconds(200), 2)} s`,
    waggleSeconds(1000) > 2 * waggleSeconds(200));

  ok(`under ${CAL.roundBelow} m it is a ROUND dance and carries no angle`,
    danceKind(30) === 'round' && encodeDance(77, 30, 200).angle === null);
  ok(`over ${CAL.roundBelow} m it is a waggle dance`, danceKind(200) === 'waggle');
  ok('decoding a round dance yields nothing, rather than a wrong answer',
    decodeDance(encodeDance(77, 30, 200), 200).bearing === null);
}

/* ══ D · SUN COMPENSATION: A STILL FLOWER, A TURNING DANCE ═════════════════ */
head('PART D — the flower does not move and the dance turns all day');
{
  const lat = 52, day = 172;
  const flower = fromPolar(70, 900);
  const bearing = toBearing(flower.e, flower.n), metres = toRange(flower.e, flower.n);
  const dl = daylight(day, lat);

  /* every minute of daylight: the dance angle is the bearing minus the sun,
     and 200 recruits who know the sun still arrive on the right heading */
  let worstMean = 0, worstAngle = 0, minAng = 360, maxAng = -360, seed = 1;
  for (let h = dl.rise + 0.25; h <= dl.set - 0.25; h += 1 / 60) {
    const sun = sunPosition(day, h, lat).azimuth;
    const dance = encodeDance(bearing, metres, sun);
    worstAngle = Math.max(worstAngle, Math.abs(angDiff(dance.angle, bearing - sun)));
    const a = angDiff(dance.angle, 0);
    minAng = Math.min(minAng, a); maxAng = Math.max(maxAng, a);
    if ((seed % 37) === 0) {
      const rs = releaseRecruits(240, dance, sun, seed * 7919);
      const cs = circStats(rs.map((r) => r.bearing));
      worstMean = Math.max(worstMean, Math.abs(angDiff(cs.meanDeg, bearing)));
    }
    seed++;
  }
  ok('the dance angle is exactly bearing − sun, every minute of the day',
    worstAngle < 1e-9, `worst ${worstAngle.toExponential(2)}°`);
  ok('the recruits still fly to the flower all day (mean heading within 2°)',
    worstMean < 2.0, `worst ${f(worstMean, 2)}°`);
  ok('and the DANCE ITSELF turns through a wide arc while the flower sits still',
    (maxAng - minAng) > 180, `swept ${f(maxAng - minAng, 1)}° of comb`);

  /* the same flower danced at two moments differs by exactly the sun's motion */
  const s9 = sunPosition(day, 9, lat).azimuth, s15 = sunPosition(day, 15, lat).azimuth;
  const a9 = encodeDance(bearing, metres, s9).angle, a15 = encodeDance(bearing, metres, s15).angle;
  ok('Δdance ≡ −Δsun between 9 am and 3 pm',
    near(angDiff(a15, a9), -angDiff(s15, s9), 1e-9),
    `dance ${f(angDiff(a15, a9), 2)}°, sun ${f(angDiff(s15, s9), 2)}°`);

  /* a bee who fell asleep at 11 and danced her 11 o'clock angle at 1 o'clock */
  const s11 = sunPosition(day, 11, lat).azimuth, s13 = sunPosition(day, 13, lat).azimuth;
  const stale = encodeDance(bearing, metres, s11);
  const misled = decodeDance(stale, s13);
  ok('a two-hour-stale dance sends recruits >45° wrong at midsummer noon',
    Math.abs(angDiff(misled.bearing, bearing)) > 45,
    `off by ${f(Math.abs(angDiff(misled.bearing, bearing)), 1)}°`);
}

/* ══ E · DOES THE DANCE CARRY A DIRECTION?  ASK THE STATISTICS ═════════════ */
head('PART E — circular statistics: the waggle dance says where, the round dance does not');
{
  const sun = sunPosition(172, 10, 52).azimuth;
  const far = encodeDance(115, 850, sun);
  const near_ = encodeDance(115, 30, sun);

  const W = releaseRecruits(4000, far, sun, 555).map((r) => r.bearing);
  const R = releaseRecruits(4000, near_, sun, 556).map((r) => r.bearing);
  const cw = circStats(W), cr = circStats(R);

  ok('waggle dance: the recruits agree (mean resultant r > 0.97)',
    cw.r > 0.97, `r = ${f(cw.r, 4)}, circular s.d. ${f(cw.sdDeg, 1)}°`);
  ok('…and their mean heading is the true bearing, within half a degree',
    Math.abs(angDiff(cw.meanDeg, 115)) < 0.5,
    `mean ${f(cw.meanDeg, 2)}° vs true 115°`);
  ok('…and Rayleigh rejects "no direction" overwhelmingly',
    cw.p < 1e-12, `Z = ${f(cw.Z, 0)}, p = ${cw.p.toExponential(1)}`);

  ok('round dance: the recruits do NOT agree (r < 0.05)',
    cr.r < 0.05, `r = ${f(cr.r, 4)}`);
  ok('…and Rayleigh cannot reject "no direction"',
    cr.p > 0.05, `Z = ${f(cr.Z, 2)}, p = ${f(cr.p, 3)}`);
  ok('so r separates the two dances by more than twentyfold', cw.r / Math.max(cr.r, 1e-9) > 20,
    `${f(cw.r, 3)} vs ${f(cr.r, 3)}`);

  /* the statistic behaves: kill the noise and r goes to exactly 1 */
  const clean = releaseRecruits(500, far, sun, 99, { angleDeg: 0, distFrac: 0, runsFollowed: 4 });
  const cc = circStats(clean.map((r) => r.bearing));
  ok('with the scatter dialled to zero, r = 1 exactly and every recruit is on the bearing',
    near(cc.r, 1, 1e-12) && Math.abs(angDiff(cc.meanDeg, 115)) < 1e-9, `r = ${f(cc.r, 12)}`);

  /* r must fall as the scatter rises, monotonically */
  const rs = [0, 5, 10, 20, 40, 80].map((s) =>
    circStats(releaseRecruits(3000, far, sun, 4242, { angleDeg: s, distFrac: 0.1, runsFollowed: 1 })
      .map((x) => x.bearing)).r);
  ok('r falls monotonically as the dance gets sloppier',
    rs.every((v, i) => i === 0 || v < rs[i - 1]), rs.map((v) => f(v, 3)).join(' > '));

  /* and it must not be fooled by the wrap: put the flower due north */
  const north = encodeDance(0, 850, sun);
  const cn = circStats(releaseRecruits(4000, north, sun, 777).map((r) => r.bearing));
  ok('a flower due NORTH is not broken by the 0/360 wrap',
    Math.abs(angDiff(cn.meanDeg, 0)) < 0.5 && cn.r > 0.97,
    `mean ${f(cn.meanDeg, 2)}°, r ${f(cn.r, 3)}`);

  /* a control that must FAIL to find the flower: decode with the wrong sun */
  const wrongSun = norm360(sun + 90);
  const cWrong = circStats(releaseRecruits(2000, far, wrongSun, 888).map((r) => r.bearing));
  ok('a follower who has the sun 90° wrong lands 90° wrong — confidently',
    near(Math.abs(angDiff(cWrong.meanDeg, 115)), 90, 1.5) && cWrong.r > 0.97,
    `off by ${f(Math.abs(angDiff(cWrong.meanDeg, 115)), 2)}° with r = ${f(cWrong.r, 3)}`);

  /* averaging several runs really does tighten the fan, as √n */
  const one = circStats(releaseRecruits(6000, far, sun, 31, { ...NOISE, runsFollowed: 1 }).map((r) => r.bearing));
  const four = circStats(releaseRecruits(6000, far, sun, 32, { ...NOISE, runsFollowed: 4 }).map((r) => r.bearing));
  ok('following four runs instead of one halves the spread (√4)',
    near(one.sdDeg / four.sdDeg, 2, 0.15), `${f(one.sdDeg, 2)}° → ${f(four.sdDeg, 2)}° = ${f(one.sdDeg / four.sdDeg, 2)}×`);
}

/* ══ F · THE FIGURE OF EIGHT ═══════════════════════════════════════════════ */
head('PART F — the dance closes, alternates, and waggles at 13 Hz');
{
  const d = encodeDance(40, 800, 0);
  const period = d.seconds * (1 + CAL.returnFrac);

  ok('a circuit is the run plus the return', near(period, d.seconds * 1.62, 1e-12),
    `${f(period, 3)} s`);

  /* the trace closes: the end of the return is the start of the next run */
  let worstClose = 0;
  for (let k = 0; k < 6; k++) {
    const a = dancePoint(d, (k + 1) * period - 1e-7);
    const b = dancePoint(d, (k + 1) * period + 1e-7);
    worstClose = Math.max(worstClose, Math.hypot(a.x - b.x, a.y - b.y));
  }
  ok('the figure of eight closes on itself', worstClose < 5e-3, `gap ${worstClose.toExponential(2)}`);

  const sides = [0, 1, 2, 3, 4, 5].map((k) => dancePhase(d, (k + 0.9) * period).side);
  ok('the return loops alternate left and right — that is the eight',
    sides.every((s, i) => i === 0 || s === -sides[i - 1]), sides.join(','));

  /* the waggle is really at 13 Hz: count zero crossings of the lateral shimmy
     across one straight run */
  let cross = 0, prev = 0;
  const N = 20000;
  for (let i = 1; i < N; i++) {
    const t = (i / N) * d.seconds;
    const x = dancePoint(d, t).x;
    if (i > 1 && Math.sign(x) !== Math.sign(prev) && prev !== 0) cross++;
    prev = x;
  }
  const measuredHz = cross / 2 / d.seconds;
  ok(`the lateral waggle measures ${f(measuredHz, 2)} Hz against a stated ${CAL.waggleHz}`,
    near(measuredHz, CAL.waggleHz, 0.6));

  /* only the straight run waggles */
  let waggleOnRun = true, waggleOnReturn = false;
  for (let i = 0; i < 400; i++) {
    const t = (i / 400) * period * 4;
    const ph = dancePhase(d, t), p = dancePoint(d, t);
    if (ph.leg === 'run' && !p.waggling) waggleOnRun = false;
    if (ph.leg === 'return' && p.waggling) waggleOnReturn = true;
  }
  ok('she waggles on the straight run and not on the return', waggleOnRun && !waggleOnReturn);

  /* a longer distance means a longer run and a slower circuit — you can SEE
     distance as the tempo of the dance */
  const short = encodeDance(40, 150, 0), long = encodeDance(40, 2000, 0);
  ok('a 2 km dance takes far longer per circuit than a 150 m one',
    long.circuitSeconds / short.circuitSeconds > 6.5,
    `${f(short.circuitSeconds, 2)} s vs ${f(long.circuitSeconds, 2)} s`);
}

/* ══ G · THE SIGNAL THE FOLLOWERS FEEL ═════════════════════════════════════ */
head('PART G — the buzz: its LENGTH is the distance');
{
  const SR = 44100;
  for (const m of [200, 800, 1600]) {
    const d = encodeDance(0, m, 0);
    const sig = renderDanceSignal(d, SR, 1);
    /* measure the sounding stretch straight off the samples */
    let first = -1, last = -1;
    for (let i = 0; i < sig.length; i++) {
      if (Math.abs(sig[i]) > 0.02) { if (first < 0) first = i; last = i; }
    }
    const measured = (last - first) / SR;
    ok(`${m} m ⇒ a buzz measured at ${f(measured, 3)} s against a stated ${f(d.seconds, 3)} s`,
      near(measured, d.seconds, 0.06));
  }

  /* the burst is at the stated carrier — count zero crossings inside it */
  const d = encodeDance(0, 1000, 0);
  const sig = renderDanceSignal(d, SR, 1);
  const a = Math.round(0.25 * SR), b = Math.round(0.9 * SR);
  let z = 0;
  for (let i = a + 1; i < b; i++) if (Math.sign(sig[i]) !== Math.sign(sig[i - 1])) z++;
  const hz = z / 2 / ((b - a) / SR);
  ok(`the carrier measures ${f(hz, 1)} Hz against a stated ${CAL.buzzHz} Hz`,
    near(hz, CAL.buzzHz, 4));

  ok('nothing clips', Math.max(...sig.map(Math.abs)) < 0.99,
    `peak ${f(Math.max(...sig.map(Math.abs)), 3)}`);
  const rms = Math.sqrt(sig.reduce((s, x) => s + x * x, 0) / sig.length);
  ok('and it is not silence', rms > 0.05, `rms ${f(rms, 3)}`);

  /* the round dance has no straight run, so it makes no burst */
  const round = renderDanceSignal(encodeDance(0, 30, 0), SR, 2);
  ok('a round dance produces no waggle burst at all',
    Math.max(...round.map(Math.abs)) < 1e-12);
}

/* ══ H · THE WHOLE LOOP, END TO END ════════════════════════════════════════ */
head('PART H — a flower, a dance, a fan of bees, and where they land');
{
  /* the thing the room actually does, from a dropped flower to landed bees */
  const day = 172, lat = 52;
  let worst = 0;
  for (const h of [6, 8, 10, 12, 14, 16, 18, 20]) {
    for (const [e, n] of [[600, 300], [-900, -200], [40, -1200], [-100, 800]]) {
      const sun = sunPosition(day, h, lat).azimuth;
      const bearing = toBearing(e, n), metres = toRange(e, n);
      const dance = encodeDance(bearing, metres, sun);
      const rs = releaseRecruits(600, dance, sun, (h * 131 + e) | 0);
      /* average the LANDING POINTS, not the bearings — the honest question is
         "did the swarm end up at the flower" */
      let se = 0, sn = 0;
      for (const r of rs) { const p = fromPolar(r.bearing, r.metres); se += p.e; sn += p.n; }
      se /= rs.length; sn /= rs.length;
      worst = Math.max(worst, Math.hypot(se - e, sn - n) / metres);
    }
  }
  ok('the mean landing point is within 3 % of the flower, at every hour tested',
    worst < 0.03, `worst ${f(worst * 100, 2)} %`);

  /* the negative control that matters: a round dance does not do that */
  const sun = sunPosition(day, 10, lat).azimuth;
  const rd = encodeDance(toBearing(30, 20), 36, sun);
  const rr = releaseRecruits(600, rd, sun, 1234);
  let se = 0, sn = 0;
  for (const r of rr) { const p = fromPolar(r.bearing, r.metres); se += p.e; sn += p.n; }
  ok('a round dance lands them nowhere in particular — the mean is near the hive',
    Math.hypot(se / rr.length, sn / rr.length) < 12,
    `mean landing ${f(Math.hypot(se / rr.length, sn / rr.length), 1)} m from the hive`);

  /* reproducibility: the same seed is the same swarm, twice */
  const A = releaseRecruits(50, encodeDance(90, 700, 100), 100, 7);
  const B = releaseRecruits(50, encodeDance(90, 700, 100), 100, 7);
  ok('the same seed gives the same swarm, bee for bee',
    A.every((a, i) => a.bearing === B[i].bearing && a.metres === B[i].metres));
}

/* ══ I · HOUSEKEEPING ══════════════════════════════════════════════════════ */
head('PART I — the file is safe to inline, and the angles behave');
{
  ok('norm360 folds anything into [0,360)',
    [-720.5, -0.001, 0, 359.999, 360, 1080.25].every((x) => {
      const y = norm360(x); return y >= 0 && y < 360;
    }));
  ok('angDiff lands in (−180, 180]',
    [[359, 1], [1, 359], [180, 0], [0, 180], [90, 270]].every(([a, b]) => {
      const d = angDiff(a, b); return d > -180 - 1e-9 && d <= 180 + 1e-9;
    }));
  ok('angDiff(359,1) = −2', near(angDiff(359, 1), -2, 1e-12));

  const src = await (await import('node:fs/promises')).readFile(new URL('./hive.mjs', import.meta.url), 'utf8');
  ok('hive.mjs contains no backtick (it may be inlined inside a String.raw)',
    !src.includes('`'));
  ok('hive.mjs contains no forge directive of its own', !src.includes('forge:'));
  ok('hive.mjs is DOM-free',
    !/\b(document|window|navigator)\b/.test(src));
}

/* ══ SUMMARY ═══════════════════════════════════════════════════════════════ */
console.log(`\n${fail === 0 ? 'ALL GREEN' : 'FAILED'} — ${pass} checks passed, ${fail} failed.\n`);
process.exit(fail === 0 ? 0 : 1);
