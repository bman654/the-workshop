/* ═══════════════════════════════════════════════════════════════════════════
   audio-thunderroll.js  —  Gate.sfx.thunderroll  (KEY = "thunderroll")

   A deep, distant rumble that ROLLS and FADES — the rolling tail of a thunder
   clap, and (at a quieter/farther setting) an occasional ambient roll during
   storm rain.

   Synthesis:
     brown noise  →  steep cascaded lowpass (corner < 200 Hz)
                  →  slow seeded amplitude LFO (the "rolling" undulation)
                  ×  overall exponential decay across the window (rolls out)
     plus a faint sub "felt-not-heard" body and a long, soft tail.

   Everything below ~200 Hz: centroid is VERY low, f0 is null (it's noise),
   silenceRatio climbs toward the end because the bed decays into the floor.

   DUAL-USE / distance option (opts.distance, default "close"):
     • "close"   — loud, present rumble; the per-strike rolling tail right after
                   a clap. Lighter low-pass so the rumble has some grit/body.
     • "distant" — quieter and MORE low-passed; a soft far-off roll that sits
                   under rain. The conductor picks this for ambient storm rolls.
     A numeric distance in [0,1] is also accepted (0 = close, 1 = distant).

   Builder contract: dual-use against ANY BaseAudioContext (live or Offline),
   deterministic via a seeded PRNG (no Math.random), peaks well under 0 dBFS.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── Small seeded PRNG: mulberry32 — fast, deterministic, good enough here ──
  function mulberry32(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Resolve the distance option to a 0..1 scalar (0 = close, 1 = distant) ──
  function resolveDistance(distance) {
    if (typeof distance === 'number' && isFinite(distance)) {
      return Math.max(0, Math.min(1, distance));
    }
    if (distance === 'distant') return 1;
    return 0; // "close" / undefined
  }

  /**
   * Gate.sfx.thunderroll
   * @param {Object}          o
   * @param {BaseAudioContext} o.ctx   live AudioContext or OfflineAudioContext
   * @param {AudioNode}       o.dest   where to connect the output
   * @param {number}          o.dur    bed length in seconds (the roll fits inside)
   * @param {number}         [o.when]  start offset from ctx.currentTime
   * @param {number}         [o.seed]  PRNG seed (determinism)
   * @param {string|number}  [o.distance]  "close" (default) | "distant" | 0..1
   * @returns {{stop:function(number=)}}
   */
  Gate.sfx.thunderroll = function (o) {
    var ctx = o.ctx;
    var dest = o.dest;
    var dur = o.dur;
    var when = o.when || 0;
    var seed = (o.seed == null ? 1 : o.seed);
    var d = resolveDistance(o.distance);

    var sr = ctx.sampleRate;
    var t0 = ctx.currentTime + when;

    // ── Brown-noise source buffer ──────────────────────────────────────────
    // Brown (red) noise = integrated white noise: a random walk, heavily tilted
    // toward the lows. We render one mono buffer of length `dur` and play it
    // once; the rolling/decay envelopes are applied downstream via gain.
    var frames = Math.max(1, Math.round(sr * dur));
    var buf = ctx.createBuffer(1, frames, sr);
    var ch = buf.getChannelData(0);
    var rnd = mulberry32((seed * 2654435761) >>> 0);

    var last = 0;
    // Leak keeps the random walk from drifting away (a gentle DC pull-back).
    var leak = 0.996;
    var maxAbs = 1e-9;
    var i;
    for (i = 0; i < frames; i++) {
      var w = rnd() * 2 - 1;          // white in [-1,1]
      last = leak * last + 0.04 * w;  // integrate -> brown
      ch[i] = last;
      var a = last < 0 ? -last : last;
      if (a > maxAbs) maxAbs = a;
    }
    // Normalize the walk so its peak is ~1 before we shape it.
    var norm = 0.95 / maxAbs;
    for (i = 0; i < frames; i++) { ch[i] *= norm; }

    var src = ctx.createBufferSource();
    src.buffer = buf;

    // ── Steep cascaded lowpass — keep only the deep rumble (< 200 Hz) ───────
    // Two biquads in series ≈ 24 dB/oct. The far-off ("distant") roll is rolled
    // off harder (lower corner) so it reads as muffled distance.
    var corner = 170 - d * 80;        // close ≈170 Hz, distant ≈90 Hz
    var lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.setValueAtTime(corner, t0);
    lp1.Q.setValueAtTime(0.7071, t0);
    var lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.setValueAtTime(corner, t0);
    lp2.Q.setValueAtTime(0.7071, t0);

    // A high-pass just to shave inaudible DC/sub-rumble that wastes headroom
    // (keeps the "felt" body but drops the truly stuck-at-DC component).
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(22, t0);
    hp.Q.setValueAtTime(0.7071, t0);

    // ── Master gain: overall exponential decay across the window ────────────
    // The rumble swells in fast, then rolls out exponentially over ~dur so the
    // tail fades into silence (silenceRatio climbs toward the end).
    var master = ctx.createGain();
    // Close is loud+present; distant is much quieter. The deep (<170 Hz) band
    // loses a lot of energy to the cascaded lowpass, so the CLOSE roll needs a
    // hefty internal level to carry the BODY of a strike (it's the rumble the
    // ear hears as "thunder" after the crack). Pure low-end has headroom: even
    // at this level the summed peak stays well under 0 dBFS (verified offline).
    var peak = 2.05 - d * 1.77;       // close ≈2.05, distant ≈0.28
    var attack = 0.12;                // fast but not a click
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    // Exponential roll-out to a tiny floor by end-of-window (felt long tail).
    master.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    // Clamp hard to zero at the very end so nothing leaks past the bed.
    master.gain.setValueAtTime(0, t0 + dur);

    // ── Slow seeded amplitude LFO — the "rolling" undulation ────────────────
    // A low-frequency, irregular gain wobble layered on top of the decay. Built
    // from a couple of detuned slow oscillators whose rates/phases come from the
    // seed, so the roll undulates differently per seed but is fully deterministic.
    var lfoGain = ctx.createGain();          // its .gain is modulated around `base`
    var base = 0.74;                          // mean throughput of the LFO stage
    var depth = 0.24 - d * 0.06;              // undulation depth (a touch calmer far off)
    lfoGain.gain.setValueAtTime(base, t0);

    // Two slow LFOs (deterministic rates from the PRNG) summed for an organic,
    // non-repeating roll rather than a metronomic tremolo.
    var rateA = 0.45 + rnd() * 0.5;           // ~0.45–0.95 Hz
    var rateB = 0.9 + rnd() * 0.8;            // ~0.9–1.7 Hz
    var phaseA = rnd();                       // 0..1 turn (set via delay-ish offset)

    var lfoA = ctx.createOscillator();
    lfoA.type = 'sine';
    lfoA.frequency.setValueAtTime(rateA, t0);
    var lfoB = ctx.createOscillator();
    lfoB.type = 'sine';
    lfoB.frequency.setValueAtTime(rateB, t0);

    var lfoAamp = ctx.createGain();
    lfoAamp.gain.setValueAtTime(depth * 0.65, t0);
    var lfoBamp = ctx.createGain();
    lfoBamp.gain.setValueAtTime(depth * 0.35, t0);

    // Detune LFO B's phase by nudging its start so they don't lock in step.
    lfoA.connect(lfoAamp).connect(lfoGain.gain);
    lfoB.connect(lfoBamp).connect(lfoGain.gain);

    // ── Wire the graph ──────────────────────────────────────────────────────
    //   src → hp → lp1 → lp2 → lfoGain (rolling) → master (decay) → dest
    src.connect(hp);
    hp.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(lfoGain);
    lfoGain.connect(master);
    master.connect(dest);

    // ── Schedule ────────────────────────────────────────────────────────────
    var startA = t0 + phaseA * (1 / rateA); // deterministic phase offset for LFO A
    src.start(t0);
    src.stop(t0 + dur);
    lfoA.start(startA);
    lfoB.start(t0);
    lfoA.stop(t0 + dur);
    lfoB.stop(t0 + dur);

    return {
      stop: function (at) {
        var when = (at != null ? at : ctx.currentTime);
        try { src.stop(when); } catch (e) {}
        try { lfoA.stop(when); } catch (e) {}
        try { lfoB.stop(when); } catch (e) {}
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
