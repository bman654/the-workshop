'use strict';
/* ── SFX: "surveyChart" — the survey charts a new formation ── (FOUNDRY final) ───
   A constellation completes in the front-door Survey of Heaven and its engraved
   name is written into the estate's night sky. This is the RESOLVE — the landing,
   "…and it is named." An observatory plate being inked at night: distant, calm, a
   little awed — NOT the gate's brass fanfare, NOT an arcade sting.

   Synthesized from the foundry takes (base = "The Plate Is Inked"): the melody now
   climbs a true pentatonic LADDER star-by-star — C4·D4·E4·G4 — lifts to the wistful
   pentatonic 6th (A4) as a breath before the name, then RESOLVES onto a genuinely
   SUSTAINED tonic octave. The struck celeste tonic lands ON TOP OF a soft glass PAD
   (C5 body + a C4 body octave + a C6 shimmer that swells in and TWINKLES ~5 Hz as
   the name inks) which swells up under the last note and HOLDS — so the tonic truly
   sustains and rings, the way an observatory plate settles rather than a fanfare
   that stops. Warm not glassy (upper partials gently lowpassed and kept low). A low
   C3 root swell breathes underneath, felt not heard, well below the melody, and
   recedes before the tonic tail so the resolve rings alone (this keeps the melody —
   not the swell — leading the global pitch read). Kin to the-gate/audio-logotune.js
   ("The Glass Staircase") and a-sky-you-name/sfx-settle.js's held-swell resolve,
   but its own quieter, more distant voice.

   TUNING: melody intervals are JUST-INTONATION major-pentatonic ratios off the
   keyed root R (C 1 · D 9/8 · E 5/4 · G 3/2 · A 5/3 · octave 2) — clean, consonant,
   celeste-warm. param (0..1) keys R to a C major-pentatonic degree so every
   formation sings its own consonant note; the bench renders param=0 -> R = C4, and
   the resolve tonic octave (2R = C5) is the strongest, in-tune landing.

   QUIET: master trimmed so overlapping tails + pad + swell peak near -9 dBFS, no
   clip. Deterministic (seeded mulberry32 — never Math.random; drives only sub-cent
   shimmer detune on upper partials + a tiny twinkle-LFO variance, never the pitch
   read). Dual-use (live OR OfflineAudioContext). Contract:
     Gate.sfx.surveyChart({ ctx, dest, dur, when=0, seed=1, param=0 }) -> {stop(at)}
   ─────────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};

window.Gate.sfx.surveyChart = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0 }) {
  var t0 = ctx.currentTime + when;
  var D = (dur && dur > 0) ? dur : 2.8;

  // ── seeded PRNG (mulberry32) — deterministic, never Math.random ──────────────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── ROOT keyed by param: a major-pentatonic degree of C4 (always consonant). ──
  var C4 = 261.6256;
  var PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];      // C D E G A
  var pn = Math.max(0, Math.min(1, param));
  var R = C4 * PENTA[Math.min(PENTA.length - 1, Math.round(pn * (PENTA.length - 1)))];

  // Melody degrees = JUST-INTONATION pentatonic ratios off R (clean, celeste-warm).
  var DEG2 = 9 / 8;    // major 2nd (D)
  var MAJ3 = 5 / 4;    // major 3rd (E)
  var FIF  = 3 / 2;    // perfect 5th (G)
  var SIX  = 5 / 3;    // major 6th (A) — the wistful breath before the name
  var OCT  = 2;        // octave (tonic, high) — the resolve

  var NYQ = ctx.sampleRate * 0.5, SAFE = NYQ - 900;

  // ── Master submix + a gentle body lowpass to keep the glass WARM not harsh. ───
  var master = ctx.createGain();
  master.gain.value = 0.390;                // trimmed for headroom; tuned to ~-9 dBFS peak
  var warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.Q.value = 0.4;
  warm.frequency.setValueAtTime(4450, t0);  // a touch more glass than the base, still warm/un-harsh
  warm.connect(master);
  master.connect(dest);

  // ── The pentatonic LADDER rise → a lift to the 6th → the sustained tonic resolve
  //    (start-times into the window). Onsets are unhurried (observatory pace);
  //    decays overlap so tails fan into one warm staircase; velocities swell gently
  //    into the resolve. ───────────────────────────────────────────────────────────
  //    C4 -> D4 -> E4 -> G4   (the ladder: member-stars lighting one-by-one)
  //    -> C5                  (crest of the ladder — the tonic octave begins to ring)
  //    -> A4                  (a wistful sigh DOWN to the pentatonic 6th — a breath before the name)
  //    -> C5                  (RESOLVE — the sustained tonic octave)
  var NOTES = [
    { mul: 1.00,   at: 0.10, dec: 1.00, vel: 0.50 },  // root   C4 — first star
    { mul: DEG2,   at: 0.40, dec: 1.00, vel: 0.53 },  // 2nd    D4
    { mul: MAJ3,   at: 0.68, dec: 1.02, vel: 0.56 },  // 3rd    E4
    { mul: FIF,    at: 0.96, dec: 1.05, vel: 0.59 },  // 5th    G4
    { mul: OCT,    at: 1.28, dec: 1.35, vel: 0.64 },  // octave C5 — crest of the ladder (long tail: the tonic starts ringing)
    { mul: SIX,    at: 1.62, dec: 0.62, vel: 0.52 },  // 6th    A4 — the wistful sigh DOWN, a breath before the name
    { mul: OCT,    at: 1.96, dec: 1.55, vel: 0.74 }   // RESOLVE — the sustained tonic octave C5, longest + brightest
  ];

  // Celeste/glass voice: dominant fundamental (pitch anchor) + a warm octave + a
  // faint, fast glassy partial for the mallet "ting". Upper partials decay faster
  // (bright-then-mellow) and carry a sub-cent shimmer detune; the fundamental is
  // kept pure so the pitch reads true.
  var PARTIALS = [
    { ratio: 1.000, gain: 1.00, decayScale: 1.00 },  // fundamental — the pitch anchor
    { ratio: 2.000, gain: 0.30, decayScale: 0.74 },  // octave — warmth/body
    { ratio: 4.010, gain: 0.09, decayScale: 0.42 }   // glassy "ting" (slightly stretched) — a hair more sparkle
  ];

  function playNote(at, freq, decay, vel) {
    if (at >= t0 + D) return;
    for (var pi = 0; pi < PARTIALS.length; pi++) {
      var P = PARTIALS[pi];
      var f = freq * P.ratio;
      if (f >= SAFE) continue;
      if (pi > 0) f *= 1 + (rnd() - 0.5) * 0.0015;   // sub-cent shimmer on upper partials only

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, at);

      var g = ctx.createGain();
      var dcy = decay * P.decayScale;
      var maxD = (t0 + D) - at - 0.04;               // resolve fully WITHIN the render window
      if (dcy > maxD) dcy = maxD;
      if (dcy < 0.06) dcy = 0.06;
      var peak = vel * P.gain;

      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.010);          // soft mallet attack (no click)
      g.gain.exponentialRampToValueAtTime(0.0006, at + dcy);     // bell decay
      g.gain.linearRampToValueAtTime(0.0, at + dcy + 0.05);      // clean tail to silence

      osc.connect(g).connect(warm);
      osc.start(at);
      osc.stop(at + dcy + 0.10);
    }
  }

  // ── THE SUSTAINED TONIC PAD — the signature. A soft glass chord that swells up
  //    UNDER the final struck tonic and HOLDS, so the resolve genuinely rings/
  //    sustains rather than only decaying. Voices form a warm tonic-octave stack:
  //      C5 (the tonic, main) + C4 (a body octave below, softer). A separate C6
  //      shimmer swells in and TWINKLES (~5 Hz amplitude LFO — amplitude only, so
  //      zero pitch risk) as the name is inked. Slow attack, a held plateau, then a
  //      long soft release into silence. Kept below the struck melody so it reads
  //      as the note ringing on, never as a separate drone. ────────────────────────
  (function tonicPad() {
    var tonic = R * OCT;                     // C5 at param=0
    var swellStart = t0 + 1.90;              // rises just as the final tonic is struck
    var holdTo     = t0 + 2.28;              // swells up, then HOLDS the tonic (the sustain)
    var relEnd     = t0 + D - 0.18;          // release fully before the window ends → true-silence tail

    // The held tonic-octave stack (pure sines, pitch-true). The C5 tonic is the
    // strongest sustained component and the C4 body is kept very low, so the global
    // pitch read lands on the TONIC C5 — never the low body octave or the root swell.
    var padVoices = [
      { f: tonic,     g: 0.170 },            // the sustained tonic — the resolve holding (the pitch anchor)
      { f: tonic / 2, g: 0.022 }             // C4 body octave below — a whisper of warmth (kept far under the tonic)
    ];
    for (var v = 0; v < padVoices.length; v++) {
      var pv = padVoices[v];
      if (pv.f >= SAFE) continue;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(pv.f, swellStart);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, swellStart);
      g.gain.linearRampToValueAtTime(pv.g, swellStart + 0.34);   // swell up under the strike
      g.gain.setValueAtTime(pv.g, holdTo);                        // HOLD — the tonic sustains
      g.gain.exponentialRampToValueAtTime(0.0005, relEnd);       // long soft release
      g.gain.linearRampToValueAtTime(0.0, relEnd + 0.05);
      o.connect(g).connect(warm);
      o.start(swellStart);
      o.stop(relEnd + 0.10);
    }

    // ── C6 SHIMMER that swells in and TWINKLES as the name inks. Amplitude-only
    //    LFO (~5 Hz) → starlight twinkle with zero pitch risk; sub-cent detune on
    //    the shimmer partial only (never a fundamental). A whisper of glass on top
    //    of the tonic — reinforced from the base's faint static octave. ────────────
    var sh = tonic * 2;                       // C6 shimmer above
    if (sh < SAFE) {
      var so = ctx.createOscillator();
      so.type = 'sine';
      so.frequency.setValueAtTime(sh * (1 + (rnd() - 0.5) * 0.0015), swellStart);
      var sg = ctx.createGain();
      var base = 0.044;                       // quiet — a top sheen, not a voice
      sg.gain.setValueAtTime(0.0001, swellStart);
      sg.gain.linearRampToValueAtTime(base, swellStart + 0.40);  // swells in as the name inks
      sg.gain.setValueAtTime(base, holdTo);
      sg.gain.exponentialRampToValueAtTime(0.0005, relEnd);      // release within the window
      sg.gain.linearRampToValueAtTime(0.0, relEnd + 0.05);

      // slow amplitude LFO (~5 Hz) — a gentle starlight twinkle; depth < base so it
      // never fully gates (smooth shimmer), amplitude only → the pitch stays true.
      var lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.0 + rnd() * 0.6, swellStart);
      var lg = ctx.createGain();
      lg.gain.value = base * 0.5;
      lfo.connect(lg); lg.connect(sg.gain);

      so.connect(sg).connect(warm);
      so.start(swellStart); lfo.start(swellStart);
      so.stop(relEnd + 0.10); lfo.stop(relEnd + 0.10);
    }
  })();

  // ── A soft LOW ROOT SWELL under the whole phrase — the formation settling into
  //    the sky. Fades in, breathes low, fades out; felt not heard, well below the
  //    melody, and recedes before the tonic tail so the resolve rings alone (this
  //    keeps the MELODY, not the swell, leading the global pitch read). C3 at
  //    param=0 (one octave below the keyed root R). ────────────────────────────────
  (function rootSwell() {
    var f = R * 0.5;                          // C3 at param=0
    if (f < 24) f = R;
    var sw = t0 + 0.22;                                          // enter after the first note leads
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, sw);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, sw);
    g.gain.linearRampToValueAtTime(0.026, sw + 0.60);            // slow breath in, kept deeply subordinate
    g.gain.setValueAtTime(0.026, t0 + Math.min(1.5, D - 0.9));   // hold low under the phrase
    g.gain.exponentialRampToValueAtTime(0.0006, t0 + D - 0.55);  // recede WELL before the tonic tail so the resolve rings alone
    g.gain.linearRampToValueAtTime(0.0, t0 + D + 0.05);
    o.connect(g).connect(master);                                // bypass the body LP (it's already low)
    o.start(sw);
    o.stop(t0 + D + 0.10);
  })();

  for (var i = 0; i < NOTES.length; i++) {
    var nt = NOTES[i];
    playNote(t0 + nt.at, R * nt.mul, nt.dec, nt.vel);
  }

  return {
    stop: function (at) {
      var w = (at != null) ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, w, 0.05); } catch (e) {}
    }
  };
};
