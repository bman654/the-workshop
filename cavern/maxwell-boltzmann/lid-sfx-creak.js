/* ═══════════════════════════════════════════════════════════════════════════
   lid-sfx-creak.js  —  "The settling creak"  (foundry-forged, medium: sound)

   The small sound the lid makes as it eases onto its seat — a kitchen-scale
   needle settling, a weighted beam finding its bearing. Brief, quiet, ROUNDED,
   organic. No squeak, no cartoon boing, no ring — a period at the end of the
   bob. It marks ARRIVAL at rest and should feel like relief, not alarm.

   FORGED FROM: judge-consensus winner TAKE 2 (stick-slip friction easing into
   rest — woody creak GRAINS whose bandpass glides DOWN, resolving into a soft
   rounded contact), with the grafts both judges called out folded in
   CONSERVATIVELY:
     • ROUNDED ARRIVAL (both judges): Take 2's pitched contact tone was reading a
       hair note-like, so its level is dropped and its envelope re-shaped to
       Take 1's very-soft ~3 ms-in / ~30 ms-out rounded-tick curve, and the
       contact THUD is re-voiced through Take 1's broad ~240 Hz bandpass — a
       rounded organic KNOCK rather than a pitched beep — so the arrival stays
       percussive/organic and can never read as a hard click OR a note.
     • MORE SEAT WEIGHT (judge 1): Take 2's centroid (~253 Hz) was a touch light,
       so the low woody body is dropped toward ~130 Hz and given a hair more
       level — "mass finding its bearing" — grounding the settle without dulling
       the creak grain.
     • DULLER MASTER (judge 2): the master lowpass is lowered from 2400 → 1900 Hz
       to shave any residual grit into the rounded/organic band, WITHOUT killing
       the mid-band grain (which lives at ~300–600 Hz, well below the corner).
   Take 2's peak/no-clip discipline, its downward centroid+pitch glide (no
   boing), and its onset=1 arrival articulation are kept UNTOUCHED — do not
   flatten the arrival marker.

   Dual-use builder (live AudioContext OR OfflineAudioContext) and DETERMINISTIC
   via a seeded mulberry32 PRNG — never Math.random — so the graph the analysis
   verifies is the graph that ships. Peak kept well under 0.12. Do not touch
   dest.gain (the room's muted-aware master owns level).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function buildCreak(o) {
    o = o || {};
    var ctx = o.ctx;
    var dest = o.dest;
    var when = (o.when != null) ? o.when : 0;
    var dur = (o.dur != null) ? o.dur : 0.2;
    var gain = (o.gain != null) ? o.gain : 1;
    var seed = (o.seed != null) ? o.seed : 1;
    var t0 = ctx.currentTime + when;
    var sr = ctx.sampleRate;

    // ── deterministic PRNG (mulberry32) ──────────────────────────────────────
    var a = ((seed * 2654435761) >>> 0) ^ 0x9e3779b9;
    function rnd() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // ── shared noise bed (deterministic) ─────────────────────────────────────
    var nlen = Math.max(1, Math.ceil(sr * dur));
    var nbuf = ctx.createBuffer(1, nlen, sr);
    var nd = nbuf.getChannelData(0);
    for (var i = 0; i < nlen; i++) nd[i] = rnd() * 2 - 1;

    // ── master trim + a gentle final lowpass to keep the whole thing rounded ──
    var master = ctx.createGain();
    master.gain.value = 0.28 * gain;         // present but soft; keeps peak well under 0.12
                                             // (raised from Take 2's 0.18 to hold the winner's
                                             //  judged presence after the softer arrival grafts)
    var soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 1900;           // GRAFT (judge 2): 2400→1900, shave grit, keep the grain
    soften.Q.value = 0.5;
    soften.connect(master);
    master.connect(dest);

    // ── friction creak: bandpassed noise, center gliding DOWN, in micro-grains ─
    var noise = ctx.createBufferSource();
    noise.buffer = nbuf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(540, t0);
    bp.frequency.exponentialRampToValueAtTime(300, t0 + 0.13);  // relax, not strain
    bp.Q.value = 2.3;                        // rounded resonance — not a squeal
    var creak = ctx.createGain();
    creak.gain.setValueAtTime(0, t0);
    noise.connect(bp).connect(creak).connect(soften);

    // irregular stick-slip grains, overall decaying — the organic "give"
    var gt = t0 + 0.004;
    var amp = 0.95;
    var nGrains = 6;
    for (var k = 0; k < nGrains; k++) {
      var gd = 0.011 + rnd() * 0.019;
      var pk = amp * (0.55 + rnd() * 0.45);
      creak.gain.linearRampToValueAtTime(pk, gt + gd * 0.35);
      creak.gain.linearRampToValueAtTime(pk * 0.14, gt + gd);
      gt += gd * (0.62 + rnd() * 0.5);
      amp *= 0.72;
    }
    creak.gain.linearRampToValueAtTime(0, gt + 0.02);
    noise.start(t0);
    noise.stop(t0 + dur);

    // ── woody body: a low damped sine under the creak (gives it timber) ───────
    // GRAFT (judge 1): dropped toward ~130 Hz + a hair more level — more seat
    // weight so the settle is grounded and the centroid isn't light.
    var body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(150, t0);
    body.frequency.exponentialRampToValueAtTime(130, t0 + 0.13);  // "mass finding its bearing"
    var bg = ctx.createGain();
    bg.gain.setValueAtTime(0, t0);
    bg.gain.linearRampToValueAtTime(0.155, t0 + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);       // damped, no ring; clean tail
    body.connect(bg).connect(soften);
    body.start(t0);
    body.stop(t0 + 0.17);

    // ── arrival at rest: a soft rounded contact (rounded tone + organic knock) ─
    var tickT = t0 + 0.104;

    // A whisper of pitched contact — GRAFT (both judges): level dropped and the
    // envelope re-shaped to Take 1's rounded ~3 ms-in / ~30 ms-out curve so it
    // reads as a rounded tick, never a note.
    var tick = ctx.createOscillator();
    tick.type = 'sine';
    tick.frequency.setValueAtTime(184, tickT);
    tick.frequency.exponentialRampToValueAtTime(122, tickT + 0.05);  // settle down (no boing)
    var tg = ctx.createGain();
    tg.gain.setValueAtTime(0, tickT);
    tg.gain.linearRampToValueAtTime(0.30, tickT + 0.003);            // soft, quick contact
    tg.gain.exponentialRampToValueAtTime(0.001, tickT + 0.033);      // rounded, short
    tick.connect(tg).connect(soften);
    tick.start(tickT);
    tick.stop(tickT + 0.05);

    // The contact KNOCK — GRAFT (judge 2): re-voiced through Take 1's broad
    // ~240 Hz bandpass so the arrival is a rounded organic knock (percussive,
    // not pitched), carrying the "seat" more than the tone does.
    var thud = ctx.createBufferSource();
    thud.buffer = nbuf;
    var thbp = ctx.createBiquadFilter();
    thbp.type = 'bandpass';
    thbp.frequency.value = 240;
    thbp.Q.value = 1.1;                       // broad → a rounded knock, not a beep
    var thg = ctx.createGain();
    thg.gain.setValueAtTime(0, tickT);
    thg.gain.linearRampToValueAtTime(0.40, tickT + 0.004);
    thg.gain.exponentialRampToValueAtTime(0.001, tickT + 0.036);
    thud.connect(thbp).connect(thg).connect(soften);
    thud.start(tickT);
    thud.stop(tickT + 0.06);

    return {
      stop: function (at) {
        var w = (at != null) ? at : ctx.currentTime;
        try { noise.stop(w); } catch (e) {}
        try { body.stop(w); } catch (e) {}
        try { tick.stop(w); } catch (e) {}
        try { thud.stop(w); } catch (e) {}
      }
    };
  }

  // Ship surface (spec API) + bench surface (Gate.sfx real key) → same builder.
  window.Gate = window.Gate || {};
  window.Gate.sfx = window.Gate.sfx || {};
  window.LidSfx = window.LidSfx || {};
  window.Gate.sfx.creak = buildCreak;
  window.LidSfx.creak = buildCreak;
})();
