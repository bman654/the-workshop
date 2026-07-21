/* ═══════════════════════════════════════════════════════════════════════════
   take-2.js  —  Gate.sfx['tenfold-detent']  —  a brass pawl seating in a groove

   The sound of the ten-fold glass's coarse-focus drum: a leaf-sprung brass pawl
   cresting a machined ridge and DROPPING into the detent groove, heard from a
   hand's distance in a quiet room. Not a UI tick — a small piece of machined
   metal seating into metal.

   ── Take-2 direction: model the SEAT as a real inharmonic impact ─────────────
   A UI "click" is one filtered noise burst. Machined brass seating is a physical
   event with three overlapped stages, so we synthesize each:

     (1) SCRAPE  — the spring cresting the ridge just before release: a very short
                   (~10 ms) band of filtered noise sweeping UP in pitch, quiet and
                   dry. It gives the ear the "run-up" that makes the drop land.

     (2) DROP    — the seat itself: a dense, INHARMONIC transient. A struck metal
                   bar rings at partials near 1 : 2.76 : 5.40 : 8.93 (free-bar
                   modes), NOT the integer harmonics of a tone — that inharmonicity
                   is exactly what makes metal read as metal. We fire a small bank
                   of fast-decaying sines at those ratios, layered over a resonant
                   noise "chick", so it lands as a solid machined clack, not a beep.

     (3) BODY    — the drum's own short ring under the drop: a low woody-metallic
                   fundamental (~230 Hz) with a slightly-stretched 2nd/3rd partial,
                   decaying to silence in under ~0.22 s. This is the mass the pawl
                   seats INTO — it gives weight without ringing on and fatiguing.

     (+) THUD    — a brief lowpassed sub (~110 Hz, ~55 ms) at the seat instant for
                   the felt "drop" of the leaf taking up slack.

   `strength` ∈ [0.3,1] reads as FORCE, not just volume: a hard seat opens the drop
   filter brighter, lifts the upper partials and the scrape, and gives the body
   more weight; a light seat closes toward a dry, dull tick. `seed` jitters partial
   tuning, timing and the scrape band so no two seats ring identically.

   Determinism: a seeded mulberry32 PRNG drives ALL randomness (never Math.random),
   so the offline render the audio-lens verifies is the graph that ships. Peaks are
   kept well under 0 dBFS (master ≈ 0.32; peak ~ -9.5). Every node starts and stops inside
   `when + dur`; nothing is left running.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── mulberry32: tiny deterministic PRNG, seeded; floats in [0,1). ──────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  Gate.sfx['tenfold-detent'] = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var when = opts.when == null ? 0 : opts.when;
    var seed = opts.seed == null ? 1 : opts.seed;
    var strength = opts.strength == null ? 1 : opts.strength;
    if (strength < 0.3) strength = 0.3; else if (strength > 1) strength = 1;

    var t0 = ctx.currentTime + when;
    var sr = ctx.sampleRate;
    var rnd = mulberry32((seed >>> 0) || 1);

    // strength → a 0..1 "force" the timbre reads (0 at a light seat, 1 hard).
    var force = (strength - 0.3) / 0.7;

    // ── Master bus — held low so a peak lands near -9.5 dBFS: this fires up to a
    //    few times a second down the ladder, and the extra headroom keeps forty
    //    seats in a row from fatiguing or stacking into a buzz. ────────────────
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.32, t0);
    master.connect(dest);

    // ── A short seeded white-noise buffer, reused by the scrape + drop chick. ─
    var noiseLen = Math.max(1, Math.floor(sr * 0.06));
    var noiseBuf = ctx.createBuffer(1, noiseLen, sr);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) { nd[i] = rnd() * 2 - 1; }

    // The seat instant: the scrape crests, then the pawl drops. Tiny jitter.
    var tScrape = t0 + 0.001;
    var tSeat = t0 + 0.011 + (rnd() - 0.5) * 0.002;

    // ── (1) SCRAPE — the spring cresting the ridge just before release. ───────
    // A very short band of noise sweeping UP; drier/quieter at a light seat.
    var scrSrc = ctx.createBufferSource();
    scrSrc.buffer = noiseBuf;
    var scrBp = ctx.createBiquadFilter();
    scrBp.type = 'bandpass';
    scrBp.Q.setValueAtTime(1.6, tScrape);
    var scrLo = 1400 + rnd() * 300;
    var scrHi = 3200 + rnd() * 600 + force * 1400;   // harder seat crests brighter
    scrBp.frequency.setValueAtTime(scrLo, tScrape);
    scrBp.frequency.exponentialRampToValueAtTime(scrHi, tSeat);
    var scrEnv = ctx.createGain();
    var scrPk = 0.05 + 0.09 * force;                 // quiet run-up
    scrEnv.gain.setValueAtTime(0.0001, tScrape);
    scrEnv.gain.exponentialRampToValueAtTime(scrPk, tSeat - 0.001);
    scrEnv.gain.exponentialRampToValueAtTime(0.0004, tSeat + 0.006);
    scrEnv.gain.setValueAtTime(0, tSeat + 0.008);
    scrSrc.connect(scrBp).connect(scrEnv).connect(master);
    scrSrc.start(tScrape);
    scrSrc.stop(tSeat + 0.02);

    // ── (2) DROP — the seat: a resonant noise "chick" + an INHARMONIC bank. ──
    // (a) the chick: a dense noise burst through a resonant bandpass, the grit of
    //     metal-on-metal contact. Brighter + sharper with force.
    var chkSrc = ctx.createBufferSource();
    chkSrc.buffer = noiseBuf;
    var chkBp = ctx.createBiquadFilter();
    chkBp.type = 'bandpass';
    chkBp.Q.setValueAtTime(1.1, tSeat);
    var chkF = 1200 + force * 1900 + rnd() * 250;     // 1200→3300-ish Hz — brass chiff
    chkBp.frequency.setValueAtTime(chkF, tSeat);
    var chkEnv = ctx.createGain();
    var chkPk = 0.30 + 0.34 * force;
    chkEnv.gain.setValueAtTime(0.0001, tSeat);
    chkEnv.gain.exponentialRampToValueAtTime(chkPk, tSeat + 0.0014);
    chkEnv.gain.exponentialRampToValueAtTime(0.0006, tSeat + 0.032);
    chkEnv.gain.setValueAtTime(0, tSeat + 0.036);
    chkSrc.connect(chkBp).connect(chkEnv).connect(master);
    chkSrc.start(tSeat);
    chkSrc.stop(tSeat + 0.04);

    // (b) the inharmonic partial bank — free-bar-like ratios so it reads as a
    //     struck piece of METAL, not a tone. Higher partials are quieter and
    //     decay faster (as real metal does). Upper partials swell with force.
    var barBase = (560 + rnd() * 40) * 1.0;           // ~560–600 Hz seat pitch
    var ratios = [1.00, 2.76, 5.40, 8.93];
    var partGains = [0.28, 0.24, 0.18, 0.11];
    var partDecay = [0.10, 0.082, 0.060, 0.044];      // s, shorter as we go up
    var oscs = [];
    for (var p = 0; p < ratios.length; p++) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      // slight per-partial detune keeps the metal alive across seats.
      var f = barBase * ratios[p] * (1 + (rnd() - 0.5) * 0.012);
      o.frequency.setValueAtTime(f, tSeat);
      var g = ctx.createGain();
      // upper partials only really speak on a firm seat (force lifts them).
      var pk = partGains[p] * (p === 0 ? (0.6 + 0.4 * force) : (0.35 + 0.65 * force));
      g.gain.setValueAtTime(0.0001, tSeat);
      g.gain.exponentialRampToValueAtTime(pk, tSeat + 0.0018);
      g.gain.exponentialRampToValueAtTime(0.0004, tSeat + partDecay[p]);
      g.gain.setValueAtTime(0, tSeat + partDecay[p] + 0.004);
      o.connect(g).connect(master);
      o.start(tSeat);
      o.stop(tSeat + partDecay[p] + 0.02);
      oscs.push(o);
    }

    // ── (+) THUD — a brief lowpassed sub: the felt weight of the drop. ────────
    var thud = ctx.createOscillator();
    thud.type = 'sine';
    var thudHz = 118 + rnd() * 10;
    thud.frequency.setValueAtTime(thudHz * 1.5, tSeat);
    thud.frequency.exponentialRampToValueAtTime(thudHz, tSeat + 0.03);  // quick "pit"
    var thudLp = ctx.createBiquadFilter();
    thudLp.type = 'lowpass';
    thudLp.frequency.setValueAtTime(220, tSeat);
    var thudEnv = ctx.createGain();
    var thudPk = 0.12 + 0.16 * force;
    thudEnv.gain.setValueAtTime(0.0001, tSeat);
    thudEnv.gain.exponentialRampToValueAtTime(thudPk, tSeat + 0.004);
    thudEnv.gain.exponentialRampToValueAtTime(0.0005, tSeat + 0.055);
    thudEnv.gain.setValueAtTime(0, tSeat + 0.06);
    thud.connect(thudLp).connect(thudEnv).connect(master);
    thud.start(tSeat);
    thud.stop(tSeat + 0.08);

    // ── (3) BODY — the drum's short woody-metallic ring under the seat. ───────
    // A low fundamental with a slightly-stretched 2nd/3rd partial; decays to
    // silence in ~0.20 s so it lands with weight but never rings on / fatigues.
    var bodyF = (228 + rnd() * 8) * 1.0;
    var bodyRatios = [1.0, 2.04, 3.11];               // gently stretched → metallic
    // fundamental lifted + top partial trimmed so the tail settles into warm
    // low weight AFTER the snick instead of staying bright (no ring lengthening).
    var bodyGains = [0.16, 0.072, 0.030];
    var bodyDecay = [0.175, 0.135, 0.10];
    var bodyOscs = [];
    for (var q = 0; q < bodyRatios.length; q++) {
      var bo = ctx.createOscillator();
      bo.type = q === 0 ? 'triangle' : 'sine';        // triangle fundamental = wood
      bo.frequency.setValueAtTime(bodyF * bodyRatios[q], tSeat);
      var bg = ctx.createGain();
      // body scales with force too — a hard seat has more resonant mass.
      var bpk = bodyGains[q] * (0.55 + 0.45 * force);
      bg.gain.setValueAtTime(0.0001, tSeat);
      bg.gain.exponentialRampToValueAtTime(bpk, tSeat + 0.006);
      bg.gain.exponentialRampToValueAtTime(0.0004, tSeat + bodyDecay[q]);
      bg.gain.setValueAtTime(0, tSeat + bodyDecay[q] + 0.006);
      bo.connect(bg).connect(master);
      bo.start(tSeat);
      bo.stop(tSeat + bodyDecay[q] + 0.03);
      bodyOscs.push(bo);
    }

    // ── Live-use handle: stop everything at `at` (or now). Offline ignores. ───
    return {
      stop: function (at) {
        var w = at != null ? at : ctx.currentTime;
        try { scrSrc.stop(w); } catch (e) {}
        try { chkSrc.stop(w); } catch (e2) {}
        try { thud.stop(w); } catch (e3) {}
        for (var m = 0; m < oscs.length; m++) { try { oscs[m].stop(w); } catch (e4) {} }
        for (var n = 0; n < bodyOscs.length; n++) { try { bodyOscs[n].stop(w); } catch (e5) {} }
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
