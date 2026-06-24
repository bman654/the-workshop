/* ============================================================================
   Audio Lens — analysis primitives.
   Pure DSP lifted verbatim from web/index.html, plus the NEW silenceRatio.
   ============================================================================ */

import { stft } from "./fft.js";

/* ---------------------------------------------------------------------------
   Analysis primitives
   --------------------------------------------------------------------------- */
export function dbfs(amp) { return 20 * Math.log10(Math.max(amp, 1e-12)); }

export function peakAndClip(samples) {
  let peak = 0, clipped = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
    if (a >= 0.999) clipped++;
  }
  return { peak, peakDb: dbfs(peak), clipped, clipPct: 100 * clipped / samples.length };
}

// per-frame RMS in dBFS over the whole buffer
export function rmsCurve(samples, frame, hopSize) {
  const out = [];
  for (let s = 0; s + frame <= samples.length; s += hopSize) {
    let sum = 0;
    for (let i = 0; i < frame; i++) { const v = samples[s + i]; sum += v * v; }
    out.push(dbfs(Math.sqrt(sum / frame)));
  }
  return out;
}
export function meanRmsDb(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return dbfs(Math.sqrt(sum / samples.length));
}

// spectral centroid (Hz) for one magnitude frame; uses power weighting
export function frameCentroid(mag, sampleRate, fftSize) {
  let num = 0, den = 0;
  for (let k = 0; k < mag.length; k++) {
    const p = mag[k] * mag[k];
    const f = k * sampleRate / fftSize;
    num += f * p; den += p;
  }
  return den > 0 ? num / den : 0;
}
export function meanCentroid(frames, sampleRate, fftSize, fromFrac, toFrac) {
  const a = Math.floor((fromFrac || 0) * frames.length);
  const b = Math.floor((toFrac == null ? 1 : toFrac) * frames.length);
  let sum = 0, n = 0;
  for (let i = a; i < b; i++) {
    // ignore near-silent frames so silence doesn't drag the centroid
    let e = 0; for (let k = 0; k < frames[i].length; k++) e += frames[i][k] * frames[i][k];
    if (e < 1e-9) continue;
    sum += frameCentroid(frames[i], sampleRate, fftSize); n++;
  }
  return n > 0 ? sum / n : 0;
}

/* ---- pitch: parabolic-interpolated autocorrelation (monophonic f0) -------- */
export function detectPitchAC(samples, sampleRate) {
  // analyze a centered ~64ms window, only if there's signal
  const N = Math.min(samples.length, 4096);
  const start = Math.max(0, Math.floor(samples.length / 2 - N / 2));
  const buf = new Float64Array(N);
  let mean = 0;
  for (let i = 0; i < N; i++) mean += samples[start + i];
  mean /= N;
  let energy = 0;
  for (let i = 0; i < N; i++) { buf[i] = samples[start + i] - mean; energy += buf[i] * buf[i]; }
  if (energy < 1e-6) return null;

  const minF = 50, maxF = 5000;
  const minLag = Math.floor(sampleRate / maxF);
  const maxLag = Math.min(N - 1, Math.floor(sampleRate / minF));

  // normalized autocorrelation
  const r = new Float64Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i < N - lag; i++) s += buf[i] * buf[i + lag];
    r[lag] = s;
  }
  // first local max after the initial descent — skip zero-lag region by starting at minLag
  let bestLag = -1, bestVal = -Infinity;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (r[lag] > r[lag - 1] && r[lag] >= r[lag + 1] && r[lag] > bestVal) {
      bestVal = r[lag]; bestLag = lag;
    }
  }
  if (bestLag < 0) return null;
  // require a reasonably strong correlation (reject noise)
  if (bestVal / energy < 0.3) return null;

  // parabolic interpolation around bestLag for sub-sample precision
  const y0 = r[bestLag - 1], y1 = r[bestLag], y2 = r[bestLag + 1];
  const denom = (y0 - 2 * y1 + y2);
  const shift = denom !== 0 ? 0.5 * (y0 - y2) / denom : 0;
  const lag = bestLag + shift;
  return sampleRate / lag;
}

/* ---- chord: top-N spectral peaks (parabolic-interpolated) ----------------- */
export function spectralPeaks(frames, sampleRate, fftSize, topN) {
  // average magnitude spectrum across all energetic frames
  const half = fftSize / 2;
  const avg = new Float64Array(half + 1);
  let used = 0;
  for (const f of frames) {
    let e = 0; for (let k = 0; k < f.length; k++) e += f[k] * f[k];
    if (e < 1e-9) continue;
    for (let k = 0; k <= half; k++) avg[k] += f[k];
    used++;
  }
  if (used === 0) return [];
  for (let k = 0; k <= half; k++) avg[k] /= used;

  let maxMag = 0; for (let k = 1; k < half; k++) if (avg[k] > maxMag) maxMag = avg[k];
  const thresh = maxMag * 0.1;
  const minBin = Math.ceil(60 * fftSize / sampleRate);    // ignore < 60 Hz
  const maxBin = Math.floor(5000 * fftSize / sampleRate); // ignore > 5 kHz

  const peaks = [];
  for (let k = Math.max(2, minBin); k < Math.min(half - 1, maxBin); k++) {
    if (avg[k] > thresh && avg[k] > avg[k - 1] && avg[k] >= avg[k + 1]) {
      const y0 = avg[k - 1], y1 = avg[k], y2 = avg[k + 1];
      const denom = (y0 - 2 * y1 + y2);
      const shift = denom !== 0 ? 0.5 * (y0 - y2) / denom : 0;
      const freq = (k + shift) * sampleRate / fftSize;
      peaks.push({ freq, mag: y1 });
    }
  }
  peaks.sort((a, b) => b.mag - a.mag);
  // de-duplicate peaks that are within ~3% (same note) keeping strongest
  const kept = [];
  for (const p of peaks) {
    if (kept.some(q => Math.abs(q.freq - p.freq) / q.freq < 0.03)) continue;
    kept.push(p);
    if (kept.length >= topN) break;
  }
  return kept;
}

/* ---- onset detection (spectral flux) → tempo ------------------------------
   Raw half-wave-rectified spectral flux is normalized into a dimensionless
   "onset strength" by dividing by each frame's own spectral magnitude sum.
   This is the key to not firing on a steady tone: a sustained sine's flux is a
   minuscule fraction of its sustained spectral energy (window-edge ripple),
   while a true transient (click) spikes the flux far above the running energy.
   We then peak-pick on the normalized function with an ABSOLUTE floor so a
   pure tone reports zero onsets regardless of its (tiny) relative max.
   --------------------------------------------------------------------------- */
export function onsetsAndTempo(frames, sampleRate, fftSize, hopSize) {
  const N = frames.length;
  const flux = new Float64Array(N);     // normalized onset strength
  let prev = null;
  for (let i = 0; i < N; i++) {
    const cur = frames[i];
    let energy = 0;
    for (let k = 0; k < cur.length; k++) energy += cur[k];   // L1 magnitude sum
    if (prev) {
      let f = 0;
      for (let k = 0; k < cur.length; k++) {
        const d = cur[k] - prev[k];
        if (d > 0) f += d;                                    // half-wave rectified
      }
      // normalize by the larger of the two frames' magnitude sums → relative jump
      const denom = Math.max(energy, 1e-6);
      flux[i] = f / denom;
    }
    prev = cur;
  }
  let mx = 0; for (let i = 0; i < N; i++) if (flux[i] > mx) mx = flux[i];
  if (mx <= 0) return { onsets: [], tempo: 0, flux };

  // ABSOLUTE floor on normalized strength: a real transient injects a large
  // fraction of new spectral energy in one hop; a steady tone never does.
  const ABS_FLOOR = 0.30;
  const W = 8;
  const onsets = [];
  const minGap = Math.ceil(0.10 * sampleRate / hopSize); // 100ms refractory
  let lastOnset = -1e9;
  for (let i = 1; i < N - 1; i++) {
    let lo = Math.max(0, i - W), hi = Math.min(N, i + W + 1), sum = 0;
    for (let j = lo; j < hi; j++) sum += flux[j];
    const localMean = sum / (hi - lo);
    const thr = Math.max(ABS_FLOOR, localMean + 0.15);   // must clear floor AND local baseline
    if (flux[i] > thr && flux[i] >= flux[i - 1] && flux[i] > flux[i + 1] && (i - lastOnset) >= minGap) {
      onsets.push(i * hopSize / sampleRate);
      lastOnset = i;
    }
  }
  // tempo from median inter-onset interval
  let tempo = 0;
  if (onsets.length >= 2) {
    const ivals = [];
    for (let i = 1; i < onsets.length; i++) ivals.push(onsets[i] - onsets[i - 1]);
    ivals.sort((a, b) => a - b);
    const med = ivals[Math.floor(ivals.length / 2)];
    if (med > 0) tempo = 60 / med;
  }
  return { onsets, tempo, flux };
}

/* ---- note naming (A4=440, equal temperament) ------------------------------ */
export const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export function hzToNote(freq) {
  if (!freq || freq <= 0) return null;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  const cents = Math.round((midi - rounded) * 100);
  return { name: name + octave, cents, midi: rounded, freq };
}

/* ---- NEW: silence ratio ---------------------------------------------------
   Fraction of samples whose absolute amplitude is below the threshold (dBFS).
   thresholdDb = -60 means |x| < 10^(-60/20) = 0.001.
   --------------------------------------------------------------------------- */
export function silenceRatio(samples, thresholdDb = -60) {
  const lin = Math.pow(10, thresholdDb / 20);
  let silent = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) < lin) silent++;
  }
  return samples.length > 0 ? silent / samples.length : 0;
}

/* ===========================================================================
   Full analysis bundle for a Float32Array of mono samples.
   =========================================================================== */
export function analyze(samples, sampleRate, fftSize, hopSize, silenceDb = -60) {
  const frames = stft(samples, fftSize, hopSize);
  const pc = peakAndClip(samples);
  const meanRms = meanRmsDb(samples);
  const centroid = meanCentroid(frames, sampleRate, fftSize, 0, 1);
  const centroid1 = meanCentroid(frames, sampleRate, fftSize, 0, 0.5);
  const centroid2 = meanCentroid(frames, sampleRate, fftSize, 0.5, 1);
  const ot = onsetsAndTempo(frames, sampleRate, fftSize, hopSize);
  const f0 = detectPitchAC(samples, sampleRate);
  const monoNote = f0 ? hzToNote(f0) : null;
  const peaks = spectralPeaks(frames, sampleRate, fftSize, 3);
  const peakNotes = peaks.map(p => ({ ...hzToNote(p.freq), freq: p.freq }));
  const rms = rmsCurve(samples, 1024, hopSize);
  const silence = silenceRatio(samples, silenceDb);

  // dominant single spectral peak (for the 1000 Hz test)
  let topPeakFreq = peaks.length ? peaks[0].freq : 0;

  return {
    sampleRate, fftSize, hopSize, frames, samples,
    peak: pc, meanRms, centroid, centroid1, centroid2,
    onsets: ot.onsets, tempo: ot.tempo,
    f0, monoNote, peaks, peakNotes, topPeakFreq, rms,
    clipping: pc.clipPct > 1,
    silenceRatio: silence, silenceDb
  };
}
