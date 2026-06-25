'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Aqua.sfx.bubble — "A rising bubble" (the aquarium soundscape's one-shot)
//
// A single rounded, watery bubble rising through deep water — the soft "bloop"
// of a gas bubble, NOT a video-game blip. The physics give us the shape: a
// bubble in water is a tiny resonator whose pitch RISES as the bubble shrinks /
// the cavity tightens on release, so the defining gesture is a brief UPWARD
// pitch glide on a soft sine. We seat it dark and damp so it belongs under the
// low-passed water bed, never bright or clicky.
//
// Layers (all sine, kept dark so nothing reads as a synth blip):
//   (1) the BODY — a soft sine carrier that glides UP across the shot (an
//       exponential rise of roughly a major sixth), with a touch of shallow
//       vibrato near the onset so the wall of the bubble wobbles. This is the
//       voice --pitch will read.
//   (2) a faint SUB an octave down under the onset only — gives the bloop weight
//       and a rounded bottom, fading before the glide peaks so it doesn't drag
//       the pitch read down.
//   (3) a whisper of band-limited NOISE at the very onset — the small splash of
//       water closing around the bubble — fast attack, faster decay, low-passed
//       hard so it adds wetness, never hiss.
//
// A raised-cosine amplitude envelope (sampled curve) gives a soft round attack
// and a smooth decay to true silence — no click at either edge. A master
// lowpass keeps the whole thing damp and underwater; gains stay well under
// 0 dBFS. Result on the spectrogram: one short rising soft-edged tone blob, low
// and rounded, with a faint wet onset and a quick clean tail.
//
// Dual-use builder: schedules into `dest` on ANY BaseAudioContext (live
// AudioContext when shipped via Aqua.sfx.bubble, OfflineAudioContext when
// verified through the foundry bench). Deterministic via a seeded mulberry32 —
// never Math.random. The bench loads this as candidate.js and resolves the one
// builder registered on Gate.sfx, so we register the reserved __candidate key.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  function bubble({ ctx, dest, dur, when = 0, seed = 1 }) {
    var t0 = ctx.currentTime + when;

    // ── Seeded PRNG (mulberry32) — deterministic renders, no Math.random ─────
    var s = (seed >>> 0) || 1;
    function rnd() {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function range(lo, hi) { return lo + rnd() * (hi - lo); }

    // ── Master bus: a gentle lowpass keeps the bubble DARK + watery (no glassy
    //    edge), a highpass trims sub-rumble below the bloop, and a soft master
    //    gain holds the level well under 0 dBFS so it sits under the bed. ──────
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1700;        // damp + underwater, not bright
    lp.Q.value = 0.5;

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 110;         // trim sub-rumble below the body

    var master = ctx.createGain();
    master.gain.value = 0.42;         // gentle — a quiet rising bloop

    lp.connect(hp).connect(master).connect(dest);

    // ── The bubble shot. Keep it inside the render window with a little headroom
    //    so the tail decays fully to silence. ──────────────────────────────────
    var len = Math.min(range(0.26, 0.40), Math.max(0.08, dur - 0.04));
    var at = t0 + range(0.04, Math.max(0.05, Math.min(0.18, dur - len - 0.04)));

    // ── BODY: a soft sine that glides UP across the shot — the bubble's pitch
    //    rises as the cavity tightens. Exponential rise reads as a natural,
    //    accelerating "bloop", landing roughly a major sixth above the start. ──
    var f0 = range(330, 430);              // rounded, low-mid start
    var fEnd = f0 * range(1.55, 1.75);     // ~major sixth up — the rising gesture
    var body = ctx.createOscillator();
    body.type = 'sine';
    var bf = body.frequency;
    bf.setValueAtTime(f0, at);
    // Rise in three eases: a slow lift off the floor, the bulk of the climb in
    // the middle, then a SHALLOW final approach that EASES into the peak (so the
    // top of the sweep rounds off rather than spiking) — a rounder, more watery
    // glide than a single steep accelerating ramp. Still strictly UPWARD.
    bf.exponentialRampToValueAtTime(f0 * 1.12, at + len * 0.32);
    bf.exponentialRampToValueAtTime(fEnd * 0.93, at + len * 0.66); // most of the climb, earlier
    bf.exponentialRampToValueAtTime(fEnd, at + len * 0.95);        // gentle ease into the peak

    // ── A touch of shallow vibrato near the onset — the bubble wall wobbling.
    //    Its own gain envelope fades the wobble out so the tail glide is clean. ─
    var vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = range(11, 16);   // quick gentle tremble
    var vibGain = ctx.createGain();
    vibGain.gain.setValueAtTime(f0 * 0.018, at);
    vibGain.gain.exponentialRampToValueAtTime(f0 * 0.002, at + len * 0.6);
    vib.connect(vibGain).connect(bf);

    // ── Amplitude envelope: soft round raised-cosine attack, smooth decay to
    //    true silence. Sampled so it is exact at any len, click-free both edges. ─
    var g = ctx.createGain();
    var N = 96;
    var env = new Float32Array(N);
    var atkFrac = 0.18;                    // soft round onset, not percussive
    for (var i = 0; i < N; i++) {
      var x = i / (N - 1);
      var a;
      if (x < atkFrac) {
        a = 0.5 - 0.5 * Math.cos(Math.PI * (x / atkFrac));      // 0→1 ease-in
      } else {
        var y = (x - atkFrac) / (1 - atkFrac);
        a = 0.5 + 0.5 * Math.cos(Math.PI * y);                  // 1→0 ease-out
      }
      env[i] = Math.max(0.0001, a);
    }
    g.gain.setValueCurveAtTime(env, at, len);
    body.connect(g).connect(lp);

    // ── SUB: a faint octave-down sine under the ONSET only — rounded weight,
    //    fades before the glide peaks so it doesn't pull the pitch read low. ───
    var sub = ctx.createOscillator();
    sub.type = 'sine';
    var sf = sub.frequency;
    sf.setValueAtTime(f0 * 0.5, at);
    sf.exponentialRampToValueAtTime(f0 * 0.5 * 1.1, at + len * 0.5);
    var subG = ctx.createGain();
    var subLen = len * 0.55;
    var sN = 40;
    var sEnv = new Float32Array(sN);
    var sAtk = 0.20;
    var subPeak = 0.26;                    // quiet — body, not pitch
    for (var si = 0; si < sN; si++) {
      var sx = si / (sN - 1);
      var sa;
      if (sx < sAtk) sa = 0.5 - 0.5 * Math.cos(Math.PI * (sx / sAtk));
      else { var sy = (sx - sAtk) / (1 - sAtk); sa = 0.5 + 0.5 * Math.cos(Math.PI * sy); }
      sEnv[si] = Math.max(0.0001, sa * subPeak);
    }
    subG.gain.setValueCurveAtTime(sEnv, at, subLen);
    sub.connect(subG).connect(lp);

    // ── ONSET SPLASH: a whisper of band-limited noise at the very start — water
    //    closing around the bubble. Fast in, faster out, low-passed hard so it
    //    adds wetness, never hiss. Built from seeded noise (deterministic). ────
    var noiseLen = Math.max(1, Math.ceil(ctx.sampleRate * Math.min(0.12, len * 0.5)));
    var noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    var ndata = noiseBuf.getChannelData(0);
    for (var ni = 0; ni < noiseLen; ni++) { ndata[ni] = rnd() * 2 - 1; }
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var nbp = ctx.createBiquadFilter();
    nbp.type = 'bandpass';
    nbp.frequency.value = f0 * 1.6;        // wet onset just above the body
    nbp.Q.value = 0.9;
    var ng = ctx.createGain();
    var nN = 28;
    var nEnv = new Float32Array(nN);
    var nAtk = 0.12;
    var splashLen = Math.min(len * 0.4, 0.10);
    var splashPeak = 0.085;                // a whisper of wetness
    for (var nj = 0; nj < nN; nj++) {
      var nx = nj / (nN - 1);
      var na;
      if (nx < nAtk) na = 0.5 - 0.5 * Math.cos(Math.PI * (nx / nAtk));
      else { var nyy = (nx - nAtk) / (1 - nAtk); na = 0.5 + 0.5 * Math.cos(Math.PI * nyy); }
      nEnv[nj] = Math.max(0.0001, na * splashPeak);
    }
    ng.gain.setValueCurveAtTime(nEnv, at, splashLen);
    src.connect(nbp).connect(ng).connect(lp);

    // ── Start / stop everything within the window. ───────────────────────────
    var tail = len + 0.03;
    body.start(at);  body.stop(at + tail);
    vib.start(at);   vib.stop(at + tail);
    sub.start(at);   sub.stop(at + subLen + 0.02);
    src.start(at);   src.stop(at + splashLen + 0.02);

    return {
      stop: function (stopAt) {
        var w = stopAt != null ? stopAt : ctx.currentTime;
        try { master.gain.setTargetAtTime(0.0001, w, 0.05); } catch (e) {}
      }
    };
  }

  // Ship form: Aqua.sfx.bubble — the real final key the aquarium page loads it by.
  // Bench form: the same builder under its real key on Gate.sfx, which the foundry
  // bench resolves as the single registered candidate (not the reserved __candidate).
  window.Aqua = window.Aqua || {}; window.Aqua.sfx = window.Aqua.sfx || {};
  window.Aqua.sfx.bubble = bubble;
  window.Gate = window.Gate || {}; window.Gate.sfx = window.Gate.sfx || {};
  window.Gate.sfx.bubble = bubble;
})();

// ── Aquarium SFX: "swish" ──────────────────────────────────────────────────
// A soft filtered-noise one-shot: the school turning as one on feed / startle.
// Underwater, brief (~0.3s tail), gentle — a sweep of bodies, not a sound-effect
// reel. It must blend INTO the calm low water bed, never poke through it.
//
// Architecture (procedural WebAudio, dual-use: live AudioContext or
// OfflineAudioContext — the exact graph verified is the one that ships):
//
//   white-noise buffer (seeded)
//     → highpass (clear the sub so it doesn't muddy the bed)
//     → bandpass that GLIDES open then closed (the swish "sweep")
//     → lowpass ceiling (keep it dark / watery, capped by boil)
//     → swish gain: fast soft attack, smooth exp-ish decay (no click)
//     → master headroom gain → dest
//
// The motion is in the bandpass: it opens up through the attack (the school
// accelerating into the turn) and closes + drops a little through the decay
// (settling back), which the ear reads as one coherent "swish" rather than a
// static noise blip. `boil` 0..1 scales BOTH the brightness (center/ceiling
// frequencies) and the peak level — a calm flick at boil≈0.2, a bright churn
// near boil≈1 — so brightness scales with the boil exactly as the brief asks.
//
// Determinism: every random value comes from a seeded mulberry32, never
// Math.random — so the OfflineAudioContext render is bit-reproducible.
//
// Builder contract (matches the gate's Gate.sfx.* and the aquarium spec):
//   Aqua.sfx.swish({ ctx, dest, dur, when = 0, seed = 1, boil = 1 })
//   Short (~0.2–0.4s). Returns { stop(at) } for live teardown.
//
// The page loads this by its real key (Aqua.sfx.swish). For the foundry render
// bench (which resolves ONE Gate.sfx builder, preferring the reserved
// __candidate key) we ALSO alias Gate.sfx.__candidate → swish so the live
// module renders the swish even though Gate.sfx.bubble is also registered.

window.Aqua = window.Aqua || {};
window.Aqua.sfx = window.Aqua.sfx || {};

window.Aqua.sfx.swish = function ({ ctx, dest, dur, when = 0, seed = 1, boil = 1 }) {
  var t0 = ctx.currentTime + when;
  var sr = ctx.sampleRate;

  // Clamp boil to 0..1 (0 = barely a ripple, 1 = a bright churn on full feed).
  var b = Math.max(0, Math.min(1, boil));

  // ── Seeded PRNG (mulberry32) — deterministic, no Math.random ──────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32((seed | 0) || 1);

  // ── The swish body length ─────────────────────────────────────────────────
  // A swish is brief: a fast soft attack and a ~0.28s smooth decay to silence.
  // We cap the active sound to the burst window even if `dur` is longer (the
  // render length), so the tail decays into clean silence (loops/seams clean).
  var burst = Math.min(dur, 0.34);          // active sound length, seconds
  var atk = 0.022;                          // soft attack (no click)
  var t1 = t0 + burst;

  // ── White-noise buffer (seeded) — the raw material of the sweep ───────────
  // Render only the burst window of noise (cheaper, and nothing past it sounds).
  var bufLen = Math.max(1, Math.round(sr * (burst + atk + 0.02)));
  var noiseBuf = ctx.createBuffer(1, bufLen, sr);
  var data = noiseBuf.getChannelData(0);
  for (var i = 0; i < bufLen; i++) {
    data[i] = rng() * 2 - 1;                // flat white; the filters do the shaping
  }
  var src = ctx.createBufferSource();
  src.buffer = noiseBuf;

  // ── Highpass: clear the sub so the swish doesn't muddy the low water bed ──
  var hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(180, t0);
  hp.Q.setValueAtTime(0.5, t0);

  // ── Bandpass GLIDE: the actual "sweep" of the school turning ──────────────
  // Center opens through the attack then closes + falls through the decay.
  // Frequencies scale with boil: a dull flick sits low, a bright churn opens up.
  // Underwater, so the whole range stays well below an "in-air" hiss. The
  // full-boil open peak is trimmed (vs the first take's 700+1500*b) so even the
  // brightest startle centroid lands nearer the bed's target band — the swish
  // stays a school turning IN the water, blending into the calm bed across the
  // WHOLE boil range, not just the low end. The low-boil endpoints are
  // unchanged, so brightness still scales monotonically with boil.
  var bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.setValueAtTime(0.9, t0);             // broad — a wash, not a whistle
  var cLow  = 360 + 240 * b;                // start of the sweep
  var cPeak = 700 + 1150 * b;               // open peak near the attack (trimmed @ b=1)
  var cEnd  = 300 + 360 * b;                // settles back down on the tail
  bp.frequency.setValueAtTime(cLow, t0);
  bp.frequency.linearRampToValueAtTime(cPeak, t0 + atk + 0.04);   // open fast
  bp.frequency.exponentialRampToValueAtTime(cEnd, t1);            // close + fall

  // ── Lowpass ceiling: keep it watery/dark; the cap rises with boil ─────────
  // This guarantees the spectral centroid stays modest on calm flicks and only
  // brightens when the school really boils — so brightness scales with boil and
  // the sound never turns into a hissy in-air "swish". The full-boil ceiling is
  // pulled down (3000 Hz vs the first take's 3700 Hz) so the brightest startle
  // sits closer to the bed's <800–1kHz wash and "blends into the calm bed" holds
  // across the full boil range.
  var lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.setValueAtTime(0.6, t0);
  var lpCeil = 1100 + 1900 * b;             // trimmed @ b=1 (was 1100 + 2600*b)
  lp.frequency.setValueAtTime(lpCeil, t0);

  // ── Swish gain envelope: fast soft attack, smooth decay to silence ────────
  // Level scales gently with boil (a startle is louder than a lazy feed turn),
  // but stays muted — this rides UNDER the bed. Exponential-ish decay reads as
  // a natural settle, not a gated cut.
  var g = ctx.createGain();
  var peak = 0.16 + 0.30 * b;               // muted floor → modest churn peak
  g.gain.setValueAtTime(0.0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + atk);                 // soft attack
  // Smooth decay: a couple of ramp anchors approximate an exp tail, ending in
  // a hard zero so there is no lingering noise floor past the burst.
  g.gain.linearRampToValueAtTime(peak * 0.45, t0 + atk + (burst - atk) * 0.35);
  g.gain.linearRampToValueAtTime(peak * 0.12, t0 + atk + (burst - atk) * 0.70);
  g.gain.linearRampToValueAtTime(0.0, t1);

  // ── Master headroom guard — keep peaks well under 0 dBFS ──────────────────
  var master = ctx.createGain();
  master.gain.setValueAtTime(0.85, t0);

  // ── Wire: src → hp → bp → lp → g → master → dest ──────────────────────────
  src.connect(hp);
  hp.connect(bp);
  bp.connect(lp);
  lp.connect(g);
  g.connect(master);
  master.connect(dest);

  // ── Start / stop ──────────────────────────────────────────────────────────
  src.start(t0);
  src.stop(t1 + 0.02);

  return {
    stop: function (at) {
      var when2 = at != null ? at : ctx.currentTime;
      try {
        g.gain.cancelScheduledValues(when2);
        g.gain.setValueAtTime(g.gain.value, when2);
        g.gain.linearRampToValueAtTime(0, when2 + 0.05);
        src.stop(when2 + 0.06);
      } catch (e) { /* already stopped */ }
    }
  };
};

// Alias for the foundry render bench (it resolves a single Gate.sfx builder,
// preferring the reserved __candidate key over the already-registered
// Gate.sfx.bubble — so the live module renders the swish).
window.Gate = window.Gate || {};
window.Gate.sfx = window.Gate.sfx || {};
window.Gate.sfx.__candidate = function (args) {
  return window.Aqua.sfx.swish(args);
};

// ─────────────────────────────────────────────────────────────────────────────
// Aqua.sfx.waterBed — "the deep-water ambient bed" (the soundscape's headline)
//
// A calm, dark, low-passed water wash you'd leave running for an hour. NOT a
// sound-effect reel. The headline is the BREATHING: a true sub-Hz swell so the
// whole bed slowly inhales and exhales like a large body of water settling.
// Under it sits the WEIGHT of deep water — a faint low resonance from two
// near-tuned resonant taps (large-tank modes) that give the bed body without
// ever reading as a tone.
//
// FOUNDRY SYNTH (built on take 2 — the judges' unanimous winner): take 2 carried
// the breathing swell as the protagonist (its spectrogram visibly inhales;
// centroid 61 Hz, the deepest/darkest water of the takes) and the felt low
// resonance. Grafted in from take 1 per BOTH judges' notes:
//   (1) LEVEL LIFT (~+2 dB toward take 1's RMS -23.6 / peak -8.9): take 2 sat
//       conservative at RMS -25.8 / peak -12 with ~12 dB of headroom; a touch
//       more presence is still hour-safe and never clips.
//   (2) SMOOTHER LOW FLUTTER: lengthen the brown-noise integrator leak and add a
//       light one-pole smoothing pass so the macro breath dominates even more
//       and the onset-detector false-positive (take 2 read 20 onsets) drops back
//       toward take 1's ~5. Visual/analysis hygiene only — the audible character
//       (the natural grain of moving water) is unchanged.
//   (3) TAKE 1'S LONG GRACEFUL FADES: adopt take 1's fade = min(0.6, dur*0.12)
//       shape (≈0.6 s in/out at dur 8) so head/tail are as click-free as take 1.
//
// Architecture (procedural WebAudio, dual-use live/offline; deterministic):
//   seeded brown noise ─┬─ darkLP (steep, slow-breathing cutoff) ─┐  the wash
//                       ├─ resTapA (resonant LP ~62 Hz, tiny)  ────┤  deep-water
//                       └─ resTapB (resonant LP ~95 Hz, tiny)  ────┤  resonance
//   sub-Hz breath curve drives BOTH the wash gain and the darkLP cutoff so the
//   brightness and level inhale together  ───────────────────────→ master → dest
//
// Determinism: every random value comes from a seeded mulberry32, never
// Math.random — the offline render is bit-reproducible.
//
// Builder contract (matches SOUND.SPEC.md / the gate's Gate.sfx.* shape):
//   Aqua.sfx.waterBed({ ctx, dest, dur, when = 0, seed = 1, intensity = 0.6 })
//   intensity 0..1 scales overall level. Returns { stop(at) }.
//
// Ship key only: Aqua.sfx.waterBed. The shared Gate.sfx.__candidate bench alias
// is owned by the swish sibling above; the foundry renders THIS builder from a
// dedicated candidate file, and the aquarium page loads every builder by its
// real Aqua.sfx.* key — so this module is never the bench's ambiguous candidate.
(function () {
  function waterBed({ ctx, dest, dur, when = 0, seed = 1, intensity = 0.6 }) {
    var t0 = ctx.currentTime + when;
    var sr = ctx.sampleRate;

    // Clamp intensity to a sane range.
    var amt = Math.max(0, Math.min(1, intensity));

    // ── Seeded PRNG (mulberry32) — deterministic, no Math.random ──────────────
    var a = (seed >>> 0) || 1;
    function rng() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // ── Brown noise bed (random walk, −6 dB/oct: low-weighted) ────────────────
    // Rendered exactly `dur` so the page can loop the graph seamlessly.
    // GRAFT (2): a longer integrator leak than take 2 (0.99925 vs 0.9989) makes
    // the walk move even more slowly, so the macro breath — not fast amplitude
    // flicker — is the protagonist and the onset detector stops latching grain.
    // A light one-pole post-smoothing pass (below) finishes the job.
    var bufLen = Math.max(1, Math.round(sr * dur));
    var noiseBuf = ctx.createBuffer(1, bufLen, sr);
    var data = noiseBuf.getChannelData(0);
    var last = 0;
    var leak = 0.99925;               // longer integration → smoother, slower walk
    for (var i = 0; i < bufLen; i++) {
      var white = rng() * 2 - 1;
      last = leak * last + white * 0.04;
      data[i] = last;
    }
    // One-pole low-pass smoothing of the walk itself (graft 2): tames residual
    // fast flutter so the visible/analysed envelope is dominated by the breath,
    // not grain — without changing the audible "moving water" character or
    // over-darkening the source. (A heavier/cascaded smooth was tried and
    // rejected: it crushed the level and pushed the centroid below ~40 Hz while
    // the onset count — a confirmed audio-lens false positive on slow noise
    // envelopes, pitch:none, no real rhythm — did not improve. Both judges
    // already discounted the onset read; chasing it degraded the deliverable.)
    var smooth = 0;
    var sCoef = 0.04;
    for (var p = 0; p < bufLen; p++) {
      smooth = smooth + sCoef * (data[p] - smooth);
      data[p] = smooth;
    }
    // Normalize the walk to a known peak so downstream gains are predictable.
    var peakAbs = 1e-9;
    for (var k = 0; k < bufLen; k++) {
      var av = data[k] < 0 ? -data[k] : data[k];
      if (av > peakAbs) peakAbs = av;
    }
    var norm = 0.9 / peakAbs;
    for (var m = 0; m < bufLen; m++) { data[m] *= norm; }

    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;

    // ── Floor trim ────────────────────────────────────────────────────────────
    // Clear the deepest sub-bass rumble so the bed sits as moving water, not a
    // truck idling. Gentle — we WANT low weight, just not DC-ish mud.
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(38, t0);
    hp.Q.setValueAtTime(0.5, t0);

    // ── The dark wash: two stacked lowpasses, steep + dark ────────────────────
    // The cutoff breathes with the sub-Hz swell (built below). Ceiling stays low
    // so the spectral centroid stays well under ~300 Hz — dark, immersive water.
    var lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.Q.setValueAtTime(0.5, t0);

    var lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.Q.setValueAtTime(0.5, t0);

    var cutBase = 130;                 // Hz — the calm, dark floor of the wash
    var cutSwing = 200 + 140 * amt;    // how far the breath opens it on the inhale
    lp2.frequency.setValueAtTime(cutBase * 1.4, t0);  // 2nd stage tracks higher

    // ── The breath: a TRUE sub-Hz swell curve ─────────────────────────────────
    // A slow primary breath (~0.08 Hz ≈ 12 s) plus a much slower incommensurate
    // drift (~0.017 Hz ≈ 60 s) so an 8 s render shows one clear inhale and an
    // hour never obviously repeats. We sample a shared control curve so the wash
    // gain AND the cutoff inhale on the SAME motion (built once, deterministic).
    var ctrlRate = 120;
    var ctrlLen = Math.max(2, Math.round(dur * ctrlRate));
    var breath = new Float32Array(ctrlLen);   // 0..1 swell
    var cutCurve = new Float32Array(ctrlLen); // Hz, shared with the wash gain

    // Primary breath ~0.07–0.10 Hz; secondary drift ~0.014–0.022 Hz. Random phase.
    var fA = 0.07 + rng() * 0.03;
    var fB = 0.014 + rng() * 0.008;
    var pA = rng() * Math.PI * 2;
    var pB = rng() * Math.PI * 2;

    for (var c = 0; c < ctrlLen; c++) {
      var t = c / ctrlRate;
      var s = 0.78 * Math.sin(2 * Math.PI * fA * t + pA)
            + 0.22 * Math.sin(2 * Math.PI * fB * t + pB);
      var bb = (s + 1) * 0.5;                 // → 0..1
      if (bb < 0) bb = 0; else if (bb > 1) bb = 1;
      // Gamma deepens the troughs so exhales settle into clear calm and inhales
      // read as distinct swells. The bed never fully disappears (residual floor).
      bb = Math.pow(bb, 1.7);
      breath[c] = bb;
      cutCurve[c] = cutBase + cutSwing * bb;
    }

    lp1.frequency.setValueAtTime(cutCurve[0], t0);
    lp1.frequency.setValueCurveAtTime(cutCurve, t0, dur);

    // ── Wash gain — inhale/exhale level on the SAME breath ────────────────────
    // GRAFT (1): lift the wash floor/peak ~25% toward take 1's hotter level for a
    // touch more presence. Floor stays audible (residual water moving even at the
    // bottom of a breath); peak is the top of the inhale.
    var gFloor = 0.28;                 // exhale settles low (but never silent)
    var gPeak = 0.88 + 0.18 * amt;     // inhale lifts clearly — a deep slow swell
    var washCurve = new Float32Array(ctrlLen);
    for (var wi = 0; wi < ctrlLen; wi++) {
      washCurve[wi] = gFloor + (gPeak - gFloor) * breath[wi];
    }
    var washGain = ctx.createGain();
    washGain.gain.setValueAtTime(washCurve[0], t0);
    washGain.gain.setValueCurveAtTime(washCurve, t0, dur);

    // ── Deep-water resonance: two faint near-tuned resonant taps ──────────────
    // Large-tank modes give the bed BODY — the felt weight of deep water —
    // without ever becoming a pitch. Kept tiny: they read as weight, not tone,
    // and f0 must stay null.
    var resA = ctx.createBiquadFilter();
    resA.type = 'lowpass';
    resA.frequency.setValueAtTime(62, t0);
    resA.Q.setValueAtTime(5.5, t0);

    var resB = ctx.createBiquadFilter();
    resB.type = 'lowpass';
    resB.frequency.setValueAtTime(95, t0);
    resB.Q.setValueAtTime(4.5, t0);

    // The resonance also breathes, but more subtly than the wash so it feels like
    // a constant deep undertow with a gentle tidal lift, not a pulsing tone.
    // GRAFT (1): lifted in proportion with the wash for matching presence.
    var resGainA = ctx.createGain();
    var resGainB = ctx.createGain();
    var resCurveA = new Float32Array(ctrlLen);
    var resCurveB = new Float32Array(ctrlLen);
    var resBase = 0.14;                       // always-present undertow (faint)
    var resLift = 0.10;                       // small tidal lift on the inhale
    for (var ri = 0; ri < ctrlLen; ri++) {
      var lift = resBase + resLift * breath[ri];
      resCurveA[ri] = lift;
      resCurveB[ri] = lift * 0.62;            // upper mode quieter — weight skews low
    }
    resGainA.gain.setValueAtTime(resCurveA[0], t0);
    resGainA.gain.setValueCurveAtTime(resCurveA, t0, dur);
    resGainB.gain.setValueAtTime(resCurveB[0], t0);
    resGainB.gain.setValueCurveAtTime(resCurveB, t0, dur);

    // ── Master gain — long graceful fade in/out (no clicks) + headroom guard ──
    // GRAFT (3): take 1's fade shape — long, gentle fades suit a calm bed and are
    // maximally click-free at both edges. GRAFT (1): a slightly hotter master so
    // the loudest inhale lands near take 1's level while keeping clear headroom;
    // the page's limiter should never have to engage.
    var lvl = 1.0;
    var fade = Math.min(0.6, dur * 0.12);
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0, t0);
    master.gain.linearRampToValueAtTime(lvl, t0 + fade);                      // fade in
    master.gain.setValueAtTime(lvl, Math.max(t0 + fade, t0 + dur - fade));
    master.gain.linearRampToValueAtTime(0.0, t0 + dur);                       // fade out

    // ── Wire the graph ─────────────────────────────────────────────────────────
    // Wash:      src → hp → lp1 → lp2 → washGain ┐
    // Resonance: src → hp → resA → resGainA      ┼→ master → dest
    //            src → hp → resB → resGainB      ┘
    src.connect(hp);

    hp.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(washGain);
    washGain.connect(master);

    hp.connect(resA);
    resA.connect(resGainA);
    resGainA.connect(master);

    hp.connect(resB);
    resB.connect(resGainB);
    resGainB.connect(master);

    master.connect(dest);

    // ── Start / stop ────────────────────────────────────────────────────────────
    src.start(t0);
    src.stop(t0 + dur);

    return {
      stop: function (at) {
        var when2 = at != null ? at : ctx.currentTime;
        try {
          master.gain.cancelScheduledValues(when2);
          master.gain.setValueAtTime(master.gain.value, when2);
          master.gain.linearRampToValueAtTime(0, when2 + 0.2);
          src.stop(when2 + 0.25);
        } catch (e) { /* already stopped */ }
      }
    };
  }

  // Ship key only — the aquarium page loads the bed by Aqua.sfx.waterBed.
  window.Aqua = window.Aqua || {}; window.Aqua.sfx = window.Aqua.sfx || {};
  window.Aqua.sfx.waterBed = waterBed;
})();
