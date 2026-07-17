'use strict';
/*
 * Gate.sfx.sleet — procedural ICE-TICK bed (WebAudio, dual-use offline/live, r24).
 * Sleet SOUNDS different from rain: icy pellets ticking on stone. This bed rides
 * OVER the rain loop (bus 0.5) — bright/dry ICE against rain's low patter (§9.6):
 *   • a sparse TICK FIELD ~28–40 ticks/s; each tick a 2–6 ms noise burst band-
 *     passed HIGH (seeded centre 3.2–6.0 kHz, Q ~8), sharp attack / exp decay;
 *   • ~every 4th tick a BOUNCE (−6..−9 dB, higher centre, 30–70 ms later) — the
 *     pellet skittering after its strike, on a distinct non-overlapping chain;
 *   • one shared seeded white-noise source → two band-pass→gate chains; a master
 *     highpass keeps it airy (the low band is the rain loop's, not the ice's).
 * Determinism: a seeded mulberry32 PRNG, never Math.random — a {seed} renders
 * bit-identical. Zero assets (B1). A stationary dur-second bed that loops cleanly.
 */
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx.sleet = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;

  // ── Seeded PRNG (mulberry32): deterministic uniform [0,1) ────────────────
  var a = (seed >>> 0) || 1;
  function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(lo, hi) { return lo + rng() * (hi - lo); }

  // ── One seeded white-noise buffer, shared by both chains ─────────────────
  var nlen = Math.max(1, Math.ceil((dur + 0.25) * sr));
  var nbuf = ctx.createBuffer(1, nlen, sr);
  var nd = nbuf.getChannelData(0);
  for (var n = 0; n < nlen; n++) nd[n] = rng() * 2 - 1;
  var src = ctx.createBufferSource();
  src.buffer = nbuf;

  // ── Master: keep the energy bright/dry (high centroid) — a highpass strips
  //    any low rumble; the rain loop owns the low band. Modest overall gain. ──
  var master = ctx.createGain();
  master.gain.value = 0.62;
  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2200;
  hp.connect(master).connect(dest);

  // ── Two band-pass → gate chains: the tick FIELD and the BOUNCE. Each tick
  //    schedules the chain's band-pass centre + a short raised gain grain. ──
  function chain() {
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 8;                     // narrow — an icy ping, not a hiss
    var gate = ctx.createGain();
    gate.gain.setValueAtTime(0.0001, t0);
    src.connect(bp).connect(gate).connect(hp);
    return { bp: bp, gate: gate };
  }
  var field = chain(), bounce = chain();

  var NENV = 24;
  // a per-tick grain: sharp attack, exponential decay (the dry ice crack).
  function grain(level) {
    var e = new Float32Array(NENV), i;
    for (i = 0; i < NENV; i++) {
      var x = i / (NENV - 1);
      var atk = x < 0.12 ? x / 0.12 : 1;                 // sharp attack
      var dec = Math.exp(-6.5 * Math.max(0, x - 0.12));  // exponential decay
      e[i] = Math.max(0.0001, level * atk * dec);
    }
    return e;
  }
  function tick(ch, at, durS, centreHz, level) {
    ch.bp.frequency.setValueAtTime(centreHz, at);
    ch.gate.gain.setValueCurveAtTime(grain(level), at, durS);
    ch.gate.gain.setValueAtTime(0.0001, at + durS);
  }

  // ── Schedule the tick field ──────────────────────────────────────────────
  var t = t0 + 0.005, guard = 0, lastBounceEnd = t0;
  while (t < t0 + dur && guard < 4000) {
    var centre = range(3200, 6000);
    var burst = range(0.002, 0.006);
    var lvl = range(0.7, 1.0);                    // per-tick level jitter
    tick(field, t, burst, centre, lvl);
    if (rng() < 0.25) {                           // ~every 4th tick: a bounce
      var bt = t + range(0.030, 0.070);
      if (bt < t0 + dur && bt > lastBounceEnd + 0.004) {   // keep bounces ordered
        var bBurst = range(0.002, 0.005);
        var bCentre = Math.min(7500, centre * range(1.15, 1.4));   // higher
        var bLvl = lvl * range(0.355, 0.501);     // −9..−6 dB below its strike
        tick(bounce, bt, bBurst, bCentre, bLvl);
        lastBounceEnd = bt + bBurst;
      }
    }
    t += 1 / range(28, 40);                       // seeded inter-tick interval
    guard++;
  }

  src.start(t0);
  src.stop(t0 + dur + 0.15);

  // ── Live-use handle: fade the master out cleanly at a given time. ─────────
  return {
    stop: function (at) {
      var when_s = at != null ? at : ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(when_s);
        master.gain.setValueAtTime(master.gain.value || 0.62, when_s);
        master.gain.linearRampToValueAtTime(0.0001, when_s + 0.08);
      } catch (e) {}
      try { src.stop(when_s + 0.1); } catch (e) {}
    }
  };
};
