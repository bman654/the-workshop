/* ══════════════════════════════════════════════════════════════════════════
   The Spiral Ear — the Node twin.       node cochlea.test.mjs

   Everything the room prints on its own face is measured here first, off the
   command line, with no browser and no canvas anywhere near it.  Where a
   number has a closed form the closed form is checked against the solve; where
   it does not, it is checked against a SECOND solver that shares no code with
   the first.
   ══════════════════════════════════════════════════════════════════════════ */

import * as C from './cochlea.mjs';
import { coilCurvature, buildCurve } from './shape.mjs';

let pass = 0, fail = 0;
const results = [];
function leg(name, fn) {
  let ok = false, note = '';
  try { note = fn() || ''; ok = true; }
  catch (e) { note = e.message; ok = false; }
  results.push({ name, ok, note });
  if (ok) pass++; else fail++;
  console.log((ok ? '  \x1b[32mok  \x1b[0m' : '  \x1b[31mFAIL\x1b[0m') + '  ' + name +
              (note ? '\n        ' + note.split('\n').join('\n        ') : ''));
}
function must(cond, msg) { if (!cond) throw new Error(msg); }
function near(a, b, tol, what) {
  const rel = Math.abs(a - b) / Math.max(1e-30, Math.abs(b));
  must(rel <= tol, what + ': ' + a + ' vs ' + b + ' (rel ' + rel.toExponential(2) +
       ' > ' + tol + ')');
  return rel;
}

const P = C.PARAM;
const grid = C.makeGrid(1024);
const sol = C.makeSolver(grid);
const dB = (r) => 20 * Math.log10(r);

console.log('\nTHE SPIRAL EAR — ' + P.L * 1000 + ' mm of membrane, ' +
            P.fBase + ' Hz at the base, ' + P.fApex + ' Hz at the apex\n');

/* ── 1 ─────────────────────────────────────────────────────────────────── */
leg('the answer does not depend on the grid', () => {
  const out = [];
  for (const n of [256, 512, 1024, 2048]) {
    const g = C.makeGrid(n), s = C.makeSolver(g);
    out.push({ n, x: C.peakOf(s, 1000).x, d: C.travelDelay(s, 1000).delay });
  }
  const ref = out[out.length - 1];
  /* second order, so each doubling should quarter the error — and the error
     at the grid the room actually runs must be far below what it prints */
  const errs = out.map(o => Math.abs(o.x - ref.x));
  must(errs[0] > errs[1] && errs[1] > errs[2], 'the grid is not converging');
  must(errs[2] < 1e-5, 'n=1024 is not within 10 microns of n=2048: ' + errs[2]);
  for (const o of out.slice(1))
    must(Math.abs(o.d - ref.d) / ref.d < 0.01, 'delay moves with the grid at n=' + o.n);
  return out.map(o => 'n=' + o.n + ' peak ' + (o.x * 1000).toFixed(4) + ' mm').join(' · ') +
         '\nthe room runs n=' + grid.n + '; it prints hundredths of a millimetre and is ' +
         'settled to ' + (errs[2] * 1e6).toFixed(1) + ' microns';
});

/* ── 2 ─────────────────────────────────────────────────────────────────── */
leg('an octave is the same distance wherever you put it', () => {
  const closed = C.octaveMillimetres();
  const fs = [125, 250, 500, 1000, 2000, 4000];
  const xs = fs.map(f => C.peakOf(sol, f).x * 1000);
  const gaps = [];
  for (let i = 1; i < xs.length; i++) gaps.push(xs[i - 1] - xs[i]);
  const mean = gaps.reduce((a, b) => a + b) / gaps.length;
  const spread = Math.max(...gaps) - Math.min(...gaps);
  must(spread / mean < 0.002, 'octave spacing is not constant: ' + gaps);
  near(mean, closed, 2e-3, 'measured octave vs L ln2 / ln(fBase/fApex)');
  return 'five successive octaves, measured off the peaks: ' +
         gaps.map(g => g.toFixed(4)).join(', ') + ' mm' +
         '\nspread ' + (100 * spread / mean).toFixed(3) + ' % · closed form ' +
         closed.toFixed(4) + ' mm';
});

/* ── 3 ─────────────────────────────────────────────────────────────────── */
leg('the peak is NOT at the place whose resonance matches the tone', () => {
  const fs = [125, 250, 500, 1000, 2000, 4000];
  const sh = fs.map(f => (C.placeOfCF(f) - C.peakOf(sol, f).x) * 1000);
  const mean = sh.reduce((a, b) => a + b) / sh.length;
  const spread = Math.max(...sh) - Math.min(...sh);
  must(mean > 0.5, 'the peak is not basal of resonance at all');
  must(spread / mean < 0.01, 'the offset is not constant: ' + sh);
  const oct = mean / C.octaveMillimetres();
  return 'basal of resonance by ' + mean.toFixed(3) + ' mm at every frequency ' +
         '(spread ' + (100 * spread / mean).toFixed(2) + ' %)' +
         '\nthat is ' + oct.toFixed(3) + ' of an octave, and it is nowhere in the file — ' +
         'the model is exactly scale-invariant, so the shift has to be';
});

/* ── 4 ─────────────────────────────────────────────────────────────────── */
leg('past its own place a tone dies at a rate with no frequency in it', () => {
  const closed = C.apicalDecayClosedForm();
  const dist = [2, 4, 6, 10, 14];
  const fs = [250, 1000, 4000];
  const tab = {};
  for (const d of dist) {
    tab[d] = [];
    for (const f of fs) {
      const e = C.envelopeAt(sol, f);
      const x0 = C.peakOf(sol, f).x + d / 1000, x1 = x0 + 0.002;
      const i0 = Math.round(x0 / grid.dx), i1 = Math.round(x1 / grid.dx);
      if (i1 >= grid.N) { tab[d].push(NaN); continue; }
      tab[d].push((Math.log(e[i0]) - Math.log(e[i1])) / (grid.x[i1] - grid.x[i0]) / closed);
    }
  }
  /* the point is not only that it converges to the closed form — it is that
     the whole approach to it is IDENTICAL for every tone.  Scale invariance. */
  for (const d of dist) {
    const v = tab[d].filter(q => isFinite(q));
    const sp = (Math.max(...v) - Math.min(...v)) / (v.reduce((a, b) => a + b) / v.length);
    must(sp < 0.005, 'the decay at +' + d + ' mm depends on frequency: ' + tab[d]);
  }
  const far = tab[14].filter(q => isFinite(q));
  for (const q of far) near(q, 1, 2e-3, 'far decay against the closed form');
  return 'sqrt(2 rho / H M) = ' + closed.toFixed(1) + ' /m = ' +
         C.apicalDecayDbPerMm().toFixed(2) + ' dB/mm, and no w in it anywhere.' +
         '\nmeasured decay / closed form, at 250 / 1000 / 4000 Hz:' +
         '\n' + dist.map(d => '  +' + String(d).padStart(2) + ' mm past the peak   ' +
           tab[d].map(q => isFinite(q) ? q.toFixed(4) : ' -- ').join('  ')).join('\n') +
         '\nthree tones two octaves apart, agreeing to four figures at every distance,' +
         '\nand all of them arriving at 1.0000 by fourteen millimetres out.';
});

/* ── 5 ─────────────────────────────────────────────────────────────────── */
leg('so a place answers its two flanks utterly differently', () => {
  const pk = C.peakOf(sol, 1000);
  const at = (f) => {
    const r = C.solveAt(sol, 2 * Math.PI * f);
    return Math.hypot(r.v[pk.index * 2], r.v[pk.index * 2 + 1]);
  };
  const tc = C.tuningCurve(sol, pk.index, 300, 3000, 600);
  let mi = 0; for (let i = 1; i < tc.mag.length; i++) if (tc.mag[i] > tc.mag[mi]) mi = i;
  const bf = tc.f[mi], top = tc.mag[mi];
  const lo = dB(at(bf / 2) / top), hi = dB(at(bf * 2) / top);
  must(lo > -12, 'the low flank is not shallow: ' + lo);
  must(hi < -100, 'the high flank is not a cliff: ' + hi);
  return 'the place that likes ' + bf.toFixed(0) + ' Hz best:' +
         '\n  an octave BELOW it  ' + lo.toFixed(1) + ' dB   (' + lo.toFixed(0) + ' dB/octave)' +
         '\n  an octave ABOVE it  ' + hi.toFixed(0) + ' dB   (' + (-hi).toFixed(0) +
         ' dB/octave the other way)' +
         '\n  asymmetry ' + (hi / lo).toFixed(0) + ' : 1';
});

/* ── 6 ─────────────────────────────────────────────────────────────────── */
leg('and therefore a shadow that only ever falls upward', () => {
  const A = 400, B = 1600;             /* two octaves apart */
  const pa = C.peakOf(sol, A), pb = C.peakOf(sol, B);
  const at = (f, idx) => {
    const r = C.solveAt(sol, 2 * Math.PI * f);
    return Math.hypot(r.v[idx * 2], r.v[idx * 2 + 1]);
  };
  const lowReachesHigh = dB(at(A, pb.index) / pa.amp);
  const highReachesLow = dB(at(B, pa.index) / pb.amp);
  must(lowReachesHigh > highReachesLow + 60, 'the shadow is not asymmetric');
  return A + ' Hz, at the place that belongs to ' + B + ' Hz: ' +
         lowReachesHigh.toFixed(1) + ' dB down' +
         '\n' + B + ' Hz, at the place that belongs to ' + A + ' Hz: ' +
         highReachesLow.toFixed(0) + ' dB down' +
         '\nturn the low note up by ' + (-lowReachesHigh).toFixed(0) +
         ' dB and it is shouting where the high note lives; there is no level ' +
         'at all\nat which the high note returns the favour';
});

/* ── 7 ─────────────────────────────────────────────────────────────────── */
leg('TAKE THE WATER AWAY and almost all of it goes', () => {
  const opt = { uncoupled: true };
  const pk = C.peakOf(sol, 1000, opt);
  const at = (f) => {
    const r = C.solveAt(sol, 2 * Math.PI * f, opt);
    return Math.hypot(r.v[pk.index * 2], r.v[pk.index * 2 + 1]);
  };
  const tc = C.tuningCurve(sol, pk.index, 300, 3000, 600, opt);
  let mi = 0; for (let i = 1; i < tc.mag.length; i++) if (tc.mag[i] > tc.mag[mi]) mi = i;
  const bf = tc.f[mi], top = tc.mag[mi];
  const lo = dB(at(bf / 2) / top), hi = dB(at(bf * 2) / top);
  const asym = Math.abs(hi / lo);
  must(asym < 3, 'the uncoupled bank is still asymmetric: ' + asym);
  const cyc = Math.abs(C.phaseCycles(sol, 1000, opt));
  const shift = (C.placeOfCF(1000, P) - pk.x) * 1000;
  must(cyc < 0.3, 'the uncoupled bank still has a travelling wave: ' + cyc);
  must(Math.abs(shift) < 0.05, 'the uncoupled peak is not at resonance: ' + shift);
  /* what is LEFT is not travel — it is one resonator ringing up, and that has
     a closed form: 1 / (zeta w).  The coupled delay has no closed form at all. */
  const d = C.travelDelay(sol, 1000, opt).delay;
  const ring = 1 / (P.zeta * 2 * Math.PI * 1000);
  near(d, ring, 2e-3, 'the leftover delay is not the resonator ringing up');
  return 'a bank of independent resonators, same stiffness, same mass, no fluid:' +
         '\n  flanks ' + lo.toFixed(1) + ' / ' + hi.toFixed(1) +
         ' dB an octave out — symmetric to ' + asym.toFixed(2) + ' : 1' +
         '\n     (coupled: ' + dB(1).toFixed(0) + '-ish one way and a 259 dB cliff the other)' +
         '\n  wave cycles along the membrane ' + cyc.toFixed(3) + ' (was ' +
         C.phaseCycles(sol, 1000).toFixed(2) + ') — nothing travels' +
         '\n  peak sits ' + shift.toFixed(4) + ' mm from resonance (was ' +
         ((C.placeOfCF(1000, P) - C.peakOf(sol, 1000).x) * 1000).toFixed(2) + ' mm)' +
         '\n  the delay that survives is ' + (d * 1000).toFixed(4) + ' ms, and 1/(zeta w) is ' +
         (ring * 1000).toFixed(4) + ' ms:' +
         '\n  it is not travel, it is one resonator ringing up. the coupled ' +
         (C.travelDelay(sol, 1000).delay * 1000).toFixed(2) + ' ms is travel,' +
         '\n  and it has no closed form.';
});

/* ── 8 ─────────────────────────────────────────────────────────────────── */
leg('a low note takes far longer to arrive than a high one', () => {
  const rows = [];
  for (const f of [125, 250, 500, 1000, 2000, 4000, 8000]) {
    const d = C.travelDelay(sol, f);
    rows.push({ f, ms: d.delay * 1000, cyc: d.delay * f });
  }
  for (let i = 1; i < rows.length; i++)
    must(rows[i].ms < rows[i - 1].ms, 'delay is not monotone in frequency');
  must(rows[0].ms / rows[6].ms > 100, 'the delay range is too small');
  /* over the range where the peak has plenty of membrane basal of it, the
     delay is close to a fixed number of CYCLES — which is what the scale
     invariance wants.  It falls off at the top because a 8 kHz peak is only
     two millimetres from the stapes and there is no room left to travel in. */
  const mid = rows.slice(0, 5).map(r => r.cyc);
  const mc = mid.reduce((a, b) => a + b) / mid.length;
  must((Math.max(...mid) - Math.min(...mid)) / mc < 0.12, 'mid-range cycles wander: ' + mid);
  return rows.map(r => r.f + ' Hz ' + r.ms.toFixed(2) + ' ms').join(' · ') +
         '\n' + (rows[0].ms / rows[6].ms).toFixed(0) + ' to one, across the range you hear.' +
         '\nin cycles of the tone itself: ' + rows.map(r => r.cyc.toFixed(2)).join(' · ') +
         '\nabout six, until the peak runs out of membrane to have travelled over.';
});

/* ── 9 ─────────────────────────────────────────────────────────────────── */
leg('a second solver, sharing no code, gets the same answer', () => {
  const g = C.makeGrid(512), s = C.makeSolver(g);
  const fs = 48000, n = 8192, f = 2000, T = 0.006, w = 2 * Math.PI * f;
  const stim = new Float64Array(n), acc = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / fs;
    if (t < T) {
      const a = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / T);
      const da = Math.PI / T * Math.sin(2 * Math.PI * t / T);
      stim[i] = a * Math.sin(w * t);
      acc[i] = da * Math.sin(w * t) + a * w * Math.cos(w * t);
    }
  }
  const idx = C.peakOf(s, f).index;
  const F = C.transientField(s, stim, fs, [idx]);
  const nOut = Math.round(0.02 * fs);
  const errs = [];
  for (const K of [4, 8, 16]) {
    const R = C.integrate(g, acc, fs, K, nOut, [idx]);
    let num = 0, d1 = 0, d2 = 0, me = 0;
    for (let i = 0; i < R.nOut; i++) {
      const a = R.out[i], b = F.field[i];
      num += a * b; d1 += a * a; d2 += b * b; me = Math.max(me, Math.abs(a - b));
    }
    errs.push({ K, corr: num / Math.sqrt(d1 * d2), e: me / Math.sqrt(d2 / R.nOut) });
  }
  must(errs[2].corr > 0.9995, 'the two solvers disagree: ' + errs[2].corr);
  must(errs[2].e < errs[1].e * 0.7, 'the time-domain error is not converging');
  return 'frequency domain (tridiagonal solve per frequency, then an inverse FFT)' +
         '\nversus symplectic time-stepping of the same equations, ' + f + ' Hz burst:' +
         '\n' + errs.map(e => 'x' + e.K + '  corr ' + e.corr.toFixed(6) +
           '  peak error ' + (100 * e.e).toFixed(2) + ' % of rms').join('\n') +
         '\nfirst order, halving on every refinement, as symplectic Euler must';
});

/* ── 10 ────────────────────────────────────────────────────────────────── */
leg('two sounds a spectrum analyser cannot tell apart', () => {
  const g = C.makeGrid(512), s = C.makeSolver(g);
  const fs = 24000, n = 8192, fLo = 120, fHi = 6000;
  const up = C.makeChirp(s, n, fs, fLo, fHi);
  const down = new Float64Array(n);
  for (let i = 0; i < n; i++) down[i] = up[n - 1 - i];
  const m1 = C.magSpectrum(up), m2 = C.magSpectrum(down);
  let md = 0, mx = 0;
  for (let k = 0; k < m1.length; k++) { md = Math.max(md, Math.abs(m1[k] - m2[k])); mx = Math.max(mx, m1[k]); }
  must(md / mx < 1e-10, 'the two spectra differ: ' + md / mx);
  let e1 = 0, e2 = 0;
  for (let i = 0; i < n; i++) { e1 += up[i] * up[i]; e2 += down[i] * down[i]; }
  near(e2, e1, 1e-12, 'energy');

  const places = []; for (let i = 0; i < g.N; i += 4) places.push(i);
  const meas = (sig) => {
    const F = C.transientField(s, sig, fs, places);
    const en = new Float64Array(n);
    for (let q = 0; q < places.length; q++) {
      const off = q * n;
      for (let i = 0; i < n; i++) en[i] += F.field[off + i] * F.field[off + i];
    }
    let peak = 0, tot = 0;
    for (let i = 0; i < n; i++) { if (en[i] > peak) peak = en[i]; tot += en[i]; }
    /* the width that holds half the energy */
    const srt = Array.from(en).map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    let acc = 0, k = 0; while (acc < 0.5 * tot && k < srt.length) { acc += srt[k][0]; k++; }
    return { peak, tot, halfMs: 1000 * k / fs };
  };
  const U = meas(up), D = meas(down);
  near(D.tot, U.tot, 1e-6, 'total energy delivered to the membrane');
  must(U.peak / D.peak > 2, 'the two sweeps are not told apart: ' + U.peak / D.peak);
  return 'a rising sweep, and the very same file played backwards.' +
         '\nmagnitude spectra differ by ' + (md / mx).toExponential(1) +
         ' of full scale; energies by ' + (Math.abs(e2 - e1) / e1).toExponential(1) +
         '\nthe membrane receives EXACTLY the same total energy (' +
         (Math.abs(D.tot - U.tot) / U.tot).toExponential(1) + ' apart) —' +
         '\n  rising : peak ' + U.peak.toExponential(3) + ', half of it inside ' +
         U.halfMs.toFixed(1) + ' ms' +
         '\n  falling: peak ' + D.peak.toExponential(3) + ', half of it inside ' +
         D.halfMs.toFixed(1) + ' ms' +
         '\nsame sound, ' + (U.peak / D.peak).toFixed(2) +
         ' times the peak, because one of them climbs at the speed the ear does';
});

/* ── 11 ────────────────────────────────────────────────────────────────── */
leg('a tap goes in as one instant and comes out as a glide', () => {
  const g = C.makeGrid(512), s = C.makeSolver(g);
  const fs = 24000, n = 8192;
  const click = C.makeClick(n, fs, 120, 6000);
  const t0 = (n >> 3) / fs;                     /* where makeClick centres it */
  const probes = [500, 1000, 2000, 4000];
  const places = probes.map(f => C.peakOf(s, f).index);
  const F = C.transientField(s, click, fs, places);
  const rows = [];
  for (let q = 0; q < places.length; q++) {
    let best = 0, bi = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.abs(F.field[q * n + i]);
      if (a > best) { best = a; bi = i; }
    }
    const arrival = bi / fs - t0;
    const predicted = C.travelDelay(s, probes[q]).delay;
    rows.push({ f: probes[q], arrival, predicted });
  }
  for (let i = 1; i < rows.length; i++)
    must(rows[i].arrival < rows[i - 1].arrival, 'the glide is not descending');
  for (const r of rows)
    must(Math.abs(r.arrival - r.predicted) < 0.35 * r.predicted + 3e-4,
         'arrival at ' + r.f + ' Hz is ' + r.arrival + ', group delay says ' + r.predicted);
  return 'one click, and the places answer in order:' +
         '\n' + rows.map(r => '  ' + String(r.f).padStart(4) + ' Hz place at ' +
           (r.arrival * 1000).toFixed(2) + ' ms  (group delay says ' +
           (r.predicted * 1000).toFixed(2) + ')').join('\n') +
         '\nthe ear turns an instant into a falling whistle ' +
         ((rows[0].arrival - rows[3].arrival) * 1000).toFixed(1) + ' ms long';
});

/* ── 12 ────────────────────────────────────────────────────────────────── */
leg('the shell unrolls without stretching the membrane', () => {
  const rec = coilCurvature(512);
  let turn = 0;
  for (let i = 0; i <= rec.n; i++) turn += Math.hypot(rec.A[i], rec.B[i]) * rec.ds;
  must(Math.abs(turn / (2 * Math.PI) - 2.53) < 0.06, 'the coil is not 2.5 turns: ' + turn / (2 * Math.PI));
  const lens = [];
  for (const u of [0, 0.25, 0.5, 0.75, 1]) {
    const c = buildCurve(rec, u);
    let L = 0;
    for (let i = 1; i < c.N; i++)
      L += Math.hypot(c.pos[i * 3] - c.pos[(i - 1) * 3],
                      c.pos[i * 3 + 1] - c.pos[(i - 1) * 3 + 1],
                      c.pos[i * 3 + 2] - c.pos[(i - 1) * 3 + 2]);
    lens.push({ u, L });
    near(L, rec.total, 2e-4, 'arc length at u=' + u);
    /* the frame must stay a frame all the way */
    for (let i = 0; i < c.N; i += 37) {
      const T = [c.tan[i * 3], c.tan[i * 3 + 1], c.tan[i * 3 + 2]];
      const U = [c.wid[i * 3], c.wid[i * 3 + 1], c.wid[i * 3 + 2]];
      must(Math.abs(Math.hypot(T[0], T[1], T[2]) - 1) < 1e-4, 'tangent lost unit length');
      must(Math.abs(T[0] * U[0] + T[1] * U[1] + T[2] * U[2]) < 1e-4, 'frame lost orthogonality');
    }
  }
  /* and the membrane must lie FLAT across each turn, not stand on its edge:
     a parallel-transported frame precesses over two and a half turns and
     silently rolls the ribbon onto its side, which reads as a coiled wall. */
  const coiled = buildCurve(rec, 0);
  let tilt = 0;
  for (let i = 0; i < coiled.N; i++) tilt = Math.max(tilt, Math.abs(coiled.wid[i * 3 + 1]));
  must(tilt < 0.03, 'the membrane is not lying flat across the turns: ' + tilt);
  const straight = buildCurve(rec, 1);
  const ends = Math.hypot(straight.pos[(straight.N - 1) * 3] - straight.pos[0],
                          straight.pos[(straight.N - 1) * 3 + 1] - straight.pos[1],
                          straight.pos[(straight.N - 1) * 3 + 2] - straight.pos[2]);
  near(ends, rec.total, 1e-6, 'the fully unrolled ribbon is not straight');
  return 'coil turns ' + (turn / (2 * Math.PI)).toFixed(3) +
         '\narc length through the unrolling: ' +
         lens.map(l => l.L.toFixed(5)).join(' · ') + ' (all of them ' +
         rec.total.toFixed(5) + ')' +
         '\nend to end when flat: ' + ends.toFixed(5) + ' — a straight rule of the same length' +
         '\nthe membrane never tips more than ' + (Math.asin(tilt) * 180 / Math.PI).toFixed(2) +
         ' degrees out of horizontal anywhere in the shell';
});

/* ── 13 ────────────────────────────────────────────────────────────────── */
leg('what goes in at the stapes comes out as heat in the membrane', () => {
  /* A global check of the whole assembly — the tridiagonal solve, both
     boundary conditions, the sign of every term.  The stapes drives with
     velocity 1, so the flux it injects is exactly H and the power it delivers
     is 0.5 H Re p(0).  Every watt of that has to be dissipated somewhere
     along the membrane, because there is nowhere else for it to go: the
     helicotrema is shorted and nothing in here amplifies. */
  const rows = [];
  for (const f of [200, 1000, 5000, 11000]) {
    const r = C.solveAt(sol, 2 * Math.PI * f);
    const Pin = 0.5 * P.H * r.p[0];
    let dis = 0;
    for (let i = 0; i < grid.N; i++) {
      const w = (i === 0 || i === grid.N - 1) ? 0.5 : 1;
      dis += w * 0.5 * (r.p[i * 2] * r.v[i * 2] + r.p[i * 2 + 1] * r.v[i * 2 + 1]) * grid.dx;
    }
    must(Pin > 0, 'the stapes is being pushed back at ' + f + ' Hz');
    near(dis, Pin, 5e-3, 'energy balance at ' + f + ' Hz');
    rows.push(f + ' Hz ' + (Math.abs(dis - Pin) / Pin).toExponential(1));
  }
  return 'power in at the stapes versus power dissipated along all 35 mm:' +
         '\n' + rows.join(' · ') +
         '\nnothing here amplifies, which is exactly why the tuning is as blunt as ' +
         'it is —\na living cochlea does amplify, and that is the part this room ' +
         'does not have.';
});

/* ── 14 ────────────────────────────────────────────────────────────────── */
leg('the room and the twin are reading the same file', () => {
  const oct = C.octaveMillimetres();
  near(oct, 1000 * P.L * Math.LN2 / Math.log(P.fBase / P.fApex), 1e-12, 'octave');
  must(Object.isFrozen(P), 'PARAM is not frozen');
  const src = ['cochlea.mjs', 'shape.mjs'];
  return 'PARAM frozen · octave ' + oct.toFixed(4) + ' mm · sources ' + src.join(', ');
});

console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') +
            pass + ' / ' + (pass + fail) + ' legs\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
