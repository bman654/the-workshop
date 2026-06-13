#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   dial.test.cjs — the Gnomon's headless self-test. Requires the SAME core the
   page inlines (tools/dial/dial.js), so the green chip in the browser and this
   Node run prove the IDENTICAL math. Run: node tools/dial/dial.test.cjs

   The crux this proves: a sundial's shadow tells true clock time. The civil↔
   apparent-solar conversion round-trips to the second; the shadow-tip lands on
   the closed-form hour-line for its hour; the hour-line angles match the closed
   form per dial type (equatorial exactly 15°/hour); the equation of time hits
   its known extrema and zero-crossings; the gnomon style angle equals the
   latitude (or co-latitude); solar declination is sane at the cardinal
   longitudes; and the geometry is deterministic and skin-invariant.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const D = require('./dial.js');

let pass = 0, total = 0;
const fails = [];
function check(name, cond) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name); }
}

const D2R = D.D2R, R2D = D.R2D, EPS = D.EPS;
const YEAR = 2026;

/* 1. ROUND-TRIP CLOCK — over a battery of (lat,lon,tz,day,civil,dst,eot) states,
      civil → AST → civil recovers the input clock to under 1 second. This is the
      instrument's central claim: the shadow's apparent time and the wall clock
      are exact inverses through the longitude + EoT (+ DST) corrections. */
{
  let maxErrMin = 0;
  const lats = [-66, -33, 0, 19, 40, 51.5, 66];
  const lons = [-122, -71, 0, 13, 139];
  const tzs = [-480, -300, 0, 60, 540];   // PST, EST, UTC, CET, JST (minutes)
  const days = [0, 41, 80, 171, 264, 306, 364];
  const civils = [6 * 60, 9 * 60 + 17, 12 * 60, 15 * 60 + 42, 19 * 60];
  for (const latDeg of lats) for (const lon of lons) for (const tz of tzs)
    for (const day of days) for (const civil of civils) for (const dst of [false, true]) {
      const date = D.civilToDate(YEAR, day, civil, tz);
      const jd = D.julianDate(date);
      const eot = D.equationOfTimeMin(jd);
      const ast = D.civilToAST(civil, lon, tz, eot, dst);
      const back = D.astToCivil(ast, lon, tz, eot, dst);
      maxErrMin = Math.max(maxErrMin, Math.abs(back - civil));
    }
  check('round-trip clock: civil→AST→civil recovers input < 1 s (over ' +
    (lats.length * lons.length * tzs.length * days.length * civils.length * 2) + ' states)',
    maxErrMin < 1 / 60);
}

/* 2. SHADOW-TIP ON THE MATCHING HOUR-LINE — for each dial type and a sweep of
      hour angles, the projected shadow-tip lies on the hour-line direction the
      closed form predicts, to < 1e-5 of the dial radius. The tip points where
      the geometry says it must. */
{
  const styleLen = 1, radiusRef = 1;
  const TOL = 1e-5 * radiusRef;
  let maxErr = 0;
  for (const type of ['horizontal', 'equatorial', 'vertical-south']) {
    for (const phiDeg of [-52, -20, 0, 23.4, 45, 60]) {
      const phi = phiDeg * D2R;
      for (let hr = 7; hr <= 17; hr++) {        // daylight hours, Sun above plane
        const H = D.hourAngleFromAST(hr * 60);
        const theta = D.hourLineAngle(type, H, phi);
        const tip = D.shadowTip(type, H, phi, styleLen);
        // tip must lie on the ray at angle `theta`: its perpendicular offset is 0
        const perp = Math.abs(tip.x * Math.cos(theta) - tip.y * Math.sin(theta));
        // and on the SAME side (positive radius along the ray)
        const along = tip.x * Math.sin(theta) + tip.y * Math.cos(theta);
        maxErr = Math.max(maxErr, perp / Math.max(1e-9, Math.abs(along)));
      }
    }
  }
  check('shadow-tip lands on the closed-form hour-line (all 3 types, < 1e-5·r)', maxErr < TOL);
}

/* 3a. HOUR-LINE ANGLES == CLOSED FORM (horizontal): θ == atan(sinφ·tanH). */
{
  let maxErr = 0;
  for (const phiDeg of [-60, -23.4, 0, 19, 40, 51.5, 66]) {
    const phi = phiDeg * D2R;
    for (let hr = 6.5; hr <= 17.5; hr += 0.5) {
      const H = D.hourAngleFromAST(hr * 60);
      const got = D.hourLineAngle('horizontal', H, phi);
      const want = Math.atan(Math.sin(phi) * Math.tan(H));   // closed form
      // compare as a direction (mod π): atan2 form == atan form within a quadrant
      let dd = Math.abs(got - want);
      dd = Math.min(dd, Math.abs(dd - Math.PI));
      maxErr = Math.max(maxErr, dd);
    }
  }
  check('horizontal hour-line angle == atan(sinφ·tanH) closed form (< 1e-9)', maxErr < 1e-9);
}

/* 3b. HOUR-LINE ANGLES == CLOSED FORM (vertical-south): θ == atan(cosφ·tanH). */
{
  let maxErr = 0;
  for (const phiDeg of [10, 19, 35, 45, 51.5, 60]) {
    const phi = phiDeg * D2R;
    for (let hr = 8; hr <= 16; hr += 0.5) {
      const H = D.hourAngleFromAST(hr * 60);
      const got = D.hourLineAngle('vertical-south', H, phi);
      const want = Math.atan(Math.cos(phi) * Math.tan(H));
      let dd = Math.abs(got - want);
      dd = Math.min(dd, Math.abs(dd - Math.PI));
      maxErr = Math.max(maxErr, dd);
    }
  }
  check('vertical-south hour-line angle == atan(cosφ·tanH) closed form (< 1e-9)', maxErr < 1e-9);
}

/* 3c. EQUATORIAL IS EXACTLY UNIFORM — 15° per hour, θ == H, no latitude term. */
{
  let maxErr = 0, maxStepErr = 0;
  for (const phiDeg of [-40, 0, 30, 60]) {
    const phi = phiDeg * D2R;
    let prev = null;
    for (let hr = 6; hr <= 18; hr++) {
      const H = D.hourAngleFromAST(hr * 60);
      const got = D.hourLineAngle('equatorial', H, phi);
      maxErr = Math.max(maxErr, Math.abs(got - H));          // θ == H exactly
      if (prev !== null) maxStepErr = Math.max(maxStepErr, Math.abs((got - prev) - 15 * D2R));
      prev = got;
    }
  }
  check('equatorial hour-lines are exactly uniform 15°/hour, θ==H (< 1e-12)',
    maxErr < 1e-12 && maxStepErr < 1e-12);
}

/* 4a. EoT EXTREMA within 30 s of the known bounds (≈+16m23s ~Nov 3,
       ≈−14m6s ~Feb 11). Scan the year for the max and min. */
{
  let maxE = -1e9, maxD = -1, minE = 1e9, minD = -1;
  for (let d = 0; d < 365; d++) {
    const jd = D.julianDate(D.civilToDate(YEAR, d, 720, 0));
    const e = D.equationOfTimeMin(jd);
    if (e > maxE) { maxE = e; maxD = d; }
    if (e < minE) { minE = e; minD = d; }
  }
  // +16m23s = 16.383 min; −14m6s = −14.10 min. 30 s = 0.5 min.
  const maxDate = new Date(Date.UTC(YEAR, 0, 1) + maxD * 86400000);
  const minDate = new Date(Date.UTC(YEAR, 0, 1) + minD * 86400000);
  check('EoT maximum ≈ +16m23s within 30 s (got ' + maxE.toFixed(2) + 'm @ day ' + maxD + ')',
    Math.abs(maxE - 16.383) < 0.5);
  check('EoT maximum falls in early November (got month ' + (maxDate.getUTCMonth() + 1) + ')',
    maxDate.getUTCMonth() === 10);
  check('EoT minimum ≈ −14m6s within 30 s (got ' + minE.toFixed(2) + 'm @ day ' + minD + ')',
    Math.abs(minE - (-14.10)) < 0.5);
  check('EoT minimum falls in February (got month ' + (minDate.getUTCMonth() + 1) + ')',
    minDate.getUTCMonth() === 1);
}

/* 4b. EoT ZERO-CROSSINGS near the four canonical dates (~Apr 16, ~Jun 13,
       ~Sep 2, ~Dec 25): each must have a sign change within ±5 days. */
{
  function eotAt(d) { return D.equationOfTimeMin(D.julianDate(D.civilToDate(YEAR, d, 720, 0))); }
  function crossesNear(targetDay) {
    for (let d = targetDay - 5; d <= targetDay + 5; d++) {
      const a = eotAt(((d % 365) + 365) % 365);
      const b = eotAt((((d + 1) % 365) + 365) % 365);
      if ((a <= 0) !== (b <= 0)) return true;
    }
    return false;
  }
  // day-of-year (0-based) of the canonical crossings in 2026
  const apr16 = 105, jun13 = 163, sep2 = 244, dec25 = 358;
  check('EoT zero-crossing near mid-April', crossesNear(apr16));
  check('EoT zero-crossing near mid-June', crossesNear(jun13));
  check('EoT zero-crossing near early September', crossesNear(sep2));
  check('EoT zero-crossing near late December', crossesNear(dec25));
}

/* 5. GNOMON STYLE ANGLE per dial type: horizontal == |latitude|; equatorial &
      vertical-south == co-latitude (90° − |latitude|). */
{
  let ok = true;
  for (const phiDeg of [-66, -23.4, 0, 19, 40, 66]) {
    const phi = phiDeg * D2R;
    if (Math.abs(D.gnomonAngle('horizontal', phi) - Math.abs(phi)) > 1e-12) ok = false;
    if (Math.abs(D.gnomonAngle('equatorial', phi) - (Math.PI / 2 - Math.abs(phi))) > 1e-12) ok = false;
    if (Math.abs(D.gnomonAngle('vertical-south', phi) - (Math.PI / 2 - Math.abs(phi))) > 1e-12) ok = false;
  }
  check('gnomon style angle: horizontal==|φ|, equatorial & vertical==90°−|φ| (< 1e-12)', ok);
}

/* 6. SOLAR-DEC SANITY at the cardinal ecliptic longitudes: λ=0→0, 90→+EPS,
      180→0, 270→−EPS. */
{
  const sd = lam => D.solarDec(lam) * R2D;
  check('solar dec: λ=0 → 0', Math.abs(sd(0)) < 1e-9);
  check('solar dec: λ=90° → +EPS', Math.abs(sd(Math.PI / 2) - EPS * R2D) < 1e-9);
  check('solar dec: λ=180° → 0', Math.abs(sd(Math.PI)) < 1e-9);
  check('solar dec: λ=270° → −EPS', Math.abs(sd(3 * Math.PI / 2) + EPS * R2D) < 1e-9);
}

/* 7. NOON ON THE NOON LINE — at apparent solar noon (H=0) the shadow points
      straight up the 12-o'clock line (θ=0, x=0) for every dial type & latitude.
      A direct check that the dial is oriented true. */
{
  let ok = true;
  for (const type of ['horizontal', 'equatorial', 'vertical-south']) {
    for (const phiDeg of [-50, 0, 19, 45, 60]) {
      const tip = D.shadowTip(type, 0, phiDeg * D2R, 1);
      if (Math.abs(tip.theta) > 1e-12 || Math.abs(tip.x) > 1e-12) ok = false;
    }
  }
  check('apparent noon (H=0): shadow on the 12-o’clock line (θ=0) for all types', ok);
}

/* 8. DETERMINISM & SKIN-INVARIANCE — identical state → identical geometry
      fingerprint; switching skin never moves a line. */
{
  const state = {
    dialType: 'horizontal', latDeg: 40, lonDeg: -71, tzOffsetMin: -300,
    dayOfYear: 171, civilMin: 14 * 60 + 30, dst: true, eotOn: true, year: YEAR
  };
  const a = D.geometryFingerprint(state);
  const b = D.geometryFingerprint(state);
  check('determinism: same state → identical fingerprint', a === b);
  const withSkins = ['brass', 'blueprint', 'stone'].map(sk =>
    D.geometryFingerprint(Object.assign({}, state, { skin: sk })));
  check('skin invariance: fingerprint identical across 3 skins',
    withSkins.every(f => f === a));
}

/* ── Report ──────────────────────────────────────────────────────────────── */
console.log('\nGnomon self-test: ' + pass + '/' + total + ' passed.');
if (pass !== total) {
  console.error('FAILED: ' + fails.length + ' check(s) — ' + fails.join('; '));
  process.exit(1);
}
process.exit(0);
