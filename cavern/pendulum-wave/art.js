/* ============================================================================
 *  art.js — the Pendulum Wave's forged art (FINAL, art-foundry edition).
 *
 *  Three assets the bench needs, behind a stable API the page calls: the luminous
 *  bob-glow (+ its hue map), the rosewood marimba voice, and a barely-there ambient
 *  drone bed. All three are the ART FOUNDRY's forged winners (K takes → judges →
 *  synth), installed over the earlier placeholders; the contracts they satisfy are
 *  in art-specs/*.md. The call sites in index.src.html are unchanged.
 *
 *  Browser-global (window.PendulumArt); forge-inlined into the page as a slab. No
 *  ESM exports — it self-attaches, so it needs no export-stripping.
 * ============================================================================ */
(function(){
  "use strict";
  var PA = {};

  var clamp01 = function(v){ return v < 0 ? 0 : v > 1 ? 1 : v; };
  var cl8 = function(v){ v = Math.round(v); return v < 0 ? 0 : v > 255 ? 255 : v; };

  /* hueColor(h01) — the bob's note as a colour: h01=0 → teal (#7fd4c0),
   * h01=1 → indigo (#b18cff). Endpoints are EXACT; between them a vivid cyan bend
   * and a saturation lift (both gated by m = 4h(1-h), zero at the ends) make the
   * middle notes read as jewels rather than a muddy grey-green. Shared by glow +
   * trail + the solid core dot. */
  PA.hueColor = function(h){
    h = clamp01(h);
    var a = [127, 212, 192], b = [177, 140, 255];
    var r = a[0] + (b[0] - a[0]) * h,
        g = a[1] + (b[1] - a[1]) * h,
        l = a[2] + (b[2] - a[2]) * h;
    var m = 4 * h * (1 - h);                 // 0 at both ends, 1 at mid
    var v = [72, 196, 206], k = 0.18 * m;    // vivid cyan anchor, vanishes at ends
    r += (v[0] - r) * k; g += (v[1] - g) * k; l += (v[2] - l) * k;
    var s = 1 + 0.13 * m;                     // saturation lift, also vanishes at ends
    var lum = 0.30 * r + 0.59 * g + 0.11 * l;
    r = lum + (r - lum) * s; g = lum + (g - lum) * s; l = lum + (l - lum) * s;
    return [cl8(r), cl8(g), cl8(l)];
  };

  /* whiteTint(c,t) — push a colour t of the way toward white (a hue-carrying
   * near-white, never a dead white pixel). */
  var whiteTint = function(c, t){
    return [cl8(c[0] + (255 - c[0]) * t),
            cl8(c[1] + (255 - c[1]) * t),
            cl8(c[2] + (255 - c[2]) * t)];
  };

  /* coolRim(c,h) — nudge the corona toward a cool blue for a quiet prismatic
   * dispersion, fading the cooling toward the indigo end (h→1) so high notes stay
   * violet, not blue. */
  var coolRim = function(c, h){
    var cool = [104, 152, 255];
    var amt = 0.32 * (1 - 0.72 * clamp01(h));
    return [cl8(c[0] + (cool[0] - c[0]) * amt),
            cl8(c[1] + (cool[1] - c[1]) * amt),
            cl8(c[2] + (cool[2] - c[2]) * amt)];
  };

  var csv = function(c){ return c[0] + ',' + c[1] + ',' + c[2]; };

  /* ── ASSET: bobGlow (visual) ───────────────────────────────────────────────
   * Draw one bob's luminous sphere, additively, at (x,y) with on-screen radius r.
   *   hue01     0→teal … 1→indigo (its note's colour)
   *   intensity 0..1 overall brightness (the page swells it with the bob's speed)
   * Draws into the 2D context `ctx` in device-pixel space; drawn under BOTH the
   * 'lighter' (trail) and 'source-over' (sharp) composites — ONE radial-gradient
   * fill, so it composites identically under either. A hot HUE-TINT core (never
   * pure white, so additive overlaps sum to a bright hue, not a white clip) bleeds
   * through a glassy shell into a saturated jewel body, then a hue-aware cool
   * corona and a wide faint halo tail. Intensity breathes radius + brightness with
   * a floor for a faint ember at the crests. Draw-only: touches only fillStyle + a
   * fresh path (art-specs/bob-glow.md). */
  PA.bobGlow = function(ctx, x, y, r, hue01, intensity){
    intensity = clamp01(intensity);
    var b = 0.06 + 0.94 * Math.pow(intensity, 0.60);
    var rc = r * (0.68 + 0.42 * intensity);   // core-body scale
    var R  = rc * 2.25;                         // widened halo reach (past r, faint)
    if (R <= 0) return;

    var c    = PA.hueColor(hue01);
    var core = whiteTint(c, 0.76);              // very light hue tint (near-white, carries the note)
    var lift = whiteTint(c, 0.60);              // brighter hue, core → shell
    var rim  = coolRim(c, hue01);               // hue-aware cool corona
    var bod  = csv(c), rimS = csv(rim), corS = csv(core), lifS = csv(lift);

    var g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0.000, 'rgba(' + corS + ',' + (0.45 * b) + ')');  // hot HUE-TINT core (tiny, not white)
    g.addColorStop(0.038, 'rgba(' + lifS + ',' + (0.40 * b) + ')');  // core → hue, fast
    g.addColorStop(0.084, 'rgba(' + bod  + ',' + (0.62 * b) + ')');  // glassy inner shell (strong hue)
    g.addColorStop(0.203, 'rgba(' + bod  + ',' + (0.50 * b) + ')');  // saturated jewel body
    g.addColorStop(0.371, 'rgba(' + bod  + ',' + (0.26 * b) + ')');  // body edge (~r)
    g.addColorStop(0.540, 'rgba(' + rimS + ',' + (0.115 * b) + ')'); // cool corona
    g.addColorStop(0.701, 'rgba(' + rimS + ',' + (0.042 * b) + ')'); // dispersing rim
    g.addColorStop(0.860, 'rgba(' + rimS + ',' + (0.015 * b) + ')'); // wide faint halo tail
    g.addColorStop(1.000, 'rgba(' + rimS + ',0)');                   // clean transparent
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
  };

  /* ── ASSET: marimba (sound) — "the rosewood bar" ───────────────────────────
   * Schedule ONE pitched mallet note. o = { ctx, dest, freq, when, dur, gain, seed }.
   *   ctx   AudioContext           dest  destination node (the muted master)
   *   freq  fundamental in Hz      when  ctx-time to start   dur  seconds
   *   gain  0..1 peak              seed  optional determinism hook (mallet tick)
   * A physically-motivated ADDITIVE marimba. A deep-arch rosewood/padauk bar rings
   * with its first overtone tuned to the 4th harmonic (two octaves up) — the hollow
   * 4:1 partial that is the marimba signature (vs a xylophone's odd partials). So:
   *   • fundamental  1.00×  — dominant sine, longest exp decay, carries the pitch
   *   • partial      4.00×  — the tuned marimba ring, quiet, faster decay
   *   • partial      9.20×  — a whisper of sparkle, gone in ~40 ms, colours the attack
   * A tail lowpass opens near the top partial at strike then eases to a warm floor
   * (~f*2.2) so the note dulls as it rings out. The felt mallet is a ~14 ms
   * bandpassed-noise tick (seeded PRNG, deterministic) that bypasses the tail lowpass.
   * Fast ~3 ms attack, exp decay pinned to true zero by ~when+dur so it sums cleanly
   * in a chord. A threshold soft-knee limiter on the bus is transparent for a lone
   * note (peak ≈ -8.8 dBFS) and only catches worst-case coincident polyphony peaks,
   * so a stack of 15 threads blooms rather than walls. — art-specs/marimba.md */
  PA.marimba = function(o){
    var ctx  = o.ctx, dest = o.dest;
    var f    = (o.freq != null) ? o.freq : 440;
    var t0   = (o.when != null) ? o.when : ctx.currentTime;
    var dur  = (o.dur  != null) ? o.dur  : 0.6;
    var gain = (o.gain != null) ? o.gain : 0.5;

    // Deterministic PRNG (mulberry32) so the mallet tick is reproducible.
    function rng(seed){
      var a = (seed >>> 0) || 1;
      return function(){
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var rand = rng((o.seed != null ? o.seed : 1) * 2654435761 + Math.round(f));

    // Voice bus → tail lowpass → out → soft-knee limiter → dest. The lowpass opens
    // near the top partial then eases down, so the attack has air and the tail warms.
    var out = ctx.createGain();
    out.gain.setValueAtTime(gain, t0);            // strike loudness (bob speed)

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.setValueAtTime(0.5, t0);
    var lpHi = Math.min(f * 6.5, 8000);           // let the 4× partial through at strike
    var lpLo = Math.max(f * 2.2, 500);            // warm floor as it decays
    lp.frequency.setValueAtTime(lpHi, t0);
    lp.frequency.exponentialRampToValueAtTime(lpLo, t0 + Math.min(0.18, dur * 0.4));
    lp.connect(out);

    // Threshold soft-knee limiter: identity for |x| ≤ 0.6 (a lone note, peaking
    // ~0.36, is untouched) and saturates smoothly above, so 15 coincident strikes
    // at a unison recurrence are held near ceiling instead of clipping.
    var lim = ctx.createWaveShaper();
    (function(){
      var n = 2048, curve = new Float32Array(n), th = 0.6;
      for (var k = 0; k < n; k++){
        var x = (k / (n - 1)) * 2 - 1, a = Math.abs(x), s = x < 0 ? -1 : 1;
        curve[k] = (a <= th) ? x : s * (th + (1 - th) * Math.tanh((a - th) / (1 - th)));
      }
      lim.curve = curve; lim.oversample = '2x';
    })();
    out.connect(lim); lim.connect(dest);

    // ── Partials: [ratio, peak, decaySec, attackSec ] ──────────────────────
    var A = 0.56;                                 // fundamental peak → lone note ~ -8.8 dBFS
    var parts = [
      [1.00, A,        dur,              0.003],
      [4.00, A * 0.30, dur * 0.50,       0.002],  // the tuned marimba ring — its presence
      [9.20, A * 0.07, Math.min(0.05, dur * 0.12), 0.0015]
    ];
    for (var i = 0; i < parts.length; i++){
      var ratio = parts[i][0], peak = parts[i][1], dk = parts[i][2], at = parts[i][3];
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * ratio, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + at);
      g.gain.exponentialRampToValueAtTime(0.0006, t0 + dk);
      g.gain.linearRampToValueAtTime(0, t0 + dk + 0.02);   // true silence, no exp floor
      osc.connect(g); g.connect(lp);
      osc.start(t0); osc.stop(t0 + dk + 0.05);
    }

    // ── Mallet tick: a few ms of bandpassed noise at the very onset (soft felt) ──
    var tickDur = 0.014;
    var nFrames = Math.max(1, Math.round(ctx.sampleRate * tickDur));
    var buf = ctx.createBuffer(1, nFrames, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var n2 = 0; n2 < nFrames; n2++){ d[n2] = rand() * 2 - 1; }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(Math.min(f * 5 + 1200, 6500), t0);
    bp.Q.setValueAtTime(0.8, t0);
    var tg = ctx.createGain();
    var tickPeak = A * 0.20;
    tg.gain.setValueAtTime(0.0001, t0);
    tg.gain.exponentialRampToValueAtTime(tickPeak, t0 + 0.0008);
    tg.gain.exponentialRampToValueAtTime(0.0002, t0 + tickDur);
    tg.gain.linearRampToValueAtTime(0, t0 + tickDur + 0.004);
    src.connect(bp); bp.connect(tg); tg.connect(out);      // tick bypasses the tail lowpass
    src.start(t0); src.stop(t0 + tickDur + 0.02);
  };

  /* ── ASSET (optional): drone (sound) — FORGED "the held breath" ────────────
   * A barely-there ambient bed for the pendulum-wave cavern. The marimba is an
   * A3-based (220 Hz) major-pentatonic ladder; this bed sits FAR below it — a
   * low open fifth (A1 55 + E2 82.4 Hz, with a soft A2 110 Hz warmth) that gives
   * the room a floor without ever reaching up into the mallet register.
   *
   * Pure procedural WebAudio (NO buffers → no loop seam ever). Two slow LFOs
   * (both an 8 s period): one breathes the dark low-pass open/closed, one swells
   * the master gain — the room's inhale/exhale. No rhythm, no melody, no
   * transient. Peak kept ≲ 0.06 so it never crowds the marimba. Deterministic:
   * the only randomness is tiny per-voice detune + LFO start phase from a seeded
   * mulberry32. Continuous — never self-stops; the master mute fades it.
   *
   * Called by the live page as PA.drone({ ctx, dest, seed }) (dur/when absent →
   * just starts and runs). Returns { stop(at) } — ramps down + tears the graph
   * out. The page starts it once, guarded, on the first sound-enabling gesture,
   * routed through the muted master so it fades in and honours the shared mute.
   * (art-specs/drone.md) */
  PA.drone = function ({ ctx, dest, dur, when = 0, seed = 1 }) {
    var t0 = ctx.currentTime + (when || 0);

    // ── Seeded PRNG (mulberry32) — deterministic, no Math.random ─────────────
    function mulberry32(a) {
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    var rng = mulberry32((seed | 0) || 1);

    var nodes = [];   // everything we create, for a clean teardown
    function track(n) { nodes.push(n); return n; }

    // ── The breathing floor: master gain the whole bed passes through ────────
    // Kept very low; a slow LFO adds a gentle swell on top of this base.
    var BASE_GAIN = 0.030;     // steady floor level
    var SWELL     = 0.014;     // ± amplitude breath (so peak ≈ 0.044 at the graph gain)
    var breath = track(ctx.createGain());
    breath.gain.setValueAtTime(BASE_GAIN, t0);
    breath.connect(dest);

    // ── Dark low-pass the whole cluster sits behind ──────────────────────────
    var lp = track(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(255, t0);
    lp.Q.setValueAtTime(0.6, t0);
    // A touch of high-pass to keep DC/rumble out without thinning the 55 Hz root.
    var hp = track(ctx.createBiquadFilter());
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(38, t0);
    hp.Q.setValueAtTime(0.5, t0);
    lp.connect(hp).connect(breath);

    // A phase-shifted sine LFO built as a single-harmonic PeriodicWave, so we can
    // offset a breath's phase WITHOUT a negative start time (offline currentTime
    // is 0). sin(θ+φ) = cos(φ)·sin θ + sin(φ)·cos θ → imag[1]=cos φ, real[1]=sin φ.
    function phasedSine(phaseCycles) {
      var phi = 2 * Math.PI * phaseCycles;
      var real = new Float32Array([0, Math.sin(phi)]);
      var imag = new Float32Array([0, Math.cos(phi)]);
      return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    }

    // ── LFO 1 → filter cutoff (opens/closes: dark → a touch brighter → dark) ─
    // 8 s period so the 8 s render is exactly one cycle (seamless clip loop).
    var LFO_HZ = 1 / 8;
    // Offset the two breaths so amplitude and colour don't peak together
    // (a subtle phase drift reads as living air, not a machine) — seeded.
    var filtPhase = 0.28 + 0.12 * rng();             // ~0.28–0.40 of a cycle ahead
    var filtLfo = track(ctx.createOscillator());
    filtLfo.setPeriodicWave(phasedSine(filtPhase));
    filtLfo.frequency.setValueAtTime(LFO_HZ, t0);
    var filtDepth = track(ctx.createGain());
    filtDepth.gain.setValueAtTime(75, t0);           // ±75 Hz around 255 → 180..330 Hz
    filtLfo.connect(filtDepth).connect(lp.frequency);
    filtLfo.start(t0);

    // ── LFO 2 → master swell (the amplitude inhale/exhale) ───────────────────
    var ampLfo = track(ctx.createOscillator());
    ampLfo.type = 'sine';
    ampLfo.frequency.setValueAtTime(LFO_HZ, t0);
    var ampDepth = track(ctx.createGain());
    ampDepth.gain.setValueAtTime(SWELL, t0);
    ampLfo.connect(ampDepth).connect(breath.gain);
    ampLfo.start(t0);

    // ── The voices: a low open fifth + soft octave ───────────────────────────
    // [freq, level, type, detuneCents-spread]. Root A1 carries; fifth & octave
    // are progressively softer so the chord stays a floor, not a feature.
    var voices = [
      [55.00, 1.00, 'sine',     3.5],   // A1 root
      [82.41, 0.62, 'sine',     3.0],   // E2 fifth
      [110.0, 0.34, 'triangle', 2.5],   // A2 octave (tri = a hair more body)
    ];
    var VOICE_TRIM = 0.9;               // overall trim into the filter

    voices.forEach(function (v) {
      var freq = v[0], level = v[1], type = v[2], spread = v[3];
      var vg = track(ctx.createGain());
      vg.gain.setValueAtTime(level * VOICE_TRIM, t0);
      vg.connect(lp);
      // Two detuned partners per voice → a slow chorus beat (living, not static).
      for (var k = 0; k < 2; k++) {
        var det = (k === 0 ? -1 : 1) * spread * (0.7 + 0.6 * rng());
        var o = track(ctx.createOscillator());
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        o.detune.setValueAtTime(det, t0);
        var og = track(ctx.createGain());
        og.gain.setValueAtTime(0.5, t0);
        o.connect(og).connect(vg);
        // No fade-in envelope: sine/triangle oscillators begin at a zero crossing
        // (phase 0), so a full-gain start produces no click — and the 8 s render
        // stays pure steady-state, so it loops seamlessly (the live page's master
        // mute supplies the actual start/stop fade).
        o.start(t0);
      }
    });

    function stop(at) {
      var w = (at != null ? at : ctx.currentTime);
      try {
        breath.gain.cancelScheduledValues(w);
        breath.gain.setValueAtTime(breath.gain.value, w);
        breath.gain.linearRampToValueAtTime(0.0001, w + 0.8);
      } catch (e) {}
      nodes.forEach(function (n) {
        if (typeof n.stop === 'function') { try { n.stop(w + 0.9); } catch (e) {} }
      });
      setTimeout(function () {
        nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
      }, 1200);
    }

    return { stop: stop };
  };

  window.PendulumArt = PA;
})();
