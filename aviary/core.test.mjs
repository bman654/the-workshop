/* ============================================================================
 *  THE AVIARY -- the Node twin.
 *
 *  Runs the identical arithmetic the audio thread runs, and checks the room's
 *  claims against it with no browser in the way:
 *
 *   A. the file discipline the forge needs (no backtick anywhere in the two
 *      cores, because they are handed to the worklet inside a String.raw)
 *   B. the algebra is self-consistent: the saddle-node parametrisation really
 *      is a double root, the Hopf line really has zero trace
 *   C. THE CLAIM, part one -- WHERE IT SINGS.  Bisect the sounding boundary out
 *      of the integrated waveform and put it next to the formulas.  Nothing
 *      sings at or below the Hopf line; everything above the fold sings; the
 *      upper edge lands on alpha = beta + 2.
 *   D. THE CLAIM, part two -- WHAT PITCH.  The note is born at
 *      f = gamma*sqrt(beta)/(2 pi); measured against the waveform, under 1 %.
 *   E. hysteresis: a syrinx already singing keeps singing below the pressure
 *      that would have started it -- and only inside the predicted lens.
 *   F. the whole bird renders finite, in range, and not silent.
 *
 *      node aviary/core.test.mjs            (add --wav to also write /tmp WAVs)
 * ========================================================================== */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  rk4, dudtau, HOPF_ALPHA, upperAlpha, snAlpha, SN_BETA_MAX, xStar,
  onsetOmega, omegaToHz, hzToBeta, mustSing, Syrinx, Tract, Bird,
  sustainedAmp, sustainedOmega, measureOnset, measureOffset, TWO_PI,
  airPressure, A_REST,
} from './core.mjs';
import { SPECIES, samplePath, speciesById, packSpecies } from './song.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok   ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + '  (' + a.toFixed(6) + ' vs ' + b.toFixed(6) + ', tol ' + tol + ')');
const head = (s) => console.log('\n' + s);

/* ── A. file discipline ─────────────────────────────────────────────────── */
head('A. the two cores may not contain a backtick (String.raw into the worklet)');
for (const f of ['core.mjs', 'song.mjs', 'worklet.js']) {
  const t = fs.readFileSync(path.join(HERE, f), 'utf8');
  ok(t.indexOf('`') < 0, f + ' is backtick-free');
}

/* ── B. the algebra is self-consistent ──────────────────────────────────── */
head('B. the predictions are internally consistent');
{
  let worstP = 0, worstD = 0;
  for (let i = 1; i < 40; i++) {
    const beta = SN_BETA_MAX * i / 40;
    const a = snAlpha(beta);
    /* the fold must be a DOUBLE root: p(x)=0 and p'(x)=0 share an x */
    let xs = null, best = 1e9;
    for (let j = 0; j <= 4000; j++) {
      const x = 0.4 + 0.35 * j / 4000;
      const d = Math.abs(3 * x * x - 2 * x + beta);
      if (d < best) { best = d; xs = x; }
    }
    worstD = Math.max(worstD, best);
    worstP = Math.max(worstP, Math.abs(xs * xs * xs - xs * xs + beta * xs + a));
  }
  ok(worstP < 2e-4, 'saddle-node alpha(beta) is a root of the cubic at the fold  (max |p| ' + worstP.toExponential(2) + ')');
  ok(snAlpha(SN_BETA_MAX - 1e-9) < 1e-6, 'the fold meets the Hopf line at beta = 1/4');
  near(snAlpha(1e-9), 4 / 27, 1e-4, 'the fold reaches 4/27 at x = 2/3 as beta -> 0');
  ok(snAlpha(0.4) === null, 'no fold above beta = 1/4');
  /* the trace really does vanish where we say it does */
  const trace = (x) => -(x * x + x);
  near(trace(0), 0, 1e-12, 'trace vanishes at x = 0 (the Hopf line, alpha = 0)');
  near(trace(-1), 0, 1e-12, 'trace vanishes at x = -1 (the upper edge, alpha = beta+2)');
  /* and x=0 on the cubic really does force alpha = 0 */
  ok(Math.abs(xStar(0.0, 1.0)) < 1e-8, 'alpha = 0 puts the equilibrium exactly at x = 0');
  near(hzToBeta(omegaToHz(onsetOmega(0.7), 23500), 23500), 0.7, 1e-9, 'beta <-> Hz round-trips');
}

/* ── C. WHERE IT SINGS ──────────────────────────────────────────────────── */
head('C. the sounding boundary, bisected out of the waveform');
console.log('   beta   predicted-floor  measured-onset      predicted-roof  measured-roof');
{
  const betas = [0.03, 0.05, 0.08, 0.10, 0.40, 0.70, 1.20, 2.00];
  let maxFoldErr = 0, maxRoofErr = 0, anyBelowHopf = false;
  for (const b of betas) {
    const on = measureOnset(b, {});
    /* the roof: walk down from above beta+2 until it sounds */
    let roof = null;
    for (let a = b + 2.5; a > b + 1.5; a -= 0.002) {
      if (sustainedAmp(a, b, {}).amp > 0.05) { roof = a; break; }
    }
    const sn = snAlpha(b);
    const floor = sn === null ? HOPF_ALPHA : sn;
    console.log('   ' + b.toFixed(2).padStart(5) + '   ' + floor.toFixed(5).padStart(9)
      + '        ' + (on === null ? '  none ' : on.toFixed(5)).padStart(9)
      + '        ' + (b + 2).toFixed(5).padStart(9) + '     ' + (roof === null ? 'none' : roof.toFixed(5)));
    if (on !== null && on <= HOPF_ALPHA) anyBelowHopf = true;
    if (sn !== null && b <= 0.12) maxFoldErr = Math.max(maxFoldErr, Math.abs(on - sn));
    if (roof !== null) maxRoofErr = Math.max(maxRoofErr, Math.abs(roof - (b + 2)));
  }
  ok(!anyBelowHopf, 'NOTHING sounds at or below the Hopf line alpha = 0');
  ok(maxFoldErr < 2e-3, 'below beta = 0.12 the measured onset IS the fold  (worst ' + maxFoldErr.toExponential(2) + ')');
  ok(maxRoofErr < 0.01, 'the roof is alpha = beta + 2  (worst ' + maxRoofErr.toFixed(4) + ')');
}
head('C2. above the fold the model has no quiet state left, so it must sing');
{
  let checked = 0, sang = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 5; j++) {
      const beta = 0.02 + 1.9 * i / 6;
      const lo = mustSingFloor(beta);
      const alpha = lo + (upperAlpha(beta) - lo) * (0.12 + 0.72 * j / 4);
      if (!mustSing(alpha, beta)) continue;
      checked++;
      if (sustainedAmp(alpha, beta, {}).amp > 0.05) sang++;
    }
  }
  ok(checked > 20 && sang === checked, sang + '/' + checked + ' points inside the must-sing region actually sound');
}
function mustSingFloor(beta) { const s = snAlpha(beta); return s === null ? 0 : s; }

/* ── D. WHAT PITCH ──────────────────────────────────────────────────────── */
head('D. the pitch the note is born with is the eigenvalue, to under 1 %');
console.log('   beta   predicted Hz (gamma 23500)   measured Hz    error');
{
  let worst = 0;
  for (const b of [0.30, 0.45, 0.60, 0.80, 1.00, 1.40, 1.80, 2.40]) {
    const w = sustainedOmega(0.004, b, {});
    const predHz = omegaToHz(onsetOmega(b), 23500);
    const measHz = omegaToHz(w, 23500);
    const err = Math.abs(measHz / predHz - 1);
    worst = Math.max(worst, err);
    console.log('   ' + b.toFixed(2).padStart(5) + '        ' + predHz.toFixed(1).padStart(8)
      + '                 ' + measHz.toFixed(1).padStart(8) + '     ' + (err * 100).toFixed(3) + ' %');
  }
  ok(worst < 0.01, 'worst error across the register is ' + (worst * 100).toFixed(3) + ' %');
}
head('D2. and it is a THRESHOLD claim ONLY -- the note moves once the cycle is big');
{
  const b = 1.0;
  const soft = omegaToHz(sustainedOmega(0.004, b, {}), 23500);
  const loud = omegaToHz(sustainedOmega(1.0, b, {}), 23500);
  /* the same linear formula evaluated at the equilibrium alpha has MOVED to */
  const xs = xStar(1.0, b);
  const lin = omegaToHz(Math.sqrt(b + 3 * xs * xs - 2 * xs), 23500);
  console.log('   beta 1.0:  at threshold ' + soft.toFixed(0) + ' Hz,  blown hard ' + loud.toFixed(0)
    + ' Hz,  linear-at-the-shifted-equilibrium ' + lin.toFixed(0) + ' Hz');
  ok(loud > soft * 1.05, 'blowing harder measurably SHARPENS the note (as a bird does)');
  ok(loud < lin * 0.95, '... but by less than linearising at the new equilibrium says -- the cycle is big and the algebra is local');
}

/* ── E. the Hopf line is a floor from EVERY direction ───────────────────── */
head('E. the Hopf line is a hard floor -- you cannot get under it from either side');
console.log('   beta   onset from rest   offset winding down   fold');
{
  let worstUnder = 0, anyDiffer = false;
  for (const b of [0.05, 0.10, 0.16, 0.20, 0.60, 1.50]) {
    const on = measureOnset(b, {});
    const off = measureOffset(b, {});
    const sn = snAlpha(b);
    if (off < -0.003) worstUnder = Math.min(worstUnder, off);
    if (Math.abs(off - on) > 0.004) anyDiffer = true;
    console.log('   ' + b.toFixed(2).padStart(5) + '        ' + on.toFixed(5).padStart(8)
      + '            ' + off.toFixed(5).padStart(8) + '        ' + (sn === null ? '  --   ' : sn.toFixed(5)));
  }
  ok(worstUnder >= -0.003, 'winding a singing syrinx down never keeps it below alpha = 0 either');
  ok(anyDiffer, 'the two thresholds are NOT the same number -- below beta = 1/4 a quiet state and a song can both exist, and which you get depends on where you came from');
}

/* ── F. the whole bird ──────────────────────────────────────────────────── */
head('F. the birds themselves render');
const SR = 44100;
function renderSpecies(sp, seconds, opts) {
  opts = opts || {};
  const pk = packSpecies(sp);
  const bird = new Bird(SR, { gamma: pk.gamma, lengthM: pk.lengthM, gain: pk.gain, substeps: 14 });
  if (opts.side) bird.side = opts.side;
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const phrase = pk.phrases[opts.phrase || 0];
  const slew = Math.exp(-1 / (0.0025 * SR));
  let aL = A_REST, bL = 0.5, aR = A_REST, bR = 0.5;
  let pi = 0, tg = 0, gap = 0;
  for (let i = 0; i < n; i++) {
    let t1 = A_REST, t2 = A_REST, tb1 = bL, tb2 = bR;
    if (pi < phrase.length) {
      if (gap > 0) { gap -= 1 / SR; if (gap <= 0) { pi++; tg = 0; } }
      else {
        const g = pk.gestures[phrase[pi][0]];
        const t = tg / g.dur;
        if (t >= 1) { gap = phrase[pi][1]; tg = 0; if (gap <= 0) pi++; }
        else {
          const p = samplePath(g.pts, t); t1 = airPressure(p[0]); tb1 = p[1];
          if (g.pts2) { const q = samplePath(g.pts2, t); t2 = airPressure(q[0]); tb2 = q[1]; } else tb2 = p[1];
          tg += 1 / SR;
        }
      }
    }
    aL = t1 + (aL - t1) * slew; bL = tb1 + (bL - tb1) * slew;
    aR = t2 + (aR - t2) * slew; bR = tb2 + (bR - tb2) * slew;
    out[i] = bird.tick(aL, bL, aR, bR);
  }
  return out;
}
{
  let allFinite = true, allInRange = true;
  const rms = [];
  for (const sp of SPECIES) {
    const y = renderSpecies(sp, 3.2);
    let s = 0, mx = 0;
    for (let i = 0; i < y.length; i++) {
      if (!isFinite(y[i])) allFinite = false;
      s += y[i] * y[i]; if (Math.abs(y[i]) > mx) mx = Math.abs(y[i]);
    }
    const r = Math.sqrt(s / y.length);
    rms.push(r);
    if (mx > 6) allInRange = false;
    console.log('   ' + sp.name.padEnd(15) + ' rms ' + r.toFixed(4) + '   peak ' + mx.toFixed(3));
  }
  ok(allFinite, 'every voice is finite everywhere');
  ok(allInRange, 'no voice runs away');
  ok(rms.every((r) => r > 0.004), 'every voice actually makes a sound');
}
head('F2. two voices are two voices -- and the second one has its OWN predicted pitch');
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
      }
    }
  }
}
function bandEnergy(y, sr, f0, f1) {
  const N = 32768;
  const re = new Float64Array(N), im = new Float64Array(N);
  const off = Math.min(2000, Math.max(0, y.length - N));
  for (let i = 0; i < N && off + i < y.length; i++) {
    const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    re[i] = y[off + i] * w;
  }
  fft(re, im);
  let e = 0;
  const i0 = Math.max(1, Math.round(f0 / sr * N)), i1 = Math.min(N / 2 - 1, Math.round(f1 / sr * N));
  for (let i = i0; i <= i1; i++) e += re[i] * re[i] + im[i] * im[i];
  return e;
}
{
  /* the Chatterer's buzz, held steady, so the two predicted pitches are exact */
  const sp = speciesById('chatterer');
  const g = packSpecies(sp).gestures.bz;
  const b1 = g.pts[2][2], b2 = g.pts2[2][2];
  const f1 = omegaToHz(onsetOmega(b1), sp.gamma), f2 = omegaToHz(onsetOmega(b2), sp.gamma);
  const hold = (side) => {
    const bird = new Bird(SR, { gamma: sp.gamma, lengthM: sp.lengthM, gain: sp.gain, substeps: 18 });
    bird.side = side;
    const n = SR, y = new Float32Array(n);
    /* held just above threshold, where the eigenvalue is still the pitch */
    for (let i = 0; i < n; i++) y[i] = bird.tick(0.015, b1, 0.015, b2);
    return y;
  };
  const both = hold(0), left = hold(1);
  const w = 60;
  const e2both = bandEnergy(both, SR, f2 - w, f2 + w);
  const e2left = bandEnergy(left, SR, f2 - w, f2 + w);
  const e1both = bandEnergy(both, SR, f1 - w, f1 + w);
  const e1left = bandEnergy(left, SR, f1 - w, f1 + w);
  console.log('   left syrinx  beta ' + b1.toFixed(3) + ' -> predicted ' + f1.toFixed(0) + ' Hz');
  console.log('   right syrinx beta ' + b2.toFixed(3) + ' -> predicted ' + f2.toFixed(0) + ' Hz');
  console.log('   energy at the RIGHT voice pitch:  both ' + e2both.toExponential(2)
    + ',  right shut ' + e2left.toExponential(2) + '   (' + (10 * Math.log10(e2both / e2left)).toFixed(1) + ' dB)');
  console.log('   energy at the LEFT voice pitch:   both ' + e1both.toExponential(2)
    + ',  right shut ' + e1left.toExponential(2) + '   (' + (10 * Math.log10(e1both / e1left)).toFixed(1) + ' dB)');
  ok(e2both > e2left * 20, 'the right voice puts its OWN predicted pitch in the spectrum, and shutting it takes that line away');
  ok(e1both > e1left * 0.25, '... while the left voice line survives -- these are two sources, not one detuned one');
  /* neither pitch is a harmonic of the other: this is why it buzzes */
  const r = f2 / f1;
  console.log('   ratio ' + r.toFixed(4) + ' (nearest simple ratio 3:2 = 1.5000, 4:3 = 1.3333)');
  ok(Math.abs(r - Math.round(r)) > 0.1, 'and the second pitch is not a harmonic of the first');
}

/* ── the ear-check WAVs ─────────────────────────────────────────────────── */
if (process.argv.includes('--wav')) {
  const dir = '/tmp/aviary-wavs';
  fs.mkdirSync(dir, { recursive: true });
  const writeWav = (name, y, sr) => {
    const n = y.length;
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
    buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28);
    buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
    buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
    let mx = 1e-9; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(y[i]));
    const g = 0.89 / mx;
    for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(y[i] * g * 32767))), 44 + i * 2);
    fs.writeFileSync(path.join(dir, name), buf);
    console.log('   wrote ' + path.join(dir, name));
  };
  head('WAVs for the ear-check');
  /* Steady tones held just above the Hopf line, at betas whose predicted pitch
     is a named note.  All four are above beta = 1/4, which is where the note is
     born AT the Hopf; below that it is born on the fold with a finite amplitude
     and the eigenvalue is not its pitch. */
  for (const [nm, hz] of [['tone-c7-2093', 2093.00], ['tone-e7-2637', 2637.02],
                          ['tone-a7-3520', 3520.00], ['tone-c8-4186', 4186.01]]) {
    const gamma = 23500;
    const beta = hzToBeta(hz, gamma);
    const bird = new Bird(SR, { gamma: gamma, lengthM: 0.03, gain: 0.5, substeps: 24 });
    const n = SR * 2, y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const env = i < 2000 ? i / 2000 : (i > n - 3000 ? (n - i) / 3000 : 1);
      y[i] = bird.tick(0.004 * env, beta, 0, beta);
    }
    writeWav(nm + '.wav', y, SR);
    console.log('     beta ' + beta.toFixed(5) + ' -> predicted ' + hz.toFixed(2) + ' Hz');
  }
  /* the fold, audibly: hold a low tension and wind the pressure up through it.
     Nothing, nothing, nothing -- and then a note that starts LOUD, because a
     saddle-node does not fade in. */
  {
    const gamma = 23500, beta = 0.06;
    const fold = snAlpha(beta);
    const bird = new Bird(SR, { gamma: gamma, lengthM: 0.03, gain: 0.5, substeps: 20 });
    const n = SR * 4, y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = bird.tick(0.24 * i / n, beta, 0, beta);
    writeWav('the-fold.wav', y, SR);
    console.log('     beta ' + beta + ', pressure 0 -> 0.24 over 4 s; the fold is at alpha '
      + fold.toFixed(5) + ', i.e. ' + (fold / 0.24 * 4).toFixed(2) + ' s in');
  }
  for (const sp of SPECIES) writeWav(sp.id + '.wav', renderSpecies(sp, 3.4), SR);
  writeWav('chatterer-one-voice.wav', renderSpecies(speciesById('chatterer'), 2.6, { side: 1 }), SR);
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'RED') + ' -- ' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail === 0 ? 0 : 1);
