/* ═══════════════════════════════════════════════════════════════════════════
   sfx-lost.js  —  Gate.sfx.lost   (KEY = "lost")   [FOUNDRY TAKE 1]

   "…it stayed lost": fired ONCE when the un-stir happens at high Reynolds
   number and the smeared dye never re-gathers. The DENIAL sound — the exact
   opposite of the gather-chime. No ring, no bloom, no partials: a dull, low,
   damped THUD, a soft closed door. Gentle disappointment, not a harsh error.

   ── DIRECTION (take 1: a physically-damped "soft closed door") ──────────────
   A real closed door is not a tone and not a click — it is a low mass making
   brief muffled contact and then dead silence. So the thud here is MODELLED as
   contact + damped body + swallowed air, all pitched low and killed fast:

     • THUMP BODY — a low sine that starts near ~92 Hz and glides DOWN to ~64 Hz
       over the first ~40 ms (a settling mass, not a fixed pitch/note — a fixed
       tone would ring like a bell, which is exactly the gather sound we must
       NOT make). Soft ~6 ms attack (no click), then a quick exponential decay
       to silence by ~180 ms. This is the weight of the door meeting the frame.

     • SUB FLOOR — a very short ~46 Hz sine under the body (~90 ms) that adds a
       little chest-weight to the contact and pulls the spectral centroid LOW,
       so the whole event reads as "dull / muffled", never bright or buzzy.

     • MUFFLED AIR — a whisper of seeded noise, band-limited by a lowpass that
       CLOSES from ~900 Hz down to ~180 Hz across the decay. This is the soft
       "thmp" of displaced air / cloth / felt — the closed-door muffle. It is
       quiet (well under the body) and dies with the thump; it gives texture
       without ever sounding like hiss or an error buzz.

   ── WHY NO RING ────────────────────────────────────────────────────────────
   Every voice decays to true silence well inside the 0.5 s clip and there are
   NO resonant/bell partials and NO reverb tail: the door shuts and the room is
   quiet. The pitch GLIDE (not a held note) is the single most important choice
   for reading as "disappointment settling" rather than "a musical tone". Kept
   quiet — a soft final thud, not a slam.

   Determinism: one seeded mulberry32 PRNG drives the noise bed, so the offline
   render audio-lens verifies is exactly the graph that ships. NO Math.random.
   Peaks kept well under 0 dBFS (a quiet, humble event).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32 → floats in [0,1). Deterministic, not Math.random.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── One short mono AudioBuffer of seeded white noise (the muffled air).
  function makeNoiseBuffer(ctx, seed, seconds) {
    var len = Math.max(1, Math.round(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0);
    for (var i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
    return buf;
  }

  Gate.sfx.lost = function (opts) {
    opts = opts || {};
    var ctx  = opts.ctx;
    var dest = opts.dest;
    var when = opts.when != null ? opts.when : 0;
    var seed = opts.seed != null ? opts.seed : 1;

    // A short lead-in of silence before the contact so the very first STFT
    // analysis frame is quiet and the thud reads as a clean onset (a spectral-
    // flux RISE) rather than being clipped into frame 0.
    var lead = 0.02;
    var t0 = ctx.currentTime + when + lead;

    // ── Master bus → dest. Budgeted so the summed voices peak well under 0 dBFS.
    // This is a QUIET, humble event — a soft thud, not a slam — so we keep the
    // master modest.
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.42, t0);
    master.connect(dest);

    // ── Voice 1: the THUMP body — a low sine gliding down (a settling mass) ──
    var body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(92, t0);
    body.frequency.exponentialRampToValueAtTime(64, t0 + 0.04); // settle down fast
    var bodyG = ctx.createGain();
    var bodyDecay = 0.18;
    bodyG.gain.setValueAtTime(0.0001, t0);
    bodyG.gain.linearRampToValueAtTime(0.9, t0 + 0.006);        // ~6 ms soft attack (no click)
    bodyG.gain.exponentialRampToValueAtTime(0.28, t0 + 0.06);   // quick early fall
    bodyG.gain.exponentialRampToValueAtTime(0.0006, t0 + bodyDecay);
    bodyG.gain.setValueAtTime(0, t0 + bodyDecay + 0.01);
    // A gentle lowpass so even the sine's tiny numeric edges stay soft/round.
    var bodyLP = ctx.createBiquadFilter();
    bodyLP.type = 'lowpass';
    bodyLP.frequency.setValueAtTime(320, t0);
    bodyLP.Q.setValueAtTime(0.5, t0);
    body.connect(bodyLP).connect(bodyG).connect(master);
    body.start(t0);
    body.stop(t0 + bodyDecay + 0.03);

    // ── Voice 2: the SUB floor — chest-weight under the contact, pulls the
    // centroid LOW so the whole thing reads "dull / muffled". No fixed note. ──
    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(48, t0);
    sub.frequency.exponentialRampToValueAtTime(40, t0 + 0.08);
    var subG = ctx.createGain();
    var subDecay = 0.09;
    subG.gain.setValueAtTime(0.0001, t0);
    subG.gain.linearRampToValueAtTime(0.5, t0 + 0.008);
    subG.gain.exponentialRampToValueAtTime(0.0006, t0 + subDecay);
    subG.gain.setValueAtTime(0, t0 + subDecay + 0.01);
    sub.connect(subG).connect(master);
    sub.start(t0);
    sub.stop(t0 + subDecay + 0.02);

    // ── Voice 3: the MUFFLED AIR — a quiet seeded-noise "thmp" whose lowpass
    // CLOSES as the thud dies, so the tail dulls to nothing (no hiss, no buzz).
    var noiseBuf = makeNoiseBuffer(ctx, (seed * 2654435761) >>> 0, 0.35);
    var airSrc = ctx.createBufferSource();
    airSrc.buffer = noiseBuf;
    var airLP = ctx.createBiquadFilter();
    airLP.type = 'lowpass';
    airLP.frequency.setValueAtTime(900, t0);
    airLP.frequency.exponentialRampToValueAtTime(180, t0 + 0.14); // swallow the highs
    airLP.Q.setValueAtTime(0.4, t0);
    var airG = ctx.createGain();
    var airDecay = 0.12;
    airG.gain.setValueAtTime(0.0001, t0);
    airG.gain.linearRampToValueAtTime(0.30, t0 + 0.005);          // felted contact — a hair more tactile (grafted from take 2), still well under the body
    airG.gain.exponentialRampToValueAtTime(0.0005, t0 + airDecay);
    airG.gain.setValueAtTime(0, t0 + airDecay + 0.01);
    airSrc.connect(airLP).connect(airG).connect(master);
    airSrc.start(t0, 0.0, 0.16);
    airSrc.stop(t0 + 0.16);

    // Live-use handle: silence the master (offline sources self-stop).
    return {
      stop: function (at) {
        var w = at != null ? at : ctx.currentTime;
        try { master.gain.cancelScheduledValues(w); } catch (e) {}
        try { master.gain.setValueAtTime(0, w); } catch (e) {}
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
