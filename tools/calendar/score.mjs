// CALENDAR SCORE CORE — the AIR's composer (WS4 The Living Calendar).
// Binding: SCORE.md §2 validation · §3 musical law · §4 seed law · §8.1a
// self-test · §9 prose (VERBATIM) + Execution revise r6 (r6.1 pad / r6.2
// wind+level / r6.3 seeds+event fields / r6.4 loneVoice); DESIGN §6.3/§6.4
// ({events}, voice enum, exports). PURE (no clock/random/storage/DOM); only
// free id `semiToFreq` (ESM import above the sentinels; in-page from the pitch
// slice). Monochord byte-twin: pages inline the sentinel region char-for-char;
// interior is classic-script-safe (var/function); `export` below END.
// The composer emits EVENT DESCRIPTORS only (voices render at T2.5). Note/toll
// timing+params stay r5-EXACT (fixtures/r5-notes/ is the twin reference). Seed
// streams: phrase 0x9000+k · pad episode 0xA000+j · announcement 0xB000 · wind
// 0xC000 · Breath realize 0xD000+k (0xD7FF for the announcement). LAYERED seq
// (r6.3): note/toll from 0 · pad windows 10000 · wind 20000 · swells 30000 ·
// announcements 0x4000. Per-episode/per-phrase draw order is pinned at site.

import { semiToFreq } from '../../sound-garden/pitch-core.mjs';

// ===== CALENDAR SCORE CORE — BEGIN =====
var TWO_PI = 2 * Math.PI, U32 = 4294967296;

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

// §3.1a THE NOTE TABLE (verbatim). Anchors = SEMITONES FROM MIDDLE C (E3=-8,
// E4=+4). Pool degrees = SEMITONE OFFSETS above the phrase's base A.
var A_SEMI = { A2: -15, A3: -3, A4: 9, A5: 21 };
var POOL_MAJOR = { d1:0, d2:2, d3:4,  d5:7, d6:9,  d8:12 };
var POOL_MINOR = { d1:0, b3:3, d4:5,  d5:7, b7:10, d8:12 };
function noteHz(baseA, off){ return semiToFreq(A_SEMI[baseA] + off); }

var KEY = {
  tonic: 'A',
  pools: { major: ['A', 'B', 'C#', 'E', 'F#'], minor: ['A', 'C', 'D', 'E', 'G'] },
  pitchSet: ['A', 'B', 'C', 'C#', 'D', 'E', 'F#', 'G']
};

function wMaj(p){ return 0.5 + 0.45 * Math.cos(2 * Math.PI * (p - 0.25)); }
function seasonDens(p){ return 0.75 + 0.35 * Math.cos(2 * Math.PI * (p - 0.25)); }
function pulseBPM(p){ return Math.round(48 + 12 * (Math.cos(2 * Math.PI * (p - 0.25)) + 1) / 2); }

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

var AIR_MENU = {
  'deep-night': { P1: 0.60, P2: 0.25, P3: 0,    P4: 0.15 },
  'dawn':       { P1: 0.35, P2: 0.40, P3: 0,    P4: 0.25 },
  'day':        { P1: 0.30, P2: 0.25, P3: 0.25, P4: 0.20 },
  'dusk':       { P1: 0.35, P2: 0.40, P3: 0,    P4: 0.25 },
  'evening':    { P1: 0.50, P2: 0.20, P3: 0,    P4: 0.30 }
};
var AIR_REST = { 'deep-night': [45, 120], 'dawn': [20, 60], 'day': [15, 45], 'dusk': [20, 60], 'evening': [30, 90] };
// r6.1: episode ON/OFF ranges + offEff season stretch UNCHANGED from old §3.4.
var PAD_ON   = { 'deep-night': [30, 60], 'dawn': [45, 80], 'day': [60, 90], 'dusk': [45, 80], 'evening': [40, 70] };
var PAD_OFF  = { 'deep-night': [90, 240], 'dawn': [40, 120], 'day': [20, 60], 'dusk': [40, 120], 'evening': [60, 180] };
// §3.3 P2 direction: rising dawn/day, falling dusk/evening/deep-night.
var P2_RISES = { 'deep-night': false, 'dawn': true, 'day': true, 'dusk': false, 'evening': false };
// §3.3 P5 the Signature — the Gate logotune, verbatim contour+clock:
var SIG_ONS  = [0, 0.42, 0.84, 1.26, 1.76, 2.18];
var SIG_DECS = [0.95, 0.98, 1.02, 1.08, 0.90, 1.55];
var SIG_VELS = [0.34, 0.36, 0.38, 0.42, 0.37, 0.49];
function celLen(dec){ return dec * 1.15 + 0.12; }

var K_V = { padNight: 0.08928, padDay: 0.041, padDawnDusk: 0.06504, padWinterDeep: 0.2670, loneVoice: 0.2032 };
var BREATH_DEPTH = { 'deep-night': 0.45, 'evening': 0.42, 'dawn': 0.42, 'dusk': 0.42, 'day': 0.38 };
var STEP4 = [-2, -1, 1, 2];  // r6.3 loneVoice step map

// r6.1 THE SLOT LAW — cumulative weights per (register,wMaj); row0 = top slot
function slotTable(reg, wm){
  if (reg === 'deep-night') return wm < 0.15
    ? [['padWinterDeep', 0.45], ['padNight', 0.75], ['loneVoice', 1.0]]
    : [['padNight', 0.60], ['padWinterDeep', 0.85], ['loneVoice', 1.0]];
  if (reg === 'evening') return [['padNight', 0.55], ['padWinterDeep', 0.75], ['loneVoice', 1.0]];
  if (reg === 'dawn' || reg === 'dusk') return [['padDawnDusk', 0.70], ['padNight', 1.0]];
  return [['padDay', 0.70], ['padDawnDusk', 1.0]];  // day
}
function slotPick(reg, wm, u){
  var t = slotTable(reg, wm);
  for (var i = 0; i < t.length; i++) if (u < t[i][1]) return t[i][0];
  return t[t.length - 1][0];
}
function slotTop(reg, wm){ return slotTable(reg, wm)[0][0]; }

// r6.3 recipe draws (8+) in draw order; caller prepends third as phases[0].
function drawRecipe(voice, r){
  var det = [], ph = [], seeds = [], i, ti, v;
  if (voice === 'padNight'){
    for (i = 0; i < 5; i++) det.push(1 + (r() - 0.5) * 0.0012);
    for (i = 0; i < 5; i++) ph.push(r() * TWO_PI);
  } else if (voice === 'padDay'){
    for (ti = 0; ti < 3; ti++) for (v = 0; v < 3; v++){ det.push(1 + (v - 1) * 0.0028 + (r() - 0.5) * 0.0008); ph.push(r() * TWO_PI); }
    seeds.push(Math.floor(r() * U32));
  } else if (voice === 'padDawnDusk'){
    for (ti = 0; ti < 2; ti++){ ph.push(r() * TWO_PI, r() * TWO_PI, r() * TWO_PI); seeds.push(Math.floor(r() * U32)); }
  } else {  // padWinterDeep r10: 3 saws/tone
    for (ti = 0; ti < 3; ti++) for (v = 0; v < 3; v++){ det.push(1 + (v - 1) * 0.0052 + (r() - 0.5) * 0.0008); ph.push(r() * TWO_PI); }
  }
  return { detunes: det, phases: ph, seeds: seeds };
}

// r6.1 episode-signal law: 8-s WINDOWS of one continuous signal (last
// truncated at epEnd); realize/breath/third event-carried.
function emitPadWindows(out, voice, epStart, epLen, breathF, breathU0, depth, third, realize, gain){
  var epEnd = epStart + epLen, ti = 0;
  for (var wf = epStart; wf < epEnd - 1e-6; wf += 8){
    out.push({ t: wf, voice: voice, layer: 'pad', gain: gain, pan: 0,
      params: { epStart: epStart, epEnd: epEnd, tileIndex: ti, winFrom: wf, winDur: Math.min(8, epEnd - wf),
        breathF: breathF, breathU0: breathU0, depth: depth, third: third, realize: realize } });
    ti++;
  }
}

// r6.4 THE LONEVOICE WALK — committed-pool ladder [max(anchor-12,A2),anchor+16];
// ladder-index steps, reflect on clamp; one event per swell.
function poolClasses(maj){
  var offs = maj ? [0, 2, 4, 7, 9] : [0, 3, 5, 7, 10], set = {}, i;
  for (i = 0; i < offs.length; i++) set[((9 + offs[i]) % 12 + 12) % 12] = 1;  // base A class = 9
  return set;
}
function buildLadder(anchorS, maj){
  var lo = Math.max(anchorS - 12, -15), hi = anchorS + 16, cls = poolClasses(maj), lad = [], s;
  for (s = lo; s <= hi; s++) if (cls[((s % 12) + 12) % 12]) lad.push(s);
  return lad;
}
function emitLoneVoice(out, reg, wm, modeU, count, steps, durs, gaps, epStart, epEnd){
  var anchorS = reg === 'evening' ? -3 : -8;      // A3 / E3
  var maj = modeU < wm;                            // §3.1 mode commit
  var lad = buildLadder(anchorS, maj), li = lad.indexOf(anchorS), notes = [lad[li]], k, step, ni;
  for (k = 1; k < count; k++){
    step = STEP4[Math.floor(steps[k] * 4)];
    ni = li + step;
    if (ni < 0 || ni > lad.length - 1 || ni === li){ step = -step; ni = li + step; }
    li = ni; notes.push(lad[li]);
  }
  var onset = epStart, plan = [];                  // lay out swells; stop at first non-fit
  for (k = 0; k < count; k++){
    if (onset + durs[k] > epEnd) break;
    plan.push({ onset: onset, note: notes[k], dur: durs[k] });
    onset = onset + durs[k] + gaps[k];
  }
  for (k = 0; k < plan.length; k++){
    var prevConn = k > 0 && gaps[k - 1] <= 1.5, nextConn = k < plan.length - 1 && gaps[k] <= 1.5;
    out.push({ t: plan[k].onset, voice: 'loneVoice', layer: 'pad', gain: K_V.loneVoice, pan: 0,
      params: { note: plan[k].note, swellDur: plan[k].dur,
        prevNote: prevConn ? plan[k - 1].note : null, gapS: prevConn ? gaps[k - 1] : null,
        nextGapS: nextConn ? gaps[k] : null } });
  }
}

// one phrase per its §3.3 row (hour + announcement). r = the row's intra-
// phrase draws; breath = {seed,k} = the Breath's realize stream 0xD000+k.
// Returns the phrase end time.
function airPhrase(out, type, reg, maj, t0, r, ksg, alt, bpm, wm, breath){
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
  if (type === 'P4'){ // the Breath (r6.1) — ONE 13.4-s swell of the register's TOP slot voice
    var tv = slotTop(reg, wm);
    var rz = drawRecipe(tv, mulberry32(hash2(breath.seed, 0xD000 + breath.k)));  // dedicated stream, NO third
    emitPadWindows(out, tv, t0, 13.4, 1 / 13.4, 0, 1.0, 'none', rz, K_V[tv]);
    return t0 + 8 + 5.4;
  }
  // P5 the Signature — the seasonal third (never the phrase mode), base A4
  offs = wm >= 0.5 ? [0, 4, 7, 12, 7, 12] : [0, 3, 7, 12, 7, 12];
  for (i = 0; i < 6; i++) out.push({ t: t0 + SIG_ONS[i], voice: 'celesta', params: { freq: noteHz('A4', offs[i]), dec: SIG_DECS[i], vel: SIG_VELS[i] }, gain: 1, pan: 0, layer: 'notes' });
  return t0 + SIG_ONS[5] + celLen(SIG_DECS[5]);
}

// r6.3 LAYERED seq: note/toll from 0; pad windows 10000; wind 20000; swells
// 30000 (swell & window both layer 'pad'; swell has `note`, window `epStart`).
function seqAssign(list){
  list.sort(function(a, b){ return a.t - b.t; });
  var n = 0, p = 0, w = 0, s = 0, i, e;
  for (i = 0; i < list.length; i++){
    e = list[i];
    if (e.layer === 'wind') e.seq = 20000 + w++;
    else if (e.layer === 'pad' && e.params.note !== undefined) e.seq = 30000 + s++;
    else if (e.layer === 'pad') e.seq = 10000 + p++;
    else e.seq = n++;
  }
  return list;
}
// announcements dense from 0x4000 (§3.8-1)
function armSeq(list){
  list.sort(function(a, b){ return a.t - b.t; });
  for (var i = 0; i < list.length; i++) list[i].seq = 0x4000 + i;
  return list;
}

// DESIGN §6.3 — the composer entry: ONE civil hour. opts.figureOff is the
// §8.1-15 test hook ONLY (figure lean ×1.0 + opener off; §3.6 opener unaffected).
function composeHour(moment, opts){
  validateMoment(moment);
  var hourSeed = moment.seed;                    // §4 — never re-hashed
  var curve = moment.altCurve;
  var p = moment.seasonPhase;
  var wm = wMaj(p), dens = seasonDens(p), bpm = pulseBPM(p);
  var figOff = !!(opts && opts.figureOff);
  var fig = figureOf(moment.dateInt);
  var deepSummer = (wm - 0.5) > 0.35;            // r6.1 bright-half third gate
  var ev = [];
  var i;

  // §3.5 the tolls (layer 'toll'; register at hour top)
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

  // r6.2 the WIND FLOOR — 30-s windows @0..3570 (buffer 30.25 s = a 0.25-s power
  // seam; last truncated to end <= 3599.5). Preset/tier/register held from hour
  // top. gain=k_tier is a T2.5 TIER_DERIVE; the composer carries `tier`.
  var hwsInt = Math.floor(mulberry32(hash2(hourSeed, 0xC000))() * U32);
  var wpreset = wm < 0.30 ? 'winterThin' : (regTop === 'day' || regTop === 'dawn' || regTop === 'dusk') ? 'plain' : 'distantAir';
  var wtier = regTop === 'day' ? 'day' : (regTop === 'dawn' || regTop === 'dusk') ? 'dawn-dusk' : regTop === 'evening' ? 'evening' : 'deep-night';
  for (var wo = 0; wo < 3600; wo += 30) ev.push({ t: wo, voice: 'windBed', layer: 'wind', gain: null, pan: 0,
    params: { preset: wpreset, tier: wtier, hourWindSeedInt: hwsInt, winFrom: wo, winDur: Math.min(30.25, 3599.5 - wo) } });

  // r6.1 the PAD LAYER — episodes alternate ON/OFF from t=0; one continuous
  // signal (8-s windows, or one event per loneVoice swell).
  var pt = 0, pj = 0;
  while (pt <= 3591){
    var pr = mulberry32(hash2(hourSeed, 0xA000 + pj));
    var preg = airRegAt(curve, pt);
    var onR = PAD_ON[preg], offR = PAD_OFF[preg];
    var onDur = onR[0] + (onR[1] - onR[0]) * pr();       // 1
    var offBase = offR[0] + (offR[1] - offR[0]) * pr();  // 2
    var voice = slotPick(preg, wm, pr());                // 3
    var thirdElig = pr();                                // 4 (always consumed)
    var thirdPh = pr() * TWO_PI;                         // 5 (always consumed)
    var breathF = 1 / (10 + 4 * pr()), breathU0 = pr();  // 6, 7 breath
    var epStart = pt, epEnd = Math.min(3599.5, pt + onDur), epLen = epEnd - epStart;
    var live = epLen >= 12;  // clamp < 12 s -> SKIP; draws still consumed
    var third = (deepSummer && voice === 'padNight' && thirdElig < 0.5) ? 'C#5' : 'none';
    if (voice === 'loneVoice'){
      var modeU = pr(), count = 3 + Math.floor(pr() * 5);  // 8, 9
      var steps = [], durs = [], gaps = [], si;
      for (si = 0; si < count; si++){ steps.push(pr()); durs.push(4 + 3 * pr()); gaps.push(1 + 2 * pr()); }
      if (live) emitLoneVoice(ev, preg, wm, modeU, count, steps, durs, gaps, epStart, epEnd);
    } else {
      var rz = drawRecipe(voice, pr);                     // 8+
      if (live){ rz.phases.unshift(thirdPh);              // phases[0] = third-layer phase
        emitPadWindows(ev, voice, epStart, epLen, breathF, breathU0, BREATH_DEPTH[preg], third, rz, K_V[voice]); }
    }
    pt = pt + onDur + Math.min(300, offBase / dens);
    pj++;
  }

  // §3.3 the phrase-and-rest engine — onsets [2,3540]
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
    mt = airPhrase(ev, type, reg, maj, tOn, mr, ksg, alt, bpm, wm, { seed: hourSeed, k: mk });
    mk++;
  }

  return { events: seqAssign(ev) };
}

// §3.8-1 the ARM ANNOUNCEMENT — the day named at the click
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
  var ev = [];
  // the Breath-day announcement realizes from hash2(hourSeed, 0xD7FF) (k=0x7FF)
  airPhrase(ev, type, reg, maj, 0, r, ksg, alt, bpm, wm, { seed: moment.seed, k: 0x7FF });
  return armSeq(ev);                     // dense from 0x4000, disjoint from any hour
}

function figureOf(dateInt){
  var u = mulberry32(hash2(0xDA11EA5E, dateInt))();
  return u < 0.30 ? 'P1' : u < 0.60 ? 'P2' : u < 0.80 ? 'P3' : 'P4';
}

function registerOf(moment){
  validateMoment(moment);
  return airRegAt(moment.altCurve, 0);
}

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

// §8.1a the browser backend proof (VERBATIM moment; §10 locks)
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
    // 1 pitch-law anchors (literal Hz)
    ok(Math.abs(semiToFreq(9) - 440) <= 1e-6);
    ok(Math.abs(semiToFreq(-15) - 110) <= 1e-6);
    // 2 determinism
    var a = composeHour(SELFTEST_MOMENT), b2 = composeHour(SELFTEST_MOMENT);
    ok(JSON.stringify(a) === JSON.stringify(b2));
    // 3 every note/toll freq is a §3.1a-legal semi (pad/wind: no freq -> skip)
    var legal = airLegalSemis(), good = true;
    for (var i = 0; i < a.events.length; i++){
      var pms = a.events[i].params;
      var fs = pms.freqs ? pms.freqs : (pms.freq !== undefined ? [pms.freq] : null);
      if (fs === null) continue;
      for (var j = 0; j < fs.length; j++){
        var hit = false;
        for (var q = 0; q < legal.length; q++) if (semiToFreq(legal[q]) === fs[j]){ hit = true; break; }
        if (!hit) good = false;
      }
    }
    ok(good);
    // 4 the toll: t=0.5, layer 'toll', A5 (day register here)
    var toll = false;
    for (var ti = 0; ti < a.events.length; ti++){
      var e = a.events[ti];
      if (e.t === 0.5 && e.layer === 'toll' && e.params.freq === semiToFreq(21)) toll = true;
    }
    ok(toll);
    // 5 describe lock (the §9 day + high-summer strings)
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
