#!/usr/bin/env node
// ============================================================================
// THE CALENDAR RENDERER — the Node backend (SCORE §5.2, the render.mjs
// discipline; lineage: the trailer prototype's render.mjs, B2's offline twin).
//
//   node tools/calendar/score-render.mjs <moment.json> <out.wav>
//        [--from 0] [--dur 150] [--sr 44100] [--events events.json] [--arm]
//
// validate (§2) → composeHour (pure, sr-free) → slice → realize → master 0.28
// → 16-bit stereo WAV. NO normalize (§3.7): the bed is level-DESIGNED — this
// renders at the same absolute event levels the live graph plays. Peak is
// printed; a peak > −1 dBFS is a hard error (unreachable by construction;
// the gates assert ≤ −4, SCORE §8.2-G2).
//
// --events dumps the composed event list as JSON — the parity/diff artifact
//   (§5.4, §8.1).
// --arm renders armResponse(moment) INSTEAD of the hour (§3.8-1, soul r4-M1):
//   its events at t from 0, same validate/realize path, same master 0.28,
//   default --dur 20 — the SP-EAR announcement auditions hear exactly what a
//   visitor's arm click answers.
//
// Per-event realize law (§4, byte-identical in both backends):
//   rnd = mulberry32(hash2(hourSeed, ev.seq)); hourSeed = moment.seed.
//   mixIn at sample offset round((ev.t − from) · sr) with the event's
//   gain/pan (dsp.mjs:38-46 → score-voices.mjs verbatim port).
//
// WAV writer note (mechanical, not design): tools/audio-lens/src/wav.js's
// encoder (encodeWav16) is MONO-only, so the stereo RIFF frame is assembled
// HERE, quantizing each channel by encodeWav16's exact law (clamp to [−1,1],
// asymmetric round ×32768/×32767) — a pure interleave, no new audio math;
// wav.js stays the gates' READER (SCORE §8.2). Same-input bit-identity is
// REQUIRED and gated by score-gate.mjs G1 (double-render SHA-256, within-run
// only — no stored cross-machine SHAs, DESIGN §8.2).
//
// Node-only. NEVER shipped to pages. NEVER writes inside the repo tree —
// callers point <out.wav> at /tmp (B1: zero audio assets committed, ever).
// ============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { composeHour, armResponse } from './score.mjs';
import { ksPluck, celesta, padChord, mixIn } from './score-voices.mjs';

const require = createRequire(import.meta.url);
const Calendar = require('./calendar.js'); // mulberry32 + hash2 (estate standard)

// ---- CLI ------------------------------------------------------------------
const argv = process.argv.slice(2);
const pos = [];
const opt = { from: 0, dur: null, sr: 44100, events: null, arm: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--from') opt.from = Number(argv[++i]);
  else if (a === '--dur') opt.dur = Number(argv[++i]);
  else if (a === '--sr') opt.sr = Number(argv[++i]);
  else if (a === '--events') opt.events = argv[++i];
  else if (a === '--arm') opt.arm = true;
  else pos.push(a);
}
if (pos.length !== 2) {
  console.error('usage: node score-render.mjs <moment.json> <out.wav> [--from 0] [--dur 150] [--sr 44100] [--events events.json] [--arm]');
  process.exit(1);
}
const [momentPath, outPath] = pos;
if (opt.dur === null) opt.dur = opt.arm ? 20 : 150; // §5.2-7: --arm defaults --dur 20
const from = opt.from, dur = opt.dur, sr = opt.sr;
if (!Number.isFinite(from) || from < 0 || !Number.isFinite(dur) || dur <= 0 || !Number.isInteger(sr) || sr <= 0) {
  console.error('score-render: bad --from/--dur/--sr');
  process.exit(1);
}

// ---- 1. validate the manifest (§2) — throw before composing ----------------
const m = JSON.parse(readFileSync(momentPath, 'utf8'));
{
  const fail = (msg) => { throw new Error('manifest invalid: ' + msg); };
  if (!m || typeof m !== 'object') fail('no manifest');
  if (!Array.isArray(m.altCurve) || m.altCurve.length !== 5) fail('altCurve.length !== 5');
  if (!Number.isInteger(m.hour) || m.hour < 0 || m.hour > 23) fail('hour ∉ 0..23');
  if (typeof m.seasonPhase !== 'number' || !(m.seasonPhase >= 0 && m.seasonPhase < 1)) fail('seasonPhase ∉ [0,1)');
  if (!Number.isInteger(m.annTier) || m.annTier < 0 || m.annTier > 3) fail('annTier ∉ 0..3');
  if (!Number.isInteger(m.dateInt)) fail('non-integer dateInt');
  if (!(m.solarNoonMin === null || (Number.isInteger(m.solarNoonMin) && m.solarNoonMin >= 0 && m.solarNoonMin <= 59))) fail('solarNoonMin ∉ null|0..59');
}

// ---- 2. compose (pure, sr-free) ---------------------------------------------
const events = opt.arm ? armResponse(m) : composeHour(m).events;
if (opt.events) writeFileSync(opt.events, JSON.stringify(events, null, 1) + '\n');

// ---- 3. slice + realize ------------------------------------------------------
// Select events whose sound intersects [from, from+dur). Candidate set is a
// deterministic over-approximation (TAIL = 12 s lookback: the longest voice is
// the 5.4 s pad tile — §3.4; ks ≤ 3.0 s, celesta ≤ 2.65 s); mixIn clips, so a
// realized non-intersector contributes exactly nothing and the mix is
// bit-identical to exact selection. The counted `events` are the true
// intersectors, measured on the realized buffer overlap.
const N = Math.round(dur * sr);
const L = new Float32Array(N), R = new Float32Array(N);
const VOICES = { ksPluck, celesta, padChord };
const TAIL = 12;
let hit = 0;
const layerCounts = {};
for (const ev of events) {
  if (!(ev.t < from + dur && ev.t + TAIL > from)) continue;
  const voice = VOICES[ev.voice];
  if (!voice) throw new Error('unknown voice: ' + ev.voice);
  const rnd = Calendar.mulberry32(Calendar.hash2(m.seed, ev.seq)); // §4 per-event law
  const buf = voice(sr, ev.params, rnd);
  const off = Math.round((ev.t - from) * sr);
  if (off < N && off + buf.length > 0) {
    hit++;
    layerCounts[ev.layer] = (layerCounts[ev.layer] || 0) + 1;
  }
  mixIn(L, R, buf, off, ev.gain, ev.pan);
}

// ---- 4. master 0.28 — NO normalize (§3.7) -----------------------------------
const MASTER = 0.28;
for (let i = 0; i < N; i++) { L[i] *= MASTER; R[i] *= MASTER; }

// peak guard: print peak; > −1 dBFS is a hard error (§5.2-4)
let pk = 0, sumSq = 0;
for (let i = 0; i < N; i++) {
  const al = Math.abs(L[i]), ar = Math.abs(R[i]);
  if (al > pk) pk = al;
  if (ar > pk) pk = ar;
  sumSq += L[i] * L[i] + R[i] * R[i];
}
const db = (a) => 20 * Math.log10(Math.max(a, 1e-12));
const peakDb = db(pk);
const rmsDb = db(Math.sqrt(sumSq / (2 * N)));
if (peakDb > -1) {
  console.error('score-render: HARD ERROR — peak ' + peakDb.toFixed(2) + ' dBFS > -1 dBFS');
  process.exit(1);
}

// ---- 5. write 16-bit stereo WAV + the one JSON summary line ------------------
writeWav16Stereo(outPath, L, R, sr);
console.log(JSON.stringify({
  durS: dur, srHz: sr, events: hit,
  peakDb: Math.round(peakDb * 100) / 100,
  rmsDb: Math.round(rmsDb * 100) / 100,
  layerCounts
}));

function writeWav16Stereo(path, Lc, Rc, rate) {
  const n = Lc.length;
  const dataLength = n * 4;
  const buf = Buffer.alloc(44 + dataLength);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataLength, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);        // fmt chunk size
  buf.writeUInt16LE(1, 20);         // PCM
  buf.writeUInt16LE(2, 22);         // numChannels = stereo
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28);  // byteRate
  buf.writeUInt16LE(4, 32);         // blockAlign
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataLength, 40);
  let off = 44;
  for (let i = 0; i < n; i++) { off = q16(buf, off, Lc[i]); off = q16(buf, off, Rc[i]); }
  writeFileSync(path, buf);
}
// encodeWav16's exact quantization law (tools/audio-lens/src/wav.js:156-160)
function q16(buf, off, v) {
  if (v > 1) v = 1; else if (v < -1) v = -1;
  const s = v < 0 ? Math.max(-32768, Math.round(v * 32768)) : Math.min(32767, Math.round(v * 32767));
  buf.writeInt16LE(s, off);
  return off + 2;
}
