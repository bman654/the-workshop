'use strict';
/*
 * Gate.sfx.rain — procedural rainfall (WebAudio, dual-use offline/live).
 *
 * Design (per the Sound Garden recipe):
 *   • A broadband noise BED, split into two parallel bands:
 *       - "sheet"  : a bright bandpass (~2.4 kHz, wide Q) for the hissing patter
 *                    that fills the upper spectrum — the steady wash of many drops.
 *       - "body"   : a lower bandpass (~600 Hz) for the rounded rumble/weight so
 *                    the rain doesn't read as pure white hiss.
 *   • DROPLET transients: sparse, very short filtered noise bursts at seeded
 *     random times — fine vertical speckle on the spectrogram, the individual
 *     drops landing.
 *   • A slow gain SHIMMER (sub-Hz LFO baked into the bed gain) so the wash
 *     gently breathes rather than sitting perfectly flat.
 *
 * Determinism: every random choice comes from a small seeded PRNG (mulberry32),
 * never Math.random — so a given {seed} renders bit-identical every time.
 *
 * Intensity: opts.intensity in [0,1] scales overall gain AND the brightness /
 * density of the sheet+droplets, letting the conductor cross-fade
 * clear < cloudy < storm from one builder. Defaults to a healthy "storm-ish"
 * steady rain that meets the verification target on its own.
 *
 * Headroom: all gains chosen so the summed peak stays well under 0 dBFS
 * (no clipping); verified via audio-lens.
 */
Gate.sfx = Gate.sfx || {};
Gate.sfx.rain = function ({ ctx, dest, dur, when = 0, seed = 1, intensity = 0.85 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;
  var I = Math.max(0, Math.min(1, intensity));   // clamp intensity to [0,1]

  // ── Seeded PRNG (mulberry32): deterministic uniform [0,1) ────────────────
  var a = (seed >>> 0) || 1;
  function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── A reusable white-noise buffer (the source for every band & droplet) ──
  // One buffer length covers the whole render; we read it through filters.
  var noiseLen = Math.max(1, Math.ceil(sr * dur));
  var noiseBuf = ctx.createBuffer(1, noiseLen, sr);
  var nd = noiseBuf.getChannelData(0);
  for (var i = 0; i < noiseLen; i++) {
    nd[i] = rng() * 2 - 1;                        // white noise in [-1,1)
  }

  // A master gain provides the slow shimmer + an overall level the caller can
  // ride. Everything (bed + droplets) feeds through it.
  var master = ctx.createGain();
  var baseLevel = 0.55 * (0.4 + 0.6 * I);          // intensity scales loudness
  master.gain.setValueAtTime(baseLevel, t0);
  // Slow gain shimmer: a sub-Hz wandering of the level so the wash breathes.
  // Baked as scheduled ramps (works in OfflineAudioContext) over ~0.45 Hz.
  var shimmerHz = 0.45;
  var shimmerDepth = 0.12 * baseLevel;             // gentle — ±12% of level
  var steps = Math.max(2, Math.ceil(dur * shimmerHz * 8));
  for (var s = 0; s <= steps; s++) {
    var tt = t0 + (dur * s) / steps;
    var ph = 2 * Math.PI * shimmerHz * (dur * s / steps) + rng() * 0.0; // phase
    var lvl = baseLevel + shimmerDepth * Math.sin(ph);
    master.gain.linearRampToValueAtTime(lvl, tt);
  }
  master.connect(dest);

  // ── SHEET band: the bright hissing patter that fills the upper spectrum ──
  var sheetSrc = ctx.createBufferSource();
  sheetSrc.buffer = noiseBuf;
  var sheetBP = ctx.createBiquadFilter();
  sheetBP.type = 'bandpass';
  // Center rises with intensity (2.0 kHz clear -> ~3.0 kHz storm); wide Q so the
  // band is a broad wash, not a whistle. This sets the spectral centroid.
  sheetBP.frequency.setValueAtTime(2000 + 1100 * I, t0);
  sheetBP.Q.setValueAtTime(0.5, t0);               // low Q => broad band
  // A high-shelf lift adds extra sparkle/air on top with intensity.
  var sheetShelf = ctx.createBiquadFilter();
  sheetShelf.type = 'highshelf';
  sheetShelf.frequency.setValueAtTime(3500, t0);
  sheetShelf.gain.setValueAtTime(2 + 5 * I, t0);   // up to +7 dB of air
  var sheetGain = ctx.createGain();
  sheetGain.gain.setValueAtTime(0.5, t0);
  sheetSrc.connect(sheetBP).connect(sheetShelf).connect(sheetGain).connect(master);
  sheetSrc.start(t0);
  sheetSrc.stop(t0 + dur);

  // ── BODY band: lower rounded weight so it isn't pure white hiss ──────────
  var bodySrc = ctx.createBufferSource();
  bodySrc.buffer = noiseBuf;
  var bodyBP = ctx.createBiquadFilter();
  bodyBP.type = 'bandpass';
  bodyBP.frequency.setValueAtTime(600, t0);        // ~400-900 Hz body
  bodyBP.Q.setValueAtTime(0.7, t0);
  var bodyGain = ctx.createGain();
  // Body is quieter than the sheet (keeps centroid up in the bright range) and
  // a touch louder at high intensity for storm weight.
  bodyGain.gain.setValueAtTime(0.18 + 0.12 * I, t0);
  bodySrc.connect(bodyBP).connect(bodyGain).connect(master);
  bodySrc.start(t0);
  bodySrc.stop(t0 + dur);

  // ── DROPLET transients: sparse short filtered noise bursts ───────────────
  // Density rises with intensity (light spatter -> heavy downpour). Each drop is
  // a tiny noise grain read from the shared buffer through a high bandpass,
  // enveloped to a short percussive tick. These create the fine vertical
  // speckle in the spectrogram.
  var dropsPerSec = 14 + 46 * I;                   // ~14 (clear) .. 60 (storm)
  var nDrops = Math.max(1, Math.round(dropsPerSec * dur));
  var dropBus = ctx.createGain();
  dropBus.gain.setValueAtTime(0.6, t0);
  dropBus.connect(master);

  for (var d = 0; d < nDrops; d++) {
    // Seeded time uniformly across the bed (leave a hair of tail room).
    var when_d = rng() * Math.max(0.0001, dur - 0.03);
    var td = t0 + when_d;
    var grainDur = 0.012 + rng() * 0.022;          // 12–34 ms tick

    var gsrc = ctx.createBufferSource();
    gsrc.buffer = noiseBuf;
    // Start reading from a random offset so each grain is a different texture.
    var offset = rng() * Math.max(0, dur - grainDur);

    var gbp = ctx.createBiquadFilter();
    gbp.type = 'bandpass';
    // Each drop pings at a slightly different bright frequency for variety.
    var fDrop = 2500 + rng() * 4000;               // 2.5–6.5 kHz
    gbp.frequency.setValueAtTime(fDrop, td);
    gbp.Q.setValueAtTime(3 + rng() * 4, td);       // tighter => more "tick"

    var genv = ctx.createGain();
    var dpeak = (0.10 + 0.10 * rng()) * (0.5 + 0.5 * I); // per-drop loudness
    genv.gain.setValueAtTime(0, td);
    genv.gain.linearRampToValueAtTime(dpeak, td + 0.001); // fast attack
    genv.gain.exponentialRampToValueAtTime(0.0008, td + grainDur); // quick decay
    genv.gain.setValueAtTime(0, td + grainDur + 0.001);

    gsrc.connect(gbp).connect(genv).connect(dropBus);
    gsrc.start(td, offset, grainDur + 0.01);
    gsrc.stop(td + grainDur + 0.02);
  }

  // ── Live-use handle: stop everything cleanly at a given time ─────────────
  return {
    stop: function (at) {
      var when_s = at != null ? at : ctx.currentTime;
      try { sheetSrc.stop(when_s); } catch (e) {}
      try { bodySrc.stop(when_s); } catch (e) {}
      // Drop grains are short and self-terminating; fade the master to avoid clicks.
      try {
        master.gain.cancelScheduledValues(when_s);
        master.gain.setValueAtTime(master.gain.value || baseLevel, when_s);
        master.gain.linearRampToValueAtTime(0, when_s + 0.05);
      } catch (e) {}
    }
  };
};
