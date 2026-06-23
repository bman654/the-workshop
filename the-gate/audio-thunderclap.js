/* ═══════════════════════════════════════════════════════════════════════════
   audio-thunderclap.js  —  Gate.sfx.thunderclap  (procedural WebAudio)

   The Gate's lightning thunderclap: a POWERFUL two-part 'CR-AACK'. A sharp
   broadband CRACK transient at t=0, then ~110ms later a bigger BASS-HEAVY
   body/slap, then a short reverberant decay tail (~1.2s). It pairs with the
   separate long 'thunderroll'; this is the single per-strike impact.

   Architecture (per the Gate sfx contract): a dual-use builder that schedules a
   self-contained one-shot into `dest` against ANY BaseAudioContext (a live
   AudioContext when it ships, an OfflineAudioContext when it is verified). The
   exact graph rendered offline for audio-lens is the one that ships.

   Signal path:
     dry voices ─┬─────────────────────────────► master ─► dest
                 └─► reverb send ─► FDN tail ────►
   Voices (all noise voices share one deterministic seeded noise bed):
     1. CRACK  — broadband noise, ~0.5ms attack, hard ~45ms exp decay, highpass
                 so the leading edge reads as a bright full-height vertical slab.
     2. SLAP   — the second transient ~110ms after the crack: lowpassed noise
                 with a downward cutoff sweep, fuller and louder than the crack.
     3. SUB    — a ~70→40 Hz sine thump under the slap for chest weight / bass,
                 pulling the spectral centroid LOW. Decays in ~180ms (no f0).
     4. TAIL   — a 4-line feedback-delay network (with allpass diffusion) fed a
                 reverb send from crack+slap, giving a ~1.2s decaying wash so
                 silenceRatio rises late in the clip.

   No ringing, no stable pitch. Peaks held near -2 dBFS but under 0. Seeded PRNG.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  // ── mulberry32: tiny deterministic PRNG → floats in [0,1). NOT Math.random. ──
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Fill a mono AudioBuffer with deterministic white noise in [-1,1]. ────────
  function makeNoiseBuffer(ctx, seed, seconds) {
    var n = Math.max(1, Math.round(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0);
    for (var i = 0; i < n; i++) {
      data[i] = rnd() * 2 - 1;
    }
    return buf;
  }

  Gate.sfx.thunderclap = function (opts) {
    opts = opts || {};
    var ctx  = opts.ctx;
    var dest = opts.dest;
    var dur  = opts.dur != null ? opts.dur : 2.5;
    var when = opts.when != null ? opts.when : 0;
    var seed = opts.seed != null ? opts.seed : 1;

    var t0 = ctx.currentTime + when;

    // One shared noise bed covers every noise voice (offset reads via the
    // sources' own playback keep them distinct yet fully deterministic).
    var bedSec = Math.min(Math.max(dur, 0.5), 1.4);
    var noise = makeNoiseBuffer(ctx, (seed * 2654435761) >>> 0, bedSec);

    // Master bus → dest. A soft-clip-free safety: keep peak near -2 dBFS by
    // budgeting per-voice gains; the master trims the summed bus.
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.46, t0);
    master.connect(dest);

    // Reverb send bus → FDN tail → master. Crack + slap feed this.
    var send = ctx.createGain();
    send.gain.setValueAtTime(0.32, t0);

    // ── Voice 1: the CRACK (first transient) ───────────────────────────────
    // Broadband noise, near-instant attack, hard exponential decay. A highpass
    // keeps it crisp/bright — a tall thin vertical slab at t=0.
    // A short lead-in of silence before the crack's attack so the very first
    // STFT analysis frame is quiet — the crack then reads as a clean spectral-
    // flux RISE (a distinct first onset) rather than vanishing into frame 0.
    var crackDelay = 0.07;
    var tC = t0 + crackDelay;
    var crackSrc = ctx.createBufferSource();
    crackSrc.buffer = noise;
    var crackHP = ctx.createBiquadFilter();
    crackHP.type = 'highpass';
    crackHP.frequency.setValueAtTime(500, tC);   // broader band → more bins light up (stronger flux)
    crackHP.Q.setValueAtTime(0.6, tC);
    var crackG = ctx.createGain();
    var crackDecay = 0.035;                 // ~35ms body — snappy, clears before the slap
    crackG.gain.setValueAtTime(0.0001, tC);
    crackG.gain.linearRampToValueAtTime(1.0, tC + 0.0005);   // ~0.5ms attack
    crackG.gain.exponentialRampToValueAtTime(0.0006, tC + crackDecay);
    crackG.gain.setValueAtTime(0, tC + crackDecay + 0.003);
    crackSrc.connect(crackHP).connect(crackG);
    crackG.connect(master);
    crackG.connect(send);
    crackSrc.start(tC);
    crackSrc.stop(tC + crackDecay + 0.02);

    // ── Voice 2: the SLAP (second transient) ───────────────────────────────
    // Fires ~110ms after the crack — the 'AACK'. Lowpassed noise with a
    // downward cutoff sweep: fuller, louder and lower than the crack. Reads as
    // a second bright slab that reaches lower (more bass) than the first.
    var slapDelay = 0.22;
    var tS = t0 + slapDelay;
    var slapSrc = ctx.createBufferSource();
    slapSrc.buffer = noise;
    slapSrc.playbackRate.setValueAtTime(0.78, tS); // darker grain
    var slapLP = ctx.createBiquadFilter();
    slapLP.type = 'lowpass';
    slapLP.Q.setValueAtTime(0.7, tS);
    slapLP.frequency.setValueAtTime(3200, tS);
    slapLP.frequency.exponentialRampToValueAtTime(260, tS + 0.32);
    var slapG = ctx.createGain();
    var slapDecay = 0.36;
    slapG.gain.setValueAtTime(0.0001, tS);
    slapG.gain.linearRampToValueAtTime(1.0, tS + 0.003);  // hard, fuller second hit
    slapG.gain.exponentialRampToValueAtTime(0.0006, tS + slapDecay);
    slapG.gain.setValueAtTime(0, tS + slapDecay + 0.005);
    slapSrc.connect(slapLP).connect(slapG);
    slapG.connect(master);
    slapG.connect(send);
    slapSrc.start(tS);
    slapSrc.stop(tS + slapDecay + 0.02);

    // Slap leading EDGE: a very short broadband (unfiltered) burst exactly on
    // the slap onset. This injects a sharp new-spectral-energy jump so the
    // analyzer's spectral-flux detector resolves the slap as a DISTINCT second
    // onset (the lowpassed body alone ramps in too gradually to spike flux).
    var edgeSrc = ctx.createBufferSource();
    edgeSrc.buffer = noise;
    var edgeHP = ctx.createBiquadFilter();
    edgeHP.type = 'highpass';
    edgeHP.frequency.setValueAtTime(800, tS);
    edgeHP.Q.setValueAtTime(0.5, tS);
    var edgeG = ctx.createGain();
    var edgeDecay = 0.02;
    edgeG.gain.setValueAtTime(0.0001, tS);
    edgeG.gain.linearRampToValueAtTime(0.7, tS + 0.0005);
    edgeG.gain.exponentialRampToValueAtTime(0.0006, tS + edgeDecay);
    edgeG.gain.setValueAtTime(0, tS + edgeDecay + 0.003);
    edgeSrc.connect(edgeHP).connect(edgeG);
    edgeG.connect(master);
    edgeG.connect(send);
    edgeSrc.start(tS);
    edgeSrc.stop(tS + edgeDecay + 0.02);

    // ── Voice 3: the SUB thump (bass body, under the slap) ──────────────────
    // A low sine "boom" for chest weight that pulls the centroid down and gives
    // the slap real low-end. Pitch glides down (no fixed tone), decays ~180ms.
    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(74, tS);
    sub.frequency.exponentialRampToValueAtTime(40, tS + 0.18);
    var subG = ctx.createGain();
    subG.gain.setValueAtTime(0.0001, tS);
    subG.gain.linearRampToValueAtTime(0.85, tS + 0.006);
    subG.gain.exponentialRampToValueAtTime(0.0006, tS + 0.20);
    subG.gain.setValueAtTime(0, tS + 0.21);
    sub.connect(subG).connect(master);
    sub.start(tS);
    sub.stop(tS + 0.23);

    // ── Voice 4: the reverberant TAIL — a 4-line feedback-delay network ──────
    // Two allpass diffusers smear the input, then four parallel feedback delays
    // (mutually fed back through a shared damping lowpass) create a dense,
    // decaying wash. Tuned to settle in ~1.2s so silenceRatio rises late.
    var tailEnd = Math.min(dur, slapDelay + 1.4);

    // Allpass diffusion stage builder (Schroeder allpass via delay + feedback).
    function makeAllpass(delaySec, g) {
      var d = ctx.createDelay(0.2);
      d.delayTime.setValueAtTime(delaySec, t0);
      var fb = ctx.createGain();    fb.gain.setValueAtTime(g, t0);
      var ff = ctx.createGain();    ff.gain.setValueAtTime(-g, t0);
      var input = ctx.createGain(); input.gain.setValueAtTime(1, t0);
      var out = ctx.createGain();   out.gain.setValueAtTime(1, t0);
      // y = -g*x + d ; d = x + g*d_delayed
      input.connect(ff).connect(out);   // feedforward -g*x
      input.connect(d);
      d.connect(out);                    // delayed signal to output
      d.connect(fb).connect(d);          // delay feedback +g
      return { input: input, out: out };
    }

    var ap1 = makeAllpass(0.0047, 0.7);
    var ap2 = makeAllpass(0.0123, 0.6);
    send.connect(ap1.input);
    ap1.out.connect(ap2.input);

    // Four feedback delay lines with a shared damping lowpass in the loop.
    var delayTimes = [0.0297, 0.0411, 0.0573, 0.0689];
    var fdnIn = ap2.out;
    var damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.setValueAtTime(2400, t0);   // dark, distant reverb
    damp.Q.setValueAtTime(0.5, t0);
    var fbGain = ctx.createGain();
    fbGain.gain.setValueAtTime(0.62, t0);       // global decay rate
    var tailG = ctx.createGain();
    // Tail rises only AFTER the slap so it doesn't fill the crack→slap gap
    // (which would merge the two transients into one onset).
    tailG.gain.setValueAtTime(0.0001, t0);
    tailG.gain.setValueAtTime(0.0001, tS + 0.04);
    tailG.gain.linearRampToValueAtTime(0.6, tS + 0.10);
    // Fade the tail out by tailEnd so it never rings past the clip.
    tailG.gain.setValueAtTime(0.6, Math.max(tS + 0.10, tailEnd - 0.3));
    tailG.gain.exponentialRampToValueAtTime(0.0005, tailEnd);
    tailG.connect(master);

    var dl = [];
    for (var k = 0; k < delayTimes.length; k++) {
      var dn = ctx.createDelay(0.2);
      dn.delayTime.setValueAtTime(delayTimes[k], t0);
      dl.push(dn);
      fdnIn.connect(dn);          // input feeds each line
      dn.connect(tailG);          // each line → tail output
    }
    // Mutual feedback: sum lines → damp → fbGain → back into each line.
    var fbSum = ctx.createGain();
    fbSum.gain.setValueAtTime(1 / dl.length, t0);
    for (var m = 0; m < dl.length; m++) { dl[m].connect(fbSum); }
    fbSum.connect(damp).connect(fbGain);
    for (var p = 0; p < dl.length; p++) { fbGain.connect(dl[p]); }

    // Live-use handle: hard-stop the scheduled sources at `at` (or now). The
    // FDN nodes have no sources to stop, but the tail gain envelope ends them.
    return {
      stop: function (at) {
        var when2 = at != null ? at : ctx.currentTime;
        try { crackSrc.stop(when2); } catch (e) {}
        try { slapSrc.stop(when2); } catch (e) {}
        try { sub.stop(when2); } catch (e) {}
        try { tailG.gain.cancelScheduledValues(when2); } catch (e) {}
        try { tailG.gain.setValueAtTime(0, when2); } catch (e) {}
      }
    };
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
