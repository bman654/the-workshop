/* ═══════════════════════════════════════════════════════════════════════════
   cento-clatter.js  —  Gate.sfx['cento-clatter']

   THE SPILLED SLUG — lead on lead, tipped out of the galley into its box.

   ── The approach: a small MODAL PHYSICAL MODEL, not a noise burst ────────────
   Lead is heavy and acoustically DEAD: density ~11.3 g/cm3, internal damping so
   high that a struck lead bar has a Q of a few dozen where brass has thousands.
   So a lead-on-lead impact is almost ALL transient — a broadband contact click
   plus a handful of inharmonic modes that are gone in 20-30 ms. It goes CHOCK.
   The only thing that lingers is not the metal at all: it is the WOODEN BOX the
   slug landed in — a compartment whose panels and trapped air ring an order of
   magnitude longer (~150-250 ms) at a low, soft, unpitched-sounding cluster.

   We build exactly that, in three layers per strike:

     1. CONTACT  — a very short seeded-noise transient (sub-millisecond attack,
        ~7-12 ms decay) through a low-pass whose corner DROPS strike by strike.
        This is the actual "chock": the sound of two soft faces meeting.

     2. LEAD MODES — 4 inharmonic damped sines (ratios 1 : 1.41 : 2.07 : 2.76,
        deliberately NOT integer, so no pitch is implied), amplitudes low and
        decays 16-34 ms. Enough to give the click a metallic DENSITY without
        ever letting it ring.

     3. BODY THUMP — a low damped sine (68-88 Hz) that is the mass of the slug
        arriving: the shove the whole box takes.

   Across the three strikes, a shared BOX RESONATOR (a BEATING PAIR of cavity-air
   modes ~13 Hz apart, plus five wooden panel modes from the floor panel up to the
   stiff corner) is re-excited at descending levels and left to decay. The pair
   matters: one clean low mode held long enough to glue the impacts together also
   reads as a NOTE (the analysis caught it doing exactly that), and this room
   allows no tonality. Two close modes beating against each other give the same
   continuity as an unpitched thrum. The upper panels are what put the sound
   INSIDE a compartment rather than out on a bench.

   ── The gesture ─────────────────────────────────────────────────────────────
   Three impacts with PHYSICAL, uneven spacing — the slug lands flat (73 ms of
   near-silence), tips onto an edge (65 ms), settles. Each is quieter, lower and
   duller than the last, because each remaining drop is smaller: measured, they
   peak at -6.3, -8.3 and -15.1 dBFS with valleys 40 and 46 dB down between them,
   so all three read as DISTINCT events. Then a last small scatter — five
   featherweight ticks as individual types nudge into place, over a whisper-level
   broadband settle bed that OUTLIVES the last tick so the floor never drops out
   from under it. The tick peaks fall monotonically (-30.6, -36.0, -38.5, -42.2,
   -44.8 dBFS): nothing in the tail may ever read as a new event. Content is over
   by ~0.35 s and the file is digitally silent from ~0.39 s, well inside 0.55 s.

   Determinism: mulberry32(seed) fills the one shared noise buffer and drives
   every jitter; each strike reads the buffer at its own deterministic offset so
   the three contacts are different noise, same every render. NO Math.random.
   Two independent renders of this file are byte-identical.

   Headroom: everything sums into a master trim, a 40 Hz high-pass (no DC/subsonic
   build-up), a 3.4 kHz low-pass, a -4 dB shelf from 1.4 kHz — which is what keeps
   it DULL, no bell, no ting, no air — and finally the soft CEILING documented
   below, which exists because this fires with a rolling seed and the contact
   transient's peak is a per-seed lottery. Measured across seeds 1-128 at the
   22.05 kHz render rate: true peak -8.6 to -5.5 dBFS, mean RMS varying only
   2.5 dB; re-measured at the 48 kHz rate the ROOM actually runs at, -11.2 to
   -5.5 dBFS. Never clipping at either rate — the ceiling bounds it by
   construction, so the sample rate cannot surprise us. At seed 1 the
   spectral centroid is 328 Hz and it DARKENS across the gesture (372 -> 266 Hz):
   bright-ish chock first, dull rustle last, the direction a real impact decays.
   Analysis reports no detectable pitch.

   A note for whoever reads the analysis next: audio-lens reports `onsets: 1-2`
   here and that is EXPECTED, not a defect. Its onset detector has a 100 ms
   refractory (src/analyzers.js) while these impacts are 73 and 65 ms apart, and
   its flux threshold is relative to the file's LOUDEST transient. Three impacts
   are present and verified off the sample envelope (the levels quoted above).
   Do NOT stretch the timing to make that number read 3; the honest spacing of a
   falling object is worth more than a flattering metric.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32. Deterministic; drives noise + all jitter. ──────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  Gate.sfx['cento-clatter'] = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = (opts.dur == null) ? 0.55 : opts.dur;
    var when = opts.when || 0;
    var seed = (opts.seed == null) ? 1 : opts.seed;

    var t0 = ctx.currentTime + when;
    var endAll = t0 + dur;
    var rnd = mulberry32((seed | 0) || 1);

    // ── Output chain: master → HP(40) → LP(3400) → high-shelf cut → dest ──────
    // The two-stage top end is what makes this read as LEAD and not as a bell:
    // it removes the bright contact spit that any impulse carries, leaving the
    // dense low-mid body. Sample rate is 22.05 kHz offline, so the shelf sits
    // comfortably inside band.
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.42, t0);   // trim → true peak ≈ -6.5 dBFS (all seeds)

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(40, t0);
    hp.Q.setValueAtTime(0.7, t0);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3400, t0);
    lp.Q.setValueAtTime(0.6, t0);

    var tilt = ctx.createBiquadFilter();
    tilt.type = 'highshelf';
    tilt.frequency.setValueAtTime(1400, t0);
    tilt.gain.setValueAtTime(-4, t0);       // dull the whole thing, softly

    /* ── The CEILING ─────────────────────────────────────────────────────────
       A soft peak limiter, and the reason it exists is worth writing down: the
       contact transient is a ~0.7 ms slice of noise, so its peak is the maximum
       of roughly fifteen samples — a small-sample lottery that the seed decides.
       Measured across seeds 1-48, the mean RMS moves only ~3 dB (the sound is
       consistently LOUD) but the true peak ranged from -8 to +1.9 dBFS: two
       spills in forty-eight CLIPPED. The room fires this with a rolling seed, so
       that is not a curiosity, it is a defect the visitor would eventually hear.
       (It went unseen because every render made while this was designed and
       judged used seed 1, which sits innocently at -6.)

       The layers that could be fixed by tuning were NOT the problem: with the
       contact muted, the lead, box and mass layers vary by less than 0.35 dB
       across the same seeds. Trimming the master to make the worst seed safe
       would make every other seed 4-6 dB too quiet, so instead the top few dB
       are bounded here:

         |x| <= T  →  identity, sample for sample (the whole sound, nearly always)
         |x| >  T  →  T + (C-T)·tanh((|x|-T)/(C-T)), asymptotic to C

       The two pieces meet with matching value AND slope at T, so there is no
       corner to buzz on, and the curve is flat past full scale — the output
       CANNOT exceed C = -5.5 dBFS no matter what the seed does. In practice it
       touches only the handful of samples at the very tip of a hot strike. */
    var CEIL_T = 0.47, CEIL_C = 0.53;
    var shaper = ctx.createWaveShaper();
    (function () {
      var N = 2048, curve = new Float32Array(N), k = CEIL_C - CEIL_T;
      for (var i = 0; i < N; i++) {
        var x = (i / (N - 1)) * 2 - 1, ax = x < 0 ? -x : x;
        var y = ax <= CEIL_T ? ax : CEIL_T + k * Math.tanh((ax - CEIL_T) / k);
        curve[i] = x < 0 ? -y : y;
      }
      shaper.curve = curve;
      // oversample stays 'none' ON PURPOSE. '4x' runs up/down-sampling filters
      // that colour the signal even where the curve is a pure identity: measured,
      // it moved the spectral centroid 328 -> 360 Hz on a seed the ceiling never
      // even touches. A permanent tilt on every spill is a far worse trade than a
      // little aliasing on the rare hot one — especially here, where everything
      // upstream is already low-passed at 3.4 kHz, so the knee has very little
      // high harmonic content to fold in the first place.
      shaper.oversample = 'none';
    }());

    master.connect(hp).connect(lp).connect(tilt).connect(shaper).connect(dest);

    // ── One shared seeded noise buffer. Each contact reads a different offset,
    //    so the three strikes are audibly different grains of the same material.
    var nSec = 0.5;
    var nLen = Math.max(1, Math.floor(ctx.sampleRate * nSec));
    var noiseBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    (function () {
      var d = noiseBuf.getChannelData(0);
      var lp1 = 0;
      for (var i = 0; i < nLen; i++) {
        var w = rnd() * 2 - 1;
        lp1 = lp1 + 0.35 * (w - lp1);       // gentle low tilt: material, not hiss
        d[i] = 0.45 * w + 0.85 * lp1;
      }
    }());

    var live = [];   // every source, so we can guarantee nothing outruns the window

    function startStop(node, a, b) {
      if (b > endAll) b = endAll;
      if (b <= a) b = a + 0.001;
      node.start(a);
      node.stop(b);
      live.push(node);
    }

    /* ── A damped sine partial ────────────────────────────────────────────────
       freq  : Hz
       amp   : peak gain
       decay : seconds to ~-80 dB (the audible tail is roughly half this)
       atk   : attack in seconds (tiny — an impact HAS a discontinuity, but a
               sub-ms ramp avoids an ugly digital pop)                          */
    function partial(start, freq, amp, decay, atk, type, glideTo) {
      if (start >= endAll || amp <= 0.0003) return;
      var osc = ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, start);
      // Real struck metal drops a few cents as the contact stress relaxes; a
      // MASS layer drops much further (glideTo), because the contact patch
      // spreads as the weight arrives and the effective spring softens.
      osc.frequency.exponentialRampToValueAtTime(
        glideTo || freq * 0.985,
        start + (glideTo ? Math.min(decay, 0.062) : decay)
      );

      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(amp, start + (atk || 0.0006));
      g.gain.exponentialRampToValueAtTime(amp * 0.0002, start + decay);
      g.gain.setValueAtTime(0, start + decay + 0.001);

      osc.connect(g).connect(master);
      startStop(osc, start, start + decay + 0.004);
    }

    /* ── A contact transient: seeded noise through a low-pass, very fast in and
       out. This is the actual CHOCK — two soft dense faces meeting.            */
    function contact(start, amp, cutoff, decay, offset) {
      if (start >= endAll) return;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;

      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(cutoff, start);
      // The corner collapses within the transient: the bright edge of a soft
      // impact dies far faster than its body does.
      f.frequency.exponentialRampToValueAtTime(cutoff * 0.35, start + decay);
      f.Q.setValueAtTime(0.9, start);

      // A shallow band emphasis around the contact region gives the click a
      // sense of SIZE (a small flat slab, not a point).
      var body = ctx.createBiquadFilter();
      body.type = 'peaking';
      body.frequency.setValueAtTime(cutoff * 0.42, start);
      body.Q.setValueAtTime(1.1, start);
      body.gain.setValueAtTime(5, start);

      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(amp, start + 0.0007);   // near-instant
      g.gain.exponentialRampToValueAtTime(amp * 0.0004, start + decay);
      g.gain.setValueAtTime(0, start + decay + 0.001);

      src.connect(f).connect(body).connect(g).connect(master);
      src.start(start, offset, Math.min(decay + 0.02, nSec - offset));
      live.push(src);
    }

    /* ── The wooden compartment. Three panel modes + one cavity-air mode,
       re-excited by each strike at a descending level. Wood is far less damped
       than lead, so THIS is what "settling in a box" actually sounds like.
       Frequencies are a deliberately unpitched cluster (no consonant interval),
       so the box reads as an object and never as a note.                       */
    var BOX = [
      { f: 96,  a: 0.135, d: 0.195, type: 'sine'    },  // cavity air (lower pair)
      { f: 109, a: 0.115, d: 0.165, type: 'sine'    },  // cavity air (upper pair) — beats
                                                        //   with the one above: thrum, not note
      { f: 163, a: 0.17, d: 0.155, type: 'sine'     },  // floor panel
      { f: 247, a: 0.15, d: 0.092, type: 'triangle' },  // side panel, a little edge
      { f: 341, a: 0.10, d: 0.074, type: 'sine'     },  // end panel — the compartment's
                                                        //   short wall; this is the band a
                                                        //   small wooden box speaks loudest
                                                        //   in, and the layer that makes the
                                                        //   impacts read as being INSIDE it
      { f: 452, a: 0.055, d: 0.056, type: 'sine'    },  // the stiff corner
      { f: 389, a: 0.062, d: 0.060, type: 'sine'    }   // the small stiff wall
    ];
    // `decScale` shortens the box's answer for the later strikes. This matters:
    // extra box level makes the sound heavier, but extra box SUSTAIN fills the
    // valleys between the impacts, and the valleys are what make three impacts
    // read as three. Later strikes get the weight and not the ring — which is
    // also physically right, since a slug already lying in the compartment damps
    // the panels it is resting on.
    function excite_box(start, level, decScale) {
      decScale = (decScale == null) ? 1 : decScale;
      for (var i = 0; i < BOX.length; i++) {
        var m = BOX[i];
        // A few percent of seeded detune per strike: the box never answers twice
        // in exactly the same way, because the slug never lands twice the same.
        // (This is load-bearing, not decoration: a box that answers identically
        // every strike autocorrelates into a NOTE, and a box in tune is a bell.)
        var f = m.f * (0.97 + 0.06 * rnd());
        partial(start, f, m.a * level, m.d * decScale * (0.85 + 0.3 * rnd()), 0.0022, m.type);
      }
    }

    /* ── ONE STRIKE: contact + lead modes + body thump + box excitation ─────── */
    // Lead's modal ratios: deliberately inharmonic so nothing implies a pitch.
    var LEAD_RATIO = [1.00, 1.41, 2.07, 2.76];
    var LEAD_AMP   = [0.34, 0.20, 0.11, 0.055];
    var LEAD_DECAY = [0.034, 0.026, 0.021, 0.016];   // DEAD. Lead does not ring.

    // `body` scales ONLY the mass/box layers, never the contact. It is how the
    // later strikes gain weight without gaining brightness: a smaller remaining
    // drop makes less of a click but still puts the same lump of lead into the
    // compartment floor.
    function strike(start, level, cutoff, f0, thumpHz, noiseOff, body, boxDec) {
      body = (body == null) ? 1 : body;
      contact(start, 2.65 * level, cutoff, 0.011 + 0.004 * rnd(), noiseOff);

      for (var i = 0; i < LEAD_RATIO.length; i++) {
        partial(
          start,
          f0 * LEAD_RATIO[i] * (0.985 + 0.03 * rnd()),
          LEAD_AMP[i] * level,
          LEAD_DECAY[i] * (0.85 + 0.3 * rnd()),
          0.0005,
          'sine'
        );
      }

      // The mass arriving — the shove the whole box takes. It GLIDES DOWN a
      // fifth-ish across its own decay: a fixed low sine reads as a tone, a
      // falling one reads as weight, and weight is what the brief is asking for.
      // Only HALF the body boost goes to the sub: mass is cheap to add and
      // expensive to overdo — too much of it masks the contact chock on the
      // small speakers this actually plays on, which is the difference between
      // "dull and dense" and "barely there". The other half goes to the box,
      // where it thickens the compartment instead of the floor.
      partial(start + 0.0012, thumpHz * 1.22, 0.275 * level * (1 + (body - 1) * 0.5),
              0.070 * (0.9 + 0.2 * rnd()), 0.0018, 'sine', thumpHz * 0.74);

      excite_box(start + 0.0009, level * body, boxDec);
    }

    /* ── THE GESTURE ─────────────────────────────────────────────────────────
       Land flat → 63 ms → tip onto an edge → 47 ms → settle. Uneven on purpose:
       a body falling under gravity does not keep time. Each strike is quieter,
       lower and duller, because each remaining drop is smaller.                */
    strike(t0 + 0.006, 1.00, 2200, 196, 84, 0.010, 1.14, 1.00);   // the slug lands
    strike(t0 + 0.079, 0.62, 1750, 171, 74, 0.130, 1.28, 0.72);   // it tips
    strike(t0 + 0.144, 0.36, 1400, 152, 67, 0.245, 1.34, 0.80);   // it settles

    /* ── THE SCATTER ─────────────────────────────────────────────────────────
       Four featherweight ticks — individual types nudging against their
       neighbours as the slug comes to rest. Tiny, dull, unevenly spaced,
       fading to nothing well inside the window.                                */
    // Levels are STRICTLY MONOTONE and the spacing widens: nothing here may ever
    // read as a NEW event. (An earlier settle left a silent hole at 0.28–0.31 s
    // and then fired a tick into it, which is exactly how a tail acquires a
    // second, unmotivated sound. The 0.291 tick fills that hole.)
    var scat = [
      { t: 0.192, a: 0.115, c: 2000, o: 0.300 },
      { t: 0.221, a: 0.078, c: 1800, o: 0.335 },
      { t: 0.263, a: 0.050, c: 1620, o: 0.372 },
      { t: 0.291, a: 0.036, c: 1520, o: 0.388 },
      { t: 0.326, a: 0.024, c: 1450, o: 0.404 }
    ];
    for (var s = 0; s < scat.length; s++) {
      var sc = scat[s];
      var st = t0 + sc.t + 0.010 * (rnd() - 0.5);
      contact(st, sc.a, sc.c, 0.006 + 0.003 * rnd(), sc.o);
      // a whisper of the box answering each nudge — long enough to bridge the
      // gap to the next one, so the settle never falls into digital silence
      partial(st + 0.001, 163 * (0.97 + 0.06 * rnd()), sc.a * 0.40, 0.052, 0.0018, 'sine');
      partial(st + 0.001, 247 * (0.97 + 0.06 * rnd()), sc.a * 0.20, 0.038, 0.0018, 'sine');
    }

    // The bed must OUTLIVE the last tick, not decay out from under it: if the
    // floor drops to digital silence between ticks, each remaining tick reads as
    // an isolated event instead of as one object still moving. It runs to just
    // past the final tick and only then lets go.
    (function settleBed() {
      var bStart = t0 + 0.150, bLen = 0.212;
      if (bStart + bLen > endAll - 0.02) bLen = (endAll - 0.02) - bStart;
      if (bLen <= 0.01) return;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(520, bStart);
      f.frequency.exponentialRampToValueAtTime(200, bStart + bLen);
      f.Q.setValueAtTime(0.7, bStart);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, bStart);
      g.gain.exponentialRampToValueAtTime(0.040, bStart + 0.012);
      // hold a real (if whisper-level) floor all the way to the last tick …
      g.gain.exponentialRampToValueAtTime(0.0032, bStart + bLen);
      // … then let go, quickly enough that the tail is properly gone, slowly
      // enough that the release itself is not an event.
      g.gain.exponentialRampToValueAtTime(0.00018, bStart + bLen + 0.030);
      g.gain.setValueAtTime(0, bStart + bLen + 0.031);
      src.connect(f).connect(g).connect(master);
      src.start(bStart, 0.020, Math.min(bLen + 0.05, nSec - 0.020));
      live.push(src);
    }());

    // Guarantee silence at the window edge: a short master fade nothing can outrun.
    master.gain.setValueAtTime(0.42, endAll - 0.012);
    master.gain.linearRampToValueAtTime(0, endAll - 0.001);

    // Live-use hook: cut the master (offline sources self-stop).
    return {
      stop: function (at) {
        var a = (at != null) ? at : ctx.currentTime;
        try { master.gain.cancelScheduledValues(a); } catch (e) {}
        try { master.gain.setValueAtTime(0, a); } catch (e) {}
        for (var i = 0; i < live.length; i++) { try { live[i].stop(a); } catch (e2) {} }
      }
    };
  };

}(typeof self !== 'undefined' ? self : this));
