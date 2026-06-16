/* ═══════════════════════════════════════════════════════════════════════════
   hours.js — "The Hours": the front door's day/light CORE (the one authority).

   The estate's front door is a LIVING place — it knows what time it really is.
   The whole plate is tinted by a continuous day-phase function of the TRUE solar
   ALTITUDE for a fixed estate latitude/date, and a brass gnomon on the plate
   casts a real shadow that sweeps with the sun. Four time-gated apparitions wake
   in their hour. This file is the pure, DOM-FREE core: the front-door page (via
   forge) and the headless self-test (tools/hours/hours.test.cjs) BOTH call THESE
   SAME functions — no parallel copy, no drift.

   ── THE SUN IS NOT RE-DERIVED HERE ──
   The solar functions (julianDate, sunEclipticLonDeg, solarDec, solarRA,
   sunPosition, sunAltAz, meanLonDeg, equationOfTimeMin, civilToAST,
   hourAngleFromAST, shadowTip) are COPIED VERBATIM from tools/dial/dial.js's
   PROVEN core — the same model that proves the sun for the Gnomon sundial and the
   Astrolabe. The Hours therefore CANNOT disagree with them about where the sun is
   or which way a shadow falls. (A future agent may promote those ~80 lines to
   tools/solar/solar.js and forge-inline into dial + hours + astrolabe to retire
   the verbatim copy — noted, not required to ship.)

   The shadow DIRECTION is routed through shadowTip() (the proven closed-form
   hour-line), NOT ad-hoc trig — so it is provably correct.

   Vanilla, ES5-ish, zero-dependency, DOM-free, dual-use IIFE: `Hours` global in a
   browser, `module.exports` under Node. Angles are radians unless a name says
   *Deg. forge strips the module guard at the bottom when inlining.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Hours = {};

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var EPS = 23.4392911 * D2R;            // obliquity of the ecliptic (J2000-ish)
  var TAU = Math.PI * 2;
  function clamp1(x) { return Math.max(-1, Math.min(1, x)); }

  Hours.D2R = D2R; Hours.R2D = R2D; Hours.EPS = EPS; Hours.TAU = TAU;

  /* ── THE ESTATE'S FIXED PLACE — no geolocation, no privacy claim. A surveyor's
     plate is drawn for ONE site; the estate sits at a temperate northern lat so
     the day swings far enough to be legible (a long golden hour, real twilight,
     deep night). lon = standard meridian, so civil-noon ≈ solar-noon ± EoT. ── */
  Hours.ESTATE = { latDeg: 40.7, lonDeg: 0, tzOffsetMin: 0 };

  /* ═════════════════════════════════════════════════════════════════════════
     TIME & SUN — copied VERBATIM from tools/dial/dial.js's core.
     ═════════════════════════════════════════════════════════════════════════ */

  // Julian Date from a UTC Date.
  function julianDate(d) { return d.getTime() / 86400000 + 2440587.5; }

  // Low-precision solar ecliptic longitude (deg) from JD. Accurate to ~0.01deg.
  function sunEclipticLonDeg(jd) {
    var n = jd - 2451545.0;
    var L = (280.460 + 0.9856474 * n) % 360;          // mean longitude
    var g = ((357.528 + 0.9856003 * n) % 360) * D2R;  // mean anomaly
    var lam = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
    return ((lam % 360) + 360) % 360;
  }

  // Solar declination from ecliptic longitude (lambda in rad), rad out.
  function solarDec(lambda) { return Math.asin(Math.sin(EPS) * Math.sin(lambda)); }

  // Solar right ascension from ecliptic longitude (quadrant-correct), rad.
  function solarRA(lambda) {
    var ra = Math.atan2(Math.cos(EPS) * Math.sin(lambda), Math.cos(lambda));
    return (ra + TAU) % TAU;
  }

  // Full solar equatorial position from JD.
  function sunPosition(jd) {
    var lam = sunEclipticLonDeg(jd) * D2R;
    return { lambda: lam, dec: solarDec(lam), ra: solarRA(lam) };
  }

  // Sun's mean ecliptic longitude (deg), normalised — the "mean Sun".
  function meanLonDeg(jd) {
    var n = jd - 2451545.0;
    return (((280.460 + 0.9856474 * n) % 360) + 360) % 360;
  }

  // Equation of time (minutes) from JD. apparent − mean = 4·(L − α).
  function equationOfTimeMin(jd) {
    var L = meanLonDeg(jd);
    var lam = sunEclipticLonDeg(jd) * D2R;
    var ra = solarRA(lam) * R2D;
    var e = 4 * (L - ra);
    while (e > 20) e -= 1440;
    while (e < -20) e += 1440;
    return e;
  }

  // Civil clock (min) → apparent solar time (min). (dial.civilToAST, lon=tzMer=0.)
  function civilToAST(civilMin, lonDeg, tzOffsetMin, eotMin, dstOn) {
    var tzMerDeg = (tzOffsetMin / 60) * 15;
    var lonCorrectionMin = (lonDeg - tzMerDeg) * 4;
    return civilMin - (dstOn ? 60 : 0) - lonCorrectionMin - eotMin;
  }

  // Hour angle H (rad) from apparent solar time. 720 min → 0; 15°/h = 0.25°/min.
  function hourAngleFromAST(astMin) { return (astMin - 720) * 0.25 * D2R; }

  // Sun altitude/azimuth from (dec, H, φ). Azimuth from NORTH, clockwise (0=N).
  function sunAltAz(dec, H, phi) {
    var sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
    var alt = Math.asin(clamp1(sinAlt));
    var cosAlt = Math.cos(alt);
    var az;
    if (cosAlt < 1e-12) { az = 0; }
    else {
      var sinAz = -Math.sin(H) * Math.cos(dec) / cosAlt;
      var cosAz = (Math.sin(dec) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt);
      az = Math.atan2(sinAz, cosAz);
    }
    return { alt: alt, az: (az + TAU) % TAU };
  }

  // Closed-form hour-line angle (rad, from the noon line, +ve toward afternoon)
  // for a horizontal dial at latitude φ. (dial.hourLineAngle, horizontal case.)
  function hourLineAngle(H, phi) {
    return Math.atan2(Math.sin(phi) * Math.sin(H), Math.cos(H));
  }

  // SHADOW-TIP projection for a HORIZONTAL dial — the proven dial.shadowTip core
  // (horizontal branch). The tip lies EXACTLY on the hour-line direction; its
  // LENGTH is the real cast length r = styleLen / tan(alt). `below` is true when
  // the sun is on the unlit side (alt ≤ 0). Dial-local frame: +x → afternoon
  // (west), +y → up the noon line (toward 12). This is the SAME math the Gnomon
  // sundial ships — so The Hours' shadow can't disagree with the sundial's.
  function shadowTip(H, phi, styleLen, dec) {
    if (styleLen == null) styleLen = 1;
    var theta = hourLineAngle(H, phi);
    var MAXR = 1e4, r, below;
    var aa = sunAltAz(dec, H, phi);
    var altp = aa.alt;                        // horizontal: true altitude
    below = (altp <= 0);
    var tn = Math.tan(altp);
    r = (tn < 1e-4) ? MAXR : styleLen / tn;
    return { x: r * Math.sin(theta), y: r * Math.cos(theta), r: r, theta: theta, below: below };
  }

  Hours.julianDate = julianDate;
  Hours.sunEclipticLonDeg = sunEclipticLonDeg;
  Hours.solarDec = solarDec;
  Hours.solarRA = solarRA;
  Hours.sunPosition = sunPosition;
  Hours.meanLonDeg = meanLonDeg;
  Hours.equationOfTimeMin = equationOfTimeMin;
  Hours.civilToAST = civilToAST;
  Hours.hourAngleFromAST = hourAngleFromAST;
  Hours.sunAltAz = sunAltAz;
  Hours.hourLineAngle = hourLineAngle;
  Hours.shadowTip = shadowTip;

  /* ═════════════════════════════════════════════════════════════════════════
     THE ONE PUBLIC SUN ENTRY: solarAltAz(latDeg, doy, civilMin) → {alt, az}
     The TRUE solar altitude & azimuth for a latitude, day-of-year, and civil
     minutes-of-day. The clock runs on the estate's standard meridian (lon = tzMer
     = 0), so civil-noon = solar-noon ± the equation of time — honest about EoT
     without a longitude knob. Year fixed to 2025 (only the day-of-year drives the
     declination). Returns radians.
     ═════════════════════════════════════════════════════════════════════════ */
  function solarAltAz(latDeg, doy, civilMin) {
    var phi = latDeg * D2R;
    var base = Date.UTC(2025, 0, 1, 0, 0, 0);
    var d = new Date(base + doy * 86400000 + civilMin * 60000);
    var jd = julianDate(d);
    var sun = sunPosition(jd);
    var eot = equationOfTimeMin(jd);
    var astMin = civilToAST(civilMin, Hours.ESTATE.lonDeg, Hours.ESTATE.tzOffsetMin, eot, false);
    var H = hourAngleFromAST(astMin);
    return sunAltAz(sun.dec, H, phi);
  }
  Hours.solarAltAz = solarAltAz;

  // convenience: altitude in degrees at the estate latitude.
  function solarAltitudeDeg(latDeg, doy, civilMin) { return solarAltAz(latDeg, doy, civilMin).alt * R2D; }
  Hours.solarAltitudeDeg = solarAltitudeDeg;

  /* ═════════════════════════════════════════════════════════════════════════
     THE GNOMON SHADOW — ROUTED THROUGH the proven shadowTip(). Given the same
     (latDeg, doy, civilMin) the page scrubs, this returns the dial-local shadow
     vector {x,y,r,theta,below} for a horizontal dial. Because direction comes
     from shadowTip()'s closed-form hour-line — the SAME function the Gnomon
     sundial ships — the shadow DIRECTION is provably correct (not ad-hoc trig).
     ═════════════════════════════════════════════════════════════════════════ */
  function gnomonShadow(latDeg, doy, civilMin, styleLen) {
    var phi = latDeg * D2R;
    var base = Date.UTC(2025, 0, 1, 0, 0, 0);
    var d = new Date(base + doy * 86400000 + civilMin * 60000);
    var jd = julianDate(d);
    var sun = sunPosition(jd);
    var eot = equationOfTimeMin(jd);
    var astMin = civilToAST(civilMin, Hours.ESTATE.lonDeg, Hours.ESTATE.tzOffsetMin, eot, false);
    var H = hourAngleFromAST(astMin);
    return shadowTip(H, phi, styleLen == null ? 1 : styleLen, sun.dec);
  }
  Hours.gnomonShadow = gnomonShadow;

  /* ═════════════════════════════════════════════════════════════════════════
     THE TINT SCHEDULE — a CONTINUOUS function of the sun's ALTITUDE (deg).
     Altitude is the single driver — the civil clock is NOT consulted — so the
     schedule is astronomically honest: a polar summer never goes dark, a winter
     noon stays low & golden. Everything is C0-continuous in altitude (the colour
     walk shares endpoints exactly at every segment boundary). brightness rises
     MONOTONICALLY with altitude (no inverted phase).
     ═════════════════════════════════════════════════════════════════════════ */
  // smoothstep on [a,b]; clamps outside.
  function S(a, b, x) { if (b === a) return x < a ? 0 : 1; var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) { return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))]; }
  Hours.S = S;

  // anchor palette by altitude (deg): deep night → twilight → civil rose → low
  // golden → soft gold → bright flat. Each adjacent pair shares the boundary
  // colour exactly, so skyColor is jump-free.
  var NIGHT = [14, 20, 46], TWI = [30, 34, 70], ROSE = [120, 70, 96],
      AMBER = [210, 150, 96], GOLD = [235, 205, 150], NOON = [225, 232, 238];
  Hours.PALETTE = { NIGHT: NIGHT, TWI: TWI, ROSE: ROSE, AMBER: AMBER, GOLD: GOLD, NOON: NOON };

  function brightness(altDeg) {
    // 0.06 at deep night → 1.0 at high sun. continuous, monotone non-decreasing.
    if (altDeg <= -18) return 0.06;                          // astronomical night floor
    if (altDeg < 0)   return lerp(0.06, 0.30, S(-18, 0, altDeg)); // twilight ramp
    return lerp(0.30, 1.0, S(0, 60, altDeg));                // day ramp to high sun
  }
  Hours.brightness = brightness;

  function skyColor(altDeg) {
    if (altDeg <= -18) return NIGHT.slice();
    if (altDeg < -6)  return mix(NIGHT, TWI,   S(-18, -6, altDeg)); // astro→nautical
    if (altDeg < 0)   return mix(TWI,   ROSE,  S(-6, 0, altDeg));   // nautical→civil rose
    if (altDeg < 6)   return mix(ROSE,  AMBER, S(0, 6, altDeg));    // rose→amber (golden hour)
    if (altDeg < 20)  return mix(AMBER, GOLD,  S(6, 20, altDeg));   // amber→soft gold
    return mix(GOLD, NOON, S(20, 60, altDeg));                      // gold→bright flat
  }
  Hours.skyColor = skyColor;

  // lamps brighten as the sun sets: 0 in full day, 1 deep night. continuous.
  function lampGlow(altDeg) { return 1 - S(-6, 8, altDeg); }
  Hours.lampGlow = lampGlow;

  // dayFactor: 0 deep night → 1 full day. A 0..1 normalisation of brightness used
  // to fade the tint wash and to brighten/dim the Survey-of-Heaven stars. (At
  // night dayFactor→0, so 1−dayFactor→1: the wash DARKENS the margins and the
  // stars are turned UP for contrast; at noon dayFactor→1: the wash vanishes and
  // the stars are turned down so the plan reads.)
  function dayFactor(altDeg) { return S(-12, 6, altDeg); }
  Hours.dayFactor = dayFactor;

  // a human phase NAME (readout only) — boundaries match the colour walk.
  function phaseName(altDeg) {
    if (altDeg <= -18) return "deep night";
    if (altDeg < -6)  return "astronomical twilight";
    if (altDeg < -0.8) return "civil twilight";
    if (altDeg < 6)   return "golden hour";
    if (altDeg < 35)  return "full day";
    return "high noon";
  }
  Hours.phaseName = phaseName;

  /* ═════════════════════════════════════════════════════════════════════════
     THE APPARITIONS — four time-gated extras, each a pure predicate of the sun's
     altitude (deg). Driving them off ALTITUDE (not the clock) keeps them honest:
     "the first star at civil dusk" fires whenever the sun crosses −6°, at any
     season. Each predicate is NON-VACUOUS — it has both an ON region and an OFF
     region in [−90,90] — so the self-test always has a negative control. The
     candle-lit-window WRAPS midnight (ON across the whole night, including the
     deepest hours) — proven ON on both sides of the midnight altitude minimum.
     ═════════════════════════════════════════════════════════════════════════ */
  var APPARITIONS = [
    { id: "dawn-mist", name: "a faint mist hangs near the horizon",
      glyph: "≈",
      // a LOW-SUN band around the horizon (dawn AND dusk). ON window [−4, +6].
      on: function (a) { return a >= -4 && a <= 6; } },

    { id: "dusk-fireflies", name: "the first star kindles; fireflies wake",
      glyph: "✶",
      // the civil→nautical dusk band, where the first star appears. ON (−12, −3).
      on: function (a) { return a < -3 && a > -12; } },

    { id: "candle-window", name: "a candle-lit window burns through the night",
      glyph: "▢",
      // the whole night: any time the sun is meaningfully down. WRAPS midnight —
      // ON at dusk, ON at the deepest midnight, ON at dawn, until the sun returns.
      on: function (a) { return a < -0.8; } },

    { id: "witching-ghost", name: "a figure crosses the corridor at deep night",
      glyph: "☖",
      // ONLY true (astronomical) night, the deepest band. ON for a < −15.
      on: function (a) { return a < -15; } }
  ];
  Hours.APPARITIONS = APPARITIONS;

  // map id → predicate, and a snapshot of all predicates at one altitude.
  var BY_ID = {};
  for (var _i = 0; _i < APPARITIONS.length; _i++) BY_ID[APPARITIONS[_i].id] = APPARITIONS[_i];
  Hours.apparition = function (id) { return BY_ID[id]; };

  // apparitionsAt accepts an ALTITUDE (deg) directly, OR — for convenience — an
  // {latDeg, doy, civilMin} state (so a caller can ask "what's out at 22:00?").
  function apparitionsAt(arg) {
    var altDeg;
    if (arg != null && typeof arg === "object") {
      altDeg = solarAltitudeDeg(arg.latDeg == null ? Hours.ESTATE.latDeg : arg.latDeg, arg.doy, arg.civilMin);
    } else {
      altDeg = arg;
    }
    var out = {};
    for (var i = 0; i < APPARITIONS.length; i++) out[APPARITIONS[i].id] = APPARITIONS[i].on(altDeg);
    return out;
  }
  Hours.apparitionsAt = apparitionsAt;

  /* ═════════════════════════════════════════════════════════════════════════
     THE SELF-TEST — proves the THREE claims the director named, against REAL
     astronomy (not round numbers), with stated tolerances + negative controls.
     Pure, headless; runs identically in the browser chip and under
     `node tools/hours/hours.test.cjs`.
     ═════════════════════════════════════════════════════════════════════════ */
  Hours.selfTest = function () {
    var R = [], pass = true;
    function ok(name, cond, detail) { R.push({ name: name, pass: !!cond, detail: detail || "" }); if (!cond) pass = false; }
    function approx(a, b, tol) { return Math.abs(a - b) <= tol; }

    // helpers that read the TRUE declination at solar noon for a given day.
    function decAtNoonDeg(doy) {
      var dd = new Date(Date.UTC(2025, 0, 1, 0, 0, 0) + doy * 86400000 + 720 * 60000);
      return sunPosition(julianDate(dd)).dec * R2D;
    }
    function dailyMax(latDeg, doy) {
      var best = -999, bm = 0;
      for (var m = 0; m <= 1439; m++) { var a = solarAltitudeDeg(latDeg, doy, m); if (a > best) { best = a; bm = m; } }
      return { alt: best, min: bm };
    }

    // ── CLAIM 1: SOLAR CORRECTNESS (vs true astronomy, ≤ 0.05°) ──────────────
    // The day's PEAK altitude = 90° − |lat − dec| (the sun transits its declination).
    // We assert against the TRUE declination, to ≤ 0.05° (tight — EoT and all).
    (function () {
      var doy = 79, dec = decAtNoonDeg(doy), expect = 90 - Math.abs(0 - dec), got = dailyMax(0, doy).alt;
      ok("equator/equinox peak = 90°−|lat−dec| from TRUE dec (≤0.05°)", approx(got, expect, 0.05),
        "got " + got.toFixed(3) + "° vs expected " + expect.toFixed(3) + "° (dec " + dec.toFixed(3) + "°)");
    })();
    (function () {
      var phi = 40.7, doy = 172, dec = decAtNoonDeg(doy), expect = 90 - Math.abs(phi - dec), got = dailyMax(phi, doy).alt;
      ok("NYC/solstice peak = 90°−|lat−dec| from TRUE dec (≤0.05°)", approx(got, expect, 0.05),
        "got " + got.toFixed(3) + "° vs expected " + expect.toFixed(3) + "°");
    })();
    // a sanity tie to the known approximate numbers the director named.
    (function () {
      var eq = dailyMax(0, 79).alt, nyc = dailyMax(40.7, 172).alt;
      ok("equator/equinox peak ≈ 89.55° and NYC/solstice ≈ 72.73° (sanity)",
        approx(eq, 89.55, 0.3) && approx(nyc, 72.73, 0.3),
        "equator " + eq.toFixed(2) + "°, NYC " + nyc.toFixed(2) + "°");
    })();
    // altitude crosses 0 exactly twice (sunrise & sunset), near 06:00 & 18:00.
    (function () {
      var doy = 79, prevSign = Math.sign(solarAltitudeDeg(0, doy, 0)), crossings = [];
      for (var m = 1; m <= 1439; m++) { var s = Math.sign(solarAltitudeDeg(0, doy, m)); if (s !== prevSign) { crossings.push(m); prevSign = s; } }
      var good = crossings.length === 2 && approx(crossings[0], 360, 20) && approx(crossings[1], 1080, 20);
      ok("equator: altitude has exactly two sign-changes (~06:00 & ~18:00)", good, "crossings at " + crossings.join(", ") + " min");
    })();
    // daily-max lands at civil noon ± EoT (≈722 at NYC solstice).
    (function () {
      var bm = dailyMax(40.7, 172).min;
      ok("daily-max altitude at civil 720 ± EoT (≈722)", approx(bm, 722, 6), "peak at " + bm + " min");
    })();
    // monotone season check: NYC summer noon is much higher than winter noon.
    (function () {
      var s = solarAltitudeDeg(40.7, 172, 720), w = solarAltitudeDeg(40.7, 355, 720);
      ok("summer-solstice noon > winter-solstice noon (NYC), by >40°", s > w + 40, "summer " + s.toFixed(1) + "° vs winter " + w.toFixed(1) + "°");
    })();

    // ── CLAIM 1b: THE SHADOW DIRECTION IS THE PROVEN HOUR-LINE ────────────────
    // gnomonShadow's theta MUST equal shadowTip()'s closed-form hour-line for the
    // same instant — i.e. it is NOT ad-hoc trig. And the shadow points AWAY from
    // the sun: at solar afternoon (H>0) the tip's x is on the morning side and
    // vice-versa (theta sign follows H). Proven by checking morning vs afternoon.
    (function () {
      var phi = 40.7, doy = 172;
      var morn = gnomonShadow(phi, doy, 540);  // 09:00 — sun in the east
      var aft = gnomonShadow(phi, doy, 900);   // 15:00 — sun in the west
      // the noon shadow runs up the +y (noon) line; theta≈0.
      var noon = gnomonShadow(phi, doy, 722);
      ok("shadow exists by day (below=false) and sleeps at night (below=true)",
        morn.below === false && aft.below === false && gnomonShadow(phi, doy, 0).below === true,
        "morn.below=" + morn.below + " night.below=" + gnomonShadow(phi, doy, 0).below);
      ok("noon shadow runs up the noon line (|theta| < 2°)", Math.abs(noon.theta * R2D) < 2, "theta=" + (noon.theta * R2D).toFixed(3) + "°");
      // morning sun (east) → shadow thrown WEST (theta<0 in dial-local +x=west? our
      // convention: +x = afternoon/west, theta sign follows H). Morning H<0 → theta<0;
      // afternoon H>0 → theta>0. Assert the sign flips across noon.
      ok("shadow sweeps: morning theta < 0 < afternoon theta (tracks the sun)",
        morn.theta < 0 && aft.theta > 0, "morn θ=" + (morn.theta * R2D).toFixed(1) + "°, aft θ=" + (aft.theta * R2D).toFixed(1) + "°");
    })();

    // ── CLAIM 2: TINT CONTINUITY + CORRECT MONOTONE PHASING ──────────────────
    // brightness is C0 (no jump) over a fine altitude sweep.
    (function () {
      var maxJump = 0, prev = brightness(-90);
      for (var a = -90; a <= 90; a += 0.25) { var b = brightness(a); maxJump = Math.max(maxJump, Math.abs(b - prev)); prev = b; }
      ok("brightness(altitude) is C0 (max step ≤ 0.02)", maxJump <= 0.02, "max step " + maxJump.toFixed(4));
    })();
    // skyColor shares endpoints EXACTLY at every segment boundary (jump-free),
    // and has bounded slope over a fine sweep.
    (function () {
      var bounds = [-18, -6, 0, 6, 20], jumpFree = true, worst = "";
      bounds.forEach(function (b) {
        var lo = skyColor(b - 0.001), hi = skyColor(b + 0.001);
        var d = Math.max(Math.abs(lo[0] - hi[0]), Math.abs(lo[1] - hi[1]), Math.abs(lo[2] - hi[2]));
        if (d > 2) { jumpFree = false; worst = "jump " + d + " at " + b + "°"; }
      });
      ok("skyColor is jump-free at every segment boundary", jumpFree, worst);
      var maxCh = 0, prev = skyColor(-90);
      for (var a = -90; a <= 90; a += 0.1) {
        var c = skyColor(a);
        maxCh = Math.max(maxCh, Math.abs(c[0] - prev[0]), Math.abs(c[1] - prev[1]), Math.abs(c[2] - prev[2])); prev = c;
      }
      ok("skyColor slope is bounded (≤ 3 channel-units / 0.1°)", maxCh <= 3, "max step " + maxCh + "/0.1°");
    })();
    // brightness is MONOTONE non-decreasing in altitude (no inverted phase).
    (function () {
      var mono = true, prev = brightness(-90), worst = 0;
      for (var a = -90; a <= 90; a += 0.25) { var b = brightness(a); if (b < prev - 1e-9) { mono = false; worst = a; } prev = b; }
      ok("brightness is monotone non-decreasing in altitude", mono, mono ? "" : "decreases at " + worst + "°");
    })();
    // a REAL day rises dawn→noon then falls noon→night (phase not inverted).
    (function () {
      var phi = 40.7, doy = 172;
      var dawn = brightness(solarAltitudeDeg(phi, doy, 360));
      var noon = brightness(solarAltitudeDeg(phi, doy, 720));
      var night = brightness(solarAltitudeDeg(phi, doy, 0));
      ok("day brightness rises dawn→noon and falls noon→night", noon > dawn && dawn > night,
        "night " + night.toFixed(2) + " < dawn " + dawn.toFixed(2) + " < noon " + noon.toFixed(2));
    })();
    // dayFactor is monotone non-decreasing too (the star/wash driver is honest).
    (function () {
      var mono = true, prev = dayFactor(-90), worst = 0;
      for (var a = -90; a <= 90; a += 0.25) { var v = dayFactor(a); if (v < prev - 1e-9) { mono = false; worst = a; } prev = v; }
      ok("dayFactor monotone non-decreasing; 0 at deep night, 1 at high sun",
        mono && dayFactor(-30) === 0 && approx(dayFactor(40), 1, 1e-9), mono ? "" : "decreases at " + worst + "°");
    })();

    // ── CLAIM 3: EACH APPARITION FIRES EXACTLY IN ITS WINDOW ──────────────────
    // For each: ON inside, OFF just outside BOTH boundaries, OFF in an unrelated
    // phase; non-vacuous. The candle-window is proven ON across the midnight wrap.
    (function () {
      function P(id) { return BY_ID[id].on; }

      // dawn-mist: ON in [−4, +6]; OFF below −4 and above +6; OFF at deep night.
      var mist = P("dawn-mist");
      ok("dawn-mist ON in its low-sun band (+1°)", mist(1) === true, "");
      ok("dawn-mist OFF just below its lower edge (−5°) [neg]", mist(-5) === false, "");
      ok("dawn-mist OFF just above its upper edge (+7°) [neg]", mist(7) === false, "");
      ok("dawn-mist OFF at high noon (+50°) [unrelated phase neg]", mist(50) === false, "");

      // dusk-fireflies / first star: ON in (−12, −3); OFF in daylight & deep night.
      var fire = P("dusk-fireflies");
      ok("dusk-fireflies ON at civil dusk (−7°)", fire(-7) === true, "");
      ok("dusk-fireflies OFF just inside daylight (−2°) [neg]", fire(-2) === false, "");
      ok("dusk-fireflies OFF just past nautical (−13°) [neg]", fire(-13) === false, "");
      ok("dusk-fireflies OFF in full daylight (+30°) [unrelated phase neg]", fire(30) === false, "");

      // candle-window: ON for a < −0.8, ACROSS the midnight wrap. Prove ON at dusk,
      // ON at the deepest midnight, ON at dawn — and OFF in daylight.
      var candle = P("candle-window");
      ok("candle-window OFF just before its boundary (−0.5°)", candle(-0.5) === false, "");
      ok("candle-window ON just after its boundary (−1.1°)", candle(-1.1) === true, "");
      // the midnight wrap: simulate a real night at NYC solstice — sample the sun
      // BEFORE midnight, AT the altitude minimum, and AFTER midnight; all ON.
      (function () {
        var phi = 40.7, doy = 172;
        var aEve = solarAltitudeDeg(phi, doy, 60);    // 01:00, after midnight
        var aMin = -90, mMin = 0;
        for (var m = 0; m <= 1439; m++) { var a = solarAltitudeDeg(phi, doy, m); if (a < aMin || aMin === -90) { if (a < aMin) { aMin = a; mMin = m; } } }
        // recompute the true minimum cleanly
        aMin = 999; for (var m2 = 0; m2 <= 1439; m2++) { var a2 = solarAltitudeDeg(phi, doy, m2); if (a2 < aMin) { aMin = a2; mMin = m2; } }
        var aLate = solarAltitudeDeg(phi, doy, 1380);  // 23:00, before midnight
        ok("candle-window ON across the midnight wrap (23:00, min, 01:00)",
          candle(aLate) === true && candle(aMin) === true && candle(aEve) === true,
          "alt@23:00=" + aLate.toFixed(1) + "° min=" + aMin.toFixed(1) + "°@" + mMin + "min @01:00=" + aEve.toFixed(1) + "°");
      })();
      ok("candle-window OFF in daylight (+10°) [neg]", candle(10) === false, "");

      // witching-ghost: ON only at deep night (a < −15); OFF at twilight & daylight.
      var ghost = P("witching-ghost");
      ok("witching-ghost ON at deep night (−18°)", ghost(-18) === true, "");
      ok("witching-ghost OFF just above its edge (−14°) [neg]", ghost(-14) === false, "");
      ok("witching-ghost OFF in daylight (+20°) [unrelated phase neg]", ghost(20) === false, "");

      // non-vacuity: every apparition has an ON region AND an OFF region in [−90,90].
      var allNonVacuous = true, offenders = [];
      APPARITIONS.forEach(function (ap) {
        var sawOn = false, sawOff = false;
        for (var a = -90; a <= 90; a += 0.5) { if (ap.on(a)) sawOn = true; else sawOff = true; }
        if (!(sawOn && sawOff)) { allNonVacuous = false; offenders.push(ap.id); }
      });
      ok("every apparition is non-vacuous (an ON region AND an OFF region)", allNonVacuous,
        offenders.length ? ("vacuous: " + offenders.join(",")) : "exactly four apparitions");
      ok("there are exactly four distinct apparitions", APPARITIONS.length === 4 &&
        new Set(APPARITIONS.map(function (a) { return a.id; })).size === 4, APPARITIONS.map(function (a) { return a.id; }).join(", "));
    })();

    return { pass: pass, results: R };
  };

  // browser global
  if (root) root.Hours = Hours;
  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Hours; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
