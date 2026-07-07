// ============================================================================
// THE TRAILER BED'S PALETTE — the estate's own voices, ported to pure sample
// loops (Path A per research/21-audio-inventory.md §4). Every function:
//   (sr, params, rnd) → Float32Array (mono)
// Deterministic: all randomness comes from the passed seeded rnd().
//
// Provenance (the covenant — this bed is estate-made):
//   ksPluck   ← sound-garden/loom.html `ksRender` (authentic Karplus-Strong;
//               loom's Math.random excitation replaced with the seeded rnd)
//   celesta   ← the-gate/audio-logotune.js partial recipe (1.0/2.0/4.01,
//               8 ms mallet attack, exp decays) — the Gate's own glass timbre
//   padChord  ← sound-garden/loom.html `padVoice` idea (root/fifth/octave
//               drone, slow swell) + the-long-way-home/audio.js bed language
//   chirpRiser← stellar-forge/the-chirp (GW inspiral law f ∝ (tc−t)^(−3/8))
//   noise kit ← the-gate/audio-*.js shaped-noise DNA (rain/wind/thunder)
// Pitch math flows ONLY through sound-garden/pitch-core.mjs (via compose.mjs's
// n() helper) — the palette receives already-computed frequencies as params.
// ============================================================================

import { onePoleK } from './dsp.mjs';

// ---- Karplus-Strong pluck (Loom's ksRender, seeded) ------------------------
export function ksPluck(sr, { freq, dur = 2.0, brightness = 0.5, vel = 1 }, rnd){
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
export function celesta(sr, { freq, dec = 1.4, vel = 0.7 }, rnd){
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

// ---- sustained pad chord (Loom padVoice / Long Way Home bed language) ------
// freqs = chord tones (Hz). Each tone: warm fundamental + soft octave + faint
// twelfth, micro-detuned; slow attack/release; gentle 0.07 Hz breathing LFO.
export function padChord(sr, { freqs, dur, gain = 0.12, attack = 1.5, release = 1.8 }, rnd){
  const len = Math.max(1, Math.floor(sr * (dur + release)));
  const out = new Float32Array(len);
  const susEnd = Math.floor(sr * dur);
  const atkN = Math.max(1, Math.floor(sr * attack));
  const relN = Math.max(1, len - susEnd);
  const lfoW = 2 * Math.PI * 0.07 / sr;
  const lfoPh = rnd() * 2 * Math.PI;
  const layers = [
    { ratio: 1, g: 0.55 }, { ratio: 2, g: 0.20 }, { ratio: 3, g: 0.10 },
  ];
  for (const f0 of freqs){
    for (const Ly of layers){
      const det = 1 + (rnd() - 0.5) * 0.0016;            // micro-detune shimmer
      const w = 2 * Math.PI * f0 * Ly.ratio * det / sr;
      if (f0 * Ly.ratio >= sr * 0.45) continue;
      const ph0 = rnd() * 2 * Math.PI;
      for (let i = 0; i < len; i++){
        let env = 1;
        if (i < atkN) env = i / atkN;
        if (i >= susEnd) env *= Math.max(0, 1 - (i - susEnd) / relN);
        const breathe = 1 + 0.13 * Math.sin(lfoPh + lfoW * i);
        out[i] += Ly.g * env * breathe * Math.sin(ph0 + w * i);
      }
    }
  }
  for (let i = 0; i < len; i++) out[i] *= gain / Math.max(1, freqs.length * 0.85);
  return out;
}

// ---- gravitational-wave inspiral riser (The Chirp's law) -------------------
// f(t) = f0 · (1 − k·t/T)^(−3/8), capped at fmax — the estate's own physics
// as a riser. A seeded-noise sheen rides up with it. Ends HARD (the void).
export function chirpRiser(sr, { dur, f0 = 55, fmax = 1600, gain = 0.5 }, rnd){
  const len = Math.max(1, Math.floor(sr * dur));
  const out = new Float32Array(len);
  let ph = 0, nzLp = 0;
  for (let i = 0; i < len; i++){
    const t = i / len;                                   // 0..1 through the riser
    const f = Math.min(fmax, f0 * Math.pow(Math.max(1e-6, 1 - 0.99987 * t), -3/8));
    ph += 2 * Math.PI * f / sr;
    const amp = gain * Math.pow(t, 1.6);
    const k = onePoleK(sr, Math.min(sr * 0.4, f * 2.5));
    nzLp += k * ((rnd() * 2 - 1) - nzLp);
    out[i] = amp * (0.8 * Math.sin(ph) + 0.5 * nzLp * t);
  }
  // 3 ms declick only — the cut into the void should feel like a held breath
  const d = Math.min(len, Math.round(0.003 * sr));
  for (let i = 0; i < d; i++) out[len - 1 - i] *= i / d;
  return out;
}

// ---- the drop's sub hit (star → neutron star) ------------------------------
export function subDrop(sr, { f0 = 100, f1 = 32, dur = 1.1, gain = 0.9 }, _rnd){
  const len = Math.max(1, Math.floor(sr * dur));
  const out = new Float32Array(len);
  let ph = 0;
  const tau = dur / 3;
  for (let i = 0; i < len; i++){
    const t = i / sr;
    const f = f0 * Math.pow(f1 / f0, i / len);
    ph += 2 * Math.PI * f / sr;
    const atk = Math.min(1, t / 0.004);
    out[i] = gain * atk * Math.exp(-t / tau) * Math.sin(ph);
  }
  return out;
}

// ---- percussion: soft kick / air-hat / escapement tick ---------------------
export function kick(sr, { gain = 0.5 }, _rnd){
  const len = Math.floor(sr * 0.30);
  const out = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++){
    const t = i / sr;
    const f = 110 * Math.pow(45 / 110, Math.min(1, t / 0.12));
    ph += 2 * Math.PI * f / sr;
    out[i] = gain * Math.min(1, t / 0.002) * Math.exp(-t / 0.075) * Math.sin(ph);
  }
  return out;
}
export function hat(sr, { gain = 0.15 }, rnd){
  const len = Math.floor(sr * 0.05);
  const out = new Float32Array(len);
  let lp = 0;
  const k = onePoleK(sr, 5200);
  for (let i = 0; i < len; i++){
    const w = rnd() * 2 - 1;
    lp += k * (w - lp);
    out[i] = gain * (w - lp) * Math.exp(-(i / sr) / 0.014);  // highpassed noise
  }
  return out;
}
export function tick(sr, { gain = 0.12, freq = 4200 }, rnd){
  const len = Math.floor(sr * 0.03);
  const out = new Float32Array(len);
  const w = 2 * Math.PI * freq / sr;
  for (let i = 0; i < len; i++){
    const t = i / sr;
    out[i] = gain * Math.exp(-t / 0.006) * (Math.sin(w * i) * 0.8 + (rnd() * 2 - 1) * 0.3);
  }
  return out;
}
