/* ═══════════════════════════════════════════════════════════════════════════
   audio-gears.js  —  Gate.sfx.gears  —  HEAVY mechanical clockwork turning

   The open-sequence "gears" phase (~2.5–3s of gear-spin). A dual-use procedural
   builder: schedule everything into `dest` against ANY BaseAudioContext (a live
   AudioContext when it ships, an OfflineAudioContext when it is verified), so the
   graph that is measured is the graph that ships. Fully deterministic — driven
   by a small seeded PRNG (mulberry32), never Math.random.

   Voiced as WEIGHT, not chatter. Heavy meshing teeth, a low grind bed, deliberate
   metal impacts — loud and bass-forward, all peaks kept under 0 dBFS (no clipping):

     (1) GRIND BED  — lowpassed brown noise + a low sawtooth (~58 Hz) through a
                      lowpass, the two summed into a slow tremolo driven by the
                      tooth rhythm: a continuous low rumble/grind under everything.
     (2) RATCHET    — deliberate heavy impacts at a slow seeded period (~5/sec):
                      each = a LOWPASSED noise thud (mass, not a bright tick)
                      PLUS a fast-decaying low resonant "tonk" (a metal tooth
                      seating, ~80–160 Hz). Tiny per-impact jitter keeps it
                      mechanical; the period stays visible as heavy streaks.
     (3) WHIR       — a low, grindy tonal band: two detuned sawtooths (~52 Hz)
                      through a lowpass with a touch of resonance — the hum of
                      the train turning, kept LOW and gritty.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── mulberry32: tiny deterministic PRNG, seeded; returns floats in [0,1). ──
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  Gate.sfx.gears = function (opts) {
    var ctx = opts.ctx;
    var dest = opts.dest;
    var dur = opts.dur;
    var when = opts.when == null ? 0 : opts.when;
    var seed = opts.seed == null ? 1 : opts.seed;

    var t0 = ctx.currentTime + when;
    var sr = ctx.sampleRate;
    var rnd = mulberry32((seed >>> 0) || 1);

    // Master bus with a gentle fade in/out so the bed starts/ends without a
    // click transient. Keep the summed peak comfortably under 0 dBFS.
    var master = ctx.createGain();
    var fade = Math.min(0.08, dur * 0.1);
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(1, t0 + fade);
    master.gain.setValueAtTime(1, t0 + Math.max(fade, dur - fade));
    master.gain.linearRampToValueAtTime(0, t0 + dur);
    master.connect(dest);

    // ── Shared seeded white-noise buffer ([-1,1]); reused for impact slices. ──
    var noiseLen = Math.max(1, Math.ceil(sr * dur));
    var whiteBuf = ctx.createBuffer(1, noiseLen, sr);
    var wnd = whiteBuf.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) { wnd[i] = rnd() * 2 - 1; }

    // ── Brown-noise buffer (integrated white, leaky): heavy low-frequency mass
    //    for the grind bed. Normalised so it sits near unity without clipping. ──
    var brownBuf = ctx.createBuffer(1, noiseLen, sr);
    var bnd = brownBuf.getChannelData(0);
    var last = 0, bmax = 1e-6;
    for (var b = 0; b < noiseLen; b++) {
      var wn = rnd() * 2 - 1;
      last = (last + 0.02 * wn) / 1.02;   // leaky integrator → 1/f-ish, bass-heavy
      bnd[b] = last;
      var ab = last < 0 ? -last : last;
      if (ab > bmax) bmax = ab;
    }
    var bgain = 0.9 / bmax;
    for (var b2 = 0; b2 < noiseLen; b2++) { bnd[b2] *= bgain; }

    // Tooth rhythm — deliberate, weighty. Slower than a tick (heavy gears turn
    // slowly). Used both for the impacts and to modulate the grind bed.
    var clickRate = 5.0;                 // impacts per second (deliberate)
    var period = 1 / clickRate;

    // ───────────────────────────────────────────────────────────────────────
    // LAYER 1 — GRIND BED: lowpassed brown noise + a low saw, summed and
    // tremolo'd by the tooth rhythm. A continuous low rumble that swells on
    // each tooth and dips between — the body of the turning mass.
    // ───────────────────────────────────────────────────────────────────────
    var bedSum = ctx.createGain();       // tooth-rhythm tremolo applied here
    bedSum.gain.setValueAtTime(0.55, t0);
    // Slow amplitude modulation locked to the tooth period: swell at each tooth.
    for (var bt = 0; bt < dur; bt += period) {
      var lo = t0 + bt;
      var mid = t0 + bt + period * 0.5;
      bedSum.gain.setValueAtTime(0.42, lo);
      bedSum.gain.linearRampToValueAtTime(0.72, mid);
      bedSum.gain.linearRampToValueAtTime(0.42, lo + period);
    }
    bedSum.connect(master);

    // Brown-noise rumble through a low lowpass.
    var brownSrc = ctx.createBufferSource();
    brownSrc.buffer = brownBuf;
    var brownLP = ctx.createBiquadFilter();
    brownLP.type = 'lowpass';
    brownLP.frequency.setValueAtTime(180, t0);   // keep it deep
    brownLP.Q.setValueAtTime(0.7, t0);
    var brownGain = ctx.createGain();
    brownGain.gain.setValueAtTime(0.85, t0);
    brownSrc.connect(brownLP).connect(brownGain).connect(bedSum);
    brownSrc.start(t0);
    brownSrc.stop(t0 + dur);

    // Low sawtooth grind ~58 Hz through a lowpass: tonal floor of the bed.
    var bedSaw = ctx.createOscillator();
    bedSaw.type = 'sawtooth';
    bedSaw.frequency.setValueAtTime(58, t0);
    bedSaw.frequency.linearRampToValueAtTime(64, t0 + dur);  // subtle spin-up
    var bedSawLP = ctx.createBiquadFilter();
    bedSawLP.type = 'lowpass';
    bedSawLP.frequency.setValueAtTime(240, t0);
    bedSawLP.Q.setValueAtTime(1.2, t0);
    var bedSawGain = ctx.createGain();
    bedSawGain.gain.setValueAtTime(0.42, t0);
    bedSaw.connect(bedSawLP).connect(bedSawGain).connect(bedSum);
    bedSaw.start(t0);
    bedSaw.stop(t0 + dur);

    // ───────────────────────────────────────────────────────────────────────
    // LAYER 2 — RATCHET: deliberate HEAVY impacts. Each tooth seating =
    //   (a) a LOWPASSED noise thud — mass and grit, not a bright tick; plus
    //   (b) a low resonant "tonk" — a fast-decaying sine ~80–160 Hz, the metal
    //       tooth ringing as it seats. Tiny per-impact jitter; the period stays
    //       visible as evenly spaced heavy streaks.
    // ───────────────────────────────────────────────────────────────────────
    var impactDur = 0.13;                // longer than a tick → weight
    var tonks = [];
    for (var ct = period; ct < dur - impactDur; ct += period) {
      var jitter = (rnd() - 0.5) * period * 0.08;   // ±4% of the period
      var ot = t0 + ct + jitter;

      // (a) Lowpassed noise thud — the dull mass of the impact.
      var thudSrc = ctx.createBufferSource();
      thudSrc.buffer = whiteBuf;
      var off = Math.floor(rnd() * Math.max(1, (noiseLen - impactDur * sr - 1)));
      thudSrc.loop = false;

      var thudLP = ctx.createBiquadFilter();
      thudLP.type = 'lowpass';
      var cf = 320 + rnd() * 220;        // 320–540 Hz: dull, weighty (no bright tick)
      thudLP.frequency.setValueAtTime(cf, ot);
      thudLP.Q.setValueAtTime(1.1, ot);

      var thudEnv = ctx.createGain();
      thudEnv.gain.setValueAtTime(0, ot);
      thudEnv.gain.linearRampToValueAtTime(0.62, ot + 0.004);          // soft thump attack
      thudEnv.gain.exponentialRampToValueAtTime(0.0008, ot + impactDur);
      thudEnv.gain.setValueAtTime(0, ot + impactDur + 0.001);

      thudSrc.connect(thudLP).connect(thudEnv).connect(master);
      thudSrc.start(ot, off / sr, impactDur + 0.01);

      // (b) Pitched "tonk" — a damped low sine, the tooth seating into mesh.
      var tonk = ctx.createOscillator();
      tonk.type = 'sine';
      var thz = 80 + rnd() * 80;         // 80–160 Hz
      tonk.frequency.setValueAtTime(thz * 1.6, ot);
      tonk.frequency.exponentialRampToValueAtTime(thz, ot + 0.05);  // quick downward "tonk"
      var tonkEnv = ctx.createGain();
      tonkEnv.gain.setValueAtTime(0, ot);
      tonkEnv.gain.linearRampToValueAtTime(0.5, ot + 0.003);
      tonkEnv.gain.exponentialRampToValueAtTime(0.0006, ot + 0.16);  // fast metallic decay
      tonk.connect(tonkEnv).connect(master);
      tonk.start(ot);
      tonk.stop(ot + 0.18);
      tonks.push(tonk);
    }

    // ───────────────────────────────────────────────────────────────────────
    // LAYER 3 — WHIR: a LOW, grindy tonal band. Two detuned sawtooths (~52 Hz)
    // through a resonant lowpass — the continuous hum of the gear train, kept
    // low and gritty so it reinforces the bass rather than thinning the mix.
    // ───────────────────────────────────────────────────────────────────────
    var whirLP = ctx.createBiquadFilter();
    whirLP.type = 'lowpass';
    whirLP.frequency.setValueAtTime(300, t0);   // keep the tonal energy LOW
    whirLP.Q.setValueAtTime(2.2, t0);           // a little grind/resonance
    var whirGain = ctx.createGain();
    whirGain.gain.setValueAtTime(0.22, t0);
    whirLP.connect(whirGain).connect(master);

    var baseHz = 52;                  // very low fundamental
    var detunes = [0, +7];            // second saw thickens & grinds the hum
    var oscs = [];
    for (var k = 0; k < detunes.length; k++) {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseHz, t0);
      osc.detune.setValueAtTime(detunes[k], t0);
      osc.frequency.linearRampToValueAtTime(baseHz + 5, t0 + dur);  // subtle spin-up
      var oscG = ctx.createGain();
      oscG.gain.setValueAtTime(0.5, t0);
      osc.connect(oscG).connect(whirLP);
      osc.start(t0);
      osc.stop(t0 + dur);
      oscs.push(osc);
    }

    // Live-use handle: stop everything at `at` (or now). Offline renders ignore.
    return {
      stop: function (at) {
        var when2 = at != null ? at : ctx.currentTime;
        try { brownSrc.stop(when2); } catch (e) {}
        try { bedSaw.stop(when2); } catch (e2) {}
        for (var m = 0; m < oscs.length; m++) {
          try { oscs[m].stop(when2); } catch (e3) {}
        }
        for (var n = 0; n < tonks.length; n++) {
          try { tonks[n].stop(when2); } catch (e4) {}
        }
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
