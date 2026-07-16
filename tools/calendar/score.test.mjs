#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   score.test.mjs — the composer's Node twin (G-SCORE), rebuilt for r6.
   Run:  node tools/calendar/score.test.mjs

   SCORE.md §8.1 checks 1–17, each a hard pass/fail, over the NINE §8.2
   fixtures (tools/calendar/fixtures/F-*.json; F-WEV included — r6). The twin
   carries its OWN copies of every §3 table/formula AND the r6.1–r6.4 pad/wind/
   loneVoice laws (never read from score.mjs) plus an INDEPENDENT mirror
   composer built from the §4-r6 pinned draw order:
     · phrase k (0x9000+k): menu draw (consumed+overridden when forced) ·
       [Signature-replacement draw — drawn-P2 + annTier≥1 only] · mode commit
       (every phrase) · KS event gain (KS-voiced / P3 only) · rest · then the
       row's own draws (P1: pattern·base·vel×3 · P2/P3: none · P4 the Breath:
       drawRecipe off the DEDICATED stream 0xD000+k, NO third · P5: none).
     · pad episode j (0xA000+j), r6.3 order: 1 ON dur · 2 OFF base · 3 slot
       voice · 4 third-eligibility (always) · 5 third phase (always) · 6/7
       breath u1/u2 · 8+ voice-specific recipe draws (or loneVoice: mode·count·
       then per-swell step·dur·gap). epLen<12 ⇒ SKIP (draws still consumed).
     · wind floor: 30-s windows @0..3570 (buffer 30.25 s; last truncated ≤
       3599.5); preset/tier/hourWindSeedInt held from the hour top.
     · announcement (0xB000, §3.8-1): mode commit · KS gain · row draws; Breath
       announcement realizes off 0xD7FF; seq dense from 0x4000.
   LAYERED seq (r6.3): note/toll from 0 · pad windows 10000 · wind 20000 ·
   loneVoice swells 30000. Mirror ↔ module correspondence is asserted
   event-for-event (t, voice, layer, params, gain, pan, seq) on every composed
   hour, so the mirror's statistics ARE the module's.

   r6 note/toll TWIN TOOTH: the note/toll layer's timing + musical params are
   asserted field-for-field against the committed r5 dumps fixtures/r5-notes/*
   (a canonical multiset compare — the dump array is not t-sorted, but its
   note/toll SET is r5's, and r6 preserves it exactly).

     1  determinism — double-compose deep-equal + sha256 stable (within-run)
     2  the seed edge — 10 manifest pairs via Calendar.momentManifest
     3  pitch domain — note/toll/carillon freqs ∈ LEGAL_SEMIS; loneVoice swell
        notes ∈ the r6.4 committed-mode ladder (A2 floor clamp); register teeth
     4  phrase-mode purity — no phrase carries both C♮ and C♯ classes
     5  the season law — 9 fixtures × 10 seeds; per-hour ±0.25, aggregate ±0.10
     6  onset windows + the ONE end law — every event class: onset + sound
        length ≤ 3599.5 (per-type formulas; swell connected-length + field
        consistency); melodic onsets ∈ [2,3540]
     7  tolls — register pitch · midnight double iff hour===0 · noon carillon
     8  silence accounting — DNW ≥0.55; DNW > {EVE,WEV} > DAY (evening family)
     9  density bands — ±40 % of the r6 expectation table the test emits from
        the §3.3/r6.1 constants (figure lean + tier + wind included)
     10 anniversary hook — exact Signature opener; pattern nowhere at tier 0
     11 concurrency (r6 SPLIT) — PRINT each fixture's note/toll sounding max;
        assert max simultaneous ≤ printed + 2 wind + 2 pad (+3 pad in a
        Breath+loneVoice hour); NO +6 (announcements can't sound in composeHour)
     12 size budget — EXISTENCE-SCOPED (r16 re-arm): pair ≤ 88,064 B / trio ≤
        131,072 B
     13 covenants — anchor literal home; no Math.random/Date.now/sampleRate;
        no audio assets
     14 describe() snapshot — the exact §9 strings per fixture
     15 the day's figure — dateInt-derived; forced opener; figureOff distro
     16 scoreSelfTest passthrough — pass===true, n === 7
     17 the announcement — armResponse deep-equal; legal semis (note events);
        seq dense from 0x4000 (Breath-day pad windows included); Signature /
        figure per fixture

   BYTE-TWIN (house shape, conditioned as in calendar.test.cjs): three inlined
   slices (PITCH CORE, CALENDAR SCORE CORE, CALENDAR SCORE VOICES) must appear
   char-for-char in the built pages. T3.3 / T5.2 arm it; until then it prints
   pending.

   Prints "score twin: N/N PASS"; exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { semiToFreq } from '../../sound-garden/pitch-core.mjs';
import * as Score from './score.mjs';

const require = createRequire(import.meta.url);
const C = require('./calendar.js');
const Hours = require('../hours/hours.js');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
function ok(cond, label, detail) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL: ' + label + (detail ? '   — ' + detail : '')); }
}
const T9 = 1e-9;
const t9 = (x, y) => Math.abs(x - y) <= T9;

/* ── the twin's OWN §3/§4 + r6 tables — copied from SCORE.md, never score.mjs ── */
const TWO_PI = 2 * Math.PI, U32 = 4294967296;
function mulberry32(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(a, b) {
  let h = (a | 0) ^ 0x9E3779B9;
  h = Math.imul(h ^ (b | 0), 0x85EBCA6B);
  h ^= h >>> 13;
  h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}
const A_SEMI = { A2: -15, A3: -3, A4: 9, A5: 21 };
const POOL_MAJOR = { d1: 0, d2: 2, d3: 4, d5: 7, d6: 9, d8: 12 };
const POOL_MINOR = { d1: 0, b3: 3, d4: 5, d5: 7, b7: 10, d8: 12 };
const MENU = {
  'deep-night': { P1: 0.60, P2: 0.25, P3: 0, P4: 0.15 },
  'dawn': { P1: 0.35, P2: 0.40, P3: 0, P4: 0.25 },
  'day': { P1: 0.30, P2: 0.25, P3: 0.25, P4: 0.20 },
  'dusk': { P1: 0.35, P2: 0.40, P3: 0, P4: 0.25 },
  'evening': { P1: 0.50, P2: 0.20, P3: 0, P4: 0.30 }
};
const REST = { 'deep-night': [45, 120], 'dawn': [20, 60], 'day': [15, 45], 'dusk': [20, 60], 'evening': [30, 90] };
const PAD_ON = { 'deep-night': [30, 60], 'dawn': [45, 80], 'day': [60, 90], 'dusk': [45, 80], 'evening': [40, 70] };
const PAD_OFF = { 'deep-night': [90, 240], 'dawn': [40, 120], 'day': [20, 60], 'dusk': [40, 120], 'evening': [60, 180] };
const P2_RISES = { 'deep-night': false, 'dawn': true, 'day': true, 'dusk': false, 'evening': false };
const SIG_ONS = [0, 0.42, 0.84, 1.26, 1.76, 2.18];
const SIG_DECS = [0.95, 0.98, 1.02, 1.08, 0.90, 1.55];
const SIG_VELS = [0.34, 0.36, 0.38, 0.42, 0.37, 0.49];
const K_V = { padNight: 0.08928, padDay: 0.041, padDawnDusk: 0.06504, padWinterDeep: 0.2670, loneVoice: 0.2032 };
const BREATH_DEPTH = { 'deep-night': 0.45, 'evening': 0.42, 'dawn': 0.42, 'dusk': 0.42, 'day': 0.38 };
const STEP4 = [-2, -1, 1, 2];
function wMaj(p) { return 0.5 + 0.45 * Math.cos(2 * Math.PI * (p - 0.25)); }
function seasonDens(p) { return 0.75 + 0.35 * Math.cos(2 * Math.PI * (p - 0.25)); }
function pulseBPM(p) { return Math.round(48 + 12 * (Math.cos(2 * Math.PI * (p - 0.25)) + 1) / 2); }
function altAt(curve, t) {
  const m = Math.max(0, Math.min(60, t / 60));
  const i = Math.min(3, Math.floor(m / 15));
  return curve[i] + (curve[i + 1] - curve[i]) * ((m - i * 15) / 15);
}
function regAt(curve, t) {
  const alt = altAt(curve, t);
  const slope = altAt(curve, Math.min(t + 60, 3600)) - alt;
  if (alt < -12) return 'deep-night';
  if (alt >= 10) return 'day';
  if (slope > 0) return 'dawn';
  if (alt >= -6) return 'dusk';
  return 'evening';
}
function velScale(alt) { return 0.70 + 0.30 * Math.max(0, Math.min(1, (alt + 18) / 60)); }
function celLen(dec) { return dec * 1.15 + 0.12; }
function figureOf(dateInt) { /* §3.8's pinned cumulative mapping — the twin's own copy */
  const u = mulberry32(hash2(0xDA11EA5E, dateInt))();
  return u < 0.30 ? 'P1' : u < 0.60 ? 'P2' : u < 0.80 ? 'P3' : 'P4';
}
function tollSemiOf(reg) { return reg === 'day' ? 21 : (reg === 'dawn' || reg === 'dusk') ? 9 : -3; }
function nh(baseA, off) { return semiToFreq(A_SEMI[baseA] + off); }

/* LEGAL_SEMIS — the UNCLIPPED base×offsets product set (∪ absolutes) */
const LEGAL_SEMIS = (() => {
  const seen = new Set();
  for (const b of ['A2', 'A3', 'A4', 'A5'])
    for (const P of [POOL_MAJOR, POOL_MINOR])
      for (const k in P) seen.add(A_SEMI[b] + P[k]);
  for (const s of [-15, -8, -3, 4, 0, 1, 9, 21]) seen.add(s); // pad/toll/midnight absolutes
  return [...seen].sort((a, b) => a - b);
})();
const FREQ_TO_SEMI = new Map(LEGAL_SEMIS.map(s => [semiToFreq(s), s]));

/* ── r6.1 pad law — slot table + recipe draws + window emission ── */
function slotTable(reg, wm) {
  if (reg === 'deep-night') return wm < 0.15
    ? [['padWinterDeep', 0.45], ['padNight', 0.75], ['loneVoice', 1.0]]
    : [['padNight', 0.60], ['padWinterDeep', 0.85], ['loneVoice', 1.0]];
  if (reg === 'evening') return [['padNight', 0.55], ['padWinterDeep', 0.75], ['loneVoice', 1.0]];
  if (reg === 'dawn' || reg === 'dusk') return [['padDawnDusk', 0.70], ['padNight', 1.0]];
  return [['padDay', 0.70], ['padDawnDusk', 1.0]]; // day
}
function slotPick(reg, wm, u) {
  const t = slotTable(reg, wm);
  for (let i = 0; i < t.length; i++) if (u < t[i][1]) return t[i][0];
  return t[t.length - 1][0];
}
function slotTop(reg, wm) { return slotTable(reg, wm)[0][0]; }
function drawRecipe(voice, r) {
  const det = [], ph = [], seeds = [];
  let i, ti, v;
  if (voice === 'padNight') {
    for (i = 0; i < 5; i++) det.push(1 + (r() - 0.5) * 0.0012);
    for (i = 0; i < 5; i++) ph.push(r() * TWO_PI);
  } else if (voice === 'padDay') {
    for (ti = 0; ti < 3; ti++) for (v = 0; v < 3; v++) { det.push(1 + (v - 1) * 0.0028 + (r() - 0.5) * 0.0008); ph.push(r() * TWO_PI); }
    seeds.push(Math.floor(r() * U32));
  } else if (voice === 'padDawnDusk') {
    for (ti = 0; ti < 2; ti++) { ph.push(r() * TWO_PI, r() * TWO_PI, r() * TWO_PI); seeds.push(Math.floor(r() * U32)); }
  } else { // padWinterDeep r10: 3 saws/tone
    for (ti = 0; ti < 3; ti++) for (v = 0; v < 3; v++) { det.push(1 + (v - 1) * 0.0052 + (r() - 0.5) * 0.0008); ph.push(r() * TWO_PI); }
  }
  return { detunes: det, phases: ph, seeds: seeds };
}
function emitPadWindows(out, voice, epStart, epLen, breathF, breathU0, depth, third, realize, gain) {
  const epEnd = epStart + epLen;
  let ti = 0;
  for (let wf = epStart; wf < epEnd - 1e-6; wf += 8) {
    out.push({ t: wf, voice: voice, layer: 'pad', gain: gain, pan: 0,
      params: { epStart: epStart, epEnd: epEnd, tileIndex: ti, winFrom: wf, winDur: Math.min(8, epEnd - wf),
        breathF: breathF, breathU0: breathU0, depth: depth, third: third, realize: realize } });
    ti++;
  }
}
/* r6.4 loneVoice walk */
function poolClasses(maj) {
  const offs = maj ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10], set = {};
  for (let i = 0; i < offs.length; i++) set[((9 + offs[i]) % 12 + 12) % 12] = 1; // base A class = 9
  return set;
}
function buildLadder(anchorS, maj) {
  const lo = Math.max(anchorS - 12, -15), hi = anchorS + 16, cls = poolClasses(maj), lad = [];
  for (let s = lo; s <= hi; s++) if (cls[((s % 12) + 12) % 12]) lad.push(s);
  return lad;
}
function emitLoneVoice(out, reg, wm, modeU, count, steps, durs, gaps, epStart, epEnd) {
  const anchorS = reg === 'evening' ? -3 : -8; // A3 / E3
  const maj = modeU < wm;                       // §3.1 mode commit
  const lad = buildLadder(anchorS, maj);
  let li = lad.indexOf(anchorS);
  const notes = [lad[li]];
  for (let k = 1; k < count; k++) {
    let step = STEP4[Math.floor(steps[k] * 4)];
    let ni = li + step;
    if (ni < 0 || ni > lad.length - 1 || ni === li) { step = -step; ni = li + step; }
    li = ni; notes.push(lad[li]);
  }
  let onset = epStart;
  const plan = [];
  for (let k = 0; k < count; k++) {
    if (onset + durs[k] > epEnd) break;
    plan.push({ onset: onset, note: notes[k], dur: durs[k] });
    onset = onset + durs[k] + gaps[k];
  }
  for (let k = 0; k < plan.length; k++) {
    const prevConn = k > 0 && gaps[k - 1] <= 1.5, nextConn = k < plan.length - 1 && gaps[k] <= 1.5;
    out.push({ t: plan[k].onset, voice: 'loneVoice', layer: 'pad', gain: K_V.loneVoice, pan: 0,
      params: { note: plan[k].note, swellDur: plan[k].dur,
        prevNote: prevConn ? plan[k - 1].note : null, gapS: prevConn ? gaps[k - 1] : null,
        nextGapS: nextConn ? gaps[k] : null } });
  }
  return { anchorS: anchorS, maj: maj, ladder: new Set(lad), notes: plan.map(x => x.note) };
}

/* ── per-voice audible sound length (for the ONE end law, §8.1-6) ── */
function evLen(e) {
  if (e.layer === 'wind') return e.params.winDur;                 // 30.25 s (last truncated)
  if (e.layer === 'pad' && e.params.note !== undefined) {         // loneVoice swell (connected formula)
    const lead = e.params.prevNote !== null ? e.params.gapS : 0;
    return lead + e.params.swellDur + (e.params.nextGapS !== null ? 0.030 : 0);
  }
  if (e.layer === 'pad') return e.params.winDur;                  // pad window (≤ 8 s slice of s_ep)
  if (e.voice === 'celesta') return celLen(e.params.dec);
  if (e.voice === 'ksPluck') return e.params.dur;
  return 0;
}
/* buffer start (lead-aware) — swells start gapS early when connected */
function evStart(e) {
  if (e.layer === 'pad' && e.params.note !== undefined && e.params.prevNote !== null) return e.t - e.params.gapS;
  return e.t;
}

/* ── the INDEPENDENT mirror composer (§4-r6 pinned order; §3 + r6 rows) ── */
function airPhrase(out, type, reg, maj, t0, r, ksg, alt, bpm, wm, breath) {
  const night = reg === 'deep-night' || reg === 'evening';
  let offs, vel;
  if (type === 'P1') {
    const rootPair = r() < 0.5;
    const lowBase = r() < 0.5;
    const base = night ? (lowBase ? 'A2' : 'A3') : (lowBase ? 'A3' : 'A4');
    offs = maj ? (rootPair ? [0, 2, 0] : [7, 9, 7]) : (rootPair ? [0, 10, 0] : [7, 5, 7]);
    const beat = 60 / bpm, vs = velScale(alt);
    for (let i = 0; i < 3; i++) {
      vel = (0.30 + 0.15 * r()) * vs;
      if (night) out.push({ t: t0 + i * beat, voice: 'ksPluck', params: { freq: nh(base, offs[i]), dur: 2.2, brightness: 0.25, vel }, gain: ksg, pan: 0, layer: 'notes' });
      else out.push({ t: t0 + i * beat, voice: 'celesta', params: { freq: nh(base, offs[i]), dec: 1.4, vel }, gain: 1, pan: 0, layer: 'notes' });
    }
    return t0 + 2 * beat + (night ? 2.2 : celLen(1.4));
  }
  if (type === 'P2') {
    const rise = P2_RISES[reg];
    const base = night ? 'A3' : 'A4';
    offs = maj ? [0, 4, 7, 12] : [0, 3, 7, 12];
    if (!rise) offs = offs.slice().reverse();
    for (let i = 0; i < 4; i++) {
      vel = rise ? 0.40 + 0.15 * i / 3 : 0.55 - 0.15 * i / 3;
      out.push({ t: t0 + i * 0.42, voice: 'celesta', params: { freq: nh(base, offs[i]), dec: 1.5 + 0.7 * i / 3, vel }, gain: 1, pan: 0, layer: 'notes' });
    }
    return t0 + 3 * 0.42 + celLen(2.2);
  }
  if (type === 'P3') {
    offs = maj ? [0, 2, 4, 7] : [0, 3, 5, 7];
    const step = 30 / bpm;
    vel = 0.50 * velScale(alt);
    for (let i = 0; i < 4; i++) out.push({ t: t0 + i * step, voice: 'ksPluck', params: { freq: nh('A3', offs[i]), dur: 0.9, brightness: 0.55, vel }, gain: ksg, pan: 0, layer: 'notes' });
    return t0 + 3 * step + 0.9;
  }
  if (type === 'P4') { // the Breath (r6.1) — ONE 13.4-s swell of the register's TOP slot voice
    const tv = slotTop(reg, wm);
    const rz = drawRecipe(tv, mulberry32(hash2(breath.seed, 0xD000 + breath.k))); // dedicated stream, NO third
    emitPadWindows(out, tv, t0, 13.4, 1 / 13.4, 0, 1.0, 'none', rz, K_V[tv]);
    return t0 + 8 + 5.4;
  }
  offs = wm >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12]; // P5 — the Signature, seasonal third
  for (let i = 0; i < 6; i++) out.push({ t: t0 + SIG_ONS[i], voice: 'celesta', params: { freq: nh('A4', offs[i]), dec: SIG_DECS[i], vel: SIG_VELS[i] }, gain: 1, pan: 0, layer: 'notes' });
  return t0 + SIG_ONS[5] + celLen(SIG_DECS[5]);
}
/* r6.3 LAYERED seq: note/toll from 0 · pad windows 10000 · wind 20000 · swells 30000 */
function seqAssign(list) {
  list.sort((a, b) => a.t - b.t); // stable — same law as the module
  let n = 0, p = 0, w = 0, s = 0;
  for (const e of list) {
    if (e.layer === 'wind') e.seq = 20000 + w++;
    else if (e.layer === 'pad' && e.params.note !== undefined) e.seq = 30000 + s++;
    else if (e.layer === 'pad') e.seq = 10000 + p++;
    else e.seq = n++;
  }
  return list;
}
function armSeq(list) {
  list.sort((a, b) => a.t - b.t);
  list.forEach((e, i) => { e.seq = 0x4000 + i; });
  return list;
}
function mirrorHour(m, opts) {
  const hourSeed = m.seed, curve = m.altCurve, p = m.seasonPhase;
  const wm = wMaj(p), dens = seasonDens(p), bpm = pulseBPM(p);
  const figOff = !!(opts && opts.figureOff);
  const fig = figureOf(m.dateInt);
  const deepSummer = (wm - 0.5) > 0.35;
  const ev = [];
  let i;
  /* tolls */
  const regTop = regAt(curve, 0);
  const tollSemi = tollSemiOf(regTop);
  ev.push({ t: 0.5, voice: 'celesta', params: { freq: semiToFreq(tollSemi), dec: 2.0, vel: 0.30 }, gain: 1, pan: 0, layer: 'toll' });
  if (m.hour === 0) ev.push({ t: 0.5, voice: 'ksPluck', params: { freq: semiToFreq(-15), dur: 3.0, brightness: 0.2, vel: 0.5 }, gain: 1, pan: 0, layer: 'toll' });
  if (m.annTier === 1) ev.push({ t: 0.92, voice: 'celesta', params: { freq: semiToFreq(tollSemi + 12), dec: 2.0, vel: 0.30 }, gain: 1, pan: 0, layer: 'toll' });
  if (m.solarNoonMin !== null) {
    const tc = m.solarNoonMin * 60 + 30;
    const co = wm >= 0.5 ? [0, 4, 7, 12] : [0, 3, 7, 12];
    for (i = 0; i < 4; i++) ev.push({ t: tc + i * 0.42, voice: 'celesta', params: { freq: nh('A4', co[i]), dec: 1.5 + 0.7 * i / 3, vel: 0.50 }, gain: 1, pan: 0, layer: 'toll' });
  }
  /* r6.2 wind floor — 30-s windows @0..3570 (buffer 30.25 s; last truncated) */
  const hwsInt = Math.floor(mulberry32(hash2(hourSeed, 0xC000))() * U32);
  const wpreset = wm < 0.30 ? 'winterThin' : (regTop === 'day' || regTop === 'dawn' || regTop === 'dusk') ? 'plain' : 'distantAir';
  const wtier = regTop === 'day' ? 'day' : (regTop === 'dawn' || regTop === 'dusk') ? 'dawn-dusk' : regTop === 'evening' ? 'evening' : 'deep-night';
  for (let wo = 0; wo < 3600; wo += 30) ev.push({ t: wo, voice: 'windBed', layer: 'wind', gain: null, pan: 0,
    params: { preset: wpreset, tier: wtier, hourWindSeedInt: hwsInt, winFrom: wo, winDur: Math.min(30.25, 3599.5 - wo) } });
  /* r6.1 pad episodes (0xA000+j) */
  const loneEps = [];
  let pt = 0, pj = 0;
  while (pt <= 3591) {
    const pr = mulberry32(hash2(hourSeed, 0xA000 + pj));
    const preg = regAt(curve, pt);
    const onR = PAD_ON[preg], offR = PAD_OFF[preg];
    const onDur = onR[0] + (onR[1] - onR[0]) * pr();       // 1
    const offBase = offR[0] + (offR[1] - offR[0]) * pr();  // 2
    const voice = slotPick(preg, wm, pr());                // 3
    const thirdElig = pr();                                // 4 (always consumed)
    const thirdPh = pr() * TWO_PI;                         // 5 (always consumed)
    const breathF = 1 / (10 + 4 * pr()), breathU0 = pr();  // 6, 7
    const epStart = pt, epEnd = Math.min(3599.5, pt + onDur), epLen = epEnd - epStart;
    const live = epLen >= 12;
    const third = (deepSummer && voice === 'padNight' && thirdElig < 0.5) ? 'C#5' : 'none';
    if (voice === 'loneVoice') {
      const modeU = pr(), count = 3 + Math.floor(pr() * 5); // 8, 9
      const steps = [], durs = [], gaps = [];
      for (let si = 0; si < count; si++) { steps.push(pr()); durs.push(4 + 3 * pr()); gaps.push(1 + 2 * pr()); }
      if (live) loneEps.push(emitLoneVoice(ev, preg, wm, modeU, count, steps, durs, gaps, epStart, epEnd));
    } else {
      const rz = drawRecipe(voice, pr);                    // 8+
      if (live) { rz.phases.unshift(thirdPh); emitPadWindows(ev, voice, epStart, epLen, breathF, breathU0, BREATH_DEPTH[preg], third, rz, K_V[voice]); }
    }
    pt = pt + onDur + Math.min(300, offBase / dens);
    pj++;
  }
  /* phrase-and-rest engine (0x9000+k) */
  const phrases = [];
  let openerInfo = null, hasBreath = false;
  let mt = 0, mk = 0;
  let sigPending = m.annTier >= 1;
  let figPending = !figOff;
  while (true) {
    const reg = regAt(curve, mt);
    const alt = altAt(curve, mt);
    const r = mulberry32(hash2(hourSeed, 0x9000 + mk));
    const uMenu = r(); // always consumed (draw-then-override)
    let type = null, forced = false;
    if (sigPending) { sigPending = false; type = 'P5'; forced = true; }
    else if (figPending && !figOff) {
      figPending = false;
      openerInfo = { reg, listed: MENU[reg][fig] > 0, fig };
      if (MENU[reg][fig] > 0) { type = fig; forced = true; }
    }
    if (type === null) {
      const w = MENU[reg];
      const lean = (!figOff && w[fig] > 0) ? 1.6 : 1;
      const w1 = w.P1 * (fig === 'P1' ? lean : 1), w2 = w.P2 * (fig === 'P2' ? lean : 1);
      const w3 = w.P3 * (fig === 'P3' ? lean : 1), w4 = w.P4 * (fig === 'P4' ? lean : 1);
      const uu = uMenu * (w1 + w2 + w3 + w4);
      type = uu < w1 ? 'P1' : uu < w1 + w2 ? 'P2' : uu < w1 + w2 + w3 ? 'P3' : 'P4';
      if (type === 'P2' && m.annTier >= 1) {
        const thr = m.annTier === 1 ? 0.50 : m.annTier === 2 ? 0.33 : 0.20;
        if (r() < thr) type = 'P5';
      }
    }
    const maj = r() < wm;
    const night = reg === 'deep-night' || reg === 'evening';
    let ksg = 1;
    if ((type === 'P1' && night) || type === 'P3') ksg = 0.35 + 0.20 * r();
    const rr = REST[reg];
    const restEff = Math.min(240, (rr[0] + (rr[1] - rr[0]) * r()) / dens);
    const tOn = mt + restEff;
    if (tOn > 3540) break;
    if (type === 'P4') hasBreath = true;
    phrases.push({ k: mk, type, forced, tOn, maj, reg });
    mt = airPhrase(ev, type, reg, maj, tOn, r, ksg, alt, bpm, wm, { seed: hourSeed, k: mk });
    mk++;
  }
  return { events: seqAssign(ev), phrases, loneEps, hasBreath, openerInfo, wm, fig };
}
function mirrorArm(m) {
  const curve = m.altCurve, p = m.seasonPhase;
  const wm = wMaj(p), bpm = pulseBPM(p);
  const reg = regAt(curve, 0), alt = altAt(curve, 0);
  const r = mulberry32(hash2(m.seed, 0xB000));
  const type = m.annTier >= 1 ? 'P5' : figureOf(m.dateInt);
  const maj = r() < wm;
  const night = reg === 'deep-night' || reg === 'evening';
  let ksg = 1;
  if ((type === 'P1' && night) || type === 'P3') ksg = 0.35 + 0.20 * r();
  const ev = [];
  airPhrase(ev, type, reg, maj, 0, r, ksg, alt, bpm, wm, { seed: m.seed, k: 0x7FF });
  return { events: armSeq(ev), type, reg };
}

/* ── event-for-event compare: module output vs the mirror's ── */
function paramsDiff(a, b, i) {
  const P = a.params, Q = b.params;
  if (a.layer === 'wind') {
    if (P.preset !== Q.preset || P.tier !== Q.tier || P.hourWindSeedInt !== Q.hourWindSeedInt || !t9(P.winFrom, Q.winFrom) || !t9(P.winDur, Q.winDur)) return `#${i} wind params`;
    return null;
  }
  if (a.layer === 'pad' && P.note !== undefined) { // loneVoice swell
    if (P.note !== Q.note || !t9(P.swellDur, Q.swellDur) || P.prevNote !== Q.prevNote
      || !(P.gapS === Q.gapS || (P.gapS !== null && Q.gapS !== null && t9(P.gapS, Q.gapS)))
      || !(P.nextGapS === Q.nextGapS || (P.nextGapS !== null && Q.nextGapS !== null && t9(P.nextGapS, Q.nextGapS)))) return `#${i} swell params`;
    return null;
  }
  if (a.layer === 'pad') { // pad window
    if (!t9(P.epStart, Q.epStart) || !t9(P.epEnd, Q.epEnd) || P.tileIndex !== Q.tileIndex
      || !t9(P.winFrom, Q.winFrom) || !t9(P.winDur, Q.winDur) || !t9(P.breathF, Q.breathF)
      || !t9(P.breathU0, Q.breathU0) || !t9(P.depth, Q.depth) || P.third !== Q.third) return `#${i} padwin params`;
    const R = P.realize, S = Q.realize;
    if (!R || !S || R.detunes.length !== S.detunes.length || R.phases.length !== S.phases.length || R.seeds.length !== S.seeds.length) return `#${i} realize len`;
    for (let j = 0; j < R.detunes.length; j++) if (!t9(R.detunes[j], S.detunes[j])) return `#${i} detune[${j}]`;
    for (let j = 0; j < R.phases.length; j++) if (!t9(R.phases[j], S.phases[j])) return `#${i} phase[${j}]`;
    for (let j = 0; j < R.seeds.length; j++) if (R.seeds[j] !== S.seeds[j]) return `#${i} seed[${j}]`;
    return null;
  }
  // notes / toll
  if (P.freq !== Q.freq) return `#${i} freq ${P.freq} vs ${Q.freq}`;
  if (!t9(P.vel, Q.vel)) return `#${i} vel`;
  if (a.voice === 'celesta') { if (!t9(P.dec, Q.dec)) return `#${i} dec`; }
  else if (P.dur !== Q.dur || P.brightness !== Q.brightness) return `#${i} ks params`;
  return null;
}
function evDiff(a, b, i) {
  if (a.voice !== b.voice || a.layer !== b.layer) return `#${i} voice/layer ${a.voice}/${a.layer} vs ${b.voice}/${b.layer}`;
  if (!t9(a.t, b.t)) return `#${i} t ${a.t} vs ${b.t}`;
  if (a.pan !== 0 || b.pan !== 0) return `#${i} pan`;
  if (a.gain !== b.gain && !(typeof a.gain === 'number' && typeof b.gain === 'number' && t9(a.gain, b.gain))) return `#${i} gain ${a.gain} vs ${b.gain}`;
  if (a.seq !== b.seq) return `#${i} seq ${a.seq} vs ${b.seq}`;
  return paramsDiff(a, b, i);
}
function compareToMirror(got, mir) {
  if (got.length !== mir.length) return `event count ${got.length} vs mirror ${mir.length}`;
  for (let i = 0; i < got.length; i++) {
    const d = evDiff(got[i], mir[i], i);
    if (d) return d;
  }
  return null;
}

/* ── fixtures (NINE — F-WEV included, r6) ── */
const FIX_IDS = ['F-DNW', 'F-DAW', 'F-DAY', 'F-NOON', 'F-DSK', 'F-EVE', 'F-ANN', 'F-STRESS', 'F-WEV'];
const FIX = {};
for (const id of FIX_IDS) FIX[id] = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', id + '.json'), 'utf8'));
const OUT = {}, MIR = {};
for (const id of FIX_IDS) { OUT[id] = Score.composeHour(FIX[id]).events; MIR[id] = mirrorHour(FIX[id]); }
const notesTollOf = evts => evts.filter(e => e.layer === 'notes' || e.layer === 'toll');

/* ── mirror correspondence (the twin's independence engine) ── */
{
  let bad = '';
  for (const id of FIX_IDS) {
    const d = compareToMirror(OUT[id], MIR[id].events);
    if (d && !bad) bad = id + ': ' + d;
  }
  ok(!bad, 'mirror: module events === the twin\'s independent §3/§4-r6 recompute, all 9 fixtures', bad);
}

/* ── entry-shape covenants (DESIGN §6.3, r6 layered seq) ── */
{
  const VOICES = new Set(['celesta', 'ksPluck', 'windBed', 'padNight', 'padDay', 'padDawnDusk', 'padWinterDeep', 'loneVoice']);
  const LAYERS = new Set(['pad', 'notes', 'toll', 'wind']);
  let shapeOk = true, first = '';
  for (const id of FIX_IDS) {
    const evts = OUT[id];
    for (let i = 0; i < evts.length; i++) {
      const e = evts[i];
      const gainOk = e.layer === 'wind' ? e.gain === null : typeof e.gain === 'number';
      const good = VOICES.has(e.voice) && LAYERS.has(e.layer) && e.pan === 0 && gainOk
        && (i === 0 || evts[i].t >= evts[i - 1].t - T9);
      if (!good && !first) { shapeOk = false; first = id + ' #' + i + ' voice=' + e.voice + ' layer=' + e.layer + ' gain=' + e.gain; }
    }
  }
  ok(shapeOk, 'shape: sorted by t, voice/layer enums (wind gain null), pan 0, gain emitted', first);
  /* the layered seq law: per-layer dense ranges */
  let seqOk = true, firstS = '';
  for (const id of FIX_IDS) {
    let n = 0, p = 0, w = 0, s = 0;
    for (const e of OUT[id]) {
      let want;
      if (e.layer === 'wind') want = 20000 + w++;
      else if (e.layer === 'pad' && e.params.note !== undefined) want = 30000 + s++;
      else if (e.layer === 'pad') want = 10000 + p++;
      else want = n++;
      if (e.seq !== want) { seqOk = false; if (!firstS) firstS = id + ' ' + e.layer + ' seq=' + e.seq + ' want ' + want; }
    }
  }
  ok(seqOk, 'shape: layered seq — note/toll 0.. · pad 10000.. · wind 20000.. · swells 30000..', firstS);
}

/* ── 1 · determinism ── */
{
  let det = true, hashOk = true;
  for (const id of FIX_IDS) {
    const j1 = JSON.stringify({ events: OUT[id] });
    const j2 = JSON.stringify(Score.composeHour(FIX[id]));
    if (j1 !== j2) det = false;
    const h1 = crypto.createHash('sha256').update(j1).digest('hex');
    const h2 = crypto.createHash('sha256').update(j2).digest('hex');
    if (h1 !== h2) hashOk = false;
  }
  ok(det, '(1) composeHour twice → deep-equal, all 9 fixtures');
  ok(hashOk, '(1) JSON sha256 stable across runs (within-run law — DESIGN §8.2)');
}

/* ── 2 · the seed edge (10 manifest pairs via the calendar core) ── */
{
  let differ = true, same = true, firstBad = '';
  for (const id of ['F-DNW', 'F-DAW', 'F-DAY', 'F-DSK', 'F-EVE']) {
    const di = FIX[id].dateInt, h = FIX[id].hour;
    const y = Math.floor(di / 10000), mo = Math.floor(di / 100) % 100, d = di % 100;
    const base = C.momentManifest(y, mo, d, h, Hours);
    const nxt = C.dateOfDoy(y, C.doyOf(y, mo, d) + 1);
    const pairs = [
      C.momentManifest(y, mo, d, h + 1, Hours),
      C.momentManifest(y, nxt.m, nxt.d, h, Hours)
    ];
    const jBase = JSON.stringify(Score.composeHour(base));
    if (jBase !== JSON.stringify(Score.composeHour(base))) { same = false; firstBad = id; }
    for (const p2 of pairs) if (JSON.stringify(Score.composeHour(p2)) === jBase) { differ = false; firstBad = id; }
  }
  ok(differ, '(2) hour+1 / day+1 manifests compose DIFFERENT event lists (10 pairs)', firstBad);
  ok(same, '(2) same manifest in → same events out, every pair base', firstBad);
}

/* ── 3 · pitch domain — exact semis + the loneVoice ladder ── */
{
  let legal = true, first = '';
  for (const id of FIX_IDS) {
    for (const e of OUT[id]) {
      const P = e.params;
      const fs2 = P.freqs ? P.freqs : (P.freq !== undefined ? [P.freq] : null);
      if (fs2 === null) continue; // pad windows / wind / swells carry no freq
      for (const f of fs2) if (!FREQ_TO_SEMI.has(f)) { if (!first) first = id + ' t=' + e.t + ' f=' + f; legal = false; }
    }
  }
  ok(legal, '(3) every note/toll/carillon frequency === semiToFreq(s), s ∈ LEGAL_SEMIS (unclipped §3.1a set)', first);
  /* r7: every loneVoice swell note ∈ the committed-mode ladder (A2 floor clamp) */
  let ladderOk = true, firstL = '';
  for (const id of FIX_IDS) {
    for (const ep of MIR[id].loneEps) {
      for (const note of ep.notes) {
        if (!ep.ladder.has(note) || note < -15) { ladderOk = false; if (!firstL) firstL = id + ' note=' + note; }
      }
    }
    /* the module's own swell notes must all be ladder-legal for SOME episode's committed anchor/mode
       (the mirror correspondence ties module==mirror; here we re-derive the legal union independently) */
    const legalUnion = new Set();
    for (const ep of MIR[id].loneEps) for (const s of ep.ladder) legalUnion.add(s);
    for (const e of OUT[id]) {
      if (e.layer === 'pad' && e.params.note !== undefined) {
        if (!legalUnion.has(e.params.note) || e.params.note < -15) { ladderOk = false; if (!firstL) firstL = id + ' module swell note=' + e.params.note; }
      }
    }
  }
  ok(ladderOk, '(3) every loneVoice swell note ∈ the r6.4 committed-pool ladder, ≥ A2 floor', firstL);
  /* register teeth: first Staircase + toll semi on F-DNW / F-DAY / F-EVE */
  for (const id of ['F-DNW', 'F-DAY', 'F-EVE']) {
    const mir = MIR[id];
    const p2 = mir.phrases.find(ph => ph.type === 'P2');
    ok(!!p2, '(3) ' + id + ': a Staircase exists in the hour');
    if (p2) {
      const night = p2.reg === 'deep-night' || p2.reg === 'evening';
      const base = night ? 'A3' : 'A4';
      let offs = null;
      for (const cand of [[0, 4, 7, 12], [0, 3, 7, 12]]) {
        const o = P2_RISES[p2.reg] ? cand : cand.slice().reverse();
        const match = o.every((off, i) => {
          const want = semiToFreq(A_SEMI[base] + off);
          return OUT[id].some(e => Math.abs(e.t - (p2.tOn + i * 0.42)) <= T9 && e.layer === 'notes' && e.params.freq === want);
        });
        if (match) offs = o;
      }
      ok(!!offs, '(3) ' + id + ': first Staircase semis === the §3.3-P2 expansion at base ' + base + ' exactly');
    }
    const wantToll = semiToFreq(tollSemiOf(regAt(FIX[id].altCurve, 0)));
    const tolls = OUT[id].filter(e => e.layer === 'toll' && e.t === 0.5 && e.voice === 'celesta');
    ok(tolls.length === 1 && tolls[0].params.freq === wantToll,
      '(3) ' + id + ': the toll semi is the register\'s (−3/+9/+21)');
  }
}

/* ── 4 · phrase-mode purity (no C♮ + C♯ in one phrase) ── */
{
  let pure = true, first = '';
  const classOf = f => ((FREQ_TO_SEMI.get(f) % 12) + 12) % 12;
  for (const id of FIX_IDS) {
    for (const ph of MIR[id].phrases) {
      if (ph.type === 'P4') continue; // the Breath emits pad windows (no melodic freqs)
      const evts = MIR[id].events.filter(e => e.layer === 'notes' && e.t >= ph.tOn - T9 && e.t <= ph.tOn + 14);
      const classes = new Set();
      for (const e of evts) classes.add(classOf(e.params.freq));
      if (classes.has(0) && classes.has(1)) { pure = false; if (!first) first = id + ' phrase k=' + ph.k; }
    }
  }
  ok(pure, '(4) no melodic phrase carries both C♮ and C♯ classes', first);
}

/* ── 5 · the season law (9 fixtures × 10 seeds, seed override ONLY) ── */
{
  let hourOk = true, aggOk = true, corrOk = true, first = '';
  for (const id of FIX_IDS) {
    const wm = wMaj(FIX[id].seasonPhase);
    let majAll = 0, nAll = 0;
    for (let i = 0; i < 10; i++) {
      const m = Object.assign({}, FIX[id], { seed: hash2(FIX[id].seed, i) });
      const mir = mirrorHour(m);
      const d = compareToMirror(Score.composeHour(m).events, mir.events);
      if (d) { corrOk = false; if (!first) first = id + ' seed#' + i + ': ' + d; }
      const n = mir.phrases.length, nMaj = mir.phrases.filter(pp => pp.maj).length;
      if (n > 0 && Math.abs(nMaj / n - wm) > 0.25) { hourOk = false; if (!first) first = id + ' seed#' + i + ' frac=' + (nMaj / n).toFixed(3) + ' wMaj=' + wm.toFixed(3); }
      majAll += nMaj; nAll += n;
    }
    if (Math.abs(majAll / nAll - wm) > 0.10) { aggOk = false; if (!first) first = id + ' agg=' + (majAll / nAll).toFixed(3); }
  }
  ok(corrOk, '(5) seeded variants: module === mirror on all 90 hours', first);
  ok(hourOk, '(5) per-hour major-phrase fraction within ±0.25 of wMaj, 90 hours', first);
  ok(aggOk, '(5) 10-seed aggregate within ±0.10 of wMaj, every fixture', first);
}

/* ── 6 · onset windows + THE ONE end law (r6-r5) ── */
{
  let winOk = true, endOk = true, fieldOk = true, first = '', firstF = '';
  for (const id of FIX_IDS) {
    for (const e of OUT[id]) {
      if (e.layer === 'notes' && (e.t < 2 || e.t > 3540)) { winOk = false; if (!first) first = id + ' notes t=' + e.t; }
      const endT = evStart(e) + evLen(e);
      if (endT > 3599.5 + 1e-6) { endOk = false; if (!first) first = id + ' ' + e.layer + ' end=' + endT.toFixed(3); }
      if (e.layer === 'pad' && e.params.note !== undefined) { // swell field-consistency
        const pn = e.params.prevNote !== null, gs = e.params.gapS !== null;
        if (pn !== gs) { fieldOk = false; if (!firstF) firstF = id + ' prevNote/gapS mismatch t=' + e.t; }
        if (gs && e.params.gapS > 1.5 + T9) { fieldOk = false; if (!firstF) firstF = id + ' gapS>1.5 t=' + e.t; }
        if (e.params.nextGapS !== null && e.params.nextGapS > 1.5 + T9) { fieldOk = false; if (!firstF) firstF = id + ' nextGapS>1.5 t=' + e.t; }
      }
    }
  }
  ok(winOk, '(6) melodic onsets ∈ [2,3540]', first);
  ok(endOk, '(6) every event: buffer start + sound length ≤ 3599.5 s (per-type laws)', first);
  ok(fieldOk, '(6) loneVoice swell fields: prevNote/gapS present iff gap ≤ 1.5 s; nextGapS ≤ 1.5 s', firstF);
}

/* ── 7 · the tolls ── */
{
  let tollOk = true, extraOk = true, first = '';
  for (const id of FIX_IDS) {
    const F = FIX[id];
    const want = semiToFreq(tollSemiOf(regAt(F.altCurve, 0)));
    const t05 = OUT[id].filter(e => e.layer === 'toll' && e.t === 0.5);
    const cel = t05.filter(e => e.voice === 'celesta');
    if (cel.length !== 1 || cel[0].params.freq !== want || cel[0].params.vel !== 0.30 || cel[0].params.dec !== 2.0) { tollOk = false; if (!first) first = id; }
    const ksDouble = t05.some(e => e.voice === 'ksPluck');
    if (ksDouble !== (F.hour === 0)) { tollOk = false; if (!first) first = id + ' midnight'; }
    const carillon = OUT[id].filter(e => e.layer === 'toll' && e.t > 1.0 && !(F.annTier === 1 && e.t === 0.92));
    if (F.solarNoonMin === null) { if (carillon.length !== 0) { extraOk = false; if (!first) first = id + ' phantom carillon'; } }
    else {
      const tc = F.solarNoonMin * 60 + 30;
      const co = (wMaj(F.seasonPhase) >= 0.5 ? [0, 4, 7, 12] : [0, 3, 7, 12]);
      const good = carillon.length === 4 && co.every((off, i) =>
        carillon.some(e => Math.abs(e.t - (tc + i * 0.42)) <= T9 && e.params.freq === semiToFreq(9 + off) && e.params.vel === 0.50));
      if (!good) { extraOk = false; if (!first) first = id + ' carillon@' + tc; }
    }
  }
  ok(tollOk, '(7) toll at t=0.5 at the register\'s exact pitch; midnight double iff hour===0', first);
  ok(extraOk, '(7) noon carillon iff solarNoonMin, at (min·60+30) s, seasonal third, vel 0.50', first);
  const m0 = C.momentManifest(2026, 12, 21, 0, Hours);
  const e0 = Score.composeHour(m0).events;
  const dbl = e0.filter(e => e.layer === 'toll' && e.t === 0.5 && e.voice === 'ksPluck');
  ok(dbl.length === 1 && dbl[0].params.freq === semiToFreq(-15) && dbl[0].params.dur === 3.0
    && dbl[0].params.brightness === 0.2 && dbl[0].params.vel === 0.5,
    '(7) hour-0 manifest: midnight KS double present (A2, dur 3.0, brightness 0.2, vel 0.5)');
  ok(compareToMirror(e0, mirrorHour(m0).events) === null, '(7) hour-0 manifest matches the mirror too');
}

/* ── 8 · silence accounting (B7 made testable; r6 evening FAMILY) ── */
{
  function silentFrac(evts) {
    const iv = evts.filter(e => e.layer === 'notes').map(e => [e.t, e.t + evLen(e)]).sort((a, b) => a[0] - b[0]);
    let cover = 0, cur = null;
    for (const [s, e] of iv) {
      if (!cur) cur = [s, e];
      else if (s <= cur[1]) cur[1] = Math.max(cur[1], e);
      else { cover += cur[1] - cur[0]; cur = [s, e]; }
    }
    if (cur) cover += cur[1] - cur[0];
    return 1 - cover / 3600;
  }
  const sf = {};
  for (const id of ['F-DNW', 'F-EVE', 'F-WEV', 'F-DAY']) sf[id] = silentFrac(OUT[id]);
  ok(sf['F-DNW'] >= 0.55, '(8) melodic-silent fraction ≥ 0.55 on F-DNW', 'got ' + sf['F-DNW'].toFixed(3));
  ok(sf['F-DNW'] > sf['F-EVE'] && sf['F-EVE'] > sf['F-DAY'],
    '(8) deep night > evening (F-EVE) > day',
    'DNW=' + sf['F-DNW'].toFixed(3) + ' EVE=' + sf['F-EVE'].toFixed(3) + ' DAY=' + sf['F-DAY'].toFixed(3));
  ok(sf['F-DNW'] > sf['F-WEV'] && sf['F-WEV'] > sf['F-DAY'],
    '(8) deep night > evening (F-WEV) > day — the evening family, not ordered against each other',
    'DNW=' + sf['F-DNW'].toFixed(3) + ' WEV=' + sf['F-WEV'].toFixed(3) + ' DAY=' + sf['F-DAY'].toFixed(3));
}

/* ── 9 · density bands — the r6 expectation table, emitted from the constants ── */
{
  function eMinCap(range, dens, cap) {
    const lo = range[0] / dens, hi = range[1] / dens;
    if (hi <= cap) return (lo + hi) / 2;
    if (lo >= cap) return cap;
    const f = (cap - lo) / (hi - lo);
    return f * (lo + cap) / 2 + (1 - f) * cap;
  }
  function slotProbLone(reg, wm) {
    const t = slotTable(reg, wm);
    let prev = 0;
    for (const [v, c] of t) { const pr = c - prev; prev = c; if (v === 'loneVoice') return pr; }
    return 0;
  }
  /* per-second EVENT rate (phrase melodic + P4 pad windows + pad-track windows/swells);
     wind (120) + fixed toll terms added once below */
  function perSec(reg, p, fig, annTier) {
    const dens = seasonDens(p), bpm = pulseBPM(p);
    const night = reg === 'deep-night' || reg === 'evening';
    const w0 = MENU[reg];
    const lean = w0[fig] > 0 ? 1.6 : 1;
    const w = { P1: w0.P1 * (fig === 'P1' ? lean : 1), P2: w0.P2 * (fig === 'P2' ? lean : 1), P3: w0.P3 * (fig === 'P3' ? lean : 1), P4: w0.P4 * (fig === 'P4' ? lean : 1) };
    const tot = w.P1 + w.P2 + w.P3 + w.P4;
    const q = { P1: w.P1 / tot, P2: w.P2 / tot, P3: w.P3 / tot, P4: w.P4 / tot };
    const rep = annTier >= 1 ? (annTier === 1 ? 0.50 : annTier === 2 ? 0.33 : 0.20) : 0;
    // phrase events: P1=3, P2=(1-rep)*4+rep*6, P3=4, P4→2 Breath pad windows
    const evPer = q.P1 * 3 + q.P2 * ((1 - rep) * 4 + rep * 6) + q.P3 * 4 + q.P4 * 2;
    const beat = 60 / bpm, step = 30 / bpm;
    const span = q.P1 * (2 * beat + (night ? 2.2 : celLen(1.4)))
      + q.P2 * ((1 - rep) * (1.26 + celLen(2.2)) + rep * (2.18 + celLen(1.55)))
      + q.P3 * (3 * step + 0.9) + q.P4 * 13.4;
    const rest = eMinCap(REST[reg], dens, 240);
    const phraseRate = evPer / (rest + span);
    // pad-episode track: chord episodes emit ⌈onDur/8⌉ windows; loneVoice ~min(5,fit) swells
    const onAvg = (PAD_ON[reg][0] + PAD_ON[reg][1]) / 2;
    const offEff = eMinCap(PAD_OFF[reg], dens, 300);
    const period = onAvg + offEff;
    const pLone = slotProbLone(reg, wMaj(p));
    const windowsPerChordEp = Math.ceil(onAvg / 8);
    const swellsPerLoneEp = Math.min(5, Math.floor(onAvg / (5.5 + 2)));
    const padRate = ((1 - pLone) * windowsPerChordEp + pLone * swellsPerLoneEp) / period;
    return phraseRate + padRate;
  }
  let bandOk = true;
  console.log('  · (9) density table (expected vs actual events/hour, r6):');
  for (const id of FIX_IDS) {
    const F = FIX[id], fig = figureOf(F.dateInt);
    let exp = 1 + (F.hour === 0 ? 1 : 0) + (F.annTier === 1 ? 1 : 0) + (F.solarNoonMin !== null ? 4 : 0) + 120;
    for (let m = 0; m < 60; m++) exp += perSec(regAt(F.altCurve, m * 60 + 30), F.seasonPhase, fig, F.annTier) * 60;
    const act = OUT[id].length;
    const within = Math.abs(act - exp) <= 0.40 * exp;
    if (!within) bandOk = false;
    console.log('      ' + id.padEnd(9) + ' fig=' + fig + '  expected ≈ ' + exp.toFixed(0).padStart(4) + '   actual ' + String(act).padStart(4) + (within ? '' : '   ✗ OUT OF BAND'));
  }
  ok(bandOk, '(9) events/hour within ±40 % of the r6 register×season×wind expectation, all 9');
}

/* ── 10 · the anniversary hook ── */
{
  for (const id of ['F-ANN', 'F-STRESS']) {
    const mir = MIR[id];
    ok(mir.phrases.length > 0 && mir.phrases[0].type === 'P5' && mir.phrases[0].forced,
      '(10) ' + id + ': the first post-toll phrase is the forced Signature');
    const ph = mir.phrases[0];
    const wm = mir.wm;
    const offs = wm >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12];
    const exact = offs.every((off, i) =>
      OUT[id].some(e => e.layer === 'notes' && Math.abs(e.t - (ph.tOn + SIG_ONS[i])) <= T9
        && e.params.freq === semiToFreq(9 + off)
        && e.params.dec === SIG_DECS[i] && e.params.vel === SIG_VELS[i]));
    ok(exact, '(10) ' + id + ': Signature notes exact (degrees + the 0.42 s clock + decs + vels)');
    const dbl = OUT[id].filter(e => e.layer === 'toll' && e.t === 0.92);
    const wantSemi = tollSemiOf(regAt(FIX[id].altCurve, 0)) + 12;
    ok(dbl.length === 1 && dbl[0].params.freq === semiToFreq(wantSemi),
      '(10) ' + id + ': tier-1 doubled toll at t=0.92, one octave up (semi ' + wantSemi + ')');
  }
  let cleanOk = true, first = '';
  const dOns = SIG_ONS.slice(1).map((t, i) => t - SIG_ONS[i]);
  for (const id of FIX_IDS.filter(x => FIX[x].annTier === 0)) {
    if (MIR[id].phrases.some(pp => pp.type === 'P5')) { cleanOk = false; if (!first) first = id + ' (mirror P5)'; }
    const notes = OUT[id].filter(e => e.layer === 'notes');
    for (let i = 0; i + 5 < notes.length; i++) {
      const win = notes.slice(i, i + 6);
      if (!dOns.every((d, j) => Math.abs((win[j + 1].t - win[j].t) - d) <= 1e-6)) continue;
      const s0 = FREQ_TO_SEMI.get(win[0].params.freq);
      const rel = win.map(e => FREQ_TO_SEMI.get(e.params.freq) - s0);
      if ([[0, 4, 7, 12, 7, 12], [0, 3, 7, 12, 7, 12]].some(c => c.every((v, j) => v === rel[j]))) {
        cleanOk = false; if (!first) first = id + ' t=' + win[0].t;
      }
    }
    const dbl = OUT[id].some(e => e.layer === 'toll' && e.t === 0.92);
    if (dbl) { cleanOk = false; if (!first) first = id + ' phantom doubled toll'; }
  }
  ok(cleanOk, '(10) annTier 0: the Signature\'s 6-note degree pattern appears nowhere; no doubled toll', first);
}

/* ── 11 · concurrency (r6 SPLIT — print note/toll max, then the hour tooth) ── */
{
  function maxConcurrent(list) {
    const pts = [];
    for (const e of list) { pts.push([evStart(e), 1]); pts.push([evStart(e) + evLen(e), -1]); }
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // ends before starts at ties
    let cur = 0, mx = 0;
    for (const [, d] of pts) { cur += d; if (cur > mx) mx = cur; }
    return mx;
  }
  let toothOk = true, first = '';
  console.log('  · (11) concurrency (note/toll max → hour budget vs actual):');
  for (const id of FIX_IDS) {
    const ntMax = maxConcurrent(notesTollOf(OUT[id]));
    const allMax = maxConcurrent(OUT[id]);
    const breathAndLone = MIR[id].hasBreath && MIR[id].loneEps.length > 0;
    const budget = ntMax + 2 /*wind*/ + (breathAndLone ? 3 : 2) /*pad*/;
    const within = allMax <= budget;
    if (!within) { toothOk = false; if (!first) first = id + ' all=' + allMax + ' > budget=' + budget; }
    console.log('      ' + id.padEnd(9) + ' note/toll max ' + ntMax + '  + 2 wind + ' + (breathAndLone ? 3 : 2) + ' pad = budget ' + budget + '   actual sounding max ' + allMax + (within ? '' : '   ✗'));
  }
  ok(toothOk, '(11) max simultaneous sounding ≤ note/toll max + 2 wind + 2 pad (+3 in a Breath+loneVoice hour); no +6', first);
}

/* ── 12 · size budget — existence-scoped, self-tightening (§8.1-12, r16 re-arm) ── */
{
  const sz = f => fs.statSync(path.join(__dirname, f)).size;
  const pair = sz('score.mjs') + sz('score-voices.mjs');
  const airPath = path.join(__dirname, 'air.js');
  if (fs.existsSync(airPath)) {
    const trio = pair + fs.statSync(airPath).size;
    ok(trio <= 131072, '(12) trio score.mjs+score-voices.mjs+air.js = ' + trio + ' B ≤ 131,072 B');
  } else {
    ok(pair <= 88064, '(12) pair score.mjs+score-voices.mjs = ' + pair + ' B ≤ 88,064 B');
    console.log('  · (12) air.js pending');
  }
}

/* ── 13 · covenants ── */
{
  const stripComments = s => s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
  const ANCHOR_LIT = '261.' + '625565';
  const ASSET_RE = new RegExp('forge:' + 'asset|data:' + 'audio|;base' + '64,[A-Za-z0-9+/]{64}');
  const calFiles = fs.readdirSync(__dirname).filter(f => fs.statSync(path.join(__dirname, f)).isFile());
  const fixFiles = fs.readdirSync(path.join(__dirname, 'fixtures')).filter(f => fs.statSync(path.join(__dirname, 'fixtures', f)).isFile()).map(f => path.join('fixtures', f));
  const r5nFiles = fs.readdirSync(path.join(__dirname, 'fixtures', 'r5-notes')).map(f => path.join('fixtures', 'r5-notes', f));
  // ANCHOR-literal (anti-circularity) scans CODE + the moment manifests only — the r5-notes
  // dumps are FREQUENCY data (semiToFreq(0) = middle C is a legal note value, not a hardcoded
  // pitch constant); the asset/file greps still cover ALL of tools/calendar/ incl. r5-notes.
  const anchorFiles = calFiles.concat(fixFiles);
  const assetFiles = calFiles.concat(fixFiles, r5nFiles);
  let anchor = true, assets = true, files = true, firstA = '';
  for (const f of anchorFiles) {
    if (fs.readFileSync(path.join(__dirname, f), 'utf8').includes(ANCHOR_LIT)) { anchor = false; firstA = firstA || f; }
  }
  for (const f of assetFiles) {
    const txt = fs.readFileSync(path.join(__dirname, f), 'utf8');
    if (ASSET_RE.test(txt)) { assets = false; firstA = firstA || f; }
    if (/\.(wav|mp3|ogg|m4a|flac)$/i.test(f)) { files = false; firstA = firstA || f; }
  }
  ok(anchor, '(13) the pitch-anchor literal appears in NO tools/calendar code/manifest file', firstA);
  ok(fs.readFileSync(path.join(REPO, 'sound-garden', 'pitch-core.mjs'), 'utf8').includes(ANCHOR_LIT),
    '(13) …and DOES live in sound-garden/pitch-core.mjs (the one home)');
  const scoreCode = stripComments(fs.readFileSync(path.join(__dirname, 'score.mjs'), 'utf8'));
  ok(!/Math\.random|Date\.now|sampleRate/.test(scoreCode),
    '(13) no Math.random / Date.now / sampleRate in score.mjs executable code');
  ok(assets && files, '(13) no audio assets: no asset directives / embedded audio / audio files under tools/calendar/', firstA);
  /* Audio-asset refs must not reach the PAGE-SHIPPED modules (score-render.mjs's
     §5.2 `<out.wav>` CLI is design-mandated + Node-only, hence scoped out).
     The extension is word-BOUNDED (r11): §8.1-13's law is "no audio-asset
     references", and an unbounded substring test convicts the identifier
     `P.wavetable` — the realize-mode property SCORE r11.2 MANDATES in the bank —
     which references no asset. A real ref ('out.wav', "x.mp3") ends the token at
     the extension and is still caught; the filename/asset-directive/base64 greps
     above are unchanged and still cover ALL of tools/calendar/ recursively. */
  let refOk = true, firstR = '';
  for (const f of ['calendar.js', 'score.mjs', 'score-voices.mjs'].concat(fs.existsSync(path.join(__dirname, 'air.js')) ? ['air.js'] : [])) {
    if (/\.(wav|mp3)\b/i.test(fs.readFileSync(path.join(__dirname, f), 'utf8'))) { refOk = false; firstR = firstR || f; }
  }
  ok(refOk, '(13) no .wav/.mp3 refs in the page-shipped modules', firstR);
}

/* ── 14 · describe() snapshot — the exact §9 strings (twin-local literals) ── */
{
  const REG_L = {
    'deep-night': "Deep night. The estate is mostly listening; a low string, now and then, to prove the dark is inhabited.",
    'dawn': "First light. The Staircase climbs with the sun.",
    'day': "Full day. The air is open — the loom and the glass take turns, and the rests are short.",
    'dusk': "The light is leaving. The Staircase comes back down.",
    'evening': "Lamplight. Fewer notes, lower voices, longer rests."
  };
  const FIG_L = {
    P1: "today's figure is the Murmur — two notes rocking, the smallest tune the estate owns.",
    P2: "today's figure is the Staircase — four even steps, rising or falling with the light.",
    P3: "today's figure is the Climb — a quick run of four, kept for full day.",
    P4: "today's figure is the Breath — no tune today; the air itself swells and falls."
  };
  const seasonL = wm =>
    wm >= 0.8 ? "High summer in the air: nearly every phrase takes the bright third. The Gate's own key." :
    wm >= 0.6 ? "The year leans bright; most phrases take the major third." :
    wm >= 0.4 ? "The turning of the year: the air cannot decide between its two thirds, and plays both." :
    wm >= 0.2 ? "The year leans dark; most phrases take the minor third." :
    "Deep winter in the air: the minor third, and long silences between thoughts.";
  const annSuffix = " — the Signature opens the hour: the six notes the front gate sings.";
  let dOk = true, first = '';
  for (const id of FIX_IDS) {
    const F = FIX[id];
    const d = Score.describe(F);
    const want = {
      registerLine: REG_L[regAt(F.altCurve, 0)],
      seasonLine: seasonL(wMaj(F.seasonPhase)),
      figureLine: FIG_L[figureOf(F.dateInt)],
      annLine: F.annTier >= 1 ? F.annLabel + annSuffix : null
    };
    for (const k of ['registerLine', 'seasonLine', 'figureLine', 'annLine'])
      if (d[k] !== want[k]) { dOk = false; if (!first) first = id + ' ' + k; }
  }
  ok(dOk, '(14) describe(): exact §9 strings per fixture, incl. F-ANN\'s locked §8.1-14 annLine', first);
}

/* ── 15 · the day's figure ── */
{
  let stable = true, agree = true, first = '';
  for (const [y, mo, d] of [[2026, 12, 21], [2026, 6, 21], [2026, 9, 22]]) {
    const types = [3, 10, 15].map(h => {
      const m = C.momentManifest(y, mo, d, h, Hours);
      const mir = mirrorArm(m);
      const dd = compareToMirror(Score.armResponse(m), mir.events);
      if (dd) { agree = false; if (!first) first = y + '-' + mo + '-' + d + ' h' + h + ': ' + dd; }
      return mir.type;
    });
    if (!(types[0] === types[1] && types[1] === types[2])) { stable = false; if (!first) first = y + '-' + mo + '-' + d; }
    if (types[0] !== figureOf(y * 10000 + mo * 100 + d)) { agree = false; if (!first) first = y + '-' + mo + '-' + d; }
  }
  ok(stable, '(15) figure identical across 3 hours of one date, 3 dates', first);
  ok(agree, '(15) figure === the twin\'s own pinned cumulative mapping of dateInt (module announcements match)', first);
  let openOk = true, firstO = '';
  for (const id of FIX_IDS) {
    const mir = MIR[id];
    if (!mir.openerInfo) continue;
    const slot = FIX[id].annTier >= 1 ? 1 : 0;
    if (mir.openerInfo.listed) {
      const ph = mir.phrases[slot];
      if (!ph || ph.type !== mir.fig || !ph.forced) { openOk = false; if (!firstO) firstO = id; }
    }
  }
  ok(openOk, '(15) in every fixture whose register lists the figure, the first drawn phrase IS the figure', firstO);
  const figs = new Set();
  let xOk = true, firstX = '';
  for (let d = 1; d <= 20; d++) {
    const di = 20260700 + d;
    figs.add(figureOf(di));
    const m = C.momentManifest(2026, 7, d, 12, Hours);
    if (m.annTier !== 0) continue;
    const mir = mirrorArm(m);
    const dd = compareToMirror(Score.armResponse(m), mir.events);
    if (dd || mir.type !== figureOf(di)) { xOk = false; if (!firstX) firstX = '2026-07-' + d + (dd ? ': ' + dd : ''); }
  }
  ok(figs.size >= 3, '(15) ≥ 3 distinct figure values across 20 consecutive dates (got ' + figs.size + ')');
  ok(xOk, '(15) module announcement agrees with the mapping on every annTier-0 July date', firstX);
  let distOk = true, corrOk = true, firstD = '';
  for (const id of ['F-DAY', 'F-DNW']) {
    const counts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    let n = 0;
    const reg = regAt(FIX[id].altCurve, 0);
    for (let i = 0; i < 10; i++) {
      const m = Object.assign({}, FIX[id], { seed: hash2(FIX[id].seed, i) });
      const mir = mirrorHour(m, { figureOff: true });
      const dd = compareToMirror(Score.composeHour(m, { figureOff: true }).events, mir.events);
      if (dd) { corrOk = false; if (!firstD) firstD = id + ' seed#' + i + ': ' + dd; }
      for (const pp of mir.phrases) if (pp.reg === reg) { counts[pp.type]++; n++; }
    }
    for (const t of ['P1', 'P2', 'P3', 'P4'])
      if (Math.abs(counts[t] / n - MENU[reg][t]) > 0.10) { distOk = false; if (!firstD) firstD = id + ' ' + t + '=' + (counts[t] / n).toFixed(3) + ' want ' + MENU[reg][t]; }
  }
  ok(corrOk, '(15) figureOff: module === mirror (hook parity)', firstD);
  ok(distOk, '(15) figureOff: menu-weight distribution returns to the §3.3 table (±0.10)', firstD);
  const mirAnnOff = mirrorHour(FIX['F-ANN'], { figureOff: true });
  ok(mirAnnOff.phrases[0] && mirAnnOff.phrases[0].type === 'P5' && mirAnnOff.phrases[0].forced
    && compareToMirror(Score.composeHour(FIX['F-ANN'], { figureOff: true }).events, mirAnnOff.events) === null,
    '(15) figureOff leaves the §3.6 anniversary Signature opener intact');
}

/* ── 16 · scoreSelfTest passthrough (§8.1a) ── */
{
  const st = Score.scoreSelfTest();
  ok(st.pass === true, '(16) scoreSelfTest().pass === true');
  ok(st.n === 7, '(16) scoreSelfTest().n === 7 (the §8.1a battery\'s assert count)', 'got ' + st.n);
}

/* ── 17 · the announcement (§3.8-1) ── */
{
  let det = true, legal = true, seqOk = true, mirOk = true, first = '';
  for (const id of FIX_IDS) {
    const F = FIX[id];
    const a1 = Score.armResponse(F), a2 = Score.armResponse(F);
    if (JSON.stringify(a1) !== JSON.stringify(a2)) { det = false; if (!first) first = id; }
    for (const e of a1) { // legal semis: NOTE events only (Breath-day pad windows carry no freq)
      const P = e.params;
      const fs2 = P.freqs ? P.freqs : (P.freq !== undefined ? [P.freq] : null);
      if (fs2 === null) continue;
      for (const f of fs2) if (!FREQ_TO_SEMI.has(f)) { legal = false; if (!first) first = id; }
    }
    for (let i = 0; i < a1.length; i++) if (a1[i].seq < 0x4000) { seqOk = false; if (!first) first = id + ' seq=' + a1[i].seq; }
    const mir = mirrorArm(F);
    const dd = compareToMirror(a1, mir.events);
    if (dd) { mirOk = false; if (!first) first = id + ': ' + dd; }
    if (F.annTier >= 1) {
      const offs = wMaj(F.seasonPhase) >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12];
      const exact = a1.length === 6 && offs.every((off, i) =>
        Math.abs(a1[i].t - SIG_ONS[i]) <= T9 && a1[i].params.freq === semiToFreq(9 + off)
        && a1[i].params.dec === SIG_DECS[i] && a1[i].params.vel === SIG_VELS[i]);
      ok(exact, '(17) ' + id + ': announcement is the EXACT Signature (degrees + the 0.42 s clock)');
    } else {
      ok(mir.type === figureOf(F.dateInt),
        '(17) ' + id + ': announcement type === the date\'s figure (' + figureOf(F.dateInt) + '), realized at ' + mir.reg);
    }
  }
  ok(det, '(17) armResponse twice → deep-equal, all 9 fixtures', first);
  ok(legal, '(17) every announcement note frequency in the legal-semi set', first);
  ok(seqOk, '(17) announcement seq all ≥ 0x4000 (Breath-day pad windows included — r6.1-r5)', first);
  ok(mirOk, '(17) announcement === the twin\'s independent §3.8-1 recompute, all 9', first);
}

/* ── r6 NOTE/TOLL TWIN TOOTH — the layer stays r5-EXACT (canonical multiset) ── */
{
  function noteKey(e) {
    return [e.t.toFixed(6), e.voice, e.layer, (e.params.freq !== undefined ? e.params.freq : 0).toFixed(6),
      (e.params.dec !== undefined ? e.params.dec : (e.params.dur !== undefined ? e.params.dur : 0)).toFixed(6),
      (e.params.vel !== undefined ? e.params.vel : 0).toFixed(6)].join('|');
  }
  const cmpKey = (x, y) => { const a = noteKey(x), b = noteKey(y); return a < b ? -1 : a > b ? 1 : 0; };
  function pEq(a, b) {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.join() !== kb.join()) return false;
    for (const k of ka) { if (typeof a[k] === 'number') { if (!t9(a[k], b[k])) return false; } else if (a[k] !== b[k]) return false; }
    return true;
  }
  let dumpOk = true, first = '';
  for (const id of FIX_IDS) {
    const dumpPath = path.join(__dirname, 'fixtures', 'r5-notes', id + '.json');
    const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
    const nt = notesTollOf(OUT[id]).map(({ seq, ...e }) => e); // seq excluded — the layered law re-numbers it
    if (nt.length !== dump.length) { dumpOk = false; if (!first) first = id + ' len ' + nt.length + ' vs dump ' + dump.length; continue; }
    const a = nt.slice().sort(cmpKey), b = dump.slice().sort(cmpKey);
    for (let i = 0; i < a.length; i++) {
      if (a[i].voice !== b[i].voice || a[i].layer !== b[i].layer || !t9(a[i].t, b[i].t) || a[i].pan !== b[i].pan
        || !t9(a[i].gain, b[i].gain) || !pEq(a[i].params, b[i].params)) { dumpOk = false; if (!first) first = id + ' #' + i; break; }
    }
  }
  ok(dumpOk, 'r6 note/toll tooth: the note/toll layer === the committed r5 dumps field-for-field, all 9', first);
}

/* ── BYTE-TWIN — all three slices, conditioned on the pasted sentinel ── */
{
  function slice(file, beginMark, endMark) {
    const txt = fs.readFileSync(file, 'utf8');
    const b = txt.indexOf(beginMark), e = txt.indexOf(endMark);
    const onceB = b !== -1 && txt.indexOf(beginMark, b + 1) === -1;
    const onceE = e !== -1 && txt.indexOf(endMark, e + 1) === -1;
    return { ok: onceB && onceE && e > b, text: onceB && onceE && e > b ? txt.slice(b, e + endMark.length) : '' };
  }
  const CORE_B = '// ===== CALENDAR SCORE CORE — BEGIN =====', CORE_E = '// ===== CALENDAR SCORE CORE — END =====';
  const VOX_B = '// ===== CALENDAR SCORE VOICES — BEGIN =====', VOX_E = '// ===== CALENDAR SCORE VOICES — END =====';
  const PIT_B = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====', PIT_E = '// ===== PITCH CORE END =====';
  const core = slice(path.join(__dirname, 'score.mjs'), CORE_B, CORE_E);
  const vox = slice(path.join(__dirname, 'score-voices.mjs'), VOX_B, VOX_E);
  const pit = slice(path.join(REPO, 'sound-garden', 'pitch-core.mjs'), PIT_B, PIT_E);
  ok(core.ok, 'byte-twin: score.mjs carries the CALENDAR SCORE CORE sentinel pair exactly once');
  ok(vox.ok, 'byte-twin: score-voices.mjs carries the CALENDAR SCORE VOICES sentinel pair exactly once');
  ok(pit.ok, 'byte-twin: pitch-core.mjs carries the PITCH CORE sentinel pair exactly once (its OWN pair, not COMMA/OUT-OF-TUNE)');
  [{ built: 'index.html', srcHtml: 'index.src.html' },
   { built: path.join('hours', 'almanac.html'), srcHtml: path.join('hours', 'almanac.src.html') }
  ].forEach(pg => {
    const sp = path.join(REPO, pg.srcHtml);
    const armed = fs.existsSync(sp) && fs.readFileSync(sp, 'utf8').includes(CORE_B);
    if (!armed) { console.log('  · byte-twin ' + pg.built + ': pending (no score slice pasted yet)'); return; }
    let page = '';
    try { page = fs.readFileSync(path.join(REPO, pg.built), 'utf8'); } catch (e) { /* missing build */ }
    ok(page.includes(core.text), 'byte-twin: ' + pg.built + ' carries the SCORE CORE slice char-for-char');
    ok(page.includes(vox.text), 'byte-twin: ' + pg.built + ' carries the SCORE VOICES slice char-for-char');
    ok(page.includes(pit.text), 'byte-twin: ' + pg.built + ' carries the PITCH CORE slice char-for-char');
  });
}

/* ── report ── */
const total = pass + fail;
console.log('score twin: ' + pass + '/' + total + ' PASS' + (fail ? ' — ' + fail + ' FAILED' : ''));
if (fail) process.exitCode = 1;
