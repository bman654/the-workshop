'use strict';
/* ─────────────────────────────────────────────────────────────────────────────
   SP.sfx — the sound of a pen on paper, and of a hand thinking.

   Everything in this room is one of two physical events: something DRAGS across
   paper, or something TAPS it. So there is no melody anywhere in this file and
   no pitched instrument — a napkin game that chimed at you would stop being a
   napkin game. Every voice here is filtered noise with an envelope, plus the
   faintest woody resonance where a real object would have one.

   Contract (the estate's builder shape): each voice is
       SP.sfx.<name>({ ctx, dest, dur, when, seed, … })
   with `when` a RELATIVE offset in seconds from ctx.currentTime. Nothing is
   created before a user gesture; the page owns the AudioContext and the one
   shared mute (ws:pref:muted).
   ───────────────────────────────────────────────────────────────────────────── */
var SP = (typeof SP !== 'undefined' && SP) || {};
SP.sfx = (function () {
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* One reusable noise burst. `tone` (0..1) opens the band-pass — low is a
     graphite drag, high is the dry rasp of a steel nib. */
  function noise(o) {
    var ctx = o.ctx, t0 = ctx.currentTime + (o.when || 0), dur = o.dur || 0.12;
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    var r = rng(o.seed || 1), last = 0;
    for (var i = 0; i < n; i++) {
      var w = r() * 2 - 1;
      last = last * 0.72 + w * 0.28;                 // gently brown — paper, not hiss
      d[i] = w * 0.55 + last * 0.9;
    }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(o.f0 || 1400, t0);
    if (o.f1) bp.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    bp.Q.value = o.q == null ? 0.9 : o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.08), t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(o.dest);
    src.start(t0); src.stop(t0 + dur + 0.02);
    return { t0: t0, g: g };
  }
  /* A struck body: a very short damped resonance. This is what makes a tap read
     as WOOD or as PAPER rather than as a click. */
  function knock(o) {
    var ctx = o.ctx, t0 = ctx.currentTime + (o.when || 0), dur = o.dur || 0.09;
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(o.f || 190, t0);
    osc.frequency.exponentialRampToValueAtTime((o.f || 190) * 0.72, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.06, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || 1100;
    osc.connect(lp); lp.connect(g); g.connect(o.dest);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  return {
    /* THE DRAG. Held open while the hand moves and modulated by pointer speed —
       so it is not a sound effect that fires, it is a surface you are rubbing.
       Returns a handle with .speed(v) and .stop(). */
    drag: function (o) {
      var ctx = o.ctx, t0 = ctx.currentTime;
      var n = Math.floor(ctx.sampleRate * 1.0);
      var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      var r = rng(o.seed || 7), last = 0;
      for (var i = 0; i < n; i++) { var w = r() * 2 - 1; last = last * 0.68 + w * 0.32; d[i] = last * 1.1; }
      var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.f || 1500; bp.Q.value = 0.7;
      var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
      src.connect(bp); bp.connect(g); g.connect(o.dest); src.start(t0);
      return {
        speed: function (v) {                        // v in su/ms, roughly 0…2
          var now = ctx.currentTime;
          var amp = Math.min(0.055, 0.004 + v * 0.05);
          g.gain.setTargetAtTime(amp, now, 0.03);
          bp.frequency.setTargetAtTime((o.f || 1500) + v * 900, now, 0.05);
        },
        stop: function () {
          var now = ctx.currentTime;
          g.gain.setTargetAtTime(0.0001, now, 0.04);
          try { src.stop(now + 0.3); } catch (e) {}
        },
      };
    },
    /* The new spot arriving: a soft, close tick — a pen tip set down and lifted. */
    drop: function (o) {
      knock({ ctx: o.ctx, dest: o.dest, when: o.when, f: 320, dur: 0.075, gain: 0.05, lp: 1600 });
      noise({ ctx: o.ctx, dest: o.dest, when: o.when, dur: 0.05, f0: 2600, f1: 1200, gain: 0.022, seed: o.seed || 3 });
    },
    /* The house's nib: drier and thinner than graphite — steel, not lead. */
    nib: function (o) {
      noise({ ctx: o.ctx, dest: o.dest, when: o.when, dur: o.dur || 0.55, f0: 2300, f1: 3100, q: 1.6, gain: 0.026, attack: 0.09, seed: o.seed || 11 });
    },
    /* One dry tick per ghosted candidate. Four in a row IS the sound of thinking. */
    ponder: function (o) {
      noise({ ctx: o.ctx, dest: o.dest, when: o.when, dur: 0.035, f0: 3200, f1: 2200, q: 2.2, gain: 0.02, seed: (o.seed || 5) + 1 });
    },
    /* A sheet torn off the pad — a fast rising rip, not a crash. */
    tear: function (o) {
      noise({ ctx: o.ctx, dest: o.dest, when: o.when, dur: 0.34, f0: 900, f1: 4200, q: 0.6, gain: 0.06, attack: 0.05, seed: o.seed || 21 });
      noise({ ctx: o.ctx, dest: o.dest, when: (o.when || 0) + 0.04, dur: 0.24, f0: 1800, f1: 5200, q: 1.1, gain: 0.03, attack: 0.08, seed: (o.seed || 21) + 4 });
    },
    /* The refusal. Not a buzzer — the small dry scuff of a nib that would not take. */
    scuff: function (o) {
      noise({ ctx: o.ctx, dest: o.dest, when: o.when, dur: 0.11, f0: 700, f1: 380, q: 1.3, gain: 0.035, seed: o.seed || 17 });
    },
    /* The ending: a tool set down on wood. One tap, and then the room is quiet. */
    tap: function (o) {
      knock({ ctx: o.ctx, dest: o.dest, when: o.when, f: 150, dur: 0.16, gain: 0.075, lp: 700 });
      noise({ ctx: o.ctx, dest: o.dest, when: o.when, dur: 0.06, f0: 1500, f1: 500, gain: 0.018, seed: o.seed || 31 });
    },
  };
})();
