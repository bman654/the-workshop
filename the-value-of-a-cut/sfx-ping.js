'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["ping"] — take 2 — the oracle's brass grace-note.
//
// BRIEF: a faint brass ping when the oracle re-lights (value changed). A very
// soft, high, short bell tick — a FRACTION of the other cut-sounds' loudness,
// easy to miss, a grace note. dur ≈ 0.18.
//
// DIRECTION (take 2's own character): a STRUCK little brass idiophone — a tiny
// bell/triangle "tick" rather than a soft pure tone. To read as brass (not a
// sine beep) it carries a small comb of INHARMONIC bell partials (a real
// struck-bell/triangle spectrum: hum, prime, a tierce-ish minor third, quint,
// nominal) tuned so the PRIME clearly wins the pitch read. A single grain of
// high-passed noise gives the attack its "tick" chiff — the finger/mallet
// contact — then vanishes in a few ms. Very fast (~1 ms) cosine-smooth attack,
// short exponential decay (~120 ms) to true silence well inside the 0.18 s
// window. Master gain is deliberately TINY (~0.11 peak) so it sits far under
// the snip/chime/thud — a grace note you could miss.
//
// Pitch: PRIME at E7 (2637.02 Hz) — high and glassy, comfortably below the
// 11025 Hz Nyquist of the 22050 Hz render; all partials are Nyquist-gated so
// none aliases into a phantom off-key line.
//
// Deterministic: seeded mulberry32 PRNG (never Math.random) so the graph the
// audio-lens verifies is the exact graph that ships. Dual-use: runs against any
// BaseAudioContext (live AudioContext or OfflineAudioContext). Peaks well under
// 0 dBFS.
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['ping'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Seeded PRNG (mulberry32) — deterministic renders, no Math.random ───────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  var NYQ = ctx.sampleRate * 0.5;   // 11025 Hz at the 22050 render rate
  var SAFE = NYQ - 600;             // keep every partial clear of Nyquist

  // Master — a hard, gentle ceiling. This is the QUIET one of the suite: a
  // grace note. Kept low so it never competes with the snip/chime/thud.
  var master = ctx.createGain();
  master.gain.value = 0.34;
  master.connect(dest);

  // ── The struck-brass voice ──────────────────────────────────────────────────
  // A compact inharmonic comb modelled on a small struck bell/triangle. The
  // PRIME (ratio 1.00) is the pitch anchor and clearly dominant; the hum sits an
  // octave below to give a hint of body; the tierce/quint/nominal are the bright
  // metallic partials that make it read as BRASS not sine, kept quiet and
  // decaying faster so the ping OPENS bright and metallic then settles to a pure
  // ringing tick.
  //
  //   ratio      — multiple of the prime frequency
  //   gain       — relative amplitude (prime dominates → clean pitch read)
  //   decayScale — fraction of the base decay (upper partials = shorter)
  var PRIME = 2637.02;              // E7
  var VOICE = [
    { ratio: 0.500, gain: 0.16, decayScale: 1.00 }, // hum (octave down) — faint body
    { ratio: 1.000, gain: 1.00, decayScale: 0.92 }, // PRIME — pitch anchor (dominant)
    { ratio: 1.183, gain: 0.22, decayScale: 0.60 }, // tierce (minor-3rd-ish) — bell colour
    { ratio: 1.506, gain: 0.14, decayScale: 0.48 }, // quint — metallic brightness
    { ratio: 2.007, gain: 0.09, decayScale: 0.38 }  // nominal (octave) — airy sparkle
  ];

  var baseDecay = 0.120;            // ~120 ms ring — short, well inside 0.18 s
  var vel = 0.55 + rnd() * 0.06;    // gentle, tiny seeded variation

  for (var p = 0; p < VOICE.length; p++) {
    var P = VOICE[p];
    var f = PRIME * P.ratio;
    if (f >= SAFE) continue;        // never let a partial alias near Nyquist

    // Tiny deterministic inharmonic detune on the upper partials only — keeps
    // the metal "alive" without disturbing the prime's tuning (prime left exact).
    if (p !== 1) f *= 1 + (rnd() - 0.5) * 0.005;

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t0);

    var g = ctx.createGain();
    var decay = baseDecay * P.decayScale;
    var peak = vel * P.gain * 0.30; // the grace-note trim — a fraction of the suite

    // Very fast (~1 ms) smooth attack (a struck tick, no click), then a short
    // exponential fall to a whisper, then a brief linear glide to TRUE zero so
    // the tail ends silent (exponentialRamp can't reach 0).
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0005, t0 + decay);
    g.gain.linearRampToValueAtTime(0.0, t0 + decay + 0.015);

    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + decay + 0.03);
  }

  // ── Attack "tick" chiff ─────────────────────────────────────────────────────
  // One grain of high-passed noise, ~6 ms, gives the mallet/finger contact its
  // bright transient so the onset reads as a STRUCK tick rather than a fade-in
  // tone. Very quiet and gone almost immediately, so it colours only the attack.
  var CHIFF = 0.010;                // ~10 ms grain
  var nFrames = Math.max(1, Math.ceil(ctx.sampleRate * CHIFF));
  var nb = ctx.createBuffer(1, nFrames, ctx.sampleRate);
  var d = nb.getChannelData(0);
  for (var i = 0; i < nFrames; i++) d[i] = rnd() * 2 - 1;

  var noise = ctx.createBufferSource();
  noise.buffer = nb;

  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(4000, t0);   // keep only the bright top of the chiff
  hp.Q.setValueAtTime(0.7, t0);

  var ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t0);
  ng.gain.linearRampToValueAtTime(0.06, t0 + 0.001);      // faint — colours the attack only
  ng.gain.exponentialRampToValueAtTime(0.0004, t0 + CHIFF);
  ng.gain.linearRampToValueAtTime(0.0, t0 + CHIFF + 0.004);

  noise.connect(hp).connect(ng).connect(master);
  noise.start(t0);
  noise.stop(t0 + CHIFF + 0.01);

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.03); } catch (e) {}
    }
  };
};
