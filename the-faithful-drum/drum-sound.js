/* ============================================================================
   drum-sound.js — the OPTIONAL sound bed for The Faithful Drum (ambience only).

   FINAL (foundry synth) — base = TAKE 1 "the dry wooden spindle", the judges'
   consensus winner (soft separated ticks, clear chime, honestly-low ambient level),
   with THREE conservative grafts the judges called out from take 2:
     • a rotation WOBBLE/tremolo whose rate rides the true slit-passing rate and
       whose depth fades in with speed — the bed audibly TURNS instead of droning;
     • a slightly-detuned INHARMONIC overtone (×2.02) on the whir for turned-wood
       warmth;
     • per-slit ticks placed by INTEGRATING the true slit phase (so they accelerate
       into the lock) while KEEPING take 1's gentle ~4/s lock cadence + low level.

   Direction: a zoetrope's wooden bearing heard from across a quiet room. The whir
   is not a buzzing oscillator but the warm, breathy, slightly-detuned hum of a
   wooden spindle turning in its socket — soft triangle-ish partials way down low,
   an inharmonic body overtone, a lowpassed "air" of the drum's rotation over them,
   a gentle rotation wobble, and its pitch riding |omega| so the room can hear the
   wheel speed up and settle. The per-slit tick is a woody TOCK: a very short
   lowpassed noise chiff (the paper slit passing the sight) plus a fast damped low
   resonance (the wooden rib knocking) — never a bright electronic click. The
   catch-chime is two gentle wooden marimba-ish notes (a soft two-note "it caught").

   This file is DUAL-USE:
     • window.DrumSound  — the live shipping API (unlock/bindOmega/tick/lock),
       silent until a gesture, honours the shared mute, steers off live omega.
     • Gate.sfx['drum-sound'] — an OFFLINE builder the foundry SFX bench renders:
       it plays the SAME voice functions on an OfflineAudioContext, scripting a
       4 s scene (whir spins up into the lock band and holds, ticks fall at the
       lock cadence, one catch-chime at lock entry) so the judge hears the graph
       that actually ships. Both paths call the same scheduleTick/scheduleChime.

   HOUSE RULES honoured:
     • silent until a real user gesture — no AudioContext at module load; the live
       ctx is created lazily inside unlock().
     • respects the ONE shared mute — the whir gain is driven to 0 when muted, and
       tick()/lock() no-op while muted.
     • ambience, never a claim — whir gain ≤ ~0.05, ticks ~0.012, chime ~0.03.
   ============================================================================ */
"use strict";
(function (root) {

  // ── deterministic PRNG (mulberry32) — no Math.random, so the rendered graph
  //    the analysis verifies is the graph that ships. ─────────────────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Small shared noise buffer (mono, ~0.3 s) used to carve the tick's chiff and
  // the whir's breath. Cached per-ctx so the live path builds it once.
  function noiseBuffer(ctx, rnd) {
    var n = Math.max(1, Math.floor(ctx.sampleRate * 0.35));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) { d[i] = rnd() * 2 - 1; }
    return buf;
  }

  // ── VOICE 1: the wooden bearing WHIR ────────────────────────────────────────
  // Two low detuned triangle partials + a lowpassed breath of noise, summed into
  // one gain (`whirGain`) and one master lowpass whose cutoff also rides speed so
  // the timbre opens as the wheel turns faster. Returns handles the caller steers.
  function buildWhir(ctx, dest, rnd) {
    var whirGain = ctx.createGain();
    whirGain.gain.value = 0.0;

    // master tone-shaping lowpass — warm, wood, no fizz
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.6;
    lp.connect(whirGain);
    whirGain.connect(dest);

    // two detuned triangles: the hum of the spindle. Triangle (not saw) => far
    // fewer harsh upper harmonics; the pair beats slowly for a living, wooden body.
    var oscA = ctx.createOscillator(); oscA.type = 'triangle';
    var oscB = ctx.createOscillator(); oscB.type = 'triangle';
    oscA.detune.value = -6; oscB.detune.value = +7;
    var oscG = ctx.createGain(); oscG.gain.value = 0.6;
    oscA.connect(oscG); oscB.connect(oscG); oscG.connect(lp);

    // a faint sub an octave down for body/mass (kept low so it never booms)
    var sub = ctx.createOscillator(); sub.type = 'sine';
    var subG = ctx.createGain(); subG.gain.value = 0.28;
    sub.connect(subG); subG.connect(lp);

    // a slightly-detuned INHARMONIC overtone (×2.02, not a clean octave) — the
    // turned-wood body resonance that gives the spindle its warmth (grafted from
    // take 2). Quiet; rolled off by the master lowpass like the rest.
    var over = ctx.createOscillator(); over.type = 'triangle';
    var overG = ctx.createGain(); overG.gain.value = 0.16;
    over.connect(overG); overG.connect(lp);

    // breath: lowpassed noise, the air of a wheel rotating. Very low, adds "wood".
    var breathSrc = ctx.createBufferSource();
    breathSrc.buffer = noiseBuffer(ctx, rnd); breathSrc.loop = true;
    var breathLP = ctx.createBiquadFilter();
    breathLP.type = 'lowpass'; breathLP.frequency.value = 240; breathLP.Q.value = 0.4;
    var breathG = ctx.createGain(); breathG.gain.value = 0.10;
    breathSrc.connect(breathLP).connect(breathG).connect(lp);

    // ROTATION WOBBLE (grafted from take 2): a slow sine tremolo whose RATE we set
    // to the slit-passing rate and whose DEPTH fades in with speed, so the bed
    // feels like it is TURNING (not a static drone) — and is dead-steady at rest.
    // Modulates whirGain.gain around its steered value; kept a gentle ±depth.
    var wobble = ctx.createOscillator(); wobble.type = 'sine';
    wobble.frequency.value = 3;
    var wobbleDepth = ctx.createGain(); wobbleDepth.gain.value = 0.0;
    wobble.connect(wobbleDepth).connect(whirGain.gain);

    return {
      whirGain: whirGain, lp: lp,
      oscA: oscA, oscB: oscB, sub: sub, over: over, breathSrc: breathSrc, breathLP: breathLP,
      wobble: wobble, wobbleDepth: wobbleDepth,
      start: function (t) {
        oscA.start(t); oscB.start(t); sub.start(t); over.start(t);
        breathSrc.start(t); wobble.start(t);
      },
      // set the pitch (fundamental Hz) at time t, gliding not zippering
      setHz: function (hz, t, glide) {
        oscA.frequency.setTargetAtTime(hz, t, glide);
        oscB.frequency.setTargetAtTime(hz, t, glide);
        sub.frequency.setTargetAtTime(hz * 0.5, t, glide);
        over.frequency.setTargetAtTime(hz * 2.02, t, glide);
        // open the tone slightly as it speeds up (cutoff tracks hz)
        breathLP.frequency.setTargetAtTime(200 + hz * 1.1, t, glide);
        lp.frequency.setTargetAtTime(260 + hz * 1.6, t, glide);
      },
      setGain: function (g, t, glide) { whirGain.gain.setTargetAtTime(g, t, glide); },
      // steer the rotation wobble: rate = slit-passing Hz, depth fades in with speed.
      setWobble: function (rateHz, depth, t, glide) {
        wobble.frequency.setTargetAtTime(Math.min(14, Math.max(0.3, rateHz)), t, glide);
        wobbleDepth.gain.setTargetAtTime(Math.max(0, depth), t, glide);
      }
    };
  }

  // whir pitch/gain mapping from |omega| (rad/s). Shared by live + offline paths
  // so both hear the same speed→pitch law. Kept LOW and warm.
  function whirHz(absOmega) { return 46 + absOmega * 5.5; }               // ~46 Hz at rest → glides up
  function whirTargetGain(absOmega, muted) {
    if (muted) return 0;
    return Math.min(0.044, 0.005 + absOmega * 0.005);                     // fades in with speed, capped
  }

  // Slit geometry — the drum's slit count. The slit-passing rate (Hz) is what the
  // per-slit tick and the rotation wobble ride, so both are tied to TRUE geometry.
  var SLITS = 12;
  function slitRateHz(absOmega) { return (absOmega / (2 * Math.PI)) * SLITS; } // crossings/sec
  // rotation-wobble depth as a FRACTION of the whir gain — fades in with speed so
  // the bed is dead-steady at rest and gently "turns" at the lock band. Grafted
  // from take 2's tremolo, kept subtle (never dominates the ambient bed).
  function wobbleDepthFor(absOmega, whirG) {
    return Math.min(0.09, absOmega * 0.02) * whirG;                       // ±(≤9%) of level
  }

  // ── VOICE 2: the per-slit woody TOCK ────────────────────────────────────────
  // Scheduled at absolute time `t` on `ctx`, output to `dest`. Two elements:
  //   (a) a very short lowpassed noise chiff — the paper slit brushing past;
  //   (b) a fast-damped low resonant sine "tock" — the wooden rib knocking.
  // absOmega optionally brightens the chiff a touch at higher speed. Soft, ~0.012.
  function scheduleTick(ctx, dest, t, absOmega, rnd, sharedNoise) {
    var sp = absOmega || 0;

    // (a) chiff — lowpassed noise burst, tiny
    var src = ctx.createBufferSource();
    src.buffer = sharedNoise || noiseBuffer(ctx, rnd || mulberry32(7));
    var off = 0;
    if (src.buffer.length > 1) off = Math.floor((rnd ? rnd() : 0.3) * (src.buffer.length - 400));
    var chLP = ctx.createBiquadFilter();
    chLP.type = 'lowpass';
    chLP.frequency.setValueAtTime(900 + Math.min(600, sp * 22), t);      // stays woody, not bright
    chLP.Q.setValueAtTime(0.8, t);
    var chG = ctx.createGain();
    chG.gain.setValueAtTime(0.0, t);
    chG.gain.linearRampToValueAtTime(0.010, t + 0.003);
    chG.gain.exponentialRampToValueAtTime(0.0004, t + 0.045);
    chG.gain.setValueAtTime(0, t + 0.05);
    src.connect(chLP).connect(chG).connect(dest);
    try { src.start(t, off / ctx.sampleRate, 0.06); } catch (e) { src.start(t); }
    try { src.stop(t + 0.07); } catch (e2) {}

    // (b) tock — a low resonant sine that drops quickly: the rib seating. Woody
    //     pitch ~200 Hz, a hair of upward-then-down glide for a knock, not a beep.
    var tk = ctx.createOscillator(); tk.type = 'sine';
    var thz = 210 + sp * 1.5;
    tk.frequency.setValueAtTime(thz * 1.6, t);
    tk.frequency.exponentialRampToValueAtTime(thz, t + 0.022);
    var tkG = ctx.createGain();
    tkG.gain.setValueAtTime(0.0, t);
    tkG.gain.linearRampToValueAtTime(0.014, t + 0.003);
    tkG.gain.exponentialRampToValueAtTime(0.0004, t + 0.075);
    tk.connect(tkG).connect(dest);
    tk.start(t); tk.stop(t + 0.09);
  }

  // ── VOICE 3: the two-note wooden CATCH-CHIME ────────────────────────────────
  // Two soft marimba-ish notes (a perfect fifth, warm sines with a woody 3rd
  // partial and a fast body-thump) — "there — it caught." Faint, ~0.03 peak.
  function scheduleChime(ctx, dest, t0) {
    // a gentle wooden note: fundamental + a soft 3rd partial + short body, all sine
    function note(f, tStart, peak, decay) {
      // fundamental
      var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.setValueAtTime(f, tStart);
      var g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.0, tStart);
      g1.gain.linearRampToValueAtTime(peak, tStart + 0.008);
      g1.gain.exponentialRampToValueAtTime(0.0003, tStart + decay);
      o1.connect(g1).connect(dest);
      o1.start(tStart); o1.stop(tStart + decay + 0.05);
      // soft wooden overtone (a marimba's ~3rd partial), quieter + shorter
      var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f * 3.01, tStart);
      var g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0, tStart);
      g2.gain.linearRampToValueAtTime(peak * 0.32, tStart + 0.006);
      g2.gain.exponentialRampToValueAtTime(0.0003, tStart + decay * 0.5);
      o2.connect(g2).connect(dest);
      o2.start(tStart); o2.stop(tStart + decay * 0.5 + 0.05);
    }
    // two notes: a warm mid pair (A4 → E5-ish), the second a touch quieter/later
    note(523.25, t0, 0.020, 0.55);          // C5
    note(783.99, t0 + 0.11, 0.016, 0.62);   // G5 — the "caught" resolve
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE API — window.DrumSound
  // ════════════════════════════════════════════════════════════════════════════
  var ctx = null, whirVoice = null, omegaFn = null, started = false, liveNoise = null;
  var liveRnd = mulberry32(1);

  function ensure() {
    if (ctx) return ctx;
    try { ctx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) { return null; }
    return ctx;
  }

  var DrumSound = {};

  DrumSound.unlock = function () {
    if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    liveNoise = noiseBuffer(ctx, mulberry32(99));
    whirVoice = buildWhir(ctx, ctx.destination, liveRnd);
    whirVoice.start(ctx.currentTime);
    started = true;
    stepWhir();
  };

  DrumSound.bindOmega = function (fn) { omegaFn = fn; };

  function stepWhir() {
    if (!started || !ctx || !whirVoice) return;
    var st = omegaFn ? omegaFn() : { omega: 0, muted: false };
    var sp = Math.abs(st.omega || 0);
    var t = ctx.currentTime;
    var g = whirTargetGain(sp, !!st.muted);
    whirVoice.setHz(whirHz(sp), t, 0.10);
    whirVoice.setGain(g, t, 0.14);
    // rotation wobble rides the slit-passing rate; depth fades in with speed and
    // goes to 0 when muted, so a muted or resting bed does not wobble.
    whirVoice.setWobble(slitRateHz(sp), st.muted ? 0 : wobbleDepthFor(sp, g), t, 0.18);
    if (root.requestAnimationFrame) root.requestAnimationFrame(stepWhir);
  }

  DrumSound.tick = function (absOmega) {
    if (!started || !ctx) return;
    var st = omegaFn ? omegaFn() : null;
    if (st && st.muted) return;
    scheduleTick(ctx, ctx.destination, ctx.currentTime, Math.abs(absOmega || 0), liveRnd, liveNoise);
  };

  DrumSound.lock = function () {
    if (!started || !ctx) return;
    var st = omegaFn ? omegaFn() : null;
    if (st && st.muted) return;
    scheduleChime(ctx, ctx.destination, ctx.currentTime + 0.01);
  };

  root.DrumSound = DrumSound;

  // ════════════════════════════════════════════════════════════════════════════
  // OFFLINE BENCH BUILDER — Gate.sfx['drum-sound']
  // Scripts the SAME voices into a 4 s scene so the foundry can render + judge it:
  //   • whir spins up from rest into the lock band over ~1.6 s, then holds;
  //   • the catch-chime fires once at the moment of lock entry (~1.7 s);
  //   • per-slit ticks begin at lock and fall at a gentle steady cadence.
  // ════════════════════════════════════════════════════════════════════════════
  var Gate = root.Gate = root.Gate || {};
  Gate.sfx = Gate.sfx || {};

  Gate.sfx['drum-sound'] = function (opts) {
    var octx = opts.ctx, dest = opts.dest;
    var dur = opts.dur == null ? 4 : opts.dur;
    var when = opts.when == null ? 0 : opts.when;
    var seed = opts.seed == null ? 1 : opts.seed;
    var t0 = octx.currentTime + when;
    var rnd = mulberry32((seed >>> 0) || 1);
    var sharedNoise = noiseBuffer(octx, mulberry32(((seed >>> 0) || 1) ^ 0x9e37));

    // scene timeline (seconds, relative to t0)
    var spinEnd = 1.6;                 // reach lock speed here
    var lockAt = 1.7;                  // the catch happens
    var lockOmega = 9.0;               // rad/s at the lock band (steady)

    // omega(t): rest → ease-out ramp into the lock band by spinEnd, then hold.
    function omegaAt(tt) {
      var frac = Math.min(1, tt / spinEnd);
      var eased = 1 - (1 - frac) * (1 - frac);   // ease-out settle
      return eased * lockOmega;
    }

    // WHIR: build it and script the omega ramp → pitch/gain/wobble automation.
    var whir = buildWhir(octx, dest, rnd);
    whir.start(t0);
    // sample the ramp at small steps so setTargetAtTime glides like the live rAF.
    var step = 0.05;
    for (var tt = 0; tt <= dur; tt += step) {
      var sp = omegaAt(tt);
      var at = t0 + tt;
      var g = whirTargetGain(sp, false);
      whir.setHz(whirHz(sp), at, 0.10);
      whir.setGain(g, at, 0.14);
      // rotation wobble rides the true slit-passing rate; depth fades in with speed
      // — the bed audibly TURNS as the wheel comes up to lock (graft from take 2).
      whir.setWobble(slitRateHz(sp), wobbleDepthFor(sp, g), at, 0.18);
    }

    // CATCH-CHIME once at lock entry.
    scheduleChime(octx, dest, t0 + lockAt);

    // PER-SLIT TICKS placed by INTEGRATING the TRUE slit phase (graft from take 2),
    // so the ticks are physically tied to slit geometry and ACCELERATE as the wheel
    // spins up. To keep take 1's winning GENTLE, legible lock cadence (~4/s, not a
    // dense buzz), we voice one audible tock every TICK_EVERY slit-crossings: at the
    // lock band slitRate ≈ 9/(2π)·12 ≈ 17/s, so every 4th crossing ≈ 4.2/s. The
    // rhythm therefore quickens smoothly into the lock and settles to the gentle
    // tick-tick-tick the brief asks for — a more physical tick than a fixed metronome.
    var TICK_EVERY = 4;
    var crossings = 0, emitted = 0;
    var phase = 0;                                   // fraction of one slit crossed
    var integ = 0.005;                               // fine integration step (s)
    var tickStart = lockAt - 0.9;                    // start ticking as it nears lock
    for (var s = tickStart; s < dur - 0.09; s += integ) {
      if (s < 0) continue;
      var spNow = omegaAt(s);
      phase += slitRateHz(spNow) * integ;
      while (phase >= 1) {
        phase -= 1;
        crossings++;
        if (crossings % TICK_EVERY === 0) {
          var jitter = (rnd() - 0.5) * 0.010;        // ±5 ms humanising — never metronomic
          scheduleTick(octx, dest, t0 + s + jitter, spNow, rnd, sharedNoise);
          emitted++;
        }
      }
    }

    // Fade the whir + wobble out at the very end so the render doesn't click on stop.
    whir.setGain(0.0, t0 + dur - 0.08, 0.03);
    whir.setWobble(1, 0.0, t0 + dur - 0.08, 0.03);

    return {
      stop: function (at) {
        var w = at != null ? at : octx.currentTime;
        try {
          whir.oscA.stop(w); whir.oscB.stop(w); whir.sub.stop(w);
          whir.over.stop(w); whir.breathSrc.stop(w); whir.wobble.stop(w);
        } catch (e) {}
      }
    };
  };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
