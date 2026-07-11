// ============================================================================
//  CALENDAR SCORE VOICES — the AIR's voice bank (WS4 The Living Calendar).
//  Ported VERBATIM from the trailer bed's palette — the estate's own voices
//  (read-only design source, OUTSIDE the repo: 05-trailer/design/music-prototype):
//    ksPluck   ← palette.mjs:23-59  (Loom `ksRender` provenance, palette.mjs:8-9
//                — pre-rendered Karplus-Strong, never a live feedback loop, per
//                the Loom's OfflineAudioContext lesson)
//    celesta   ← palette.mjs:67-95  (the logotune partial recipe 1.0/2.0/4.01,
//                8 ms mallet attack — the Gate's own glass timbre)
//    padChord  ← palette.mjs:100-128 (Loom `padVoice` idea + the Long Way Home
//                bed language)
//    onePoleK / panGains / mixIn ← dsp.mjs:26-46 (the dsp trio)
//  EXCLUDED as trailer-diegetic (SCORE §5.1): chirpRiser, subDrop, kick, hat,
//  bandpassSweep, the scratch — and tick (the escapement stays in its wing).
//
//  Every voice: (sr, params, rnd) → Float32Array (mono). Deterministic — all
//  randomness comes from the passed seeded rnd(). PURE: no clock, no
//  Math.random, no storage, no DOM.
//
//  SINGLE-SOURCE DISCIPLINE (monochord pattern): the pages inline a BYTE-TWIN
//  of the slice between the sentinels below; the Node twin re-extracts the
//  built page's slice and asserts it is char-for-char this region. Everything
//  between the sentinels is classic-script-safe — no module syntax inside
//  (the ported voices' ES6 destructured-default params stay VERBATIM);
//  `export` lives below the END marker.
// ============================================================================

// ===== CALENDAR SCORE VOICES — BEGIN =====
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

// ---- sustained pad chord (Loom padVoice / Long Way Home bed language) ------
// freqs = chord tones (Hz). Each tone: warm fundamental + soft octave + faint
// twelfth, micro-detuned; slow attack/release; gentle 0.07 Hz breathing LFO.
function padChord(sr, { freqs, dur, gain = 0.12, attack = 1.5, release = 1.8 }, rnd){
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

export { ksPluck, celesta, padChord, onePoleK, panGains, mixIn };
