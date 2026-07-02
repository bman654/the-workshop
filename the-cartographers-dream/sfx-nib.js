'use strict';
/* ── Gate SFX: "nib" — the pen-scratch of ink being laid on vellum ──────────
   A short, dry, papery scratch grain played in overlapping bursts WHILE the
   lantern lights new cells. It is filtered noise (no tone, no click train) with
   a fast papery envelope; `param` (0..1 = how much new ground is being revealed)
   raises the brightness and rate a touch so a fast sweep sounds busier than a
   slow one, and it falls silent at rest.

   Deterministic (seeded), builds on the passed ctx (live OR OfflineAudioContext).
   Contract: Gate.sfx.nib({ ctx, dest, dur, when=0, seed=1, param }) -> {stop(at)}
   ─────────────────────────────────────────────────────────────────────────── */
function _dreamMulberry(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }

window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.nib = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0.5 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;
  var D = (dur && dur > 0) ? dur : 0.11;
  var p = Math.max(0, Math.min(1, param));
  var rng = _dreamMulberry((seed|0) || 1);

  // a short buffer of pink-ish noise (papery, not white/hissy)
  var len = Math.ceil(D * sr);
  var buf = ctx.createBuffer(1, len, sr);
  var ch = buf.getChannelData(0);
  var last = 0;
  for (var i = 0; i < len; i++) {
    var n = rng() * 2 - 1;
    last = last * 0.72 + n * 0.28;   // lowpass toward paper
    // grain sub-envelope: a few tiny scratches within the burst
    ch[i] = last;
  }
  var src = ctx.createBufferSource(); src.buffer = buf;

  // bandpass gives the dry "scritch"; center rises with param
  var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.value = 1400 + p * 2600;   // 1.4k..4k
  bp.Q.value = 0.7;
  var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;

  var g = ctx.createGain();
  var peak = 0.05 + p * 0.09;              // quiet; scales with activity
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + D);

  src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(dest);
  src.start(t0); src.stop(t0 + D + 0.02);
  return { stop: function (at) { try { g.gain.cancelScheduledValues(at); g.gain.setTargetAtTime(0, at, 0.02); } catch (e) {} } };
};
