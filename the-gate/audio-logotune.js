'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["logotune"] — "The Glass Staircase" (FINAL logotune for The Gate)
//
// A short, memorable resolving motif on a CELESTA / MUSIC-BOX (glass) timbre.
// Built from the winning candidate (a crisp music-box arpeggio that reads as a
// dead-on in-tune ascending-then-settling staircase) and warmed with two grafts
// from the runner-up's glass-bell pad:
//   • LONGER, OVERLAPPING DECAYS — each step now blooms out of the still-ringing
//     previous note, so the plinks gain warmth/sustain without losing the clean
//     staircase shape. Tails fan into one another on the spectrogram.
//   • A GENTLE CRESCENDO INTO THE TONIC — velocities swell as the line climbs so
//     the final tonic A lands more decisively (a "warm resolve").
//   • A VERY-QUIET HIGH AIR-BED sine under the whole phrase for a faint crystal
//     shimmer floor — kept well below the runner-up's level so it adds breath,
//     not haze (the staircase stays the brightest thing on the spectrogram).
//
// The motif — an ascending A-major arpeggio that rises through the triad to the
// octave, settles, and resolves on the tonic:
//   A4 → C#5 → E5 → A5   (clean rise through the triad to the octave)
//   → E5 → A5            (settle to the 5th, then LAND on the tonic A5)
// The final tonic A5 is held the LONGEST and brightest — the clearly-longest
// tail sells the resolution (a trick demonstrated by candidate #3).
//
// Each note = dominant sine fundamental (the pitch anchor the lens reads) + a
// soft octave (2nd harmonic) for warmth + a faint glassy ~4x upper partial (the
// comb-tooth "ting"). Upper partials decay faster than the fundamental, so each
// note opens bright then mellows to a pure ringing tone — exactly a celesta.
//
// Equal-temperament exact frequencies (440 / 554.37 / 659.25 / 880) so pitch
// reads dead-on. Deterministic: a small seeded mulberry32 PRNG (NEVER Math.random)
// drives only a tiny (<0.0015) shimmer detune on upper partials + the air-bed —
// never enough to shift the read pitch. Mono-safe; master gain keeps overlapping
// bell tails comfortably under 0 dBFS (no clipping).
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['logotune'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Small seeded PRNG (mulberry32) — deterministic renders, no Math.random ──
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── The motif — an ascending A-MAJOR arpeggio that rises then resolves to the
  // tonic A. Frequencies are exact equal-temperament so the lens reads each note
  // in tune (within a couple of cents). The phrase:
  //   A4 → C#5 → E5 → A5   (clean rise through the triad to the octave)
  //   → E5 → A5            (settle: fall back to the 5th, then LAND on tonic A5)
  // The final, longest, slightly-louder note is the tonic A — the resolution.
  var A4  = 440.00;   // tonic (low)
  var Cs5 = 554.37;   // major 3rd
  var E5  = 659.25;   // perfect 5th
  var A5  = 880.00;   // tonic (octave) — the home note
  var E5b = 659.25;   // 5th again on the settle

  // note: { f: freq, at: start (s into window), dec: decay length, vel }
  // Music-box pacing: ~0.42 s between onsets. Decays are now LONGER than the
  // onset spacing (the c2 graft), so each step blooms out of the still-ringing
  // previous note — tails OVERLAP into a warm staircase rather than isolated
  // plinks. Velocities rise into the tonic (gentle crescendo → decisive resolve).
  var NOTES = [
    { f: A4,  at: 0.10, dec: 0.95, vel: 0.56 },
    { f: Cs5, at: 0.52, dec: 0.98, vel: 0.60 },
    { f: E5,  at: 0.94, dec: 1.02, vel: 0.64 },
    { f: A5,  at: 1.36, dec: 1.08, vel: 0.70 },
    { f: E5b, at: 1.86, dec: 0.90, vel: 0.62 }, // gentle settle on the 5th
    { f: A5,  at: 2.28, dec: 1.55, vel: 0.82 }  // RESOLVE — tonic, longest + brightest
  ];

  var NYQ = ctx.sampleRate * 0.5;
  var SAFE = NYQ - 600; // keep partials clear of Nyquist to avoid aliasing fold-back

  // Celesta/music-box partial structure. The fundamental DOMINATES (so pitch reads
  // clean); a soft octave (2nd harmonic) warms it; a faint glassy upper partial
  // (~4x, the bar/comb-tooth "ting") gives the bright mallet shimmer. Upper
  // partials decay faster than the fundamental so each note opens bright then
  // mellows to a pure ringing tone.
  var PARTIALS = [
    { ratio: 1.000, gain: 1.00, decayScale: 1.00 }, // fundamental — pitch anchor
    { ratio: 2.000, gain: 0.34, decayScale: 0.72 }, // octave, warmth
    { ratio: 4.010, gain: 0.14, decayScale: 0.42 }  // glassy "ting" (slightly stretched)
  ];

  // Master gain keeps overlapping bell tails comfortably under 0 dBFS. Slightly
  // lower than the winner's 0.42 because the longer decays mean more notes ring
  // simultaneously (the overlap), plus the air-bed.
  var master = ctx.createGain();
  master.gain.value = 0.38;
  master.connect(dest);

  // ── Faint high air-bed (the c2 graft, kept VERY subtle) ─────────────────────
  // A very quiet high sine that swells in and out under the whole phrase — a
  // crystal shimmer floor that adds breath without hazing the staircase. Held at
  // 0.008 (well below c2's 0.012) and up in the ~A6 region so it sits as a faint
  // top sheen, never competing with the note fundamentals for the pitch read.
  (function airBed() {
    var f = A5 * 1.5 * (1 + (rnd() - 0.5) * 0.004); // ~1320 Hz, comfortably below SAFE
    if (f >= SAFE) return;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t0);
    var g = ctx.createGain();
    var end = t0 + dur;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.008, t0 + dur * 0.5); // slow swell in
    g.gain.linearRampToValueAtTime(0.0001, end - 0.05);    // slow fade out
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(end);
  })();

  // ── A single celesta note: its dominant fundamental + warm octave + glassy
  // "ting" partial, each with a fast mallet attack and a bell-ish decay. ────────
  function playNote(at, freq, decay, vel) {
    if (at >= t0 + dur) return;
    for (var p = 0; p < PARTIALS.length; p++) {
      var P = PARTIALS[p];
      var f = freq * P.ratio;
      if (f >= SAFE) continue; // skip partials that would alias near Nyquist

      // Tiny deterministic detune on the upper partials only (a touch of glass
      // shimmer) — kept far too small to shift the read pitch.
      if (p > 0) f *= 1 + (rnd() - 0.5) * 0.0015;

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, at);

      var g = ctx.createGain();
      var dcy = decay * P.decayScale;
      // Clamp the tail so it never rings past the render window (avoids a chopped
      // exponential that would read as a click).
      var maxD = (t0 + dur) - at - 0.05;
      if (dcy > maxD) dcy = maxD;
      if (dcy < 0.05) dcy = 0.05;

      var peak = vel * P.gain;

      // Fast mallet attack (~8 ms) then a bell-ish exponential decay.
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0006, at + dcy);
      g.gain.linearRampToValueAtTime(0.0, at + dcy + 0.04); // clean tail to silence

      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + dcy + 0.08);
    }
  }

  for (var i = 0; i < NOTES.length; i++) {
    var nt = NOTES[i];
    playNote(t0 + nt.at, nt.f, nt.dec, nt.vel);
  }

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.06); } catch (e) {}
    }
  };
};
