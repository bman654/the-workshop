/* ============================================================================
 *  THE WIND CHIMES — render the room's own voice to WAVs, in Node.
 *  Run:  node sound-garden/the-wind-chimes/render-wavs.mjs [outdir]
 *
 *  No browser and no hooks: the AudioWorklet's DSP is core.mjs, so Node can
 *  play the same tubes into a file.  verify.sh then hands these to the
 *  audio-lens, which reads sound as numbers and a spectrogram — the only ears
 *  this loop has.
 *
 *  tube-0 … tube-5   one tap on each tube, lowest to highest
 *  node / middle     the SAME tube hung at 0.2242 and at 0.5 — the claim, audible
 *  centre / third    the SAME tube struck at 0.5 and at 0.35 — the timbre, audible
 *  gust              a minute of real wind at 2.6 m/s, played by the rig itself
 *  calm              the rig in dead air: digital silence
 * ========================================================================== */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ChimeRig, ModalBank, PENT_SEMIS, renderStrike } from './core.mjs';
import { semiToFreq } from '../pitch-core.mjs';

const SR = 44100;
const out = process.argv[2] || '/tmp/chime-wavs';
mkdirSync(out, { recursive: true });

function wav(name, chans) {
  const n = chans[0].length, nc = chans.length;
  const bytes = 44 + n * nc * 2;
  const b = Buffer.alloc(bytes);
  b.write('RIFF', 0); b.writeUInt32LE(bytes - 8, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(nc, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * nc * 2, 28); b.writeUInt16LE(nc * 2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * nc * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) {
    const v = Math.max(-1, Math.min(1, chans[c][i]));
    b.writeInt16LE(Math.round(v * 32767), o); o += 2;
  }
  const p = join(out, name + '.wav');
  writeFileSync(p, b);
  console.log('  ' + p + '   ' + (n / SR).toFixed(1) + ' s, ' + nc + ' ch');
}

const F1 = PENT_SEMIS.map(semiToFreq);
const rig = new ChimeRig({ freqs: F1 });
console.log('rendering to ' + out);

/* one tap on each tube */
for (let i = 0; i < rig.nT; i++) {
  const buf = renderStrike(F1[i], 0.2242, { sr: SR, seconds: 9, vel: 0.34, xiStrike: 0.42, thud: false, gain: 0.5 });
  wav('tube-' + i, [buf]);
}

/* the claim, as two sounds */
wav('node', [renderStrike(F1[0], 0.2242, { sr: SR, seconds: 14, vel: 0.34, xiStrike: 0.42, thud: false, gain: 0.5 })]);
wav('middle', [renderStrike(F1[0], 0.5000, { sr: SR, seconds: 14, vel: 0.34, xiStrike: 0.42, thud: false, gain: 0.5 })]);

/* the timbre, as two sounds */
wav('centre', [renderStrike(F1[0], 0.2242, { sr: SR, seconds: 6, vel: 0.34, xiStrike: 0.50, thud: false, gain: 0.5 })]);
wav('third', [renderStrike(F1[0], 0.2242, { sr: SR, seconds: 6, vel: 0.34, xiStrike: 0.35, thud: false, gain: 0.5 })]);

/* the room, played by its own weather */
function weather(speed, secs, name) {
  const r = new ChimeRig({ freqs: F1, wind: { speed: speed } });
  const bank = new ModalBank(r.freqs, SR, { pans: r.az.map((a) => Math.sin(a) * 0.62), gain: 0.30 });
  const n = Math.round(SR * secs), L = new Float32Array(n), R = new Float32Array(n);
  const block = 512, dt = block / SR;
  let hits = 0;
  for (let i = 0; i < n; i += block) {
    for (const e of r.step(dt)) { bank.strike(e.tube, e.vel, e.xi); hits++; }
    const m = Math.min(block, n - i);
    bank.setWind(Math.min(1.6, Math.hypot(...r.wind.at(r.wind.t)) * 0.26));
    bank.render(L.subarray(i, i + m), R.subarray(i, i + m), m);
  }
  console.log('  (' + name + ': ' + hits + ' strikes in ' + secs + ' s of ' + speed + ' m/s air)');
  wav(name, [L, R]);
}
weather(2.6, 60, 'gust');
weather(0.0, 6, 'calm');
