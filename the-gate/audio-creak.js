/* ═══════════════════════════════════════════════════════════════════════════
   audio-creak.js  —  Gate.sfx.creak  (KEY="creak")

   An old-hinge creak for the gate's swing phase: the doors part and the tired
   iron hinges sing their wavering "eeee".

   ── How the sound is built ──────────────────────────────────────────────────
   The signature of a real HEAVY iron-gate hinge is a swept HIGH-Q resonance
   riding on slow, draggy stick-slip friction — a GROAN, not a squeak. We model
   it with:

     1. A pink-ish noise excitation (white noise tilted hard toward lows so the
        resonance has wood/iron MASS rather than hiss).

     2. A narrowband BANDPASS (high Q) whose centre frequency is SWEPT across a
        LOW band (≈ 120 → 430 Hz and partly back) — well below a squeak. On a
        spectrogram this is the wavering narrow line that slides in pitch — the
        low "rrraawwww" of iron under load.

     3. STICK-SLIP amplitude modulation: friction does not release smoothly, it
        catches and lets go. A heavy hinge catches SLOWLY, so we gate the
        amplitude with an irregular train of seeded micro-bursts spaced wider
        apart (slower, draggier), each a fast grab + slow drag-off, so the line
        flickers and lurches the way a dry, loaded hinge actually does.

     4. A heavy low IRON/WOOD THUNK under each gesture: a short, heavily-damped
        low resonance (~55–70 Hz) giving the door leaf real mass.

     5. A faint sustained low GROAN tone (a triangle near the low sweep band)
        under the whole gesture for body and weight.

   Two slow creak gestures sit inside the window (the two door leaves), the
   second a touch higher and shorter than the first — both staying LOW.

   Determinism: a seeded mulberry32 PRNG drives ALL randomness (noise samples and
   stick-slip timing), so the offline render that audio-lens verifies is byte-for
   -byte the one that ships. NO Math.random anywhere.

   Peaks are kept well under 0 dBFS (master ≈ 0.5, soft-knee not needed).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32. Deterministic, fast, good enough for audio noise.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Build a `dur`-second buffer of seeded white noise, gently tilted toward the
     low end (a one-pole low-pass mixed back in) so the resonance reads as wood/
     iron body rather than bright hiss. */
  function buildNoiseBuffer(ctx, dur, rnd) {
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var lp = 0;
    var alpha = 0.14; // one-pole smoothing → strong low tilt (heavier body)
    for (var i = 0; i < n; i++) {
      var w = rnd() * 2 - 1;              // white in [-1,1]
      lp = lp + alpha * (w - lp);         // low-passed copy
      d[i] = 0.25 * w + 1.1 * lp;         // mostly body, just a little air
    }
    return buf;
  }

  Gate.sfx.creak = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = opts.dur;
    var when = opts.when || 0;
    var seed = (opts.seed == null) ? 1 : opts.seed;

    var t0 = ctx.currentTime + when;
    var rnd = mulberry32((seed | 0) || 1);

    // Master gain — keeps the whole thing comfortably under 0 dBFS.
    // (First render peaked at ~-24 dBFS with plenty of headroom, so we lift the
    // master to let the resonant line read more strongly; still well under 0.)
    var master = ctx.createGain();
    master.gain.setValueAtTime(1.0, t0);
    master.connect(dest);

    // Shared seeded noise bed; every gesture taps the same source node so the
    // render stays deterministic (one buffer, multiple readers via separate
    // BufferSource nodes pointing at the same AudioBuffer).
    var noiseBuf = buildNoiseBuffer(ctx, dur + 0.2, rnd);

    /* ── One creak gesture ────────────────────────────────────────────────────
       start    : gesture start time (sec, absolute on ctx clock)
       length   : gesture duration (sec)
       fLo,fHi  : sweep endpoints (Hz) for the high-Q bandpass centre
       q        : resonance Q (higher = narrower, more "eee")
       level    : gesture peak gain into master
       thunkHz  : low wood-thunk resonance frequency
    */
    function gesture(start, length, fLo, fHi, q, level, thunkHz) {
      // --- swept high-Q bandpass resonance (the "eee") ---
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;

      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.setValueAtTime(q, start);

      // Sweep the centre frequency: rise to fHi over the first ~65% then ease
      // partway back. Exponential ramps read as a smooth pitch glide.
      var fMid = fHi;
      var fEnd = fLo + (fHi - fLo) * 0.45;
      bp.frequency.setValueAtTime(fLo, start);
      bp.frequency.exponentialRampToValueAtTime(fMid, start + length * 0.65);
      bp.frequency.exponentialRampToValueAtTime(fEnd, start + length);

      // Slight Q wobble so the resonance "breathes" — adds life to the line.
      bp.Q.linearRampToValueAtTime(q * 1.35, start + length * 0.5);
      bp.Q.linearRampToValueAtTime(q * 0.9, start + length);

      // A second, weaker resonance an ~octave up gives the creak a thin overtone
      // edge (real hinges aren't a single pole). Kept faint so the sound stays
      // LOW and does not drift toward a squeak.
      var bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.Q.setValueAtTime(q * 1.4, start);
      bp2.frequency.setValueAtTime(fLo * 2.02, start);
      bp2.frequency.exponentialRampToValueAtTime(fMid * 1.98, start + length * 0.65);
      bp2.frequency.exponentialRampToValueAtTime(fEnd * 2.0, start + length);
      var bp2Gain = ctx.createGain();
      bp2Gain.gain.setValueAtTime(0.18, start);

      // --- stick-slip amplitude envelope ---
      // An overall hump (attack→sustain→release) MULTIPLIED by an irregular train
      // of micro-bursts. We bake the whole envelope with setValueAtTime steps so
      // it is fully deterministic.
      var env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, start);

      // Overall body curve sampled finely; the burst train modulates it.
      // Burst timing: irregular gaps drawn from the seeded PRNG. Each burst is a
      // quick rise then decay — the "catch and release" of dry friction.
      var t = start + 0.005;
      var endT = start + length;
      var prevPeak = 0;
      while (t < endT) {
        // position 0..1 through the gesture, used to shape the overall body.
        var pos = (t - start) / length;
        // body: fade in over first 8%, plateau, fade out over last 22%.
        var body;
        if (pos < 0.08) body = pos / 0.08;
        else if (pos > 0.78) body = Math.max(0, (1 - pos) / 0.22);
        else body = 1;
        body = body * body; // soften the corners

        // burst amplitude — friction grabs hard and unevenly; wide jitter makes
        // the heavy hinge lurch rather than buzz.
        var grab = 0.40 + 0.60 * rnd();
        var amp = level * body * grab;
        if (amp < 0.0008) amp = 0.0008;

        // fast grab to the burst peak, then a SLOW drag-off toward a low floor
        // before the next catch — a loaded hinge releases reluctantly.
        var atk = 0.006 + 0.012 * rnd();
        env.gain.exponentialRampToValueAtTime(amp, t + atk);
        var rel = t + atk + (0.040 + 0.090 * rnd());
        if (rel > endT) rel = endT;
        var floor = amp * (0.12 + 0.20 * rnd());
        if (floor < 0.0008) floor = 0.0008;
        env.gain.exponentialRampToValueAtTime(floor, rel);

        prevPeak = amp;
        // gap to next catch: WIDE and irregular — a heavy hinge catches slowly.
        var density = 0.055 + 0.120 * rnd();
        t = rel + density;
      }
      // clean release to silence at the end
      env.gain.exponentialRampToValueAtTime(0.0006, endT + 0.02);
      // mute the source outside the gesture window via the env (it starts at ~0).

      // --- heavy low iron/wood-thunk: a short damped low resonance giving the
      // leaf real mass as it takes up slack. Lower & weightier than before. ---
      var thunkSrc = ctx.createBufferSource();
      thunkSrc.buffer = noiseBuf;
      var thunkBp = ctx.createBiquadFilter();
      thunkBp.type = 'bandpass';
      thunkBp.Q.setValueAtTime(4, start);
      thunkBp.frequency.setValueAtTime(thunkHz, start);
      var thunkEnv = ctx.createGain();
      // a single heavy thud at the start of the gesture (the leaf taking up slack)
      thunkEnv.gain.setValueAtTime(0.0001, start);
      thunkEnv.gain.exponentialRampToValueAtTime(level * 1.0, start + 0.016);
      thunkEnv.gain.exponentialRampToValueAtTime(0.0008, start + 0.42);
      thunkEnv.gain.setValueAtTime(0.0001, start + 0.44);

      // --- faint sustained low GROAN tone: a triangle near the low sweep band,
      // tracking the creak's pitch, giving the gesture weight and body. ---
      var groan = ctx.createOscillator();
      groan.type = 'triangle';
      groan.frequency.setValueAtTime(fLo * 0.9, start);
      groan.frequency.exponentialRampToValueAtTime(fMid * 0.92, start + length * 0.65);
      groan.frequency.exponentialRampToValueAtTime(fEnd * 0.9, start + length);
      var groanEnv = ctx.createGain();
      groanEnv.gain.setValueAtTime(0.0001, start);
      groanEnv.gain.exponentialRampToValueAtTime(level * 0.16, start + length * 0.12);
      groanEnv.gain.setValueAtTime(level * 0.16, start + length * 0.7);
      groanEnv.gain.exponentialRampToValueAtTime(0.0006, endT);

      // --- wire it up ---
      // main resonance path
      src.connect(bp).connect(env);
      // overtone path taps the same env so they share the stick-slip flutter
      src.connect(bp2).connect(bp2Gain).connect(env);
      env.connect(master);
      // thunk path is independent (its own short envelope)
      thunkSrc.connect(thunkBp).connect(thunkEnv).connect(master);
      // groan tone path
      groan.connect(groanEnv).connect(master);

      // play the noise across the whole gesture (env shapes it to the window)
      src.start(start);
      src.stop(endT + 0.05);
      thunkSrc.start(start);
      thunkSrc.stop(start + 0.48);
      groan.start(start);
      groan.stop(endT + 0.05);
    }

    // ── Two gestures: the two door leaves. ──────────────────────────────────
    // High Q (18 / 20) narrows the swept resonance into a focused low groan line.
    // Both stay in a LOW band (~120–430 Hz) so it reads as iron, not a rodent.
    // Leaf 1: longer, lower groan starting near the top of the window.
    gesture(t0 + 0.06, 1.10, 120, 410, 18, 0.9, 58);
    // Leaf 2: a touch higher and shorter, overlapping the tail of the first.
    gesture(t0 + 1.35, 0.95, 150, 440, 20, 0.82, 68);

    // Live-use hook: stop the master (sources self-stop offline).
    return {
      stop: function (at) {
        try { master.gain.cancelScheduledValues(at != null ? at : ctx.currentTime); } catch (e) {}
        try { master.gain.setValueAtTime(0, at != null ? at : ctx.currentTime); } catch (e) {}
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
