// ============================================================================
//  CALENDAR SCORE VOICES — the AIR's voice bank (WS4 The Living Calendar).
//  Note voices ksPluck/celesta/onePoleK/panGains/mixIn VERBATIM from the trailer
//  palette (05-trailer/design/music-prototype); diegetic voices excluded (§5.1).
//  Pads+wind per SCORE r6 (chord pad DELETED — SP-EAR rejected its low-fifth buzz).
//  RECIPE constants VERBATIM from research/r6-audition-reference.mjs (P1-3,6 pads /
//  P5 loneVoice / W1-3 windBed); seeds §4-r6, levels r6.2, walkers r6.3 knot-
//  lattices. PURE: no clock/random/storage/DOM (free id semiToFreq imported above
//  the sentinels). Voice (sr,params) -> Float32Array mono; pad = whole-episode tone
//  x breath, episode ramps + k_V ride on top at realize. Every pad+wind voice also
//  has an r11.1 STREAM form the live conductor drives incrementally (see the
//  contract below). Monochord: pages inline a byte-twin of the sentinel slice
//  (classic-script inside; export below END).
// ============================================================================

import { semiToFreq } from '../../sound-garden/pitch-core.mjs';

// ===== CALENDAR SCORE VOICES — BEGIN =====
// estate seed law (verbatim) — for the knot-lattice + noise seeding
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

// ---- Karplus-Strong pluck (Loom's ksRender, seeded) ------------------------
function ksPluck(sr, { freq, dur = 2.0, brightness = 0.5, vel = 1 }, rnd){
  const N = Math.max(2, Math.round(sr / freq));
  const len = Math.max(N + 2, Math.floor(sr * dur));
  const out = new Float32Array(len);

  // excitation: seeded noise, low-pass-shaped by brightness (the pick attack)
  const dl = new Float32Array(N);
  let exLp = 0;
  const exDamp = 0.25 + 0.6 * brightness;
  for (let i = 0; i < N; i++){
    const w = rnd() * 2 - 1;
    exLp = exLp + exDamp * (w - exLp);
    dl[i] = exLp;
  }

  const loss = 0.996 - 0.004 * Math.min(1, freq / 620);
  const damp = 0.18 + 0.62 * brightness;
  let idx = 0, lastOut = 0;
  for (let i = 0; i < len; i++){
    const cur = dl[idx];
    const nxt = dl[(idx + 1) % N];
    out[i] = cur;
    const avg = 0.5 * (cur + nxt);
    lastOut = lastOut + damp * (avg - lastOut);
    dl[idx] = lastOut * loss;
    idx = (idx + 1) % N;
  }

  // amplitude shaping: short attack, gentle tail fade so the buffer ends at 0
  const atk = Math.min(len, Math.round(0.003 * sr));
  for (let i = 0; i < atk; i++) out[i] *= i / atk;
  const tail = Math.min(len, Math.round(0.05 * sr));
  for (let i = 0; i < tail; i++) out[len - 1 - i] *= i / tail;
  const g = 0.45 + 0.45 * vel;
  for (let i = 0; i < len; i++) out[i] *= g;
  return out;
}

// ---- celesta / music-box note (the logotune voice) -------------------------
const CELESTA_PARTIALS = [
  { ratio: 1.000, gain: 1.00, decayScale: 1.00 },  // fundamental — pitch anchor
  { ratio: 2.000, gain: 0.34, decayScale: 0.72 },  // octave, warmth
  { ratio: 4.010, gain: 0.14, decayScale: 0.42 },  // glassy "ting"
];
function celesta(sr, { freq, dec = 1.4, vel = 0.7 }, rnd){
  const len = Math.max(1, Math.floor(sr * (dec * 1.15 + 0.12)));
  const out = new Float32Array(len);
  const atkI = Math.max(1, Math.round(0.008 * sr));      // 8 ms mallet attack
  const SAFE = sr * 0.5 - 600;
  for (let p = 0; p < CELESTA_PARTIALS.length; p++){
    const P = CELESTA_PARTIALS[p];
    let f = freq * P.ratio;
    if (f >= SAFE) continue;
    if (p > 0) f *= 1 + (rnd() - 0.5) * 0.0015;          // tiny glass shimmer
    const w = 2 * Math.PI * f / sr;
    const peak = vel * P.gain;
    const d = Math.max(0.05, dec * P.decayScale);
    const tau = d / Math.log(peak / 0.0006 + 1e-9);
    for (let i = 0; i < len; i++){
      const t = i / sr;
      let env;
      if (i < atkI) env = peak * (i / atkI);
      else {
        env = peak * Math.exp(-(t - 0.008) / tau);
        if (env < 1e-5) break;
      }
      out[i] += env * Math.sin(w * i);
    }
  }
  const tail = Math.min(len, Math.round(0.02 * sr));
  for (let i = 0; i < tail; i++) out[len - 1 - i] *= i / tail;
  return out;
}

// breath law (all pads; r6.1 — inhale 42%, exhale 58%)
function breathEnv(t, { f = 0.08, depth = 0.35, u0 = 0.12, shape = 1.5, rise = 0.42 } = {}){
  const u = ((f * t + u0) % 1 + 1) % 1;
  const th = u < rise ? -Math.PI / 2 + Math.PI * (u / rise)
                      : Math.PI / 2 + Math.PI * ((u - rise) / (1 - rise));
  const b = Math.pow(0.5 + 0.5 * Math.sin(th), shape);
  return 1 - depth + depth * b;
}

function pinkGen(rnd){
  let b0 = 0, b1 = 0, b2 = 0;
  return () => {
    const w = rnd() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    return (b0 + b1 + b2 + w * 0.1848) * 0.08;
  };
}
function brownGen(rnd){
  let acc = 0;
  return () => { acc = acc * 0.9995 + (rnd() * 2 - 1) * 0.02; return acc; };
}
function svf(){
  let low = 0, band = 0;
  return (x, fc, Q) => {
    const f = 2 * Math.sin(Math.PI * Math.min(fc, 6000) / 44100);
    const q = 1 / Q;
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
}
// knot-lattice (r6.3, seekable): ki=lo+(hash2(S,i)/2^32)*(hi-lo), cosine-eased.
function knot(S, lo, hi, P){
  return (t) => {
    const x = t / P, i = Math.floor(x);
    const a = lo + hash2(S, i) / 4294967296 * (hi - lo);
    const b = lo + hash2(S, i + 1) / 4294967296 * (hi - lo);
    return a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * (x - i)));
  };
}

// r11.1 THE STREAM CONTRACT — every pad+wind voice has a cursor form beside its atomic
// entry: `<voice>Stream(sr,P) -> {fill(out,n)}`. Construction seeds/pre-rolls/sets up
// walkers EXACTLY as the atomic form; fill writes the NEXT n samples of the SAME signal,
// carrying all generator/filter state + the absolute index. LAW: for ANY partition of
// [0,D) the concatenated fills EQUAL the atomic render of D sample-for-sample — BY
// CONSTRUCTION: the atomic entries are THIN WRAPPERS over the stream. ONE realize path;
// air.js drives these, carrying no recipe DSP. `out` must be a Float32Array (its per-add
// rounding IS the signal); pads zero [0,n). CONSTRUCT-then-ADVANCE — built at the
// window/episode HEAD (where the salt is defined), never seeking a mid-window offset.

// the breath ride (all pads) at absolute sample index i0+i
function breathe(out, n, i0, sr, P){
  for (let i = 0; i < n; i++) out[i] *= breathEnv((i0 + i) / sr, { f: P.breathF, depth: P.depth, u0: P.breathU0 });
}
// detuned-saw ensemble: comps = [freq, phase, toneGain] in r6.3 draw order, knee =
// the tilt corner. Component-major then harmonic-major — the order IS the signal
// (each += rounds through the Float32Array).
function sawComps(tones, detunes, phases){
  const c = [];
  for (let ti = 0, d = 0; ti < tones.length; ti++) for (let v = 0; v < 3; v++, d++)
    c.push([tones[ti][0] * detunes[d], phases[d], tones[ti][1]]);
  return c;
}
function sawBank(out, n, i0, sr, comps, knee){
  for (let c = 0; c < comps.length; c++){ const f = comps[c][0], ph = comps[c][1], tg = comps[c][2], N = Math.min(40, Math.floor(5000 / f));
    for (let harm = 1; harm <= N; harm++){ const fp = f * harm, amp = (1 / harm) * (1 / (1 + Math.pow(fp / knee, 2))) * 0.22;
      if (amp < 0.002) continue; const w = 2 * Math.PI * fp / sr, php = ph * harm % (2 * Math.PI);
      for (let i = 0; i < n; i++) out[i] += tg * amp * Math.sin(php + w * (i0 + i)); } }
}
// r11.2 WAVETABLE realize MODE (padDay `wavetable:true` — the LIVE path only):
// one band-limited single cycle PER COMPONENT, 4096 samples, linear interp. An
// AUDIBLE-equivalence claim, NOT a bitwise one; §5.4 row (b3) freezes the parity
// at T3.1. Offline/Node keeps the direct sum.
const WT_N = 4096;
function sawTable(comp, knee){
  const f = comp[0], ph = comp[1], t = new Float32Array(WT_N + 1), N = Math.min(40, Math.floor(5000 / f));
  for (let harm = 1; harm <= N; harm++){ const fp = f * harm, amp = (1 / harm) * (1 / (1 + Math.pow(fp / knee, 2))) * 0.22;
    if (amp < 0.002) continue; const php = ph * harm % (2 * Math.PI);
    for (let j = 0; j <= WT_N; j++) t[j] += amp * Math.sin(php + 2 * Math.PI * harm * j / WT_N); }
  return t;
}
// r12.5: fmod-free, yet STILL strictly index-computed (no running phase
// accumulator — G10(b) bans that; every sample stays a pure function of its
// absolute index, so chunked == atomic BY CONSTRUCTION). BIT-IDENTICAL to the
// fmod form it replaces: WT_N is a power of two, so `step = dp * WT_N` and
// `pos = step * (i0 + i)` are exactly WT_N * (dp * (i0 + i)) — same rounding —
// and `floor(pos) & (WT_N - 1)` is floor(pos) mod WT_N (ToInt32 reduces mod 2^32,
// which WT_N divides), i.e. the same table index and the same fraction the fmod
// form computed. Costs one float modulo per sample per component less.
function wtBank(out, n, i0, sr, comps, tabs){
  for (let c = 0; c < comps.length; c++){ const step = comps[c][0] / sr * WT_N, tg = comps[c][2], t = tabs[c];
    for (let i = 0; i < n; i++){
      const pos = step * (i0 + i), fl = Math.floor(pos), j = fl & (WT_N - 1);
      out[i] += tg * (t[j] + (t[j + 1] - t[j]) * (pos - fl)); } }
}

// pad voices — whole-episode tone x breath; realize params drawn in r6.3 order.
function padNightStream(sr, P){ // P1 {A2,E4}
  const { detunes, phases } = P;
  const layers = [[110.0, 1, 0.55], [110.0, 2, 0.16], [110.0, 4, 0.05], [329.63, 1, 0.34], [329.63, 2, 0.08]];
  let i0 = 0;
  return { fill(out, n){
    out.fill(0, 0, n);
    for (let k = 0; k < 5; k++){ const f0 = layers[k][0], ratio = layers[k][1], g = layers[k][2];
      const w = 2 * Math.PI * f0 * ratio * detunes[k] / sr, ph = phases[k];
      for (let i = 0; i < n; i++) out[i] += g * Math.sin(ph + w * (i0 + i)); }
    if (P.third === 'C#5'){                        // deep-summer bright third (r7)
      const w = 2 * Math.PI * 554.37 / sr, ph = P.thirdPhase || 0;
      for (let i = 0; i < n; i++) out[i] += 0.08 * Math.sin(ph + w * (i0 + i)); }
    breathe(out, n, i0, sr, P); i0 += n;
  } };
}
function padDayStream(sr, P){ // P2 saws {A2,A3,E4}->LP
  const comps = sawComps([[110.0, 1], [220.0, 1], [329.63, 1]], P.detunes, P.phases);
  const tabs = P.wavetable ? comps.map((c) => sawTable(c, 750)) : null;
  const wander = knot(P.seeds[0], 550, 1000, 3.5);
  let y = 0, i0 = 0;
  return { fill(out, n){
    out.fill(0, 0, n);
    if (tabs) wtBank(out, n, i0, sr, comps, tabs); else sawBank(out, n, i0, sr, comps, 750);
    for (let i = 0; i < n; i++){ const k = 1 - Math.exp(-2 * Math.PI * wander((i0 + i) / sr) / sr);
      y += k * (out[i] - y); out[i] = y * 2.2; }
    breathe(out, n, i0, sr, P); i0 += n;
  } };
}
function padDawnDuskStream(sr, P){ // P3 {A3,E4}+air
  const { phases, seeds } = P, tones = [220.0, 329.63], st = [];
  for (let ti = 0; ti < 2; ti++) st.push([pinkGen(mulberry32(seeds[ti])), svf()]);
  let i0 = 0;
  return { fill(out, n){
    out.fill(0, 0, n);
    for (let ti = 0; ti < 2; ti++){ const f0 = tones[ti], pink = st[ti][0], bp = st[ti][1];
      const ph1 = phases[ti * 3], ph2 = phases[ti * 3 + 1], ph3 = phases[ti * 3 + 2];
      const w1 = 2 * Math.PI * f0 / sr, w2 = 2 * w1, w3 = 3 * w1;
      for (let i = 0; i < n; i++){ const a = i0 + i;
        const tone = 0.42 * Math.sin(ph1 + w1 * a) + 0.10 * Math.sin(ph2 + w2 * a) + 0.035 * Math.sin(ph3 + w3 * a);
        const air = bp(pink() * 3.0, f0, 14).band * 0.5;
        out[i] += tone + air; } }
    breathe(out, n, i0, sr, P); i0 += n;
  } };
}
function padWinterDeepStream(sr, P){ // P6 r10: 3 detuned saws/tone {A3,E4,A4}->LP300, no noise
  const comps = sawComps([[220.0, 1.0], [329.63, 0.6], [440.0, 0.5]], P.detunes, P.phases);
  const k300 = 1 - Math.exp(-2 * Math.PI * 300 / sr);
  let y = 0, i0 = 0;
  return { fill(out, n){
    out.fill(0, 0, n);
    sawBank(out, n, i0, sr, comps, 150);
    for (let i = 0; i < n; i++){ y += k300 * (out[i] - y); out[i] = y * 2.2; }
    breathe(out, n, i0, sr, P); i0 += n;
  } };
}

// the atomic entries — THIN WRAPPERS; signatures/output UNCHANGED (r11.4-locked).
function atomic(stream, sr, seconds){
  const n = Math.round(sr * seconds), out = new Float32Array(n);
  stream.fill(out, n);
  return out;
}
function padNight(sr, P){ return atomic(padNightStream(sr, P), sr, P.seconds); }
function padDay(sr, P){ return atomic(padDayStream(sr, P), sr, P.seconds); }
function padDawnDusk(sr, P){ return atomic(padDawnDuskStream(sr, P), sr, P.seconds); }
function padWinterDeep(sr, P){ return atomic(padWinterDeepStream(sr, P), sr, P.seconds); }

// loneVoice — one gliding near-sine per SWELL (P5 + the r6.4 walk law), realized
// from the event fields (prevNote/gapS = this swell owns the bridge in, portamento
// 0.9 s / 0.15 floor; nextGapS = release floors 0.15 + 30 ms handoff out; else scoop
// from -1.5 st over 0.5 s). length = lead + swellDur + tail. See SCORE r6.4.
function loneVoiceSwell(sr, P){
  const { note, prevNote, gapS, nextGapS, swellDur } = P;
  const baseAmp = P.baseAmp != null ? P.baseAmp : 0.5;
  const lead = (prevNote != null) ? gapS : 0;
  const tail = (nextGapS != null) ? 0.030 : 0;
  const n = Math.round(sr * (lead + swellDur + tail)), out = new Float32Array(n);
  const targetF = semiToFreq(note);
  let phase = 0, risen = false;
  for (let i = 0; i < n; i++){
    const tau = i / sr, ts = tau - lead;
    let f;
    if (lead > 0 && tau < 0.9) f = semiToFreq(prevNote + (note - prevNote) * (tau / 0.9));
    else if (lead === 0 && tau < 0.5) f = semiToFreq(note - 1.5 * (1 - tau / 0.5));
    else f = targetF;
    if (ts > 0){
      const vd = Math.min(1, Math.max(0, (ts - 1.2) / 1.6)) * 0.006;
      f *= 1 + vd * Math.sin(2 * Math.PI * 4.6 * ts);
    }
    phase += 2 * Math.PI * f / sr;
    let env;
    if (ts < 0) env = 0.15;
    else {
      const be = breathEnv(ts, { f: 1 / swellDur, depth: 1.0, u0: 0 });
      env = be;
      if (lead > 0 && !risen){ if (be > 0.15) risen = true; else env = 0.15; }
      if (nextGapS != null && ts > 0.42 * swellDur) env = Math.max(be, 0.15);
    }
    out[i] = baseAmp * env * (Math.sin(phase) + 0.12 * Math.sin(2 * phase) + 0.05 * Math.sin(3 * phase));
  }
  const fN = Math.round(0.030 * sr);
  if (prevNote != null) for (let i = 0; i < fN && i < n; i++) out[i] *= Math.sin((i / fN) * Math.PI / 2);
  if (nextGapS != null) for (let i = 0; i < fN && i < n; i++) out[n - 1 - i] *= Math.sin((i / fN) * Math.PI / 2);
  return out;
}

// windBed — one 30.25-s window of the seekable wind floor (r6.2/r6.3). Salts: noise
// = hash2(seedInt,1000+windowIndex), lattices = hash2(seedInt,compIndex). 1-s pre-
// roll [winFrom-1,winFrom) primes steady state before sample 0; ramps/seams outside.
function windBedStream(sr, P){
  const { preset, hourWindSeedInt, winFrom } = P;
  const rnd = mulberry32(hash2(hourWindSeedInt, 1000 + Math.round(winFrom / 30)));
  let run;                    // the preset's sample loop, out[i] = the sample at absolute i0+i
  if (preset === 'plain'){
    const cut = knot(hash2(hourWindSeedInt, 0), 380, 900, 4.0);
    const gust = knot(hash2(hourWindSeedInt, 1), 0.55, 1.35, 6.5);
    const pink = pinkGen(rnd); let y = 0;
    run = (out, n, i0) => { for (let i = 0; i < n; i++){
      const ht = winFrom + (i0 + i) / sr, k = 1 - Math.exp(-2 * Math.PI * cut(ht) / sr);
      y += k * (pink() - y); out[i] = y * gust(ht); } };
  } else if (preset === 'winterThin'){
    const center = knot(hash2(hourWindSeedInt, 0), 900, 1900, 3.0);
    const gust = knot(hash2(hourWindSeedInt, 1), 0.45, 1.5, 4.5);
    const wc = knot(hash2(hourWindSeedInt, 2), 1300, 2100, 2.2);
    const pink = pinkGen(rnd), bed = svf(), whistle = svf();
    run = (out, n, i0) => { for (let i = 0; i < n; i++){
      const ht = winFrom + (i0 + i) / sr, p = pink();
      const b = bed(p, center(ht), 1.6).band, wh = whistle(p, wc(ht), 22).band;
      out[i] = (b * 1.0 + wh * 0.22) * gust(ht); } };
  } else {
    const cut = knot(hash2(hourWindSeedInt, 0), 200, 320, 5.0);
    const gust = knot(hash2(hourWindSeedInt, 1), 0.8, 1.15, 8.0);
    const brown = brownGen(rnd); let y = 0;
    run = (out, n, i0) => { for (let i = 0; i < n; i++){
      const ht = winFrom + (i0 + i) / sr, k = 1 - Math.exp(-2 * Math.PI * cut(ht) / sr);
      y += k * (brown() - y); out[i] = y * gust(ht) * 3.0; } };
  }
  const pre = Math.round(sr);   // the 1-s pre-roll: primes steady state into a discarded
  run(new Float32Array(pre), pre, -pre);   // scratch (the store never feeds back into state)
  let i0 = 0;
  return { fill(out, n){ run(out, n, i0); i0 += n; } };
}
function windBed(sr, P){ return atomic(windBedStream(sr, P), sr, P.winDur); }

// one-pole lowpass coefficient for a given cutoff
function onePoleK(sr, fc){ return 1 - Math.exp(-2*Math.PI*fc/sr); }

// equal-power pan gains, pan ∈ [-1, 1]
function panGains(pan){
  const a = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI/4;
  return [Math.cos(a), Math.sin(a)];
}

// add a mono voice buffer into a stereo mix at sample offset with pan + gain
function mixIn(L, R, buf, offset, gain, pan){
  const [gL, gR] = panGains(pan);
  const end = Math.min(L.length, offset + buf.length);
  for (let i = Math.max(0, offset); i < end; i++){
    const v = buf[i - offset] * gain;
    L[i] += v * gL;
    R[i] += v * gR;
  }
}

// ===== CALENDAR SCORE VOICES — END =====

export {
  ksPluck, celesta, breathEnv, pinkGen, brownGen, svf, knot,
  padNight, padDay, padDawnDusk, padWinterDeep, loneVoiceSwell, windBed,
  padNightStream, padDayStream, padDawnDuskStream, padWinterDeepStream, windBedStream,
  onePoleK, panGains, mixIn,
};
