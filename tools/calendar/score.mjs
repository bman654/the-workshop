// ============================================================================
//  CALENDAR SCORE CORE — the AIR's composer (WS4 The Living Calendar).
//  Binding: SCORE.md §2 validation · §3 musical law · §4 seed law · §8.1a
//  self-test · §9 prose (VERBATIM); DESIGN.md §6.3/§6.4 (entry shape, voice
//  enum, exports). PURE: no clock, no unseeded randomness, no storage, no
//  DOM. Only free identifier: `semiToFreq` — ESM import above the sentinels
//  for Node; in-page it resolves from the inlined PITCH CORE slice.
//  Byte-twin discipline (monochord): the pages inline the sentinel region
//  char-for-char; the interior is classic-script-safe (var/function only);
//  `export` lives below the END marker.
//
//  Pinned draw order (§4 impl r3-m1/r4-m1; the Node twin mirrors exactly):
//   · phrase k (0x9000+k): menu draw (consumed+DISCARDED when FORCED per
//     §3.6/§3.8) · [Signature-replacement draw — only when the DRAWN type
//     is P2 and annTier>=1] · mode commit (every phrase) · KS event gain
//     (KS-voiced only) · rest · degrees (P1 only: pattern 50/50, base
//     50/50, one vel draw per note).
//   · register/altitude basis = the cursor BEFORE the rest draw (the §4
//     order puts rest after the voice-dependent KS-gain slot).
//   · pad episode j (0xA000+j): ON dur · OFF base · [day sonority 70/30] ·
//     [deep-season third 0.5, only when |wMaj-0.5|>0.35] · tile gain
//     (0.08..0.12).
//   · announcement (0xB000, §3.8-1): mode commit · KS event gain (KS-voiced
//     only) · the row's own intra-phrase draws.
// ============================================================================

import { semiToFreq } from '../../sound-garden/pitch-core.mjs';

// ===== CALENDAR SCORE CORE — BEGIN =====
// ---- seeded prng — verbatim from the estate standard (trailer prng.mjs) ----
function mulberry32(seed){
  let s = (seed >>> 0) || 1;
  return function(){
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(a, b){
  let h = (a | 0) ^ 0x9E3779B9;
  h = Math.imul(h ^ (b | 0), 0x85EBCA6B);
  h ^= h >>> 13;
  h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}

// ---- §2 manifest validation — both backends throw before composing
function validateMoment(m){
  if (!m || typeof m !== 'object') throw new Error('score: no manifest');
  if (!Array.isArray(m.altCurve) || m.altCurve.length !== 5) throw new Error('score: bad altCurve');
  for (var vi = 0; vi < 5; vi++) if (!Number.isFinite(m.altCurve[vi])) throw new Error('score: bad altCurve');
  if (!Number.isInteger(m.hour) || m.hour < 0 || m.hour > 23) throw new Error('score: bad hour');
  if (typeof m.seasonPhase !== 'number' || !(m.seasonPhase >= 0 && m.seasonPhase < 1)) throw new Error('score: bad seasonPhase');
  if (!Number.isInteger(m.annTier) || m.annTier < 0 || m.annTier > 3) throw new Error('score: bad annTier');
  if (!Number.isInteger(m.dateInt)) throw new Error('score: bad dateInt');
  if (!(m.solarNoonMin === null || (Number.isInteger(m.solarNoonMin) && m.solarNoonMin >= 0 && m.solarNoonMin <= 59))) throw new Error('score: bad solarNoonMin');
}

// ---- §3.1a THE NOTE TABLE (exact — verbatim from SCORE.md)
// (1) absolute anchors — SEMITONES FROM MIDDLE C (pitch-core's semiToFreq basis):
var A_SEMI = { A2: -15, A3: -3, A4: 9, A5: 21 };            // every base A the air uses
// pad-only absolute notes (for reference; derived from the same anchors):
//   E3 = A2+7 = -8 · E4 = A3+7 = +4 · C4 = A3+3 = 0 · C#4 = A3+4 = +1

// (2) pool degrees — SEMITONE OFFSETS ABOVE THE PHRASE'S BASE A:
var POOL_MAJOR = { d1:0, d2:2, d3:4,  d5:7, d6:9,  d8:12 }; // A B C# E F# A'
var POOL_MINOR = { d1:0, b3:3, d4:5,  d5:7, b7:10, d8:12 }; // A C D E G A'
// P1's neighbor pairs read off the same tables: major A–B–A = 0-2-0, E–F#–E = 7-9-7;
// minor A–G–A = 0-10-0 (G below the octave), E–D–E = 7-5-7.

// (3) frequency law — the ONLY route to Hz:
function noteHz(baseA, off){ return semiToFreq(A_SEMI[baseA] + off); }

// ---- §3.1 tonal law / DESIGN §6.4 KEY
var KEY = {
  tonic: 'A',
  pools: { major: ['A', 'B', 'C#', 'E', 'F#'], minor: ['A', 'C', 'D', 'E', 'G'] },
  pitchSet: ['A', 'B', 'C', 'C#', 'D', 'E', 'F#', 'G']
};

// ---- §3.1 season laws
function wMaj(p){ return 0.5 + 0.45 * Math.cos(2 * Math.PI * (p - 0.25)); }
function seasonDens(p){ return 0.75 + 0.35 * Math.cos(2 * Math.PI * (p - 0.25)); }
function pulseBPM(p){ return Math.round(48 + 12 * (Math.cos(2 * Math.PI * (p - 0.25)) + 1) / 2); }

// ---- §3.2 hour registers — altitude + slope
function airAltAt(curve, t){
  var m = Math.max(0, Math.min(60, t / 60));
  var i = Math.min(3, Math.floor(m / 15));
  return curve[i] + (curve[i + 1] - curve[i]) * ((m - i * 15) / 15);
}
function airRegAt(curve, t){
  var alt = airAltAt(curve, t);
  var slope = airAltAt(curve, Math.min(t + 60, 3600)) - alt;
  if (alt < -12) return 'deep-night';
  if (alt >= 10) return 'day';
  if (slope > 0) return 'dawn';
  if (alt >= -6) return 'dusk';
  return 'evening';
}
function velScale(alt){ return 0.70 + 0.30 * Math.max(0, Math.min(1, (alt + 18) / 60)); }

// ---- §3.3 menu weights · rests · §3.4 episodes · sonorities
var AIR_MENU = {
  'deep-night': { P1: 0.60, P2: 0.25, P3: 0,    P4: 0.15 },
  'dawn':       { P1: 0.35, P2: 0.40, P3: 0,    P4: 0.25 },
  'day':        { P1: 0.30, P2: 0.25, P3: 0.25, P4: 0.20 },
  'dusk':       { P1: 0.35, P2: 0.40, P3: 0,    P4: 0.25 },
  'evening':    { P1: 0.50, P2: 0.20, P3: 0,    P4: 0.30 }
};
var AIR_REST = { 'deep-night': [45, 120], 'dawn': [20, 60], 'day': [15, 45], 'dusk': [20, 60], 'evening': [30, 90] };
var PAD_ON   = { 'deep-night': [30, 60], 'dawn': [45, 80], 'day': [60, 90], 'dusk': [45, 80], 'evening': [40, 70] };
var PAD_OFF  = { 'deep-night': [90, 240], 'dawn': [40, 120], 'day': [20, 60], 'dusk': [40, 120], 'evening': [60, 180] };
// §3.4 sonorities as semis (first-listed = the plain form; day draws 70/30):
var PAD_SON = {
  'deep-night': [[-15, -8]],
  'evening':    [[-15, -8]],
  'dawn':       [[-15, -8, -3]],
  'dusk':       [[-15, -8, -3]],
  'day':        [[-15, -8, -3], [-3, 4]]
};
// §3.3 P2 direction per register (menu arrows): rising at dawn/day, falling
// at dusk/evening/deep night.
var P2_RISES = { 'deep-night': false, 'dawn': true, 'day': true, 'dusk': false, 'evening': false };
// §3.3 P5 the Signature — the Gate logotune phrase verbatim in contour+clock:
var SIG_ONS  = [0, 0.42, 0.84, 1.26, 1.76, 2.18];
var SIG_DECS = [0.95, 0.98, 1.02, 1.08, 0.90, 1.55];
var SIG_VELS = [0.34, 0.36, 0.38, 0.42, 0.37, 0.49];

function celLen(dec){ return dec * 1.15 + 0.12; }  // the ported celesta buffer law

// ---- §3.8 the day's figure — pinned cumulative mapping
function figureOf(dateInt){
  var u = mulberry32(hash2(0xDA11EA5E, dateInt))();
  return u < 0.30 ? 'P1' : u < 0.60 ? 'P2' : u < 0.80 ? 'P3' : 'P4';
}

// ---- one phrase, realized per its §3.3 row (shared by hour + announcement).
// r supplies the row's own intra-phrase draws only (degrees bucket).
// Returns the phrase's end time (last onset + audible length).
function airPhrase(out, type, reg, maj, t0, r, ksg, alt, bpm, wm, padSon){
  var night = reg === 'deep-night' || reg === 'evening';
  var i, offs, vel;
  if (type === 'P1'){ // the Murmur — pattern 50/50, base 50/50, vel per note
    var rootPair = r() < 0.5;
    var lowBase = r() < 0.5;
    var base = night ? (lowBase ? 'A2' : 'A3') : (lowBase ? 'A3' : 'A4');
    offs = maj ? (rootPair ? [0, 2, 0] : [7, 9, 7]) : (rootPair ? [0, 10, 0] : [7, 5, 7]);
    var beat = 60 / bpm;
    var vs = velScale(alt);
    for (i = 0; i < 3; i++){
      vel = (0.30 + 0.15 * r()) * vs;
      if (night) out.push({ t: t0 + i * beat, voice: 'ksPluck', params: { freq: noteHz(base, offs[i]), dur: 2.2, brightness: 0.25, vel: vel }, gain: ksg, pan: 0, layer: 'notes' });
      else out.push({ t: t0 + i * beat, voice: 'celesta', params: { freq: noteHz(base, offs[i]), dec: 1.4, vel: vel }, gain: 1, pan: 0, layer: 'notes' });
    }
    return t0 + 2 * beat + (night ? 2.2 : celLen(1.4));
  }
  if (type === 'P2'){ // the Staircase — celesta, the logotune's 0.42 s clock
    var rise = P2_RISES[reg];
    var base2 = night ? 'A3' : 'A4';
    offs = maj ? [0, 4, 7, 12] : [0, 3, 7, 12];
    if (!rise) offs = offs.slice().reverse();
    for (i = 0; i < 4; i++){
      vel = rise ? 0.40 + 0.15 * i / 3 : 0.55 - 0.15 * i / 3;
      out.push({ t: t0 + i * 0.42, voice: 'celesta', params: { freq: noteHz(base2, offs[i]), dec: 1.5 + 0.7 * i / 3, vel: vel }, gain: 1, pan: 0, layer: 'notes' });
    }
    return t0 + 3 * 0.42 + celLen(2.2);
  }
  if (type === 'P3'){ // the Climb — KS 8ths at pulse, base A3
    offs = maj ? [0, 2, 4, 7] : [0, 3, 5, 7];
    var step = 30 / bpm;
    vel = 0.50 * velScale(alt);
    for (i = 0; i < 4; i++) out.push({ t: t0 + i * step, voice: 'ksPluck', params: { freq: noteHz('A3', offs[i]), dur: 0.9, brightness: 0.55, vel: vel }, gain: ksg, pan: 0, layer: 'notes' });
    return t0 + 3 * step + 0.9;
  }
  if (type === 'P4'){ // the Breath — 3 pad tiles ≈ 13 s, gain 0.10 (§3.3 row)
    for (i = 0; i < 3; i++) out.push({ t: t0 + 4 * i, voice: 'padChord', params: { freqs: padSon.map(function(s){ return semiToFreq(s); }), dur: 4.0, attack: 1.4, release: 1.4, gain: 0.10 }, gain: 1, pan: 0, layer: 'pad' });
    return t0 + 8 + 5.4;
  }
  // P5 the Signature — the seasonal third (never the phrase mode), base A4
  offs = wm >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12];
  for (i = 0; i < 6; i++) out.push({ t: t0 + SIG_ONS[i], voice: 'celesta', params: { freq: noteHz('A4', offs[i]), dec: SIG_DECS[i], vel: SIG_VELS[i] }, gain: 1, pan: 0, layer: 'notes' });
  return t0 + SIG_ONS[5] + celLen(SIG_DECS[5]);
}

// stable sort by onset, then dense seq from seqBase (DESIGN §6.3)
function airFinish(list, seqBase){
  list.sort(function(a, b){ return a.t - b.t; });
  for (var i = 0; i < list.length; i++) list[i].seq = seqBase + i;
  return list;
}

// ---- DESIGN §6.3 — the composer entry: ONE civil hour
// opts.figureOff is the §8.1-15 test hook ONLY: figure lean ×1.0 + opener
// disabled (the §3.6 anniversary Signature opener is NOT affected).
function composeHour(moment, opts){
  validateMoment(moment);
  var hourSeed = moment.seed;                    // §4 — never re-hashed here
  var curve = moment.altCurve;
  var p = moment.seasonPhase;
  var wm = wMaj(p), dens = seasonDens(p), bpm = pulseBPM(p);
  var figOff = !!(opts && opts.figureOff);
  var fig = figureOf(moment.dateInt);
  var deep = Math.abs(wm - 0.5) > 0.35;
  var ev = [];
  var i;

  // §3.5 the tolls (layer 'toll' owns the seam; register at the hour's top)
  var regTop = airRegAt(curve, 0);
  var tollSemi = regTop === 'day' ? 21 : (regTop === 'dawn' || regTop === 'dusk') ? 9 : -3;
  ev.push({ t: 0.5, voice: 'celesta', params: { freq: semiToFreq(tollSemi), dec: 2.0, vel: 0.30 }, gain: 1, pan: 0, layer: 'toll' });
  if (moment.hour === 0) ev.push({ t: 0.5, voice: 'ksPluck', params: { freq: semiToFreq(-15), dur: 3.0, brightness: 0.2, vel: 0.5 }, gain: 1, pan: 0, layer: 'toll' });
  if (moment.annTier === 1) ev.push({ t: 0.92, voice: 'celesta', params: { freq: semiToFreq(tollSemi + 12), dec: 2.0, vel: 0.30 }, gain: 1, pan: 0, layer: 'toll' });
  if (moment.solarNoonMin !== null){ // the noon carillon — the sun's noon
    var tc = moment.solarNoonMin * 60 + 30;
    var co = wm >= 0.5 ? [0, 4, 7, 12] : [0, 3, 7, 12];
    for (i = 0; i < 4; i++) ev.push({ t: tc + i * 0.42, voice: 'celesta', params: { freq: noteHz('A4', co[i]), dec: 1.5 + 0.7 * i / 3, vel: 0.50 }, gain: 1, pan: 0, layer: 'toll' });
  }

  // §3.4 the pad layer — an independent track in the same pass (episodes
  // alternate ON/OFF from t=0; composed first so P4 can read the current
  // sonority)
  var padEps = [];
  var pt = 0, pj = 0;
  while (pt <= 3591){
    var pr = mulberry32(hash2(hourSeed, 0xA000 + pj));
    var preg = airRegAt(curve, pt);
    var onR = PAD_ON[preg], offR = PAD_OFF[preg];
    var onDur = onR[0] + (onR[1] - onR[0]) * pr();
    var offBase = offR[0] + (offR[1] - offR[0]) * pr();
    var son = preg === 'day' ? (pr() < 0.7 ? PAD_SON.day[0] : PAD_SON.day[1]) : PAD_SON[preg][0];
    if (deep && pr() < 0.5) son = son.concat(wm > 0.5 ? 1 : 0); // C#4 / C4
    var pg = 0.08 + 0.04 * pr();
    padEps.push({ t0: pt, son: son });
    for (i = 0; i * 4 < onDur; i++){
      var tt = pt + i * 4;
      if (tt > 3591) break;
      ev.push({ t: tt, voice: 'padChord', params: { freqs: son.map(function(s){ return semiToFreq(s); }), dur: 4.0, attack: 1.4, release: 1.4, gain: pg }, gain: 1, pan: 0, layer: 'pad' });
    }
    pt = pt + onDur + Math.min(300, offBase / dens);
    pj++;
  }

  // §3.3 the phrase-and-rest engine — cursor 0 → 3600, melodic onsets [2,3540]
  var mt = 0, mk = 0;
  var sigPending = moment.annTier >= 1;  // §3.6 forced Signature opener
  var figPending = !figOff;              // §3.8-2 forced figure opener (one attempt)
  while (true){
    var reg = airRegAt(curve, mt);
    var alt = airAltAt(curve, mt);
    var mr = mulberry32(hash2(hourSeed, 0x9000 + mk));
    var uMenu = mr();                    // always consumed (§3.8-2 draw-then-override)
    var type = null;
    if (sigPending){ sigPending = false; type = 'P5'; }
    else if (figPending && !figOff){
      figPending = false;
      if (AIR_MENU[reg][fig] > 0) type = fig; // register lists the figure → forced opener
    }
    if (type === null){
      var w = AIR_MENU[reg];
      var lean = (!figOff && w[fig] > 0) ? 1.6 : 1; // §3.8-3 body lean, renormalized
      var w1 = w.P1 * (fig === 'P1' ? lean : 1), w2 = w.P2 * (fig === 'P2' ? lean : 1);
      var w3 = w.P3 * (fig === 'P3' ? lean : 1), w4 = w.P4 * (fig === 'P4' ? lean : 1);
      var uu = uMenu * (w1 + w2 + w3 + w4);
      type = uu < w1 ? 'P1' : uu < w1 + w2 ? 'P2' : uu < w1 + w2 + w3 ? 'P3' : 'P4';
      if (type === 'P2' && moment.annTier >= 1){ // §3.6 Signature replacement
        var thr = moment.annTier === 1 ? 0.50 : moment.annTier === 2 ? 0.33 : 0.20;
        if (mr() < thr) type = 'P5';
      }
    }
    var maj = mr() < wm;                 // mode commit (every phrase consumes it)
    var night2 = reg === 'deep-night' || reg === 'evening';
    var ksg = 1;
    if ((type === 'P1' && night2) || type === 'P3') ksg = 0.35 + 0.20 * mr(); // §3.7
    var rr = AIR_REST[reg];
    var restEff = Math.min(240, (rr[0] + (rr[1] - rr[0]) * mr()) / dens);
    var tOn = mt + restEff;
    if (tOn > 3540) break;
    var padSon = null;
    if (type === 'P4'){ // “the current pad sonority” — the episode in effect
      padSon = padEps[0].son;
      for (i = 0; i < padEps.length; i++){ if (padEps[i].t0 <= tOn) padSon = padEps[i].son; else break; }
    }
    mt = airPhrase(ev, type, reg, maj, tOn, mr, ksg, alt, bpm, wm, padSon);
    mk++;
  }

  return { events: airFinish(ev, 0) };
}

// ---- §3.8-1 the ARM ANNOUNCEMENT — the day named at the visitor's click ----
function armResponse(moment){
  validateMoment(moment);
  var curve = moment.altCurve, p = moment.seasonPhase;
  var wm = wMaj(p), bpm = pulseBPM(p);
  var reg = airRegAt(curve, 0), alt = airAltAt(curve, 0);
  var r = mulberry32(hash2(moment.seed, 0xB000));
  var type = moment.annTier >= 1 ? 'P5' : figureOf(moment.dateInt);
  var maj = r() < wm;                    // mode commit, always first
  var night = reg === 'deep-night' || reg === 'evening';
  var ksg = 1;
  if ((type === 'P1' && night) || type === 'P3') ksg = 0.35 + 0.20 * r();
  var padSon = PAD_SON[reg][0];          // first-listed, no deep-season third
  var ev = [];
  airPhrase(ev, type, reg, maj, 0, r, ksg, alt, bpm, wm, padSon);
  return airFinish(ev, 0x4000);          // seq disjoint from any hour score
}

// ---- §3.2 register at the hour's top — the fixtures' assert surface
function registerOf(moment){
  validateMoment(moment);
  return airRegAt(moment.altCurve, 0);
}

// ---- §9 visitor-facing prose (estate voice — VERBATIM)
var REG_LINES = {
  'deep-night': "Deep night. The estate is mostly listening; a low string, now and then, to prove the dark is inhabited.",
  'dawn': "First light. The Staircase climbs with the sun.",
  'day': "Full day. The air is open — the loom and the glass take turns, and the rests are short.",
  'dusk': "The light is leaving. The Staircase comes back down.",
  'evening': "Lamplight. Fewer notes, lower voices, longer rests."
};
var FIG_LINES = {
  P1: "today's figure is the Murmur — two notes rocking, the smallest tune the estate owns.",
  P2: "today's figure is the Staircase — four even steps, rising or falling with the light.",
  P3: "today's figure is the Climb — a quick run of four, kept for full day.",
  P4: "today's figure is the Breath — no tune today; the air itself swells and falls."
};
function seasonLineOf(wm){
  if (wm >= 0.8) return "High summer in the air: nearly every phrase takes the bright third. The Gate's own key.";
  if (wm >= 0.6) return "The year leans bright; most phrases take the major third.";
  if (wm >= 0.4) return "The turning of the year: the air cannot decide between its two thirds, and plays both.";
  if (wm >= 0.2) return "The year leans dark; most phrases take the minor third.";
  return "Deep winter in the air: the minor third, and long silences between thoughts.";
}
function describe(moment){
  validateMoment(moment);
  return {
    registerLine: REG_LINES[airRegAt(moment.altCurve, 0)],
    seasonLine: seasonLineOf(wMaj(moment.seasonPhase)),
    figureLine: FIG_LINES[figureOf(moment.dateInt)],
    annLine: moment.annTier >= 1 ? moment.annLabel + " — the Signature opens the hour: the six notes the front gate sings." : null
  };
}

// ---- §8.1a the browser backend's own proof (VERBATIM moment; §10 locks) ----
var SELFTEST_MOMENT = { seed: 305419896, dateInt: 20260621, hour: 14, seasonPhase: 0.25,
  altCurve: [60.9, 58.9, 56.6, 54.0, 51.2], solarNoonMin: null, annTier: 0, annLabel: null };
function airLegalSemis(){
  // the §3.1a legal set: every base A × its pool offsets (both pools)
  var set = [], seen = {};
  var bases = ['A2', 'A3', 'A4', 'A5'], pools = [POOL_MAJOR, POOL_MINOR];
  for (var b = 0; b < bases.length; b++) for (var pi = 0; pi < 2; pi++){
    var P = pools[pi];
    for (var k in P){
      var s = A_SEMI[bases[b]] + P[k];
      if (!seen[s]){ seen[s] = 1; set.push(s); }
    }
  }
  return set;
}
function scoreSelfTest(){
  var n = 0, pass = true;
  function ok(c){ n++; if (!c) pass = false; }
  try {
    // 1 — pitch-law anchors, binding-independent (literal Hz)
    ok(Math.abs(semiToFreq(9) - 440) <= 1e-6);
    ok(Math.abs(semiToFreq(-15) - 110) <= 1e-6);
    // 2 — determinism
    var a = composeHour(SELFTEST_MOMENT), b2 = composeHour(SELFTEST_MOMENT);
    ok(JSON.stringify(a) === JSON.stringify(b2));
    // 3 — every event frequency is semiToFreq of a §3.1a-legal semi
    var legal = airLegalSemis(), good = true;
    for (var i = 0; i < a.events.length; i++){
      var pms = a.events[i].params;
      var fs = pms.freqs ? pms.freqs : [pms.freq];
      for (var j = 0; j < fs.length; j++){
        var hit = false;
        for (var q = 0; q < legal.length; q++) if (semiToFreq(legal[q]) === fs[j]){ hit = true; break; }
        if (!hit) good = false;
      }
    }
    ok(good);
    // 4 — the toll: t = 0.5, layer 'toll', A5 (day register at this moment)
    var toll = false;
    for (var ti = 0; ti < a.events.length; ti++){
      var e = a.events[ti];
      if (e.t === 0.5 && e.layer === 'toll' && e.params.freq === semiToFreq(21)) toll = true;
    }
    ok(toll);
    // 5 — describe lock (independent literals — the §9 day + high-summer strings)
    var d = describe(SELFTEST_MOMENT);
    ok(d.registerLine === "Full day. The air is open — the loom and the glass take turns, and the rests are short.");
    ok(d.seasonLine === "High summer in the air: nearly every phrase takes the bright third. The Gate's own key.");
  } catch (err){ pass = false; }
  return { pass: pass, n: n };
}
// ===== CALENDAR SCORE CORE — END =====

export {
  composeHour, armResponse, describe, KEY, registerOf, scoreSelfTest,
  SELFTEST_MOMENT, A_SEMI, POOL_MAJOR, POOL_MINOR, noteHz
};
