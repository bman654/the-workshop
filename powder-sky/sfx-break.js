'use strict';
/* ── SFX: the BREAK — the report, and the water's distant echo of it ───────────
   Powder.sfx.break  — the shell's report: a sharp CRACK transient over a deep
     BOOM body, layered by size (bigger = deeper, later-blooming, longer tail).
   Powder.sfx.reflect — the SAME boom heard off the water a beat later: no crack,
     heavily low-passed + softened + quieter (the harbour throwing the sound back).
   Deterministic (seeded), dual-use (live OR OfflineAudioContext).
   Contract: Powder.sfx.break ({ ctx, dest, dur, when=0, seed=1, size=4 }) -> {stop}
             Powder.sfx.reflect({ ctx, dest, dur, when=0, seed=1, size=4 }) -> {stop}
   ─────────────────────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';
  var Powder = root.Powder = root.Powder || {};
  Powder.sfx = Powder.sfx || {};

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise(ctx, seed, sec) {
    var n = Math.max(1, Math.round(ctx.sampleRate * sec));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    var rnd = mulberry32(seed >>> 0);
    for (var i = 0; i < n; i++) d[i] = rnd() * 2 - 1;
    return buf;
  }

  // shared: the low BOOM body (a filtered noise thud + a sub sine that sags)
  function boom(ctx, master, t0, size, seed, dark, gain) {
    var bedSec = 0.5 + size * 0.05;
    var src = ctx.createBufferSource();
    src.buffer = noise(ctx, seed >>> 0, bedSec + 0.1);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.setValueAtTime(0.6, t0);
    var top = dark ? (160 - size * 6) : (620 - size * 30);
    lp.frequency.setValueAtTime(top, t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(45, top * 0.35), t0 + bedSec);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(gain * 0.25, t0 + 0.12 + size * 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, t0 + bedSec);
    g.gain.setValueAtTime(0, t0 + bedSec + 0.02);
    src.connect(lp).connect(g).connect(master);
    src.start(t0); src.stop(t0 + bedSec + 0.05);

    var sub = ctx.createOscillator();
    sub.type = 'sine';
    var f0 = (dark ? 52 : 74) - size * 3;
    sub.frequency.setValueAtTime(Math.max(30, f0 + 26), t0);
    sub.frequency.exponentialRampToValueAtTime(Math.max(28, f0), t0 + 0.22);
    var sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t0);
    sg.gain.linearRampToValueAtTime(gain * 0.7, t0 + 0.016);
    sg.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.3 + size * 0.02);
    sg.gain.setValueAtTime(0, t0 + 0.34 + size * 0.02);
    sub.connect(sg).connect(master);
    sub.start(t0); sub.stop(t0 + 0.4 + size * 0.03);
    return { src: src, sub: sub };
  }

  Powder.sfx.break = function (o) {
    o = o || {};
    var ctx = o.ctx, dest = o.dest, when = o.when != null ? o.when : 0;
    var seed = (o.seed | 0) || 1, size = o.size != null ? o.size : 4;
    var t0 = ctx.currentTime + when;
    var master = ctx.createGain(); master.gain.setValueAtTime(1, t0); master.connect(dest);

    var b = boom(ctx, master, t0, size, (seed * 2654435761) >>> 0, false, 0.5);

    // the CRACK: a very short bright noise burst (highpassed) at the very front
    var cr = ctx.createBufferSource();
    cr.buffer = noise(ctx, (seed * 40503 + 7) >>> 0, 0.12);
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.setValueAtTime(1400, t0);
    var cg = ctx.createGain();
    cg.gain.setValueAtTime(0.0001, t0);
    cg.gain.linearRampToValueAtTime(0.32, t0 + 0.003);      // snap
    cg.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.09);
    cr.connect(hp).connect(cg).connect(master);
    cr.start(t0); cr.stop(t0 + 0.13);

    return { stop: function (at) {
      var w = at != null ? at : ctx.currentTime;
      try { b.src.stop(w); } catch (e) {} try { b.sub.stop(w); } catch (e) {} try { cr.stop(w); } catch (e) {}
      try { master.gain.cancelScheduledValues(w); master.gain.setTargetAtTime(0, w, 0.03); } catch (e) {}
    } };
  };

  // the distant reflected boom — no crack, darker, softer (the water's echo)
  Powder.sfx.reflect = function (o) {
    o = o || {};
    var ctx = o.ctx, dest = o.dest, when = o.when != null ? o.when : 0;
    var seed = (o.seed | 0) || 1, size = o.size != null ? o.size : 4;
    var t0 = ctx.currentTime + when;
    var master = ctx.createGain(); master.gain.setValueAtTime(1, t0); master.connect(dest);
    var b = boom(ctx, master, t0, size, (seed * 1013904223 + 3) >>> 0, true, 0.24);
    return { stop: function (at) {
      var w = at != null ? at : ctx.currentTime;
      try { b.src.stop(w); } catch (e) {} try { b.sub.stop(w); } catch (e) {}
      try { master.gain.cancelScheduledValues(w); master.gain.setTargetAtTime(0, w, 0.03); } catch (e) {}
    } };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
