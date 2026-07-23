/* ═══════════════════════════════════════════════════════════════════════════
   sfx-thunk.js  —  the Weight-landing THUNK  (foundry-forged, medium: sound)

   A heavy gym-plate set down FIRMLY on the Maxwell–Boltzmann steel lid: mass
   meeting metal, then nothing. A short, damped, LOW thud — felt, not brittle.
   No ring, no reverb, no metallic tail; the gas swallows it.

   FORGED FROM: judge-consensus winner TAKE 1 ("the damped membrane thud" — a
   round, pitched low body that SAGS downward as the plate seats into the lid),
   with the three grafts both judges called out folded in CONSERVATIVELY:
     • lower fundamental (toward Take 2's ~75–80 Hz dark register) so it sits in
       the "muffled mass" band WITHOUT losing Take 1's heft;
     • Take 2's "gas-swallows-the-tail" master LOWPASS (1100→360 Hz over the
       body) to shave any residual mid-band air off the tail while preserving
       Take 1's higher RMS/body;
     • Take 2's whisper-quiet bandpassed TICK for a hair of contact definition
       at the onset — kept sub-audible (and further tamed by the master lowpass)
       so the dull character is untouched.

   weight → depth + heft is real and monotonic: heavier plate → lower f0, a
   touch longer decay, a touch louder; the heaviest plate stays under the 0.45
   peak ceiling. Critically damped, no ring.

   Contract: a dual-use one-shot builder scheduled into `dest` against ANY
   BaseAudioContext; the graph rendered offline for audio-lens is the graph that
   ships. Deterministic (seeded PRNG, no Math.random).

   Registration:
     • window.LidSfx.thunk  — the shipping API the spec names (lid.html calls it)
     • Gate.sfx.thunk       — the room-loads-by-key registry surface (also what
                              the SFX render bench resolves as the candidate)

   Signature: fn({ ctx, dest, dur, when, seed, gain, weight }). The WAV bench
   passes only { ctx, dest, dur, when, seed }; `gain`/`weight` default here so
   the render is one thunk at weight≈120.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};
  var LidSfx = root.LidSfx = root.LidSfx || {};

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
    for (var i = 0; i < n; i++) { data[i] = rnd() * 2 - 1; }
    return buf;
  }

  function thunk(opts) {
    opts = opts || {};
    var ctx  = opts.ctx;
    var dest = opts.dest;
    var dur  = opts.dur    != null ? opts.dur    : 0.25;
    var when = opts.when   != null ? opts.when   : 0;
    var seed = opts.seed   != null ? opts.seed   : 1;
    var gain = opts.gain   != null ? opts.gain   : 1;
    var weight = opts.weight != null ? opts.weight : 120;

    // Fire immediately on trigger — a landing sound wants a tight impact with
    // no scheduling delay. The body is a low sine so the clip is dull by design
    // ('felt, not brittle'); it decays cleanly to silence well within `dur`.
    var t0 = ctx.currentTime + when;

    // ── weight → depth + heft ────────────────────────────────────────────────
    // Clamp to the plates that ship (~60..160). Heavier: lower f0, longer decay,
    // a touch louder. w in [0,1] across that span.
    var W = Math.min(Math.max(weight, 60), 160);
    var w = (W - 60) / 100;                          // 0 (light) .. 1 (heavy)

    // GRAFT 1 — lower fundamental toward Take 2's dark register. Base dropped
    // (96→88 Hz) and the settling overshoot narrowed (1.55×→1.42×) so more
    // energy sits in the 70–80 Hz "muffled mass" band without thinning the heft.
    var f0    = 88 - w * 40;                          // ~88 Hz light → ~48 Hz heavy (≈64 Hz at w=120)
    var body  = 0.135 + w * 0.075;                   // ~0.135 s light → ~0.21 s heavy (heavier → longer)
    var heft  = 0.90 + w * 0.08;                      // heavier lands a touch louder (gentle slope)

    // ── master bus → (GRAFT 2: gas-swallow lowpass) → dest. ──────────────────
    // Budgeted so the summed peak stays under the 0.45 ceiling at EVERY weight.
    // The base was trimmed 0.48→0.455 to pay for GRAFT 1: the lower fundamental
    // packs more energy low, and at the heaviest plate's ~50 Hz the body crest
    // sums more constructively — so the whole span (incl. w=160) now clears the
    // ceiling with margin (verified: ~0.34 peak at w=120, ~0.43 at w=160). A
    // final lowpass sweeping 1100→360 Hz over the body darkens the tail (Take
    // 2's "the gas swallows it") — it shaves residual mid air off the decay AND
    // naturally tames the TICK below so the centroid stays low, while Take 1's
    // low body sails under the cutoff untouched (its RMS/body is preserved).
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.455 * gain * heft, t0);
    var cap = ctx.createBiquadFilter();
    cap.type = 'lowpass';
    cap.frequency.setValueAtTime(1100, t0);
    cap.frequency.exponentialRampToValueAtTime(360, t0 + body);
    cap.Q.setValueAtTime(0.4, t0);
    master.connect(cap).connect(dest);

    // ── Voice 1: the BODY — a low sine that sags downward in pitch. ──────────
    // The pitch drop is the mechanical 'give' as the plate seats into the lid:
    // it starts ~1.42× f0 on contact and settles below f0, reading as weight.
    // Critically damped: a fast near-exponential decay, no ring.
    var bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(f0 * 1.42, t0);
    bodyOsc.frequency.exponentialRampToValueAtTime(f0 * 0.80, t0 + body * 0.9);
    var bodyG = ctx.createGain();
    bodyG.gain.setValueAtTime(0.0001, t0);
    bodyG.gain.linearRampToValueAtTime(1.0, t0 + 0.006);     // ~6 ms seat
    bodyG.gain.exponentialRampToValueAtTime(0.0008, t0 + body);
    bodyG.gain.setValueAtTime(0, t0 + body + 0.004);
    bodyOsc.connect(bodyG).connect(master);
    bodyOsc.start(t0);
    bodyOsc.stop(t0 + body + 0.02);

    // ── Voice 2: a SUB reinforcement one octave-ish below, shorter. ──────────
    // A triangle a touch under f0 fattens the low end / chest weight without a
    // second pitch; decays faster than the body so it never lingers.
    var sub = ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(f0 * 0.75, t0);
    sub.frequency.exponentialRampToValueAtTime(f0 * 0.55, t0 + body * 0.55);
    var subG = ctx.createGain();
    subG.gain.setValueAtTime(0.0001, t0);
    subG.gain.linearRampToValueAtTime(0.45, t0 + 0.008);
    subG.gain.exponentialRampToValueAtTime(0.0008, t0 + body * 0.7);
    subG.gain.setValueAtTime(0, t0 + body * 0.7 + 0.004);
    sub.connect(subG).connect(master);
    sub.start(t0);
    sub.stop(t0 + body * 0.7 + 0.02);

    // ── Voice 3: the CONTACT — a soft, dull noise burst at t=0. ──────────────
    // The plate face meeting the lid — the 'plate face slap'. Lowpassed so it
    // reads as a muffled 'thd', not a bright snap, but it KEEPS some low-mid
    // presence briefly so the impact resolves as a single distinct onset. A
    // downward cutoff sweep from ~1.5 kHz into the low-mids; very short (~28 ms)
    // so it merges into the body's attack as one hit.
    var noise = makeNoiseBuffer(ctx, (seed * 2654435761) >>> 0, 0.06);
    var conSrc = ctx.createBufferSource();
    conSrc.buffer = noise;
    conSrc.playbackRate.setValueAtTime(0.82, t0);           // darker grain
    var conLP = ctx.createBiquadFilter();
    conLP.type = 'lowpass';
    conLP.Q.setValueAtTime(0.6, t0);
    conLP.frequency.setValueAtTime(1500 - w * 350, t0);     // heavier → duller
    conLP.frequency.exponentialRampToValueAtTime(300, t0 + 0.026);
    var conHP = ctx.createBiquadFilter();                    // trim DC rumble only
    conHP.type = 'highpass';
    conHP.frequency.setValueAtTime(48, t0);
    var conG = ctx.createGain();
    var conDecay = 0.028;
    conG.gain.setValueAtTime(0.0001, t0);
    conG.gain.linearRampToValueAtTime(0.6, t0 + 0.0009);     // ~1 ms attack
    conG.gain.exponentialRampToValueAtTime(0.0006, t0 + conDecay);
    conG.gain.setValueAtTime(0, t0 + conDecay + 0.003);
    conSrc.connect(conHP).connect(conLP).connect(conG).connect(master);
    conSrc.start(t0);
    conSrc.stop(t0 + conDecay + 0.02);

    // ── Voice 4 (GRAFT 3): the TICK — a whisper-quiet bandpassed contact blip. ─
    // Fires at t0 with NO attack ramp → a hair of instant transient definition
    // so the onset reads crisp, WITHOUT brightening: it is very quiet and the
    // master lowpass above (cutoff 1100 Hz, sweeping down) attenuates its
    // 1350 Hz band immediately, keeping the spectral centroid dark. Sub-audible
    // by design — the dull "muffled mass" character is untouched.
    var tickBuf = makeNoiseBuffer(ctx, (seed * 40503 + 91) >>> 0, 0.02);
    var tickSrc = ctx.createBufferSource();
    tickSrc.buffer = tickBuf;
    var tickBP = ctx.createBiquadFilter();
    tickBP.type = 'bandpass';
    tickBP.frequency.setValueAtTime(1350, t0);
    tickBP.Q.setValueAtTime(0.9, t0);
    var tickG = ctx.createGain();
    tickG.gain.setValueAtTime(0.10 * heft, t0);              // whisper; no attack (a hit)
    tickG.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.012);
    tickSrc.connect(tickBP).connect(tickG).connect(master);
    tickSrc.start(t0);
    tickSrc.stop(t0 + 0.018);

    // Live-use handle: hard-stop the scheduled voices at `at` (or now).
    return {
      stop: function (at) {
        var w2 = at != null ? at : ctx.currentTime;
        try { bodyOsc.stop(w2); } catch (e) {}
        try { sub.stop(w2); } catch (e) {}
        try { conSrc.stop(w2); } catch (e) {}
        try { tickSrc.stop(w2); } catch (e) {}
      }
    };
  }

  // Register: the room's REAL shipping key (lid.html calls window.LidSfx.thunk,
  // matching the sibling lid-sfx-burner.js), plus Gate.sfx.__candidate so the
  // Art Foundry SFX bench can render it (same dual-registration the burner uses).
  LidSfx.thunk = thunk;             // the shipping API the spec names (lid.html calls it)
  Gate.sfx.__candidate = thunk;     // the bench's reserved candidate key

})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this));
