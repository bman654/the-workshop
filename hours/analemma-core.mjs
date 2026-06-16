/* ============================================================================
   THE HOURS · ANALEMMA — analemma-core.mjs   (the SOLE solar authority for the
   bench that lets you PULL THE LOOP APART into the two clocks that make it)

   Stand under the meridian and stamp the Sun's position at clock-noon, every day
   for a year. It does not return to the same spot: it traces a slow figure-8 in
   the sky — the ANALEMMA. The loop is the visible sum of TWO disagreements between
   the real Sun and a perfect clock:

     • the TILT of the axis (obliquity ε): even on a circular orbit, projecting the
       Sun's even motion along the tilted ecliptic onto the equator speeds it up and
       slows it down twice a year → a symmetric ∞ (zero net, a balanced 8).
     • the STRETCH of the orbit (eccentricity e): the Earth races at perihelion and
       loafs at aphelion (Kepler's 2nd law), so true noon drifts ahead then behind
       once a year → a lopsided oval (one bulge, no vertical extent of its own).

   Add the two and you get the real lopsided 8 the sundial wears. This core lets a
   knob scale EACH cause independently, so you can dial the orbit round (e→0, the
   symmetric 8) or the axis straight (ε→0, the bare oval) and WATCH the loop come
   apart into its two parents.

   ── ANCHORED, NOT RE-DERIVED ──
   The Gnomon's proven dial core (tools/dial/dial.js) already owns the canonical
   sun: equationOfTimeMin / solarDec / sunEclipticLonDeg. This leaf adds the e/ε
   KNOBS the dial lacks, as a faithful PARAMETERIZATION that reduces BIT-FOR-BIT to
   dial.js at the canonical detent (eR=1, ε=EPS0). The trick that makes it exact:
   we do NOT use the textbook 2e·sin g series (it is ~5e-3 min off the dial). We
   scale the DIAL'S OWN literal equation-of-centre coefficients by an eccentricity
   ratio eR = e/E0, so at eR=1 the ecliptic longitude is byte-for-byte the dial's:

     lamDeg(jd, eR) = L0(jd) + eR·1.915·sin g + eR²·0.020·sin 2g      (L0,g = dial's)
     eotMin(jd, eR, ε) = fold4( 4·(meanLon − α) ),  α = atan2(cos ε·sin λ, cos λ)
     decDeg(jd, eR, ε) = asin( sin ε · sin λ )·R2D

   ── THE DECOMPOSITION (the playable identity) ──
   Over the SHARED λ the equation of time splits EXACTLY into the two causes:

     eccTermMin(jd, eR) = fold4( 4·(meanLon − λ) )         the orbit-only horizontal drift
     oblTermMin(jd, ε)  = fold4( 4·(λ − α) )               the tilt-only term
     eccTermMin + oblTermMin  ≡  eotMin                     (worst |Δ| = 0.0 over the year)

   The wall projection analemmaXY returns {x: EoT minutes, y: declination degrees}.
   NEGATIVE CONTROL falls straight out: eR=0 AND ε=0 → λ=L0, α=λ, EoT≡0, dec≡0 →
   every day lands on ONE point. No tilt, no stretch, no loop. That is the proof the
   loop is MADE of the two causes and nothing else.

   index.html INLINES this file byte-identical between sentinels; analemma-core.test.mjs
   runs it in Node. If the page's inline ever drifts from this file, the page's
   re-extraction parity check fails.
   ============================================================================ */

// ── constants (the bench reads these; never hardcodes the detents) ──
export const D2R = Math.PI / 180, R2D = 180 / Math.PI;
export const E0 = 0.0167;                       // real-Earth eccentricity — the eR=1 detent
export const EPS0 = 23.4392911 * D2R;            // real-Earth obliquity (rad) — the ε detent
export const YEAR = 2026;                        // the calendar the loop is stamped from

// ── Julian Date of civil-noon on day-of-year d (0..364), zone UTC, longitude 0.
//    (The analemma is a standard-time figure: same clock instant every day.) ──
export function jdOfDay(day, year = YEAR){
  return (Date.UTC(year, 0, 1, 0, 0, 0) / 86400000 + 2440587.5) + day;
}

// ── the dial's mean Sun: mean ecliptic longitude (deg), normalised. VERBATIM. ──
export function meanLonDeg(jd){
  const n = jd - 2451545.0;
  return (((280.460 + 0.9856474 * n) % 360) + 360) % 360;
}

// ── the dial's L0 (mean longitude, un-normalised) and g (mean anomaly, rad) ──
//    These are EXACTLY the intermediates inside dial.sunEclipticLonDeg. ──
export function L0Deg(jd){ const n = jd - 2451545.0; return (280.460 + 0.9856474 * n) % 360; }
export function meanAnomRad(jd){ const n = jd - 2451545.0; return ((357.528 + 0.9856003 * n) % 360) * D2R; }

// ── ecliptic longitude (deg) with the eccentricity knob eR = e/E0.
//    At eR=1 this is byte-for-byte dial.sunEclipticLonDeg(jd). At eR=0 it is the
//    mean Sun moving evenly (a perfectly circular orbit). ──
export function lamDeg(jd, eR){
  const L = L0Deg(jd), g = meanAnomRad(jd);
  const lam = L + eR * 1.915 * Math.sin(g) + eR * eR * 0.020 * Math.sin(2 * g);
  return ((lam % 360) + 360) % 360;
}

// ── fold a 4·(degree difference) into (−20, +20) minutes (it can wrap a full turn) ──
export function fold4(eMin){
  let e = eMin; while (e > 20) e -= 1440; while (e < -20) e += 1440; return e;
}

// ── right ascension (deg) of the Sun at ecliptic longitude λ under obliquity ε.
//    Quadrant-correct atan2, exactly the dial's solarRA form, normalised. ──
export function raDeg(lamDegVal, epsRad){
  const lam = lamDegVal * D2R;
  const ra = Math.atan2(Math.cos(epsRad) * Math.sin(lam), Math.cos(lam)) * R2D;
  return ((ra % 360) + 360) % 360;
}

// ── EQUATION OF TIME (minutes) with BOTH knobs: EoT = 4·(meanLon − α).
//    eR=1, ε=EPS0 ⇒ === dial.equationOfTimeMin(jd) to ~1e-13 min. ──
export function eotMin(jd, eR, epsRad){
  return fold4(4 * (meanLonDeg(jd) - raDeg(lamDeg(jd, eR), epsRad)));
}

// ── SOLAR DECLINATION (degrees) with both knobs: dec = asin(sin ε · sin λ).
//    eR=1, ε=EPS0 ⇒ === dial.solarDec(λ) to ~4e-14 deg. ε=0 ⇒ flat (dec≡0). ──
export function solarDecDeg(jd, eR, epsRad){
  const lam = lamDeg(jd, eR) * D2R;
  return Math.asin(Math.sin(epsRad) * Math.sin(lam)) * R2D;
}

// ── THE DECOMPOSITION over the SHARED λ — eccTerm + oblTerm ≡ eotMin, exactly.
//    eccTermMin: the orbit-only horizontal drift (vanishes at eR=0).
//    oblTermMin: the tilt-only term       (vanishes at ε=0). ──
export function eccTermMin(jd, eR){
  return fold4(4 * (meanLonDeg(jd) - lamDeg(jd, eR)));
}
export function oblTermMin(jd, eR, epsRad){
  return fold4(4 * (lamDeg(jd, eR) - raDeg(lamDeg(jd, eR), epsRad)));
}

// ── THE WALL PROJECTION — the touchable axes. x = EoT (minutes, +Sun ahead of the
//    clock), y = declination (degrees, +N). One day → one point on the sky-wall.
//    At (eR=0, ε=0) every day returns {0,0} → the loop collapses to one point. ──
export function analemmaXY(jd, eR, epsRad){
  return { x: eotMin(jd, eR, epsRad), y: solarDecDeg(jd, eR, epsRad) };
}

// ── a whole year of wall points, sampled every `step` days. The view draws THIS;
//    it computes no sun of its own. Each point carries its two component minutes so
//    the readout strip and the leader-line can show the gap becoming a stamp. ──
export function analemmaYear(eR, epsRad, year = YEAR, step = 1){
  const pts = [];
  for (let d = 0; d < 365; d += step){
    const jd = jdOfDay(d, year);
    pts.push({
      day: d,
      x: eotMin(jd, eR, epsRad),
      y: solarDecDeg(jd, eR, epsRad),
      ecc: eccTermMin(jd, eR),
      obl: oblTermMin(jd, eR, epsRad),
    });
  }
  return pts;
}

// ── the count of zero-crossings of EoT over the year (the 4 days the sundial and
//    the clock agree). The real loop has exactly 4; the bare oval 2; the dot 0. ──
export function zeroCrossings(eR, epsRad, year = YEAR){
  let n = 0, prev = null;
  for (let d = 0; d < 365; d++){
    const e = eotMin(jdOfDay(d, year), eR, epsRad);
    if (prev !== null && ((prev < 0 && e >= 0) || (prev > 0 && e <= 0))) n++;
    prev = e;
  }
  return n;
}

// dual-use module guard (forge/inline strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = { D2R, R2D, E0, EPS0, YEAR, jdOfDay, meanLonDeg, L0Deg, meanAnomRad, lamDeg, fold4, raDeg, eotMin, solarDecDeg, eccTermMin, oblTermMin, analemmaXY, analemmaYear, zeroCrossings }; }
