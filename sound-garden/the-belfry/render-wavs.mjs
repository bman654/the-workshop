/* ============================================================================
 *  THE BELFRY — render-wavs.mjs   ·   the voice, as numbers you can look at
 *
 *      node sound-garden/the-belfry/render-wavs.mjs [outdir]
 *
 *  Renders the same modal bank the AudioWorklet runs — nine partials per bell
 *  in the English tuning, one complex phasor per mode per sample, struck in
 *  phase — to WAV files, so the audio-lens can be pointed at them.
 *
 *  THE CLAIM THIS IS FOR: the note you hear from a bell is not in the bell.
 *  Nominal, superquint and octave nominal stand as 2 : 3 : 4, and the ear
 *  supplies the missing 1.  So MUTE the hum and the prime — every partial at
 *  or below the strike note — and the pitch you hear does not move.  The room
 *  lets you do that with a button; this renders both cases so a pitch detector
 *  can be pointed at them instead of an opinion.
 *  ========================================================================= */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PARTIALS, bellModes, ringOfBells, tenorBell, swing } from './bell.mjs';

const SR = 44100;
const OUT = process.argv[2] || '/tmp/belfry-wavs';
mkdirSync(OUT, { recursive: true });

/* the worklet's resonator, sample for sample */
function renderBlow(hz, t60, seconds, groups = { hum: 1, prime: 1, upper: 1, strike: 1 }, amp = 1) {
  const n = Math.floor(SR * seconds);
  const out = new Float32Array(n);
  const modes = bellModes(hz, t60);
  let worst = 0;
  for (const m of modes) worst += m.amp;
  for (let k = 0; k < modes.length; k++) {
    const m = modes[k];
    if (!groups[m.key]) continue;
    const w = 2 * Math.PI * m.f / SR;
    const c = Math.cos(w), s = Math.sin(w);
    const d = Math.exp(-6.9078 / (m.t60 * SR));
    const bright = Math.pow(amp, 0.35 + 0.22 * k / modes.length);
    let re = m.amp * bright, im = 0;
    for (let i = 0; i < n; i++) {
      const x = re, y = im;
      re = (x * c - y * s) * d;
      im = (x * s + y * c) * d;
      out[i] += re;
    }
  }
  for (let i = 0; i < n; i++) out[i] /= worst;
  return out;
}

function wav(path, ch) {
  const n = ch[0].length, nc = ch.length;
  const buf = Buffer.alloc(44 + n * nc * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * nc * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(nc, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * nc * 2, 28); buf.writeUInt16LE(nc * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * nc * 2, 40);
  let o = 44, peak = 0;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) peak = Math.max(peak, Math.abs(ch[c][i]));
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const v = Math.max(-1, Math.min(1, ch[c][i]));
      buf.writeInt16LE(Math.round(v * 32767), o); o += 2;
    }
  }
  writeFileSync(path, buf);
  return peak;
}

const BELLS = ringOfBells(196.0);
const tenor = BELLS[5];
const ALL = { hum: 1, prime: 1, upper: 1, strike: 1 };
const STRIKE_ONLY = { hum: 0, prime: 0, upper: 0, strike: 1 };

/* 1 · one blow on the tenor, everything sounding */
const a = renderBlow(tenor.hz, tenor.humT60, 5.0, ALL);
/* 2 · the same blow with every partial at or below the strike note removed */
const b = renderBlow(tenor.hz, tenor.humT60, 5.0, STRIKE_ONLY);
/* 3 · rounds on all six, at the room's own speed */
const rowTime = 1.86, gap = rowTime / 6;
const rounds = new Float32Array(Math.floor(SR * 9));
for (let row = 0; row < 4; row++) {
  for (let i = 0; i < 6; i++) {
    const p = BELLS[i];
    const t = row * (rowTime + (row % 2 === 0 ? gap : 0)) + i * gap;
    const s0 = Math.floor(t * SR);
    const v = renderBlow(p.hz, p.humT60, 4.0, ALL, 0.85);
    for (let k = 0; k < v.length && s0 + k < rounds.length; k++) rounds[s0 + k] += v[k] * 0.42;
  }
}

const pk1 = wav(join(OUT, 'tenor-all-partials.wav'), [a]);
const pk2 = wav(join(OUT, 'tenor-strike-group-only.wav'), [b]);
const pk3 = wav(join(OUT, 'rounds-on-six.wav'), [rounds]);

console.log('wrote to ' + OUT);
console.log('  tenor-all-partials.wav        peak ' + pk1.toFixed(3) +
            '   nominal ' + (tenor.hz * 2).toFixed(1) + ' Hz, strike note ' + tenor.hz.toFixed(1) + ' Hz');
console.log('  tenor-strike-group-only.wav   peak ' + pk2.toFixed(3) +
            '   partials present: ' + PARTIALS.filter((q) => q.key === 'strike')
              .map((q) => q.name + ' ' + (tenor.hz * q.ratio).toFixed(0)).join(', '));
console.log('  rounds-on-six.wav             peak ' + pk3.toFixed(3) +
            '   ' + rowTime + ' s a row, open handstroke');
console.log('\nWHAT THE LENS SAYS, and it is worth saying out loud: pointed at (2) a pitch');
console.log('detector reports the NOMINAL, G4 at 392 Hz — not the strike note at 196.  It');
console.log('is right: there is nothing at 196 Hz in that file.  The strike note is a');
console.log('PERCEPTUAL pitch, the missing fundamental of a 2 : 3 : 4, and a machine has no');
console.log('ear to supply it with.  The room says so rather than claiming a green check it');
console.log('has not got.');
