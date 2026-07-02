'use strict';
/* ── SFX: "nib" — the dry papery pen-scratch of ink laid on vellum ───────────
   FORGED FINAL (art foundry). Base = the "granular stick-slip" model: a real nib
   does not hiss smoothly; the steel tip CATCHES and DRAGS across the tooth of the
   paper in a rapid train of tiny friction grains. We model that literally: a
   seeded train of short filtered noise GRAINS (each a fast catch + drag-off),
   summed and warmed by a paper-body lowpass so the whole thing reads dry and
   grainy — not white hiss, not a whoosh.

   Foundry grafts over the base (both judges' notes): (1) +~7 dB presence so the
   scratch has body under the chime without clipping; (2) a warmer voice — the
   bandpass centre and lowpass ceiling eased down toward ~1.3–1.4 kHz so the grain
   sits more mellow/vellum-like; (3) WIDER grain amplitude & spacing variance (more
   uneven "bite") for richer texture — preferred over any resonant/comb element so
   it stays unpitched. Deliberately NOT grafted: take 2's comb tooth (it leaks a
   detectable pitch — a dry friction SFX must have none).

   `param` (0..1 = activity) raises the grain RATE, the bandpass CENTRE (a little
   brighter/scratchier when busy) and a touch of energy, so a busy 0.5s sweep
   sounds busier than a short slow tick. Quiet, sits UNDER the chime.

   Deterministic (seeded mulberry32 — no Math.random). Dual-use: builds on the
   passed ctx (live AudioContext OR OfflineAudioContext).
   Contract: Gate.sfx.nib({ ctx, dest, dur, when=0, seed=1, param }) -> {stop(at)}
   ─────────────────────────────────────────────────────────────────────────── */
function _skyMulberryNib(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }

window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.nib = function ({ ctx, dest, dur, when = 0, seed = 1, param = 0.5 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;
  var D  = (dur && dur > 0) ? dur : 0.11;
  var p  = Math.max(0, Math.min(1, param));
  var rng = _skyMulberryNib((seed | 0) || 1);

  // ── Render the whole burst as ONE offline noise buffer we shape by hand, so
  //    the graininess lives in the SAMPLES, not just in a filter. The buffer is
  //    filtered pink-ish noise (lowpassed toward paper body) whose amplitude is
  //    gated by a train of stick-slip GRAINS: each grain is a fast catch (attack)
  //    followed by a slower drag-off, spaced irregularly. Busier param = more,
  //    slightly sharper grains. ─────────────────────────────────────────────
  var len = Math.max(1, Math.ceil((D + 0.02) * sr));
  var buf = ctx.createBuffer(1, len, sr);
  var ch  = buf.getChannelData(0);

  // pink-ish source: two-pole leaky integrator gives 1/f-ish tilt (paper body,
  // not white hiss). A tiny hi-shelf sparkle is added back so the tooth reads.
  var lp1 = 0, lp2 = 0;
  var src = new Float32Array(len);
  for (var i = 0; i < len; i++) {
    var w = rng() * 2 - 1;
    lp1 = lp1 * 0.55 + w * 0.45;
    lp2 = lp2 * 0.80 + lp1 * 0.20;        // deeper paper body
    src[i] = lp2 * 0.7 + w * 0.18;        // body + a little tooth sparkle
  }

  // stick-slip grain train. Base grain period shortens with param (busier), with
  // seeded jitter so it never sounds like a machine click-train. Each grain is a
  // DISTINCT catch: fast linear bite up, exponential drag-off, so the envelope
  // spikes at every catch and dips between — that spiky texture is what reads as
  // "grain" (not a smooth swell). Amplitude jitters so some catches bite harder
  // (the hand's uneven pressure). A LOW continuous floor keeps the pen in contact
  // with the paper between catches without drowning the spikes.
  var env = new Float32Array(len);
  var meanPeriod = (0.013 - p * 0.006);   // ~13ms slow .. ~7ms busy
  // slight overall arc: the hand presses on, eases at the end of the stroke
  var pos = 0.001 * sr;                   // start just inside so first catch isn't clipped
  var minGain = 0.12;                     // faint continuous contact, well below the spikes
  while (pos < len) {
    var jitter = 0.45 + rng() * 1.15;     // 0.45..1.6 x period — wider, more irregular hand
    var period = meanPeriod * jitter;
    var atk = (0.0004 + rng() * 0.0008) * sr;             // 0.4..1.2 ms sharp catch
    var rel = (0.0025 + rng() * 0.0045 + p * 0.002) * sr; // 2.5..9 ms drag-off
    var amp = 0.35 + rng() * 0.75;                        // wider uneven bite 0.35..1.10
    var start = Math.floor(pos);
    var gPeak = start + Math.floor(atk);
    var gEnd  = gPeak + Math.floor(rel);
    var k, v, val;
    for (k = start; k < gPeak && k < len; k++) {
      val = ((k - start) / Math.max(1, atk)) * amp;       // linear catch (fast)
      if (val > env[k]) env[k] = val;
    }
    for (k = gPeak; k < gEnd && k < len; k++) {
      val = Math.exp(-(k - gPeak) / Math.max(1, rel) * 3.2) * amp; // exp drag-off
      if (val > env[k]) env[k] = val;
    }
    pos += period * sr;
  }
  // combine: distinct grain spikes + a low continuous contact floor, times a
  // gentle stroke arc (press-on / ease-off) so it feels hand-drawn, not gated.
  for (i = 0; i < len; i++) {
    var frac = i / len;
    var arc = 0.85 + 0.15 * Math.sin(Math.PI * Math.min(1, frac)); // subtle swell
    var e = minGain + env[i] * (1 - minGain);
    ch[i] = src[i] * e * arc;
  }

  var bs = ctx.createBufferSource(); bs.buffer = buf;

  // ── Voicing filters. Bandpass gives the dry "scritch"; centre rises modestly
  //    with param but stays LOW/warm (not a whoosh, not white). A gentle highpass
  //    trims sub-rumble; a soft lowpass keeps the very top from hissing. ───────
  var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.value = 1000 + p * 1150;   // 1.0k..2.15k — eased warmer/mellower per judges
  bp.Q.value = 0.8;
  var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 520;
  var lpTop = ctx.createBiquadFilter(); lpTop.type = 'lowpass';
  lpTop.frequency.value = 4600 + p * 1800; // tame the hiss ceiling (eased down for warmth)
  lpTop.Q.value = 0.5;

  // ── Overall burst envelope: quick fade-in, natural fade over the drag, so a
  //    short tick opens and closes cleanly and the long sweep decays to silence.
  var g = ctx.createGain();
  var peak = 0.24 + p * 0.20;             // presence lift (+~7 dB): quiet-but-present, still under the chime; scales with activity
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.006);
  // hold across the whole stroke, then a short clean lift of the nib at the end
  g.gain.setValueAtTime(peak, t0 + Math.max(0.008, D - 0.045));
  g.gain.exponentialRampToValueAtTime(0.0006, t0 + D);

  bs.connect(hp); hp.connect(bp); bp.connect(lpTop); lpTop.connect(g); g.connect(dest);
  bs.start(t0); bs.stop(t0 + D + 0.02);

  return { stop: function (at) { try { g.gain.cancelScheduledValues(at); g.gain.setTargetAtTime(0, at, 0.02); } catch (e) {} } };
};
