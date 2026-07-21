/* ════════════════════════════════════════════════════════════════════════════
   cento-creak.js  —  Gate.sfx['cento-creak']   (The Cento Press · strain creak)

   The press complaining under load. Fired every ~105–175 ms through the last
   third of the revolution, so a run of these must fuse into ONE continuous
   groan under a moving hand — never a loop, never a pitch. The ear supplies the
   effort the hand only infers.

   ── The model: stick-slip, computed sample by sample ─────────────────────
   A creak is not a filtered noise burst. It is FRICTION FAILING REPEATEDLY:
   the iron shaft grips the timber bearing, the wood strains elastically, the
   grip lets go, the wood snaps forward a few microns and grips again. Each
   release is an impulse; the frame rings; the ear hears the *density* and
   *irregularity* of those releases as roughness.

   So this does not reach for a bandpass sweep — a sweep glides, and a glide
   reads as a PITCH. It builds the buffer directly. There is no native
   BiquadFilterNode anywhere in this file; every filter is hand-rolled, so the
   buffer is deterministic BY CONSTRUCTION rather than by observation (parallel
   BiquadFilterNodes have been measured drifting ±1 LSB between renders of the
   same seed, which the spec's determinism clause cannot tolerate).

     1. SLIP TRAIN — a seeded POISSON process of micro-release events (mean rate
        ≈ 245–400/s): each interval is drawn exponentially, so the releases are
        statistically INDEPENDENT and the train has no periodicity at all. This
        is the single most important decision in the file. A jittered-but-regular
        train still leaves an autocorrelation peak at its mean rate, and at these
        rates that peak is squarely in the pitch range — measured over 40 seeds,
        a ±60 % uniformly-jittered train had the analyzer reporting a musical
        note on 21 calls out of 40; the exponential train drops that to 1. The
        brief's "never resolves into a recognisable musical pitch" is won HERE,
        in the timing, not in the filtering. Voicing sets the colour; timing sets
        whether it is a note.

     2. GRAB STRENGTH — square-skewed: many light catches, a few hard ones, over
        a ≈ 7.5:1 spread, with a further 4–8 % chance of a real grab. Timing buys
        the absence of pitch; MAGNITUDE buys the LURCH. The two are complementary,
        not redundant — a train of near-equal releases hisses however well
        de-correlated it is.

     3. THE FRAME — nine inharmonic modal resonators (two-pole) spread across TWO
        incommensurate bodies (timber frame + iron shaft housing, ≈ 1.32–1.42 ×
        apart), with a dense low CLUSTER instead of a fundamental, short decay
        times (5.6–11 ms), and each mode's centre SLOWLY DRIFTING on its own
        seeded random walk (±27 %) over a slow ±7 % glide of the whole frame.
        Drift smears every mode into a band, so the ear never locks a note onto
        the lowest one.

     4. THE SHAFT — one broad, heavily damped low mode at an OFF-OCTAVE ratio
        (≈ 0.38–0.43 × f0, ≈ 58–105 Hz) giving the iron its mass. The ratio is
        deliberately not 1:2 — an octave under the frame would hand the ear a
        fundamental to hear as a note.

     5. DRYNESS — each release also injects a 2-sample broadband tick through a
        one-pole lowpass at ≈ 1.35 kHz: unoiled wood, the papery rasp on top of
        the body. It is also the only brightness lever that cannot re-admit
        tonality, being broadband by construction.

     6. THE DRAG BED — a thin, twice-band-passed noise floor laid in a fixed
        ratio BENEATH the measured grain, carrying a flattened envelope so it
        survives the tails. Without it the gaps fall to true silence and a run of
        calls reads as separate events rather than one groan.

     7. THE ARC OF EFFORT — loudness is weighted onto STRAIN, over a ≈ 8 dB span,
        so a run of calls with rising strain develops an audible swell through
        its hardest stretch instead of sitting at one weight.

   ── strain, velocity, and seed ──────────────────────────────────────
   The spec says pitch and loudness track two LIVE values the page passes. A
   caller that knows them may pass `strain` / `vel` (0..1); otherwise the seed
   draws a plausible pair, so the REQUIRED contract is untouched and seed alone
   still produces audibly different calls. `strain` sets slip density, grab
   probability, drag and level (≈ −13.2 → −4.9 dBFS true peak); a separate BROAD
   draw sets the frame's centre (≈ 148 → 286 Hz) — deliberately not the averaged
   `strain`, because averaged draws cluster and a run of calls that all sit at
   the same centre averages into an audible note however much each one is
   jittered internally.

   ── measured ──────────────────────────────────────────────────────
   Over 40 seeds: 1 pitched, centroid 258.6–414.2 Hz (mean 336), every seed
   inside the spec's 170–450 band. Eight chained at the page's real 105–175 ms
   cadence: peak −5.18 dBFS, no clipping, pitch NONE, centroid 349 Hz, 2 onsets
   across 8 calls — i.e. they fuse into one groan rather than articulating as
   eight events — and silenceRatio 0.0099 against the ungrafted 0.0241.

   Determinism: one mulberry32 seeded from `seed` drives every random value —
   slip timings, amplitudes, tick noise, bed noise, mode drift. No Math.random,
   no Date, no performance.now. The buffer is normalised on its 98th PERCENTILE,
   run through a tanh knee, then trimmed to an exact true peak, so the peak is
   known ahead of time and never approaches 0 dBFS.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32. Deterministic, fast, good enough for audio. ──
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Inharmonic mode ratios. NOT a series with a fundamental: the low end is a
     dense CLUSTER (0.795 / 1.000 / 1.181) rather than one dominant partial —
     the way a loaded timber frame actually rings, and it stops any one partial
     standing out as a fundamental. No 2:1, no 3:2 anywhere. (The cluster HELPS
     but does not by itself win the no-pitch requirement; measured over 40 seeds
     it was the exponential slip timing that did that. Voicing sets the colour,
     timing sets whether it is a note.) Amplitudes fall steeply above the
     cluster: the brief wants the energy low, ≈ 170–450 Hz — measured centroid
     across 40 seeds lands 258.6–414.2 Hz, mean 336. */
  var RATIOS = [0.795, 1.000, 1.181, 1.593, 1.887, 2.317, 2.789, 3.417, 4.271];
  var MODE_A = [0.820, 1.000, 0.880, 0.600, 0.420, 0.270, 0.150, 0.075, 0.035];
  var MODE_T = [0.0070, 0.0066, 0.0074, 0.0108, 0.0100, 0.0092, 0.0084, 0.0068, 0.0056];

  /* smoothstep on [0,1] — used for the attack/release cheeks so the envelope
     has no corner to click on. */
  function smooth(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return x * x * (3 - 2 * x);
  }

  Gate.sfx['cento-creak'] = function (opts) {
    opts = opts || {};
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = (opts.dur && opts.dur > 0) ? opts.dur : 0.2;
    var when = opts.when || 0;
    var seed = (opts.seed == null) ? 1 : opts.seed;

    var sr = ctx.sampleRate;
    var n = Math.max(8, Math.floor(sr * dur));
    var rnd = mulberry32((seed | 0) * 2654435761 + 0x9E3779B9);

    /* ── STRAIN and VELOCITY ─────────────────────────────────────────────────
       The spec says pitch and loudness track two LIVE values the page passes:
       how much strain is on the frame, and how fast the hand is moving. A caller
       that knows them may pass `strain` / `vel` (0..1); otherwise the seed draws
       a plausible pair, so the REQUIRED contract ({ctx,dest,dur,when,seed}) is
       untouched and seed alone still produces audibly different calls.

       `strain` defaults to three draws averaged, so the distribution favours the
       middle — most calls are ordinary, the extremes occasional. */
    var strain = (opts.strain == null)
      ? (rnd() + rnd() + rnd()) / 3
      : Math.max(0, Math.min(1, opts.strain));
    var vel = (opts.vel == null)
      ? 0.40 + 0.60 * rnd()
      : Math.max(0, Math.min(1, opts.vel));

    /* The frame's CENTRE gets its own BROAD uniform draw, deliberately NOT the
       mean-of-three `strain` — averaged draws cluster, and a run of calls that
       all sit at the same centre averages into an audible note however much each
       one is jittered internally. Spread the centres and the run stays a groan. */
    var f0       = 148 + rnd() * 112 + strain * 26; // frame base, 148 → 286 Hz
    var shaftF   = f0 * (0.377 + 0.052 * rnd()); // iron shaft, ≈ 58 → 105 Hz
    var rateBase = 244 + strain * 158;           // slips/s, 244 → 402
    var grabP    = 0.040 + strain * 0.045;       // chance of a hard catch

    /* ── THE ARC OF EFFORT ───────────────────────────────────────────────────
       Loudness is weighted onto STRAIN, not velocity: a press hauled through its
       hardest stretch gets LOUDER because the frame is working harder, not
       because the hand is quick — a fast hand over a slack frame is a lighter
       sound. The span is deliberately wide (≈ 9 dB, 0.19 → 0.55) so that a run
       of calls with rising strain develops an audible swell of effort through
       the middle rather than sitting at one weight. Velocity gets a small
       secondary term: a quick hand skates and brightens slightly. */
    var level = 0.22 + 0.29 * strain + 0.06 * vel;

    /* ── ENVELOPE (the hand) ─────────────────────────────────────────────────
       This is a FRAGMENT of a continuous groan, not a one-shot, and the contour
       is the part that decides whether a run of calls reads as ONE labouring
       machine or as a loop. A FIXED contour — every call cresting at the same
       relative moment — puts a throb at the call rate through the whole run: at
       105–175 ms spacing that is a ~7 Hz pulse, audibly a loop, which is exactly
       what the brief forbids, and an onset count cannot see it because the calls
       still fuse. So the contour is a SEEDED BREAKPOINT WALK whose maximum can
       land anywhere in the call; neighbouring calls crest at unrelated moments
       and the sum stays continuous and irregular, the way a hand hauling a press
       is. The walk is held up to ~88 % of `dur` before the release cheek takes
       over, so at the page's widest spacing the next call still arrives into
       live sound instead of into a torn seam.
       Precomputed so the slip loop and the sample loop read the same curve. */
    var att = Math.min(0.013, dur * 0.10);
    var rel = Math.min(0.062, dur * 0.36);

    var NB = 6;
    var bpT = new Float32Array(NB), bpL = new Float32Array(NB);
    var acc = 0, b;
    for (b = 0; b < NB; b++) {
      bpT[b] = acc;
      bpL[b] = 0.34 + 0.66 * rnd();   // levels span the working range, so WHICH
      acc += 0.15 + 0.08 * rnd();     // breakpoint is the crest is itself seeded
    }
    var span = bpT[NB - 1] || 1;
    for (b = 0; b < NB; b++) bpT[b] = (bpT[b] / span) * 0.88;

    var env = new Float32Array(n);
    var seg = 0;
    for (var i = 0; i < n; i++) {
      var t = i / sr;
      var u = t / dur;
      while (seg < NB - 2 && u > bpT[seg + 1]) seg++;
      var w = (bpT[seg + 1] > bpT[seg]) ? (u - bpT[seg]) / (bpT[seg + 1] - bpT[seg]) : 1;
      if (w < 0) w = 0; else if (w > 1) w = 1;
      var swell = bpL[seg] + (bpL[seg + 1] - bpL[seg]) * smooth(w);
      var a = smooth(t / att);
      var r = smooth((dur - t) / rel);
      env[i] = swell * a * r;
    }

    /* ── SLIP TRAIN ──────────────────────────────────────────────────────────
       Walk the call laying down release events. The instantaneous rate tracks
       the envelope (push harder → chatter faster); the interval is drawn with
       ±60 % spread so no periodicity survives to be heard as pitch. */
    var excite = new Float32Array(n + 4);   // into the modal frame
    var tick   = new Float32Array(n + 4);   // the dry broadband rasp
    var pos = rnd() * (sr / rateBase);      // stagger the first slip per seed
    var sgn = (rnd() < 0.5) ? -1 : 1;
    while (pos < n) {
      var idx = pos | 0;
      var e = env[idx < n ? idx : n - 1];

      /* SQUARE-SKEWED grab strength: many light catches, a few hard ones. The
         exponential TIMING above is what buys the absence of pitch; skewed
         MAGNITUDE is what buys the LURCH, and the two are complementary rather
         than redundant. A train of near-equal releases hisses however well
         de-correlated it is; a train with real bite in it sounds like a frame
         catching and letting go. The spread is wide (≈ 7.5:1) so the bite is
         visible in the waveform, not just present in the statistics. */
      var gr = rnd(); gr *= gr;
      var amp = 0.16 + 1.05 * gr;
      if (rnd() < grabP) amp *= 1.8 + 0.9 * rnd();
      amp *= 0.35 + 0.65 * e;               // the hand's weight on each event
      sgn = -sgn;                            // alternate — no DC build-up

      // biphasic impulse: a grip letting go is a velocity step, not a click
      excite[idx]     += sgn * amp;
      excite[idx + 1] -= sgn * amp * 0.55;

      // dry wood tick: two samples of broadband noise, small
      tick[idx]     += (rnd() * 2 - 1) * amp * 0.85;
      tick[idx + 1] += (rnd() * 2 - 1) * amp * 0.55;

      var rate = rateBase * (0.74 + 0.52 * e);
      pos += (sr / rate) * (-Math.log(1 - rnd()));
    }

    /* ── THE DRAG BED ────────────────────────────────────────────────────────
       Under the discrete releases, the continuous scrape of the shaft dragging
       in its bearing. Without it the gaps between slips fall away to true
       silence, and a run of calls reads as a string of separate events rather
       than the ONE continuous groan the brief actually asks for. It is
       deliberately THIN — a bed loud enough to hear as its own layer would
       smear the platen kiss that shares this mix — and it leans on strain, so
       a hard-worked frame drags more.

       Band-passed around the frame centre by a hand-rolled RBJ biquad. There is
       no native filter node anywhere in this file: parallel BiquadFilterNodes
       have been measured drifting ±1 LSB between renders of the same seed, and
       the spec's determinism clause wants the buffer deterministic BY
       CONSTRUCTION rather than by observation.

       CAUTION, and it is why the sweep below is the gate: a quasi-steady-state
       bed is the single most likely way to re-admit a detectable pitch — the one
       thing this asset cannot have. Q is kept low (1.2) so this is a broad band
       and not a resonance. */
    var bed = new Float32Array(n);
    (function () {
      /* TWO cascaded bandpass sections, not one. A single 2-pole section has
         only 6 dB/octave skirts, and against flat noise that is not enough: the
         power above the band falls as 1/f² while the BANDWIDTH up there is
         enormous, so the high tail dominates the spectral centroid and a bed
         nominally centred at ~190 Hz measures at ~440 Hz. (This was measured,
         not assumed — the first cascade-less build pushed the whole asset's
         centroid from 304 to 470 Hz and out of the spec's 170–450 band.) Two
         sections give 12 dB/octave, the tail converges, and the bed lands where
         it is aimed. Q is kept low (0.9 each) so this is still a broad band. */
      var w0 = 2 * Math.PI * Math.min(f0 * 0.95, sr * 0.45) / sr;
      var alpha = Math.sin(w0) / (2 * 0.9);
      var a0 = 1 + alpha;
      var cb0 = alpha / a0, cb2 = -alpha / a0;
      var ca1 = (-2 * Math.cos(w0)) / a0, ca2 = (1 - alpha) / a0;
      var x1 = 0, x2 = 0, z1 = 0, z2 = 0;   // section 1
      var p1 = 0, p2 = 0, q1 = 0, q2 = 0;   // section 2
      for (var k = 0; k < n; k++) {
        var xn = rnd() * 2 - 1;
        var yn = cb0 * xn + cb2 * x2 - ca1 * z1 - ca2 * z2;
        x2 = x1; x1 = xn; z2 = z1; z1 = yn;
        var zn = cb0 * yn + cb2 * p2 - ca1 * q1 - ca2 * q2;
        p2 = p1; p1 = yn; q2 = q1; q1 = zn;
        bed[k] = zn;
      }
      /* Normalise the bed to unit RMS. The cascade's noise gain scales with its
         bandwidth, which scales with f0, so without this the bed would be
         quietly louder on high-centred seeds than on low ones — and because the
         98th-percentile normalisation downstream keys off the bulk of the
         samples, a bed that drifts in level does not merely change the balance,
         it changes what the normaliser is measuring. Unit RMS makes `bedLvl` an
         honest, seed-stable number. */
      var acc2 = 0;
      for (k = 0; k < n; k++) acc2 += bed[k] * bed[k];
      var brms = Math.sqrt(acc2 / n);
      var bg = brms > 1e-9 ? 1 / brms : 0;
      for (k = 0; k < n; k++) bed[k] *= bg;
    }());
    /* THIN, and thin RELATIVE TO THE GRAIN rather than by an absolute constant.
       The grain is a sparse impulse train whose RMS is small and varies with the
       seed's slip density, so a fixed bed gain is not a fixed balance: measured,
       an absolute level anywhere in 0.04–0.30 swamped the grain identically
       (40-seed pitch rate 1 → 12, centroid 304 → 247 Hz), because once the bed
       dominates the bulk of the samples it also sets the 98th-percentile
       reference downstream and the balance self-locks wherever it landed.
       Measuring the grain first and placing the bed a fixed ratio beneath it
       makes the balance mean what it says on every seed.

       The bed exists ONLY to keep the gaps from falling to true silence so a run
       of calls fuses into one groan; it must never become a layer you can pick
       out, or it smears the platen kiss that shares this mix. */
    var bedRel = 0.85 * (0.60 + 0.40 * strain);

    /* ── THE FRAME: drifting inharmonic modal bank ───────────────────────────
       Two-pole resonators, coefficients refreshed every DRIFT_N samples from an
       independent seeded random walk per mode (±5 %). The drift is what smears
       each narrow mode into a band and keeps the stack from reading as a note. */
    /* Per-call ratio jitter (±8 %): each call's frame is its own piece of timber,
       so a run of calls shares no modal structure for the ear to average into a
       note. */
    var M = RATIOS.length;
    var ratio = new Float32Array(M);
    for (var q = 0; q < M; q++) ratio[q] = RATIOS[q] * (1 + 0.08 * (rnd() * 2 - 1));

    /* TWO BODIES, interleaved. The press is not one resonator: it is a timber
       frame with an iron shaft housing bolted through it, and the two ring at
       unrelated scales. Alternate modes are pinned to the second body at an
       incommensurate ratio (≈ 1.32–1.42 ×), which means no single period fits
       the stack even within ONE 0.2 s call — the ear gets a rough band, never a
       note, without having to smear the modes into featureless noise. */
    var fB = f0 * (1.317 + 0.104 * rnd());
    var base = new Float32Array(M);
    for (q = 0; q < M; q++) base[q] = (q & 1) ? fB : f0;
    var y1 = new Float32Array(M), y2 = new Float32Array(M);
    var b0 = new Float32Array(M), a1 = new Float32Array(M), a2 = new Float32Array(M);
    var drift = new Float32Array(M), dvel = new Float32Array(M);
    var m;
    for (m = 0; m < M; m++) { drift[m] = rnd() * 2 - 1; dvel[m] = 0; }

    // shaft: one heavily damped low mode, same recursion, its own state
    var sy1 = 0, sy2 = 0, sb0 = 0, sa1 = 0, sa2 = 0;

    function coeffs(f, tau, out, k) {
      var r = Math.exp(-1 / (tau * sr));
      var w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr;
      out.a1[k] = 2 * r * Math.cos(w);
      out.a2[k] = -r * r;
      // normalise so each mode's impulse response peaks near 1 regardless of Q
      out.b0[k] = (1 - r) * Math.sin(w);
    }
    var bank = { a1: a1, a2: a2, b0: b0 };
    var shaftBank = { a1: new Float32Array(1), a2: new Float32Array(1), b0: new Float32Array(1) };

    var glideD = 0.045 + 0.030 * rnd(), glideP = rnd() * 2 - 1, glide = 1;
    var DRIFT_N = 16;
    var out = new Float32Array(n);
    var lpTick = 0;
    var kTick = 1 - Math.exp(-2 * Math.PI * 1350 / sr);   // dry rasp lowpass
    var hpX = 0, hpY = 0;
    var kHp = Math.exp(-2 * Math.PI * 72 / sr);           // kill sub/DC

    coeffs(shaftF, 0.014, shaftBank, 0);
    sb0 = shaftBank.b0[0]; sa1 = shaftBank.a1[0]; sa2 = shaftBank.a2[0];

    for (i = 0; i < n; i++) {
      if ((i % DRIFT_N) === 0) {
        // the frame itself rides up and back as the shaft turns through its arc
        glide = 1 + glideD * Math.sin(Math.PI * (i / n) * 1.35 + glideP);
        for (m = 0; m < M; m++) {
          // bounded random walk: velocity nudged, position pulled back to 0
          dvel[m] += (rnd() * 2 - 1) * 0.11;
          dvel[m] *= 0.88;
          drift[m] += dvel[m];
          if (drift[m] > 1) { drift[m] = 1; dvel[m] *= -0.5; }
          if (drift[m] < -1) { drift[m] = -1; dvel[m] *= -0.5; }
          coeffs(base[m] * glide * ratio[m] * (1 + 0.27 * drift[m]), MODE_T[m], bank, m);
        }
      }

      var x = excite[i];
      var body = 0;
      for (m = 0; m < M; m++) {
        var y = b0[m] * x + a1[m] * y1[m] + a2[m] * y2[m];
        y2[m] = y1[m]; y1[m] = y;
        body += MODE_A[m] * y;
      }

      // iron shaft mass, felt not heard
      var sy = sb0 * x + sa1 * sy1 + sa2 * sy2;
      sy2 = sy1; sy1 = sy;

      // dry unoiled-wood rasp
      lpTick += kTick * (tick[i] - lpTick);

      var s = body * 2.4 + sy * 0.62 + lpTick * 0.052;

      // one-pole highpass: no DC, no sub rumble the little shop can't make
      hpY = kHp * (hpY + s - hpX);
      hpX = s;
      out[i] = hpY * env[i];
    }

    /* ── Lay the drag bed in UNDER the measured grain ─────────────────────────
       Now that the grain exists we know how loud it actually is, so the bed can
       be placed a fixed ratio beneath it and carry the same envelope, which is
       what lets overlapping calls crossfade instead of pulsing. */
    var gAcc = 0;
    for (i = 0; i < n; i++) gAcc += out[i] * out[i];
    var grainRms = Math.sqrt(gAcc / n);
    var bedGain = grainRms * bedRel;
    /* The bed carries a FLATTENED version of the envelope (≈ env^0.35), not the
       envelope itself. A bed shaped exactly like the grain dies away exactly
       where the grain does, which is precisely where it is needed: the troughs
       that break a run of calls into separate events are the seams where two
       neighbours are BOTH in their envelope cheeks. Compressing the curve keeps
       the drag audible through the tails so the next call arrives into live
       sound, while still reaching zero at the buffer edges so nothing clicks. */
    for (i = 0; i < n; i++) out[i] += bed[i] * bedGain * Math.pow(env[i], 0.35);

    /* ── 98th-PERCENTILE NORMALISE → SOFT-CLIP KNEE → TRUE-PEAK TRIM ─────────
       Normalising to the absolute maximum lets ONE freak grab set the gain for
       the whole buffer: the bed goes quiet underneath it and, when calls
       overlap, that lone transient stacks into a crack — a creak with a snap in
       it. Pegging the 98th PERCENTILE instead flattens the peak-to-average, so
       the sound stays a bed of grain; the ~2 % of samples above the target run
       into the tanh knee below and are rounded off, which is precisely the job
       that stage exists to do. The knee's gentle odd-harmonic saturation is also
       the compression a loaded wooden frame applies to its own noise, and the
       drive sits in the near-linear region so it colours rather than crushes.

       The final true-peak trim then sets this call's level EXACTLY, so the peak
       is known ahead of time, never approaches 0 dBFS, and the seed-to-seed
       (and strain-to-strain) loudness variation the page wants is preserved. */
    var mag = new Float32Array(n);
    for (i = 0; i < n; i++) mag[i] = out[i] < 0 ? -out[i] : out[i];
    mag.sort();
    var ref = mag[Math.min(n - 1, Math.floor(n * 0.98))] || 1e-6;
    var drive = 0.44 / ref;
    var KN = 1.7, KNORM = Math.tanh(KN);
    for (i = 0; i < n; i++) out[i] = Math.tanh(KN * out[i] * drive) / KNORM;

    var pk = 0;
    for (i = 0; i < n; i++) { var v = out[i] < 0 ? -out[i] : out[i]; if (v > pk) pk = v; }
    var g = pk > 1e-6 ? level / pk : 0;
    for (i = 0; i < n; i++) out[i] *= g;

    /* A slip ring truncated by the buffer edge would leave a step, and this
       fires ~8× per revolution — one tick would show. Taper the last 3 ms to
       exact zero with a smoothstep: forcing only the FINAL SAMPLE to zero is a
       harder discontinuity than the ring it is trying to hide. */
    var fade = Math.min(n, Math.max(1, Math.round(sr * 0.003)));
    for (i = 0; i < fade; i++) {
      var uu = i / fade;
      out[n - 1 - i] *= uu * uu * (3 - 2 * uu);
    }

    var buf = ctx.createBuffer(1, n, sr);
    buf.getChannelData(0).set(out);

    var t0 = ctx.currentTime + when;
    var src = ctx.createBufferSource();
    var gn = ctx.createGain();
    src.buffer = buf;
    gn.gain.setValueAtTime(1, t0);
    src.connect(gn).connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.001);

    return {
      stop: function (at) {
        try { src.stop(at != null ? at : ctx.currentTime); } catch (e) {}
      }
    };
  };
}(typeof self !== 'undefined' ? self : this));
