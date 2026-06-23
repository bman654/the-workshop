'use strict';
/*
 * Gate.sfx.crickets — procedural dusk crickets (WebAudio, dual-use offline/live).
 *
 * WHY: at DUSK the Gate rotates its creature voices — crickets replace the
 * daytime songbird. This is a QUIET AMBIENT BED, not a foreground sound: a
 * narrow high band that PULSES rhythmically (regular vertical ticks in the
 * spectrogram), the steady stridulation trill of a few crickets calling.
 *
 * Design (cricket stridulation = wing file-and-scraper):
 *   • Each cricket "voice" sings a STEADY TRILL: a narrowband tone burst
 *     (bandpass ~4–5 kHz, the dominant chirp frequency) gated rapidly on/off at
 *     a fixed seeded pulse rate. Real field crickets pulse at tens of Hz inside
 *     a chirp and repeat chirps a few per second; for a gentle continuous dusk
 *     bed we run a steady pulse train (~8–14 Hz) — fast regular onsets that read
 *     as a trill, a few audible pulses per second.
 *   • Each pulse is a SHORT (~10–18 ms) raised-cosine grain of the carrier tone
 *     so it opens and closes click-free, leaving a clean gap between pulses (the
 *     regular vertical ticks).
 *   • 3 crickets are layered at slightly different carrier pitches, pulse rates,
 *     and start phases so they interleave into a natural, slightly shimmering
 *     chorus rather than a metronome. A faint amplitude shimmer makes the bed
 *     breathe like a real evening.
 *   • The whole thing runs through a master bandpass + highpass to keep the
 *     energy in the bright 4–5.5 kHz cricket band (high spectral centroid) and
 *     strip any low rumble.
 *
 * Determinism: every random choice comes from a small seeded PRNG (mulberry32),
 * never Math.random — a given {seed} renders bit-identical every time.
 *
 * Headroom: crickets are deliberately QUIET (low overall amplitude). Gains are
 * chosen so the summed peak stays well under 0 dBFS — no clipping.
 *
 * Texture contract: a self-contained stationary dur-second bed — it fills the
 * whole window with a steady trill (no long lead-in/tail silence), so it can be
 * looped or cross-faded as an ambience layer.
 */
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx.crickets = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Seeded PRNG (mulberry32): deterministic uniform [0,1) ────────────────
  var a = (seed >>> 0) || 1;
  function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(lo, hi) { return lo + rng() * (hi - lo); }

  // ── Master bus: keep the energy in the bright cricket band so the spectral
  //    centroid lands high (~4–5.5 kHz). A bandpass shapes the band; a highpass
  //    strips any sub-rumble. Overall gain is LOW — this is a quiet ambience. ──
  var bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 4700;          // centre of the cricket band
  bp.Q.value = 0.9;                   // broad enough to pass all three voices

  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;          // nothing low — keep it airy/high

  var master = ctx.createGain();
  master.gain.value = 0.22;           // quiet ambient bed

  // A gentle sub-Hz amplitude shimmer so the evening "breathes" rather than
  // sitting perfectly flat. Baked as scheduled ramps (works offline).
  var baseLevel = 0.22;
  var shimmerHz = 0.35;
  var shimmerDepth = 0.10 * baseLevel;
  var steps = Math.max(2, Math.ceil(dur * shimmerHz * 8));
  master.gain.setValueAtTime(baseLevel, t0);
  for (var sIdx = 1; sIdx <= steps; sIdx++) {
    var tt = t0 + (dur * sIdx) / steps;
    var ph = 2 * Math.PI * shimmerHz * (dur * sIdx / steps);
    var lvl = baseLevel + shimmerDepth * Math.sin(ph);
    master.gain.linearRampToValueAtTime(Math.max(0.0001, lvl), tt);
  }

  bp.connect(hp).connect(master).connect(dest);

  var oscs = [];   // collect for live stop()

  // ── One CRICKET VOICE: a steady trill. A single bandpass-shaped sine carrier
  //    at the voice's chirp frequency, gated by a pulse train of short
  //    raised-cosine grains at the voice's pulse rate. The carrier runs
  //    continuously; the gain gate cuts it into clean pulses with gaps between
  //    (the rhythmic vertical ticks). ─────────────────────────────────────────
  function cricket(carrierHz, pulseHz, dutyMs, level, phase, harmAmt) {
    // Continuous carrier sine at the chirp frequency.
    var car = ctx.createOscillator();
    car.type = 'sine';
    car.frequency.value = carrierHz;

    // A faint detuned partner an octave-ish band away adds the slightly buzzy,
    // reedy timbre of a real cricket file-scraper without leaving the bright band.
    var car2 = ctx.createOscillator();
    car2.type = 'sine';
    car2.frequency.value = carrierHz * 1.5;   // a fifth above — still in band
    var car2g = ctx.createGain();
    car2g.gain.value = harmAmt;

    // Per-voice bandpass so each trill is its own narrow tone (the "narrowband
    // tone burst" of the recipe) — a tight Q keeps it pure and high-centroid.
    var vbp = ctx.createBiquadFilter();
    vbp.type = 'bandpass';
    vbp.frequency.value = carrierHz;
    vbp.Q.value = 8;

    // The pulse GATE: a gain node driven by a raised-cosine grain per pulse.
    var gate = ctx.createGain();
    gate.gain.setValueAtTime(0.0001, t0);

    var period = 1 / pulseHz;
    var grain = Math.min(dutyMs / 1000, period * 0.7);   // grain shorter than period -> clean gap
    // Start at the voice's phase offset so the three voices interleave.
    var pAt = t0 + phase * period;
    var N = 24;                       // samples per grain envelope (smooth)
    var guard = 0;
    while (pAt < t0 + dur - grain && guard < 20000) {
      var env = new Float32Array(N);
      for (var i = 0; i < N; i++) {
        var x = i / (N - 1);
        // raised-cosine bump: 0 -> peak -> 0, click-free open & close
        env[i] = Math.max(0.0001, level * (0.5 - 0.5 * Math.cos(2 * Math.PI * x)));
      }
      gate.gain.setValueCurveAtTime(env, pAt, grain);
      gate.gain.setValueAtTime(0.0001, pAt + grain);
      pAt += period;
      guard++;
    }

    car.connect(vbp);
    car2.connect(car2g).connect(vbp);
    vbp.connect(gate).connect(bp);

    car.start(t0);  car.stop(t0 + dur + 0.02);
    car2.start(t0); car2.stop(t0 + dur + 0.02);
    oscs.push(car, car2);
  }

  // ── Layer 3 crickets at slightly different chirp pitches, pulse rates, and
  //    phases — a small natural chorus, not a metronome. Quiet per-voice levels
  //    sum to a soft bed. ───────────────────────────────────────────────────
  var nVoices = 3;
  for (var v = 0; v < nVoices; v++) {
    var carrierHz = range(4300, 5200);     // dominant chirp frequency, high band
    var pulseHz   = range(8, 13);          // steady trill rate — a few audible pulses/sec
    var dutyMs    = range(11, 17);         // short crisp pulses
    var level     = range(0.55, 0.85);     // per-voice gain (master keeps it quiet overall)
    var phase     = rng();                 // start phase offset within a period
    var harmAmt   = range(0.10, 0.20);     // faint reedy fifth
    cricket(carrierHz, pulseHz, dutyMs, level, phase, harmAmt);
  }

  // ── Live-use handle: fade the master out cleanly at a given time. ─────────
  return {
    stop: function (at) {
      var when_s = at != null ? at : ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(when_s);
        master.gain.setValueAtTime(master.gain.value || baseLevel, when_s);
        master.gain.linearRampToValueAtTime(0.0001, when_s + 0.08);
      } catch (e) {}
      for (var k = 0; k < oscs.length; k++) {
        try { oscs[k].stop(when_s + 0.1); } catch (e) {}
      }
    }
  };
};
