'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Gate.sfx["birdsong"] — "A Single Fluty Songbird" (FINAL)
//
// The Gate's calm-clear-day birdsong: ONE warm, forward songbird (robin /
// blackbird-like) singing short melodic phrases, with a hint of one or two very
// faint distant voices behind it for air and depth. NOT a dawn-chorus crowd, NOT
// a percussive trill, NOT a grating beep.
//
// Each SYLLABLE is a smooth sine carrier that GLIDES in pitch (rising whistle,
// falling slur, arched warble, or dip) through the 2–6 kHz fluty band. Sweetness
// comes from three layers per syllable:
//   (1) the gliding sine carrier,
//   (2) a faint octave overtone (the "throat" formant) that follows the same
//       contour for warmth/body,
//   (3) a fast small-depth sinusoidal vibrato/warble FM so the tone SINGS.
// Syllables are grouped 3–5 per PHRASE around a drifting tonal center, with
// quick intra-phrase gaps; phrases are separated by long breathing pauses so it
// reads as one bird on a calm clear day (moderate silence ratio).
//
// CLEAN-ATTACK GRAFT (from candidate C2): every voice runs through its OWN fast
// bandpass that TRACKS the pitch glide (a formant riding the glissando). This
// scrubs the broadband onset transient — the chiff that could read as a click —
// so even short syllables open cleanly. Signal path per voice is a single
// consolidated chain: carrier + octave overtone -> body gain (raised-cosine env)
// -> sweep-tracking bandpass -> master bus. No parallel un-filtered path exists,
// so there is nothing to leak a click.
//
// DEPTH GRAFT (from candidate C3, applied only after the clean-attack path):
// 1–2 very faint, more distant background voices on their own phrase clock add
// genuine ambience without crowding the soloist or reintroducing onsets.
//
// Dual-use builder: schedules into 'dest' on ANY BaseAudioContext (live
// AudioContext when shipped, OfflineAudioContext when verified). Deterministic
// via a small seeded PRNG (mulberry32) — never Math.random. Peaks well under
// 0 dBFS, bandpass-shaped into the bird range.
// ─────────────────────────────────────────────────────────────────────────────
window.Gate = window.Gate || {};
Gate.sfx = Gate.sfx || {};

Gate.sfx['birdsong'] = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
  var t0 = ctx.currentTime + when;

  // ── Small seeded PRNG (mulberry32) — deterministic renders, no Math.random ──
  var s = (seed >>> 0) || 1;
  function rnd() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(lo, hi) { return lo + rnd() * (hi - lo); }

  // ── Master bus: a wide-ish bandpass to seat the bird in its fluty range, then
  //    a gentle gain so nothing ever stacks toward 0 dBFS. The carrier pitches
  //    already live in 2–6 kHz; the filter just trims sub-rumble and any harsh
  //    top so the timbre reads sweet, not shrill. ────────────────────────────
  var bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3600;
  bp.Q.value = 0.6;                 // broad — shapes tone without choking glides

  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1400;        // clear out any low-end thud

  var master = ctx.createGain();
  master.gain.value = 0.42;

  bp.connect(hp).connect(master).connect(dest);

  // ── One SYLLABLE: a sine carrier that glides between f0 and f1 over its length,
  //    with a faint octave overtone for body and a small vibrato for the fluty
  //    "warble". Raised-cosine amplitude envelope (sample-accurate via setValue-
  //    CurveAtTime) so there are no click transients.
  //
  //    CLEAN-ATTACK GRAFT (C2): the carrier+overtone sum is routed through a
  //    per-voice bandpass whose centre frequency TRACKS the same pitch contour
  //    (with the same ramps). This formant-on-the-glide scrubs the broadband
  //    onset transient so even the shortest, quietest syllables open click-free.
  //
  // shape: 'rise' | 'fall' | 'arch' | 'dip' — the pitch contour of the syllable.
  // amp:   master-relative loudness multiplier (1.0 soloist, <1 for distant bg).
  // trackQ: bandpass Q for the tracking formant (higher = tighter/cleaner attack)
  function syllable(at, f0, f1, len, vel, shape, amp, trackQ) {
    if (amp == null) amp = 1.0;
    if (trackQ == null) trackQ = 3.2;
    if (at >= t0 + dur) return;
    // Don't let a syllable spill past the render window.
    if (at + len > t0 + dur) len = (t0 + dur) - at - 0.005;
    if (len < 0.03) return;

    var carrier = ctx.createOscillator();
    carrier.type = 'sine';

    // ── Pitch contour — applied to BOTH the carrier and (mirrored) the tracking
    //    bandpass, so the formant rides exactly on the glide. ──────────────────
    var f = carrier.frequency;
    var mid = Math.max(f0, f1) * 1.06;     // arch/dip apex a little above the ends

    // The sweep-tracking per-voice bandpass (C2 graft). Its centre follows the
    // carrier contour; a moderately tight Q gives a vocal formant and removes the
    // attack chiff without choking the glide.
    var track = ctx.createBiquadFilter();
    track.type = 'bandpass';
    track.Q.setValueAtTime(trackQ, at);
    var tf = track.frequency;

    f.setValueAtTime(f0, at);
    tf.setValueAtTime(f0, at);
    if (shape === 'rise' || shape === 'fall') {
      // a smooth single glide — exponential reads as a natural whistle slur
      var fe = Math.max(40, f1);
      f.exponentialRampToValueAtTime(fe, at + len);
      tf.exponentialRampToValueAtTime(fe, at + len);
    } else if (shape === 'arch') {
      // up to an apex then back down — the classic robin "warble" gesture
      var fend = Math.max(40, f1);
      f.exponentialRampToValueAtTime(mid, at + len * 0.45);
      f.exponentialRampToValueAtTime(fend, at + len);
      tf.exponentialRampToValueAtTime(mid, at + len * 0.45);
      tf.exponentialRampToValueAtTime(fend, at + len);
    } else { // 'dip'
      var lo = Math.max(40, Math.min(f0, f1) * 0.9);
      var fd = Math.max(40, f1);
      f.exponentialRampToValueAtTime(lo, at + len * 0.5);
      f.exponentialRampToValueAtTime(fd, at + len);
      tf.exponentialRampToValueAtTime(lo, at + len * 0.5);
      tf.exponentialRampToValueAtTime(fd, at + len);
    }

    // ── Vibrato / warble: a small sinusoidal FM so the tone SINGS. Depth scales
    //    with pitch so it stays musical across the band; rate is a fast, birdy
    //    flutter. Connected to BOTH carrier and overtone (overtone gets 2×). ───
    var vibRate = range(28, 46);                  // Hz — fast flutter
    var vibDepthHz = Math.max(f0, f1) * range(0.012, 0.022);
    var vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = vibRate;
    var vibGain = ctx.createGain();
    vibGain.gain.value = vibDepthHz;
    vib.connect(vibGain).connect(f);

    // ── Faint octave overtone for warmth (the fluty "body"). Tracks the carrier
    //    contour by sharing the same ramps at ×2, plus a deeper vibrato share. ──
    var over = ctx.createOscillator();
    over.type = 'sine';
    var of = over.frequency;
    of.setValueAtTime(f0 * 2, at);
    if (shape === 'rise' || shape === 'fall') {
      of.exponentialRampToValueAtTime(Math.max(80, f1 * 2), at + len);
    } else if (shape === 'arch') {
      of.exponentialRampToValueAtTime(mid * 2, at + len * 0.45);
      of.exponentialRampToValueAtTime(Math.max(80, f1 * 2), at + len);
    } else {
      var lo2 = Math.min(f0, f1) * 0.9 * 2;
      of.exponentialRampToValueAtTime(Math.max(80, lo2), at + len * 0.5);
      of.exponentialRampToValueAtTime(Math.max(80, f1 * 2), at + len);
    }
    var vibGain2 = ctx.createGain();
    vibGain2.gain.value = vibDepthHz * 2;
    vib.connect(vibGain2).connect(of);

    var overGain = ctx.createGain();
    overGain.gain.value = 0.18;                   // overtone sits quietly under carrier

    // ── Amplitude envelope: raised-cosine (smooth attack + decay) with a tiny
    //    bias toward a quick attack "chiff". Built as a sampled curve so it is
    //    exact and click-free regardless of length. ─────────────────────────────
    var g = ctx.createGain();
    var N = 64;
    var env = new Float32Array(N);
    var atkFrac = 0.18;                            // quick-ish onset
    var v = vel * amp;
    for (var i = 0; i < N; i++) {
      var x = i / (N - 1);
      var a;
      if (x < atkFrac) {
        a = 0.5 - 0.5 * Math.cos(Math.PI * (x / atkFrac));        // 0→1 ease-in
      } else {
        var y = (x - atkFrac) / (1 - atkFrac);
        a = 0.5 + 0.5 * Math.cos(Math.PI * y);                    // 1→0 ease-out
      }
      env[i] = Math.max(0.0001, a * v);
    }
    g.gain.setValueCurveAtTime(env, at, len);

    // ── Single consolidated signal path (C2 graft): carrier + octave overtone
    //    sum at the body gain, then through the sweep-tracking bandpass, then to
    //    the master bus. No parallel un-filtered branch — nothing can leak a
    //    raw onset transient. ──────────────────────────────────────────────────
    carrier.connect(g);
    over.connect(overGain).connect(g);
    g.connect(track).connect(bp);

    carrier.start(at);   carrier.stop(at + len + 0.02);
    over.start(at);      over.stop(at + len + 0.02);
    vib.start(at);       vib.stop(at + len + 0.02);
  }

  // ── PHRASE: a small run of syllables. Robins/blackbirds sing in short fluty
  //    motifs — a couple of glides, an arched warble, a falling slur — quick
  //    syllable-to-syllable, then a breath. We pick a phrase "register" (a base
  //    pitch in 2.2–4.8 kHz) and a few gesture syllables around it. Returns the
  //    time at which the phrase ends.
  //
  //    amp/trackQ are passed through so the same routine serves both the forward
  //    soloist (amp 1.0) and the faint distant background voices (amp < 1). ─────
  var SHAPES = ['rise', 'fall', 'arch', 'arch', 'dip']; // arch weighted (warbly)
  function phrase(start, amp, trackQ) {
    var base = range(2300, 4600);                 // this phrase's tonal center
    var nSyl = 3 + ((rnd() * 3) | 0);             // 3–5 syllables
    var at = start;
    for (var i = 0; i < nSyl; i++) {
      if (at >= t0 + dur - 0.06) break;
      var shape = SHAPES[(rnd() * SHAPES.length) | 0];

      // syllable endpoints: a glide interval of a few semitones, biased upward
      // for "rise", downward for "fall". Keep both ends inside ~1.8–6.2 kHz.
      var f0 = base * range(0.86, 1.18);
      var interval = range(1.12, 1.55);           // ~2–7 semitones of sweep
      var f1;
      if (shape === 'rise') f1 = f0 * interval;
      else if (shape === 'fall') f1 = f0 / interval;
      else f1 = f0 * range(0.92, 1.10);           // arch/dip return near start
      f0 = Math.min(6200, Math.max(1800, f0));
      f1 = Math.min(6400, Math.max(1700, f1));

      var len = range(0.07, 0.17);                // short, crisp syllables
      var vel = range(0.55, 0.92);

      syllable(at, f0, f1, len, vel, shape, amp, trackQ);

      // small intra-phrase gap (syllables are quick but not slurred together)
      at += len + range(0.03, 0.10);
      // drift the tonal center a touch so the phrase has melodic motion
      base *= range(0.96, 1.05);
      base = Math.min(4900, Math.max(2200, base));
    }
    return at;
  }

  // ── Lay out 2–3 SOLOIST phrases across the window with clear BREATHING PAUSES
  //    between them (moderate silence ratio: a bird, not a machine). First phrase
  //    starts a beat in; pauses are long enough to read as air in the
  //    spectrogram. The soloist is forward (amp 1.0) with a clean tracking Q. ───
  var cursor = t0 + range(0.18, 0.45);
  var phrases = 0;
  var guard = 0;
  while (cursor < t0 + dur - 0.30 && guard < 4) {
    cursor = phrase(cursor, 1.0, 3.2);
    phrases++;
    guard++;
    // breathing pause between phrases — long, natural gaps
    cursor += range(0.65, 1.25);
  }

  // Guarantee at least one short closing flourish if the window had room and we
  // somehow only fit one phrase — keeps the sound from feeling truncated.
  if (phrases < 2 && cursor < t0 + dur - 0.35) {
    phrase(cursor, 1.0, 3.2);
  }

  // ── DEPTH GRAFT (C3): 1–2 very faint, more distant background voices on their
  //    OWN phrase clock, slotted into the soloist's breathing pauses. They use
  //    the same clean tracking-bandpass attack path (tighter Q for an even
  //    softer onset) and a low amp so they read as air/ambience behind the
  //    soloist, never as a competing bird. They never run during the very first
  //    or very last moments so the soloist owns the open and the close. ─────────
  var bgVoices = 1 + ((rnd() * 2) | 0);           // 1–2 distant voices
  for (var bvi = 0; bvi < bgVoices; bvi++) {
    // Distant voice starts somewhere in the middle two-thirds of the window so
    // it tucks under/between the soloist's phrases rather than at the edges.
    var bgCursor = t0 + range(0.9, Math.max(1.0, dur * 0.45));
    var bgGuard = 0;
    while (bgCursor < t0 + dur - 0.6 && bgGuard < 3) {
      // amp well below the soloist (distance); tracking Q tighter for a soft,
      // transient-free onset that sits in the haze.
      bgCursor = phrase(bgCursor, range(0.18, 0.30), 4.5);
      bgGuard++;
      // distant voices sing sparsely too — long gaps
      bgCursor += range(0.9, 1.8);
    }
  }

  return {
    stop: function (at) {
      var when_stop = at != null ? at : ctx.currentTime;
      try { master.gain.setTargetAtTime(0.0001, when_stop, 0.06); } catch (e) {}
    }
  };
};
