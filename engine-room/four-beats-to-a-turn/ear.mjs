/* ═══════════════════════════════════════════════════════════════════════════
   FOUR BEATS TO A TURN — the ear check.
     node engine-room/four-beats-to-a-turn/ear.mjs

   The room's claim is about a SOUND, so it has to be checked as a sound and not
   only as a number. This renders the exhaust the way the page plays it — the
   same loco.mjs step(), the same beat instants, the same chuff() voice — into a
   WAV, and hands it to tools/audio-lens to be measured by something that knows
   nothing about locomotives.

   Three renders:
     A  a steady run:  the tempo audio-lens reads back must be 4 v / (pi D)
     B  a slipping engine: the same measurement, now four times the road speed
     C  a badly quartered engine: the same COUNT, an uneven beat

   It also writes spectrograms, because a picture of the beat train is the one
   thing that shows the limp at a glance.
   ═══════════════════════════════════════════════════════════════════════════ */
import * as L from './loco.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const LENS = join(REPO, 'tools/audio-lens/bin/audio-lens.js');
const OUT = '/tmp/four-beats-ear';
mkdirSync(OUT, { recursive: true });

const SR = 48000;
let pass = 0, fail = 0;
const ok = (n, c, d) => {
  if (c) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + n + (d ? '   \x1b[2m' + d + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + n + (d ? '   ' + d : '')); }
};

/* Run the engine, collect (time, strength) for every beat, and render.
   `hold` is a target road speed: the test then works the BRAKE with a plain
   proportional controller to sit the train at that speed, exactly as a driver
   would, so the measurement is of a steady engine and not of one still
   accelerating. It is scaffolding on a control the room already has; nothing
   inside loco.mjs knows about it. */
function render(name, ctl0, warmSec, recSec, over) {
  const ctl = Object.assign({}, ctl0);
  const st = L.newState(Object.assign({ wagons: ctl.wagons, sand: ctl.sand }, over || {}));
  const dt = 1 / 4000;
  const drive = () => {
    if (ctl.hold === undefined) return;
    ctl.brake = L.clamp((ctl.brake || 0) + (st.v - ctl.hold) * dt * 1.6, 0, 1);
  };
  for (let i = 0; i < warmSec / dt; i++) { drive(); L.step(st, dt, ctl); }
  const t0 = st.t;
  const beats = [];
  let vSum = 0, wSum = 0, n = 0;
  for (let i = 0; i < recSec / dt; i++) {
    drive();
    const fired = L.step(st, dt, ctl);
    for (const b of fired) beats.push({ t: st.t - dt + b.frac * dt - t0, s: b.strength });
    vSum += st.v; wSum += Math.abs(st.omega); n++;
  }
  const buf = new Float32Array(Math.round(recSec * SR) + SR);
  const sharp = 1 - Math.min(1, ctl.cutoff / 0.85);
  for (const b of beats) {
    const g = L.clamp(b.s / 70000, 0, 1);
    const v = L.chuff(SR, g, sharp, 4242);
    const at = Math.round(b.t * SR);
    for (let i = 0; i < v.length; i++) if (at + i < buf.length) buf[at + i] += v[i] * 0.62;
  }
  let pk = 0;
  for (let i = 0; i < buf.length; i++) pk = Math.max(pk, Math.abs(buf[i]));
  const path = join(OUT, name + '.wav');
  writeFileSync(path, wav16(buf, SR));
  return { path, beats, vBar: vSum / n, wBar: wSum / n, peak: pk, recSec, ctl };
}
function wav16(f32, sr) {
  const n = f32.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    let v = Math.max(-1, Math.min(1, f32[i]));
    b.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return b;
}
const lens = (file, flag) => JSON.parse(execFileSync('node', [LENS, 'analyze', file, flag], { encoding: 'utf8' }));
const lensJSON = (file, extra) =>
  JSON.parse(execFileSync('node', [LENS, 'analyze', file].concat(extra || []), { encoding: 'utf8' }));

console.log('\n\x1b[1mA  a steady run — the tempo IS the speed\x1b[0m');
{
  /* choose a modest cut-off so the engine settles at a countable beat rate */
  const ctl = { regulator: 0.55, cutoff: 0.32, brake: 0.1, sand: true, wagons: 5, hold: 4.5 };
  const r = render('steady', ctl, 90, 14);
  const predicted = L.beatsPerSecFromSpeed(r.vBar);
  const counted = (r.beats.length - 1) / (r.beats[r.beats.length - 1].t - r.beats[0].t);
  console.log('     v = ' + (r.vBar * 3.6).toFixed(2) + ' km/h, ' + r.beats.length + ' beats in '
              + r.recSec + ' s, peak ' + r.peak.toFixed(3));
  ok('the rendered beats sit at 4 v / (pi D)', Math.abs(counted - predicted) / predicted < 0.01,
     'counted ' + counted.toFixed(3) + ' /s, predicted ' + predicted.toFixed(3) + ' /s');
  const bpm = lens(r.path, '--tempo').tempo;
  const wantBPM = predicted * 60;
  ok('audio-lens, which knows nothing about locomotives, hears ' + bpm.toFixed(1) + ' BPM',
     Math.abs(bpm - wantBPM) / wantBPM < 0.03, 'the crank says ' + wantBPM.toFixed(1) + ' BPM');
  ok('and the pi D behind it: one beat is ' + (Math.PI * L.SPEC.wheelD / 4).toFixed(4) + ' m of railway',
     Math.abs(r.vBar / counted - Math.PI * L.SPEC.wheelD / 4) < 0.02,
     'measured ' + (r.vBar / counted).toFixed(4) + ' m per beat');
  const j = lensJSON(r.path, ['--spectrogram', join(OUT, 'steady.png')]);
  ok('it does not clip', j.clipping === false, 'peak ' + j.peak.peakDb.toFixed(2) + ' dBFS');
  ok('and it is not silence', j.meanRms > -45, 'mean rms ' + j.meanRms.toFixed(2) + ' dBFS');
  ok('audio-lens finds ' + j.onsets + ' onsets in ' + j.durationSec + ' s of it', j.onsets > 40);
}

console.log('\n\x1b[1mB  a second speed — a relationship, not a coincidence\x1b[0m');
{
  const ctl = { regulator: 0.7, cutoff: 0.34, brake: 0.1, sand: true, wagons: 5, hold: 6.9 };
  const r = render('faster', ctl, 90, 14);
  const predicted = L.beatsPerSecFromSpeed(r.vBar);
  const bpm = lens(r.path, '--tempo').tempo;
  console.log('     v = ' + (r.vBar * 3.6).toFixed(2) + ' km/h');
  ok('audio-lens hears ' + bpm.toFixed(1) + ' BPM at ' + (r.vBar * 3.6).toFixed(1) + ' km/h',
     Math.abs(bpm - predicted * 60) / (predicted * 60) < 0.04,
     'the crank says ' + (predicted * 60).toFixed(1) + ' BPM');
}

console.log('\n\x1b[1mB2 a slipping engine — the roar, and why you cannot COUNT it\x1b[0m');
{
  /* both clips at about the same ROAD speed. One is gripping; one has the
     regulator wide open on greasy rail with a heavy train behind it. */
  const grip = render('grip10', { regulator: 0.5, cutoff: 0.28, brake: 0.1, sand: true, wagons: 5, hold: 3.0 }, 80, 8);
  const slip = render('slip10', { regulator: 1.0, cutoff: 0.85, sand: false, wagons: 8 }, 6, 8);
  const jg = lensJSON(grip.path, ['--spectrogram', join(OUT, 'grip10.png')]);
  const js = lensJSON(slip.path, ['--spectrogram', join(OUT, 'slip10.png')]);
  const rg = (grip.beats.length - 1) / (grip.beats[grip.beats.length - 1].t - grip.beats[0].t);
  const rs = (slip.beats.length - 1) / (slip.beats[slip.beats.length - 1].t - slip.beats[0].t);
  console.log('     gripping  ' + (grip.vBar * 3.6).toFixed(1) + ' km/h, ' + rg.toFixed(1) + ' beats/s');
  console.log('     slipping  ' + (slip.vBar * 3.6).toFixed(1) + ' km/h, ' + rs.toFixed(1) + ' beats/s'
              + ' (rim ' + (slip.wBar * L.wheelR() * 3.6).toFixed(0) + ' km/h)');
  ok('at similar road speeds the slipping engine fires ' + (rs / rg).toFixed(1)
     + 'x as many beats', rs > 3.5 * rg);
  ok('and the ear hears the difference as a ROAR: silence between beats falls from '
     + (jg.silenceRatio * 100).toFixed(0) + ' % to ' + (js.silenceRatio * 100).toFixed(0) + ' %',
     jg.silenceRatio > 2.5 * js.silenceRatio);
  /* the honest limit, stated rather than hidden: past about eight beats a second
     the chuffs overlap and NO onset detector can separate them — which is why a
     driver stops counting and starts listening to the roar. */
  ok('audio-lens can count the gripping engine (' + (jg.onsets / jg.durationSec).toFixed(1)
     + '/s vs ' + rg.toFixed(1) + ' fired) and CANNOT count the slipping one ('
     + (js.onsets / js.durationSec).toFixed(1) + '/s vs ' + rs.toFixed(1) + ' fired) — the beats '
     + 'have merged, and that is a fact about the sound, not a bug',
     Math.abs(jg.onsets / jg.durationSec - rg) / rg < 0.15 && js.onsets / js.durationSec < rs * 0.5);
}

console.log('\n\x1b[1mC  a knocked quartering — the same COUNT, an uneven beat\x1b[0m');
{
  const base = { regulator: 0.55, cutoff: 0.32, brake: 0.1, sand: true, wagons: 5, hold: 4.5 };
  const even = render('even', base, 90, 14);
  const limp = render('limp', Object.assign({}, base, { quarterErr: 0.24 }), 90, 14);
  const gaps = (r) => r.beats.slice(1).map((b, i) => b.t - r.beats[i].t);
  /* the measure of a LIMP is the alternation between one gap and the next, not
     the spread of all of them — a train still accelerating drifts its gaps
     smoothly, and that is not a limp. */
  const limpiness = (g) => {
    const m = g.reduce((a, b) => a + b, 0) / g.length;
    let s2 = 0;
    for (let i = 1; i < g.length; i++) s2 += Math.abs(g[i] - g[i - 1]);
    return s2 / (g.length - 1) / m;
  };
  const ge = gaps(even), gl = gaps(limp);
  ok('both engines fire the same number of beats',
     Math.abs(even.beats.length - limp.beats.length) <= 1,
     even.beats.length + ' vs ' + limp.beats.length);
  ok('gap-to-gap, the good engine wobbles ' + (limpiness(ge) * 100).toFixed(2)
     + ' % and the limping one ' + (limpiness(gl) * 100).toFixed(1) + ' %',
     limpiness(ge) < 0.01 && limpiness(gl) > 0.15);
  /* the limp is the quartering error, in seconds, at this crank speed */
  const sorted = gl.slice().sort((a, b) => a - b);
  const shortG = sorted[Math.floor(sorted.length * 0.25)], longG = sorted[Math.floor(sorted.length * 0.75)];
  const wBar = limp.wBar;
  ok('long gap minus short gap = 2 x error / omega',
     Math.abs((longG - shortG) - 2 * 0.24 / wBar) / (2 * 0.24 / wBar) < 0.06,
     'measured ' + ((longG - shortG) * 1000).toFixed(1) + ' ms, predicted '
     + (2 * 0.24 / wBar * 1000).toFixed(1) + ' ms');
  lensJSON(limp.path, ['--spectrogram', join(OUT, 'limp.png')]);
  lensJSON(limp.path, ['--waveform', join(OUT, 'limp-wave.png')]);
  lensJSON(even.path, ['--waveform', join(OUT, 'even-wave.png')]);
}

console.log('\n  wavs and pictures in ' + OUT);
console.log('\n' + (fail ? '\x1b[31m' : '\x1b[32m') + pass + ' passed, ' + fail + ' failed\x1b[0m\n');
process.exit(fail ? 1 : 0);
