'use strict';
/* ── SFX: "snap" — the warm brass snap-chime (star lace catches) ── FORGED ────
   The sound of a lace-line CATCHING a star. A small antique-orrery brass tine
   tapped soft: a warm, body-forward struck note — NOT a glassy sine ping, NOT a
   hard percussive click. Each successive snap in one figure rings one pentatonic
   step HIGHER, so lacing a figure CLIMBS (C5 up toward E6) — a rising, hopeful
   little ladder. `param` (0..1 = snap step / 8) selects the pitch up the scale.

   VOICING (ART FOUNDRY synth — take-1 base "warm body-forward tine" + take-2
   graft "the struck-BELL body"):
   • A dominant fundamental rounded by a faint sub-octave (0.5×) for felt warmth
     and a clean octave for body — the warm, in-tune pitch anchor.
   • ONE quiet inharmonic bell partial (~2.758×) — the classic struck-brass /
     bell mode. Grafted from take-2 but DIALED BACK and carried a little further
     into the ring (decaying faster than the fundamental) so it colors the metal
     as an unmistakable *struck bell* without muddying the clean fundamental+
     octave pitch read or re-brightening the tail toward glassy.
   • A tiny, fast-decaying comb of higher free-free bar modes (5.404×, Nyquist-
     gated) brightens ONLY the very attack, then clears.
   • A gentle lowpass opens a hair at the strike (letting the metallic transient
     through) then closes toward the fundamental so the tail is a pure warm ring
     — this is what keeps it non-glassy under rapid-fire lacing.

   Kin to the-cartographers-dream/sfx-ting.js and the gate's audio-windchimes.js
   (free-bar mode ratios, seeded PRNG, cosine-clean attack, glide to true zero).

   Contract: Gate.sfx.snap({ ctx, dest, dur, when=0, seed=1, param }) -> {stop(at)}
   Deterministic (seeded mulberry32). Dual-use (any BaseAudioContext). Peak << 1.
   ─────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};

window.Gate.sfx.snap = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0 }) {
  var t0 = ctx.currentTime + when;
  var D = (dur && dur > 0) ? dur : 0.6;

  // ── Seeded PRNG (mulberry32) — deterministic, never Math.random ────────────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── The rising pentatonic ladder (C5 penta .. E6) ──────────────────────────
  var SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
  var p = Math.max(0, Math.min(1, param));
  var f0 = SCALE[Math.min(SCALE.length - 1, Math.round(p * (SCALE.length - 1)))];

  // Keep every partial clear of Nyquist (22050 render → 11025) so nothing folds
  // back as a phantom off-key line — matters at the top of the ladder (E6).
  var NYQ = ctx.sampleRate * 0.5;
  var SAFE = NYQ - 800;

  // ── A gentle lowpass to keep the tine WARM, not glassy. It opens a hair at
  // the strike (letting the metallic attack through) then closes toward the
  // fundamental so the tail is pure and soft. Cutoff scales with pitch so the
  // top of the ladder stays a touch brighter (the brief calls for "a hair
  // brighter/warmer per step") without ever getting harsh.
  var lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.5;
  var openHz = Math.min(SAFE, f0 * 6.5);   // brief bright window at the attack
  var closeHz = Math.min(SAFE, f0 * 2.6);  // warm resting timbre
  lp.frequency.setValueAtTime(openHz, t0);
  lp.frequency.setTargetAtTime(closeHz, t0 + 0.006, 0.045);

  // ── Master: QUIET (rapid-fire; peak well under 1.0). Take-1 sat at ~-11 dBFS
  // (0.22 gain). Nudged down to 0.185 for a hair more overlap headroom (toward
  // the judges' ~-12 dBFS steer) while keeping take-1's warm presence.
  var master = ctx.createGain();
  master.gain.value = 0.185;
  lp.connect(master);
  master.connect(dest);

  // ── Voice: fundamental-dominant tine with a struck-bell inharmonic body.
  //   • a faint SUB-octave (0.5×) adds felt body/warmth without muddying pitch
  //   • the fundamental is the pitch anchor
  //   • a clean octave rounds the body
  //   • the ~2.758× inharmonic bell mode (GRAFTED from take-2, dialed back and
  //     carried a little further into the ring than take-1's attack-only comb)
  //     gives the unmistakable STRUCK-BRASS-BELL read — quiet, and decaying
  //     faster than the fundamental so it colors without muddying or re-
  //     brightening the tail.
  //   • a small free-free bar mode (5.404×) gives the metallic OPENING sparkle,
  //     kept quiet + short so pitch reads clean.
  //   ratio      — multiple of the fundamental
  //   gain       — relative amplitude (fundamental dominates)
  //   decayScale — fraction of the base decay (upper/sub = shorter)
  var VOICE = [
    { ratio: 0.500, gain: 0.16,  decayScale: 0.55 }, // sub-octave — warmth/body
    { ratio: 1.000, gain: 1.00,  decayScale: 1.00 }, // fundamental — pitch anchor
    { ratio: 2.000, gain: 0.14,  decayScale: 0.80 }, // clean octave — rounds body
    { ratio: 2.758, gain: 0.185, decayScale: 0.62 }, // GRAFT: struck-bell inharmonic body (carried into the ring)
    { ratio: 5.404, gain: 0.055, decayScale: 0.30 }  // free-bar mode — metallic top (Nyquist-gated)
  ];

  // Short singing tail for rapid fire: the whole note lives well within `dur`.
  // Base decay ~0.34 s with a hair of seeded life so repeats don't feel cloned.
  var baseDecay = 0.34 + rnd() * 0.05;

  for (var i = 0; i < VOICE.length; i++) {
    var V = VOICE[i];
    var f = f0 * V.ratio;
    if (f >= SAFE) continue;              // never alias near Nyquist

    // Tiny inharmonic detune on the metal modes keeps the brass "alive"; the
    // fundamental, sub, and octave stay exactly on pitch for a clean read.
    if (V.ratio !== 0.5 && V.ratio !== 1.0 && V.ratio !== 2.0) {
      f *= 1 + (rnd() - 0.5) * 0.004;
    }

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t0);

    var g = ctx.createGain();
    var decay = baseDecay * V.decayScale;
    var peak = V.gain;

    // Quick warm attack (~2.5 ms — struck tine, no click), long-ish exponential
    // fall to a whisper, then a short linear glide to TRUE zero so the tail ends
    // silent (exponentialRamp cannot reach 0).
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.0025);
    g.gain.exponentialRampToValueAtTime(0.0006, t0 + decay);
    g.gain.linearRampToValueAtTime(0.0, t0 + decay + 0.03);

    osc.connect(g).connect(lp);
    osc.start(t0);
    osc.stop(t0 + decay + 0.06);
  }

  return {
    stop: function (at) {
      var w = (at != null) ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, w, 0.02); } catch (e) {}
    }
  };
};
