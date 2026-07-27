#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE THUNDERHEAD — core.test.mjs   ·   run:  node the-thunderhead/core.test.mjs

   The twin.  Nothing here draws or plays anything; it re-derives what the room
   claims, from the same core.mjs the page inlines.

   PART A  the air is the standard's air        (48 numbers out of ISO 9613-2)
   PART B  the filter really is that filter     (magnitude + causality)
   PART C  the discharge is a discharge         (tree, attachment, dimension)
   PART D  the pulse law                        (r^1/4, Rc proportional to I)
   PART E  THE CLAIM — geometry predicts the sound, at six azimuths
   PART F  the roll IS the hidden channel       (1.6 s visible, 7.8 s whole)
   PART G  loudness envelope == distance histogram
   PART H  two independent spectra agree        (time-domain vs frequency-domain)
   PART I  determinism
   ═══════════════════════════════════════════════════════════════════════════ */
import * as T from './core.mjs';

let pass = 0, fail = 0;
const ok = (cond, what, extra) => {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + what + (extra ? '  \x1b[90m' + extra + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + what + (extra ? '  ' + extra : '')); }
};
const near = (a, b, tol, what) =>
  ok(Math.abs(a - b) <= tol, what, a.toPrecision(5) + ' vs ' + b.toPrecision(5) + '  (tol ' + tol + ')');
const head = s => console.log('\n\x1b[1m' + s + '\x1b[0m');

/* ── PART A · ISO 9613-2 Table 2 ─────────────────────────────────────────────
   The published attenuation coefficients, dB/km, for the six atmospheres the
   standard tabulates.  This is not a fit; it is the closed form of
   ISO 9613-1 evaluated at those conditions, and it has to land on the table. */
head('A · atmospheric absorption vs the published table (ISO 9613-2, Table 2)');
const F8 = [63, 125, 250, 500, 1000, 2000, 4000, 8000];
const TABLE = [
  { T: 283.15, hr: 70, a: [0.1, 0.4, 1.0, 1.9, 3.7, 9.7, 32.8, 117] },
  { T: 293.15, hr: 70, a: [0.1, 0.3, 1.1, 2.8, 5.0, 9.0, 22.9, 76.6] },
  { T: 303.15, hr: 70, a: [0.1, 0.3, 1.0, 3.1, 7.4, 12.7, 23.1, 59.3] },
  { T: 288.15, hr: 20, a: [0.3, 0.6, 1.2, 2.7, 8.2, 28.2, 88.8, 202] },
  { T: 288.15, hr: 50, a: [0.1, 0.5, 1.2, 2.2, 4.2, 10.8, 36.2, 129] },
  { T: 288.15, hr: 80, a: [0.1, 0.3, 1.1, 2.4, 4.1, 8.3, 23.7, 82.8] }
];
for (const row of TABLE) {
  for (let i = 0; i < F8.length; i++) {
    const got = T.absorptionDbPerM(F8[i], row.T, row.hr, 101325) * 1000;
    const want = row.a[i];
    /* the table is rounded to 1 dp below 10 and to 3 figures above */
    const tol = Math.max(0.06, want * 0.03);
    ok(Math.abs(got - want) <= tol,
       (row.T - 273.15).toFixed(0) + '°C ' + row.hr + '% @ ' + F8[i] + ' Hz',
       got.toFixed(2) + ' vs ' + want + ' dB/km');
  }
}
ok(T.absorptionDbPerM(4000, 293.15, 70, 101325) > 15 * T.absorptionDbPerM(250, 293.15, 70, 101325),
   'air eats treble far faster than bass — the whole reason a far flash rumbles',
   (T.absorptionDbPerM(4000, 293.15, 70, 101325) / T.absorptionDbPerM(250, 293.15, 70, 101325)).toFixed(1) + 'x');

/* ── PART B · the filter ─────────────────────────────────────────────────── */
head('B · the air filter realises the air, and does not ring before the sound');
{
  const air = { T: 293.15, hr: 70, pa: 101325 }, sr = 44100, N = 4096, taps = 640;
  for (const range of [500, 3000, 8000]) {
    const h = T.airFIR(range, taps, sr, air, N);
    for (const f of [50, 200, 1000, 3000]) {
      let re = 0, im = 0;
      for (let k = 0; k < taps; k++) { const w = 2 * Math.PI * f * k / sr; re += h[k] * Math.cos(w); im -= h[k] * Math.sin(w); }
      const got = 20 * Math.log10(Math.hypot(re, im) + 1e-300);
      const want = -T.absorptionDbPerM(f, air.T, air.hr, air.pa) * range;
      ok(Math.abs(got - want) < 0.7, 'range ' + range + ' m, ' + f + ' Hz',
         got.toFixed(2) + ' vs ' + want.toFixed(2) + ' dB');
    }
    /* minimum phase: the energy sits at the FRONT of the window, where a
       linear-phase design of the same magnitude would centre it at taps/2 and
       smear the onset backwards in time — faking a first bang that arrives
       before the geometry allows.  (A heavy lowpass has a long tail; that is
       the air, and it is meant to be there.  What must not exist is a head.) */
    let cen = 0, all = 0;
    for (let k = 0; k < taps; k++) { const e = h[k] * h[k]; all += e; cen += k * e; }
    cen /= all;
    ok(cen < taps / 4, 'range ' + range + ' m: energy sits at the front of the window',
       'centre of energy ' + (cen / sr * 1000).toFixed(2) + ' ms, a linear-phase twin would be '
       + (taps / 2 / sr * 1000).toFixed(2) + ' ms');
  }
}

/* ── PART C · the discharge ──────────────────────────────────────────────── */
head('C · the dielectric-breakdown channel');
{
  const d = T.makeDischarge({ W: 96, H: 132, seedX: 48, seedY: 0, eta: 2,
                              rng: T.mulberry32(811), sink: 'bottom', maxCells: 2600 }).growAll();
  ok(d.attached >= 0, 'the leader reaches the ground', d.nodes.length + ' cells');
  ok(d.nodes[d.attached].y === 131, 'and it is the bottom row that it reaches');
  let treeOk = true, roots = 0;
  for (let k = 0; k < d.nodes.length; k++) {
    const p = d.nodes[k].parent;
    if (p < 0) roots++; else if (p >= k) treeOk = false;
  }
  ok(roots === 1 && treeOk, 'the channel is one tree, every parent older than its child');
  /* every node touches its parent on the lattice */
  let adj = true;
  for (let k = 1; k < d.nodes.length; k++) {
    const a = d.nodes[k], b = d.nodes[a.parent];
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) adj = false;
  }
  ok(adj, 'every step is one lattice cell — the channel is connected');

  const q = T.subtreeCharge(d.nodes);
  ok(q[0] === d.nodes.length, 'the trunk drains the whole tree', q[0] + ' of ' + d.nodes.length);

  /* the branching is a function of eta, and it is monotone.  Averaged over
     six seeds so this is about the model, not about one lucky flash. */
  const dims = [];
  for (const eta of [1.0, 2.0, 3.0, 4.0]) {
    let s = 0;
    for (let k = 1; k <= 6; k++) {
      const g = T.makeDischarge({ W: 96, H: 132, seedX: 48, seedY: 0, eta: eta,
                                  rng: T.mulberry32(k * 811), sink: 'bottom', maxCells: 2600 }).growAll();
      s += T.boxDimension(g.chan, 96, 132);
    }
    dims.push(s / 6);
  }
  console.log('       box dimension by eta: ' + dims.map((v, i) => [1, 2, 3, 4][i] + '→' + v.toFixed(3)).join('   '));
  let mono = true;
  for (let i = 1; i < dims.length; i++) if (dims[i] >= dims[i - 1]) mono = false;
  ok(mono, 'D falls monotonically as eta rises — a straighter bolt is a thinner set');
  ok(dims[0] > dims[3] + 0.25, 'and it falls by a lot, not by noise',
     dims[0].toFixed(3) + ' → ' + dims[3].toFixed(3));
  ok(dims[1] > 1.0 && dims[1] < 1.6, 'eta = 2 lands in the range measured on real flashes (1.1-1.4)',
     'D = ' + dims[1].toFixed(3));
}

/* ── PART D · the pulse each segment makes ───────────────────────────────── */
head('D · the shock a piece of channel makes');
{
  near(T.RC, Math.sqrt(T.EL_TRUNK / (Math.PI * 101325)), 1e-9,
       'Rc is sqrt(E_l / pi p0) and nothing else');
  const t1 = T.nwavePeriod(1000, 1), t2 = T.nwavePeriod(16000, 1);
  near(t2 / t1, 2.0, 0.02, 'the weak shock stretches as r^(1/4): 16x the range doubles the period');
  near(T.relaxRadius(0.5) / T.relaxRadius(1.0), 0.5, 1e-12,
       'Rc goes as the current, so half the charge is half the pulse');
  ok(T.nwavePeriod(3000, 1) > 0.02 && T.nwavePeriod(3000, 1) < 0.04,
     'a trunk 3 km off makes a pulse of 20-40 ms (measured thunder: tens of ms)',
     (T.nwavePeriod(3000, 1) * 1000).toFixed(1) + ' ms, i.e. ' + (1 / T.nwavePeriod(3000, 1)).toFixed(0) + ' Hz');
}

/* ── PART E · THE CLAIM ──────────────────────────────────────────────────── */
head('E · the claim: the sound is the shape, and geometry alone says when');
const flash = T.buildFlash({ seed: 7, eta: 2.0 });
const strokes = T.strokeTrain(7, 3);
console.log('       flash: ' + flash.segments.length + ' segments, '
  + flash.cg.nodes.length + ' cells of leader, ' + flash.ic.nodes.length + ' of sheet');
{
  const R = 2600;
  let minRoll = 1e9, maxRoll = 0;
  for (const deg of [0, 45, 90, 135, 180, 270]) {
    const th = deg * Math.PI / 180;
    const L = [R * Math.sin(th), 1.8, -R * Math.cos(th)];
    const p = T.predict(flash.segments, L, strokes);          // geometry only
    const s = T.synthesise(flash.segments, L, { seed: 7, strokes: strokes });
    const m = T.measureArrivals(s.samples, s.sr, 1e-5);       // waveform only
    ok(Math.abs(p.firstArrival - m.first) < 0.005,
       'az ' + String(deg).padStart(3) + '°  first bang',
       'predicted ' + p.firstArrival.toFixed(4) + ' s, heard ' + m.first.toFixed(4) + ' s');
    ok(Math.abs(p.lastArrival - m.last) < 0.02,
       'az ' + String(deg).padStart(3) + '°  end of roll',
       'predicted ' + p.lastArrival.toFixed(4) + ' s, heard ' + m.last.toFixed(4) + ' s');
    minRoll = Math.min(minRoll, p.roll); maxRoll = Math.max(maxRoll, p.roll);
  }
  ok(maxRoll / minRoll > 1.3, 'turning round the storm really does change the roll',
     minRoll.toFixed(2) + ' s to ' + maxRoll.toFixed(2) + ' s');
}

/* ── PART F · why thunder rolls at all ───────────────────────────────────── */
head('F · the roll is the channel you cannot see');
{
  const L = [0, 1.8, -2600];
  const visible = flash.segments.filter(s => s.part === 0);
  const pv = T.predict(visible, L, strokes);
  const pw = T.predict(flash.segments, L, strokes);
  const sv = T.synthesise(visible, L, { seed: 7, strokes: strokes });
  const sw = T.synthesise(flash.segments, L, { seed: 7, strokes: strokes });
  const mv = T.measureArrivals(sv.samples, sv.sr, 1e-5);
  const mw = T.measureArrivals(sw.samples, sw.sr, 1e-5);
  ok(Math.abs(pv.roll - mv.roll) < 0.05, 'the bolt alone: predicted roll = heard roll',
     pv.roll.toFixed(2) + ' vs ' + mv.roll.toFixed(2) + ' s');
  ok(Math.abs(pw.roll - mw.roll) < 0.05, 'the whole flash: predicted roll = heard roll',
     pw.roll.toFixed(2) + ' vs ' + mw.roll.toFixed(2) + ' s');
  ok(pw.roll > 3 * pv.roll, 'the hidden sheet is what makes thunder ROLL rather than CLAP',
     pv.roll.toFixed(2) + ' s visible → ' + pw.roll.toFixed(2) + ' s whole flash');
  ok(Math.abs(pv.firstArrival - pw.firstArrival) < 1e-9,
     'and it does not change when the first bang arrives — only how long it lasts');
}

/* ── PART G · the envelope is the histogram ──────────────────────────────── */
head('G · the loudness of the roll is the channel’s distance histogram');
for (const D of [1200, 2600, 6000]) {
  const L = [0, 1.8, -D];
  const s = T.synthesise(flash.segments, L, { seed: 7, strokes: strokes });
  const ap = T.arrivalProfile(flash.segments, L, { strokes: strokes, dt: 0.05 });
  const ev = T.envelopeOf(s.samples, s.sr, ap.t0, ap.dt, ap.bins.length);
  const c = T.profileCorrelation(ap, ev);
  const sa = T.profileStats(ap), sb = T.profileStats(ev);
  ok(c > 0.65, D + ' m: the curve drawn from geometry tracks the rendered envelope',
     'r = ' + c.toFixed(3));
  ok(Math.abs(sa.t50 - sb.t50) < 0.45, D + ' m: they peak at the same moment',
     sa.t50.toFixed(2) + ' s vs ' + sb.t50.toFixed(2) + ' s');
}

/* ── PART H · two spectra, computed two ways ─────────────────────────────── */
head('H · a time-domain synthesis and a frequency-domain sum, compared');
for (const D of [1200, 2600, 6000]) {
  const L = [0, 1.8, -D];
  const s = T.synthesise(flash.segments, L, { seed: 7, strokes: strokes });
  const meas = T.bandsFromSpectrum(T.powerSpectrum(s.samples, s.sr, 0, undefined, 16384));
  const pred = T.bandsFromPredicted(T.predictSpectrum(flash.segments, L));
  const ag = T.bandAgreement(meas, pred, 60);
  ok(ag.rmsDb < 4.0, D + ' m: third-octave bands agree',
     ag.rmsDb.toFixed(2) + ' dB rms over ' + ag.bands + ' bands spanning 60 dB');
  ok(T.bandCentroid(meas) < 200, D + ' m: and it is a rumble, not a hiss',
     'centroid ' + T.bandCentroid(meas).toFixed(0) + ' Hz');
}
{
  /* and the reason a far one is duller: the air, not the geometry */
  const near1 = T.bandsFromPredicted(T.predictSpectrum(flash.segments, [0, 1.8, -1200]));
  const far = T.bandsFromPredicted(T.predictSpectrum(flash.segments, [0, 1.8, -12000]));
  ok(T.bandCentroid(far) < T.bandCentroid(near1) * 0.85,
     'ten times further off is measurably duller',
     T.bandCentroid(near1).toFixed(1) + ' Hz → ' + T.bandCentroid(far).toFixed(1) + ' Hz');
}

/* ── PART I · determinism ────────────────────────────────────────────────── */
head('I · the same seed is the same flash and the same thunder');
{
  const a = T.buildFlash({ seed: 21, eta: 2.0 });
  const b = T.buildFlash({ seed: 21, eta: 2.0 });
  ok(a.segments.length === b.segments.length, 'same segment count', a.segments.length + '');
  let same = true;
  for (let k = 0; k < a.segments.length; k++)
    if (a.segments[k].ax !== b.segments[k].ax || a.segments[k].by !== b.segments[k].by) same = false;
  ok(same, 'same geometry, cell for cell');
  const L = [0, 1.8, -2000];
  const sa = T.synthesise(a.segments, L, { seed: 21, strokes: strokes });
  const sb = T.synthesise(b.segments, L, { seed: 21, strokes: strokes });
  let d = 0;
  for (let i = 0; i < sa.samples.length; i++) d = Math.max(d, Math.abs(sa.samples[i] - sb.samples[i]));
  ok(d === 0, 'and the same waveform, sample for sample');
  /* the fft round-trips */
  const N = 1024, re = new Float64Array(N), im = new Float64Array(N), r0 = new Float64Array(N);
  for (let i = 0; i < N; i++) { re[i] = Math.sin(i * 0.31) + 0.4 * Math.cos(i * 1.7); r0[i] = re[i]; }
  T.fft(re, im, false); T.fft(re, im, true);
  let e = 0; for (let i = 0; i < N; i++) e = Math.max(e, Math.abs(re[i] - r0[i]));
  ok(e < 1e-12, 'the FFT round-trips', 'max error ' + e.toExponential(2));
}

console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + ' passed, ' + fail + ' failed\x1b[0m\n');
process.exit(fail ? 1 : 0);
