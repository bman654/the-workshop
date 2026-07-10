#!/usr/bin/env node
/* ============================================================================
   THE PROJECTION ROOM's BED RENDERER — `node render.mjs <manifest.json> <out.wav>`

   Mixes talk/bed/compose.mjs's score, applies the VO-duck + end-fade
   automation (both read from the manifest, which was generated from the cue
   lock), normalizes, writes stereo 44.1 kHz WAV.

   Fully deterministic: same manifest in → bit-identical WAV out (the film's
   own on-camera claim; prove it with two renders and SHA-256).

   Engine parts reused from trailer-bed/ (the estate's bed engine): the
   palette voices, dsp mix, seeded prng, stereo WAV writer. No musical
   judgment here — that is compose.mjs's job.
   ============================================================================ */

import { readFileSync } from 'node:fs';
import { compose } from './compose.mjs';
import * as P from '../../trailer-bed/palette.mjs';
import { mixIn, linToDb } from '../../trailer-bed/dsp.mjs';
import { mulberry32, hash2 } from '../../trailer-bed/prng.mjs';
import { writeWav16Stereo } from '../../trailer-bed/wav.mjs';

const [,, manifestPath, outPath] = process.argv;
if (!manifestPath || !outPath){
  console.error('usage: node render.mjs <manifest.json> <out.wav>');
  process.exit(1);
}
const t0 = process.hrtime.bigint();
const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sr = m.sampleRate ?? 44100;
const seed = m.seed ?? 4207;

/* ---- 0. manifest validation (mechanical) ----------------------------------- */
{
  const fail = msg => { throw new Error('manifest invalid: ' + msg); };
  if (!(m.totalMs > 0)) fail('totalMs missing');
  if (!Array.isArray(m.chapters) || m.chapters.length !== 7) fail('need 7 chapters');
  if (!(m.swell && m.swell.gapStartMs < m.swell.peakMs && m.swell.peakMs < m.swell.resolveMs))
    fail('swell peak must sit inside the true-VO gap');
  for (const [a, b] of m.duckSpans || []) if (!(a < b)) fail('bad duck span');
  /* the crest must be FREE: no duck span may cover the swell peak */
  for (const [a, b] of m.duckSpans || [])
    if (m.swell.peakMs >= a && m.swell.peakMs <= b) fail('a duck span covers the swell peak');
  if (!(m.fadeEndMs > m.fadeStartMs)) fail('fadeEndMs must be > fadeStartMs');
  if (!(m.totalMs >= m.fadeEndMs)) fail('totalMs must reach fadeEndMs');
}

const { events, meta } = compose(m);

/* ---- 1. mix the score ------------------------------------------------------ */
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

/* ---- 2. duck + fade automation ---------------------------------------------
   Duck level under every VO span (from the cue lock); the bed blooms in the
   inter-chapter gaps and stands alone at the crescendo. Gentle cosine ramps:
   0.35 s in, 0.8 s out. */
{
  const env = new Float32Array(N).fill(1);
  const cos01 = x => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  const lvl = m.duckLevel ?? 0.44, dIn = 0.35, dOut = 0.8;
  for (const [aMs, bMs] of m.duckSpans || []){
    const at = aMs / 1000, end = bMs / 1000;
    const a = Math.round(at * sr), b = Math.round(end * sr);
    for (let i = Math.max(0, a); i < Math.min(N, b + Math.round(dOut * sr)); i++){
      const t = i / sr;
      let g = lvl;
      if (t < at + dIn) g = 1 - (1 - lvl) * cos01((t - at) / dIn);
      else if (t > end) g = lvl + (1 - lvl) * cos01((t - end) / dOut);
      env[i] = Math.min(env[i], g);
    }
  }
  const fa = m.fadeStartMs / 1000, fb = m.fadeEndMs / 1000;
  for (let i = Math.round(fa * sr); i < N; i++){
    const t = i / sr;
    env[i] *= t >= fb ? 0 : 1 - cos01((t - fa) / (fb - fa));
  }
  for (let i = 0; i < N; i++){ L[i] *= env[i]; R[i] *= env[i]; }
}

/* ---- 3. normalize to −1.2 dBFS (the swell crest sets the ceiling) ----------- */
let prePeak = 0;
for (let i = 0; i < N; i++) prePeak = Math.max(prePeak, Math.abs(L[i]), Math.abs(R[i]));
if (prePeak > 0){ const g = 0.87 / prePeak; for (let i = 0; i < N; i++){ L[i] *= g; R[i] *= g; } }

/* ---- 4. final safety peak check --------------------------------------------- */
let pk = 0;
for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
if (pk > 0.985){ const g = 0.985 / pk; for (let i = 0; i < N; i++){ L[i] *= g; R[i] *= g; } pk = 0.985; }

const bytes = writeWav16Stereo(outPath, L, R, sr);
const dt = Number(process.hrtime.bigint() - t0) / 1e9;
console.log(`wrote ${outPath}`);
console.log(`  duration ${(N / sr).toFixed(2)} s · ${(bytes / 1e6).toFixed(1)} MB · sr ${sr} stereo`);
console.log(`  events ${events.length} ${JSON.stringify(meta.counts)}`);
console.log(`  peak ${linToDb(pk).toFixed(2)} dBFS (pre-normalize ${prePeak.toFixed(3)})`);
console.log(`  swell announce ${meta.swell.announce}s → peak ${meta.swell.peak}s → resolve ${meta.swell.resolve}s`);
console.log(`  render ${dt.toFixed(2)} s`);
