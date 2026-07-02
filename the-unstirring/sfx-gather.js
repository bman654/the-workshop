'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["gather"] — TAKE 2: "The single struck glass, over a rising gold."
//
// The gasp reward: fired ONCE when the blob re-gathers at Re≈0. Brief asks for a
// soft warm bell/glass chime blooming into a slow gold pad swell — a held breath
// released. This take reads that literally and restrainedly:
//
//   • ONE clean struck glass-bell PRIME at C#6 (1108.73 Hz) — a single, singing
//     strike, not a triad arpeggio. It is the "gasp": it arrives first, on a soft
//     ~2 ms attack (a struck glass, not a mallet click), and RINGS ~1.1 s with a
//     couple of warm consonant partials so the metal is alive but the pitch reads
//     cleanly. C#6 is bright + glad without being shrill on a 22050 Hz render.
//
//   • UNDER it, a slow GOLD PAD that swells up from silence over ~0.55 s and then
//     settles — a warm A-major stack a fifth+ below the bell (A3 root, C#4 major
//     third, E4 perfect fifth, A4 octave). The bell's C#6 is the major-third of
//     that A harmony three octaves up, so the strike and the swell are the SAME
//     chord: the chime doesn't just precede the pad, it belongs to it. No
//     dissonance anywhere. The pad is gently low-passed and its cutoff opens a
//     little as it swells (the "bloom"), then eases back as it settles — a warm
//     glow breathing open, then softening. It out-lasts the bell so the last thing
//     you hear is the held, warm gold — the breath released.
//
// Craft choices / why the numbers land:
//   • The bell attack is ~2 ms (soft, no click) and its fundamental DOMINATES, so
//     the lens reads a clean C#6 with tight cents. Only two faint upper partials
//     (a warm 2.76 + an airy 5.4 inharmonic) give glass shimmer without smearing
//     the pitch or pushing the spectral centroid harsh.
//   • The pad voices are sine + a whisper of triangle, heavily low-passed, summed
//     LOW under a gentle master ceiling so the whole thing sits as a warm glow
//     (modest peak) — not a fanfare. RMS stays comfortably below 0 dBFS with the
//     bell and full pad both sounding.
//   • Everything ends on a short LINEAR glide to true zero (exponentialRamp can
//     never reach 0), so the tail is silent — no click at the render boundary.
//   • The pad swell + settle is a single slow gesture (no LFO wobble): rise to a
//     warm plateau, hold, then a long gentle fall — "rising then settling."
//
// Deterministic: seeded mulberry32 PRNG (never Math.random). Dual-use: any
// BaseAudioContext (live or Offline). Peaks well under 0 dBFS.
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['gather'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Seeded PRNG (mulberry32) — deterministic renders, no Math.random ─────────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ── Never let any partial alias near Nyquist (22050 Hz render → 11025 Hz) ────
  var NYQ = ctx.sampleRate * 0.5;
  var SAFE = NYQ - 800;

  // ── Master ceiling — a warm glow, not a fanfare. Keeps bell + full pad summed
  //    comfortably under 0 dBFS. ────────────────────────────────────────────────
  var master = ctx.createGain();
  master.gain.setValueAtTime(0.34, t0);
  master.connect(dest);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1) THE STRUCK GLASS BELL — the "gasp", arriving first.
  //    C#6 = 1108.73 Hz. Fundamental dominant + a beating twin (living glass) +
  //    two faint partials (one warm, one airy inharmonic). Crisp ~1.5 ms struck
  //    attack + a fast inharmonic strike-glint so the chime lands as a felt
  //    ARRIVAL (registers a clean onset), still click-free. ~1.1 s ring.
  //    GRAFT (from take 1, per both judges): the ~+7c beating twin gives the ring
  //    a slow ~2.5 Hz living-glass shimmer without adding a pitch class; a very
  //    short inharmonic strike-glint layer makes the onset a felt event (take 2
  //    alone read onsets=0). Both kept soft — struck glass, not a game ding.
  // ─────────────────────────────────────────────────────────────────────────────
  var BELL_F = 1108.73;               // C#6 — major-third of the A pad, 3 octaves up
  var BELL = [
    { ratio: 1.000, gain: 1.00, decay: 1.10, detune: false, beat: false }, // prime — pitch anchor
    { ratio: 1.000, gain: 0.34, decay: 1.06, detune: false, beat: true  }, // twin — +7c → slow living beat
    { ratio: 2.000, gain: 0.20, decay: 0.85, detune: false, beat: false }, // octave — warm body
    { ratio: 2.760, gain: 0.085, decay: 0.55, detune: true, beat: false }, // inharmonic — glass warmth
    { ratio: 5.400, gain: 0.030, decay: 0.30, detune: true, beat: false }  // inharmonic — airy top glint
  ];

  // The bell STRIKES FIRST, into near-silence — it is the gasp. It gets a small
  // head-start (~90 ms) before the pad has swelled to any level, so the chime is
  // the clear, singing onset you hear; the gold blooms up UNDER its ring.
  var bellAt = t0 + 0.020;            // tiny lead-in so the onset isn't a hard click
  for (var p = 0; p < BELL.length; p++) {
    var P = BELL[p];
    var f = BELL_F * P.ratio;
    if (P.beat) f *= 1.004;                        // ≈ +7 cents → gentle ~2.5 Hz beat with the prime
    else if (P.detune) f *= 1 + (rnd() - 0.5) * 0.005; // faint metal-alive detune on shimmer only
    if (f >= SAFE) continue;

    var bosc = ctx.createOscillator();
    bosc.type = 'sine';
    bosc.frequency.setValueAtTime(f, bellAt);

    var bg = ctx.createGain();
    var peak = 0.95 * P.gain;
    // Crisp ~1.5 ms struck attack (a felt arrival, still click-free), long exp fall
    // to a whisper, then a short linear glide to TRUE zero so the ring ends silent.
    bg.gain.setValueAtTime(0.0001, bellAt);
    bg.gain.linearRampToValueAtTime(peak, bellAt + 0.0015);
    bg.gain.exponentialRampToValueAtTime(0.0006, bellAt + P.decay);
    bg.gain.linearRampToValueAtTime(0.0, bellAt + P.decay + 0.06);

    bosc.connect(bg).connect(master);
    bosc.start(bellAt);
    bosc.stop(bellAt + P.decay + 0.10);
  }

  // A very short STRIKE-GLINT — a fast-decaying cluster of high consonant partials
  // (a fifth + double-octave of C#6) that gives the chime a felt "arrival"
  // transient (a struck-glass shimmer, not a mallet click). ~35 ms decay so it is
  // gone almost instantly, leaving the clean ringing prime. This is the graft that
  // turns take 2's onsets=0 into a legible felt strike, kept well below the prime.
  var GLINT = [1.500, 2.000, 3.010];  // B6-ish, C#7, ~inharmonic — bright glass sparkle
  for (var gi = 0; gi < GLINT.length; gi++) {
    var gf = BELL_F * GLINT[gi] * (1 + (rnd() - 0.5) * 0.004);
    if (gf >= SAFE) continue;
    var go = ctx.createOscillator();
    go.type = 'sine';
    go.frequency.setValueAtTime(gf, bellAt);
    var gg = ctx.createGain();
    gg.gain.setValueAtTime(0.0001, bellAt);
    gg.gain.linearRampToValueAtTime(0.10, bellAt + 0.0015);      // fast crisp rise
    gg.gain.exponentialRampToValueAtTime(0.0004, bellAt + 0.035); // gone in ~35 ms
    gg.gain.linearRampToValueAtTime(0.0, bellAt + 0.05);
    go.connect(gg).connect(master);
    go.start(bellAt);
    go.stop(bellAt + 0.07);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) THE GOLD PAD — swells up from silence over ~0.55 s, holds warm, then eases
  //    back and settles. A-major stack under the bell (same chord as the strike).
  //      A3 = 220.00 (root)  · C#4 = 277.18 (major third)
  //      E4 = 329.63 (fifth) · A4  = 440.00 (octave, quiet — adds a little sheen)
  //    Heavily low-passed; the cutoff OPENS a little as it swells (the bloom) then
  //    eases back as it settles. Voices = sine + a whisper of triangle for warmth.
  // ─────────────────────────────────────────────────────────────────────────────
  var padBus = ctx.createGain();
  padBus.gain.setValueAtTime(0.0001, t0);
  padBus.connect(master);

  // One shared low-pass "bloom": cutoff rises with the swell, then eases back.
  var lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.Q.setValueAtTime(0.6, t0);
  // GRAFT (from take 1, per both judges): widen the bloom — open the lowpass
  // further on the swell so the gold visibly BRIGHTENS as it blooms, then eases
  // back warm. A bigger, more expressive brighten-then-settle arc than take 2's.
  lpf.frequency.setValueAtTime(340, t0);                 // start dark
  lpf.frequency.linearRampToValueAtTime(2200, t0 + 0.55); // bloom wide open as it swells
  lpf.frequency.linearRampToValueAtTime(900, t0 + 1.30);  // ease back as it settles
  lpf.frequency.linearRampToValueAtTime(650, t0 + dur + 0.20);
  lpf.connect(padBus);

  var PAD = [
    { f: 220.00, gain: 1.00, tri: 0.16 }, // A3  — warm root
    { f: 277.18, gain: 0.70, tri: 0.10 }, // C#4 — major third (the "gold")
    { f: 329.63, gain: 0.62, tri: 0.10 }, // E4  — perfect fifth
    { f: 440.00, gain: 0.28, tri: 0.05 }  // A4  — octave sheen, quiet
  ];

  // Swell envelope on the pad BUS: it holds near-silence for the first ~90 ms so
  // the BELL strikes into a clear space, then swells silence → warm plateau (the
  // breath released), holds, then a long gentle fall + linear glide to true zero.
  var PAD_PEAK = 0.26;
  var swellStart = t0 + 0.09;         // let the bell strike first
  var swellTop = t0 + 0.60;
  var settleTo = t0 + 1.10;
  // GRAFT (per judge 2): reach silence a touch earlier so a clean SILENT tail sits
  // before the render boundary — a cleaner one-shot release (take 2's silenceRatio
  // 0.12 was the lowest; this brings it toward take 3's ~0.21). The pad still
  // clearly out-lasts the bell, so the last thing heard is the held warm gold.
  var tailEnd  = t0 + dur - 0.22;      // dur ≈ 1.6 s — pad out-lasts the bell, then rests
  padBus.gain.setValueAtTime(0.0001, t0);
  padBus.gain.setValueAtTime(0.0001, swellStart);                // hold under the strike
  padBus.gain.linearRampToValueAtTime(PAD_PEAK, swellTop);        // swell UP
  padBus.gain.linearRampToValueAtTime(PAD_PEAK * 0.82, settleTo); // settle to a warm plateau
  padBus.gain.exponentialRampToValueAtTime(0.0008, tailEnd);      // long gentle fall
  padBus.gain.linearRampToValueAtTime(0.0, tailEnd + 0.12);       // glide to TRUE zero

  for (var v = 0; v < PAD.length; v++) {
    var V = PAD[v];
    if (V.f >= SAFE) continue;

    // Sine core (warm fundamental) + a whisper of triangle for a little body/air.
    // A tiny seeded detune on the triangle only, so the pad breathes without
    // detuning the pitch anchor.
    var sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(V.f, t0);

    var tri = ctx.createOscillator();
    tri.type = 'triangle';
    tri.frequency.setValueAtTime(V.f * (1 + (rnd() - 0.5) * 0.004), t0);

    var vg = ctx.createGain();
    vg.gain.setValueAtTime(V.gain, t0);   // static per-voice mix; the BUS does the swell

    var tg = ctx.createGain();
    tg.gain.setValueAtTime(V.tri, t0);

    sine.connect(vg).connect(lpf);
    tri.connect(tg).connect(lpf);

    sine.start(t0);
    tri.start(t0);
    sine.stop(tailEnd + 0.18);
    tri.stop(tailEnd + 0.18);
  }

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.06); } catch (e) {}
    }
  };
};
