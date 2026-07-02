'use strict';
/* ── Gate SFX: "ting" — a small brass compass chime on bearing-lock ─────────
   A gentle struck-brass note (a soft bell) played once when the compass needle
   swings to true north and settles as you pause. Two detuned partials + a fast
   pluck envelope; warm, not glassy. No noise, no click.
   Contract: Gate.sfx.ting({ ctx, dest, dur, when=0, seed=3 }) -> {stop(at)}
   ─────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.ting = function ({ ctx, dest, dur, when = 0 }) {
  var t0 = ctx.currentTime + when;
  var D = (dur && dur > 0) ? dur : 0.7;

  var master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(dest);

  // a small warm brass chord: fundamental + a bright-ish partial, slightly detuned
  var partials = [
    { f: 784, g: 1.0,  dec: D },       // G5
    { f: 1174, g: 0.5, dec: D*0.7 },   // ~D6 partial
    { f: 1568, g: 0.22, dec: D*0.5 }   // octave shimmer
  ];
  for (var k = 0; k < partials.length; k++) {
    var prt = partials[k];
    var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = prt.f;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(prt.g, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0006, t0 + prt.dec);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + prt.dec + 0.05);
  }
  return { stop:function(at){ try{ master.gain.setTargetAtTime(0,at,0.03);}catch(e){} } };
};
