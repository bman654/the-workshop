'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["owl"] — "A Distant Owl At Night"
//
// The Gate's NIGHT voice (replacing daytime birdsong): a single distant owl
// hooting softly across the dark. Low, soft, breathy, unhurried — the warm
// "hoo" of a tawny / great-horned owl, NOT a high pigeon coo and NOT a sharp
// whistle. A short PHRASE of a few hoots separated by long quiet pauses:
//   one low hoot ... a pause ... then a closer pair "hoo-hoo".
//
// Each HOOT is built from three layers so it reads as a breathy owl, not a
// pure test tone:
//   (1) a soft sine CARRIER in the owl band (~300–450 Hz) that bends UP a touch
//       at the onset and DOWN on the tail (the classic rising-then-settling owl
//       inflection), with a slow gentle vibrato so the held tone breathes;
//   (2) a faint 2nd harmonic an octave up, much quieter, following the same
//       contour — gives the hoot a hollow woody body without raising the pitch
//       read (the fundamental clearly wins --pitch);
//   (3) a whisper of band-limited breath noise under the onset — the "h" of the
//       hoot — that fades quickly so it adds breathiness, not hiss, and never
//       lifts the silence ratio between phrases.
//
// Soft raised-cosine amplitude envelopes (sampled curves) give a gentle attack
// and a long soft decay (~0.4–0.8 s body) so there are no click transients.
// A master lowpass + low gain seats the owl as DISTANT and warm — energy stays
// low in the spectrum, so the spectrogram shows a few short LOW soft-edged
// horizontal tone blobs with quiet gaps between.
//
// Dual-use builder: schedules into 'dest' on ANY BaseAudioContext (live
// AudioContext when shipped, OfflineAudioContext when verified). Deterministic
// via a seeded mulberry32 PRNG — never Math.random. Peaks well under 0 dBFS.
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['owl'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Seeded PRNG (mulberry32) — deterministic renders, no Math.random ───────
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(lo, hi) { return lo + rnd() * (hi - lo); }

  // ── Master bus: a lowpass to keep the owl LOW and warm (scrub any high
  //    breathiness into the haze), a gentle highpass to drop sub-rumble, and a
  //    soft master gain so distance/level stay well under 0 dBFS. ─────────────
  var lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;        // soft, dull, distant — owls are low
  lp.Q.value = 0.4;

  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 150;         // trim sub-rumble below the hoot

  var master = ctx.createGain();
  master.gain.value = 0.34;         // distant + gentle

  lp.connect(hp).connect(master).connect(dest);

  // ── A reusable buffer of seeded white noise for the breath layer. The owl's
  //    "h" onset is a brief band-limited puff of air; we filter it low and fade
  //    it fast so it adds breathiness without hiss between hoots. ──────────────
  var noiseLen = Math.max(1, Math.ceil(ctx.sampleRate * Math.min(dur, 1.0)));
  var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  var nd = noiseBuf.getChannelData(0);
  for (var ni = 0; ni < noiseLen; ni++) { nd[ni] = rnd() * 2 - 1; }

  // ── One HOOT. A soft sine carrier in the owl band with a small up-then-down
  //    pitch bend and a slow vibrato, a faint octave harmonic for woody body,
  //    and a whisper of breath noise under the onset. Raised-cosine envelopes
  //    keep every edge click-free.
  //
  //    at:   start time
  //    f0:   fundamental (~300–450 Hz)
  //    len:  total hoot length (~0.4–0.8 s)
  //    vel:  master-relative loudness ─────────────────────────────────────────
  function hoot(at, f0, len, vel) {
    if (at >= t0 + dur) return;
    if (at + len > t0 + dur) len = (t0 + dur) - at - 0.005;
    if (len < 0.12) return;

    // ── Carrier with the owl inflection: rise a touch at the onset, settle and
    //    fall on the tail. Exponential ramps read as a natural breathy bend. ───
    var carrier = ctx.createOscillator();
    carrier.type = 'sine';
    var f = carrier.frequency;
    var fUp = f0 * 1.06;                 // small onset rise
    var fEnd = f0 * 0.93;                // gentle settle/fall on the tail
    f.setValueAtTime(f0, at);
    f.exponentialRampToValueAtTime(fUp, at + len * 0.22);
    f.exponentialRampToValueAtTime(f0, at + len * 0.55);
    f.exponentialRampToValueAtTime(fEnd, at + len);

    // ── Slow gentle vibrato so the held tone breathes (not a static sine). ────
    var vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = range(4.5, 6.5);   // slow, ~5 Hz tremble
    var vibGain = ctx.createGain();
    vibGain.gain.value = f0 * 0.012;         // shallow depth — subtle
    vib.connect(vibGain).connect(f);

    // ── Faint octave harmonic — hollow woody body, follows the same contour at
    //    ×2, sits well under the fundamental so --pitch reads the low f0. ──────
    var over = ctx.createOscillator();
    over.type = 'sine';
    var of = over.frequency;
    of.setValueAtTime(f0 * 2, at);
    of.exponentialRampToValueAtTime(fUp * 2, at + len * 0.22);
    of.exponentialRampToValueAtTime(f0 * 2, at + len * 0.55);
    of.exponentialRampToValueAtTime(fEnd * 2, at + len);
    var vibGain2 = ctx.createGain();
    vibGain2.gain.value = f0 * 0.012 * 2;
    vib.connect(vibGain2).connect(of);
    var overGain = ctx.createGain();
    overGain.gain.value = 0.16;              // quiet — body, not pitch

    // ── Amplitude envelope: soft raised-cosine attack (breathy, no click) and a
    //    long soft decay. Built as a sampled curve so it is exact at any len. ──
    var g = ctx.createGain();
    var N = 96;
    var env = new Float32Array(N);
    var atkFrac = 0.30;                      // soft, slow onset — not percussive
    for (var i = 0; i < N; i++) {
      var x = i / (N - 1);
      var a;
      if (x < atkFrac) {
        a = 0.5 - 0.5 * Math.cos(Math.PI * (x / atkFrac));        // 0→1 ease-in
      } else {
        var y = (x - atkFrac) / (1 - atkFrac);
        a = 0.5 + 0.5 * Math.cos(Math.PI * y);                    // 1→0 ease-out
      }
      env[i] = Math.max(0.0001, a * vel);
    }
    g.gain.setValueCurveAtTime(env, at, len);

    carrier.connect(g);
    over.connect(overGain).connect(g);
    g.connect(lp);

    // ── Breath layer: a brief band-limited puff under the onset (the "h"). A
    //    bandpass in the low-mid band, a fast attack/decay so it colours only
    //    the very start of the hoot, kept faint so it never reads as hiss. ─────
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var bf = ctx.createBiquadFilter();
    bf.type = 'bandpass';
    bf.frequency.value = f0 * 2.2;           // breathy air, just above the tone
    bf.Q.value = 0.8;
    var bg = ctx.createGain();
    var bN = 32;
    var bEnv = new Float32Array(bN);
    var bAtk = 0.25;
    var breathLen = Math.min(len * 0.45, 0.30);
    var breathPeak = vel * 0.10;             // whisper
    for (var bi = 0; bi < bN; bi++) {
      var bx = bi / (bN - 1);
      var ba;
      if (bx < bAtk) ba = 0.5 - 0.5 * Math.cos(Math.PI * (bx / bAtk));
      else { var by = (bx - bAtk) / (1 - bAtk); ba = 0.5 + 0.5 * Math.cos(Math.PI * by); }
      bEnv[bi] = Math.max(0.0001, ba * breathPeak);
    }
    bg.gain.setValueCurveAtTime(bEnv, at, breathLen);
    src.connect(bf).connect(bg).connect(lp);

    var tail = len + 0.03;
    carrier.start(at);   carrier.stop(at + tail);
    over.start(at);      over.stop(at + tail);
    vib.start(at);       vib.stop(at + tail);
    src.start(at);       src.stop(at + breathLen + 0.02);
  }

  // ── PHRASE: the owl's call rhythm — one low hoot, a long quiet pause, then a
  //    closer pair "hoo-hoo". A drifting base pitch in the owl band keeps each
  //    render natural while staying low. ─────────────────────────────────────
  var base = range(330, 430);              // owl fundamental, low + warm
  var cursor = t0 + range(0.30, 0.55);

  // First lone hoot.
  var h1len = range(0.55, 0.75);
  hoot(cursor, base, h1len, range(0.80, 0.95));
  cursor += h1len + range(1.0, 1.6);       // long quiet pause

  // The closer pair: "hoo-hoo" — two hoots near each other, the 2nd a touch
  // lower (a natural settling), with only a short gap between them.
  if (cursor < t0 + dur - 1.0) {
    var pBase = base * range(0.97, 1.03);
    var p1len = range(0.45, 0.60);
    hoot(cursor, pBase, p1len, range(0.78, 0.92));
    cursor += p1len + range(0.28, 0.42);   // short intra-pair gap
    var p2len = range(0.50, 0.68);
    hoot(cursor, pBase * range(0.92, 0.98), p2len, range(0.82, 0.95));
    cursor += p2len + range(1.0, 1.5);
  }

  // If the window still has generous room, add one more lone hoot to round out
  // the phrase rather than leaving a long dead tail.
  if (cursor < t0 + dur - 0.8) {
    var h3len = range(0.50, 0.70);
    hoot(cursor, base * range(0.96, 1.04), h3len, range(0.78, 0.90));
  }

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.08); } catch (e) {}
    }
  };
};
