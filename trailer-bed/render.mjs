#!/usr/bin/env node
// ============================================================================
// THE RENDERER — `node render.mjs <manifest.json> <out.wav>`
//
// Mixes the composer's score, applies the duck/fade automation, performs the
// record-scratch (tape-stop of the bed's own tail + needle rips + platter
// thump + TRUE silence), normalizes to −1.2 dBFS, writes stereo 44.1 kHz WAV.
// Fully deterministic from the manifest: same JSON in → bit-identical WAV out.
// No musical judgment lives here; that is compose.mjs's job.
// ============================================================================

import { readFileSync } from 'node:fs';
import { compose } from './compose.mjs';
import * as P from './palette.mjs';
import { mixIn, bandpassSweep, linToDb } from './dsp.mjs';
import { mulberry32, hash2 } from './prng.mjs';
import { writeWav16Stereo } from './wav.mjs';

const [,, manifestPath, outPath] = process.argv;
if (!manifestPath || !outPath){
  console.error('usage: node render.mjs <manifest.json> <out.wav>');
  process.exit(1);
}
const t0 = process.hrtime.bigint();
const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sr = m.sampleRate ?? 44100;
const seed = m.seed ?? 2718;

// ---- 0. manifest validation (mechanical; no musical judgment) -----------------
// A half-specified scratch would otherwise mis-render silently (music continues
// under the rips). Validate before composing; throw on any violation.
{
  const fail = msg => { throw new Error('manifest invalid: ' + msg); };
  if ((m.scratchAtMs == null) !== (m.resumeAtMs == null))
    fail('scratchAtMs and resumeAtMs must be both present or both absent');
  if (m.scratchAtMs != null && !(m.resumeAtMs > m.scratchAtMs))
    fail('resumeAtMs must be > scratchAtMs');
  if (m.fadeStartMs != null && !(m.fadeEndMs > m.fadeStartMs))
    fail('fadeEndMs must be > fadeStartMs');
  const fz = (m.sections || []).find(s => s.name === 'funzone');
  if (fz && m.dropAtMs != null && !(m.dropAtMs >= fz.atMs))
    fail('dropAtMs must be >= funzone.atMs');
  for (const d of m.duckWindows || []){
    if (m.dropAtMs != null && d.atMs < m.dropAtMs) fail('duck window before dropAtMs');
    if (m.fadeStartMs != null && d.atMs + d.durMs > m.fadeStartMs) fail('duck window after fadeStartMs');
  }
  // Finale inequality (MUSIC.md §11): the Gate needs ~14 s of bed-silent film after
  // its trigger cue (== fadeEndMs) for gears/swing/welcome/logotune to finish.
  if (m.fadeEndMs != null && m.totalMs - m.fadeEndMs < 14000)
    console.warn(`WARNING: totalMs − fadeEndMs = ${((m.totalMs - m.fadeEndMs)/1000).toFixed(1)} s < 14 s — the Gate finale cannot finish inside the film (see MUSIC.md §11)`);
}

const { events, meta } = compose(m);

// ---- 1. mix the score -------------------------------------------------------
const N = Math.ceil(m.totalMs / 1000 * sr);
const L = new Float32Array(N), R = new Float32Array(N);
const VOICES = {
  ks: P.ksPluck, celesta: P.celesta, pad: P.padChord, chirp: P.chirpRiser,
  subdrop: P.subDrop, kick: P.kick, hat: P.hat, tick: P.tick,
};
for (const ev of events){
  const voice = VOICES[ev.voice];
  if (!voice) throw new Error('unknown voice: ' + ev.voice);
  const rnd = mulberry32(hash2(seed, ev.seq));
  const buf = voice(sr, ev.params, rnd);
  mixIn(L, R, buf, Math.round(ev.t * sr), ev.gain, ev.pan);
}

// ---- 2. duck + fade automation ----------------------------------------------
{
  const env = new Float32Array(N).fill(1);
  const cos01 = x => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  for (const w of meta.ducks){
    const lvl = (m.duckWindows.find(d => d.atMs / 1000 === w.at)?.level) ?? 0.2;
    const dIn = 0.25, dOut = 0.6;
    const a = Math.round(w.at * sr), b = Math.round(w.end * sr);
    for (let i = Math.max(0, a); i < Math.min(N, b + Math.round(dOut * sr)); i++){
      const t = i / sr;
      let g = lvl;
      if (t < w.at + dIn) g = 1 - (1 - lvl) * cos01((t - w.at) / dIn);
      else if (t > w.end) g = lvl + (1 - lvl) * cos01((t - w.end) / dOut);
      env[i] = Math.min(env[i], g);
    }
  }
  if (m.fadeStartMs != null){
    const fa = meta.fadeStart, fb = meta.fadeEnd;
    for (let i = Math.round(fa * sr); i < N; i++){
      const t = i / sr;
      env[i] *= t >= fb ? 0 : 1 - cos01((t - fa) / (fb - fa));
    }
  }
  for (let i = 0; i < N; i++){ L[i] *= env[i]; R[i] *= env[i]; }
}

// ---- 3. normalize to −1.2 dBFS ----------------------------------------------
function normalize(target = 0.87){
  let pk = 0;
  for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  if (pk > 0){ const g = target / pk; for (let i = 0; i < N; i++){ L[i] *= g; R[i] *= g; } }
  return pk;
}
const prePeak = normalize();

// ---- 4. the record scratch (the Errand full stop) -----------------------------
// Layer 1: tape-stop — the bed's own tail re-read through a varispeed whose
//          rate falls exponentially to zero (the music smears down to a halt).
// Layer 2: needle rips — 3 shrinking bursts of bandpass-swept seeded noise.
// Layer 3: platter thump — one low sine. Then TRUE silence until resumeAtMs.
if (meta.scratchAt != null){
  const rnd = mulberry32(hash2(seed, 0x5C4A7C));
  const stopDur = 0.45, tau = 0.13;
  const s0 = Math.round(meta.scratchAt * sr);
  const stopN = Math.round(stopDur * sr);
  const r0 = Math.min(N, Math.round(meta.resumeAt * sr));
  for (const c of [L, R]){
    const src = c.slice(s0, Math.min(N, s0 + stopN + Math.round(0.3 * sr)));
    let pos = 0;
    for (let i = 0; i < stopN && s0 + i < N; i++){
      const rate = Math.exp(-(i / sr) / tau);
      const p0 = Math.floor(pos), fr = pos - p0;
      const v = (src[p0] ?? 0) * (1 - fr) + (src[p0 + 1] ?? 0) * fr;
      c[s0 + i] = v * Math.min(1, rate * 1.25 + 0.04);
      pos += rate;
    }
    for (let i = s0 + stopN; i < r0; i++) c[i] = 0;   // TRUE silence — not a duck
  }
  const RIPS = [
    { dt: 0.00, len: 0.130, f0: 3200, f1: 1400 },
    { dt: 0.14, len: 0.085, f0: 1500, f1: 650 },
    { dt: 0.25, len: 0.055, f0: 750, f1: 320 },
  ];
  for (const rip of RIPS){
    const len = Math.round(rip.len * sr);
    const nz = new Float32Array(len);
    for (let i = 0; i < len; i++) nz[i] = rnd() * 2 - 1;
    const shaped = bandpassSweep(sr, nz, rip.f0, rip.f1, 3.0);
    const at = Math.round((meta.scratchAt + rip.dt) * sr);
    const jPh = rnd() * 2 * Math.PI;
    for (let i = 0; i < len && at + i < N; i++){
      const t = i / sr;
      const envA = Math.min(1, t / 0.004) * Math.exp(-t / (rip.len * 0.55));
      const jitter = 0.72 + 0.28 * Math.sin(jPh + 2 * Math.PI * 12 * t);
      const v = shaped[i] * envA * jitter * 1.6;
      L[at + i] += v * 0.75; R[at + i] += v * 0.7;
    }
  }
  {
    const at = Math.round((meta.scratchAt + 0.36) * sr);
    const len = Math.round(0.10 * sr);
    for (let i = 0; i < len && at + i < N; i++){
      const t = i / sr;
      const v = 0.42 * Math.min(1, t / 0.003) * Math.exp(-t / 0.028)
              * Math.sin(2 * Math.PI * 76 * t);
      L[at + i] += v; R[at + i] += v;
    }
  }
}

// ---- 5. final safety peak check ----------------------------------------------
let pk = 0;
for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
if (pk > 0.985){ const g = 0.985 / pk; for (let i = 0; i < N; i++){ L[i] *= g; R[i] *= g; } pk = 0.985; }

const bytes = writeWav16Stereo(outPath, L, R, sr);
const dt = Number(process.hrtime.bigint() - t0) / 1e9;
console.log(`wrote ${outPath}`);
console.log(`  duration ${(N / sr).toFixed(2)} s · ${(bytes / 1e6).toFixed(1)} MB · sr ${sr} stereo`);
console.log(`  events ${events.length} ${JSON.stringify(meta.counts)}`);
console.log(`  peak ${linToDb(pk).toFixed(2)} dBFS (pre-normalize peak ${prePeak.toFixed(2)})`);
console.log(`  drop @ ${meta.dropAt}s · scratch @ ${meta.scratchAt}s→${meta.resumeAt}s · fade ${meta.fadeStart}s→${meta.fadeEnd}s`);
console.log(`  render ${dt.toFixed(2)} s`);
