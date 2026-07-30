#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   aurora.test.mjs — the Node twin of THE NORTHERN LIGHT.

     node lodestone-hall/the-northern-light/aurora.test.mjs

   Everything the room says out loud is re-derived here from the same file the
   page runs.  Where a number can be checked against something nobody in this
   repo chose — the US Standard Atmosphere, the published stopping altitudes,
   an analytic integral — it is, and the residual is printed rather than
   swallowed.  Where it cannot, the test proves the INTERNAL law instead
   (energy closes, the ratio is monotone, the filter is exact) and the page
   says plainly that the level is an anchor.

   Prints "aurora self-test: N/N PASS" and exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
import * as A from './aurora.mjs';
import { cie1931 } from '../../tools/spectrum/wavelength.mjs';
const cieY = (lam) => cie1931(lam)[1];

let pass = 0, fail = 0;
const results = [];
function ok(name, cond, detail) {
  if (cond) { pass++; results.push('  ok   ' + name + (detail ? '   ' + detail : '')); }
  else { fail++; results.push('  FAIL ' + name + (detail ? '   ' + detail : '')); }
}
function near(name, got, want, tol, unit) {
  const d = Math.abs(got - want);
  ok(name, d <= tol, '(' + fmt(got) + ' vs ' + fmt(want) + ' ' + (unit || '') + ', |d| ' + fmt(d) + ' <= ' + fmt(tol) + ')');
}
function fmt(v) {
  if (v === 0) return '0';
  const a = Math.abs(v);
  return (a < 1e-3 || a >= 1e5) ? v.toExponential(3) : v.toPrecision(5);
}
function section(t) { results.push(''); results.push('── ' + t); }

const atm = A.buildAtmosphere(1000);

/* ─────────────────────────────────────────────────────────────────────────
   1. THE ATMOSPHERE — out of sample against the US Standard Atmosphere 1976.

   Nothing above 120 km is tabulated here: the three species are integrated
   in diffusive equilibrium through a Bates temperature profile from anchors
   at 120 km.  USSA76's own mass-density column is an INDEPENDENT number (it
   was not used to build anything above the anchor), so agreement over two
   and a half decades is a real check on the integration, the temperatures
   and the composition together.
   ───────────────────────────────────────────────────────────────────────── */
section('the atmosphere (out of sample vs US Standard Atmosphere 1976)');
const USSA = [                 // km, mass density in kg/m3
  [100, 5.604e-7], [110, 9.708e-8], [120, 2.222e-8], [150, 2.076e-9],
  [200, 2.541e-10], [250, 6.073e-11], [300, 1.916e-11], [400, 2.803e-12],
  [500, 5.215e-13],
];
let worst = 0, worstZ = 0;
for (const [z, rhoSI] of USSA) {
  const got = A.sampleAt(atm.rho, atm, z), want = rhoSI * 1e-3;   // -> g/cm3
  const rel = Math.abs(got / want - 1);
  if (rel > worst) { worst = rel; worstZ = z; }
}
ok('mass density tracks USSA76 from 100 to 500 km within 12%',
   worst < 0.12, '(worst ' + (worst * 100).toFixed(1) + '% at ' + worstZ + ' km)');
ok('and it is a five-decade span, not a local agreement',
   A.sampleAt(atm.rho, atm, 100) / A.sampleAt(atm.rho, atm, 500) > 1e5,
   '(ratio ' + (A.sampleAt(atm.rho, atm, 100) / A.sampleAt(atm.rho, atm, 500)).toExponential(2) + ')');

/* the integrator is self-consistent: the local log-slope of each species is
   exactly the diffusive-equilibrium prediction m g /kT + T'/T */
{
  let wmax = 0, who = '';
  for (const [k, m] of [['N2', 28.0134], ['O2', 31.9988], ['O', 15.9994]]) {
    for (const z of [200, 300, 400, 500]) {
      const i = Math.round(A.atmIndex(atm, z));
      const slope = (Math.log(atm[k][i + 1]) - Math.log(atm[k][i - 1])) / 2;   // per km
      const T = A.tempAt(z, 1000);
      const dT = (A.tempAt(z + 0.5, 1000) - A.tempAt(z - 0.5, 1000));
      const want = -((m * A.AMU * A.gAt(z) / (A.KB * T)) * 1000 + dT / T);
      const rel = Math.abs(slope / want - 1);
      if (rel > wmax) { wmax = rel; who = k + '@' + z; }
    }
  }
  ok('every species obeys its own barometric law to 1e-4', wmax < 1e-4,
     '(worst ' + wmax.toExponential(2) + ' at ' + who + ')');
}

/* the exospheric temperature is a real dial and it puffs the thermosphere up */
{
  const cold = A.buildAtmosphere(700), hot = A.buildAtmosphere(1300);
  const r = A.sampleAt(hot.rho, hot, 300) / A.sampleAt(cold.rho, cold, 300);
  ok('solar max puffs the thermosphere: 300 km density up more than 5x from Tinf 700 to 1300 K',
     r > 5, '(x' + r.toFixed(1) + ')');
  ok('and it barely touches 100 km, which is below the Bates profile',
     Math.abs(A.sampleAt(hot.rho, hot, 100) / A.sampleAt(cold.rho, cold, 100) - 1) < 1e-12);
}

/* ─────────────────────────────────────────────────────────────────────────
   2. THE BEAM — the dissipation function, and the one thing it must do.

   Lambda(x) is derived in aurora.mjs from the range law + CSDA + an isotropic
   pitch-angle distribution, and the derivation ends in a proof that its
   integral is exactly 1: every electron deposits every joule it carries.
   That proof is worth nothing if the quadrature does not honour it.
   ───────────────────────────────────────────────────────────────────────── */
section('the beam');
{
  // integrate with dyadic panels crowding x -> 1, where Lambda has an
  // infinite derivative (it vanishes like (1-x)^0.6)
  const GL = A.gaussLegendre(40);
  let acc = 0, a = 0;
  const edges = [];
  for (let k = 1; k <= 22; k++) edges.push(1 - Math.pow(2, -k));
  edges.push(1);
  for (const b of edges) {
    const h = b - a;
    for (let i = 0; i < GL.x.length; i++) acc += GL.w[i] * h * A.lambdaNorm(a + h * GL.x[i]);
    a = b;
  }
  near('the dissipation function integrates to 1 — the analytic closure, honoured by the quadrature', acc, 1, 1e-6);
}
{
  const x0 = A.lambdaPeakX();
  ok('Lambda is finite at the top of the atmosphere and equals 2/n there',
     Math.abs(A.lambdaNorm(1e-9) - 2 / A.RANGE_N) < 1e-6,
     '(' + A.lambdaNorm(1e-9).toFixed(6) + ' vs ' + (2 / A.RANGE_N).toFixed(6) + ')');
  ok('and it peaks inside the range, not at the end of it', x0 > 0.05 && x0 < 0.5,
     '(x* = ' + x0.toFixed(4) + ')');
  ok('Lambda is zero past the range', A.lambdaNorm(1.0) === 0 && A.lambdaNorm(1.5) === 0);
}
{
  // total deposition in the column must equal the incident energy flux, for a
  // Maxwellian too (which is a sum over bins, each of which closes separately)
  let wmax = 0;
  for (const E0 of [0.3, 1, 3, 10, 30]) {
    for (const mono of [true, false]) {
      const eps = A.deposition(atm, { E0keV: E0, QergCm2S: 1, mono });
      let s = 0;
      for (let i = 0; i < atm.n - 1; i++) s += 0.5 * (eps[i] + eps[i + 1]) * atm.dz * 1e5;
      const rel = Math.abs(s / A.ERG_EV - 1);
      if (rel > wmax) wmax = rel;
    }
  }
  ok('the column absorbs the whole beam to better than 1% on the room own 1 km grid',
     wmax < 0.01, '(worst ' + (wmax * 100).toFixed(2) + '%)');
}
{
  // the range law, and where it puts the electrons.  The reference numbers are
  // the classic Rees monoenergetic peak-ionisation altitudes.  This room does
  // NOT model backscatter or angular diffusion, both of which push deposition
  // UPWARD, so it must land low — and it must land low CONSISTENTLY, which is
  // a much sharper statement than "close".
  const REES = [[1, 180], [3, 140], [10, 110], [30, 95]];   // the range law is fitted below ~50 keV
  let below = 0, wmax = 0;
  const rows = [];
  for (const [E, zRef] of REES) {
    const m = A.measure(atm, { E0keV: E, QergCm2S: 1, mono: true });
    const d = m.peakDeposit - zRef;
    if (d < 0) below++;
    if (Math.abs(d) > wmax) wmax = Math.abs(d);
    rows.push(E + ' keV ' + m.peakDeposit.toFixed(0) + '/' + zRef);
  }
  ok('peak deposition altitude is within 25 km of the published curve at every energy',
     wmax <= 25, '(' + rows.join(', ') + ')');
  ok('and it is BELOW it at every energy — the direction the missing backscatter predicts',
     below === REES.length, '(' + below + '/' + REES.length + ')');
}
{
  // harder electrons go deeper: strictly, over the whole dial
  let mono = true, prev = 1e9;
  for (let E = 0.3; E <= 60; E *= 1.15) {
    const z = A.measure(atm, { E0keV: E, QergCm2S: 1, mono: true }).peakDeposit;
    if (z > prev) mono = false;
    prev = z;
  }
  ok('harder electrons stop lower, strictly, across the whole dial', mono);
}

/* ─────────────────────────────────────────────────────────────────────────
   3. QUENCHING — the room's spine.
   ───────────────────────────────────────────────────────────────────────── */
section('quenching: the lifetime decides the altitude');
{
  const g = A.EMIT[0], r = A.EMIT[1], v = A.EMIT[2], p = A.EMIT[3];
  const qAt = (em, z) => A.quenchFactor(em, atm, Math.round(A.atmIndex(atm, z)));

  ok('630.0 nm is more than 90% quenched at 200 km', qAt(r, 200) < 0.10,
     '(survives ' + (qAt(r, 200) * 100).toFixed(1) + '%)');
  ok('...and more than half survives by 300 km', qAt(r, 300) > 0.5,
     '(survives ' + (qAt(r, 300) * 100).toFixed(1) + '%)');
  ok('557.7 nm survives at 110 km where the red is long dead', qAt(g, 110) > 0.95,
     '(' + (qAt(g, 110) * 100).toFixed(1) + '% vs red ' + (qAt(r, 110) * 1e6).toFixed(2) + ' ppm)');
  ok('and 557.7 is itself losing at 90 km', qAt(g, 90) < 0.75,
     '(survives ' + (qAt(g, 90) * 100).toFixed(1) + '%)');
  ok('nothing up here can quench a 65 ns state', qAt(v, 90) > 0.9999 && A.quenchAltitude(v, atm) === null);
  ok('nor a 6 microsecond one', qAt(p, 90) > 0.99 && A.quenchAltitude(p, atm) === null);

  // THE ARRHENIUS FACTOR IS LOAD-BEARING.  Using the 300 K rate coefficient at
  // the 187 K mesopause moves the green line's floor by tens of kilometres.
  const hotRate = { key: 'x', target: 'O', eff: 1, tau: 0.75, lines: [[557.7, 1]],
                    quench: { O2: () => 4.0e-12, O: () => 2.0e-14 } };
  const zHot = A.quenchAltitude(hotRate, atm);
  const cold = qAt(g, zHot);
  ok('the room-temperature rate would put the green floor 20+ km higher',
     zHot > 105 && cold > 0.9,
     '(300 K rate: half-quenched at ' + zHot.toFixed(0) + ' km, where the real rate still passes '
     + (cold * 100).toFixed(0) + '%)');
}

/* ─────────────────────────────────────────────────────────────────────────
   4. THE COLOUR LADDER — the claim a visitor can see.
   ───────────────────────────────────────────────────────────────────────── */
section('the ladder: soft electrons make a red sky, hard ones a green one');
{
  let monotone = true, prev = Infinity;
  const es = [];
  for (let E = 0.2; E <= 25; E *= 1.12) es.push(E);
  for (const E of es) {
    const rg = A.measure(atm, { E0keV: E, QergCm2S: 1 }).ratioRG;
    if (rg > prev) monotone = false;
    prev = rg;
  }
  const lo = A.measure(atm, { E0keV: 0.2, QergCm2S: 1 }).ratioRG;
  const hi = A.measure(atm, { E0keV: 25, QergCm2S: 1 }).ratioRG;
  ok('I(630)/I(557) falls strictly as the beam hardens, over ' + es.length + ' steps', monotone);
  ok('and it spans three orders of magnitude across the dial', lo / hi > 500,
     '(' + lo.toFixed(3) + ' at 0.2 keV -> ' + hi.toFixed(4) + ' at 25 keV, x' + (lo / hi).toFixed(0) + ')');
}
{
  // THE BARTH MECHANISM.  The green is made by energy transfer from N2(A), so
  // its production follows the NITROGEN fraction — which is why it has a
  // ceiling at all.  Target atomic oxygen instead (nine tenths of the air at
  // 300 km) and the green climbs with altitude and the whole sky comes out
  // yellow.  This is the check that keeps that from creeping back.
  const p = A.emissionProfiles(atm, { E0keV: 1.5, QergCm2S: 6 });
  let peak = 0;
  for (let i = 0; i < atm.n; i++) peak = Math.max(peak, p['557'][i]);
  const hi = p['557'][Math.round(A.atmIndex(atm, 300))];
  ok('the green has a CEILING: at 300 km it is under a thousandth of its peak',
     hi / peak < 1e-3, '(' + (hi / peak).toExponential(2) + ' of peak)');
  ok('and the green is quenched from below too: a quarter survives at 80 km',
     A.quenchFactor(A.EMIT[0], atm, Math.round(A.atmIndex(atm, 80))) < 0.35,
     '(' + (A.quenchFactor(A.EMIT[0], atm, Math.round(A.atmIndex(atm, 80))) * 100).toFixed(0) + '%)');
  const zq = A.quenchAltitude(A.EMIT[1], atm);
  ok('so the two of them can never occupy the same air: half-quench heights 85 and 295 km',
     zq > 250 && Math.abs(A.quenchAltitude(A.EMIT[0], atm) - 85) < 6,
     '(green ' + A.quenchAltitude(A.EMIT[0], atm).toFixed(0) + ', red ' + zq.toFixed(0) + ')');
}
{
  // the emission peaks sit in the observed order, and the violet is the tracer
  // for hard precipitation because nothing can quench it
  const m = A.measure(atm, { E0keV: 5, QergCm2S: 3 });
  ok('at 5 keV the red floats above the green, which floats above the violet',
     m.peakRed > m.peakGreen && m.peakGreen > m.peakViolet,
     '(' + m.peakRed.toFixed(0) + ' > ' + m.peakGreen.toFixed(0) + ' > ' + m.peakViolet.toFixed(0) + ' km)');
  ok('the green arc sits between 100 and 130 km for a typical discrete arc',
     m.peakGreen >= 100 && m.peakGreen <= 130, '(' + m.peakGreen.toFixed(0) + ' km)');
}
{
  // linearity: the whole emission model is linear in the flux, so IBC classes
  // are a pure restatement of the energy flux and nothing else
  const a = A.measure(atm, { E0keV: 3, QergCm2S: 1 }).I['557'];
  const b = A.measure(atm, { E0keV: 3, QergCm2S: 7 }).I['557'];
  near('brightness is exactly linear in energy flux', b / a, 7, 1e-9);
  ok('and 1 erg/cm2/s of a 2 keV Maxwellian is about a kilorayleigh of green — the anchor',
     Math.abs(A.measure(atm, { E0keV: 2, QergCm2S: 1 }).I['557'] / 1000 - 1) < 0.05,
     '(' + (A.measure(atm, { E0keV: 2, QergCm2S: 1 }).I['557'] / 1000).toFixed(3) + ' kR)');
}
{
  // ionisation bookkeeping: every 35 eV is one ion pair, no more and no less
  const m = A.measure(atm, { E0keV: 4, QergCm2S: 2.5 });
  near('the ionisation column is the energy flux divided by 35 eV',
       m.ionColumn, 2.5 * A.ERG_EV / A.EV_PER_ION_PAIR, 2.5 * A.ERG_EV / A.EV_PER_ION_PAIR * 1e-2);
}

/* ─────────────────────────────────────────────────────────────────────────
   5. THE CLOCK — the same lifetime, seen in time instead of altitude.
   ───────────────────────────────────────────────────────────────────────── */
section('the clock: green keeps up, red cannot');
{
  // the exponential update must be EXACT for constant production — it is the
  // closed-form solution of dN/dt = P - N/tau, so this is a check that the
  // code says what the algebra says, at a step size no explicit scheme would
  // survive (dt = 40 tau).
  const k = A.makeKinetics(atm, { levels: [110] });
  const P = {}; for (const em of A.EMIT) P[em.key] = [1];
  const tau = A.effLifetime(A.EMIT[0], atm, Math.round(A.atmIndex(atm, 110)));
  k.step(40 * tau, P);
  near('one step of 40 lifetimes lands exactly on the steady state',
       k.pop['557'][0], tau, tau * 1e-12);
}
{
  // measured rise time at a single level == the effective lifetime there
  const zs = [110, 250];
  const k = A.makeKinetics(atm, { levels: zs });
  const P = {}; for (const em of A.EMIT) P[em.key] = zs.map(() => 1);
  const dt = 0.002;
  const tauG = A.effLifetime(A.EMIT[0], atm, Math.round(A.atmIndex(atm, 110)));
  const tauR = A.effLifetime(A.EMIT[1], atm, Math.round(A.atmIndex(atm, 250)));
  let tG = null, tR = null, t = 0;
  for (let i = 0; i < 400000; i++) {
    k.step(dt, P); t += dt;
    if (tG === null && k.pop['557'][0] >= 0.632120558 * tauG) tG = t;
    if (tR === null && k.pop['630'][1] >= 0.632120558 * tauR) tR = t;
    if (tG !== null && tR !== null) break;
  }
  near('green reaches 1-1/e in its own effective lifetime at 110 km', tG, tauG, dt * 1.5, 's');
  near('red reaches 1-1/e in its own effective lifetime at 250 km', tR, tauR, dt * 1.5 + tauR * 1e-9, 's');
  ok('and the red is more than twenty times slower than the green at the altitude each lives at',
     tauR / tauG > 20, '(' + tauG.toFixed(2) + ' s vs ' + tauR.toFixed(1) + ' s, x' + (tauR / tauG).toFixed(0) + ')');
}
{
  // the whole column, driven by a step: green tracks, red lags and outstays
  const k = A.makeKinetics(atm);
  const prof = A.emissionProfiles(atm, { E0keV: 2, QergCm2S: 5 });
  const prod = {}, zero = {};
  for (const em of A.EMIT) {
    prod[em.key] = k.idx.map((i) => prof[em.key][i] / A.quenchFactor(em, atm, i));
    zero[em.key] = k.idx.map(() => 0);
  }
  const dt = 0.25, tr = [];
  let t = 0;
  const col = (key) => { const e = k.emission(key); let s = 0; for (let j = 0; j < e.length; j++) s += e[j]; return s; };
  for (let i = 0; i < 800; i++) { k.step(dt, t < 60 ? prod : zero); t += dt; tr.push([t, col('557'), col('630')]); }
  const gmax = Math.max(...tr.map((r) => r[1])), rmax = Math.max(...tr.map((r) => r[2]));
  const first = (c, f) => { for (const r of tr) if (c(r) >= f) return r[0]; return null; };
  const gRise = first((r) => r[1], 0.632 * gmax), rRise = first((r) => r[2], 0.632 * rmax);
  ok('a step-on beam lights the green column in under a second', gRise < 1.0, '(' + gRise + ' s)');
  ok('and the red column takes more than ten', rRise > 10, '(' + rRise + ' s)');
  const i60 = Math.round(60 / dt);
  const gAfter = tr[i60 + 8][1] / tr[i60][1], rAfter = tr[i60 + 8][2] / tr[i60][2];
  ok('two seconds after the beam stops the green is gone and the red is still there',
     gAfter < 0.1 && rAfter > 0.7,
     '(green ' + (gAfter * 100).toFixed(1) + '%, red ' + (rAfter * 100).toFixed(0) + '%)');
}

/* ─────────────────────────────────────────────────────────────────────────
   6. THE COLOUR ITSELF — the observer, the gamut, and the eye.
   ───────────────────────────────────────────────────────────────────────── */
section('the colour, and what a screen can do with it');
{
  const chrom = (key) => {
    const o = {}; o[key] = 1;
    const [X, Y, Z] = A.spectrumXYZ(o, 'camera', 0), s = X + Y + Z;
    return [X / s, Y / s];
  };
  const g = chrom('557');
  near('557.7 nm lands where the CIE locus puts it in x', g[0], 0.360, 0.012);
  near('...and in y', g[1], 0.637, 0.012);
  ok('which is a YELLOW-green, not the emerald of the photographs — x is above 0.34',
     g[0] > 0.34);
  const r = chrom('630');
  near('the red doublet lands on the far red end of the locus', r[0], 0.714, 0.015);

  const cg = A.channelColour('557', 'camera');
  ok('and no screen can show it: the green needs real desaturation to fit sRGB',
     cg.desat > 0.10, '(desaturated ' + (cg.desat * 100).toFixed(1) + '% towards white)');
  const cv = A.channelColour('428', 'camera');
  ok('the violet is worse still', cv.desat > cg.desat,
     '(' + (cv.desat * 100).toFixed(1) + '%)');
}
{
  // photons vs power: a rayleigh counts photons and the eye answers to energy.
  // Dropping the hc/lambda weight is a silent 40% error between the violet and
  // the deep red, so the test measures that it is actually applied.
  const a = A.spectrumXYZ({ '428': 1 }, 'camera', 0)[1];
  const b = A.spectrumXYZ({ '428': 1 }, 'camera', 0);
  const wantRatio = (A.HC_NM_EV / 427.8) / (A.HC_NM_EV / 630.0);
  const yBlue = a / (1 * cieY(427.8));
  const yRed = A.spectrumXYZ({ '630': 1 }, 'camera', 0)[1]
             / (0.755 * cieY(630.0) + 0.245 * cieY(636.4));
  near('a violet photon is weighted 1.47x a red one, because it carries that much more energy',
       yBlue / yRed, wantRatio, 0.02);
  ok('(and the tristimulus is a real vector, not a scalar)', b[0] > 0 && b[2] > b[0]);
}
{
  // the eye vs the camera: same sky, and the red goes out
  const m = A.measure(atm, { E0keV: 0.4, QergCm2S: 3 });
  const cam = A.colourOf(m.I, 'camera'), eye = A.colourOf(m.I, 'eye');
  ok('a faint red-dominant sky is coloured to a camera and nearly colourless to an eye',
     cam.rgb[1] / Math.max(1e-9, cam.rgb[2]) > 3 && eye.rod > 0.5,
     '(rod fraction ' + eye.rod.toFixed(2) + ')');
  const bright = A.measure(atm, { E0keV: 3, QergCm2S: 100 });
  ok('and a great storm gets its colour back', A.colourOf(bright.I, 'eye').rod < 0.2,
     '(rod fraction ' + A.colourOf(bright.I, 'eye').rod.toFixed(2) + ')');
  // the relative weight the eye gives the red line
  const wRed = A.scotopicV(630.0) / cieY(630.0), wGreen = A.scotopicV(557.7) / cieY(557.7);
  ok('to a dark-adapted eye the red line is worth about a tenth of what a camera gives it',
     wRed / wGreen > 0.05 && wRed / wGreen < 0.2,
     '(x' + (wRed / wGreen).toFixed(3) + ' relative to the green)');
  ok('an aurora is dimmer than the night sky it hangs in: a 1 kR arc is under 1e-3 cd/m2',
     A.luminanceCd({ '557': 1000 }) < 1e-3,
     '(' + A.luminanceCd({ '557': 1000 }).toExponential(2) + ' cd/m2)');
}

/* ─────────────────────────────────────────────────────────────────────────
   7. THE PICTURE — the GPU is handed this table and nothing else.
   ───────────────────────────────────────────────────────────────────────── */
section('the lookup the renderer draws');
{
  const lut = A.buildLUT(atm, { E0keV: 6, QergCm2S: 8 }, 'camera');
  ok('the table covers 80 to 420 km in ' + lut.n + ' slabs', lut.n === A.LUT_N && lut.z0 === 80);
  let bad = 0;
  for (let i = 0; i < lut.rgb.length; i++) if (!isFinite(lut.rgb[i]) || lut.rgb[i] < 0) bad++;
  ok('every entry is finite and non-negative', bad === 0, '(' + bad + ' bad)');
  // the hard beam's table must be brightest low down; the soft beam's high up
  const bandMean = (l, z0, z1) => {
    let s = 0, k = 0;
    for (let i = 0; i < l.n; i++) {
      const z = l.z0 + (l.z1 - l.z0) * (i + 0.5) / l.n;
      if (z >= z0 && z < z1) { s += l.rgb[i * 3] + l.rgb[i * 3 + 1] + l.rgb[i * 3 + 2]; k++; }
    }
    return s / Math.max(1, k);
  };
  const soft = A.buildLUT(atm, { E0keV: 0.4, QergCm2S: 8 }, 'camera');
  const hard = A.buildLUT(atm, { E0keV: 12, QergCm2S: 8 }, 'camera');
  ok('a soft beam puts its light high and a hard one puts it low, in the table itself',
     bandMean(soft, 220, 340) / bandMean(soft, 95, 130) >
     bandMean(hard, 220, 340) / bandMean(hard, 95, 130) * 50,
     '(soft high/low ' + (bandMean(soft, 220, 340) / bandMean(soft, 95, 130)).toFixed(3)
     + ' vs hard ' + (bandMean(hard, 220, 340) / bandMean(hard, 95, 130)).toExponential(2) + ')');
  // and the red band of the table is redder up top than down low
  const hue = (l, z) => {
    const i = Math.min(l.n - 1, Math.max(0, Math.floor((z - l.z0) / (l.z1 - l.z0) * l.n)));
    return l.rgb[i * 3] / Math.max(1e-30, l.rgb[i * 3 + 1]);
  };
  ok('and the top of the curtain is redder than its middle', hue(soft, 300) > hue(soft, 120) * 2,
     '(R/G ' + hue(soft, 300).toFixed(2) + ' at 300 km vs ' + hue(soft, 120).toFixed(2) + ' at 120 km)');
}

/* the file the page inlines into a String.raw must hold no backtick */
section('housekeeping');
{
  const src = await (await import('node:fs/promises')).readFile(new URL('./aurora.mjs', import.meta.url), 'utf8');
  ok('aurora.mjs contains no backtick (it is inlined into a String.raw)',
     src.indexOf(String.fromCharCode(96)) === -1);
  const rend = await (await import('node:fs/promises')).readFile(new URL('./render.js', import.meta.url), 'utf8')
    .catch(() => '');
  if (rend) {
    ok('render.js never re-implements the physics: no rate coefficient, no range law',
       !/5\.36e-6|1\.67|116\.6|4\.0e-12/.test(rend.replace(/\/\*[\s\S]*?\*\//g, '')));
  }
}

console.log(results.join('\n'));
console.log('');
console.log('aurora self-test: ' + pass + '/' + (pass + fail) + ' PASS');
if (fail) { console.log(fail + ' FAILED'); process.exit(1); }
