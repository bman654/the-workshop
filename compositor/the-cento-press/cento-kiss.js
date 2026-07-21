/* ═══════════════════════════════════════════════════════════════════════════
   cento-kiss.js  —  Gate.sfx['cento-kiss']   (The Cento Press)

   THE PLATEN KISS — the cylinder meets the packed forme, and the press stops
   running free and starts to bite.

   ── The shape of the event ──────────────────────────────────────────────────
   A press does not go "thump". Several kilos of iron arriving on packed paper
   is a THREE-PART event, and the middle part is the only loud one:

     0. PAPER, before anything (≈14 ms out) — a dry grain of felt and stock,
        so the ear registers CONTACT a beat before it registers MASS.

     1. TAKE-UP (≈35 ms before contact) — the slack in the gearing and the bed
        goes out. A near-inaudible low rumble that RISES into the impact. You
        do not hear it as a sound; you hear it as the impact being INEVITABLE.

     2. CONTACT — the mass. Not a click, not a drum:
          • a low body glide 105 → 58 Hz (iron settling; the pitch drop IS the
            weight — a fixed sine reads as a tone, a falling one reads as mass)
          • broadband MASS grain under the sine, so the low end is a body with
            texture and not a bass note
          • an inharmonic partner near 88 Hz (1.52×, deliberately not a chord)
          • the PACKING SQUASH: noise through a lowpass whose corner collapses
            2100 → 240 Hz. Brightness dying that fast is felt and paper
            compressing — all articulation, no transient click.
          • an iron GLINT: two high-Q bands, gone in 55 ms. Iron was struck.

     3. SETTLE — the packing keeps giving under sustained load. A quiet
        60–100 Hz breath that outlives the impact and is still decaying when
        the window ends. The pull has begun; nothing has released.

   The low bus runs a gentle tanh saturator (harmonic ghost, so 58 Hz survives
   a laptop speaker) followed by a 30 Hz DC-blocking highpass — the saturator
   is what re-introduces offset, so the highpass must sit AFTER it.

   ── Discipline ──────────────────────────────────────────────────────────────
   Determinism: one seeded mulberry32 drives every noise sample and every
   micro-lurch step. No Math.random, no Date, no performance.now. Everything is
   scheduled synchronously against ctx.currentTime + when; every source stops by
   when + dur; nothing connects to ctx.destination. Peaks sit near −6 dBFS.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32 ────────────────────────────────────────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Seeded noise. `tilt` in [0,1] mixes in a one-pole low-passed copy: 0 = flat
     white (for the bright edge of the squash), 1 = heavy low tilt (for rumble
     that must have body and no hiss). */
  function noiseBuffer(ctx, dur, rnd, tilt) {
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var lp = 0, alpha = 0.10;
    for (var i = 0; i < n; i++) {
      var w = rnd() * 2 - 1;
      lp = lp + alpha * (w - lp);
      d[i] = (1 - tilt) * w + tilt * (lp * 3.2); // *3.2 restores level lost to LP
    }
    return buf;
  }

  /* A gentle odd-harmonic saturator (tanh), normalised so |x|<=1 maps to <=1.
     Adds the harmonic "ghost" that lets a 58 Hz fundamental survive a small
     speaker without adding any audible distortion at these levels. */
  function tanhCurve(k, n) {
    var c = new Float32Array(n), d = Math.tanh(k);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(k * x) / d;
    }
    return c;
  }

  Gate.sfx['cento-kiss'] = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = (opts.dur == null) ? 0.45 : opts.dur;
    var when = opts.when || 0;
    var seed = (opts.seed == null) ? 1 : opts.seed;

    var t0 = ctx.currentTime + when;
    var rnd = mulberry32((seed | 0) || 1);
    var EPS = 0.0001;

    // The contact instant. The take-up and the paper grain occupy the time before it.
    var hit = t0 + 0.035;
    var tEnd = t0 + dur;                            // the window edge itself
    var endAll = t0 + Math.max(0.20, dur - 0.004);  // the settle decays INTO the edge

    // ── Master ────────────────────────────────────────────────────────────────
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.321, t0);
    // (master connects to dest through the output DC block, below)

    // Low bus → sub shelf → saturator → DC-blocking highpass → master.
    // The highpass sits AFTER the saturator: tanh is what creates the offset,
    // so blocking before it would leave the offset in the signal.
    var sat = ctx.createWaveShaper();
    sat.curve = tanhCurve(1.45, 1024);
    sat.oversample = '2x';
    var dcBlock = ctx.createBiquadFilter();
    dcBlock.type = 'highpass';
    dcBlock.frequency.setValueAtTime(30, t0);
    dcBlock.Q.setValueAtTime(0.6, t0);              // no resonant bump at the corner
    // +2 dB under ~70 Hz: buys "kilos of iron" against the 80–160 Hz band without
    // touching the inharmonic architecture that keeps this from reading as a note.
    var subShelf = ctx.createBiquadFilter();
    subShelf.type = 'lowshelf';
    subShelf.frequency.setValueAtTime(70, t0);
    subShelf.gain.setValueAtTime(2.0, t0);
    var lowBus = ctx.createGain();
    lowBus.gain.setValueAtTime(1.0, t0);
    lowBus.connect(subShelf).connect(sat).connect(dcBlock).connect(master);

    // A second 30 Hz block on the master OUTPUT. The low bus is the main offender
    // (tanh is what creates the offset) but the layers that go straight to master
    // ride on low-tilted noise beds whose slow wander reads as offset too; one
    // more pole here takes the whole file's DC to the noise floor.
    var dcOut = ctx.createBiquadFilter();
    dcOut.type = 'highpass';
    dcOut.frequency.setValueAtTime(30, t0);
    dcOut.Q.setValueAtTime(0.5, t0);
    master.connect(dcOut).connect(dest);

    // Shared seeded noise beds (one buffer each; several readers is fine).
    var nWide = noiseBuffer(ctx, dur + 0.1, rnd, 0.15);   // paper + squash + glint
    var nLow  = noiseBuffer(ctx, dur + 0.1, rnd, 0.95);   // take-up + mass
    // The settle needs a DENSER bed than nLow: a heavily low-tilted noise band
    // filtered to 60–100 Hz has so few decorrelated components that its own
    // envelope wobbles several dB, which reads as unrest rather than as a shelf.
    var nMid  = noiseBuffer(ctx, dur + 0.1, rnd, 0.55);   // settle

    // ── 0. THE PAPER, BEFORE THE MASS ─────────────────────────────────────────
    // A dry grain of felt and stock 14 ms out. It is not a transient — it rises
    // over 10 ms and is swallowed by the contact — but it is the difference
    // between iron landing on PACKED PAPER and iron landing on an anvil.
    (function paper() {
      var src = ctx.createBufferSource(); src.buffer = nWide;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, t0);
      bp.Q.setValueAtTime(0.8, t0);
      var g = ctx.createGain();
      g.gain.setValueAtTime(EPS, hit - 0.014);
      g.gain.exponentialRampToValueAtTime(0.030, hit - 0.003);
      g.gain.exponentialRampToValueAtTime(EPS, hit + 0.022);
      src.connect(bp).connect(g).connect(master);
      src.start(hit - 0.014); src.stop(hit + 0.05);
    }());

    // ── 1. TAKE-UP ────────────────────────────────────────────────────────────
    // Slack going out of the gearing: a rumble that swells INTO the contact and
    // is swallowed by it. Felt, not heard — but it is why the impact feels
    // arrived-at rather than dropped in from nowhere.
    (function takeUp() {
      var src = ctx.createBufferSource(); src.buffer = nLow;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(120, t0);
      lp.frequency.exponentialRampToValueAtTime(85, hit);
      lp.Q.setValueAtTime(0.5, t0);
      var g = ctx.createGain();
      // The swell must stay UNDER the ear's event threshold until the contact,
      // or it becomes the transient instead of the thing that precedes one.
      g.gain.setValueAtTime(EPS, t0);
      g.gain.exponentialRampToValueAtTime(0.012, t0 + 0.004); // up to level fast…
      g.gain.exponentialRampToValueAtTime(0.018, hit - 0.012); // …then a slow crawl
      g.gain.exponentialRampToValueAtTime(0.045, hit);         // lean into contact
      g.gain.exponentialRampToValueAtTime(EPS, hit + 0.03);    // swallowed by it
      src.connect(lp).connect(g).connect(lowBus);
      src.start(t0); src.stop(hit + 0.06);
    }());

    // ── 2a. CONTACT — the low body ────────────────────────────────────────────
    // 105 → 58 Hz in 55 ms, then a slow droop to 55 Hz. The FALL is the weight.
    // 7.5 ms attack: iron-hard, and take 1 proved an ~11 ms rise carries no
    // click risk at all, so there is margin to be this tight.
    (function body() {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(105, hit);
      osc.frequency.exponentialRampToValueAtTime(58, hit + 0.055);
      osc.frequency.exponentialRampToValueAtTime(55, hit + 0.30);
      var g = ctx.createGain();
      g.gain.setValueAtTime(EPS, hit);
      g.gain.linearRampToValueAtTime(1.0, hit + 0.0075);
      g.gain.exponentialRampToValueAtTime(0.16, hit + 0.075);  // fast first drop
      g.gain.exponentialRampToValueAtTime(EPS, hit + 0.20);    // short — the MASS grain, not the sine, carries the low end
      osc.connect(g).connect(lowBus);
      osc.start(hit); osc.stop(endAll);
    }());

    // ── 2a′. CONTACT — the low MASS (the grain under the body) ────────────────
    // A pure low sine on its own is a kick drum. What makes this IRON ON PAPER
    // rather than a drum is that the low end has TEXTURE: broad band-limited
    // noise centred at ~95 Hz sitting right under the sine, decaying with it.
    // It is the single most important layer in this take — remove it and the
    // whole thing collapses back into a bass note (and the pitch detector,
    // which currently reads "none", would lock a period).
    (function mass() {
      var src = ctx.createBufferSource(); src.buffer = nLow;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(130, hit);
      bp.frequency.exponentialRampToValueAtTime(88, hit + 0.09);
      bp.Q.setValueAtTime(1.5, hit);
      var g = ctx.createGain();
      g.gain.setValueAtTime(EPS, hit);
      g.gain.linearRampToValueAtTime(0.70, hit + 0.003);
      g.gain.exponentialRampToValueAtTime(0.12, hit + 0.070);
      g.gain.exponentialRampToValueAtTime(EPS, hit + 0.21);
      src.connect(bp).connect(g).connect(lowBus);
      src.start(hit); src.stop(hit + 0.24);
    }());

    // ── 2b. CONTACT — the inharmonic partner ──────────────────────────────────
    // 88 Hz against 58 Hz is deliberately NOT a harmonic ratio (1.52). Two notes
    // would be a chord; two unrelated low partials are a lump of metal.
    (function partner() {
      var osc = ctx.createOscillator();
      osc.type = 'triangle';                 // a little upper edge for definition
      osc.frequency.setValueAtTime(112, hit);
      osc.frequency.exponentialRampToValueAtTime(88, hit + 0.040);
      var g = ctx.createGain();
      g.gain.setValueAtTime(EPS, hit);
      g.gain.linearRampToValueAtTime(0.22, hit + 0.005);
      g.gain.exponentialRampToValueAtTime(EPS, hit + 0.10);   // dies twice as fast
      osc.connect(g).connect(lowBus);
      osc.start(hit); osc.stop(hit + 0.16);
    }());

    // ── 2c. CONTACT — the packing squash ──────────────────────────────────────
    // The corner frequency COLLAPSING 2100 → 240 Hz is the paper and felt
    // compressing. The noise is already running when the filter and envelope
    // open, and the envelope now takes 3.5 ms to reach level rather than 1.8 —
    // this layer is the brightest thing in the file and therefore the only real
    // click risk in it.
    (function squash() {
      var src = ctx.createBufferSource(); src.buffer = nWide;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.setValueAtTime(0.9, hit);
      lp.frequency.setValueAtTime(2100, hit);
      lp.frequency.exponentialRampToValueAtTime(240, hit + 0.070);
      // Scoop the boxy 300–500 Hz region so the squash stays dull, not papery-mid.
      var scoop = ctx.createBiquadFilter();
      scoop.type = 'peaking';
      scoop.frequency.setValueAtTime(380, hit);
      scoop.Q.setValueAtTime(1.1, hit);
      scoop.gain.setValueAtTime(-5, hit);
      var g = ctx.createGain();
      g.gain.setValueAtTime(EPS, hit);
      g.gain.linearRampToValueAtTime(0.68, hit + 0.0035);
      // MICRO-LURCH: packing does not compress smoothly, it gives in small
      // irregular increments. Seeded ±~0.8 dB steps ride the decay down; the
      // envelope is monotone across every step, so nothing reads as a 2nd event.
      (function lurchDecay() {
        var a = 0.68, b = 0.066, t = hit + 0.0035, tEndL = hit + 0.055;
        var span = tEndL - t, k = 6;
        for (var i = 1; i <= k; i++) {
          var f = i / k;
          var lvl = a * Math.pow(b / a, f) * (1 + (rnd() - 0.5) * 0.18);
          g.gain.exponentialRampToValueAtTime(Math.max(EPS, lvl), t + span * f);
        }
      }());
      g.gain.exponentialRampToValueAtTime(EPS, hit + 0.16);
      src.connect(lp).connect(scoop).connect(g).connect(master);
      src.start(hit); src.stop(hit + 0.18);
    }());

    // ── 2d. CONTACT — the iron glint ──────────────────────────────────────────
    // Two narrow bands, gone in 55 ms. Both takes ran this layer too quietly and
    // both smiths said so; it is lifted ~5 dB here, which is what turns a soft
    // mass into CAST iron. There is enormous headroom above 250 Hz, so it costs
    // nothing in peak and adds no click (a 5 ms rise on a −20 dB layer).
    (function glint() {
      [[1180, 11, 0.145], [2050, 15, 0.085]].forEach(function (spec) {
        var src = ctx.createBufferSource(); src.buffer = nWide;
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(spec[0], hit);
        bp.Q.setValueAtTime(spec[1], hit);
        var g = ctx.createGain();
        g.gain.setValueAtTime(EPS, hit);
        g.gain.linearRampToValueAtTime(spec[2], hit + 0.005);
        g.gain.exponentialRampToValueAtTime(EPS, hit + 0.055);
        src.connect(bp).connect(g).connect(master);
        src.start(hit); src.stop(hit + 0.08);
      });
    }());

    // ── 3. SETTLE ─────────────────────────────────────────────────────────────
    // The packing keeps giving under load after the impact is over — ONE gentle
    // shelf, established while the contact is still loud enough to mask its
    // rise, then monotonically declining so it can never read as a second event.
    // Its band sits 60–100 Hz (not sub-60): a settle nobody can hear on a laptop
    // is not a promise of effort. It is still decaying at the window edge, so
    // the sound does not resolve — it just stops being loud.
    (function settle() {
      var src = ctx.createBufferSource(); src.buffer = nMid;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(130, hit);
      lp.frequency.exponentialRampToValueAtTime(95, endAll);
      lp.Q.setValueAtTime(0.45, hit);
      var g = ctx.createGain();
      g.gain.setValueAtTime(EPS, hit + 0.004);
      g.gain.exponentialRampToValueAtTime(0.115, hit + 0.055);  // under the impact
      // MICRO-LURCH on the shelf: seeded irregular steps, each strictly below the
      // last, so material-under-load has texture without any envelope re-swell.
      (function lurchShelf() {
        var a = 0.115, b = 0.052, t = hit + 0.055, tEndL = t0 + 0.34;
        var span = tEndL - t, k = 5, prev = a;
        for (var i = 1; i <= k; i++) {
          var f = i / k;
          var lvl = a * Math.pow(b / a, f) * (1 + (rnd() - 0.5) * 0.10);
          lvl = Math.min(lvl, prev * 0.985);       // strictly monotone
          prev = lvl;
          g.gain.exponentialRampToValueAtTime(Math.max(EPS, lvl), t + span * f);
        }
      }());
      g.gain.exponentialRampToValueAtTime(0.014, endAll);       // still under load
      src.connect(lp).connect(g).connect(lowBus);
      src.start(hit + 0.004); src.stop(tEnd);
    }());

    // Master fade to true zero at the window edge — no truncation click, and the
    // last nonzero sample lands ON the edge rather than 16 ms short of it.
    master.gain.setValueAtTime(0.321, endAll);
    master.gain.linearRampToValueAtTime(0, tEnd);

    // Live-use hook (the offline render never needs it; the page may).
    return {
      stop: function (at) {
        var when2 = (at != null) ? at : ctx.currentTime;
        try { master.gain.cancelScheduledValues(when2); } catch (e) {}
        try { master.gain.setTargetAtTime(0, when2, 0.01); } catch (e) {}
      }
    };
  };

}(typeof self !== 'undefined' ? self : this));
