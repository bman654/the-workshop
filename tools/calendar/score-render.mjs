#!/usr/bin/env node
// ============================================================================
// THE CALENDAR RENDERER — the Node backend (SCORE §5.2 + Execution revise r6;
// lineage: the trailer prototype's render.mjs, B2's offline twin).
//
//   node tools/calendar/score-render.mjs <moment.json> <out.wav>
//        [--from 0] [--dur 150] [--sr 44100] [--events events.json] [--arm]
//        [--pad-only] [--no-wind]   (r6 — the §r6.5/G4/G5/G7 gate-render flags)
//
// validate (§2) → composeHour (pure, sr-free) → slice → realize → master 0.28
// → 16-bit stereo WAV. NO normalize (§3.7): the bed is level-DESIGNED. Peak is
// printed; a peak > −1 dBFS is a hard error (the gates assert ≤ −4, §8.2-G2).
//
// r6 realize (SCORE r6.1/r6.2/r6.3; the padChord tile is retired):
//   · NOTE/TOLL voices (ksPluck/celesta) realize with the §4 per-event law
//     rnd = mulberry32(hash2(hourSeed, ev.seq)); gain/pan from the event.
//   · PAD WINDOW events (layer 'pad', has epStart) are 8-s render WINDOWS of ONE
//     continuous episode signal s_ep: the renderer realizes the WHOLE episode once
//     (the voice function over epLen), lays the 2.8-s LINEAR attack/release ramps
//     on top (r6.1 — episode-level, epLen includes both), then slices the window
//     [winFrom−epStart, +winDur]. Abutting windows are contiguous slices of one
//     buffer — no seam, no crossfade (the anti-throb law). Gained by k_V.
//   · LONEVOICE swell events (layer 'pad', has note) realize per swell from the
//     event's own fields (r6.4 glide/bridge/handoff); no episode ramp.
//   · WIND WINDOW events (layer 'wind') realize the seekable floor (r6.2): each
//     30.25-s window carries a 0.25-s equal-power √-seam into the next, a 1.5-s
//     LINEAR head attack (window 0) / tail release (last window). Gain resolves
//     from the FROZEN per-preset tier calibration (WIND_W + WIND_TIER, §r6.2 —
//     the T2.5 TIER_DERIVE freeze; the event carries preset + tier + gain:null).
//   · Placement is LEAD-AWARE (r6): lead(ev) = prevNote ? gapS : 0 (0 for every
//     non-swell event); slice predicate + mixIn offset use ev.t − lead(ev), so a
//     bridge-carrying swell's buffer head survives slice boundaries and G3 stays
//     partition-exact. TAIL = 34 s (the 30.25-s wind window is the longest sound).
//
// --events dumps the composed event list as JSON (§5.4, §8.1).
// --arm renders armResponse(moment) INSTEAD of the hour (§3.8-1, soul r4-M1;
//   default --dur 20). --pad-only keeps only layer 'pad'; --no-wind drops the
//   wind floor (G4/G5/G7 gate renders — SCORE r6.5).
//
// WAV writer note (mechanical, not design; exec r5): wav.js's encodeWav16 is
// MONO-only, so the stereo RIFF frame is assembled HERE under encodeWav16's exact
// quantization law; wav.js stays the gates' READER. Same-input bit-identity is
// gated by score-gate.mjs G1 (double-render SHA-256, within-run only).
//
// Node-only. NEVER shipped to pages. NEVER writes inside the repo tree —
// callers point <out.wav> at /tmp (B1: zero audio assets committed, ever).
// ============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { composeHour, armResponse } from './score.mjs';
import {
  ksPluck, celesta, padNight, padDay, padDawnDusk, padWinterDeep,
  loneVoiceSwell, windBed, mixIn,
} from './score-voices.mjs';

const require = createRequire(import.meta.url);
const Calendar = require('./calendar.js'); // mulberry32 + hash2 (estate standard)

// ---- constants (r6) ---------------------------------------------------------
export const MASTER = 0.28;                         // §3.7 / §6 AIR_LEVEL
export const TAIL = 34;                              // r6.3 — the 30.25-s wind window
const NOTE_VOICES = { ksPluck, celesta };           // §4 per-event realize (seq)
const PAD_VOICES = { padNight, padDay, padDawnDusk, padWinterDeep };
// r6.1/r6.3 — layer phases are the LAST n entries of realize.phases (the leading
// entry, when present, is the always-consumed third-layer phase); detunes are not
// unshifted. n = the voice's recipe phase count.
const RECIPE_PHASES = { padNight: 5, padDay: 9, padDawnDusk: 6, padWinterDeep: 9 }; // r10: padWinterDeep 3 tones × 3 saws
export const K_V = { padNight: 0.08928, padDay: 0.041, padDawnDusk: 0.06504, padWinterDeep: 0.2670, loneVoice: 0.2032 }; // r10 padWinterDeep re-frozen

// ---- the wind level law (r6.2, TIER_DERIVE-frozen at T2.5) -------------------
// Tier targets: wind-only-stretch RMS, post-master, measured ≥ 30 Hz (windBandRms).
export const WIND_TIER = { day: -46, 'dawn-dusk': -47.5, evening: -49, 'deep-night': -50 };
// WIND_W[preset] = windBandRms of the preset's 300-s wind-only render (gain 1, no
// master) at its own fixture hour (plain → F-DAY · winterThin → F-DNW · distantAir
// → F-WEV) — measured ONCE, printed, FROZEN (§r6.2 TIER_DERIVE). Gain for any
// (preset,tier): g = 10^(tier/20) / (MASTER · WIND_W[preset]) — off-fixture tiers
// scale by the tier dB difference, exact, no render (r9).
export const WIND_W = { plain: 0.07532766, winterThin: 0.1087888, distantAir: 0.2788699 };
export function resolveWindGain(preset, tier) {
  return Math.pow(10, WIND_TIER[tier] / 20) / (MASTER * WIND_W[preset]);
}

// ---- the ≥ 30 Hz measurement filter (r6.2 — exact 2nd-order Butterworth HP, fc
// 30 Hz, bilinear; one forward pass; RMS of the output). Verbatim from
// research/r6-calibration-reference.mjs (the filter IS the law). ---------------
export function butterworthHP30(sr) {
  const fc = 30, K = Math.tan(Math.PI * fc / sr), K2 = K * K, r2 = Math.SQRT2;
  const norm = 1 / (1 + r2 * K + K2);
  return { b0: norm, b1: -2 * norm, b2: norm, a1: 2 * (K2 - 1) * norm, a2: (1 - r2 * K + K2) * norm };
}
export function windBandRms(buf, sr) {
  const { b0, b1, b2, a1, a2 } = butterworthHP30(sr);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    sum += y * y;
  }
  return Math.sqrt(sum / buf.length);
}

// ---- realize helpers (exported so score-gate reuses the ONE realize law) -----
// map an episode's event params → the voice's P (r6.1/r6.3 packing law)
export function padParams(voice, params, seconds) {
  const rz = params.realize, n = RECIPE_PHASES[voice];
  const phases = rz.phases.slice(rz.phases.length - n);
  const thirdPhase = rz.phases.length > n ? rz.phases[0] : 0;
  return {
    seconds, detunes: rz.detunes, phases, seeds: rz.seeds,
    third: params.third, thirdPhase,
    breathF: params.breathF, breathU0: params.breathU0, depth: params.depth,
  };
}
// render the WHOLE pad episode once (breath inside the voice) + the r6.1 2.8-s
// LINEAR episode ramps on top; loneVoice has no episode-level ramp (its swells
// carry their own envelopes) — this is the chord-pad path only.
export function renderPadEpisode(sr, voice, params) {
  const seconds = params.epEnd - params.epStart;
  const buf = PAD_VOICES[voice](sr, padParams(voice, params, seconds));
  const ramp = Math.round(2.8 * sr), n = buf.length;
  for (let i = 0; i < ramp && i < n; i++) {
    buf[i] *= i / ramp;
    buf[n - 1 - i] *= i / ramp;
  }
  return buf;
}
// render one wind window (r6.2 envelope: 0.25-s equal-power √-seams + 1.5-s LINEAR
// head/tail ramps). gain 1, no master — the caller applies the tier gain + master.
export function renderWindWindow(sr, params) {
  const { winFrom, winDur } = params;
  const buf = windBed(sr, params);
  const n = buf.length;
  const seam = Math.round(0.25 * sr), head = Math.round(1.5 * sr);
  const isFirst = winFrom < 1e-6, isLast = winFrom + 30 >= 3600 - 1e-6;
  if (isFirst) { for (let i = 0; i < head && i < n; i++) buf[i] *= i / head; }       // linear attack
  else { for (let i = 0; i < seam && i < n; i++) buf[i] *= Math.sin((i / seam) * Math.PI / 2); } // √ fade-in seam
  if (isLast) { for (let i = 0; i < head && i < n; i++) buf[n - 1 - i] *= i / head; } // linear release
  else { for (let i = 0; i < seam && i < n; i++) buf[n - 1 - i] *= Math.sin((i / seam) * Math.PI / 2); } // √ fade-out seam
  return buf;
}

// lead(ev) — r6: the ONE symbol the slice predicate/offset use to place buffers
export function leadOf(ev) {
  return (ev.params && ev.params.prevNote != null) ? ev.params.gapS : 0;
}

// realize ONE event → its mono buffer; NOTE voices need hourSeed. `cache` (a Map,
// optional) memoizes each pad episode's full buffer so abutting windows don't
// re-render it (windowed slices stay bit-identical to the continuous render).
export function realizeEvent(sr, ev, hourSeed, cache) {
  const v = ev.voice;
  if (NOTE_VOICES[v]) {
    const rnd = Calendar.mulberry32(Calendar.hash2(hourSeed, ev.seq)); // §4 per-event
    return NOTE_VOICES[v](sr, ev.params, rnd);
  }
  if (v === 'windBed') return renderWindWindow(sr, ev.params);
  if (v === 'loneVoice') return loneVoiceSwell(sr, ev.params);
  if (PAD_VOICES[v]) {
    const key = v + ':' + ev.params.epStart + ':' + ev.params.epEnd;
    let ep = cache && cache.get(key);
    if (!ep) { ep = renderPadEpisode(sr, v, ev.params); if (cache) cache.set(key, ep); }
    const a = Math.round((ev.params.winFrom - ev.params.epStart) * sr);
    const b = Math.round((ev.params.winFrom + ev.params.winDur - ev.params.epStart) * sr);
    return ep.subarray(a, Math.min(b, ep.length));
  }
  throw new Error('unknown voice: ' + v);
}
export function eventGain(ev) {
  if (ev.voice === 'windBed') return resolveWindGain(ev.params.preset, ev.params.tier);
  if (ev.voice === 'loneVoice') return K_V.loneVoice;
  if (PAD_VOICES[ev.voice]) return K_V[ev.voice];
  return ev.gain; // note/toll carry their own gain
}

// core render: events → { L, R } at sr over [from, from+dur); opts.padOnly/noWind
export function renderMix(sr, events, hourSeed, from, dur, opts = {}) {
  const N = Math.round(dur * sr);
  const L = new Float32Array(N), R = new Float32Array(N);
  const layerCounts = {};
  const cache = new Map();
  let hit = 0;
  for (const ev of events) {
    if (opts.padOnly && ev.layer !== 'pad') continue;
    if (opts.noWind && ev.layer === 'wind') continue;
    const lead = leadOf(ev);
    if (!(ev.t - lead < from + dur && ev.t + TAIL > from)) continue;
    const buf = realizeEvent(sr, ev, hourSeed, cache);
    const off = Math.round((ev.t - lead - from) * sr);
    if (off < N && off + buf.length > 0) {
      hit++;
      layerCounts[ev.layer] = (layerCounts[ev.layer] || 0) + 1;
    }
    mixIn(L, R, buf, off, eventGain(ev), ev.pan);
  }
  for (let i = 0; i < N; i++) { L[i] *= MASTER; R[i] *= MASTER; }
  return { L, R, hit, layerCounts };
}

// ---- CLI --------------------------------------------------------------------
function main() {
  const argv = process.argv.slice(2);
  const pos = [];
  const opt = { from: 0, dur: null, sr: 44100, events: null, arm: false, padOnly: false, noWind: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from') opt.from = Number(argv[++i]);
    else if (a === '--dur') opt.dur = Number(argv[++i]);
    else if (a === '--sr') opt.sr = Number(argv[++i]);
    else if (a === '--events') opt.events = argv[++i];
    else if (a === '--arm') opt.arm = true;
    else if (a === '--pad-only') opt.padOnly = true;
    else if (a === '--no-wind') opt.noWind = true;
    else pos.push(a);
  }
  if (pos.length !== 2) {
    console.error('usage: node score-render.mjs <moment.json> <out.wav> [--from 0] [--dur 150] [--sr 44100] [--events events.json] [--arm] [--pad-only] [--no-wind]');
    process.exit(1);
  }
  const [momentPath, outPath] = pos;
  if (opt.dur === null) opt.dur = opt.arm ? 20 : 150; // §5.2-7: --arm defaults --dur 20
  const from = opt.from, dur = opt.dur, sr = opt.sr;
  if (!Number.isFinite(from) || from < 0 || !Number.isFinite(dur) || dur <= 0 || !Number.isInteger(sr) || sr <= 0) {
    console.error('score-render: bad --from/--dur/--sr');
    process.exit(1);
  }

  // 1. validate (§2) — throw before composing
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

  // 2. compose (pure, sr-free)
  const events = opt.arm ? armResponse(m) : composeHour(m).events;
  if (opt.events) writeFileSync(opt.events, JSON.stringify(events, null, 1) + '\n');

  // 3+4. slice + realize + master
  const { L, R, hit, layerCounts } = renderMix(sr, events, m.seed, from, dur, opt);
  const N = L.length;

  // peak guard
  let pk = 0, sumSq = 0;
  for (let i = 0; i < N; i++) {
    const al = Math.abs(L[i]), ar = Math.abs(R[i]);
    if (al > pk) pk = al;
    if (ar > pk) pk = ar;
    sumSq += L[i] * L[i] + R[i] * R[i];
  }
  const db = (a) => 20 * Math.log10(Math.max(a, 1e-12));
  const peakDb = db(pk), rmsDb = db(Math.sqrt(sumSq / (2 * N)));
  if (peakDb > -1) {
    console.error('score-render: HARD ERROR — peak ' + peakDb.toFixed(2) + ' dBFS > -1 dBFS');
    process.exit(1);
  }

  // 5. write 16-bit stereo WAV + the one JSON summary line
  writeWav16Stereo(outPath, L, R, sr);
  console.log(JSON.stringify({
    durS: dur, srHz: sr, events: hit,
    peakDb: Math.round(peakDb * 100) / 100,
    rmsDb: Math.round(rmsDb * 100) / 100,
    layerCounts,
  }));
}

function writeWav16Stereo(path, Lc, Rc, rate) {
  const n = Lc.length, dataLength = n * 4;
  const buf = Buffer.alloc(44 + dataLength);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataLength, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataLength, 40);
  let off = 44;
  for (let i = 0; i < n; i++) { off = q16(buf, off, Lc[i]); off = q16(buf, off, Rc[i]); }
  writeFileSync(path, buf);
}
// encodeWav16's exact quantization law (tools/audio-lens/src/wav.js)
function q16(buf, off, v) {
  if (v > 1) v = 1; else if (v < -1) v = -1;
  const s = v < 0 ? Math.max(-32768, Math.round(v * 32768)) : Math.min(32767, Math.round(v * 32767));
  buf.writeInt16LE(s, off);
  return off + 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
