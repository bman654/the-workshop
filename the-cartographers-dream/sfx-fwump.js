'use strict';
/* ── Gate SFX: "fwump" — a fresh sheet of vellum settling onto the table ────
   A soft low paper-thump with a brief airy flutter, played once when a new
   sheet is unrolled (reseal). Body = a fast-decaying low-noise thud; the airy
   flutter = a short high-passed noise swell. No tone, no click.
   Contract: Gate.sfx.fwump({ ctx, dest, dur, when=0, seed=1 }) -> {stop(at)}
   ─────────────────────────────────────────────────────────────────────────── */
function _dreamMulberryF(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }

window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.fwump = function ({ ctx, dest, dur, when = 0, seed = 7 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;
  var D = (dur && dur > 0) ? dur : 0.5;
  var rng = _dreamMulberryF((seed|0) || 7);

  var len = Math.ceil(D * sr);
  var buf = ctx.createBuffer(1, len, sr);
  var ch = buf.getChannelData(0);
  var last = 0;
  for (var i = 0; i < len; i++) { var n = rng()*2-1; last = last*0.5 + n*0.5; ch[i] = last; }
  var src = ctx.createBufferSource(); src.buffer = buf;

  // LOW body — the settle thud
  var lp = ctx.createBiquadFilter(); lp.type='lowpass';
  lp.frequency.setValueAtTime(520, t0);
  lp.frequency.exponentialRampToValueAtTime(120, t0 + 0.28);
  var gBody = ctx.createGain();
  gBody.gain.setValueAtTime(0, t0);
  gBody.gain.linearRampToValueAtTime(0.32, t0 + 0.012);
  gBody.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.34);

  // AIRY flutter — the paper edge riffling
  var hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=2200;
  var gAir = ctx.createGain();
  gAir.gain.setValueAtTime(0, t0);
  gAir.gain.linearRampToValueAtTime(0.06, t0 + 0.03);
  gAir.gain.exponentialRampToValueAtTime(0.0006, t0 + D);

  var src2 = ctx.createBufferSource(); src2.buffer = buf;

  src.connect(lp); lp.connect(gBody); gBody.connect(dest);
  src2.connect(hp); hp.connect(gAir); gAir.connect(dest);
  src.start(t0); src.stop(t0 + D + 0.02);
  src2.start(t0); src2.stop(t0 + D + 0.02);
  return { stop:function(at){ try{ gBody.gain.setTargetAtTime(0,at,0.02); gAir.gain.setTargetAtTime(0,at,0.02);}catch(e){} } };
};
