'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["win"] — TAKE 1: "The lifting triad."
//
// A warm, glad victory chime: a three-note ASCENDING major arpeggio that resolves
// UPWARD, in the estate's organic-brass idiom (a small brass bell in a quiet
// garden, not a digital fanfare). Notes: F4 → A4 → C5 (an F-major triad, root
// position, climbing). Each note is a warm brass/bell voice — a dominant
// fundamental that anchors the pitch, a couple of clean lower partials for BRASS
// body/warmth, and a faint, fast-decaying inharmonic shimmer for the BELL attack.
//
// The three strikes are staggered ~110 ms apart and RING ON (they do not cut),
// so by the third note all three are sounding together as a sustained, warm
// F-major chord with C5 glinting on top — the "resolving upward" read. The chord
// then decays gently to silence inside `dur`.
//
// Craft choices:
//   • Attack is soft (~8 ms cosine-ish ramp) — a bell being lifted to, not struck
//     hard; no click, no chiff. Reads "gentle & glad", never punchy.
//   • The fundamental of each note is DOMINANT and exactly on pitch, so the lens
//     reads clean F4/A4/C5 with tight cents. Partials are quiet + slightly
//     detuned only on the top shimmer, so the metal is "alive" without smearing
//     the tuning.
//   • A gentle master ceiling + per-note velocity that eases toward the top keeps
//     the summed chord comfortably under 0 dBFS (no clipping when all three ring).
//   • Everything decays through a short linear glide to true zero so the tail ends
//     silent (exponentialRamp can never reach 0).
//
// Deterministic: seeded mulberry32 PRNG (never Math.random) so the graph the
// audio-lens verifies is the exact graph that ships. Dual-use: runs against any
// BaseAudioContext (live AudioContext or OfflineAudioContext). Peaks well under
// 0 dBFS.
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['win'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Seeded PRNG (mulberry32) — deterministic renders, no Math.random ───────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── Never let any partial alias near Nyquist (22050 Hz render → 11025 Hz) ──
  var NYQ = ctx.sampleRate * 0.5;
  var SAFE = NYQ - 800;

  // ── Master gain — a gentle ceiling so the summed sustained triad stays well
  //    under 0 dBFS even when all three notes ring together. ──────────────────
  var master = ctx.createGain();
  master.gain.value = 0.42;
  master.connect(dest);

  // ── The brass/bell voice for one note ──────────────────────────────────────
  // A dominant fundamental (pitch anchor) + two quiet clean harmonics (octave +
  // twelfth) that give a warm BRASS body + a faint, fast inharmonic shimmer that
  // gives a small BELL glint on the attack. All sines.
  //   ratio      — multiple of the fundamental
  //   gain       — relative amplitude (fundamental dominates → clean pitch read)
  //   decayScale — fraction of the note's base decay (upper partials shorter)
  //   detune     — whether to apply a tiny seeded inharmonic detune (metal alive)
  var VOICE = [
    { ratio: 1.000, gain: 1.00, decayScale: 1.00, detune: false }, // fundamental — pitch anchor
    { ratio: 2.000, gain: 0.24, decayScale: 0.90, detune: false }, // octave — warm brass body
    { ratio: 3.000, gain: 0.13, decayScale: 0.72, detune: false }, // twelfth — brass "reediness"
    { ratio: 4.760, gain: 0.075, decayScale: 0.40, detune: true }, // inharmonic — bell glint (brighter attack)
    { ratio: 6.900, gain: 0.038, decayScale: 0.30, detune: true }  // inharmonic — airy top sparkle
  ];

  // A note: fundamental freq, start time, velocity, and how long its body rings.
  function note(freq, at, vel, ringSec) {
    if (at >= t0 + dur) return;

    for (var p = 0; p < VOICE.length; p++) {
      var P = VOICE[p];
      var f = freq * P.ratio;
      if (f >= SAFE) continue; // never alias near Nyquist

      // Tiny deterministic inharmonic detune on the shimmer partials only — the
      // fundamental + clean harmonics stay exactly on pitch for a clean read.
      if (P.detune) f *= 1 + (rnd() - 0.5) * 0.006;

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, at);

      var g = ctx.createGain();
      var decay = ringSec * P.decayScale;
      var peak = vel * P.gain;

      // Gentle attack: ramp near-silence → peak over ~5 ms (a lifted bell, no
      // click; crisp enough that each of the three steps reads as its own onset),
      // then a long exponential fall to a whisper, then a short linear glide to
      // TRUE zero so the tail ends silent.
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0006, at + decay);
      g.gain.linearRampToValueAtTime(0.0, at + decay + 0.05);

      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + decay + 0.10);
    }
  }

  // ── The phrase: F-major triad climbing, staggered so it resolves into a chord ─
  //   F4  = 349.23  (root)
  //   A4  = 440.00  (major third)
  //   C5  = 523.25  (perfect fifth) — the glad top note
  // Stagger ~0.11 s; each note rings on so all three sustain together at the end.
  var STAGGER = 0.135;

  // Ring lengths: earlier notes ring longest so the whole triad sustains together
  // and decays as one warm chord. Fit comfortably inside dur (~0.6 s render, but
  // tails may exceed dur — they're clipped by the render length, and the linear
  // glide guarantees no discontinuity if they don't).
  //   F4 rings ~0.62 s, A4 ~0.55 s, C5 ~0.50 s.
  // Velocity eases slightly toward the top so C5 sits ATOP the chord, bright but
  // not harsh, and the summed peak stays well under 0 dBFS.
  var t = t0 + 0.015;                    // tiny lead-in so the very start isn't a click
  note(349.23, t + 0 * STAGGER, 0.62, 0.62); // F4 — root
  note(440.00, t + 1 * STAGGER, 0.56, 0.55); // A4 — major third
  note(523.25, t + 2 * STAGGER, 0.60, 0.50); // C5 — fifth, the glad resolving top

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.06); } catch (e) {}
    }
  };
};
