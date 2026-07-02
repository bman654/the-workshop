/* ═══════════════════════════════════════════════════════════════════════════
   sfx-tumble.js  —  Gate.sfx.tumble   (KEY = "tumble")   [FOUNDRY TAKE 1]

   "Fall — the wooden tumble": the low wooden patter of the now-ungrounded
   pieces dropping and settling into the soil. A scattered handful of soft,
   dampened woody KNOCKS over ~0.3–0.5 s. The page passes `n` = the number of
   fallen pieces; the knock count/density scales with it (clamped ~1..8).

   ── DIRECTION (take 1: physically-modelled modal knocks) ────────────────────
   A dropped twig on dirt is not a "click" — it is a tiny excitation ringing
   a short, stiff wooden body for a few milliseconds, mostly absorbed by the
   soft earth it lands on. So each knock here is MODELLED, not sampled:

     • EXCITATION — a very short (~2 ms) seeded noise burst: the actual moment
       of contact. This gives the transient its "tk" edge without any click.

     • WOODEN BODY — the burst drives a small bank of resonant BANDPASS filters
       tuned to the low modal frequencies of a short dry stick (a fundamental
       ~150–420 Hz plus two inharmonic partials at ~2.7× and ~5.1×, the ratios
       real struck wood shows — NOT a harmonic series, which would sing like a
       bell). High-ish Q so each mode rings briefly then dies. The whole knock
       decays in ~35–90 ms: a KNOCK, not a tom.

     • DIRT DAMPING — the sum is low-passed hard (a moving cutoff that closes
       from ~2.2 kHz down toward ~700 Hz as the knock decays) so the tail goes
       dull and earthy, the high modes swallowed by soil. This is what keeps the
       spectral centroid LOW and the character "dampened, warm" not "clacky".

     • A faint sub THUMP (~55–80 Hz sine, ~40 ms) under the louder knocks gives
       the heavier pieces a little floor-contact weight without any boom.

   ── SCATTER ─────────────────────────────────────────────────────────────────
   `n` fallen pieces → knockCount = clamp(n,1,8), but a piece can bounce/settle,
   so we schedule ~1.4× that many strikes: the extra ~40% are quieter SETTLE
   taps trailing the first contacts. Onsets are seeded-irregular and FRONT-
   LOADED (most pieces hit early, a few settle late) across ~0.30–0.46 s, so it
   reads as a real tumble collapsing, not a metronome. Pitch, level and body
   mode all vary per knock so no two are the same stick.

   Determinism: one seeded mulberry32 PRNG drives every noise sample and every
   timing/pitch choice, so the offline render audio-lens verifies is exactly the
   graph that ships. NO Math.random. Peaks kept well under 0 dBFS.
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

  // ── One short mono AudioBuffer of seeded white noise (the contact excitation).
  function makeNoiseBuffer(ctx, seed, seconds) {
    var len = Math.max(1, Math.round(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0);
    for (var i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
    return buf;
  }

  Gate.sfx.tumble = function (opts) {
    opts = opts || {};
    var ctx  = opts.ctx;
    var dest = opts.dest;
    var when = opts.when != null ? opts.when : 0;
    var seed = opts.seed != null ? opts.seed : 1;
    // `n` = fallen-piece count. At the SFX bench it renders without n, so we
    // default to a representative mid-tumble (5) so the verified WAV shows a
    // real patter; the page supplies the true count in play.
    var nRaw = (opts.n != null) ? opts.n : 5;
    var n = Math.max(1, Math.min(8, Math.round(nRaw)));

    var t0 = ctx.currentTime + when;
    var rnd = mulberry32((seed | 0) || 1);

    // Master bus → dest. Budgeted so a dense n=8 tumble still peaks under 0 dBFS
    // while a mid tumble reads with real presence (first render sat ~-18 dBFS
    // with 18 dB of headroom, so we lift the master for a warmer, closer knock).
    var master = ctx.createGain();
    master.gain.setValueAtTime(1.35, t0);
    master.connect(dest);

    // Shared seeded noise bed; each knock taps it through its own short window.
    var noiseBuf = makeNoiseBuffer(ctx, (seed * 2654435761) >>> 0, 0.7);

    /* ── One wooden knock ──────────────────────────────────────────────────────
       start  : onset time (sec, absolute on ctx clock)
       f0     : fundamental modal frequency (Hz) of this stick
       level  : peak gain into master (0..1-ish)
       decay  : body decay time (sec) — shorter = drier/lighter
       heavy  : if true, add the faint sub thump (a bigger piece hitting)
    */
    function knock(start, f0, level, decay, heavy) {
      // --- excitation: a ~2 ms noise contact burst ---
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      // read a random slice of the bed so successive knocks differ (still seeded)
      var off = rnd() * 0.55;
      var exEnv = ctx.createGain();
      exEnv.gain.setValueAtTime(0.0001, start);
      exEnv.gain.linearRampToValueAtTime(1.0, start + 0.0006); // ~0.6 ms attack
      exEnv.gain.exponentialRampToValueAtTime(0.0004, start + 0.004); // ~4 ms burst
      exEnv.gain.setValueAtTime(0, start + 0.006);

      // --- wooden body: three inharmonic resonant modes struck by the burst ---
      // Ratios ~1 : 2.71 : 5.15 — the stretched, inharmonic spacing of a short
      // struck stick (a true harmonic 1:2:3 would ring like a chime; wood does
      // not). Amplitudes fall off so the fundamental dominates the read.
      var modeRatios = [1.0, 2.71, 5.15];
      var modeGains  = [1.0, 0.42, 0.20];
      var modeQ      = [11, 16, 22];
      // body decays: higher modes die faster (soil swallows the highs first)
      var modeDecay  = [decay, decay * 0.55, decay * 0.34];

      // shared body envelope (the modal ring): fast rise, exponential fall
      var body = ctx.createGain();
      body.gain.setValueAtTime(0.0001, start);
      body.gain.linearRampToValueAtTime(level, start + 0.0016);
      body.gain.exponentialRampToValueAtTime(level * 0.28, start + decay * 0.4);
      body.gain.exponentialRampToValueAtTime(0.0005, start + decay);
      body.gain.setValueAtTime(0, start + decay + 0.01);

      // dirt damping: a lowpass that CLOSES as the knock decays, so the tail
      // dulls to earth. Keeps the centroid low and the timbre warm.
      var dirt = ctx.createBiquadFilter();
      dirt.type = 'lowpass';
      dirt.Q.setValueAtTime(0.5, start);
      dirt.frequency.setValueAtTime(2200, start);
      dirt.frequency.exponentialRampToValueAtTime(700, start + decay);

      dirt.connect(body).connect(master);

      for (var m = 0; m < modeRatios.length; m++) {
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        var fm = f0 * modeRatios[m];
        bp.frequency.setValueAtTime(fm, start);
        bp.Q.setValueAtTime(modeQ[m], start);
        // each mode gets its own quick decay so the higher partials clear first,
        // leaving a warm low remainder — the "settling" feel.
        var mg = ctx.createGain();
        mg.gain.setValueAtTime(modeGains[m], start);
        mg.gain.exponentialRampToValueAtTime(modeGains[m] * 0.06, start + modeDecay[m]);
        mg.gain.setValueAtTime(0.0001, start + modeDecay[m] + 0.01);
        // excitation → this mode's bandpass → mode gain → shared body → dirt
        src.connect(exEnv).connect(bp).connect(mg).connect(dirt);
      }

      // --- faint sub thump for the heavier pieces (floor contact, no boom) ---
      if (heavy) {
        var sub = ctx.createOscillator();
        sub.type = 'sine';
        var subF = 78 - rnd() * 22;               // ~56–78 Hz
        sub.frequency.setValueAtTime(subF, start);
        sub.frequency.exponentialRampToValueAtTime(subF * 0.7, start + 0.05);
        var subG = ctx.createGain();
        subG.gain.setValueAtTime(0.0001, start);
        subG.gain.linearRampToValueAtTime(level * 0.5, start + 0.004);
        subG.gain.exponentialRampToValueAtTime(0.0004, start + 0.045);
        subG.gain.setValueAtTime(0, start + 0.05);
        sub.connect(subG).connect(master);
        sub.start(start);
        sub.stop(start + 0.06);
      }

      // --- contact CLICK: a very short broadband tick right on the onset. The
      // high-Q modal bandpasses ring UP gradually and blur the attack, so the
      // knock loses its percussive edge and successive contacts smear into one.
      // A ~3 ms mid/low-passed noise tick injects a clean spectral-flux spike so
      // each knock reads as a DISTINCT woody contact — the "tk" of stick on
      // dirt — without adding brightness (it is band-limited, not a hiss). ---
      var clickSrc = ctx.createBufferSource();
      clickSrc.buffer = noiseBuf;
      var clickBp = ctx.createBiquadFilter();
      clickBp.type = 'bandpass';
      // centre just above the stick's fundamental and keep the band LOW so the
      // tick sounds like the same warm wood and does not lift the centroid — the
      // flux spike that separates the onsets comes from the sudden energy JUMP,
      // not from brightness, so a low tick works just as well as a bright one.
      clickBp.frequency.setValueAtTime(f0 * 1.15, start);
      clickBp.Q.setValueAtTime(2.2, start);
      var clickG = ctx.createGain();
      clickG.gain.setValueAtTime(0.0001, start);
      clickG.gain.linearRampToValueAtTime(level * 1.1, start + 0.0003); // ~0.3 ms, punchy
      clickG.gain.exponentialRampToValueAtTime(0.0004, start + 0.007);  // ~7 ms
      clickG.gain.setValueAtTime(0, start + 0.009);
      clickSrc.connect(clickBp).connect(clickG).connect(master);
      clickSrc.start(start, off + 0.001, 0.011);
      clickSrc.stop(start + 0.011);

      // play the modal-body excitation across its little window
      src.start(start, off, 0.02);
      src.stop(start + 0.02);
    }

    // ── Schedule the tumble ─────────────────────────────────────────────────
    // knockCount scales with n; ~40% extra quieter "settle" taps trail the
    // primary contacts (a piece can bounce/rock before it comes to rest).
    var primary = n;
    var settles = Math.max(0, Math.round(n * 0.4));
    var total = primary + settles;

    // spread window grows with n (more pieces = a longer collapse). We use most
    // of the 0.5 s so the knocks read as a scattered PATTER across the clip, not
    // a single crowded thud at t=0.
    var span = 0.34 + Math.min(0.12, n * 0.016);   // ~0.34 .. 0.46 s

    // onset schedule: draw normalized positions, gently biased toward the start
    // (pos^1.25) so the tumble leans early but still trails realistically. A
    // small deterministic lead-in keeps t=0 quiet so the first knock reads as a
    // clean onset rather than clipping the very first analysis frame.
    var lead = 0.02;
    var onsets = [];
    for (var i = 0; i < total; i++) {
      var u = rnd();
      var pos = Math.pow(u, 1.25);           // mild early bias
      onsets.push(lead + pos * span);
    }
    onsets.sort(function (a, b) { return a - b; });

    // Enforce a real minimum spacing between successive knocks. The analyzer's
    // hop is ~23 ms, so knocks closer than that merge into one detected onset
    // and the patter reads as a single thump. A ~34 ms floor keeps each contact
    // distinct while still overlapping in ring/decay — a patter, not a march.
    var minGap = 0.034;
    for (var j = 1; j < onsets.length; j++) {
      if (onsets[j] - onsets[j - 1] < minGap) onsets[j] = onsets[j - 1] + minGap;
    }

    for (var k = 0; k < total; k++) {
      var isSettle = k >= primary;
      // fundamental: warm low sticks, ~150–420 Hz, each piece its own pitch.
      var f0 = 150 + rnd() * 270;
      // heavier/earlier primaries hit harder; settle taps are soft.
      var level, decay, heavy;
      if (isSettle) {
        level = 0.16 + rnd() * 0.14;          // quiet settle taps
        decay = 0.030 + rnd() * 0.030;        // short, dry
        heavy = false;
      } else {
        // primaries: the first ones a touch louder (the initial drop), fading
        // as the pile settles.
        var early = 1 - (k / Math.max(1, primary)) * 0.35;
        level = (0.34 + rnd() * 0.22) * early;
        decay = 0.045 + rnd() * 0.045;        // 45–90 ms body
        heavy = (rnd() < 0.5) && f0 < 300;    // lower, harder pieces get a thump
      }
      knock(t0 + onsets[k], f0, level, decay, heavy);
    }

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
