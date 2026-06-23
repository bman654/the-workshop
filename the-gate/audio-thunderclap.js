/* ═══════════════════════════════════════════════════════════════════════════
   audio-thunderclap.js  —  Gate.sfx.thunderclap  (procedural WebAudio)

   The Gate's lightning thunderclap: a sharp broadband CRACK at t=0 that decays
   fast into a low rolling BODY/slap. Triggered on each lightning strike, synced
   to the visual flash edge — so all the energy lives at the very start.

   Architecture (per the Gate sfx contract): a dual-use builder that schedules a
   self-contained one-shot into `dest` against ANY BaseAudioContext (a live
   AudioContext when it ships, an OfflineAudioContext when it is verified). The
   exact graph rendered offline for audio-lens is the one that ships.

   Three layered voices, all driven from one deterministic seeded noise bed:
     1. CRACK  — broadband noise, ~1ms attack, hard ~55ms exp decay, highpassed
                 so the onset reads as a bright vertical slab at t=0.
     2. BODY   — lowpassed noise, ~300ms, with a DOWNWARD lowpass sweep so the
                 spectrum rolls from mid into low as it decays (the rumble).
     3. SUB    — a brief ~48 Hz sine thump that adds chest weight and pulls the
                 spectral centroid mid-to-low. No sustained pitch (decays in
                 ~120ms, far too short for f0 detection on the full clip).

   No ringing, no stable pitch. Peaks held well under 0 dBFS. Seeded PRNG only.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── mulberry32: tiny deterministic PRNG → floats in [0,1). NOT Math.random. ──
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Fill a mono AudioBuffer with deterministic white noise in [-1,1]. ────────
  function makeNoiseBuffer(ctx, seed, seconds) {
    var n = Math.max(1, Math.round(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0);
    for (var i = 0; i < n; i++) {
      data[i] = rnd() * 2 - 1;
    }
    return buf;
  }

  Gate.sfx.thunderclap = function (opts) {
    opts = opts || {};
    var ctx  = opts.ctx;
    var dest = opts.dest;
    var dur  = opts.dur != null ? opts.dur : 2.5;
    var when = opts.when != null ? opts.when : 0;
    var seed = opts.seed != null ? opts.seed : 1;

    var t0 = ctx.currentTime + when;

    // One shared noise bed covers every noise voice (offset reads keep them
    // distinct yet fully deterministic from `seed`). Length is bounded so we
    // never over-allocate on long `dur` values — the clap lives in < 0.6s.
    var bedSec = Math.min(dur, 1.2);
    var noise = makeNoiseBuffer(ctx, seed * 2654435761, bedSec);

    // Master bus → dest, so the whole clap sits comfortably under 0 dBFS with
    // a few dB of headroom (the three voices can momentarily align in phase).
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.62, t0);
    master.connect(dest);

    // ── Voice 1: the CRACK ─────────────────────────────────────────────────
    // Broadband noise, near-instant attack, hard exponential decay. A gentle
    // highpass keeps it crisp (not muddy) so it paints a bright full-height
    // vertical slab at t=0.
    var crackSrc = ctx.createBufferSource();
    crackSrc.buffer = noise;
    var crackHP = ctx.createBiquadFilter();
    crackHP.type = 'highpass';
    crackHP.frequency.setValueAtTime(700, t0);
    crackHP.Q.setValueAtTime(0.5, t0);
    var crackG = ctx.createGain();
    var crackDecay = 0.055;                 // ~55ms body of the crack
    crackG.gain.setValueAtTime(0.0001, t0);
    crackG.gain.linearRampToValueAtTime(0.95, t0 + 0.001);   // ~1ms attack
    crackG.gain.exponentialRampToValueAtTime(0.0008, t0 + crackDecay);
    crackG.gain.setValueAtTime(0, t0 + crackDecay + 0.005);
    crackSrc.connect(crackHP).connect(crackG).connect(master);
    crackSrc.start(t0);
    crackSrc.stop(t0 + crackDecay + 0.02);

    // ── Voice 2: the BODY / slap ───────────────────────────────────────────
    // Lowpassed noise with a DOWNWARD cutoff sweep: starts mid (energy near the
    // crack), then collapses toward the low end as it decays — the spectrogram
    // shows the slab tilting/rolling down into the low rumble.
    var bodySrc = ctx.createBufferSource();
    bodySrc.buffer = noise;
    bodySrc.playbackRate.setValueAtTime(0.85, t0); // slightly darker grain
    var bodyLP = ctx.createBiquadFilter();
    bodyLP.type = 'lowpass';
    bodyLP.Q.setValueAtTime(0.7, t0);
    bodyLP.frequency.setValueAtTime(2600, t0);
    bodyLP.frequency.exponentialRampToValueAtTime(320, t0 + 0.30);
    var bodyG = ctx.createGain();
    var bodyDecay = 0.34;
    bodyG.gain.setValueAtTime(0.0001, t0);
    bodyG.gain.linearRampToValueAtTime(0.85, t0 + 0.004); // very fast, just behind the crack
    bodyG.gain.exponentialRampToValueAtTime(0.0006, t0 + bodyDecay);
    bodyG.gain.setValueAtTime(0, t0 + bodyDecay + 0.005);
    bodySrc.connect(bodyLP).connect(bodyG).connect(master);
    bodySrc.start(t0);
    bodySrc.stop(t0 + bodyDecay + 0.02);

    // ── Voice 3: the SUB thump ─────────────────────────────────────────────
    // A short low sine "boom" for chest weight that pulls the centroid down.
    // Pitch glides down (no fixed tone) and decays in ~120ms — too brief to
    // register as a stable f0 over the whole clip.
    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(62, t0);
    sub.frequency.exponentialRampToValueAtTime(38, t0 + 0.12);
    var subG = ctx.createGain();
    subG.gain.setValueAtTime(0.0001, t0);
    subG.gain.linearRampToValueAtTime(0.55, t0 + 0.006);
    subG.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.13);
    subG.gain.setValueAtTime(0, t0 + 0.14);
    sub.connect(subG).connect(master);
    sub.start(t0);
    sub.stop(t0 + 0.16);

    // Live-use handle: hard-stop everything at `at` (or now).
    return {
      stop: function (at) {
        var when2 = at != null ? at : ctx.currentTime;
        try { crackSrc.stop(when2); } catch (e) {}
        try { bodySrc.stop(when2); } catch (e) {}
        try { sub.stop(when2); } catch (e) {}
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
