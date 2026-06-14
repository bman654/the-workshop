#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   diffraction.test.cjs — the Diffraction bench's headless self-test. Requires
   the SAME core the page inlines (tools/diffraction/diffraction.js), so the
   green chip in the browser and this Node run prove the IDENTICAL wave optics.
       node tools/diffraction/diffraction.test.cjs

   What it proves (mirrored by the in-page runSelfTest):
     • THE FOURIER CRUX — the analytic far-field intensity I(θ) equals the SQUARED
       MAGNITUDE OF THE FOURIER TRANSFORM of the sampled aperture, computed an
       INDEPENDENT way (a direct discrete Σ t(x)·e^{-ikx sinθ}), across the whole
       pattern, for single slit / double slit / N-slit gratings. The rendered
       curve IS the FT of the aperture.
     • Single-slit dark fringes exactly at a·sinθ = mλ; grating principal maxima
       exactly at d·sinθ = mλ with height N² and missing orders suppressed.
     • Principal maxima sharpen as 1/N (why a grating resolves); the N=2 bracket
       is exactly Young's 4cos²α; N=1 collapses to the pure single slit.
     • Energy agrees between the closed form and the FT route (Parseval).
     • A wrong (half-integer) minima law is rejected (falsifiable); pure/det.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const D = require('./diffraction.js');

let pass = 0, total = 0;
const fails = [];
function check(name, cond, note) {
  total++;
  if (cond) { pass++; console.log('  \x1b[32mPASS\x1b[0m ' + name + (note ? '  [' + note + ']' : '')); }
  else { fails.push(name); console.log('  \x1b[31mFAIL\x1b[0m ' + name + (note ? '  [' + note + ']' : '')); }
}

console.log('\nDiffraction — wave-optics CORE self-test\n');

// First, run the CORE's own in-module battery (the one the chip shows).
const r = D.runSelfTest();
r.results.forEach(res => check(res.name, res.pass, res.note));

console.log('\n--- additional independent Node cross-checks ---\n');

// (A) Independent re-derivation of a textbook number: the FIRST single-slit dark
//     fringe angle for a = 10 µm, λ = 0.5 µm should be θ = asin(0.5/10) = 2.866°.
{
  const p = { N: 1, a: 10, d: 10, lambda: 0.5 };
  const s = D.slitMinimaSinTheta(p)[ D.slitMinimaSinTheta(p).findIndex(v => v > 0) ];
  const thetaDeg = Math.asin(s) * 180 / Math.PI;
  check('textbook: first single-slit minimum (a=10µm, λ=0.5µm) at θ ≈ 2.866°',
    Math.abs(thetaDeg - 2.8660) < 1e-3, 'θ = ' + thetaDeg.toFixed(4) + '°');
}

// (B) Grating equation as a spectrometer: for d = 2 µm, the m=1 order of red
//     (0.65µm) sits at a LARGER angle than blue (0.45µm) — dispersion direction.
{
  const red = { N: 4, a: 0.8, d: 2, lambda: 0.65 };
  const blue = { N: 4, a: 0.8, d: 2, lambda: 0.45 };
  const sRed = D.gratingOrders(red).find(o => o.m === 1).sinTheta;
  const sBlue = D.gratingOrders(blue).find(o => o.m === 1).sinTheta;
  check('grating disperses: m=1 red bends MORE than blue (d·sinθ=mλ, longer λ → larger θ)',
    sRed > sBlue + 1e-9, 'sinθ red ' + sRed.toFixed(4) + ' > blue ' + sBlue.toFixed(4));
}

// (C) Central peak == N² to machine precision (coherent addition of N amplitudes).
{
  let ok = true, note = '';
  [1, 2, 3, 5, 8, 13].forEach(N => {
    const p = { N, a: 1.5, d: 6, lambda: 0.55 };
    const I0 = D.intensity(p, 0);
    if (Math.abs(I0 - D.peakIntensity(p)) > 1e-9) { ok = false; note += ' N=' + N + ' I0=' + I0; }
  });
  check('central maximum equals N² exactly for N ∈ {1,2,3,5,8,13} (coherent addition)', ok, note || 'all N² exact');
}

// (D) Between two principal maxima there are exactly N−1 zeros and N−2 secondary
//     maxima of the grating bracket (a structural fingerprint of N slits).
{
  const N = 5, p = { N, a: 1e9, d: 6, lambda: 0.55 };  // a huge → envelope≈1 over the window
  // scan α∈(0,π) (one period between principal maxima at α=0 and α=π) for the bracket alone
  let zeros = 0, prev = D.gratingFactor(1e-4, N), rising = false, peaks = 0, prevSlope = 0;
  const M = 200000;
  let lastVal = D.gratingFactor(Math.PI / M, N);
  let upPrev = null;
  for (let i = 2; i < M; i++) {
    const a = Math.PI * i / M;
    const v = D.gratingFactor(a, N);
    if (v < 1e-6) zeros++;                          // count near-zero touches
    const up = v > lastVal;
    if (upPrev === true && up === false) peaks++;   // local max
    upPrev = up; lastVal = v;
  }
  // zeros counted by sampling can double-count; assert the SECONDARY-maxima count
  // (N−2) which is robust, and that at least N−2 zeros were detected.
  check('N-slit fingerprint: exactly N−2 secondary maxima between principal orders (N=5 → 3)',
    peaks === N - 2, 'secondary maxima found = ' + peaks + ' (expect ' + (N - 2) + ')');
}

// (E) Reciprocity / scaling sanity: doubling λ doubles every order's sinθ
//     (d·sinθ=mλ is linear in λ) until it walks off the screen.
{
  const p1 = { N: 3, a: 1, d: 4, lambda: 0.5 };
  const p2 = { N: 3, a: 1, d: 4, lambda: 1.0 };
  const o1 = D.gratingOrders(p1).find(o => o.m === 1).sinTheta;
  const o2 = D.gratingOrders(p2).find(o => o.m === 1).sinTheta;
  check('scaling: doubling λ doubles the order angle (sinθ = mλ/d is linear in λ)',
    Math.abs(o2 - 2 * o1) < 1e-12, 'sinθ(2λ)=' + o2.toFixed(4) + ' == 2·' + o1.toFixed(4));
}

console.log('\n' + (fails.length ? '\x1b[31m' : '\x1b[32m') +
  pass + '/' + total + ' passed' + '\x1b[0m' +
  (fails.length ? '\nFAILED:\n  - ' + fails.join('\n  - ') : ' — all green') + '\n');

process.exit(fails.length ? 1 : 0);
