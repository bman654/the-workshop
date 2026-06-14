/* Node test for the Bragg-Stack (structural colour) CORE.
   Runs the in-CORE self-test PLUS independent cross-checks against textbook
   values that the page never sees. Requires the SAME structural-colour.js the
   page inlines (so Node and browser run identical physics).            */
'use strict';
const SC = require('./structural-colour.js');
const PI = Math.PI;

let pass = 0, total = 0, fails = [];
function ok(name, cond, note) {
  total++;
  if (cond) { pass++; console.log('  ✓', name, note ? '— ' + note : ''); }
  else { fails.push(name); console.log('  ✗', name, note ? '— ' + note : ''); }
}

console.log('\n=== Bragg-Stack CORE self-test (the same one the page runs) ===');
const st = SC.runSelfTest();
st.results.forEach(r => ok(r.name, r.pass, r.note));

console.log('\n=== Independent cross-checks (textbook values the page never sees) ===');

// (T1) Quarter-wave centre wavelength: a TiO2/SiO2 stack designed for 450 nm has
//      its (frequency-exact) band centre at 450 nm. dH=λ0/(4·nH) places it; the
//      *band function* locating the centre is the independent route. Note the
//      WAVELENGTH midpoint (e.centreLambda) is red-biased (~463nm) — the gap is
//      symmetric in 1/λ, so only the frequency-domain centre lands on 450.
{
  const p = SC.quarterWaveStack({ nH: 2.5, nL: 1.46, lambda0: 450, periods: 16 });
  const e = SC.bandGapEdges(p, 0, 's');
  ok('T1 quarter-wave stack for 450nm → frequency-exact band centre == 450nm (band theory)',
    Math.abs(e.centre - 450) < 0.1, 'centre = ' + e.centre.toFixed(3) + ' nm (wavelength midpoint = ' + e.centreLambda.toFixed(1) + 'nm, red-biased)');
}

// (T2) Fractional bandwidth closed form for a strong-contrast pair:
//      nH=2.5, nL=1.46 → Δλ/λ0 = (4/π)·asin((2.5−1.46)/(2.5+1.46)) = (4/π)·asin(0.2626)
//      = (4/π)·0.26573 = 0.33834 (≈ 34%). Check the CORE returns this.
{
  const p = SC.quarterWaveStack({ nH: 2.5, nL: 1.46, lambda0: 500, periods: 16 });
  const bw = SC.fractionalBandwidthQuarterWave(p);
  const expect = (4 / PI) * Math.asin((2.5 - 1.46) / (2.5 + 1.46));
  ok('T2 fractional bandwidth (4/π)·asin(Δn/Σn) = textbook (≈33.8% for TiO2/SiO2)',
    Math.abs(bw - expect) < 1e-12 && Math.abs(bw - 0.33834) < 1e-3,
    'Δλ/λ0 = ' + (100 * bw).toFixed(3) + '%');
}

// (T3) Measured frequency-domain band width (from the |½·tr M|=1 band edges)
//      matches the closed-form bandwidth to machine precision for several designs
//      — the two independent characterisations agree exactly in the right domain.
{
  let worst = 0;
  [[2.35, 1.38, 550], [2.0, 1.4, 520], [1.6, 1.33, 600]].forEach(([nH, nL, l0]) => {
    const p = SC.quarterWaveStack({ nH, nL, lambda0: l0, periods: 18 });
    const e = SC.bandGapEdges(p, 0, 's');
    const closed = SC.fractionalBandwidthQuarterWave(p);
    worst = Math.max(worst, Math.abs(e.fracWidth - closed) / closed);
  });
  ok('T3 measured frequency band width (from |½·tr M|=1 edges) == closed-form bandwidth (machine precision)',
    worst < 1e-4, 'worst rel err = ' + (100 * worst).toExponential(2) + '%');
}

// (T4) A single-period "stack" (periods=1) is just one HL bilayer — its reflectance
//      must be MUCH weaker than a 20-period stack at the same wavelength (the band
//      only emerges from many periods cooperating).
{
  const one = SC.quarterWaveStack({ nH: 2.35, nL: 1.38, lambda0: 550, periods: 1 });
  const many = SC.quarterWaveStack({ nH: 2.35, nL: 1.38, lambda0: 550, periods: 20 });
  const R1 = SC.reflectance(one, 550, 0, 's').R;
  const R20 = SC.reflectance(many, 550, 0, 's').R;
  ok('T4 one bilayer reflects weakly, 20 bilayers reflect ~perfectly (the band is collective)',
    R1 < 0.4 && R20 > 0.999, 'R(1)=' + R1.toFixed(3) + ', R(20)=' + R20.toFixed(4));
}

// (T5) Normal-incidence Fresnel sanity: a single interface air(1.0)|glass(1.5) gives
//      R = ((1−1.5)/(1+1.5))² = 0.04 exactly. Build a degenerate "stack" that is just
//      the substrate (periods=0 with nSub=1.5) and confirm 4% — calibrates the TMM.
{
  const p = { nH: 1.5, nL: 1.5, dH: 0, dL: 0, periods: 0, n0: 1.0, nSub: 1.5 };
  const R = SC.reflectance(p, 550, 0, 's').R;
  ok('T5 TMM calibration: air|glass single interface gives exactly 4% (Fresnel R=((n0−n)/(n0+n))²)',
    Math.abs(R - 0.04) < 1e-9, 'R = ' + R.toFixed(8));
}

// (T6) Angle blue-shift is quantitative: the band centre at 45° is bluer than at 0°,
//      and s and p polarisations both blue-shift (structural colour for either pol).
{
  const p = SC.quarterWaveStack({ nH: 2.35, nL: 1.38, lambda0: 620, periods: 14 });
  const c0s = SC.bandGapEdges(p, 0, 's').centre;
  const c45s = SC.bandGapEdges(p, 45 * PI / 180, 's').centre;
  const c45p = SC.bandGapEdges(p, 45 * PI / 180, 'p').centre;
  ok('T6 band blue-shifts with angle for both polarisations (s & p)',
    c45s < c0s - 15 && c45p < c0s - 15, '0°=' + c0s.toFixed(0) + 'nm, s@45°=' + c45s.toFixed(0) + 'nm, p@45°=' + c45p.toFixed(0) + 'nm');
}

// (T7) Determinism across the public API (already in self-test #8, re-assert at the
//      module boundary for the Node runner).
{
  const p = SC.quarterWaveStack({ nH: 2.0, nL: 1.4, lambda0: 520, periods: 12 });
  let same = true;
  for (let lam = 420; lam <= 680; lam += 13) {
    if (SC.reflectance(p, lam, 0.2, 'p').R !== SC.reflectance(p, lam, 0.2, 'p').R) same = false;
  }
  ok('T7 deterministic at the module boundary (pure functions)', same);
}

console.log('\n────────────────────────────────────────────────────────');
console.log(`Bragg-Stack CORE: ${pass}/${total} checks passed` + (pass === total ? '  ✓ ALL GREEN' : '  ✗ FAILURES'));
if (fails.length) { console.log('FAILED:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
process.exit(0);
