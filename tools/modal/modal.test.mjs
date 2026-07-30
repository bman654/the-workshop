#!/usr/bin/env node
/* ============================================================================
 *  tools/modal — the Node twin.   node tools/modal/modal.test.mjs
 *
 *  The bank claims three things and each one is measured off rendered audio,
 *  never off the coefficients that produced it:
 *    · a mode rings at the frequency you asked for  (measured by Goertzel and
 *      by zero crossings, which are independent of each other)
 *    · it decays with the T60 you asked for         (measured by a log-envelope
 *      fit over the rendered samples)
 *    · a finite contact is a low-pass                (measured against the
 *      closed-form raised-cosine spectrum)
 *  plus linearity, stability at the extremes of the audible band, and the
 *  no-backtick law that lets the file live inside an AudioWorklet.
 *  ========================================================================= */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ModalBank, poleRadius, radiusToT60, decayLaw, contactResponse, LN1000 } from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ok   ' + name + (detail ? '   ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + '   ' + detail); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const FS = 48000;

/* --- measurement rigs, deliberately independent of the synthesiser -------- */
function goertzel(buf, f, fs) {
  const w = 2 * Math.PI * f / fs, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < buf.length; i++) { const s = buf[i] + c * s1 - s2; s2 = s1; s1 = s; }
  return Math.hypot(s1 - s2 * Math.cos(w), s2 * Math.sin(w)) / buf.length;
}
function peakFreq(buf, fs, lo, hi) {           /* coarse scan then golden refine */
  let bf = lo, bv = -1;
  for (let f = lo; f <= hi; f += 0.5) { const v = goertzel(buf, f, fs); if (v > bv) { bv = v; bf = f; } }
  for (let step = 0.25; step > 1e-4; step *= 0.5) {
    for (const d of [-step, step]) {
      const v = goertzel(buf, bf + d, fs);
      if (v > bv) { bv = v; bf += d; }
    }
  }
  return bf;
}
function crossingFreq(buf, fs) {               /* zero crossings, a second opinion */
  let first = -1, last = -1, n = 0;
  for (let i = 1; i < buf.length; i++) {
    if (buf[i - 1] <= 0 && buf[i] > 0) {
      const t = i - 1 + buf[i - 1] / (buf[i - 1] - buf[i]);
      if (first < 0) first = t; last = t; n++;
    }
  }
  return n < 2 ? 0 : (n - 1) * fs / (last - first);
}
function fitT60(buf, fs) {                     /* least squares on log |envelope| */
  const win = Math.round(fs * 0.01);
  const xs = [], ys = [];
  for (let s = 0; s + win < buf.length; s += win) {
    let p = 0; for (let i = s; i < s + win; i++) p = Math.max(p, Math.abs(buf[i]));
    if (p > 1e-7) { xs.push((s + win / 2) / fs); ys.push(Math.log(p)); }
  }
  const n = xs.length;
  if (n < 4) return NaN;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  return -LN1000 / (sxy / sxx);
}
function renderStrike(bank, seconds, amps, contact = 0.0015) {
  const n = Math.round(seconds * FS);
  const out = new Float64Array(n);
  bank.reset();
  bank.strike(amps, contact);
  let done = 0;
  while (done < n) {
    const blk = Math.min(128, n - done);
    bank.render(out.subarray(done, done + blk), blk);
    done += blk;
  }
  return out;
}

console.log('\ntools/modal — the bank of resonators\n');

/* ── 1 · the pole algebra round-trips ─────────────────────────────────────── */
console.log('1 · the pole');
for (const t60 of [0.05, 0.5, 4.0]) {
  const r = poleRadius(t60, FS);
  ok('T60 ' + t60 + ' s -> r -> T60', near(radiusToT60(r, FS), t60, 1e-9), 'r=' + r.toFixed(8));
}

/* ── 2 · one mode rings at the frequency it was given ─────────────────────── */
console.log('\n2 · pitch, measured off the rendered samples');
for (const f of [55, 110, 261.6255, 1000, 4186]) {
  const b = new ModalBank(FS, 4);
  b.setMode(0, f, 2.0);
  b.setCount(1);
  const buf = renderStrike(b, 0.6, [1], 0.0004);
  const body = buf.subarray(Math.round(0.02 * FS));
  const g = peakFreq(body, FS, f * 0.9, f * 1.1);
  const z = crossingFreq(body, FS);
  const centsG = 1200 * Math.log2(g / f), centsZ = 1200 * Math.log2(z / f);
  ok('f = ' + f + ' Hz', Math.abs(centsG) < 1 && Math.abs(centsZ) < 1,
    'goertzel ' + g.toFixed(3) + ' (' + centsG.toFixed(3) + ' cents), crossings ' + z.toFixed(3) + ' (' + centsZ.toFixed(3) + ')');
}

/* ── 3 · it decays for as long as it was told to ──────────────────────────── */
console.log('\n3 · decay, measured off the envelope');
for (const t60 of [0.25, 1.0, 3.0]) {
  const b = new ModalBank(FS, 4);
  b.setMode(0, 440, t60);
  b.setCount(1);
  const buf = renderStrike(b, Math.min(t60 * 0.9, 2.5), [1], 0.0004);
  const m = fitT60(buf.subarray(Math.round(0.03 * FS)), FS);
  ok('T60 = ' + t60 + ' s', Math.abs(m / t60 - 1) < 0.02, 'measured ' + m.toFixed(4) + ' s');
}

/* ── 4 · the bank is linear: the whole equals the sum of its modes ────────── */
console.log('\n4 · linearity');
{
  const F = [180, 311, 437, 812], T = [1.2, 0.9, 0.7, 0.5], A = [1, 0.6, -0.35, 0.2];
  const all = new ModalBank(FS, 8);
  for (let i = 0; i < 4; i++) all.setMode(i, F[i], T[i], 1);
  all.setCount(4);
  const whole = renderStrike(all, 0.5, A);
  const sum = new Float64Array(whole.length);
  for (let i = 0; i < 4; i++) {
    const one = new ModalBank(FS, 2);
    one.setMode(0, F[i], T[i], 1); one.setCount(1);
    const b = renderStrike(one, 0.5, [A[i]]);
    for (let s = 0; s < sum.length; s++) sum[s] += b[s];
  }
  let err = 0, mag = 0;
  for (let s = 0; s < sum.length; s++) { err = Math.max(err, Math.abs(sum[s] - whole[s])); mag = Math.max(mag, Math.abs(whole[s])); }
  ok('4 modes together == 4 modes apart', err / mag < 1e-12, 'max rel diff ' + (err / mag).toExponential(2));
}

/* ── 5 · a finite contact is a low-pass, and it is the one in the closed form */
console.log('\n5 · the mallet');
{
  const T = 0.002;                                   /* 2 ms of contact */
  const rows = [];
  let worst = 0;
  for (const f of [100, 250, 500, 900]) {
    const b = new ModalBank(FS, 2);
    b.setMode(0, f, 3.0); b.setCount(1);
    const soft = renderStrike(b, 0.4, [1], T);
    const hard = renderStrike(b, 0.4, [1], 1 / FS);   /* one sample: flat spectrum */
    let ps = 0, ph = 0;
    for (let i = Math.round(0.05 * FS); i < soft.length; i++) { ps = Math.max(ps, Math.abs(soft[i])); ph = Math.max(ph, Math.abs(hard[i])); }
    const measured = ps / ph;
    const predicted = contactResponse(f, T);
    rows.push(f + ' Hz: ' + measured.toFixed(4) + ' vs ' + predicted.toFixed(4));
    worst = Math.max(worst, Math.abs(measured - predicted));
  }
  ok('raised-cosine roll-off matches sinc form', worst < 0.02, rows.join(' | '));
  ok('and has its first null exactly at 2/T', contactResponse(2 / T, T) < 1e-12,
    'null at ' + (2 / T) + ' Hz; at 1/T the form is 0/0 and worth exactly 1/2 (' + contactResponse(1 / T, T).toFixed(6) + ')');
}

/* ── 6 · stable, quiet and unclipped across the band ──────────────────────── */
console.log('\n6 · stability');
{
  const b = new ModalBank(FS, 64);
  for (let i = 0; i < 40; i++) b.setMode(i, 40 * Math.pow(1.14, i), 0.4 + 0.02 * i, 1 / 40);
  b.setCount(40);
  const buf = renderStrike(b, 6.0, new Array(40).fill(1));
  let peak = 0, finite = true, tail = 0;
  for (let i = 0; i < buf.length; i++) { peak = Math.max(peak, Math.abs(buf[i])); if (!Number.isFinite(buf[i])) finite = false; }
  for (let i = buf.length - FS; i < buf.length; i++) tail = Math.max(tail, Math.abs(buf[i]));
  ok('40 modes over 40 Hz .. 6.7 kHz stay finite', finite);
  ok('and decay away to nothing', tail < peak * 1e-3, 'peak ' + peak.toFixed(4) + ', last second ' + tail.toExponential(2));
}

/* ── 7 · the decay law is monotone and sane ───────────────────────────────── */
console.log('\n7 · the decay law');
{
  let mono = true;
  let prev = Infinity;
  const row = [];
  for (const f of [100, 220, 440, 880, 1760, 3520]) {
    const t = decayLaw(f, { t60at100: 4, brightness: 0.5 });
    row.push(f + ':' + t.toFixed(2) + 's');
    if (t > prev) mono = false;
    prev = t;
  }
  ok('high partials always die first', mono, row.join(' '));
}

/* ── 8 · the worklet law ──────────────────────────────────────────────────── */
console.log('\n8 · the worklet law');
{
  const src = readFileSync(join(__dirname, 'core.mjs'), 'utf8');
  ok('core.mjs contains no backtick', src.indexOf('`') === -1);
  ok('core.mjs contains no dollar-brace', src.indexOf('${') === -1);
  ok('core.mjs never touches the DOM', !/\b(document|window|navigator)\b/.test(src));
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' green') + '\n');
process.exit(fail ? 1 : 0);
