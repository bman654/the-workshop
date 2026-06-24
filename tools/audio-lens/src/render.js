/* ============================================================================
   Audio Lens — headless renderers → PNG Buffers.
   Pixel math lifted from web/index.html (drawSpectrogram/drawWaveform/drawRms).
   Gridline ROWS are drawn (cheap); text labels are omitted (no font headless).
   ============================================================================ */

import { Canvas } from "./png.js";
import { magma } from "./colormap.js";

const BG = [6, 7, 10, 255];               // #06070a
const WAVE_COLOR = [127, 211, 255, 255];  // #7fd3ff (--accent)
const WAVE_MID = [26, 35, 51, 255];       // #1a2333
const RMS_COLOR = [255, 184, 107, 255];   // #ffb86b (--accent2)
const GRID = [255, 255, 255, 20];         // faint grid (~0.08 alpha-ish, opaque-ish)
const GRID_SPEC = [255, 255, 255, 20];

/* ---------------------------------------------------------------------------
   Waveform — min/max per column → vertical line per column. (index.html 604–620)
   --------------------------------------------------------------------------- */
export function waveformPng(samples, width = 1040, height = 130) {
  const cv = new Canvas(width, height, BG);
  const W = width, H = height, mid = H / 2;
  // center axis line
  cv.hline(Math.round(mid), 0, W - 1, WAVE_MID);

  const per = samples.length / W;
  for (let x = 0; x < W; x++) {
    let mn = 1, mx = -1;
    const s = Math.floor(x * per), e = Math.min(samples.length, Math.floor((x + 1) * per));
    for (let i = s; i < e; i++) { const v = samples[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    if (s >= e) { mn = mx = 0; }
    const yTop = Math.round(mid - mx * mid * 0.95);
    const yBot = Math.round(mid - mn * mid * 0.95);
    cv.vline(x, yTop, yBot, WAVE_COLOR);
  }
  return cv.toPng();
}

/* ---------------------------------------------------------------------------
   Spectrogram — log-frequency y-axis (fMin=40 → Nyquist), dB→magma per pixel.
   (index.html 623–667). Magic constants preserved verbatim.
   --------------------------------------------------------------------------- */
export function spectrogramPng(frames, sampleRate, fftSize, width = 1040, height = 300) {
  const cv = new Canvas(width, height, BG);
  const W = width, H = height;
  const half = fftSize / 2;
  const fMin = 40, fMax = sampleRate / 2;
  const logMin = Math.log2(fMin), logMax = Math.log2(fMax);

  // dB range for colour mapping
  const dbFloor = -90, dbCeil = -10;

  if (frames.length === 0) return cv.toPng();

  for (let x = 0; x < W; x++) {
    const fi = Math.min(frames.length - 1, Math.floor(x * frames.length / W));
    const mag = frames[fi] || frames[frames.length - 1];
    if (!mag) continue;
    for (let y = 0; y < H; y++) {
      const frac = 1 - y / (H - 1);                 // 0 bottom..1 top
      const f = Math.pow(2, logMin + frac * (logMax - logMin));
      const bin = f * fftSize / sampleRate;
      const b0 = Math.floor(bin), b1 = Math.min(half, b0 + 1);
      const bf = bin - b0;
      let m = (mag[b0] || 0) * (1 - bf) + (mag[b1] || 0) * bf;
      // normalize magnitude → dB. Hann coherent gain ~0.5, scale by fftSize.
      const db = 20 * Math.log10((m / (fftSize * 0.25)) + 1e-9);
      let t = (db - dbFloor) / (dbCeil - dbFloor);
      const [r, g, bb] = magma(t);
      cv.setPixel(x, y, [r | 0, g | 0, bb | 0, 255]);
    }
  }

  // frequency gridline ROWS (no text labels — no font headless)
  for (const f of [100, 200, 440, 1000, 2000, 5000, 10000]) {
    if (f < fMin || f > fMax) continue;
    const frac = (Math.log2(f) - logMin) / (logMax - logMin);
    const y = Math.round((1 - frac) * (H - 1));
    cv.hline(y, 0, W - 1, GRID_SPEC);
  }

  return cv.toPng();
}

/* ---------------------------------------------------------------------------
   RMS / loudness — per-column dBFS → polyline. (index.html 670–690)
   --------------------------------------------------------------------------- */
export function rmsPng(rms, width = 1040, height = 120) {
  const cv = new Canvas(width, height, BG);
  const W = width, H = height;
  const dbTop = 0, dbBot = -80;

  // gridline rows at 0/-20/-40/-60 dB (no labels)
  for (const db of [0, -20, -40, -60]) {
    const y = Math.round((db - dbTop) / (dbBot - dbTop) * (H - 1));
    cv.hline(y, 0, W - 1, GRID);
  }

  // polyline
  let px = 0, py = 0;
  for (let x = 0; x < rms.length; x++) {
    const cx = Math.round(x / Math.max(1, rms.length - 1) * (W - 1));
    let db = rms[x]; if (db < dbBot) db = dbBot; if (db > dbTop) db = dbTop;
    const cy = Math.round((db - dbTop) / (dbBot - dbTop) * (H - 1));
    if (x === 0) { cv.setPixel(cx, cy, RMS_COLOR); }
    else { cv.line(px, py, cx, cy, RMS_COLOR); }
    px = cx; py = cy;
  }
  return cv.toPng();
}
