/* ═══════════════════════════════════════════════════════════════════════════
   dial.js — the Gnomon's proven sundial + solar CORE (the one source of truth).

   The Gnomon page (sundial/index.html) and its headless self-test
   (tools/dial/dial.test.cjs) both call THESE SAME functions — no parallel copy.
   forge inlines this file into the shipped page (via a forge:include
   directive), so the page stays self-contained while the math lives in exactly
   one place; the Node test `require()`s it directly.

   The crux: a sundial's shadow tells TRUE clock time. Given a latitude, a date,
   and a civil clock reading, this core (a) lays out the hour-lines for the dial
   in closed form, (b) places the gnomon's shadow-tip, and (c) converts between
   apparent solar time (what the shadow shows) and civil clock time (longitude
   correction + equation of time + DST) — and the conversion ROUND-TRIPS to the
   second. Skins are cosmetic; they never move a line. The geometry fingerprint
   is byte-identical across skins and identical in the browser and under Node.

   The solar functions (julianDate, gmstDeg, lstDeg, EPS, sunEclipticLonDeg,
   solarDec, solarRA, sunPosition) are COPIED VERBATIM from astrolabe/index.html's
   CORE so the two instruments share one proven solar model. Angles are in
   radians unless a name says *Deg. Vanilla, ES5-ish, zero-dependency, DOM-free.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Dial = {};

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var EPS = 23.4392911 * D2R;            // obliquity of the ecliptic (J2000-ish)
  var TAU = Math.PI * 2;
  function clamp1(x) { return Math.max(-1, Math.min(1, x)); }

  Dial.D2R = D2R; Dial.R2D = R2D; Dial.EPS = EPS; Dial.TAU = TAU;

  /* ─────────────────────────────────────────────────────────────────────────
     TIME & SUN — copied VERBATIM from the Astrolabe's CORE.
     ───────────────────────────────────────────────────────────────────────── */

  // Julian Date from a UTC Date.
  function julianDate(d) { return d.getTime() / 86400000 + 2440587.5; }

  // Greenwich Mean Sidereal Time (deg) from JD.
  function gmstDeg(jd) {
    var g = 280.46061837 + 360.98564736629 * (jd - 2451545.0);
    g = ((g % 360) + 360) % 360;
    return g;
  }

  // Local Sidereal Time (deg) = GMST + east longitude.
  function lstDeg(jd, lonEastDeg) { return ((gmstDeg(jd) + lonEastDeg) % 360 + 360) % 360; }

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

  Dial.julianDate = julianDate;
  Dial.gmstDeg = gmstDeg;
  Dial.lstDeg = lstDeg;
  Dial.sunEclipticLonDeg = sunEclipticLonDeg;
  Dial.solarDec = solarDec;
  Dial.solarRA = solarRA;
  Dial.sunPosition = sunPosition;

  /* ─────────────────────────────────────────────────────────────────────────
     DATE / STATE HELPERS — the sundial reasons in (latitude, longitude, time-
     zone, day-of-year, civil minutes). The civil clock of a zone whose standard
     meridian is `tzOffsetMin` west/east of Greenwich is converted to a UTC Date.
     ───────────────────────────────────────────────────────────────────────── */

  // Build a UTC Date from (year, dayOfYear 0-based, civil minutes-of-day,
  // tzOffsetMin). tzOffsetMin is the zone's offset from UTC in MINUTES (e.g.
  // US-Eastern standard = -300). DST is handled by the caller (it adds 60 to the
  // civil clock the human reads; we keep the zone offset fixed and let the AST↔
  // civil conversion below subtract the DST hour). So: UTC = civil − tzOffset.
  function civilToDate(year, dayOfYear, civilMin, tzOffsetMin) {
    var base = Date.UTC(year, 0, 1, 0, 0, 0);
    var ms = base + dayOfYear * 86400000 + civilMin * 60000 - tzOffsetMin * 60000;
    return new Date(ms);
  }

  // The day-of-year (0..364) of a UTC Date, relative to Jan 1 of its year.
  function dayOfYearOf(d) {
    var y = d.getUTCFullYear();
    return Math.floor((d.getTime() - Date.UTC(y, 0, 1, 0, 0, 0)) / 86400000);
  }

  Dial.civilToDate = civilToDate;
  Dial.dayOfYearOf = dayOfYearOf;

  /* ─────────────────────────────────────────────────────────────────────────
     EQUATION OF TIME — apparent solar time minus mean solar time, in MINUTES.
       EoT = apparent − mean = 4·(L − α)   [deg → minutes, 4 min per degree]
     where L is the Sun's mean ecliptic longitude and α its apparent right
     ascension (both reckoned from the vernal equinox). Positive EoT means the
     real Sun is AHEAD of the mean Sun (a true sundial reads later than the
     clock). Normalised to (−20, +20) min. Reaches ≈+16.4 min near Nov 3 and
     ≈−14.2 min near Feb 11, crossing zero near Apr 16 / Jun 13 / Sep 2 / Dec 25.
     ───────────────────────────────────────────────────────────────────────── */

  // Sun's mean ecliptic longitude (deg), normalised — the "mean Sun".
  function meanLonDeg(jd) {
    var n = jd - 2451545.0;
    return (((280.460 + 0.9856474 * n) % 360) + 360) % 360;
  }

  // Equation of time (minutes) from JD.
  function equationOfTimeMin(jd) {
    var L = meanLonDeg(jd);
    var lam = sunEclipticLonDeg(jd) * D2R;
    var ra = solarRA(lam) * R2D;
    var e = 4 * (L - ra);
    // fold into (−20, +20): the L−α difference can wrap by a full turn (1440 min)
    while (e > 20) e -= 1440;
    while (e < -20) e += 1440;
    return e;
  }

  Dial.meanLonDeg = meanLonDeg;
  Dial.equationOfTimeMin = equationOfTimeMin;

  /* ─────────────────────────────────────────────────────────────────────────
     APPARENT SOLAR TIME ↔ CIVIL CLOCK
     The shadow shows APPARENT solar time (AST): solar noon = the Sun on the
     meridian, hour angle H = 0. The civil clock differs by three corrections:
       • longitude:  the zone clock runs on its standard meridian (tz·15°). Each
                     degree the observer sits EAST of that meridian advances real
                     solar time by 4 min → AST = civil_mean + (lon − tzMer)·4.
       • EoT:        apparent − mean → AST = mean + EoT.
       • DST:        the clock is bumped +60 min in summer.
     Combine (civil is what the wall clock reads):
       AST = civil − DST − tzCorrection − EoT
     where tzCorrection = (tzMer − lon)·4 min  (tzMer = tzOffsetMin/60·15°).
     Inverse (used by the round-trip test):
       civil = AST + EoT + tzCorrection + DST
     All times in MINUTES of the day.
     ───────────────────────────────────────────────────────────────────────── */

  // Longitude correction in minutes: how far AST leads the zone's MEAN time.
  // tzOffsetMin is the zone offset from UTC (min); its standard meridian sits at
  // tzOffsetMin/60·15° of longitude. East of it → positive (AST ahead).
  function lonCorrectionMin(lonDeg, tzOffsetMin) {
    var tzMerDeg = (tzOffsetMin / 60) * 15;
    return (lonDeg - tzMerDeg) * 4;
  }

  // Civil clock (min) → apparent solar time (min).
  function civilToAST(civilMin, lonDeg, tzOffsetMin, eotMin, dstOn) {
    return civilMin
      - (dstOn ? 60 : 0)
      - lonCorrectionMin(lonDeg, tzOffsetMin)
      - eotMin;
  }

  // Apparent solar time (min) → civil clock (min). Exact inverse of civilToAST.
  function astToCivil(astMin, lonDeg, tzOffsetMin, eotMin, dstOn) {
    return astMin
      + eotMin
      + lonCorrectionMin(lonDeg, tzOffsetMin)
      + (dstOn ? 60 : 0);
  }

  Dial.lonCorrectionMin = lonCorrectionMin;
  Dial.civilToAST = civilToAST;
  Dial.astToCivil = astToCivil;

  /* ─────────────────────────────────────────────────────────────────────────
     HOUR ANGLE — the Sun's hour angle H from apparent solar time. AST noon is
     H = 0 (Sun on the meridian); the Sun moves 15°/hour, +ve toward the
     afternoon (west). astMin is minutes of the apparent solar day.
     ───────────────────────────────────────────────────────────────────────── */
  function hourAngleFromAST(astMin) {
    // 720 min (12:00) → 0; 15°/hour = 0.25°/min.
    return (astMin - 720) * 0.25 * D2R;
  }
  // Inverse: apparent solar minutes-of-day from an hour angle H.
  function astFromHourAngle(H) {
    return 720 + (H * R2D) / 0.25;
  }

  Dial.hourAngleFromAST = hourAngleFromAST;
  Dial.astFromHourAngle = astFromHourAngle;

  /* ─────────────────────────────────────────────────────────────────────────
     HOUR-LINE ANGLES — the closed-form angle (rad, from the noon/12-o'clock
     line, +ve toward afternoon) at which the shadow of the style falls for a
     given hour angle H, by dial type. φ is the geographic latitude (rad).

       horizontal      :  θ = atan( sinφ · tanH )
       equatorial      :  θ = H                     (uniform 15°/hour, exact)
       vertical-south  :  θ = atan( cosφ · tanH )   (a south-facing wall)

     atan2 keeps the line continuous through noon and into the afternoon
     (otherwise atan wraps every quarter-turn). The sign convention: H>0
     (afternoon) → θ>0.
     ───────────────────────────────────────────────────────────────────────── */
  function hourLineAngle(dialType, H, phi) {
    if (dialType === 'equatorial') {
      return H;                                   // uniform: 15° per hour, exact
    }
    var k = (dialType === 'vertical-south') ? Math.cos(phi) : Math.sin(phi);
    // atan2(k·sinH, cosH) == atan(k·tanH) but continuous across ±90°.
    return Math.atan2(k * Math.sin(H), Math.cos(H));
  }

  Dial.hourLineAngle = hourLineAngle;

  /* ─────────────────────────────────────────────────────────────────────────
     GNOMON STYLE ANGLE — the angle (rad) the gnomon's straight edge (the
     "style") makes with the dial face. The style must point at the celestial
     pole, so:
       horizontal      :  φ            (style elevation = latitude)
       equatorial      :  90° − φ      (style ⟂ the equatorial plate, i.e. it
                          rises to the pole at the co-latitude above horizontal,
                          but stands perpendicular to its own face)
       vertical-south  :  90° − φ      (co-latitude, measured from the wall)
     We return the angle the style makes WITH THE DIAL FACE for each type.
     ───────────────────────────────────────────────────────────────────────── */
  function gnomonAngle(dialType, phi) {
    if (dialType === 'equatorial') return Math.PI / 2 - Math.abs(phi); // co-lat
    if (dialType === 'vertical-south') return Math.PI / 2 - Math.abs(phi); // co-lat
    return Math.abs(phi);                              // horizontal: = latitude
  }

  Dial.gnomonAngle = gnomonAngle;

  /* ─────────────────────────────────────────────────────────────────────────
     SUN ALTITUDE / AZIMUTH from (dec, H, φ) — standard spherical astronomy.
     Azimuth measured from NORTH, clockwise through east (0=N, 90=E, 180=S).
     (Identical formula to the Astrolabe's decHToAltAz; reproduced here so the
     dial core is self-contained.)
     ───────────────────────────────────────────────────────────────────────── */
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

  Dial.sunAltAz = sunAltAz;

  /* ─────────────────────────────────────────────────────────────────────────
     SHADOW-TIP PROJECTION — project the tip of the style (the nodus) onto the
     dial face. This is a TRUE projection: the shadow-tip's DIRECTION is the
     closed-form hour-line, and its LENGTH is the real cast length of the polar
     style's tip, which depends on the Sun's altitude (hence on the declination
     `dec` AND the hour angle `H`). That declination dependence is what gives the
     analemma its vertical extent.

     Dial-local 2-D frame: ORIGIN = foot of the style; +x → 3-o'clock (afternoon
     / west on a horizontal dial), +y → up the noon line (toward 12). `styleLen`
     is the perpendicular height of the nodus above the dial face (dial-radius
     units). For the noon line (H=0) the shadow runs straight up (+y), θ=0.

       horizontal      : the nodus sits styleLen above the plane; its shadow
                         length = styleLen / tan(alt), alt = true Sun altitude.
       vertical-south   : the wall faces due south; the relevant "altitude" is the
                         Sun's elevation above the wall plane, alt' where
                         sin(alt') = cos(alt)·cos(az−180°) (the component along the
                         wall normal). Shadow length = styleLen / tan(alt').
       equatorial      : the plate is ⟂ the polar style; the Sun's elevation above
                         the plate is |dec|, so the shadow length = styleLen /
                         tan(|dec|) — uniform around the plate (independent of H),
                         which is exactly why an equatorial dial reads uniformly.

     `dec` (rad) is optional; if omitted the length uses a clean 1/cos(H) fall-off
     (still on the correct hour-line, just declination-independent). Returns
     {x,y,r,theta,below}; `below` is true when the Sun is on the unlit side.

     The KEY INVARIANT the self-test checks: the projected tip lies EXACTLY on the
     hour-line direction hourLineAngle(type,H,φ).
     ───────────────────────────────────────────────────────────────────────── */
  function shadowTip(dialType, H, phi, styleLen, dec) {
    if (styleLen == null) styleLen = 1;
    var theta = hourLineAngle(dialType, H, phi);   // closed-form hour-line dir.
    var below, r, MAXR = 1e4;                      // cap a grazing-Sun shadow

    if (dialType === 'equatorial') {
      // shadow length ∝ 1/tan(elevation above the plate). With a declination,
      // that elevation is |dec|; without, fall back to the uniform 1/cos(H).
      if (dec != null) {
        var t = Math.tan(Math.abs(dec));
        r = (t < 1e-4) ? MAXR : styleLen / t;
      } else {
        r = styleLen / Math.max(1e-3, Math.abs(Math.cos(H)));
      }
      below = (Math.cos(H) <= 0);                  // Sun behind the plate
    } else {
      var altp;                                    // Sun elevation above the dial plane
      if (dec != null) {
        var aa = sunAltAz(dec, H, phi);
        if (dialType === 'vertical-south') {
          // component of the Sun direction along the (south-facing) wall normal
          var s = Math.cos(aa.alt) * Math.cos(aa.az - Math.PI); // az from N; S=π
          altp = Math.asin(clamp1(s));
        } else {
          altp = aa.alt;                           // horizontal: true altitude
        }
      } else {
        // declination-free fall-off, still on the hour-line
        altp = Math.atan2(Math.abs(Math.cos(H)), styleLen);
      }
      below = (altp <= 0);
      var tn = Math.tan(altp);
      r = (tn < 1e-4) ? MAXR : styleLen / tn;
    }

    return {
      x: r * Math.sin(theta),
      y: r * Math.cos(theta),
      r: r,
      theta: theta,
      below: below
    };
  }

  Dial.shadowTip = shadowTip;

  /* ─────────────────────────────────────────────────────────────────────────
     ANALEMMA — plot the shadow-tip of NOON (civil 12:00, EoT on) across a year.
     Because the civil clock is fixed at noon while EoT + the Sun's declination
     wander, the noon shadow-tip traces the figure-8 (the analemma). Returns an
     array of {day, x, y, dec, eot} sampled every `step` days.
     ───────────────────────────────────────────────────────────────────────── */
  function analemmaPoints(dialType, phi, lonDeg, tzOffsetMin, year, styleLen, step) {
    if (step == null) step = 1;
    if (styleLen == null) styleLen = 1;
    var pts = [];
    for (var d = 0; d < 365; d += step) {
      var date = civilToDate(year, d, 720, tzOffsetMin);   // civil 12:00
      var jd = julianDate(date);
      var eot = equationOfTimeMin(jd);
      var sp = sunPosition(jd);
      // AST at civil-noon, EoT applied (no DST — analemma is a standard-time fig)
      var ast = civilToAST(720, lonDeg, tzOffsetMin, eot, false);
      var H = hourAngleFromAST(ast);
      var tip = shadowTip(dialType, H, phi, styleLen, sp.dec);
      pts.push({ day: d, x: tip.x, y: tip.y, r: tip.r, dec: sp.dec, eot: eot, H: H, below: tip.below });
    }
    return pts;
  }

  Dial.analemmaPoints = analemmaPoints;

  /* ─────────────────────────────────────────────────────────────────────────
     GEOMETRY FINGERPRINT — a deterministic hash of every drawn primitive's
     geometry: the hour-line angles, the gnomon angle, and a noon shadow-tip,
     for a given state. Skin-independent by construction (it never reads skin).
     Proves style-only re-renders never move geometry.
     ───────────────────────────────────────────────────────────────────────── */
  function _h(s) { // 32-bit FNV-1a → hex
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function geometryFingerprint(state) {
    var phi = state.latDeg * D2R;
    var parts = [];
    var f = function (x) { return x.toFixed(8); };
    parts.push('TYPE', state.dialType);
    parts.push('GN', f(gnomonAngle(state.dialType, phi)));
    // hour-line angles for every whole hour 6..18
    for (var hr = 6; hr <= 18; hr++) {
      var H = hourAngleFromAST(hr * 60);
      parts.push('HL' + hr, f(hourLineAngle(state.dialType, H, phi)));
    }
    // the live shadow-tip for this state
    var date = civilToDate(state.year, state.dayOfYear, state.civilMin, state.tzOffsetMin);
    var jd = julianDate(date);
    var eot = equationOfTimeMin(jd);
    var ast = civilToAST(state.civilMin, state.lonDeg, state.tzOffsetMin, state.eotOn ? eot : 0, state.dst);
    var Hnow = hourAngleFromAST(ast);
    var sp = sunPosition(jd);
    var tip = shadowTip(state.dialType, Hnow, phi, 1, sp.dec);
    parts.push('TIP', f(tip.x), f(tip.y), f(tip.theta));
    parts.push('SUN', f(sp.dec), f(sp.ra), f(eot));
    return _h(parts.join('|'));
  }

  Dial.geometryFingerprint = geometryFingerprint;
  Dial._h = _h;

  // browser global
  if (root) root.Dial = Dial;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Dial; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
