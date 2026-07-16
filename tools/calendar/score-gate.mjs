#!/usr/bin/env node
// ============================================================================
// THE AUDIO-LENS GATES — G-LENS (SCORE §8.2, G1–G10 over tools/calendar/fixtures/)
//
//   node tools/calendar/score-gate.mjs [--keep]
//
// Renders every fixture per the §8.2 render column via score-render.mjs
// (double render for G1's SHA-256 bit-identity — within-run only, no stored
// cross-machine SHAs, DESIGN §8.2), then analyzes each WAV with the
// audio-lens primitives (tools/audio-lens/src/: wav.js reader, analyzers for
// peak/clip, RMS, centroid, spectral peaks → note/cents, onsets).
//
//   G1 determinism · G2 clipping/peak · G3 RMS bands (per-slice, r6 re-derived
//        ±4 dB) + ordering teeth at HOUR scale (exec r5: hourRMS = the fixture
//        hour's full-3600-s post-master RMS, sum-of-squares accumulated over the
//        hour's twelve contiguous 300-s slices — partition-exact by the slice
//        law; buffers discarded; NO hour-long WAV ever written to disk) ·
//   G4 pitch (--no-wind renders; every reported spectral peak ∈ KEY.pitchSet
//        ±15 cents; pitchSet locked to the union rebuilt from KEY.pools) ·
//   G5 centroid character (--no-wind) · G6 windOnlyFrac (r6/r7 — B7 as re-read:
//        wind-only stretches ARE the music; fraction of 1-s windows whose
//        windBandRms ≤ tier + 4 dB; teeth re-seated at honest measured values,
//        F-DNW freeze re-derived under the r8/r10 audible night pad) ·
//   G7 toll + the carillon's independence (--no-wind toll half; true solar noon
//        RECOMPUTED here from hours.js via the DESIGN §6.2 argmax minute-scan) ·
//   G8 anniversary (the Signature's six-onset pattern, ±30 ms) ·
//   G9 never-dead floor (r6: no 5-s window on a from-0 full render below
//        tier − 10 dB) ·
//   G10 the P0 teeth (r6/r7 two-prong): (a) the windowed buzz conviction on the
//        per-voice 60-s fixed-seed DIAGNOSTIC episodes (four chord pads + the
//        FIFTH third-ON diagnostic) — FAIL iff any gated window has sharpness
//        > 20 AND depthPct ≥ 0.25; gatedWindows ≥ 6/10; P0 self-calibration
//        (sharpness ≥ 60 AND depth ≥ 2 %) + the 16-seed spread per voice; and
//        (b) the tile-law byte gate (the four chord pads + the loneVoice
//        diagnostic rendered windowed-8-s vs continuous → SHA-256 identical),
//        EXTENDED at r11.3 with the STREAM CONTRACT's tooth: every pad + wind
//        voice in DIRECT mode, chunked-vs-atomic SHA-256 identical at a PINNED
//        adversarial partition (uneven chunks incl. 1-sample chunks, a chunk
//        crossing the wind's 1-s pre-roll boundary, a chunk crossing an 8-s
//        window seam) — and EXTENDED again at r12.5/r13.5 to EVERY WAVETABLE
//        mode air.js chunks live (padDay's saws, padWinterDeep's saws, and
//        padDawnDusk's tone half — r13.3's generalized law; padNight has no
//        grant), bit-identity required WITHIN each mode at the SAME pinned
//        partition. A mismatch is an implementation defect, never a design
//        question.
//        Procedure PORTED from research/r6-calibration-reference.mjs (the file
//        IS the law); prose in SCORE r6 defers to it on procedure.
//
// Renders live in a fresh directory under os.tmpdir() and are deleted on a
// green run (--keep keeps them; a red run always keeps them for triage) —
// no audio ever touches the repo tree (B1).
// Node-only. NEVER shipped to pages.
// ============================================================================

import { readFileSync, mkdtempSync, rmSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readWav } from '../audio-lens/src/wav.js';
import { stft } from '../audio-lens/src/fft.js';
import {
  peakAndClip, meanRmsDb, meanCentroid, spectralPeaks, onsetsAndTempo, hzToNote, dbfs
} from '../audio-lens/src/analyzers.js';
import { KEY, composeHour } from './score.mjs';
import { MASTER, WIND_TIER, windBandRms, renderMix } from './score-render.mjs';
import {
  padNight, padDay, padDawnDusk, padWinterDeep, loneVoiceSwell, windBed,
  padNightStream, padDayStream, padDawnDuskStream, padWinterDeepStream, windBedStream,
} from './score-voices.mjs';

const require = createRequire(import.meta.url);
const Hours = require('../hours/hours.js'); // read-only consume (DESIGN §1.8)

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXDIR = join(HERE, 'fixtures');
const RENDER = join(HERE, 'score-render.mjs');
const KEEP = process.argv.includes('--keep');
const SR = 44100, TWO_PI = 2 * Math.PI, U32 = 4294967296;

// the §8.2 render column (r6: F-WEV joins — the distantAir fixture)
const PLAN = [
  { id: 'F-DNW', from: 0, dur: 600 },
  { id: 'F-DAW', from: 0, dur: 300 },
  { id: 'F-DAY', from: 0, dur: 300 },
  { id: 'F-NOON', from: 3450, dur: 120 },
  { id: 'F-DSK', from: 0, dur: 300 },
  { id: 'F-EVE', from: 0, dur: 300 },
  { id: 'F-ANN', from: 0, dur: 300 },
  { id: 'F-STRESS', from: 0, dur: 600 },
  { id: 'F-WEV', from: 0, dur: 300 },
];

// G3 RMS bands — r6 RE-DERIVED at T2.5 from honest r6/r10 renders: each
// fixture's slice measured (mono), frozen measured ± 4 dB, printed. Frozen
// literals below are the T2.5 derivation; the gate asserts the current
// measurement falls inside. Derivation printed at run time for the record.
const G3_BANDS = {
  'F-DNW': [-53.85, -45.85], 'F-DAW': [-45.04, -37.04], 'F-DAY': [-45.51, -37.51],
  'F-NOON': [-42.93, -34.93], 'F-DSK': [-45.34, -37.34], 'F-EVE': [-49.00, -41.00],
  'F-ANN': [-45.63, -37.63], 'F-STRESS': [-45.23, -37.23], 'F-WEV': [-42.65, -34.65],
};
// G6 windOnlyFrac freezes (r7): F-DAY design-frozen [0.67,0.77] (day pad
// unchanged by r10); F-DNW RE-DERIVED under the r8/r10 audible night pad
// (measured ± 0.05, T2.5). Plus F-DNW ≥ 0.45 (B7) and difference ≥ 0.15.
const G6_FREEZE = { 'F-DNW': [0.837, 0.937], 'F-DAY': [0.67, 0.77] };

// the per-voice G10 diagnostic spec (r4/r5/r7 — verbatim DIAG from the
// calibration reference; defined here so runG10() sees it before its call).
const DIAG = {
  seconds: 60, breathCycleS: 12, breathU0: 0.10, wMaj: 0.5,
  voices: {
    padNight: { idx: 1, register: 'deep-night', depth: 0.45 },
    padDay: { idx: 2, register: 'day', depth: 0.38 },
    padDawnDusk: { idx: 3, register: 'dawn-dusk', depth: 0.42 },
    padWinterDeep: { idx: 4, register: 'deep-night', depth: 0.45 },
    loneVoice: { idx: 5, register: 'deep-night', anchor: 'E3', swells: 5, swellDur: 6, gaps: [2, 2, 1.2, 2], baseAmp: 0.5 },
    padNightThird: { idx: 6, register: 'deep-night', depth: 0.45, wMaj: 0.86, third: 'C#5' },
  },
};
const PAD_FN = { padNight, padDay, padDawnDusk, padWinterDeep };
const PAD_STREAM = { padNight: padNightStream, padDay: padDayStream, padDawnDusk: padDawnDuskStream, padWinterDeep: padWinterDeepStream };

// r11.3 — THE STREAM CONTRACT'S TOOTH (declared here, like DIAG above, so
// runG10() sees it before its call). The r11.1 law: for ANY partition of
// [0, D) the concatenated `fill`s equal the atomic render of D, sample-for-
// sample (the atomic entries are thin wrappers over the stream — one realize
// path). The PINNED adversarial partition cuts at these sample indices
// (SR 44100, so 44100 = 1 s and 352800 = an 8-s window seam):
//   [0, 1)   the wind's pre-roll boundary — the pre-roll [winFrom−1, winFrom)
//            is consumed into a discarded scratch AT CONSTRUCTION, so index 0
//            is the stream's own head: the maximally adversarial form of a
//            chunk over that boundary is this 1-sample chunk, which catches
//            any re-seed / state restart on the first fill;
//   [44099, 44101)   a 2-sample chunk CROSSING the 1-s mark;
//   [352799, 352801) a 2-sample chunk CROSSING the 8-s window seam;
//   plus further 1-sample chunks and grossly uneven spans (97 · 43,999 · … ).
const G10B_CUTS = [1, 2, 3, 100, 44099, 44101, 44102, 200000, 352799, 352801, 400000, 500000];
// the pinned wind seat: a lawful window (winFrom a multiple of 30, the r6.2
// 30.25-s buffer), one per preset. The wind has no wavetable mode, so the wind
// seat is DIRECT-only; the three GRANTED pads (padDay · padWinterDeep ·
// padDawnDusk's tone half — r13.3) carry BOTH modes and are gated in each
// (r12.5 seated padDay, r13.5 extended it to the other two); padNight has no
// grant and is DIRECT-only.
const G10B_WIND = { hourWindSeedInt: 12345, winFrom: 300, winDur: 30.25 };
const DIAG_RECIPE = { padNight: 'padNight', padDay: 'padDay', padDawnDusk: 'padDawnDusk', padWinterDeep: 'padWinterDeep', padNightThird: 'padNight' };

// §3.3 P5 the Signature — onsets verbatim (the logotune's clock)
const SIG_ONS = [0, 0.42, 0.84, 1.26, 1.76, 2.18];

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok ' + label); }
  else { fail++; console.log('  FAIL ' + label); }
}

const dir = mkdtempSync(join(tmpdir(), 'lc-score-gate-'));
console.log('G-LENS — SCORE §8.2 G1–G10 · renders in ' + dir);

// ---- render + analyze every fixture (full + --no-wind) -----------------------
const F = {};
for (const p of PLAN) {
  const fixPath = join(FIXDIR, p.id + '.json');
  const wavA = join(dir, p.id + '.wav');
  const wavB = join(dir, p.id + '.b.wav');
  const wavNW = join(dir, p.id + '.nw.wav');
  const base = (out, extra) => [RENDER, fixPath, out, '--from', String(p.from), '--dur', String(p.dur)].concat(extra || []);
  const stdoutA = execFileSync(process.execPath, base(wavA), { encoding: 'utf8', maxBuffer: 1 << 24 });
  execFileSync(process.execPath, base(wavB), { encoding: 'utf8', maxBuffer: 1 << 24 });
  execFileSync(process.execPath, base(wavNW, ['--no-wind']), { encoding: 'utf8', maxBuffer: 1 << 24 });
  const summary = JSON.parse(stdoutA.trim().split('\n').pop());
  const shaA = sha256(wavA), shaB = sha256(wavB);
  unlinkSync(wavB);
  const { samples, sampleRate } = readWav(wavA);
  const nw = readWav(wavNW);
  unlinkSync(wavNW);
  const manifest = JSON.parse(readFileSync(fixPath, 'utf8'));
  const windEv = composeHour(manifest).events.find((e) => e.layer === 'wind');
  F[p.id] = {
    plan: p, summary, shaA, shaB, samples, sampleRate,
    frames4k: stft(samples, 4096, 4096),
    nwSamples: nw.samples, nwFrames4k: stft(nw.samples, 4096, 4096),
    manifest, windTier: windEv ? windEv.params.tier : null,
    pc: peakAndClip(samples), rmsDb: meanRmsDb(samples),
  };
  console.log('  · ' + p.id + ' rendered ' + p.dur + ' s from ' + p.from +
    ' — peak ' + F[p.id].pc.peakDb.toFixed(2) + ' dBFS · RMS ' + F[p.id].rmsDb.toFixed(2) +
    ' dBFS · tier ' + F[p.id].windTier + ' · events ' + summary.events);
}

// ---- G1 determinism ----------------------------------------------------------
console.log('G1 determinism (double render, SHA-256)');
for (const p of PLAN) ok(F[p.id].shaA === F[p.id].shaB, 'G1 ' + p.id + ' bit-identical ' + F[p.id].shaA.slice(0, 12));

// ---- G2 clipping / peak ------------------------------------------------------
console.log('G2 clipping + peak');
for (const p of PLAN) {
  ok(F[p.id].pc.clipped === 0, 'G2 ' + p.id + ' clipping none');
  ok(F[p.id].pc.peakDb <= -4.0, 'G2 ' + p.id + ' peak ' + F[p.id].pc.peakDb.toFixed(2) + ' ≤ −4 dBFS');
}
ok(F['F-DAY'].pc.peakDb >= -30, 'G2 F-DAY peak ' + F['F-DAY'].pc.peakDb.toFixed(2) + ' ≥ −30 dBFS (non-silence)');

// ---- G3 RMS bands (r6 ±4 dB) + ordering teeth at HOUR scale (exec r5) --------
console.log('G3 RMS bands (per-slice, r6 ±4 dB re-derived) + orderings (hour scale)');
for (const p of PLAN) {
  const [lo, hi] = G3_BANDS[p.id], v = F[p.id].rmsDb;
  console.log('  · ' + p.id + ' slice RMS ' + v.toFixed(2) + ' — frozen band [' + lo + ', ' + hi + ']');
  ok(v >= lo && v <= hi, 'G3 ' + p.id + ' RMS ' + v.toFixed(2) + ' ∈ [' + lo + ', ' + hi + ']');
}
const HR = {};
for (const id of ['F-DAY', 'F-DSK', 'F-EVE', 'F-DNW']) {
  HR[id] = hourRmsDb(id);
  console.log('  · ' + id + ' hourRMS ' + HR[id].toFixed(2) + ' dBFS (12 × 300 s accumulated)');
}
ok(HR['F-DAY'] > HR['F-DSK'], 'G3 hourRMS(F-DAY) ' + HR['F-DAY'].toFixed(2) + ' > hourRMS(F-DSK) ' + HR['F-DSK'].toFixed(2));
ok(HR['F-DSK'] >= HR['F-EVE'], 'G3 hourRMS(F-DSK) ' + HR['F-DSK'].toFixed(2) + ' ≥ hourRMS(F-EVE) ' + HR['F-EVE'].toFixed(2));
ok(HR['F-EVE'] > HR['F-DNW'], 'G3 hourRMS(F-EVE) ' + HR['F-EVE'].toFixed(2) + ' > hourRMS(F-DNW) ' + HR['F-DNW'].toFixed(2));

// ---- G4 pitch (--no-wind renders, r3) ----------------------------------------
console.log('G4 pitch — reported spectral peaks ∈ KEY.pitchSet ±15 cents (--no-wind)');
{
  const union = Array.from(new Set([].concat(KEY.pools.major, KEY.pools.minor))).sort();
  const ps = Array.from(KEY.pitchSet).sort();
  ok(union.length === ps.length && union.every((n, i) => n === ps[i]),
    'G4 KEY.pitchSet === union(KEY.pools) [' + ps.join(' ') + ']');
  for (const p of PLAN) {
    const f = F[p.id];
    const peaks = spectralPeaks(f.nwFrames4k, f.sampleRate, 4096, 3);
    ok(peaks.length > 0, 'G4 ' + p.id + ' has spectral peaks');
    for (const pk of peaks) {
      const note = hzToNote(pk.freq);
      const cls = note.name.replace(/-?\d+$/, '');
      ok(KEY.pitchSet.indexOf(cls) !== -1 && Math.abs(note.cents) <= 15,
        'G4 ' + p.id + ' peak ' + pk.freq.toFixed(1) + ' Hz = ' + note.name +
        ' (' + (note.cents >= 0 ? '+' : '') + note.cents + ' c) in key');
    }
  }
}

// ---- G5 centroid character (--no-wind, r3) -----------------------------------
console.log('G5 centroid character (--no-wind)');
{
  const cDay = meanCentroid(F['F-DAY'].nwFrames4k, F['F-DAY'].sampleRate, 4096, 0, 1);
  const cDnw = meanCentroid(F['F-DNW'].nwFrames4k, F['F-DNW'].sampleRate, 4096, 0, 1);
  ok(cDay > cDnw, 'G5 centroid(F-DAY) ' + cDay.toFixed(0) + ' Hz > centroid(F-DNW) ' + cDnw.toFixed(0) + ' Hz');
}

// ---- G6 windOnlyFrac (r6/r7) -------------------------------------------------
console.log('G6 windOnlyFrac — 1-s windows whose windBandRms ≤ tier + 4 dB');
{
  const wof = {};
  for (const id of ['F-DNW', 'F-DAY']) wof[id] = windOnlyFrac(F[id]);
  for (const id of ['F-DNW', 'F-DAY']) {
    const [lo, hi] = G6_FREEZE[id];
    console.log('  · windOnlyFrac(' + id + ') = ' + wof[id].toFixed(3) + ' (tier ' + F[id].windTier +
      ', thr ' + (WIND_TIER[F[id].windTier] + 4) + ') — frozen [' + lo + ', ' + hi + ']');
    ok(wof[id] >= lo && wof[id] <= hi, 'G6 windOnlyFrac(' + id + ') ' + wof[id].toFixed(3) + ' ∈ [' + lo + ', ' + hi + ']');
  }
  ok(wof['F-DNW'] >= 0.45, 'G6 windOnlyFrac(F-DNW) ' + wof['F-DNW'].toFixed(3) + ' ≥ 0.45 (B7 deep-night wind-dominant)');
  ok(wof['F-DNW'] - wof['F-DAY'] >= 0.15, 'G6 windOnlyFrac(F-DNW) − windOnlyFrac(F-DAY) ' +
    (wof['F-DNW'] - wof['F-DAY']).toFixed(3) + ' ≥ 0.15 (night more wind-only than day)');
}

// ---- G7 toll + the carillon's independence (--no-wind toll half) --------------
console.log('G7 toll + carillon (--no-wind toll half; solar noon recomputed from hours.js)');
for (const p of PLAN) {
  if (p.from !== 0) continue;
  const f = F[p.id];
  const a = Math.round(0.4 * f.sampleRate), b = Math.round(1.6 * f.sampleRate);
  const tollDb = meanRmsDb(f.nwSamples.slice(a, b));
  ok(tollDb >= -52, 'G7 ' + p.id + ' toll RMS [0.4,1.6] s (--no-wind) = ' + tollDb.toFixed(2) + ' dBFS ≥ −52');
}
{
  const f = F['F-NOON'];
  const mf = f.manifest;
  const y = Math.floor(mf.dateInt / 10000), mo = Math.floor(mf.dateInt / 100) % 100, d = mf.dateInt % 100;
  const doy = Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  let best = -Infinity, Mstar = 600;
  for (let cm = 600; cm <= 840; cm++) {
    const alt = Hours.solarAltitudeDeg(Hours.ESTATE.latDeg, doy, cm);
    if (alt > best) { best = alt; Mstar = cm; }
  }
  ok(Math.floor(Mstar / 60) === mf.hour, 'G7 F-NOON recomputed M* = ' + Mstar + ' falls in hour ' + mf.hour);
  ok(mf.solarNoonMin === Mstar - mf.hour * 60,
    'G7 F-NOON manifest honesty: solarNoonMin ' + mf.solarNoonMin + ' === M* − hour·60 = ' + (Mstar - mf.hour * 60));
  const target = (Mstar - mf.hour * 60) * 60 + 30 - f.plan.from;
  const frames = stft(f.samples, 2048, 256);
  const onsets = onsetsAndTempo(frames, f.sampleRate, 2048, 256).onsets;
  const bursts = clockChains(onsets, [0, 0.42, 0.84, 1.26], 0.05);
  const near = bursts.filter((t) => Math.abs(t - target) <= 2);
  ok(near.length > 0, 'G7 F-NOON carillon burst within ±2 s of target ' + target + ' s (found at ' +
    (near.length ? near.map((t) => t.toFixed(2)).join(',') : bursts.map((t) => t.toFixed(2)).join(',') || 'none') + ')');
}

// ---- G8 anniversary ----------------------------------------------------------
console.log('G8 anniversary — the Signature\'s six-onset pattern (±30 ms)');
{
  const found = (id) => {
    const f = F[id];
    const sub = f.samples.slice(0, 60 * f.sampleRate);
    const frames = stft(sub, 2048, 256);
    const onsets = onsetsAndTempo(frames, f.sampleRate, 2048, 256).onsets;
    return clockChains(onsets, SIG_ONS, 0.03).length > 0;
  };
  ok(found('F-ANN'), 'G8 F-ANN carries the Signature in the first 60 s');
  ok(!found('F-DAY'), 'G8 F-DAY (annTier 0) does not');
}

// ---- G9 never-dead floor (r6) ------------------------------------------------
console.log('G9 never-dead floor — no 5-s window below tier − 10 dB (from-0 full renders)');
for (const p of PLAN) {
  if (p.from !== 0) continue; // from-0 full renders only (r12 scope)
  const f = F[p.id];
  const floor = WIND_TIER[f.windTier] - 10;
  const wins = Math.floor(f.samples.length / (5 * f.sampleRate));
  let mn = Infinity, wmin = -1;
  for (let w = 0; w < wins; w++) {
    const v = meanRmsDb(f.samples.slice(w * 5 * f.sampleRate, (w + 1) * 5 * f.sampleRate));
    if (v < mn) { mn = v; wmin = w; }
  }
  ok(mn >= floor, 'G9 ' + p.id + ' min 5-s RMS ' + mn.toFixed(2) + ' ≥ tier−10 ' + floor + ' (window ' + wmin + ')');
}

// ---- G10 the P0 teeth (r6/r7) ------------------------------------------------
console.log('G10 the P0 teeth (two-prong buzz conviction + byte gate)');
runG10();

// ---- verdict -----------------------------------------------------------------
console.log('G-LENS: ' + pass + '/' + (pass + fail) + (fail === 0 ? ' PASS' : ' FAIL (' + fail + ')'));
if (fail === 0 && !KEEP) rmSync(dir, { recursive: true, force: true });
else console.log((fail === 0 ? 'kept (--keep): ' : 'kept for triage: ') + dir);
process.exit(fail === 0 ? 0 : 1);

// ============================================================================
// helpers
// ============================================================================
function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

// hourRMS (exec r5): the fixture hour's full-3600-s post-master RMS via the ONE
// realize law — twelve contiguous 300-s slices through score-render.mjs, each
// decoded by readWav (the band checks' identical mono-downmix), sum-of-squares
// accumulated, slice WAV deleted at once (no hour-long WAV on disk).
function hourRmsDb(id) {
  const fixPath = join(FIXDIR, id + '.json');
  let sumSq = 0, n = 0;
  for (let k = 0; k < 12; k++) {
    const w = join(dir, id + '.hr' + k + '.wav');
    execFileSync(process.execPath, [RENDER, fixPath, w, '--from', String(k * 300), '--dur', '300'],
      { encoding: 'utf8', maxBuffer: 1 << 24 });
    const { samples } = readWav(w);
    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i];
    n += samples.length;
    unlinkSync(w);
  }
  return dbfs(Math.sqrt(sumSq / n));
}

// windOnlyFrac (r6/r7): fraction of whole 1-s windows whose windBandRms is at or
// below the moment's wind tier + 4 dB (windBandRms = the pinned ≥ 30 Hz filter,
// score-render.mjs). Reads the fixture's full from-0 mono WAV.
function windOnlyFrac(f) {
  const thr = WIND_TIER[f.windTier] + 4, sr = f.sampleRate;
  const wins = Math.floor(f.samples.length / sr);
  let cnt = 0;
  for (let w = 0; w < wins; w++) {
    const v = dbfs(windBandRms(f.samples.subarray(w * sr, (w + 1) * sr), sr));
    if (v <= thr) cnt++;
  }
  return wins > 0 ? cnt / wins : 0;
}

function clockChains(onsets, pat, tol) {
  const starts = [];
  for (const t0 of onsets) {
    let all = true;
    for (let k = 1; k < pat.length; k++) {
      const want = t0 + pat[k];
      if (!onsets.some((o) => Math.abs(o - want) <= tol)) { all = false; break; }
    }
    if (all) starts.push(t0);
  }
  return starts;
}

// ============================================================================
// G10 — the pinned calibration procedure, PORTED from
// research/r6-calibration-reference.mjs (the file IS the law; SCORE r6 defers
// to it on procedure). padTarget legacy render + per-voice diagnostics + the
// two-prong g10aSharpness + spreadSeeds + the byte gate.
// ============================================================================
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(a, b) { let h = (a | 0) ^ 0x9E3779B9; h = Math.imul(h ^ (b | 0), 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return h >>> 0; }

// the RETIRED padChord (P0 law — padTarget + the P0 self-calibration render)
function padChord(sr, { freqs, dur, gain = 0.12, attack = 1.5, release = 1.8 }, rnd) {
  const len = Math.max(1, Math.floor(sr * (dur + release)));
  const out = new Float32Array(len);
  const susEnd = Math.floor(sr * dur), atkN = Math.max(1, Math.floor(sr * attack)), relN = Math.max(1, len - susEnd);
  const lfoW = TWO_PI * 0.07 / sr, lfoPh = rnd() * TWO_PI;
  const layers = [{ ratio: 1, g: 0.55 }, { ratio: 2, g: 0.20 }, { ratio: 3, g: 0.10 }];
  for (const f0 of freqs) for (const Ly of layers) {
    const det = 1 + (rnd() - 0.5) * 0.0016, w = TWO_PI * f0 * Ly.ratio * det / sr;
    if (f0 * Ly.ratio >= sr * 0.45) continue;
    const ph0 = rnd() * TWO_PI;
    for (let i = 0; i < len; i++) {
      let env = 1;
      if (i < atkN) env = i / atkN;
      if (i >= susEnd) env *= Math.max(0, 1 - (i - susEnd) / relN);
      out[i] += Ly.g * env * (1 + 0.13 * Math.sin(lfoPh + lfoW * i)) * Math.sin(ph0 + w * i);
    }
  }
  for (let i = 0; i < len; i++) out[i] *= gain / Math.max(1, freqs.length * 0.85);
  return out;
}
function padTargetRender() {
  const n = SR * 60, out = new Float32Array(n), rnd = mulberry32(0xD1A60);
  for (let t0 = 0; t0 < 60; t0 += 4.0) {
    const tile = padChord(SR, { freqs: [110.0, 164.81], dur: 4.0, attack: 1.4, release: 1.4, gain: 0.10 }, rnd);
    const off = Math.round(t0 * SR);
    for (let i = 0; i < tile.length && off + i < n; i++) out[off + i] += tile[i];
  }
  return out;
}

function spreadSeeds(idx) { return Array.from({ length: 16 }, (_, i) => hash2(0xD1A6 + idx, 100 + i)); }

// drawRecipe — the recipe draws (r6.3 items 8+), inlined verbatim from
// score.mjs (the twin carries its own copy; the gate is an independent
// measurement). padWinterDeep = r10 3 saws/tone (9 det + 9 ph, 0 seed).
function drawRecipe(voice, r) {
  const det = [], ph = [], seeds = [];
  if (voice === 'padNight') {
    for (let i = 0; i < 5; i++) det.push(1 + (r() - 0.5) * 0.0012);
    for (let i = 0; i < 5; i++) ph.push(r() * TWO_PI);
  } else if (voice === 'padDay') {
    for (let ti = 0; ti < 3; ti++) for (let v = 0; v < 3; v++) { det.push(1 + (v - 1) * 0.0028 + (r() - 0.5) * 0.0008); ph.push(r() * TWO_PI); }
    seeds.push(Math.floor(r() * U32));
  } else if (voice === 'padDawnDusk') {
    for (let ti = 0; ti < 2; ti++) { ph.push(r() * TWO_PI, r() * TWO_PI, r() * TWO_PI); seeds.push(Math.floor(r() * U32)); }
  } else {
    for (let ti = 0; ti < 3; ti++) for (let v = 0; v < 3; v++) { det.push(1 + (v - 1) * 0.0052 + (r() - 0.5) * 0.0008); ph.push(r() * TWO_PI); }
  }
  return { detunes: det, phases: ph, seeds };
}
// build a diagnostic episode's params (breath cycle 12 s / u0 0.10 / spec depth;
// NO episode ramp — breathEnv is the only envelope). padNightThird draws draws
// 1–10 = padNight realization + draw 11 = the third-layer phase (r7 layout).
function diagPadParams(name, rnd) {
  const spec = DIAG.voices[name], rz = drawRecipe(DIAG_RECIPE[name], rnd);
  let third = 'none', thirdPhase = 0;
  if (spec.third) { thirdPhase = rnd() * TWO_PI; third = spec.third; }
  return {
    seconds: DIAG.seconds, detunes: rz.detunes, phases: rz.phases, seeds: rz.seeds,
    third, thirdPhase, breathF: 1 / DIAG.breathCycleS, breathU0: DIAG.breathU0, depth: spec.depth,
  };
}
function diagPadBuf(name, rnd) { return PAD_FN[DIAG_RECIPE[name]](SR, diagPadParams(name, rnd)); }

// the pinned G10(a) two-prong measurement (r7) — verbatim procedure
function onePoleLP() { let y = 0; return (x, fc) => { const k = 1 - Math.exp(-TWO_PI * fc / SR); y += k * (x - y); return y; }; }
function goertzelMag(x, f, sr) {
  const w = TWO_PI * f / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0, s0;
  for (let i = 0; i < x.length; i++) { s0 = x[i] + c * s1 - s2; s2 = s1; s1 = s0; }
  return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) * 2 / x.length;
}
function g10aSharpness(buf) {
  const decim = Math.round(SR / 2000), lp = onePoleLP();
  const env = new Float32Array(Math.floor(buf.length / decim));
  let j = 0;
  for (let i = 0; i < buf.length; i++) { const e = lp(Math.abs(buf[i]), 400); if (i % decim === 0 && j < env.length) env[j++] = e; }
  const sortedEnv = Float32Array.from(env).sort();
  const envP95 = sortedEnv[Math.floor(sortedEnv.length * 0.95)];
  const win = 15 * 2000, hop = 5 * 2000;
  let worst = 0, gated = 0, maxDepthPct = 0, convict = null, worstPair = null;
  for (let a = 0; a + win <= env.length; a += hop) {
    const w = env.subarray(a, a + win);
    let mean = 0; for (const v of w) mean += v; mean /= w.length;
    if (mean < 0.25 * envP95) continue;
    gated++;
    const ac = Float32Array.from(w, (v) => v - mean), mags = [];
    for (let f = 15; f <= 75.001; f += 1) mags.push(goertzelMag(ac, f, 2000));
    const peak = Math.max(...mags);
    const med = [...mags].sort((x, y) => x - y)[Math.floor(mags.length / 2)];
    const sharp = peak / Math.max(med, 1e-12), depthPct = 100 * peak / Math.max(mean, 1e-12);
    if (sharp > worst) { worst = sharp; worstPair = { sharpness: sharp, depthPct }; }
    if (depthPct > maxDepthPct) maxDepthPct = depthPct;
    if (sharp > 20 && depthPct >= 0.25 && (convict === null || depthPct > convict.depthPct)) convict = { sharpness: sharp, depthPct };
  }
  return { maxSharpness: worst, gatedWindows: gated, worstPair, maxDepthPct, convict };
}

// byte gate — windowed 8-s vs continuous, SHA-256 identical (direct-evaluation
// proof: stateful components re-run from epStart; the whole voice re-rendered
// [0, we] each window and its [w·8, we] tail concatenated).
function bufSha(f) { return createHash('sha256').update(Buffer.from(f.buffer, f.byteOffset, f.byteLength)).digest('hex'); }
function concatF32(parts) { let n = 0; for (const p of parts) n += p.length; const o = new Float32Array(n); let k = 0; for (const p of parts) { o.set(p, k); k += p.length; } return o; }
function windowedPad(name, P, seconds, winS) {
  const fn = PAD_FN[DIAG_RECIPE[name]], parts = [];
  for (let w = 0; w * winS < seconds; w++) {
    const we = Math.min(seconds, (w + 1) * winS);
    parts.push(fn(SR, { ...P, seconds: we }).subarray(Math.round(w * winS * SR), Math.round(we * SR)));
  }
  return concatF32(parts);
}
function partition(total) {
  const out = []; let p = 0;
  for (const c of G10B_CUTS) if (c > p && c < total) { out.push(c - p); p = c; }
  if (p < total) out.push(total - p);
  return out;
}
function chunkedStream(stream, total) {
  const out = new Float32Array(total), parts = partition(total);
  let p = 0;
  for (const n of parts) { const b = new Float32Array(n); stream.fill(b, n); out.set(b, p); p += n; }
  if (p !== total) throw new Error('partition sums to ' + p + ', not ' + total);
  return out;
}

// loneVoice diagnostic events (the pinned plan: 5 swells dur 6, gaps [2,2,1.2,2];
// swells 3→4 connect at gap 1.2 — the bridge/handoff law across a window seam)
function loneEvents() {
  const s = DIAG.voices.loneVoice, g = s.gaps, notes = [-8, -6, -9, -7, -8], ev = [];
  let o = 0;
  for (let k = 0; k < s.swells; k++) {
    const pc = k > 0 && g[k - 1] < 1.5, nc = k < s.swells - 1 && g[k] < 1.5;
    ev.push({ t: o, voice: 'loneVoice', layer: 'pad', gain: 0.2032, pan: 0,
      params: { note: notes[k], swellDur: s.swellDur, prevNote: pc ? notes[k - 1] : null, gapS: pc ? g[k - 1] : null, nextGapS: nc ? g[k] : null } });
    if (k < s.swells - 1) o += s.swellDur + g[k];
  }
  return ev;
}

function runG10() {
  const dB = (x) => 20 * Math.log10(Math.max(x, 1e-12));
  const rmsOf = (b) => { let s = 0; for (let i = 0; i < b.length; i++) s += b[i] * b[i]; return Math.sqrt(s / b.length); };

  // (a) — P0 self-calibration (the gate's proof of teeth)
  const legacy = padTargetRender();
  const p0 = g10aSharpness(legacy);
  console.log('  · P0 self-cal: sharpness ' + p0.maxSharpness.toFixed(1) + ' depth ' + p0.worstPair.depthPct.toFixed(2) +
    '% gated ' + p0.gatedWindows + ' convicted ' + (p0.convict !== null) + ' (legacyBandRms ' + dB(windBandRms(legacy, SR)).toFixed(2) + ')');
  ok(p0.maxSharpness >= 60 && p0.worstPair.depthPct >= 2, 'G10 P0 self-cal sharpness ' + p0.maxSharpness.toFixed(1) + ' ≥ 60 AND depth ' + p0.worstPair.depthPct.toFixed(2) + '% ≥ 2%');
  ok(p0.convict !== null, 'G10 P0 self-cal CONVICTS under the runtime rule (proof of teeth)');

  // (a) — the five diagnostics: fixed-seed conviction (FAIL iff convict) +
  // gatedWindows ≥ 6 + the 16-seed spread (printed; conviction on any seed flags)
  for (const name of ['padNight', 'padDay', 'padDawnDusk', 'padWinterDeep', 'padNightThird']) {
    const idx = DIAG.voices[name].idx;
    const r = g10aSharpness(diagPadBuf(name, mulberry32(0xD1A6 + idx)));
    let spreadWorst = null, spreadConvict = false;
    for (const s of spreadSeeds(idx)) {
      const rs = g10aSharpness(diagPadBuf(name, mulberry32(s)));
      if (spreadWorst === null || rs.worstPair.sharpness > spreadWorst.sharpness) spreadWorst = rs.worstPair;
      if (rs.convict) spreadConvict = true;
    }
    console.log('  · ' + name.padEnd(14) + ' fixed ' + r.worstPair.sharpness.toFixed(1) + '/' + r.worstPair.depthPct.toFixed(2) +
      '% gated ' + r.gatedWindows + ' convict ' + (r.convict !== null) +
      ' | 16-seed spread worst ' + spreadWorst.sharpness.toFixed(1) + '/' + spreadWorst.depthPct.toFixed(2) + '% anyConvict ' + spreadConvict);
    ok(r.gatedWindows >= 6, 'G10(a) ' + name + ' gatedWindows ' + r.gatedWindows + ' ≥ 6 of 10');
    ok(r.convict === null, 'G10(a) ' + name + ' fixed-seed NOT convicted (sharp ' + r.worstPair.sharpness.toFixed(1) + ' / depth ' + r.worstPair.depthPct.toFixed(2) + '%)');
    ok(!spreadConvict, 'G10(a) ' + name + ' 16-seed spread NOT convicted (worst ' + spreadWorst.sharpness.toFixed(1) + ' / ' + spreadWorst.depthPct.toFixed(2) + '%)');
  }

  // (b) — the byte gate: four chord pads + the loneVoice diagnostic
  for (const name of ['padNight', 'padDay', 'padDawnDusk', 'padWinterDeep']) {
    const P = diagPadParams(name, mulberry32(0xD1A6 + DIAG.voices[name].idx));
    const cont = PAD_FN[DIAG_RECIPE[name]](SR, { ...P, seconds: 60 });
    const win = windowedPad(name, P, 60, 8);
    ok(win.length === cont.length && bufSha(cont) === bufSha(win), 'G10(b) ' + name + ' windowed 8-s ≡ continuous (SHA-256)');
  }
  {
    const ev = loneEvents();
    const cont = renderMix(SR, ev, 0, 0, 60).L;
    const parts = [];
    for (let w = 0; w < Math.ceil(60 / 8); w++) { const from = w * 8, dur = Math.min(8, 60 - from); parts.push(renderMix(SR, ev, 0, from, dur).L); }
    const win = concatF32(parts);
    ok(win.length === cont.length && bufSha(cont) === bufSha(win), 'G10(b) loneVoice windowed 8-s ≡ continuous (SHA-256)');
  }

  // (b) r11.3 — the stream contract's tooth: chunked ≡ atomic at the PINNED
  // adversarial partition, every pad + wind voice, DIRECT mode.
  for (const name of ['padNight', 'padDay', 'padDawnDusk', 'padWinterDeep']) {
    const P = { ...diagPadParams(name, mulberry32(0xD1A6 + DIAG.voices[name].idx)), seconds: 60 };
    const cont = PAD_FN[DIAG_RECIPE[name]](SR, P);
    const chunks = partition(cont.length);
    const chk = chunkedStream(PAD_STREAM[DIAG_RECIPE[name]](SR, P), cont.length);
    ok(chk.length === cont.length && bufSha(cont) === bufSha(chk),
      'G10(b) ' + name + ' chunked ≡ atomic at the pinned partition (' + chunks.length + ' chunks, SHA-256)');
  }
  for (const preset of ['plain', 'winterThin', 'distantAir']) {
    const P = { preset, ...G10B_WIND };
    const cont = windBed(SR, P);
    const chunks = partition(cont.length);
    const chk = chunkedStream(windBedStream(SR, P), cont.length);
    ok(chk.length === cont.length && bufSha(cont) === bufSha(chk),
      'G10(b) windBed ' + preset + ' chunked ≡ atomic at the pinned partition (' + chunks.length + ' chunks, SHA-256)');
  }
  // (b) r12.5, EXTENDED r13.5 — the SAME tooth INSIDE every WAVETABLE mode that
  // air.js chunks live. The wavetable is what the live path actually fills, so
  // chunked ≡ atomic must hold there too. r13.3 generalized the law from "padDay's
  // saws" to "constant-frequency periodic component stacks are tabled", so the
  // tooth now covers all three granted modes: padDay's saws (knee 750), the NEW
  // padWinterDeep saws (knee 150), and the NEW padDawnDusk TONE half — whose AIR
  // half stays DIRECT inside the same stream, so this seat also gates the mixed
  // tabled/direct fill (the stateful pink/svf pair must carry across chunk seams
  // exactly as it does across the atomic fill). padNight has NO grant (r13.3) and
  // is gated in DIRECT mode above. The claim is bit-identity WITHIN each mode;
  // wavetable-vs-DIRECT parity is the AUDIBLE claim — §5.4 rows (b3)/(b4)/(b5),
  // derived-and-frozen at T3.1 — and is NOT asserted here.
  for (const name of ['padDay', 'padWinterDeep', 'padDawnDusk']) {
    const P = { ...diagPadParams(name, mulberry32(0xD1A6 + DIAG.voices[name].idx)), seconds: 60, wavetable: true };
    const cont = PAD_FN[DIAG_RECIPE[name]](SR, P);
    const chunks = partition(cont.length);
    const chk = chunkedStream(PAD_STREAM[DIAG_RECIPE[name]](SR, P), cont.length);
    ok(chk.length === cont.length && bufSha(cont) === bufSha(chk),
      'G10(b) ' + name + ' WAVETABLE mode chunked ≡ atomic at the pinned partition (' + chunks.length + ' chunks, SHA-256)');
  }
  console.log('  · G10(b) r11.3 partition: cuts ' + G10B_CUTS.join('/') + ' — 1-sample chunks incl. [0,1) at the wind pre-roll boundary; [44099,44101) crosses 1 s; [352799,352801) crosses the 8-s seam');
}
