/* ═══════════════════════════════════════════════════════════════════════════
   cento-ratchet.js  —  Gate.sfx['cento-ratchet']   (The Cento Press)

   The pawl clicking over a cast tooth as the crank turns. Fires roughly every
   0.4 rad of rotation — many times per pull, at the speed of the hand. It is
   the most-heard sound in the room and therefore the one built to be QUIET,
   ARTICULATE, and never twice the same.

   ── DIRECTION: a struck object, computed as a modal impulse ─────────────────
   A ratchet tick is not a filtered noise burst; it is a small hard body being
   STRUCK and left to ring itself out. So this does not chain biquads — it fills
   one short AudioBuffer per call by summing an explicit MODAL MODEL:

     · a FLANK SCRAPE that SWELLS INTO contact — the pawl tip riding up the
       tooth flank before it drops (~2 of 3 firings). Its envelope rises into
       the strike rather than decaying away from it, which softens the attack
       grid: it is the cue that stops twenty evenly-spaced strikes reading as
       a quantised metronome.
     · the STRIKE transient — ~1.2 ms of high-passed noise: the moment of
       contact, before any body has had time to answer.
     · 4 IRON MODES near 1.5–2.3 kHz at INHARMONIC ratios, each with its own
       decay. The ratios AND the fundamental are jittered per firing across a
       wide band, so a fast run never lays down a continuous horizontal streak
       and never resolves to a detectable pitch. Inharmonic = struck tooth,
       never a UI chime.
     · a WOOD KNOCK ~480–580 Hz — the pawl's seat in the frame.
     · a FRAME THUMP ~105–135 Hz, offset 0.4–1.6 ms behind the tick — the press
       body taking the blow. Subordinate to the iron, always: this asset reads
       as METAL with wood beneath it, not as a wooden thud.
     · a REBOUND on a CONTINUOUS energy parameter (not a coin-flip) — the pawl
       settling, a small second contact 10–20 ms later. A soft floor means it is
       always slightly there and sometimes plainly there, which is how a real
       pawl behaves; a switch is not.
     · two quiet low-passed EARLY REFLECTIONS near 7 and 13 ms, JITTERED per
       firing — "a metre away in a small room with soft furnishings", not
       reverb, and not the same fingerprint stamped a hundred times.

   ── THREE EVENT CLASSES, not one jittered template ──────────────────────────
   Parametric variation alone still reads as one sample being wobbled. So a
   firing is one of two structurally different events:

     NORMAL CATCH  — the full stack above.
     GLANCING CATCH (~1 in 6) — the tooth barely takes the flank: the frame
       thump is suppressed entirely, the wood knock nearly so, the iron decays
       shorten, the rebound is forced off, and the whole event drops ~3 dB.

   That categorical difference is what makes a run of twenty sound like a wheel
   with its own uneven rhythm rather than one well-jittered click.

   ── LEVEL: a bed, not an event ──────────────────────────────────────────────
   Loudness is controlled exactly rather than hoped for. The buffer is peak-
   normalised, then scaled to a seeded TRUE-PEAK TARGET IN dB: the family centre
   sits at −10 dBFS with a ±4 dB trim, so the loudest possible firing lands on
   the spec's −6.0 dBFS ceiling and a glancing one falls near −13. A gentle
   7.2 kHz master roll-off keeps it dry and roomy rather than close-miked and
   hissy. Energy is gone by ~30 ms and the tail is damped to true silence well
   inside the 0.1 s window, so even the fastest hand never smears one tick into
   the next.

   Determinism: one mulberry32(seed) drives every random value — noise samples,
   frequencies, decays, event class, rebound energy, reflection times, level.
   No Math.random / Date / performance.now. Nothing foraged; no samples, no
   files, no network. One BufferSource per call, stopped at when + dur.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Seeded PRNG: mulberry32. Drives EVERY random value in this file. ───────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Fill `out` with one struck-tooth contact starting at sample index `at`.
     `gain` scales the whole contact, so the rebound is the SAME physics struck
     more lightly rather than a different sound. `spec` is [f, tau, amp, off]. */
  function strike(out, sr, at, gain, rnd, spec) {
    var n = out.length;
    var i, k;

    // ── contact transient: a breath of high-passed noise, ~1.2 ms ───────────
    // One-pole high-pass on white noise => the "tk" of hard contact with no
    // body under it yet. Instant attack, near-instant decay.
    var tn = Math.max(2, Math.round(sr * 0.0012));
    var prevW = 0, hp = 0;
    for (i = 0; i < tn; i++) {
      var w = rnd() * 2 - 1;
      hp = 0.86 * (hp + w - prevW);            // one-pole HP, corner ~ 1.6 kHz
      prevW = w;
      var e = Math.exp(-i / (sr * 0.00045));   // tau 0.45 ms
      var idx = at + i;
      if (idx >= 0 && idx < n) out[idx] += gain * 0.72 * hp * e;
    }

    // ── modal ring: exponentially decaying sinusoids, phase 0 (a strike) ────
    for (k = 0; k < spec.length; k++) {
      var f = spec[k][0], tau = spec[k][1], amp = spec[k][2], off = spec[k][3] || 0;
      if (amp <= 0 || f > sr * 0.45) continue;   // silent mode, or would alias
      var start = at + Math.round(sr * off);
      var life = Math.min(n - start, Math.ceil(sr * tau * 7));  // to ~ −61 dB
      if (life <= 0) continue;
      var w0 = 2 * Math.PI * f / sr;
      var dec = Math.exp(-1 / (sr * tau));
      var env = gain * amp;
      for (i = 0; i < life; i++) {
        out[start + i] += env * Math.sin(w0 * i);
        env *= dec;
      }
    }
  }

  /* Two quiet, low-passed early reflections — the small soft room, not reverb.
     The tap times are passed in JITTERED so the hand reads as moving relative
     to the frame instead of stamping one fingerprint on every firing. */
  function room(buf, sr, t1, t2) {
    var n = buf.length;
    var d1 = Math.round(sr * t1), d2 = Math.round(sr * t2);
    var dry = new Float32Array(buf);           // reflect the dry signal only
    var lp1 = 0, lp2 = 0;
    for (var i = 0; i < n; i++) {
      lp1 += 0.38 * (dry[i] - lp1);            // ~2.0 kHz roll-off: soft walls
      lp2 += 0.24 * (dry[i] - lp2);            // duller on the longer bounce
      if (i + d1 < n) buf[i + d1] += 0.105 * lp1;
      if (i + d2 < n) buf[i + d2] += 0.062 * lp2;
    }
  }

  Gate.sfx['cento-ratchet'] = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = (opts.dur == null) ? 0.1 : opts.dur;
    var when = opts.when || 0;
    var seed = (opts.seed == null) ? 1 : opts.seed;

    var t0 = ctx.currentTime + when;
    var rnd = mulberry32((seed | 0) || 1);
    var sr = ctx.sampleRate;

    var n = Math.max(8, Math.round(sr * dur));
    var buf = ctx.createBuffer(1, n, sr);
    var d = buf.getChannelData(0);

    // ── seeded character of THIS firing ────────────────────────────────────
    var j = function (spread) { return 1 + (rnd() * 2 - 1) * spread; };

    // Mode layout. The fundamental sweeps a WIDE band and the inharmonic ratios
    // are themselves jittered, so no two firings share a partial and a fast run
    // shows no continuous streak and reports no pitch.
    var f1 = 1560 + rnd() * 760;               // 1.56–2.32 kHz iron fundamental
    var r2 = 1.42 + rnd() * 0.16;              // inharmonic 2nd mode
    var r3 = 2.22 + rnd() * 0.26;              // bite mode
    var r4 = 3.02 + rnd() * 0.30;              // hard edge
    // Wood and frame are jittered WIDE too. A narrowly-jittered wood knock is
    // the same note on every firing, and twenty of them in a row resolve to a
    // detectable pitch — exactly the UI-chime tonality this room forbids.
    var wood = 528 * j(0.20);                  // the pawl's wooden seat
    var frame = 119 * j(0.16);                 // the press body under it

    // EVENT CLASS: ~1 in 6 teeth is a GLANCING catch — a structurally lighter
    // event, not merely a quieter one.
    var glancing = rnd() < 0.17;

    var tScrape = rnd() < 0.66;                // did the tip ride the flank?
    var thumpOff = 0.0004 + rnd() * 0.0012;    // body answers 0.4–1.6 ms late
    // Rebound as a CONTINUOUS energy with a soft floor, skewed toward small.
    var reboundE = Math.pow(rnd(), 1.7);
    var rTime = 0.010 + rnd() * 0.010;         // settles 10–20 ms later
    // Room taps, jittered per firing (±2–3 ms).
    var tap1 = 0.0071 + (rnd() * 2 - 1) * 0.0022;
    var tap2 = 0.0134 + (rnd() * 2 - 1) * 0.0030;

    var at = Math.round(sr * 0.0032);          // strike sits 3.2 ms in

    // ── the flank scrape: SWELLS INTO contact, then is gone ─────────────────
    // Level is set to be measurable in isolation (~−17 dB under the strike
    // transient), not modelled faith — an inaudible layer is dead weight in a
    // sound heard a hundred times.
    if (tScrape) {
      var sn = Math.max(3, Math.round(sr * (0.0022 + rnd() * 0.0016)));
      var s0 = at - sn;                        // it ENDS at the contact instant
      var shp = 0, sprev = 0;
      var slvl = (0.10 + rnd() * 0.06) * (glancing ? 0.7 : 1);
      for (var si = 0; si < sn; si++) {
        var sw = rnd() * 2 - 1;
        shp = 0.93 * (shp + sw - sprev);       // brighter than the strike
        sprev = sw;
        var sidx = s0 + si;
        var sEnv = Math.pow((si + 1) / sn, 2.2);   // rises INTO the strike
        if (sidx >= 0 && sidx < n) d[sidx] += slvl * shp * sEnv;
      }
    }

    // ── the strike: iron modes at inharmonic ratios + wood + frame ─────────
    // A glancing catch shortens the iron, all but removes the wood, and does
    // not load the frame at all.
    var ironK = glancing ? 0.62 : 1;
    var spec = [
      [f1,      0.0062 * j(0.20), 1.00,                     0],
      [f1 * r2, 0.0064 * j(0.20), 0.60,                     0],
      [f1 * r3, 0.0036 * j(0.22), 0.32,                     0],
      [f1 * r4, 0.0022 * j(0.25), 0.14,                     0],
      [wood,    0.0100 * j(0.18), glancing ? 0.06 : 0.20,   0.0003],
      [frame,   0.0098 * j(0.18), glancing ? 0    : 0.20,   thumpOff]
    ];
    for (var q0 = 0; q0 < 4; q0++) { spec[q0][1] *= ironK; }
    strike(d, sr, at, 1.0, rnd, spec);

    // ── the rebound: the same part, struck far more lightly, once ──────────
    // Forced off on a glancing catch — the pawl never loaded enough to bounce.
    if (!glancing) {
      var g = 0.05 + 0.20 * reboundE;
      var rAt = at + Math.round(sr * rTime);
      strike(d, sr, rAt, g, rnd, [
        [f1 * j(0.02), 0.0048, 1.00, 0],
        [f1 * r2,      0.0034, 0.45, 0],
        [wood,         0.0092, 0.22, 0]
      ]);
    }

    room(d, sr, tap1, tap2);

    /* ── damp to true silence well inside the window ────────────────────────
       A tick still ringing when the next one lands smears a fast run into a
       buzz, and that smear IS the fatigue. The modes are already short; this
       raised-cosine taper from 22 ms to 38 ms guarantees the firing is
       ACOUSTICALLY OVER long before the hand can bring the next tooth round,
       and leaves no truncation edge at the end of the buffer. Measured against
       the fastest hand the room can produce (a 52 ms gap), this leaves a clear
       margin of silence between consecutive ticks — that margin IS the fatigue
       budget, so it is held deliberately wide. */
    var fadeA = Math.min(n - 1, Math.round(sr * 0.022));
    var fadeB = Math.min(n, Math.round(sr * 0.038));
    for (var q = fadeA; q < n; q++) {
      var p = q >= fadeB ? 1 : (q - fadeA) / (fadeB - fadeA);
      d[q] *= 0.5 * (1 + Math.cos(Math.PI * p));
    }

    /* ── master roll-off: a metre away in a soft room ────────────────────────
       One-pole low-pass at ~7.2 kHz. Not a tone control — it takes the glassy
       top off the contact transient so a hundred hearings do not fatigue,
       while leaving the 1.5–2.3 kHz iron entirely intact. */
    var fc = Math.min(7200, sr * 0.45);
    var aLp = 1 - Math.exp(-2 * Math.PI * fc / sr);
    var yLp = 0;
    for (var L = 0; L < n; L++) { yLp += aLp * (d[L] - yLp); d[L] = yLp; }

    /* ── exact loudness: peak-normalise, then a seeded TRUE-PEAK target ──────
       Family centre −10 dBFS ± 4 dB, so the loudest firing lands exactly on the
       spec's −6.0 dBFS ceiling; a glancing catch drops a further 3 dB to sit
       near −13. This is a bed, not an event: it must never clip and never tire. */
    var peak = 0;
    for (var m = 0; m < n; m++) { var a = d[m] < 0 ? -d[m] : d[m]; if (a > peak) peak = a; }
    var lvlDb = -10 + (rnd() * 2 - 1) * 4;     // −14 … −6 dBFS true peak
    if (glancing) lvlDb -= 3;                  // −17 … −9
    var target = Math.pow(10, lvlDb / 20);
    var scale = peak > 1e-9 ? target / peak : 0;
    for (var z = 0; z < n; z++) { d[z] *= scale; }

    // ── play it ────────────────────────────────────────────────────────────
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var out = ctx.createGain();
    out.gain.setValueAtTime(1, t0);
    src.connect(out).connect(dest);
    src.start(t0);
    src.stop(t0 + dur);

    return {
      stop: function (at2) {
        var tt = at2 != null ? at2 : ctx.currentTime;
        try { out.gain.cancelScheduledValues(tt); } catch (e) {}
        try { out.gain.setValueAtTime(0, tt); } catch (e) {}
        try { src.stop(tt); } catch (e) {}
      }
    };
  };

}(typeof self !== 'undefined' ? self : this));
