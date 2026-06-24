/* ============================================================================
   Audio Lens — signal generators.
   Re-pured from web/index.html: OfflineAudioContext replaced with direct
   Float32Array synthesis. Sample math matches the original exactly.
   Noise uses a SEEDED mulberry32 PRNG → deterministic, reproducible self-tests.
   ============================================================================ */

export const SR = 44100;          // sample rate for all renders
export const DUR = 4.0;           // default generator duration (s)

/* ---- seeded PRNG (mulberry32) — deterministic noise -----------------------
   Fixed seed so genNoise is reproducible across runs (improvement over the
   browser's Math.random()).
   --------------------------------------------------------------------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE_SEED = 0x9E3779B9; // fixed seed for deterministic white noise

/* ---- generators: direct sample synthesis ---------------------------------- */

// Sine: 0.8 * sin(2π f i/SR). Matches the 0.8 master gain.
export function genSine(freq, dur, gain) {
  const d = dur || DUR;
  const g = gain == null ? 0.8 : gain;
  const len = Math.ceil(d * SR);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) data[i] = g * Math.sin(2 * Math.PI * freq * i / SR);
  return data;
}

// Triad: sum of sines × (0.8 / freqs.length). Matches the original master gain.
export function genTriad(freqs, dur) {
  const d = dur || DUR;
  const len = Math.ceil(d * SR);
  const data = new Float32Array(len);
  const g = 0.8 / freqs.length;
  for (let i = 0; i < len; i++) {
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * i / SR);
    data[i] = g * s;
  }
  return data;
}

// Click train: short decaying broadband impulses at the given BPM.
export function genClicks(bpm, dur) {
  const d = dur || DUR;
  const len = Math.ceil(d * SR);
  const data = new Float32Array(len);
  const period = 60 / bpm;
  for (let t = 0; t < d; t += period) {
    const idx = Math.floor(t * SR);
    // short decaying click (a few samples) so it has broadband content
    for (let k = 0; k < 64 && idx + k < len; k++) {
      data[idx + k] = Math.exp(-k / 8) * (k === 0 ? 1 : Math.sin(k * 0.7)) * 0.9;
    }
  }
  return data;
}

// Linear chirp via integrated phase: phase(t)=2π(f0 t + (f1-f0)/(2T) t²)
export function genChirp(f0, f1, dur) {
  const d = dur || DUR;
  const len = Math.ceil(d * SR);
  const data = new Float32Array(len);
  const k = (f1 - f0) / d;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const phase = 2 * Math.PI * (f0 * t + 0.5 * k * t * t);
    data[i] = 0.8 * Math.sin(phase);
  }
  return data;
}

// White noise, seeded → deterministic.
export function genNoise(dur) {
  const d = dur || DUR;
  const len = Math.ceil(d * SR);
  const data = new Float32Array(len);
  const rng = mulberry32(NOISE_SEED);
  for (let i = 0; i < len; i++) data[i] = (rng() * 2 - 1) * 0.5;
  return data;
}

// Hard-clipped sine (overdriven gain → flat-topped waveform).
export function genClipped(freq, dur, gain) {
  const d = dur || DUR;
  const len = Math.ceil(d * SR);
  const data = new Float32Array(len);
  const g = gain || 1.5;
  for (let i = 0; i < len; i++) {
    let v = g * Math.sin(2 * Math.PI * freq * i / SR);
    if (v > 1) v = 1; else if (v < -1) v = -1;   // hard clip
    data[i] = v;
  }
  return data;
}

/* Source registry: id → {label, make()->Float32Array} */
export const SIGNALS = {
  sine440:  { label: "Sine 440 Hz (A4)", make: () => genSine(440) },
  sine1000: { label: "Sine 1000 Hz",     make: () => genSine(1000) },
  triad:    { label: "A-major triad",    make: () => genTriad([440, 554.37, 659.25]) },
  clicks:   { label: "Click 120 BPM",    make: () => genClicks(120) },
  chirp:    { label: "Chirp 100→2000",   make: () => genChirp(100, 2000) },
  noise:    { label: "White noise",      make: () => genNoise() },
  clipped:  { label: "Clipped sine",     make: () => genClipped(440, DUR, 1.5) },
};

export function expectedText(id) {
  switch (id) {
    case "sine440":  return "pitch A4 (440), centroid≈440, 0 onsets, no clip";
    case "sine1000": return "peak 1000 Hz, pitch B5+ cents";
    case "triad":    return "peaks {A4, C#5, E5}";
    case "clicks":   return "tempo ≈120 BPM";
    case "chirp":    return "centroid rises (2nd half > 1st)";
    case "noise":    return "centroid > 3 kHz, no stable pitch";
    case "clipped":  return "clipping flagged (>1%)";
    default: return null;
  }
}
