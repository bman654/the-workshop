/* ═══════════════════════════════════════════════════════════════════════════
   audio-gears.js  —  Gate.sfx.gears  —  mechanical clockwork turning

   The open-sequence "gears" phase (~2.5s of gear-spin). A dual-use procedural
   builder: schedule everything into `dest` against ANY BaseAudioContext (a live
   AudioContext when it ships, an OfflineAudioContext when it is verified), so the
   graph that is measured is the graph that ships. Fully deterministic — driven
   by a small seeded PRNG (mulberry32), never Math.random.

   Three layers (all peaks kept well under 0 dBFS, no clipping):
     (1) RUMBLE  — lowpassed white noise: the steady mass of turning metal.
     (2) RATCHET — short filtered click impulses at a steady seeded period
                   (~7.5/sec) with tiny per-click jitter, so the spectrogram
                   shows evenly spaced vertical click-streaks.
     (3) WHIR    — a faint sawtooth (~96 Hz) through a lowpass: a low tonal band
                   under the clicks. Slightly detuned second saw thickens it.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── mulberry32: tiny deterministic PRNG, seeded; returns floats in [0,1). ──
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  Gate.sfx.gears = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = opts.dur;
    var when = opts.when == null ? 0 : opts.when;
    var seed = opts.seed == null ? 1 : opts.seed;

    var t0 = ctx.currentTime + when;
    var sr = ctx.sampleRate;
    var rnd = mulberry32((seed >>> 0) || 1);

    // Master bus with a gentle fade in/out so the bed starts/ends without a
    // click transient. Keep the summed peak comfortably under 0 dBFS.
    var master = ctx.createGain();
    var fade = Math.min(0.08, dur * 0.1);
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(1, t0 + fade);
    master.gain.setValueAtTime(1, t0 + Math.max(fade, dur - fade));
    master.gain.linearRampToValueAtTime(0, t0 + dur);
    master.connect(dest);

    // ── Shared seeded noise buffer (white noise, [-1,1]); reused per layer. ──
    var noiseLen = Math.max(1, Math.ceil(sr * dur));
    var noiseBuf = ctx.createBuffer(1, noiseLen, sr);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) { nd[i] = rnd() * 2 - 1; }

    // ───────────────────────────────────────────────────────────────────────
    // LAYER 1 — RUMBLE: lowpassed noise, the steady turning mass.
    // ───────────────────────────────────────────────────────────────────────
    var rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = noiseBuf;
    var rumbleLP = ctx.createBiquadFilter();
    rumbleLP.type = 'lowpass';
    rumbleLP.frequency.setValueAtTime(220, t0);   // keep it low and dull
    rumbleLP.Q.setValueAtTime(0.7, t0);
    var rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.16, t0);
    rumbleSrc.connect(rumbleLP).connect(rumbleGain).connect(master);
    rumbleSrc.start(t0);
    rumbleSrc.stop(t0 + dur);

    // ───────────────────────────────────────────────────────────────────────
    // LAYER 2 — RATCHET: short filtered click impulses at a steady period.
    // Each click is one short slice of the noise buffer, band-passed bright and
    // wrapped in a fast decay envelope (a tick, not a thud). Tiny per-click
    // timing jitter keeps it mechanical, not metronomic — but the period stays
    // visible as evenly spaced streaks.
    // ───────────────────────────────────────────────────────────────────────
    var clickRate = 7.5;               // clicks per second (within 6–9)
    var period = 1 / clickRate;
    var clickDur = 0.045;              // short tick
    // First click after the fade-in so onsets are clean & countable.
    for (var ct = period; ct < dur - clickDur; ct += period) {
      var jitter = (rnd() - 0.5) * period * 0.12;   // ±6% of the period
      var ot = t0 + ct + jitter;

      var clickSrc = ctx.createBufferSource();
      clickSrc.buffer = noiseBuf;
      // Read a different noise slice per click for variety; deterministic.
      var off = Math.floor(rnd() * Math.max(1, (noiseLen - clickDur * sr - 1)));
      clickSrc.loop = false;

      var clickBP = ctx.createBiquadFilter();
      clickBP.type = 'bandpass';
      // Slight per-click center-freq variation: a small spread of gear teeth.
      var cf = 1600 + rnd() * 1400;     // 1600–3000 Hz: a crisp tick
      clickBP.frequency.setValueAtTime(cf, ot);
      clickBP.Q.setValueAtTime(4.5, ot);

      var clickEnv = ctx.createGain();
      clickEnv.gain.setValueAtTime(0, ot);
      clickEnv.gain.linearRampToValueAtTime(0.5, ot + 0.002);   // fast attack
      clickEnv.gain.exponentialRampToValueAtTime(0.0008, ot + clickDur);
      clickEnv.gain.setValueAtTime(0, ot + clickDur + 0.001);

      clickSrc.connect(clickBP).connect(clickEnv).connect(master);
      // Play just the slice we need (offset into the buffer, short duration).
      var startOff = off / sr;
      clickSrc.start(ot, startOff, clickDur + 0.005);
    }

    // ───────────────────────────────────────────────────────────────────────
    // LAYER 3 — WHIR: a faint low tonal band. Two slightly detuned sawtooths
    // through a lowpass — the continuous hum of the gear train turning.
    // ───────────────────────────────────────────────────────────────────────
    var whirLP = ctx.createBiquadFilter();
    whirLP.type = 'lowpass';
    whirLP.frequency.setValueAtTime(360, t0);   // keep the tonal energy LOW
    whirLP.Q.setValueAtTime(0.8, t0);
    var whirGain = ctx.createGain();
    whirGain.gain.setValueAtTime(0.10, t0);
    whirLP.connect(whirGain).connect(master);

    var baseHz = 96;                  // low fundamental (80–140 Hz band)
    var detunes = [0, +4];            // cents-ish; second saw thickens the hum
    var oscs = [];
    for (var k = 0; k < detunes.length; k++) {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseHz, t0);
      osc.detune.setValueAtTime(detunes[k], t0);
      // A gentle pitch settle as the train comes up to speed (subtle).
      osc.frequency.linearRampToValueAtTime(baseHz + 6, t0 + dur);
      var oscG = ctx.createGain();
      oscG.gain.setValueAtTime(0.5, t0);
      osc.connect(oscG).connect(whirLP);
      osc.start(t0);
      osc.stop(t0 + dur);
      oscs.push(osc);
    }

    // Live-use handle: stop everything at `at` (or now). Offline renders ignore.
    return {
      stop: function (at) {
        var when2 = at != null ? at : ctx.currentTime;
        try { rumbleSrc.stop(when2); } catch (e) {}
        for (var m = 0; m < oscs.length; m++) {
          try { oscs[m].stop(when2); } catch (e2) {}
        }
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
