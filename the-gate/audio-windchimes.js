'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["windchimes"] — a few gentle tuned bell strikes.
//
// FINAL synthesis: c3's "Glass Bells" form (sparse, mostly-ascending pentatonic
// walk; long 2–4 s rings; clear air between strikes) grafted with c1's richer,
// brighter metallic attack so each opening transient reads more clearly as a
// CHIME rather than a soft sine.
//
// What carries over from c3 (the asset to keep):
//   • Sparse, deliberate, mostly-ASCENDING phrase A4→C5→D5→E5→G5.
//   • Long exponential decay (2–4 s) per strike; generous ~0.7–1.4 s gaps.
//   • Dominant fundamental → clean ±cents tuning, sparse resolving form.
//   • Clean ~3 ms cosine-smooth attack (no click/chiff).
//
// What is grafted in from c1 (brighter, more "metallic shimmer" opening):
//   • c1's explicit aluminium free-free bar mode ratios 1 : 2.758 : 5.404 :
//     8.930 — these give a characterful, bell-like opening transient and a
//     higher centroid that reads as "chime". They are quiet relative to the
//     fundamental and decay faster, so they brighten the attack then mellow to a
//     pure ringing tone; the fundamental still clearly wins the pitch read.
//   • One extra prominent-but-quiet, micro-detuned upper partial (the 2.758
//     free-bar mode) brightens the staircase without disturbing the clean tuning
//     or the sparse form.
//   • From c2: a touch more inter-strike air variation + slightly varied velocity
//     per strike so the gaps feel natural — WITHOUT shortening c3's long ring.
//
// Deterministic: seeded mulberry32 PRNG (never Math.random) so the graph the
// audio-lens verifies is the exact graph that ships. Dual-use: runs against any
// BaseAudioContext (live AudioContext or OfflineAudioContext). Peaks well under
// 0 dBFS.
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['windchimes'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Seeded PRNG (mulberry32) — deterministic renders, no Math.random ───────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── Pentatonic fundamentals (A minor pentatonic, octave A4) ────────────────
  var PENT = [440.00, 523.25, 587.33, 659.25, 783.99]; // A4 C5 D5 E5 G5

  // Keep partials clear of Nyquist (22050 Hz render → Nyquist 11025 Hz) so no
  // partial aliases and folds back as a phantom off-key line.
  var NYQ = ctx.sampleRate * 0.5;
  var SAFE = NYQ - 800;

  // Master gain — sparse hits rarely overlap, but a gentle ceiling keeps the sum
  // comfortably under 0 dBFS even when two bell tails briefly coincide. Trimmed
  // slightly vs c3 because the grafted upper partials add energy to the attack.
  var master = ctx.createGain();
  master.gain.value = 0.50;
  master.connect(dest);

  // ── A single glass/metal bell strike ───────────────────────────────────────
  // Voice = a dominant fundamental (the pitch anchor) + a faint clean octave to
  // round the body + a small comb of c1's aluminium free-bar inharmonic modes
  // for the bright "metallic shimmer" attack. All sines. The fundamental decays
  // slowest; the upper inharmonic partials are quieter and decay faster, so the
  // bell OPENS bright and chime-like then settles to a pure ringing tone.
  //
  //   ratio      — multiple of the fundamental
  //   gain       — relative amplitude (fundamental dominates so pitch reads clean)
  //   decayScale — fraction of the strike's base decay length (upper = shorter)
  //
  // The 2.758 / 5.404 / 8.930 ratios are the free-free aluminium bar modes from
  // c1. They sit far above the octave, so the lens never mistakes them for a
  // played pentatonic note; kept quiet so the fundamental clearly wins the read.
  var VOICE = [
    { ratio: 1.000, gain: 1.00, decayScale: 1.00 }, // fundamental — pitch anchor (dominant)
    { ratio: 2.000, gain: 0.10, decayScale: 0.85 }, // clean octave — rounds the body
    { ratio: 2.758, gain: 0.20, decayScale: 0.66 }, // free-bar mode 1 — bright chime shimmer
    { ratio: 5.404, gain: 0.09, decayScale: 0.50 }, // free-bar mode 2 — metallic top
    { ratio: 8.930, gain: 0.035, decayScale: 0.38 } // free-bar mode 3 — airy sparkle (Nyquist-gated)
  ];

  function strike(at, freq, vel) {
    if (at >= t0 + dur) return;

    // One shared decay length per strike (2–4 s) so the whole bell rings as a
    // coherent voice; per-partial decayScale then shortens the upper partials.
    var baseDecay = 2.0 + rnd() * 2.0;

    for (var p = 0; p < VOICE.length; p++) {
      var P = VOICE[p];
      var f = freq * P.ratio;
      if (f >= SAFE) continue; // never let a partial alias near Nyquist

      // Tiny deterministic inharmonic detune on the upper partials only — keeps
      // the metal "alive" and shimmering without disturbing the fundamental's
      // tuning. (Fundamental p===0 is left exactly on pitch.)
      if (p > 0) f *= 1 + (rnd() - 0.5) * 0.004;

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, at);

      var g = ctx.createGain();
      var decay = baseDecay * P.decayScale;
      var peak = vel * P.gain;

      // Clean attack: ramp from near-silence to peak over ~3 ms (no click), then
      // a long exponential fall to a whisper, with a short linear glide to true
      // zero so the tail ends silent (exponentialRamp can't reach 0).
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0006, at + decay);
      g.gain.linearRampToValueAtTime(0.0, at + decay + 0.06);

      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + decay + 0.12);
    }
  }

  // ── Phrase: a calm, mostly-ASCENDING pentatonic walk with air between hits ──
  // Five strikes climbing A4→C5→D5→E5→G5 with occasional small deterministic
  // dips/holds so it reads as a gentle ascent rather than a strict scale.
  var NUM_STRIKES = 5;
  var when_t = t0 + 0.12 + rnd() * 0.10; // first hit just after the start
  var idx = 0;                            // begin on the low anchor (A4)

  for (var kk = 0; kk < NUM_STRIKES; kk++) {
    if (when_t >= t0 + dur - 0.20) break;

    var freq = PENT[idx];

    // Velocity: gentle, with seeded variation so no two bells share a level and
    // the phrase breathes (a touch softer toward the top of the ascent). c2's
    // wider per-strike velocity variation keeps the dynamics natural.
    var vel = 0.44 + rnd() * 0.18 - idx * 0.015;
    if (vel < 0.30) vel = 0.30;
    if (vel > 0.62) vel = 0.62;

    strike(when_t, freq, vel);

    // Advance the ascent: usually step up one pentatonic degree; occasionally
    // hold or dip a step for a natural, non-mechanical feel. Clamp to the set.
    var move = rnd();
    if (move < 0.70) idx += 1;        // step up (the dominant motion)
    else if (move < 0.88) idx += 0;   // repeat the same note
    else idx -= 1;                    // small dip
    if (idx > PENT.length - 1) idx = PENT.length - 1;
    if (idx < 0) idx = 0;

    // Air between hits: ~0.7–1.5 s, seeded (slightly broadened per c2) so each
    // line in the spectrogram is clearly separated by clear air.
    var gap = 0.70 + rnd() * 0.80;
    when_t += gap;
  }

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.08); } catch (e) {}
    }
  };
};
