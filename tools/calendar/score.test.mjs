#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   score.test.mjs — the composer's Node twin (G-SCORE).
   Run:  node tools/calendar/score.test.mjs

   SCORE.md §8.1 checks 1–17, each a hard pass/fail, over the eight §8.2
   fixtures (tools/calendar/fixtures/F-*.json). The twin carries its OWN
   copies of every §3 table/formula (never read from score.mjs) plus an
   INDEPENDENT mirror composer built from the §4 pinned draw order:
     · phrase k (0x9000+k): menu draw (consumed+DISCARDED when forced) ·
       [Signature-replacement draw — drawn-P2 + annTier≥1 only] · mode
       commit (every phrase) · KS event gain (KS-voiced only) · rest ·
       degrees (P1 only: pattern 50/50, base 50/50, one vel per note).
     · register/altitude basis = the cursor BEFORE the rest draw.
     · pad episode j (0xA000+j): ON dur · OFF base · [day sonority 70/30] ·
       [deep-season third 0.5 when |wMaj−0.5|>0.35] · tile gain 0.08..0.12.
     · announcement (0xB000, §3.8-1): mode commit · KS gain · row draws.
   Mirror ↔ module correspondence is asserted event-for-event (t, voice,
   layer, params, gain, pan, seq) on every composed hour, so the mirror's
   statistics ARE the module's.

     1  determinism — double-compose deep-equal + sha256 stable (within-run;
        no stored cross-machine hashes — DESIGN §8.2)
     2  the seed edge — 10 manifest pairs via Calendar.momentManifest
        (hour+1 / next day) differ; same in → same out
     3  pitch domain — LEGAL_SEMIS rebuilt from the §3.1a tables as the
        UNCLIPPED base×offsets product set (∪ toll/pad/midnight absolutes;
        a tier-1 DAY hour doubles the A5 toll to semi 33 = A5+d8, so
        clipping at +21 would fail the design's own fixtures); register
        teeth on F-DNW/F-DAY/F-EVE (first Staircase exact semis + toll semi)
     4  phrase-mode purity — no phrase carries both C♮ and C♯ classes
     5  the season law — 8 fixtures × 10 seeds (hash2(F.seed, i), i∈0..9,
        overriding moment.seed ONLY); per-hour ±0.25, aggregate ±0.10
     6  onset windows — melodic [2,3540] · pad [0,3591] · audio ends ≤3599.5
     7  tolls — t=0.5 register pitch · midnight double iff hour===0 (proved
        on a real hour-0 manifest) · noon carillon iff solarNoonMin
     8  silence accounting — melodic-silent ≥0.55 on F-DNW; DNW > EVE > DAY
     9  density bands — ±40 % of the expectation table the test emits from
        the §3.3/§3.4 constants (figure lean + tier replacement included)
     10 anniversary hook — exact Signature opener; pattern nowhere at
        annTier 0; tier-1 doubled toll
     11 concurrency — max simultaneous sounding events ≤ 10
     12 size budget — EXISTENCE-SCOPED (§8.1-12): air.js absent → the pair
        score.mjs+score-voices.mjs ≤ 29,696 B and prints `air.js pending`;
        the moment air.js exists → the trio ≤ 45,056 B, forever
     13 covenants — the pitch-anchor literal only in pitch-core.mjs; no
        Math.random / Date.now / sampleRate in score.mjs executable code; no
        audio assets: no asset directives / embedded audio / audio files
        under tools/calendar/, no .wav/.mp3 refs in the PAGE-SHIPPED modules
        (score-render.mjs's §5.2 CLI is design-mandated `<out.wav>` —
        Node-only, never shipped, so the asset grep scopes the ref-check to
        the shipped feature files; the needles below are built by
        concatenation so this scanner never carries its own tokens)
     14 describe() snapshot — the exact §9 strings per fixture (twin-local
        literals), incl. F-ANN's locked §8.1-14 annLine
     15 the day's figure — 3 dates × 3 hours identical + dateInt-derived;
        the forced opener per fixture; ≥3 distinct figures over 20 dates;
        figureOff returns the menu distribution to the §3.3 table
     16 scoreSelfTest passthrough — pass===true, n === 7 (the §8.1a battery:
        2 anchors + determinism + legal + toll + 2 describe)
     17 the announcement — armResponse deep-equal twice; legal semis; seq
        dense from 0x4000; annTier≥1 → the EXACT Signature; annTier 0 →
        the date's figure per the twin's own pinned cumulative mapping,
        realized at registerOf's register (full independent recompute)

   BYTE-TWIN (house shape, conditioned as in calendar.test.cjs): when a
   page's .src.html carries the pasted `CALENDAR SCORE CORE` sentinel, the
   BUILT page must contain all three slices char-for-char — the pitch-core
   `PITCH CORE (inlined byte-twin) BEGIN/END` region (targeted by ITS OWN
   pair; the file has three regions), the `CALENDAR SCORE CORE — BEGIN/END`
   region, and the `CALENDAR SCORE VOICES — BEGIN/END` region. T3.3 (front
   door) / T5.2 (almanac) arm it; until then it prints pending.

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

/* ── the twin's OWN §3/§4 tables — copied from SCORE.md, never from score.mjs ── */
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
const PAD_SON = {
  'deep-night': [[-15, -8]], 'evening': [[-15, -8]],
  'dawn': [[-15, -8, -3]], 'dusk': [[-15, -8, -3]],
  'day': [[-15, -8, -3], [-3, 4]]
};
const P2_RISES = { 'deep-night': false, 'dawn': true, 'day': true, 'dusk': false, 'evening': false };
const SIG_ONS = [0, 0.42, 0.84, 1.26, 1.76, 2.18];
const SIG_DECS = [0.95, 0.98, 1.02, 1.08, 0.90, 1.55];
const SIG_VELS = [0.34, 0.36, 0.38, 0.42, 0.37, 0.49];
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

/* per-voice audible length (the §5.1 bank's own laws; upper bounds) */
function evLen(e) {
  if (e.voice === 'celesta') return celLen(e.params.dec);
  if (e.voice === 'ksPluck') return e.params.dur;
  return e.params.dur + e.params.release; // padChord — 5.4 s tiles
}

/* ── the INDEPENDENT mirror composer (§4 pinned order; §3 rows) ── */
function mirrorPhrase(out, type, reg, maj, t0, r, ksg, alt, bpm, wm, padSon) {
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
  if (type === 'P4') {
    for (let i = 0; i < 3; i++) out.push({ t: t0 + 4 * i, voice: 'padChord', params: { freqs: padSon.map(s => semiToFreq(s)), dur: 4.0, attack: 1.4, release: 1.4, gain: 0.10 }, gain: 1, pan: 0, layer: 'pad' });
    return t0 + 8 + 5.4;
  }
  offs = wm >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12]; // P5 — the seasonal third
  for (let i = 0; i < 6; i++) out.push({ t: t0 + SIG_ONS[i], voice: 'celesta', params: { freq: nh('A4', offs[i]), dec: SIG_DECS[i], vel: SIG_VELS[i] }, gain: 1, pan: 0, layer: 'notes' });
  return t0 + SIG_ONS[5] + celLen(SIG_DECS[5]);
}
function mirrorFinish(list, seqBase) {
  list.sort((a, b) => a.t - b.t); // stable — same law as the module
  list.forEach((e, i) => { e.seq = seqBase + i; });
  return list;
}
function mirrorHour(m, opts) {
  const seed = m.seed, curve = m.altCurve, p = m.seasonPhase;
  const wm = wMaj(p), dens = seasonDens(p), bpm = pulseBPM(p);
  const figOff = !!(opts && opts.figureOff);
  const fig = figureOf(m.dateInt);
  const deep = Math.abs(wm - 0.5) > 0.35;
  const ev = [];
  /* tolls */
  const regTop = regAt(curve, 0);
  const tollSemi = tollSemiOf(regTop);
  ev.push({ t: 0.5, voice: 'celesta', params: { freq: semiToFreq(tollSemi), dec: 2.0, vel: 0.30 }, gain: 1, pan: 0, layer: 'toll' });
  if (m.hour === 0) ev.push({ t: 0.5, voice: 'ksPluck', params: { freq: semiToFreq(-15), dur: 3.0, brightness: 0.2, vel: 0.5 }, gain: 1, pan: 0, layer: 'toll' });
  if (m.annTier === 1) ev.push({ t: 0.92, voice: 'celesta', params: { freq: semiToFreq(tollSemi + 12), dec: 2.0, vel: 0.30 }, gain: 1, pan: 0, layer: 'toll' });
  if (m.solarNoonMin !== null) {
    const tc = m.solarNoonMin * 60 + 30;
    const co = wm >= 0.5 ? [0, 4, 7, 12] : [0, 3, 7, 12];
    for (let i = 0; i < 4; i++) ev.push({ t: tc + i * 0.42, voice: 'celesta', params: { freq: nh('A4', co[i]), dec: 1.5 + 0.7 * i / 3, vel: 0.50 }, gain: 1, pan: 0, layer: 'toll' });
  }
  /* pad episodes (0xA000+j) */
  const padEps = [];
  let pt = 0, pj = 0;
  while (pt <= 3591) {
    const pr = mulberry32(hash2(seed, 0xA000 + pj));
    const preg = regAt(curve, pt);
    const onR = PAD_ON[preg], offR = PAD_OFF[preg];
    const onDur = onR[0] + (onR[1] - onR[0]) * pr();
    const offBase = offR[0] + (offR[1] - offR[0]) * pr();
    let son = preg === 'day' ? (pr() < 0.7 ? PAD_SON.day[0] : PAD_SON.day[1]) : PAD_SON[preg][0];
    if (deep && pr() < 0.5) son = son.concat(wm > 0.5 ? 1 : 0);
    const pg = 0.08 + 0.04 * pr();
    padEps.push({ t0: pt, son });
    for (let i = 0; i * 4 < onDur; i++) {
      const tt = pt + i * 4;
      if (tt > 3591) break;
      ev.push({ t: tt, voice: 'padChord', params: { freqs: son.map(s => semiToFreq(s)), dur: 4.0, attack: 1.4, release: 1.4, gain: pg }, gain: 1, pan: 0, layer: 'pad' });
    }
    pt = pt + onDur + Math.min(300, offBase / dens);
    pj++;
  }
  /* phrase-and-rest engine (0x9000+k) */
  const phrases = [];
  let openerInfo = null; // the §3.8-2 forced-figure attempt, recorded
  let mt = 0, mk = 0;
  let sigPending = m.annTier >= 1;
  let figPending = !figOff;
  while (true) {
    const reg = regAt(curve, mt);
    const alt = altAt(curve, mt);
    const r = mulberry32(hash2(seed, 0x9000 + mk));
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
    let padSon = null;
    if (type === 'P4') {
      padSon = padEps[0].son;
      for (let i = 0; i < padEps.length; i++) { if (padEps[i].t0 <= tOn) padSon = padEps[i].son; else break; }
    }
    phrases.push({ k: mk, type, forced, tOn, maj, reg });
    mt = mirrorPhrase(ev, type, reg, maj, tOn, r, ksg, alt, bpm, wm, padSon);
    mk++;
  }
  return { events: mirrorFinish(ev, 0), phrases, padEps, openerInfo, wm, fig };
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
  mirrorPhrase(ev, type, reg, maj, 0, r, ksg, alt, bpm, wm, PAD_SON[reg][0]);
  return { events: mirrorFinish(ev, 0x4000), type, reg };
}

/* event-for-event compare: module output vs the mirror's */
function evDiff(a, b, i) {
  const t9 = (x, y) => Math.abs(x - y) <= 1e-9;
  if (a.voice !== b.voice || a.layer !== b.layer) return `#${i} voice/layer ${a.voice}/${a.layer} vs ${b.voice}/${b.layer}`;
  if (!t9(a.t, b.t)) return `#${i} t ${a.t} vs ${b.t}`;
  if (a.pan !== 0 || b.pan !== 0) return `#${i} pan`;
  if (!t9(a.gain, b.gain)) return `#${i} gain ${a.gain} vs ${b.gain}`;
  if (a.seq !== b.seq) return `#${i} seq ${a.seq} vs ${b.seq}`;
  const P = a.params, Q = b.params;
  if (a.voice === 'padChord') {
    if (!Array.isArray(P.freqs) || P.freqs.length !== Q.freqs.length) return `#${i} freqs len`;
    for (let j = 0; j < Q.freqs.length; j++) if (P.freqs[j] !== Q.freqs[j]) return `#${i} freqs[${j}]`;
    if (P.dur !== Q.dur || P.attack !== Q.attack || P.release !== Q.release || !t9(P.gain, Q.gain)) return `#${i} pad params`;
  } else {
    if (P.freq !== Q.freq) return `#${i} freq ${P.freq} vs ${Q.freq}`;
    if (!t9(P.vel, Q.vel)) return `#${i} vel`;
    if (a.voice === 'celesta') { if (!t9(P.dec, Q.dec)) return `#${i} dec`; }
    else if (P.dur !== Q.dur || P.brightness !== Q.brightness) return `#${i} ks params`;
  }
  return null;
}
function compareToMirror(got, mir) {
  if (got.length !== mir.length) return `event count ${got.length} vs mirror ${mir.length}`;
  for (let i = 0; i < got.length; i++) {
    const d = evDiff(got[i], mir[i], i);
    if (d) return d;
  }
  return null;
}

/* ── fixtures ── */
const FIX_IDS = ['F-DNW', 'F-DAW', 'F-DAY', 'F-NOON', 'F-DSK', 'F-EVE', 'F-ANN', 'F-STRESS'];
const FIX = {};
for (const id of FIX_IDS) FIX[id] = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', id + '.json'), 'utf8'));
const OUT = {}, MIR = {};
for (const id of FIX_IDS) { OUT[id] = Score.composeHour(FIX[id]).events; MIR[id] = mirrorHour(FIX[id]); }

/* ── mirror correspondence (the twin's independence engine) ── */
{
  let bad = '';
  for (const id of FIX_IDS) {
    const d = compareToMirror(OUT[id], MIR[id].events);
    if (d && !bad) bad = id + ': ' + d;
  }
  ok(!bad, 'mirror: module events === the twin\'s independent §3/§4 recompute, all 8 fixtures', bad);
}

/* ── entry-shape covenants (DESIGN §6.3) ── */
{
  let shapeOk = true, first = '';
  for (const id of FIX_IDS) {
    const evts = OUT[id];
    for (let i = 0; i < evts.length; i++) {
      const e = evts[i];
      const good = ['celesta', 'ksPluck', 'padChord'].includes(e.voice)
        && ['pad', 'notes', 'toll'].includes(e.layer)
        && e.pan === 0 && typeof e.gain === 'number'
        && e.seq === i && (i === 0 || evts[i].t >= evts[i - 1].t);
      if (!good && !first) { shapeOk = false; first = id + ' #' + i; }
    }
  }
  ok(shapeOk, 'shape: sorted, seq dense from 0, voice/layer enums, pan 0, gain emitted', first);
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
  ok(det, '(1) composeHour twice → deep-equal, all 8 fixtures');
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

/* ── 3 · pitch domain — exact semis ── */
{
  let legal = true, first = '';
  for (const id of FIX_IDS) {
    for (const e of OUT[id]) {
      const fs2 = e.params.freqs ? e.params.freqs : [e.params.freq];
      for (const f of fs2) if (!FREQ_TO_SEMI.has(f)) { if (!first) first = id + ' t=' + e.t + ' f=' + f; legal = false; }
    }
  }
  ok(legal, '(3) every event frequency === semiToFreq(s), s ∈ LEGAL_SEMIS (unclipped §3.1a product set)', first);
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
          return OUT[id].some(e => Math.abs(e.t - (p2.tOn + i * 0.42)) <= 1e-9 && e.layer === 'notes' && e.params.freq === want);
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
      const evts = MIR[id].events.filter(e => e.t >= ph.tOn - 1e-9 && e.t <= ph.tOn + 14 && (ph.type === 'P4' ? e.layer === 'pad' : e.layer === 'notes'));
      const classes = new Set();
      for (const e of evts) for (const f of (e.params.freqs || [e.params.freq])) classes.add(classOf(f));
      if (classes.has(0) && classes.has(1)) { pure = false; if (!first) first = id + ' phrase k=' + ph.k; }
    }
    for (const e of OUT[id]) { // pad sonorities never mix the thirds either
      if (e.voice !== 'padChord') continue;
      const cs = new Set(e.params.freqs.map(classOf));
      if (cs.has(0) && cs.has(1)) { pure = false; if (!first) first = id + ' pad t=' + e.t; }
    }
  }
  ok(pure, '(4) no phrase (or pad sonority) carries both C♮ and C♯ classes', first);
}

/* ── 5 · the season law (8 fixtures × 10 seeds, seed override ONLY) ── */
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
      const n = mir.phrases.length, nMaj = mir.phrases.filter(p => p.maj).length;
      if (n > 0 && Math.abs(nMaj / n - wm) > 0.25) { hourOk = false; if (!first) first = id + ' seed#' + i + ' frac=' + (nMaj / n).toFixed(3) + ' wMaj=' + wm.toFixed(3); }
      majAll += nMaj; nAll += n;
    }
    if (Math.abs(majAll / nAll - wm) > 0.10) { aggOk = false; if (!first) first = id + ' agg=' + (majAll / nAll).toFixed(3); }
  }
  ok(corrOk, '(5) seeded variants: module === mirror on all 80 hours', first);
  ok(hourOk, '(5) per-hour major-phrase fraction within ±0.25 of wMaj, 80 hours', first);
  ok(aggOk, '(5) 10-seed aggregate within ±0.10 of wMaj, every fixture', first);
}

/* ── 6 · onset windows + cross-hour cleanliness ── */
{
  let winOk = true, endOk = true, first = '';
  for (const id of FIX_IDS) {
    for (const e of OUT[id]) {
      if (e.layer === 'notes' && (e.t < 2 || e.t > 3540)) { winOk = false; if (!first) first = id + ' notes t=' + e.t; }
      if (e.layer === 'pad' && (e.t < 0 || e.t > 3591)) { winOk = false; if (!first) first = id + ' pad t=' + e.t; }
      if (e.t + evLen(e) > 3599.5) { endOk = false; if (!first) first = id + ' end=' + (e.t + evLen(e)); }
    }
  }
  ok(winOk, '(6) melodic onsets ∈ [2,3540] · pad onsets ∈ [0,3591]', first);
  ok(endOk, '(6) every event\'s audio ends ≤ 3599.5 s (per-voice length laws)', first);
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
    /* carillon iff solarNoonMin, at the exact minute */
    const carillon = OUT[id].filter(e => e.layer === 'toll' && e.t > 1.0 && !(F.annTier === 1 && e.t === 0.92));
    if (F.solarNoonMin === null) { if (carillon.length !== 0) { extraOk = false; if (!first) first = id + ' phantom carillon'; } }
    else {
      const tc = F.solarNoonMin * 60 + 30;
      const co = (wMaj(F.seasonPhase) >= 0.5 ? [0, 4, 7, 12] : [0, 3, 7, 12]);
      const good = carillon.length === 4 && co.every((off, i) =>
        carillon.some(e => Math.abs(e.t - (tc + i * 0.42)) <= 1e-9 && e.params.freq === semiToFreq(9 + off) && e.params.vel === 0.50));
      if (!good) { extraOk = false; if (!first) first = id + ' carillon@' + tc; }
    }
  }
  ok(tollOk, '(7) toll at t=0.5 at the register\'s exact pitch; midnight double iff hour===0', first);
  ok(extraOk, '(7) noon carillon iff solarNoonMin, at (min·60+30) s, seasonal third, vel 0.50', first);
  /* the iff's positive arm needs a REAL hour-0 manifest (no fixture has one) */
  const m0 = C.momentManifest(2026, 12, 21, 0, Hours);
  const e0 = Score.composeHour(m0).events;
  const dbl = e0.filter(e => e.layer === 'toll' && e.t === 0.5 && e.voice === 'ksPluck');
  ok(dbl.length === 1 && dbl[0].params.freq === semiToFreq(-15) && dbl[0].params.dur === 3.0
    && dbl[0].params.brightness === 0.2 && dbl[0].params.vel === 0.5,
    '(7) hour-0 manifest: midnight KS double present (A2, dur 3.0, brightness 0.2, vel 0.5)');
  ok(compareToMirror(e0, mirrorHour(m0).events) === null, '(7) hour-0 manifest matches the mirror too');
}

/* ── 8 · silence accounting (B7 made testable) ── */
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
  const sf = { 'F-DNW': silentFrac(OUT['F-DNW']), 'F-EVE': silentFrac(OUT['F-EVE']), 'F-DAY': silentFrac(OUT['F-DAY']) };
  ok(sf['F-DNW'] >= 0.55, '(8) melodic-silent fraction ≥ 0.55 on F-DNW', 'got ' + sf['F-DNW'].toFixed(3));
  ok(sf['F-DNW'] > sf['F-EVE'] && sf['F-EVE'] > sf['F-DAY'],
    '(8) strictly ordered: deep night > evening > day',
    FIX_IDS && 'DNW=' + sf['F-DNW'].toFixed(3) + ' EVE=' + sf['F-EVE'].toFixed(3) + ' DAY=' + sf['F-DAY'].toFixed(3));
}

/* ── 9 · density bands — the expectation table, emitted from the constants ── */
{
  function eMinCap(range, dens, cap) {
    const lo = range[0] / dens, hi = range[1] / dens;
    if (hi <= cap) return (lo + hi) / 2;
    if (lo >= cap) return cap;
    const f = (cap - lo) / (hi - lo);
    return f * (lo + cap) / 2 + (1 - f) * cap;
  }
  function perSec(reg, p, fig, annTier) {
    const dens = seasonDens(p), bpm = pulseBPM(p);
    const night = reg === 'deep-night' || reg === 'evening';
    const w0 = MENU[reg];
    const lean = w0[fig] > 0 ? 1.6 : 1;
    const w = { P1: w0.P1 * (fig === 'P1' ? lean : 1), P2: w0.P2 * (fig === 'P2' ? lean : 1), P3: w0.P3 * (fig === 'P3' ? lean : 1), P4: w0.P4 * (fig === 'P4' ? lean : 1) };
    const tot = w.P1 + w.P2 + w.P3 + w.P4;
    const q = { P1: w.P1 / tot, P2: w.P2 / tot, P3: w.P3 / tot, P4: w.P4 / tot };
    const rep = annTier >= 1 ? (annTier === 1 ? 0.50 : annTier === 2 ? 0.33 : 0.20) : 0;
    const evPer = q.P1 * 3 + q.P2 * ((1 - rep) * 4 + rep * 6) + q.P3 * 4 + q.P4 * 3;
    const beat = 60 / bpm, step = 30 / bpm;
    const span = q.P1 * (2 * beat + (night ? 2.2 : celLen(1.4)))
      + q.P2 * ((1 - rep) * (1.26 + celLen(2.2)) + rep * (2.18 + celLen(1.55)))
      + q.P3 * (3 * step + 0.9) + q.P4 * 13.4;
    const rest = eMinCap(REST[reg], dens, 240);
    const on = (PAD_ON[reg][0] + PAD_ON[reg][1]) / 2;
    const off = eMinCap(PAD_OFF[reg], dens, 300);
    return evPer / (rest + span) + (on / 4 + 0.5) / (on + off);
  }
  let bandOk = true;
  console.log('  · (9) density table (expected vs actual events/hour):');
  for (const id of FIX_IDS) {
    const F = FIX[id], fig = figureOf(F.dateInt);
    let exp = 1 + (F.hour === 0 ? 1 : 0) + (F.annTier === 1 ? 1 : 0) + (F.solarNoonMin !== null ? 4 : 0);
    for (let m = 0; m < 60; m++) exp += perSec(regAt(F.altCurve, m * 60 + 30), F.seasonPhase, fig, F.annTier) * 60;
    const act = OUT[id].length;
    const within = Math.abs(act - exp) <= 0.40 * exp;
    if (!within) bandOk = false;
    console.log('      ' + id.padEnd(9) + ' fig=' + fig + '  expected ≈ ' + exp.toFixed(0).padStart(4) + '   actual ' + String(act).padStart(4) + (within ? '' : '   ✗ OUT OF BAND'));
  }
  ok(bandOk, '(9) events/hour within ±40 % of the emitted register×season expectation, all 8');
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
      OUT[id].some(e => e.layer === 'notes' && Math.abs(e.t - (ph.tOn + SIG_ONS[i])) <= 1e-9
        && e.params.freq === semiToFreq(9 + off)
        && e.params.dec === SIG_DECS[i] && e.params.vel === SIG_VELS[i]));
    ok(exact, '(10) ' + id + ': Signature notes exact (degrees + the 0.42 s clock + decs + vels)');
    const dbl = OUT[id].filter(e => e.layer === 'toll' && e.t === 0.92);
    const wantSemi = tollSemiOf(regAt(FIX[id].altCurve, 0)) + 12;
    ok(dbl.length === 1 && dbl[0].params.freq === semiToFreq(wantSemi),
      '(10) ' + id + ': tier-1 doubled toll at t=0.92, one octave up (semi ' + wantSemi + ')');
  }
  /* annTier 0 → the Signature's pattern appears NOWHERE (event-level scan) */
  let cleanOk = true, first = '';
  const dOns = SIG_ONS.slice(1).map((t, i) => t - SIG_ONS[i]);
  for (const id of FIX_IDS.filter(x => FIX[x].annTier === 0)) {
    if (MIR[id].phrases.some(p => p.type === 'P5')) { cleanOk = false; if (!first) first = id + ' (mirror P5)'; }
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

/* ── 11 · concurrency ≤ 10 ── */
{
  let maxAll = 0, worst = '';
  for (const id of FIX_IDS) {
    const pts = [];
    for (const e of OUT[id]) { pts.push([e.t, 1]); pts.push([e.t + evLen(e), -1]); }
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // ends before starts at ties
    let cur = 0, mx = 0;
    for (const [, d] of pts) { cur += d; if (cur > mx) mx = cur; }
    if (mx > maxAll) { maxAll = mx; worst = id; }
  }
  ok(maxAll <= 10, '(11) max simultaneous sounding events ≤ 10 (worst ' + maxAll + ' in ' + worst + ')');
}

/* ── 12 · size budget — existence-scoped, self-tightening (§8.1-12) ── */
{
  const sz = f => fs.statSync(path.join(__dirname, f)).size;
  const pair = sz('score.mjs') + sz('score-voices.mjs');
  const airPath = path.join(__dirname, 'air.js');
  if (fs.existsSync(airPath)) {
    const trio = pair + fs.statSync(airPath).size;
    ok(trio <= 45056, '(12) trio score.mjs+score-voices.mjs+air.js = ' + trio + ' B ≤ 45,056 B');
  } else {
    ok(pair <= 29696, '(12) pair score.mjs+score-voices.mjs = ' + pair + ' B ≤ 29,696 B');
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
  /* needles assembled so THIS file never carries its own tokens */
  const ANCHOR_LIT = '261.' + '625565';
  const ASSET_RE = new RegExp('forge:' + 'asset|data:' + 'audio|;base' + '64,[A-Za-z0-9+/]{64}');
  const calFiles = fs.readdirSync(__dirname).filter(f => fs.statSync(path.join(__dirname, f)).isFile());
  const fixFiles = fs.readdirSync(path.join(__dirname, 'fixtures')).map(f => path.join('fixtures', f));
  const all = calFiles.concat(fixFiles);
  let anchor = true, assets = true, files = true, firstA = '';
  for (const f of all) {
    const txt = fs.readFileSync(path.join(__dirname, f), 'utf8');
    if (txt.includes(ANCHOR_LIT)) { anchor = false; firstA = firstA || f; }
    if (ASSET_RE.test(txt)) { assets = false; firstA = firstA || f; }
    if (/\.(wav|mp3|ogg|m4a|flac)$/i.test(f)) { files = false; firstA = firstA || f; }
  }
  ok(anchor, '(13) the pitch-anchor literal appears in NO tools/calendar file', firstA);
  ok(fs.readFileSync(path.join(REPO, 'sound-garden', 'pitch-core.mjs'), 'utf8').includes(ANCHOR_LIT),
    '(13) …and DOES live in sound-garden/pitch-core.mjs (the one home)');
  const scoreCode = stripComments(fs.readFileSync(path.join(__dirname, 'score.mjs'), 'utf8'));
  ok(!/Math\.random|Date\.now|sampleRate/.test(scoreCode),
    '(13) no Math.random / Date.now / sampleRate in score.mjs executable code');
  ok(assets && files, '(13) no audio assets: no asset directives / embedded audio / audio files under tools/calendar/', firstA);
  /* .wav/.mp3 refs must not reach the PAGE-SHIPPED modules (score-render.mjs's
     §5.2 `<out.wav>` CLI is design-mandated + Node-only, hence scoped out) */
  let refOk = true, firstR = '';
  for (const f of ['calendar.js', 'score.mjs', 'score-voices.mjs'].concat(fs.existsSync(path.join(__dirname, 'air.js')) ? ['air.js'] : [])) {
    if (/\.wav|\.mp3/i.test(fs.readFileSync(path.join(__dirname, f), 'utf8'))) { refOk = false; firstR = firstR || f; }
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
  const ANN_SNAP = "the Founding — the estate broke ground this day, a year ago — the Signature opens the hour: the six notes the front gate sings.";
  let dOk = true, first = '';
  for (const id of FIX_IDS) {
    const F = FIX[id];
    const d = Score.describe(F);
    const want = {
      registerLine: REG_L[regAt(F.altCurve, 0)],
      seasonLine: seasonL(wMaj(F.seasonPhase)),
      figureLine: FIG_L[figureOf(F.dateInt)],
      annLine: F.annTier >= 1 ? ANN_SNAP : null
    };
    for (const k of ['registerLine', 'seasonLine', 'figureLine', 'annLine'])
      if (d[k] !== want[k]) { dOk = false; if (!first) first = id + ' ' + k; }
  }
  ok(dOk, '(14) describe(): exact §9 strings per fixture, incl. F-ANN\'s locked §8.1-14 annLine', first);
}

/* ── 15 · the day's figure ── */
{
  /* (a) 3 dates × 3 hours — identical across hours, derived from dateInt only
     (the announcement is the observable; all three dates are waypoint days,
     annTier 0 — waypoints never tier) */
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
  /* (b) the forced opener, per fixture (after the Signature on remembered days) */
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
  /* (c) ≥ 3 distinct figures over 20 consecutive dates + module agreement */
  const figs = new Set();
  let xOk = true, firstX = '';
  for (let d = 1; d <= 20; d++) {
    const di = 20260700 + d;
    figs.add(figureOf(di));
    const m = C.momentManifest(2026, 7, d, 12, Hours);
    if (m.annTier !== 0) continue; // only annTier-0 dates announce the figure
    const mir = mirrorArm(m);
    const dd = compareToMirror(Score.armResponse(m), mir.events);
    if (dd || mir.type !== figureOf(di)) { xOk = false; if (!firstX) firstX = '2026-07-' + d + (dd ? ': ' + dd : ''); }
  }
  ok(figs.size >= 3, '(15) ≥ 3 distinct figure values across 20 consecutive dates (got ' + figs.size + ')');
  ok(xOk, '(15) module announcement agrees with the mapping on every annTier-0 July date', firstX);
  /* (d) figureOff: distribution returns to the §3.3 table (lean off + opener off) */
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
      for (const p of mir.phrases) if (p.reg === reg) { counts[p.type]++; n++; }
    }
    for (const t of ['P1', 'P2', 'P3', 'P4'])
      if (Math.abs(counts[t] / n - MENU[reg][t]) > 0.10) { distOk = false; if (!firstD) firstD = id + ' ' + t + '=' + (counts[t] / n).toFixed(3) + ' want ' + MENU[reg][t]; }
  }
  ok(corrOk, '(15) figureOff: module === mirror (hook parity)', firstD);
  ok(distOk, '(15) figureOff: menu-weight distribution returns to the §3.3 table (±0.10)', firstD);
  /* the hook must NOT touch the §3.6 anniversary Signature opener */
  const mirAnnOff = mirrorHour(FIX['F-ANN'], { figureOff: true });
  ok(mirAnnOff.phrases[0] && mirAnnOff.phrases[0].type === 'P5' && mirAnnOff.phrases[0].forced
    && compareToMirror(Score.composeHour(FIX['F-ANN'], { figureOff: true }).events, mirAnnOff.events) === null,
    '(15) figureOff leaves the §3.6 anniversary Signature opener intact');
}

/* ── 16 · scoreSelfTest passthrough (§8.1a) ── */
{
  const st = Score.scoreSelfTest();
  ok(st.pass === true, '(16) scoreSelfTest().pass === true');
  /* the §8.1a battery: 2 pitch anchors + determinism + legal semis + toll + 2 describe locks = 7 */
  ok(st.n === 7, '(16) scoreSelfTest().n === 7 (the §8.1a battery\'s assert count)', 'got ' + st.n);
}

/* ── 17 · the announcement (§3.8-1) ── */
{
  let det = true, legal = true, seqOk = true, mirOk = true, first = '';
  for (const id of FIX_IDS) {
    const F = FIX[id];
    const a1 = Score.armResponse(F), a2 = Score.armResponse(F);
    if (JSON.stringify(a1) !== JSON.stringify(a2)) { det = false; if (!first) first = id; }
    for (const e of a1) for (const f of (e.params.freqs || [e.params.freq]))
      if (!FREQ_TO_SEMI.has(f)) { legal = false; if (!first) first = id; }
    for (let i = 0; i < a1.length; i++) if (a1[i].seq !== 0x4000 + i) { seqOk = false; if (!first) first = id; }
    const mir = mirrorArm(F);
    const dd = compareToMirror(a1, mir.events);
    if (dd) { mirOk = false; if (!first) first = id + ': ' + dd; }
    if (F.annTier >= 1) {
      const offs = wMaj(F.seasonPhase) >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12];
      const exact = a1.length === 6 && offs.every((off, i) =>
        Math.abs(a1[i].t - SIG_ONS[i]) <= 1e-9 && a1[i].params.freq === semiToFreq(9 + off)
        && a1[i].params.dec === SIG_DECS[i] && a1[i].params.vel === SIG_VELS[i]);
      ok(exact, '(17) ' + id + ': announcement is the EXACT Signature (degrees + the 0.42 s clock)');
    } else {
      ok(mir.type === figureOf(F.dateInt),
        '(17) ' + id + ': announcement type === the date\'s figure (' + figureOf(F.dateInt) + '), realized at ' + mir.reg);
    }
  }
  ok(det, '(17) armResponse twice → deep-equal, all 8 fixtures', first);
  ok(legal, '(17) every announcement frequency in the legal-semi set', first);
  ok(seqOk, '(17) announcement seq dense from 0x4000 (the disjoint realize-stream range)', first);
  ok(mirOk, '(17) announcement === the twin\'s independent §3.8-1 recompute, all 8', first);
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
