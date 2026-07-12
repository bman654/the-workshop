#!/usr/bin/env node
// ============================================================================
// THE AUDIO-LENS GATES — G-LENS (SCORE §8.2, G1–G8 over tools/calendar/fixtures/)
//
//   node tools/calendar/score-gate.mjs [--keep]
//
// Renders every fixture per the §8.2 render column via score-render.mjs
// (double render for G1's SHA-256 bit-identity — within-run only, no stored
// cross-machine SHAs, DESIGN §8.2), then analyzes each WAV with the
// audio-lens primitives (tools/audio-lens/src/: wav.js reader, analyzers for
// peak/clip, RMS, centroid, spectral peaks → note/cents, onsets).
//
//   G1 determinism · G2 clipping/peak · G3 RMS bands (per-slice) + ordering
//        teeth at HOUR scale (exec r5: hourRMS = the fixture hour's full-3600-s
//        post-master RMS, sum-of-squares accumulated over the hour's twelve
//        contiguous 300-s slices — partition-exact by the slice law; buffers
//        discarded as accumulated; NO hour-long WAV ever written to disk) ·
//   G4 pitch (every reported spectral peak ∈ Score.KEY.pitchSet ±15 cents;
//        pitchSet locked to the union rebuilt from KEY.pools) ·
//   G5 centroid character · G6 silence (B7) · G7 toll + the carillon's
//        independence (true solar noon RECOMPUTED here from hours.js via the
//        DESIGN §6.2 argmax minute-scan — the gate never trusts the value it
//        is checking; the +30 s is §3.5's own onset offset, target
//        (M* − hour·60)·60 + 30) · G8 anniversary (the Signature's six-onset
//        pattern, §3.3 P5's clock 0/0.42/0.84/1.26/1.76/2.18 s, ±30 ms).
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
import { KEY } from './score.mjs';

const require = createRequire(import.meta.url);
const Hours = require('../hours/hours.js'); // read-only consume (DESIGN §1.8)

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXDIR = join(HERE, 'fixtures');
const RENDER = join(HERE, 'score-render.mjs');
const KEEP = process.argv.includes('--keep');

// the §8.2 render column
const PLAN = [
  { id: 'F-DNW', from: 0, dur: 600 },
  { id: 'F-DAW', from: 0, dur: 300 },
  { id: 'F-DAY', from: 0, dur: 300 },
  { id: 'F-NOON', from: 3450, dur: 120 },
  { id: 'F-DSK', from: 0, dur: 300 },
  { id: 'F-EVE', from: 0, dur: 300 },
  { id: 'F-ANN', from: 0, dur: 300 },
  { id: 'F-STRESS', from: 0, dur: 600 },
];

// §3.3 P5 the Signature — onsets verbatim (the logotune's clock)
const SIG_ONS = [0, 0.42, 0.84, 1.26, 1.76, 2.18];

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok ' + label); }
  else { fail++; console.log('  FAIL ' + label); }
}

const dir = mkdtempSync(join(tmpdir(), 'lc-score-gate-'));
console.log('G-LENS — SCORE §8.2 G1–G8 · renders in ' + dir);

// ---- render + analyze every fixture -----------------------------------------
const F = {}; // id → { summary, sha, samples, sampleRate, frames4k, manifest }
for (const p of PLAN) {
  const fixPath = join(FIXDIR, p.id + '.json');
  const wavA = join(dir, p.id + '.wav');
  const wavB = join(dir, p.id + '.b.wav');
  const args = (out) => [RENDER, fixPath, out, '--from', String(p.from), '--dur', String(p.dur)];
  const stdoutA = execFileSync(process.execPath, args(wavA), { encoding: 'utf8', maxBuffer: 1 << 24 });
  execFileSync(process.execPath, args(wavB), { encoding: 'utf8', maxBuffer: 1 << 24 });
  const summary = JSON.parse(stdoutA.trim().split('\n').pop());
  const shaA = sha256(wavA), shaB = sha256(wavB);
  unlinkSync(wavB); // B existed only for G1
  const { samples, sampleRate } = readWav(wavA);
  const frames4k = stft(samples, 4096, 4096); // G4 peaks + G5 centroid
  F[p.id] = {
    plan: p, summary, shaA, shaB, samples, sampleRate, frames4k,
    manifest: JSON.parse(readFileSync(fixPath, 'utf8')),
    pc: peakAndClip(samples), rmsDb: meanRmsDb(samples),
  };
  console.log('  · ' + p.id + ' rendered ' + p.dur + ' s from ' + p.from +
    ' — peak ' + F[p.id].pc.peakDb.toFixed(2) + ' dBFS · RMS ' + F[p.id].rmsDb.toFixed(2) +
    ' dBFS · events ' + summary.events);
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

// ---- G3 RMS bands + ordering teeth at HOUR scale (exec r5) --------------------
console.log('G3 RMS bands (per-slice) + orderings (hour scale, exec r5)');
const BANDS = {
  'F-DAY': [-48, -30], 'F-DAW': [-48, -32], 'F-DSK': [-48, -32],
  'F-EVE': [-54, -36], 'F-DNW': [-75, -45],
};
for (const id of Object.keys(BANDS)) {
  const [lo, hi] = BANDS[id], v = F[id].rmsDb;
  ok(v >= lo && v <= hi, 'G3 ' + id + ' RMS ' + v.toFixed(2) + ' ∈ [' + lo + ', ' + hi + ']');
}
// the ordering teeth measure the hour's CLIMATE, not any 300 s of a sparse
// stochastic bed (exec r5): hourRMS = full-3600-s post-master RMS, accumulated
// sum-of-squares over the hour's twelve contiguous 300-s slices. The slice law
// is partition-exact (from·sr is integer at 300-s steps; mixIn clips an
// over-selected event to the window — a slice mix is bit-identical to exact
// selection), so twelve slices ≡ one in-memory 3600-s render. Each slice WAV
// is decoded by the SAME readWav→sum-of-squares law as the band checks, then
// deleted immediately (buffers discarded as accumulated; no hour WAV on disk).
const HR = {};
for (const id of ['F-DAY', 'F-DSK', 'F-EVE', 'F-DNW']) {
  HR[id] = hourRmsDb(id);
  console.log('  · ' + id + ' hourRMS ' + HR[id].toFixed(2) + ' dBFS (12 × 300 s accumulated)');
}
ok(HR['F-DAY'] > HR['F-DSK'], 'G3 hourRMS(F-DAY) ' + HR['F-DAY'].toFixed(2) + ' > hourRMS(F-DSK) ' + HR['F-DSK'].toFixed(2));
ok(HR['F-DSK'] >= HR['F-EVE'], 'G3 hourRMS(F-DSK) ' + HR['F-DSK'].toFixed(2) + ' ≥ hourRMS(F-EVE) ' + HR['F-EVE'].toFixed(2));
ok(HR['F-EVE'] > HR['F-DNW'], 'G3 hourRMS(F-EVE) ' + HR['F-EVE'].toFixed(2) + ' > hourRMS(F-DNW) ' + HR['F-DNW'].toFixed(2));

// ---- G4 pitch ------------------------------------------------------------------
console.log('G4 pitch — reported spectral peaks ∈ KEY.pitchSet ±15 cents');
{
  // the pitchSet lock: EQUALS the union rebuilt from KEY.pools (impl r3-m3)
  const union = Array.from(new Set([].concat(KEY.pools.major, KEY.pools.minor))).sort();
  const ps = Array.from(KEY.pitchSet).sort();
  ok(union.length === ps.length && union.every((n, i) => n === ps[i]),
    'G4 KEY.pitchSet === union(KEY.pools) [' + ps.join(' ') + ']');
  for (const p of PLAN) {
    const f = F[p.id];
    const peaks = spectralPeaks(f.frames4k, f.sampleRate, 4096, 3);
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

// ---- G5 centroid character -----------------------------------------------------
console.log('G5 centroid character');
{
  const cDay = meanCentroid(F['F-DAY'].frames4k, F['F-DAY'].sampleRate, 4096, 0, 1);
  const cDnw = meanCentroid(F['F-DNW'].frames4k, F['F-DNW'].sampleRate, 4096, 0, 1);
  ok(cDay > cDnw, 'G5 centroid(F-DAY) ' + cDay.toFixed(0) + ' Hz > centroid(F-DNW) ' + cDnw.toFixed(0) + ' Hz');
}

// ---- G6 silence (B7) ------------------------------------------------------------
console.log('G6 silence — 1-s windows below −60 dBFS');
{
  const sfDnw = silentFrac(F['F-DNW'].samples, F['F-DNW'].sampleRate);
  const sfDay = silentFrac(F['F-DAY'].samples, F['F-DAY'].sampleRate);
  ok(sfDnw >= 0.45, 'G6 silentFrac(F-DNW) ' + sfDnw.toFixed(3) + ' ≥ 0.45');
  ok(sfDay <= 0.40, 'G6 silentFrac(F-DAY) ' + sfDay.toFixed(3) + ' ≤ 0.40');
  ok(sfDnw - sfDay >= 0.25, 'G6 silentFrac(F-DNW) − silentFrac(F-DAY) ' + (sfDnw - sfDay).toFixed(3) + ' ≥ 0.25');
}

// ---- G7 toll + the carillon's independence ---------------------------------------
console.log('G7 toll + carillon (solar noon recomputed from hours.js)');
for (const p of PLAN) {
  if (p.from !== 0) continue;
  const f = F[p.id];
  const a = Math.round(0.4 * f.sampleRate), b = Math.round(1.6 * f.sampleRate);
  const tollDb = meanRmsDb(f.samples.slice(a, b));
  ok(tollDb >= -52, 'G7 ' + p.id + ' toll RMS [0.4,1.6] s = ' + tollDb.toFixed(2) + ' dBFS ≥ −52');
}
{
  const f = F['F-NOON'];
  const mf = f.manifest;
  // the DESIGN §6.2 argmax minute-scan, run HERE from hours.js — never the
  // manifest's own value (impl r1-MAJOR-3's circularity kill)
  const y = Math.floor(mf.dateInt / 10000), mo = Math.floor(mf.dateInt / 100) % 100, d = mf.dateInt % 100;
  const doy = Math.round((Date.UTC(y, mo - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  let best = -Infinity, Mstar = 600;
  for (let cm = 600; cm <= 840; cm++) {
    const alt = Hours.solarAltitudeDeg(Hours.ESTATE.latDeg, doy, cm);
    if (alt > best) { best = alt; Mstar = cm; } // FIRST max wins ties
  }
  ok(Math.floor(Mstar / 60) === mf.hour, 'G7 F-NOON recomputed M* = ' + Mstar + ' falls in hour ' + mf.hour);
  ok(mf.solarNoonMin === Mstar - mf.hour * 60,
    'G7 F-NOON manifest honesty: solarNoonMin ' + mf.solarNoonMin + ' === M* − hour·60 = ' + (Mstar - mf.hour * 60));
  // (b) the onset burst sits within ±2 s of the recomputed TARGET
  // target = (M* − hour·60)·60 + 30 (the +30 s is §3.5's own onset offset)
  const target = (Mstar - mf.hour * 60) * 60 + 30 - f.plan.from;
  const frames = stft(f.samples, 2048, 256);
  const onsets = onsetsAndTempo(frames, f.sampleRate, 2048, 256).onsets;
  // the carillon = the full rising Staircase, 4 onsets on the 0.42 s clock (§3.5)
  const bursts = clockChains(onsets, [0, 0.42, 0.84, 1.26], 0.05);
  const near = bursts.filter((t) => Math.abs(t - target) <= 2);
  ok(near.length > 0, 'G7 F-NOON carillon burst within ±2 s of target ' + target + ' s (found at ' +
    (near.length ? near.map((t) => t.toFixed(2)).join(',') : bursts.map((t) => t.toFixed(2)).join(',') || 'none') + ')');
}

// ---- G8 anniversary ----------------------------------------------------------------
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

// ---- verdict ------------------------------------------------------------------------
console.log('G-LENS: ' + pass + '/' + (pass + fail) + (fail === 0 ? ' PASS' : ' FAIL (' + fail + ')'));
if (fail === 0 && !KEEP) rmSync(dir, { recursive: true, force: true });
else console.log((fail === 0 ? 'kept (--keep): ' : 'kept for triage: ') + dir);
process.exit(fail === 0 ? 0 : 1);

// ---- helpers -------------------------------------------------------------------------
function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
// hourRMS (exec r5): the fixture hour's full-3600-s post-master RMS — render the
// twelve contiguous 300-s slices via score-render.mjs (the ONE realize law),
// decode each with readWav (the band checks' identical mono-downmix law),
// accumulate sum-of-squares, delete the slice WAV at once. NO hour-long WAV.
function hourRmsDb(id) {
  const fixPath = join(FIXDIR, id + '.json');
  let sumSq = 0, n = 0;
  for (let k = 0; k < 12; k++) {
    const w = join(dir, id + '.hr' + k + '.wav');
    execFileSync(process.execPath,
      [RENDER, fixPath, w, '--from', String(k * 300), '--dur', '300'],
      { encoding: 'utf8', maxBuffer: 1 << 24 });
    const { samples } = readWav(w);
    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i];
    n += samples.length;
    unlinkSync(w); // buffers discarded as accumulated — keep /tmp light
  }
  return dbfs(Math.sqrt(sumSq / n));
}
// fraction of whole 1-s windows whose RMS is below −60 dBFS
function silentFrac(samples, sr) {
  const wins = Math.floor(samples.length / sr);
  let silent = 0;
  for (let w = 0; w < wins; w++) {
    let sum = 0;
    for (let i = w * sr; i < (w + 1) * sr; i++) sum += samples[i] * samples[i];
    if (dbfs(Math.sqrt(sum / sr)) < -60) silent++;
  }
  return wins > 0 ? silent / wins : 0;
}
// starts t0 (detected onsets) such that every pattern position t0+pat[k] has a
// detected onset within ±tol s
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
