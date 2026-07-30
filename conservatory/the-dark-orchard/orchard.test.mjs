/* ═══════════════════════════════════════════════════════════════════════════
   THE DARK ORCHARD — the twin.        node conservatory/the-dark-orchard/orchard.test.mjs

   Every number the room prints on the screen is settled here first.
   ═══════════════════════════════════════════════════════════════════════════ */
import * as O from './orchard.mjs';

let pass = 0, fail = 0;
const F = (v, n) => (typeof v === 'number' ? v.toFixed(n === undefined ? 4 : n) : String(v));
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '   \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '   ' + (detail || '')); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
function head(s) { console.log('\n\x1b[1m' + s + '\x1b[0m'); }

const c = O.speedOfSound(20);

/* ═════ 1 · the air ══════════════════════════════════════════════════════ */
head('1 · the air');
ok('speed of sound at 20 C is 343.3 m/s', near(c, 343.26, 0.05), F(c, 2) + ' m/s');
ok('and it climbs with temperature', O.speedOfSound(35) > O.speedOfSound(5),
  F(O.speedOfSound(5), 1) + ' -> ' + F(O.speedOfSound(35), 1));

/* ISO 9613-1 Table 1, 20 C / 50 % RH, dB/km. Published anchors. */
const isoAnchor = [[125, 0.4], [250, 1.3], [500, 2.7], [1000, 4.7], [2000, 9.9], [4000, 29.7], [8000, 105]];
for (const [f, want] of isoAnchor) {
  const got = O.absorptionDbPerM(f, 20, 50) * 1000;
  ok('ISO 9613-1 at ' + f + ' Hz', near(got, want, Math.max(0.15, 0.06 * want)),
    F(got, 2) + ' dB/km vs ' + want);
}
const a40 = O.absorptionDbPerM(40000, 20, 50), a80 = O.absorptionDbPerM(80000, 20, 50);
ok('40 kHz costs about 1.3 dB every metre', near(a40, 1.32, 0.06), F(a40, 3) + ' dB/m');
ok('80 kHz costs about twice that', near(a80, 2.61, 0.12), F(a80, 3) + ' dB/m');
ok('absorption rises with frequency, every step', (() => {
  let last = 0; for (let f = 1000; f <= 120000; f += 1000) { const v = O.absorptionDbPerM(f, 20, 50); if (v <= last) return false; last = v; } return true;
})());
ok('humidity matters, and not in one direction at both ends',
  O.absorptionDbPerM(40000, 20, 15) < O.absorptionDbPerM(40000, 20, 90) &&
  O.absorptionDbPerM(4000, 20, 15) > O.absorptionDbPerM(4000, 20, 90),
  '40 kHz ' + F(O.absorptionDbPerM(40000, 20, 15), 2) + ' -> ' + F(O.absorptionDbPerM(40000, 20, 90), 2) +
  ' dB/m, 4 kHz the other way');
ok('RH is a PERCENT and the guard would have caught it',
  O.absorptionDbPerM(40000, 20, 50) / O.absorptionDbPerM(40000, 20, 0.5) > 3,
  'ratio ' + F(O.absorptionDbPerM(40000, 20, 50) / O.absorptionDbPerM(40000, 20, 0.5), 1) + 'x');

/* ═════ 2 · the mouth ════════════════════════════════════════════════════ */
head('2 · the beam');
const j1known = [[1, 0.4400505857], [2, 0.5767248078], [3, 0.3390589585], [5, -0.3275791376], [10, 0.0434727462]];
for (const [x, want] of j1known) ok('J1(' + x + ')', near(O.besselJ1(x), want, 2e-6), F(O.besselJ1(x), 8));
ok('J1 has its first zero at 3.8317', Math.abs(O.besselJ1(3.83170597)) < 2e-6);
ok('on axis the piston gain is exactly 1', near(O.pistonGain(0, 0.007, 40000, c), 1, 1e-9));
ok('the beam narrows as the call rises',
  O.pistonGain(0.35, 0.007, 80000, c) < O.pistonGain(0.35, 0.007, 40000, c),
  '20 deg off axis: ' + F(10 * Math.log10(O.pistonGain(0.35, 0.007, 40000, c)), 1) + ' dB at 40 kHz, ' +
  F(10 * Math.log10(O.pistonGain(0.35, 0.007, 80000, c)), 1) + ' dB at 80 kHz');
{
  /* the -6 dB half angle of the 40 kHz beam, for the page to quote */
  let th = 0; while (th < 1.5 && 10 * Math.log10(O.pistonGain(th, 0.007, 40000, c)) > -6) th += 0.0005;
  ok('the 40 kHz beam is a soft spotlight, not a floodlight', th * 180 / Math.PI > 12 && th * 180 / Math.PI < 32,
    '-6 dB at ' + F(th * 180 / Math.PI, 1) + ' degrees');
}

/* ═════ 3 · the orchard, as a distance field ═════════════════════════════ */
head('3 · the orchard');
ok('straight down from 3 m lands on the ground under you',
  (() => { const h = O.march(1.3, 3.0, 2.2, 0, -1, 0, null); return h.hit && near(h.t, 3.0 - O.groundHeight(1.3, 2.2), 0.01); })(),
  'ground at y=' + F(O.groundHeight(1.3, 2.2), 4));
ok('the ground normal points up', (() => { const h = O.march(1.3, 3.0, 2.2, 0, -1, 0, null); return h.ny > 0.97; })());
ok('a ray at a fence post stops at the post', (() => {
  O.setPostGap(0.40);
  const z0 = O.POST_BASE[2] + 4.0;
  const h = O.march(O.POST_BASE[0] - 0.20, 0.7, z0, 0, 0, -1, null);
  return h.hit && h.mat === O.MAT.POST && near(h.t, 4.0 - 0.055, 0.02);
})());
ok('a ray between the posts goes past them', (() => {
  const h = O.march(O.POST_BASE[0], 0.7, O.POST_BASE[2] + 4.0, 0, 0, -1, null);
  return h.hit && h.mat !== O.MAT.POST;
})());
ok('the moth is found where it is put', (() => {
  const m = [0.6, 1.4, -2.0];
  const d = Math.hypot(0.6 - 0, 1.4 - 1.5, -2.0 - 3.0);
  const u = [(0.6 - 0) / d, (1.4 - 1.5) / d, (-2.0 - 3.0) / d];
  const h = O.march(0, 1.5, 3.0, u[0], u[1], u[2], m);
  return h.hit && h.mat === O.MAT.MOTH && near(h.t, d - 0.022, 0.01);
})());
ok('every capsule row is well formed', O.CAPS.every(r => r.length === 8 && r[6] > 0 && r[7] >= 0 && r[7] <= 5),
  O.CAPS.length + ' capsules in ' + O.GROUPS.length + ' groups');
ok('every bounding sphere really bounds its group', O.GROUPS.every(g => {
  for (let i = g.from; i < g.to; i++) for (const o of [0, 3]) {
    const d = Math.hypot(O.CAPS[i][o] - g.cx, O.CAPS[i][o + 1] - g.cy, O.CAPS[i][o + 2] - g.cz);
    if (d + O.CAPS[i][6] > g.rad + 1e-9) return false;
  }
  return true;
}));
ok('the groups partition the capsule list with no gaps', (() => {
  const seen = new Set();
  for (const g of O.GROUPS) for (let i = g.from; i < g.to; i++) { if (seen.has(i)) return false; seen.add(i); }
  return seen.size === O.CAPS.length;
})());

/* the shader is generated from the same numbers */
head('3b · one scene, two languages');
{
  const src = O.sdfGLSL();
  const g = O.GROUND_COEF, w = O.WALL_BUMP;
  const allIn = [...g.map(Math.abs), ...w.map(Math.abs), O.GROUND_LIP, O.WALL.halfLen, O.WALL.thick * 0.5,
    O.MARCH.t0, O.MARCH.eps, O.MARCH.minStep, O.MARCH.tmax]
    .every(v => src.includes(String(v)) || src.includes(v.toFixed(1)));
  ok('the emitted GLSL carries every ground / wall / march constant the JS uses', allIn);
  ok('and it carries no others',
    (src.match(/[0-9]*\.[0-9]+/g) || []).every(tok =>
      [...g, ...w, O.GROUND_LIP, O.WALL.halfLen, O.WALL.thick * 0.5, O.WALL.h * 0.5, O.WALL.z,
        O.MARCH.t0, O.MARCH.eps, O.MARCH.minStep, O.MARCH.tmax, 0.0, 1.0, 0.5, 3.0, 5.0, 0.022, 1e-12]
        .some(v => Math.abs(Math.abs(v) - Math.abs(parseFloat(tok))) < 1e-12)),
    src.split('\n').length + ' lines, every literal accounted for');
  ok('the march loop the shader runs is the march loop the twin runs',
    src.includes('i < ' + O.MARCH.steps + ';') &&
    src.includes(String(O.MARCH.eps) + ' * max(1.0, t)'));
  ok('the beam shader is the same A&S polynomial as besselJ1',
    O.beamGLSL().includes('72362614232.0') && O.beamGLSL().includes('2.356194491') &&
    O.beamGLSL().includes('0.105787412'));
  ok('neither emitted shader holds a backtick (it can go in a String.raw)',
    !O.sdfGLSL().includes('`') && !O.beamGLSL().includes('`'));
}

/* ═════ 4 · delay is range ═══════════════════════════════════════════════ */
head('4 · delay is range');
{
  const bat = { pos: [0, 1.5, 3.0], fwd: [0, 0, -1], right: [1, 0, 0], up: [0, 1, 0] };
  const n = 900, half = 0.7;
  const dirs = O.capDirections(bat.fwd, bat.right, bat.up, half, n);
  const omega = O.capSolidAngle(half, n);
  const taps = O.castTaps(bat, dirs, omega, {
    c, alphaMid: a40, aMouth: 0.007, fMid: 40000, moth: null, mothTS: O.MOTH.TS, SL: 110
  });
  ok('the beam finds the orchard', taps.length > 200, taps.length + ' returns');
  ok('every tap delay is exactly 2d/c', taps.every(t => near(t.tau, 2 * t.d / c, 1e-12)));
  const post = taps.filter(t => t.mat === O.MAT.POST).sort((x, y) => x.d - y.d)[0];
  ok('the near post reads its true range off its delay',
    post && near(post.tau * c / 2, post.d, 1e-9),
    post ? F(post.tau * 1e3, 3) + ' ms -> ' + F(post.tau * c / 2, 3) + ' m' : 'no post');
  const wall = taps.filter(t => t.mat === O.MAT.STONE);
  ok('the wall stands where the wall is put',
    wall.length > 2 && near(Math.min(...wall.map(t => t.d)), 3.0 - O.WALL.z - O.WALL.thick / 2 - 0.04, 0.09),
    F(Math.min(...wall.map(t => t.d)), 3) + ' m');
  ok('nothing outside the beam gets in',
    taps.every(t => t.d > 0),
    'nearest ' + F(Math.min(...taps.map(t => t.d)), 2) + ' m, farthest ' + F(Math.max(...taps.map(t => t.d)), 2) + ' m');
}

/* ═════ 5 · time expansion is frequency division ═════════════════════════ */
head('5 · time expansion');
{
  const N = 20, sr = 48000, call = O.CALLS.fm;
  const w = O.synthCall(call, N, sr);
  ok('the slowed call is N times as long',
    near(w.length / sr, call.T * N, 1.5 / sr), F(w.length / sr, 4) + ' s for a ' + F(call.T * 1e3, 1) + ' ms call');
  /* instantaneous frequency by zero crossings over the first and last tenth */
  const zc = (i0, i1) => { let n = 0; for (let i = i0 + 1; i < i1; i++) if ((w[i - 1] < 0) !== (w[i] < 0)) n++; return n * sr / (2 * (i1 - i0)); };
  const fStart = zc(Math.round(w.length * 0.15), Math.round(w.length * 0.25));
  const fEnd = zc(Math.round(w.length * 0.75), Math.round(w.length * 0.85));
  ok('it starts at f1/N', near(fStart, ((call.f1 + (call.f2 - call.f1) * 0.20)) / N, 60),
    F(fStart, 1) + ' Hz heard = ' + F(fStart * N / 1000, 1) + ' kHz emitted');
  ok('it ends at f2/N', near(fEnd, ((call.f1 + (call.f2 - call.f1) * 0.80)) / N, 60),
    F(fEnd, 1) + ' Hz heard = ' + F(fEnd * N / 1000, 1) + ' kHz emitted');
  ok('and it never clips', Math.max(...w.map(Math.abs)) <= 1.0000001,
    'peak ' + F(Math.max(...w.map(Math.abs)), 4));
  ok('the top of the sweep stays under Nyquist at N=20', call.f1 / N < sr / 2,
    F(call.f1 / N / 1000, 2) + ' kHz vs ' + sr / 2000 + ' kHz');
}

/* ═════ 6 · the time-bandwidth trade, measured ═══════════════════════════ */
head('6 · what an FM sweep can tell apart, and a CF tone cannot');
function twoTargets(call, sepMetres, N, sr) {
  const d0 = 4.0, d1 = 4.0 + sepMetres;
  const taps = [
    { tau: 2 * d0 / c, g: 1, pan: 0, d: d0 },
    { tau: 2 * d1 / c, g: 1, pan: 0, d: d1 }
  ];
  const rx = O.renderEchoes(taps, call, { N, sr, c, TC: 20, RHpct: 50, gain: 1 });
  const tx = O.synthCall(call, N, sr);
  const mf = O.matchedFilterEnvelope(rx.L, tx);
  return O.countPeaks(mf.env, 0.35, 0.72).length;
}
{
  const N = 20, sr = 96000;
  const fm = O.CALLS.fm, cf = O.CALLS.cf;
  const resFM = O.rangeResolution(fm, c), resCF = O.rangeResolution(cf, c);
  ok('the FM sweep should resolve ' + F(resFM * 1000, 1) + ' mm  (c/2B, B=' + F(O.callBandwidth(fm) / 1000, 0) + ' kHz)',
    near(resFM, 0.0039, 0.0004), F(resFM * 1000, 2) + ' mm');
  ok('the CF tone should resolve ' + F(resCF, 1) + ' m  (B = 1/T = ' + F(O.callBandwidth(cf), 1) + ' Hz)',
    resCF > 8 && resCF < 13, F(resCF, 2) + ' m');
  ok('FM, posts 4x its limit apart: two peaks', twoTargets(fm, 4 * resFM, N, sr) === 2,
    F(4 * resFM * 1000, 1) + ' mm -> ' + twoTargets(fm, 4 * resFM, N, sr) + ' peak(s)');
  ok('FM, posts a third of its limit apart: one peak', twoTargets(fm, resFM / 3, N, sr) === 1,
    F(resFM / 3 * 1000, 2) + ' mm -> ' + twoTargets(fm, resFM / 3, N, sr) + ' peak(s)');
  ok('FM, at 40 cm (the posts in the room): two peaks', twoTargets(fm, 0.40, N, sr) === 2);
  ok('CF, at the SAME 40 cm: one peak, and it is metres wide',
    twoTargets(cf, 0.40, N, sr) === 1, twoTargets(cf, 0.40, N, sr) + ' peak(s)');
  ok('CF cannot do it at 2 m either', twoTargets(cf, 2.0, N, sr) === 1);
  /* and the other side of the trade */
  ok('the CF tone is the one that measures speed',
    O.velocityResolution(cf, c) < O.velocityResolution(fm, c) / 15,
    'CF ' + F(O.velocityResolution(cf, c), 3) + ' m/s vs FM ' + F(O.velocityResolution(fm, c), 2) + ' m/s');
  /* The honest version of "you cannot have both": the two resolutions trade
     against the TIME-BANDWIDTH PRODUCT, not against each other. A plain tone
     has BT = 1 and sits on the bound; a sweep has BT = 132 and buys range
     resolution 132x past what its own duration would allow, for free. That is
     pulse compression, and it is why almost every bat sweeps. */
  const BTfm = O.callBandwidth(fm) * fm.T, BTcf = O.callBandwidth(cf) * cf.T;
  ok('a plain tone has a time-bandwidth product of exactly 1', near(BTcf, 1, 1e-12), 'BT = ' + F(BTcf, 6));
  ok('the sweep has BT = ' + F(BTfm, 0), near(BTfm, 132, 1), 'BT = ' + F(BTfm, 1));
  ok('and the two resolution products differ by exactly that factor', (() => {
    const pf = O.rangeResolution(fm, c) * O.velocityResolution(fm, c);
    const pc = O.rangeResolution(cf, c) * O.velocityResolution(cf, c);
    /* pf/pc = (c/2B_f)(c/2 f T_f) / (c/2B_c)(c/2 f T_c) = (B_c T_c)/(B_f T_f) */
    return near((pc / pf) / (BTfm / BTcf), 1, 0.02);
  })(), 'FM ' + F(O.rangeResolution(fm, c) * O.velocityResolution(fm, c), 5) +
    ' vs CF ' + F(O.rangeResolution(cf, c) * O.velocityResolution(cf, c), 5) +
    ' m^2/s, ratio ' + F((O.rangeResolution(cf, c) * O.velocityResolution(cf, c)) /
      (O.rangeResolution(fm, c) * O.velocityResolution(fm, c)), 1) + ' = BT');
  ok('the compressed sweep is BT times shorter than the pulse that carried it',
    near((c * fm.T / 2) / O.rangeResolution(fm, c), BTfm, 0.5),
    F(c * fm.T / 2, 2) + ' m of pulse -> ' + F(O.rangeResolution(fm, c) * 1000, 1) + ' mm of answer');
}

/* ═════ 7 · the flutter ══════════════════════════════════════════════════ */
head('7 · the flutter, which only the long call can hear');
function amFrequency(sig, sr, cutLo, cutHi) {
  /* Hilbert envelope of the flat middle of the pulse, then its own spectrum */
  const i0 = Math.round(sig.length * cutLo), i1 = Math.round(sig.length * cutHi);
  let n = 1; while (n < (i1 - i0)) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < i1 - i0; i++) re[i] = sig[i0 + i];
  O.fft(re, im, false);
  for (let i = 1; i < n / 2; i++) { re[i] *= 2; im[i] *= 2; }
  for (let i = n / 2 + 1; i < n; i++) { re[i] = 0; im[i] = 0; }
  O.fft(re, im, true);
  const env = new Float64Array(n);
  let mean = 0;
  for (let i = 0; i < i1 - i0; i++) { env[i] = Math.hypot(re[i], im[i]); mean += env[i]; }
  mean /= (i1 - i0);
  const er = new Float64Array(n), ei = new Float64Array(n);
  for (let i = 0; i < i1 - i0; i++) er[i] = (env[i] - mean) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (i1 - i0)));
  O.fft(er, ei, false);
  let best = 0, bi = 0;
  for (let i = 2; i < n / 2; i++) { const m = Math.hypot(er[i], ei[i]); if (m > best) { best = m; bi = i; } }
  return { f: bi * sr / n, depth: best / (mean * (i1 - i0) / 4 + 1e-12) };
}
{
  const N = 20, sr = 48000;
  const moth = [{ tau: 2 * 3.0 / c, g: 1, pan: 0, d: 3.0, isMoth: true }];
  const opts = { N, sr, c, TC: 20, RHpct: 50, gain: 1, mothWingHz: O.MOTH.wingHz, mothWingPhase: 0, mothMod: 0.6 };
  const cf = O.renderEchoes(moth, O.CALLS.cf, opts);
  const got = amFrequency(cf.L, sr, 0.30, 0.92);
  ok('inside one 60 ms CF call the wingbeat is right there',
    near(got.f, O.MOTH.wingHz / N, 0.35),
    'read ' + F(got.f, 3) + ' Hz heard = ' + F(got.f * N, 1) + ' Hz wingbeat (true ' + O.MOTH.wingHz + ')');
  ok('the CF call holds several wingbeats', O.CALLS.cf.T * O.MOTH.wingHz > 2,
    F(O.CALLS.cf.T * O.MOTH.wingHz, 2) + ' beats per call');
  ok('the FM call holds a fraction of one, so there is nothing in it to read',
    O.CALLS.fm.T * O.MOTH.wingHz < 0.2, F(O.CALLS.fm.T * O.MOTH.wingHz, 3) + ' beats per call');
  /* pulse-to-pulse, an FM bat samples the wingbeat and aliases it */
  const rate = 10;
  const K = 512, series = new Float64Array(K);
  for (let i = 0; i < K; i++) series[i] = Math.cos(2 * Math.PI * O.MOTH.wingHz * i / rate);
  const re = new Float64Array(K), im = new Float64Array(K);
  for (let i = 0; i < K; i++) re[i] = series[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / K));
  O.fft(re, im, false);
  let best = 0, bi = 0;
  for (let i = 1; i < K / 2; i++) { const m = Math.hypot(re[i], im[i]); if (m > best) { best = m; bi = i; } }
  const apparent = bi * rate / K;
  const foldTo = Math.abs(O.MOTH.wingHz - rate * Math.round(O.MOTH.wingHz / rate));
  ok('an FM bat calling 10 times a second sees the 45 Hz wingbeat as ' + F(foldTo, 0) + ' Hz',
    near(apparent, foldTo, 0.4), 'measured ' + F(apparent, 2) + ' Hz');
}

/* ═════ 8 · the asymmetry that is the whole hunt ═════════════════════════ */
head('8 · the moth hears you first');
{
  const SL = 110, alpha = a40, TS = O.MOTH.TS, Lm = O.MOTH.threshold, Lb = 10;
  const rMoth = O.mothHearsAt(SL, alpha, Lm);
  const rBat = O.batHearsAt(SL, alpha, TS, Lb);
  ok('at a full 110 dB shout the moth hears you at about 10 m',
    rMoth > 8 && rMoth < 14, F(rMoth, 2) + ' m');
  ok('you hear the moth at about 4', rBat > 2.5 && rBat < 6, F(rBat, 2) + ' m');
  ok('so the moth gets a head start', rMoth > 2 * rBat,
    F(rMoth / rBat, 2) + 'x, about ' + F((rMoth - rBat) / 5.0, 1) + ' s of warning at 5 m/s');
  ok('the level equations are what they say they are',
    near(O.levelAt(SL, 1, 0), SL - 20, 1e-9) &&
    near(O.echoLevel(SL, 1, 0, TS), SL - 20 + TS, 1e-9),
    'at 1 m: outgoing ' + F(O.levelAt(SL, 1, 0), 1) + ' dB, echo ' + F(O.echoLevel(SL, 1, 0, TS), 1) + ' dB');
  ok('one-way loses 20 dB a decade, two-way loses 40',
    near(O.levelAt(SL, 10, 0) - O.levelAt(SL, 1, 0), -20, 1e-6) &&
    near(O.echoLevel(SL, 10, 0, TS) - O.echoLevel(SL, 1, 0, TS), -40, 1e-6));

  /* THE CLAIM: whispering closes the gap, and below ~80 dB it reverses. */
  const exact = O.crossoverSLExact(Lm, Lb, TS);
  ok('with no absorption the crossover is closed form: SL = 2Lm - Lb + TS + 20',
    near(exact, 80, 1e-9), F(exact, 1) + ' dB');
  ok('and bisection on the same two laws agrees',
    near(O.crossoverSL(0, Lm, Lb, TS), exact, 0.02), F(O.crossoverSL(0, Lm, Lb, TS), 3) + ' dB');
  const real = O.crossoverSL(alpha, Lm, Lb, TS);
  ok('with real air it moves a little, and stays in the whispering bats band',
    real > 74 && real < 86, F(real, 1) + ' dB re 20 uPa at 0.1 m');
  ok('above the crossover the moth wins, below it you do', (() => {
    const above = real + 12, below = real - 12;
    return O.mothHearsAt(above, alpha, Lm) > O.batHearsAt(above, alpha, TS, Lb) &&
      O.mothHearsAt(below, alpha, Lm) < O.batHearsAt(below, alpha, TS, Lb);
  })(),
    'at ' + F(real - 12, 0) + ' dB you see it at ' + F(O.batHearsAt(real - 12, alpha, TS, Lb), 2) +
    ' m and it hears you at ' + F(O.mothHearsAt(real - 12, alpha, Lm), 2) + ' m');
  ok('the gap closes monotonically as you get quieter', (() => {
    let last = Infinity;
    for (let sl = 120; sl >= 84; sl -= 2) {
      const g = O.mothHearsAt(sl, alpha, Lm) - O.batHearsAt(sl, alpha, TS, Lb);
      if (g > last + 1e-9) return false; last = g;
    }
    return true;
  })(), '120 dB: ' + F(O.mothHearsAt(120, alpha, Lm) - O.batHearsAt(120, alpha, TS, Lb), 1) +
    ' m  ->  84 dB: ' + F(O.mothHearsAt(84, alpha, Lm) - O.batHearsAt(84, alpha, TS, Lb), 1) + ' m');
  /* the room prices the air at the sweep's OWN midpoint, 60 kHz, and prints
     these two numbers on the panel — so the twin owns them, not the prose. */
  {
    const a60 = O.absorptionDbPerM(60000, 20, 50);
    const rm = O.mothHearsAt(SL, a60, Lm), rb = O.batHearsAt(SL, a60, TS, Lb);
    ok('the two numbers the panel prints at 110 dB: 8.4 m and 4.0 m',
      near(rm, 8.43, 0.06) && near(rb, 4.03, 0.06),
      F(rm, 2) + ' m against ' + F(rb, 2) + ' m, a factor of ' + F(rm / rb, 2));
    ok('and the crossover barely moves when you price the air differently',
      near(O.crossoverSL(a60, Lm, Lb, TS), O.crossoverSL(a40, Lm, Lb, TS), 0.5),
      F(O.crossoverSL(a60, Lm, Lb, TS), 1) + ' dB at 60 kHz, ' + F(O.crossoverSL(a40, Lm, Lb, TS), 1) + ' at 40');
  }

  ok('the moth reacts off the same equation the echo uses', (() => {
    const r = O.mothResponse(SL, rMoth, alpha, O.MOTH);
    const inside = O.mothResponse(SL, rMoth * 0.9, alpha, O.MOTH);
    const outside = O.mothResponse(SL, rMoth * 1.1, alpha, O.MOTH);
    return near(r.lvl, Lm, 0.05) && inside.state !== 'calm' && outside.state === 'calm';
  })());
  ok('and it dives, not just turns, when you are close', (() => {
    const dPanic = O.mothHearsAt(SL, alpha, O.MOTH.panic);
    return O.mothResponse(SL, dPanic * 0.8, alpha, O.MOTH).state === 'dive' && dPanic < rMoth;
  })(), 'dive inside ' + F(O.mothHearsAt(SL, alpha, O.MOTH.panic), 2) + ' m');
}

/* ═════ 9 · how far you can see at all ═══════════════════════════════════ */
head('9 · the depth of the world');
{
  for (const [rh, lo, hi] of [[15, 8, 13], [50, 5, 9], [90, 5, 9]]) {
    const al = O.absorptionDbPerM(60000, 20, rh);
    const r = O.batHearsAt(110, al, -20, 10);
    ok('at ' + rh + ' % humidity a hard target fades out by ' + F(r, 1) + ' m', r > lo && r < hi,
      'alpha(60 kHz) = ' + F(al, 2) + ' dB/m');
  }
  ok('the returning echo gets DULLER with range, monotonically', (() => {
    let last = Infinity;
    for (let d = 0.5; d <= 12; d += 0.5) { const f = O.returnCentroid(O.CALLS.fm, d, 20, 50); if (f >= last) return false; last = f; }
    return true;
  })(),
    '1 m: ' + F(O.returnCentroid(O.CALLS.fm, 1, 20, 50) / 1000, 1) + ' kHz   ' +
    '8 m: ' + F(O.returnCentroid(O.CALLS.fm, 8, 20, 50) / 1000, 1) + ' kHz');
  ok('at zero range the centroid is just the middle of the sweep',
    near(O.returnCentroid(O.CALLS.fm, 0, 20, 50), (O.CALLS.fm.f1 + O.CALLS.fm.f2) / 2, 200));
}

/* ═════ 10 · the machinery that renders it ═══════════════════════════════ */
head('10 · the machinery');
{
  const taps = [];
  for (let i = 0; i < 400; i++) taps.push({ tau: 0.01 + 0.00004 * i, g: 1 + (i % 7), pan: 0.1, d: 2 + 0.01 * i });
  const cl = O.clusterTaps(taps, 60);
  const sum = a => a.reduce((s, t) => s + t.g, 0);
  const wtau = a => a.reduce((s, t) => s + t.g * t.tau, 0) / sum(a);
  ok('clustering keeps every joule', near(sum(cl), sum(taps), 1e-9), cl.length + ' bins from ' + taps.length + ' taps');
  ok('and keeps the energy-weighted delay', near(wtau(cl), wtau(taps), 1e-12),
    F(wtau(cl) * 1e3, 6) + ' ms');
  ok('and moves nothing by more than one bin',
    cl.every(a => taps.some(t => Math.abs(t.tau - a.tau) < (0.00004 * 400) / 60 + 1e-9)));
  ok('a short tap list is passed through untouched', O.clusterTaps(taps.slice(0, 10), 60).length === 10);

  const dirs = O.capDirections([0, 0, -1], [1, 0, 0], [0, 1, 0], 0.7, 500);
  let unit = true;
  for (let i = 0; i < 500; i++) unit = unit && near(Math.hypot(dirs[i * 3], dirs[i * 3 + 1], dirs[i * 3 + 2]), 1, 1e-6);
  ok('the beam directions are unit vectors', unit);
  ok('and they cover the cap they claim to',
    near(O.capSolidAngle(0.7, 500) * 500, 2 * Math.PI * (1 - Math.cos(0.7)), 1e-9));
  ok('all of them are inside the cap', (() => {
    for (let i = 0; i < 500; i++) if (dirs[i * 3 + 2] > -Math.cos(0.7) + 1e-6) return false;
    return true;
  })());

  const fmr = O.renderEchoes([{ tau: 0.02, g: 1, pan: -0.5, d: 3.4 }], O.CALLS.fm,
    { N: 20, sr: 48000, c, TC: 20, RHpct: 50, gain: 1 });
  ok('an echo lands at exactly N*tau into the buffer', (() => {
    let firstL = -1;
    for (let i = 0; i < fmr.frames; i++) if (Math.abs(fmr.L[i]) > 1e-5) { firstL = i; break; }
    return near(firstL / 48000, 0.02 * 20, 0.004);
  })());
  ok('a tap to the left is louder in the left ear',
    Math.max(...fmr.L) > 1.4 * Math.max(...fmr.R),
    'L ' + F(Math.max(...fmr.L), 4) + ' vs R ' + F(Math.max(...fmr.R), 4));
  ok('the air has taken the top off the returned sweep', (() => {
    const near0 = O.renderEchoes([{ tau: 0.001, g: 1, pan: 0, d: 0.2 }], O.CALLS.fm, { N: 20, sr: 48000, c, TC: 20, RHpct: 50, gain: 1 });
    const far = O.renderEchoes([{ tau: 0.05, g: 1, pan: 0, d: 8.6 }], O.CALLS.fm, { N: 20, sr: 48000, c, TC: 20, RHpct: 50, gain: 1 });
    /* the sweep starts high, so the ratio of early energy to late energy
       must fall with distance */
    const ratio = (s) => {
      let a = 0, b = 0, on = [];
      for (let i = 0; i < s.frames; i++) if (Math.abs(s.L[i]) > 1e-9) on.push(i);
      const i0 = on[0], i1 = on[on.length - 1], mid = (i0 + i1) / 2;
      for (let i = i0; i <= i1; i++) (i < mid ? (a += s.L[i] * s.L[i]) : (b += s.L[i] * s.L[i]));
      return a / (b + 1e-30);
    };
    return ratio(far) < ratio(near0) * 0.8;
  })());
  ok('an empty tap list renders silence rather than throwing',
    O.renderEchoes([], O.CALLS.fm, { N: 20, sr: 48000, c, TC: 20, RHpct: 50, gain: 1 }).frames === 1);
}

/* ═════ done ═════════════════════════════════════════════════════════════ */
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + ' passed, ' + fail + ' failed\x1b[0m\n');
process.exit(fail ? 1 : 0);
