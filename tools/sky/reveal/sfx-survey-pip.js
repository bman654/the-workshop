'use strict';
/* ── SFX: "surveyPip" — a star kindles into the survey ── (ART FOUNDRY final) ──
   A star pricking alight over the dark observatory plate. Cooler + airier than
   the gate's brass snap-chime: a small, DISTANT struck tine heard across cold
   air, not a parlor bell and not a glassy sine ping.

   FOUNDRY SYNTHESIS — base = take-2 ("the star at distance, shimmering"), with
   the take-1 early-reflection HALO grafted on. The two judges split 1–1 (take-1
   vs take-2) but converged on the SAME final: take-2's dead-on C5+0c fundamental
   and ±3c chorus shimmer for the body + tune, plus take-1's halo as the
   load-bearing "distant, over-the-plate" AIR cue. Take-2 is the base because it
   already lands the dead-on pitch (take-1 reads +2c) and the safe middle centroid
   (take-1's climbs toward glassy); the halo is the one clean, low-risk graft.

   Voice:
   • the fundamental as a faint CHORUS — one exact sine (clean pitch anchor)
     flanked by two very quiet copies detuned ±~3 cents; their slow (~2 Hz) beat
     reads as a shimmering, faraway ring without pulling the pitch off C5.
   • a SOFTER strike (~4 ms attack) — a distant tap, no click.
   • a lean sub + clean octave for just enough warmth to stay bell-like, not sine.
   • ONE quiet inharmonic bell mode (~2.76×) for a struck-metal read, dialed back
     and decaying faster than the fundamental so it colours without muddying the
     pitch or re-brightening the tail toward glassy.
   • a whisper of high free-bar air (~5.4×) only at the very attack (Nyquist-gated).
   • a gentle lowpass opens a hair at the strike then closes toward the fundamental,
     so the short singing tail is a pure, cool, airy ring under rapid fire. Cutoffs
     scale with pitch, so the top of the ladder stays a hair airier, never harsh.
   • GRAFT (take-1): a single quiet EARLY-REFLECTION halo — a ~40 ms delayed,
     darkened copy of the strike at low gain — reads as air/distance over the plate
     without a full reverb tail. Its rnd() is consumed AFTER the voice loop so the
     grafted air never perturbs take-2's judged pitch/decay PRNG stream.

   `param` (0..1 = member step / (count-1)) climbs a major-pentatonic ladder
   (C5 .. E6) so a formation's members CLIMB as they kindle. The bench renders
   param=0 (C5); the ladder above it is deterministic math.

   Contract: Gate.sfx.surveyPip({ ctx, dest, dur, when=0, seed=1, param=0 }) -> {stop(at)}
   Deterministic (seeded mulberry32). Dual-use (live OR OfflineAudioContext). Peak << 1.
   ─────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};

window.Gate.sfx.surveyPip = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0 }) {
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

  // ── The rising major-pentatonic ladder (C5 penta .. E6) ────────────────────
  var SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
  var p = Math.max(0, Math.min(1, param));
  var f0 = SCALE[Math.min(SCALE.length - 1, Math.round(p * (SCALE.length - 1)))];

  // Keep every partial clear of Nyquist (22050 render → 11025) so nothing folds
  // back as a phantom off-key line — matters at the top of the ladder (E6).
  var NYQ = ctx.sampleRate * 0.5;
  var SAFE = NYQ - 800;

  // ── Lowpass: keep the tine COOL + airy, never glassy. Opens a hair at the
  // strike (letting the metallic transient through), then closes toward the
  // fundamental so the tail is a pure, soft, distant ring. Cutoff scales with
  // pitch so the top of the ladder stays a hair airier without going harsh.
  var lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.5;
  var openHz = Math.min(SAFE, f0 * 5.6);   // brief airy window at the attack
  var closeHz = Math.min(SAFE, f0 * 2.3);  // cool resting timbre (cooler than brass)
  lp.frequency.setValueAtTime(openHz, t0);
  lp.frequency.setTargetAtTime(closeHz, t0 + 0.007, 0.05);

  // ── Bus topology ───────────────────────────────────────────────────────────
  //   voice → lp → tone ──┬─────────────────────────────► master → dest  (dry)
  //                       └─ halo (delay + soft LP) → haloGain → master   (air)
  var master = ctx.createGain();
  master.gain.value = 0.115;               // QUIET — aim ≈ -14 dBFS peak under rapid fire
  master.connect(dest);

  var tone = ctx.createGain();             // shared node the (filtered) voice sums into
  tone.gain.value = 1.0;
  lp.connect(tone);
  tone.connect(master);                    // direct (dry) path

  // Early-reflection HALO (grafted from take-1) — the load-bearing "distant over
  // the plate" AIR cue both judges flagged as the hardest thing to get. A single
  // quiet, darkened, ~40 ms delayed copy of the strike: air, never a slap-echo.
  var haloDelay = ctx.createDelay(0.2);
  var haloLP = ctx.createBiquadFilter();
  haloLP.type = 'lowpass';
  haloLP.Q.value = 0.3;
  haloLP.frequency.value = Math.min(SAFE, f0 * 2.6);   // the reflection is softer/darker than the direct
  var haloGain = ctx.createGain();
  haloGain.gain.value = 0.16;                           // quiet — air, never a slap-echo
  tone.connect(haloDelay);
  haloDelay.connect(haloLP).connect(haloGain).connect(master);

  // Softer, distant strike (~4 ms) — no click, cooler than the brass snap.
  var attack = 0.004;

  // ── The fundamental as a faint CHORUS: one exact anchor + two quiet flankers
  // detuned ±~3 cents. Their slow beat is the "shimmering, distant, airy" read;
  // the exact tone dominates so the pitch stays cleanly C5. ───────────────────
  //   detCents — cents offset (0 = the exact pitch anchor)
  //   ratio    — multiple of the fundamental
  //   gain     — relative amplitude (the exact fundamental dominates)
  //   decayScale — fraction of the base decay
  var VOICE = [
    { ratio: 0.500, detCents: 0,    gain: 0.11, decayScale: 0.55 }, // lean sub — a little warmth/body
    { ratio: 1.000, detCents: -3.0, gain: 0.24, decayScale: 1.00 }, // chorus flank ▼ — airy shimmer
    { ratio: 1.000, detCents: 0,    gain: 1.00, decayScale: 1.00 }, // fundamental — the clean pitch anchor
    { ratio: 1.000, detCents: +3.0, gain: 0.24, decayScale: 1.00 }, // chorus flank ▲ — airy shimmer
    { ratio: 2.000, detCents: 0,    gain: 0.12, decayScale: 0.78 }, // clean octave — rounds the body
    { ratio: 2.760, detCents: 0,    gain: 0.115, decayScale: 0.58 },// inharmonic bell mode — struck-metal colour
    { ratio: 5.404, detCents: 0,    gain: 0.040, decayScale: 0.24 } // free-bar air — attack sparkle (Nyquist-gated)
  ];

  // Short singing tail for rapid fire; the whole note lives well within `dur`.
  var baseDecay = 0.33 + rnd() * 0.04;

  for (var i = 0; i < VOICE.length; i++) {
    var V = VOICE[i];
    var f = f0 * V.ratio * Math.pow(2, V.detCents / 1200);

    // Tiny inharmonic detune on the METAL modes keeps the tine "alive"; the sub,
    // octave, and (chorused) fundamental stay on their intended pitch.
    if (V.ratio === 2.760 || V.ratio === 5.404) {
      f *= 1 + (rnd() - 0.5) * 0.004;
    }
    if (f >= SAFE) continue;              // never alias near Nyquist

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t0);

    var g = ctx.createGain();
    var decay = baseDecay * V.decayScale;
    if (decay > D) decay = D;
    var peak = V.gain;

    // Quick warm attack (distant tap, no click), exponential fall to a whisper,
    // then a short linear glide to TRUE zero so the tail ends silent.
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0006, t0 + decay);
    g.gain.linearRampToValueAtTime(0.0, t0 + decay + 0.03);

    osc.connect(g).connect(lp);
    osc.start(t0);
    osc.stop(t0 + decay + 0.06);
  }

  // Halo delay time — a hair of seeded life so members in a rapid climb never
  // feel like clones. Consumed AFTER the voice loop so grafting the air does NOT
  // perturb take-2's judged pitch/decay PRNG stream (determinism preserved).
  haloDelay.delayTime.value = 0.038 + rnd() * 0.006;   // ~40 ms — a single soft reflection

  return {
    stop: function (at) {
      var w = (at != null) ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, w, 0.02); } catch (e) {}
    }
  };
};
