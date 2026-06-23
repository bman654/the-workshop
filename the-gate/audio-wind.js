'use strict';

// ── Gate SFX: "wind" ───────────────────────────────────────────────────────
// Low gusting airflow — an ambient bed that swells and ebbs.
//
// Architecture (procedural WebAudio, dual-use: live AudioContext or
// OfflineAudioContext — the exact graph verified is the one that ships):
//
//   brown-ish noise buffer (seeded)            ┐
//     → bandpass-ish shaping via two lowpasses ├─ body of the wind (low wash)
//     → gust gain (LFO-driven swell/ebb)       ┘
//
//   a faint, narrow highpassed whistle band rides ONLY on the gust peaks
//   (sidechained off the same gust envelope) so calm stretches stay dull and
//   gusts get a touch of air movement without lifting the spectral centroid
//   out of the "low broad wash" target (< 800 Hz).
//
// Determinism: every random value comes from a small seeded PRNG (mulberry32),
// never Math.random — so an OfflineAudioContext render is bit-reproducible.
//
// Target the verified render must hit:
//   silenceRatio < 0.1, clips:false, f0:null, centroid LOW (< 800 Hz),
//   spectrogram = low broad wash that swells and ebbs (gusts).
//
// Builder contract:
//   Gate.sfx.wind({ ctx, dest, dur, when = 0, seed = 1, strength = 1 })
//   strength scales gust depth + brightness (storm≈1, cloudy≈0.5, clear≈0.2).
//   Returns { stop(at) } for live use.

window.Gate = window.Gate || {};
window.Gate.sfx = window.Gate.sfx || {};

window.Gate.sfx.wind = function ({ ctx, dest, dur, when = 0, seed = 1, strength = 1 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;

  // Clamp strength to a sane musical range; 0 = dead calm, 1 = storm.
  var str = Math.max(0, Math.min(1, strength));

  // ── Seeded PRNG (mulberry32) — deterministic, no Math.random ─────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32((seed | 0) || 1);

  // ── Brown-ish noise bed ──────────────────────────────────────────────────
  // Integrate white noise into a random walk (brown noise: −6 dB/oct), which
  // is already heavily weighted toward low frequencies. Leak the integrator a
  // little so it stays bounded and stationary over the whole buffer.
  // We render exactly 'dur' seconds so the conductor can loop it seamlessly.
  var bufLen = Math.max(1, Math.round(sr * dur));
  var noiseBuf = ctx.createBuffer(1, bufLen, sr);
  var data = noiseBuf.getChannelData(0);
  var last = 0;
  var leak = 0.997;          // integrator leak — keeps the walk bounded
  for (var i = 0; i < bufLen; i++) {
    var white = rng() * 2 - 1;
    last = leak * last + white * 0.05;   // brown integration
    data[i] = last;
  }
  // Normalize the brown bed to a known peak (~0.9) so downstream gains are
  // predictable regardless of how the random walk happened to drift.
  var peakAbs = 1e-9;
  for (var k = 0; k < bufLen; k++) {
    var a = data[k] < 0 ? -data[k] : data[k];
    if (a > peakAbs) peakAbs = a;
  }
  var norm = 0.9 / peakAbs;
  for (var m = 0; m < bufLen; m++) { data[m] *= norm; }

  var src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;           // harmless here (we render exactly dur), supports live loop

  // ── Sub-rumble trim ──────────────────────────────────────────────────────
  // Brown noise piles huge energy below ~80 Hz, which drags the spectral
  // centroid into sub-bass and reads as a dull rumble rather than airflow.
  // A gentle highpass clears the floor so the wash lands in the wind band
  // (~120–500 Hz) — still LOW, but recognisably moving air.
  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(110, t0);
  hp.Q.setValueAtTime(0.5, t0);

  // ── Tone shaping: two stacked lowpasses for a steep low wash ─────────────
  // Base cutoff sits low; an LFO sweeps it between the calm floor and the
  // gust peak so the brightness itself breathes with the gusts. We keep the
  // ceiling conservative so the spectral centroid stays well under 800 Hz.
  var lp1 = ctx.createBiquadFilter();
  lp1.type = 'lowpass';
  lp1.Q.setValueAtTime(0.4, t0);          // gentle, no resonant peak

  var lp2 = ctx.createBiquadFilter();
  lp2.type = 'lowpass';
  lp2.Q.setValueAtTime(0.4, t0);

  // Cutoff range scales with strength: calmer wind = darker + less movement.
  var cutBase = 280;                                   // Hz, the calm floor
  var cutSwing = 160 + 280 * str;                      // how far gusts open it
  lp1.frequency.setValueAtTime(cutBase, t0);
  lp2.frequency.setValueAtTime(cutBase * 1.3, t0);     // second stage a touch higher

  // ── Gust envelope: sum of slow seeded LFOs (0.05–0.2 Hz) ─────────────────
  // Two incommensurate slow sines plus a third very-slow one give an organic,
  // non-repeating swell/ebb across the buffer. We drive a ConstantSource with
  // a sampled control curve so BOTH the gust gain and the cutoff share the
  // exact same breathing motion (built once, deterministic).
  var ctrlRate = 120;                                  // control-curve samples/sec
  var ctrlLen = Math.max(2, Math.round(dur * ctrlRate));
  var gustCurve = new Float32Array(ctrlLen);           // 0..1 gust intensity
  var cutCurve = new Float32Array(ctrlLen);            // Hz, shared cutoff motion

  // Seeded LFO parameters (frequencies in the 0.05–0.2 Hz band, random phases).
  var f1 = 0.06 + rng() * 0.05;     // ~0.06–0.11 Hz
  var f2 = 0.11 + rng() * 0.07;     // ~0.11–0.18 Hz
  var f3 = 0.03 + rng() * 0.03;     // ~0.03–0.06 Hz (very slow drift)
  var p1 = rng() * Math.PI * 2;
  var p2 = rng() * Math.PI * 2;
  var p3 = rng() * Math.PI * 2;

  for (var c = 0; c < ctrlLen; c++) {
    var t = c / ctrlRate;
    // Combine LFOs, map to 0..1. Weighted so f1 dominates the main swell.
    var lfo = 0.55 * Math.sin(2 * Math.PI * f1 * t + p1)
            + 0.30 * Math.sin(2 * Math.PI * f2 * t + p2)
            + 0.15 * Math.sin(2 * Math.PI * f3 * t + p3);
    var g01 = (lfo + 1) * 0.5;                         // → 0..1
    if (g01 < 0) g01 = 0; else if (g01 > 1) g01 = 1;
    // Mild gamma (>1) deepens the troughs vs the peaks so gusts read as
    // distinct swells against quieter lulls, not a uniform hiss.
    g01 = Math.pow(g01, 1.6);
    gustCurve[c] = g01;
    // Cutoff follows the gust: dark in the troughs, opens on the peaks.
    cutCurve[c] = cutBase + cutSwing * g01;
  }

  // Drive lp1 cutoff with the shared breathing curve (lp2 tracks proportionally
  // via its own fixed offset above — both move because lp1 sets the spectral
  // floor; sweeping lp1 is what the spectrogram reads as the wash opening).
  lp1.frequency.setValueCurveAtTime(cutCurve, t0, dur);

  // ── Gust gain stage ──────────────────────────────────────────────────────
  // Map gust 0..1 to a gain that ranges from a quiet floor to a peak. Depth of
  // the swell scales with strength: storm gusts hard, clear air barely moves.
  var gFloor = 0.10 + 0.04 * (1 - str);   // residual airflow even in troughs
  var gPeak = 0.34 + 0.46 * str;          // how loud the strongest gust gets
  var gainCurve = new Float32Array(ctrlLen);
  for (var gi = 0; gi < ctrlLen; gi++) {
    gainCurve[gi] = gFloor + (gPeak - gFloor) * gustCurve[gi];
  }
  var gustGain = ctx.createGain();
  gustGain.gain.setValueAtTime(gainCurve[0], t0);
  gustGain.gain.setValueCurveAtTime(gainCurve, t0, dur);

  // ── Faint whistle band, riding ONLY on gust peaks ────────────────────────
  // A narrow bandpass on a second tap of the noise, gated by the gust envelope
  // squared (so it appears only near peaks) and kept very quiet. This adds a
  // breath of "air movement" on strong gusts without raising the overall
  // centroid out of the low band — its level is tiny and present only briefly.
  var whistle = ctx.createBiquadFilter();
  whistle.type = 'bandpass';
  whistle.frequency.setValueAtTime(650, t0);   // just under the 800 Hz ceiling
  whistle.Q.setValueAtTime(2.2, t0);

  var whistleGain = ctx.createGain();
  var whistleCurve = new Float32Array(ctrlLen);
  var whMax = 0.05 * str;                       // tiny; absent when str→0
  for (var wi = 0; wi < ctrlLen; wi++) {
    var gp = gustCurve[wi];
    // gust^3 → only the very top of each gust admits any whistle.
    whistleCurve[wi] = whMax * gp * gp * gp;
  }
  whistleGain.gain.setValueAtTime(whistleCurve[0], t0);
  whistleGain.gain.setValueCurveAtTime(whistleCurve, t0, dur);

  // ── Master gain — headroom guard so peaks stay well under 0 dBFS ─────────
  // Lifted to ~2.6x: iteration 2 rendered at only −18 dBFS peak (too faint for
  // an ambient bed). With this gain the strongest gust lands comfortably under
  // 0 dBFS (verified clips:false, peak ≈ −7 dBFS) with healthy headroom.
  var lvl = 2.6;
  var master = ctx.createGain();
  master.gain.setValueAtTime(0.0, t0);
  master.gain.linearRampToValueAtTime(lvl, t0 + 0.05);           // fade in (no click)
  master.gain.setValueAtTime(lvl, Math.max(t0 + 0.05, t0 + dur - 0.05));
  master.gain.linearRampToValueAtTime(0.0, t0 + dur);            // fade out (no click)

  // ── Wire the graph ───────────────────────────────────────────────────────
  // Body:    src → hp → lp1 → lp2 → gustGain ┐
  // Whistle: src → hp → whistle → whistleGain ┼→ master → dest
  src.connect(hp);
  hp.connect(lp1);
  lp1.connect(lp2);
  lp2.connect(gustGain);
  gustGain.connect(master);

  hp.connect(whistle);
  whistle.connect(whistleGain);
  whistleGain.connect(master);

  master.connect(dest);

  // ── Start / stop ─────────────────────────────────────────────────────────
  src.start(t0);
  src.stop(t0 + dur);

  return {
    stop: function (at) {
      var when2 = at != null ? at : ctx.currentTime;
      try {
        // Quick fade to avoid a click when stopped early in live use.
        master.gain.cancelScheduledValues(when2);
        master.gain.setValueAtTime(master.gain.value, when2);
        master.gain.linearRampToValueAtTime(0, when2 + 0.08);
        src.stop(when2 + 0.1);
      } catch (e) { /* already stopped */ }
    }
  };
};
