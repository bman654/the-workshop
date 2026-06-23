/* ═══════════════════════════════════════════════════════════════════════════
   audio.js  —  the CONDUCTOR + brass mute chip  (window.Gate.audio)

   The Gate's voice. Every sound is PROCEDURAL WebAudio (no binary assets); the
   per-sound builders live in Gate.sfx.* (audio-<name>.js, forge-included BEFORE
   this file) and run against the LIVE AudioContext through one master GainNode.

   MUTE is the hard gate: the shared estate flag (WS.muted) forces the master
   gain to 0; nothing routes around it. The chip is wired to WS from init() so a
   visitor's mute holds across the estate (cross-tab via WS.onMuteChange).

   The autoplay policy means we cannot make sound until a user gesture: unlock()
   runs on the first opening click — it creates/resumes the AudioContext, publishes
   window.__wsAudioCtx (so the WS chime can ride it), and starts the ambient bed.

   Conductor surface:
     init / muted / setMuted / toggle / onMuteChange   — the mute chip (kept intact)
     unlock()    — first click: ctx up + ambient bed for the current weather
     ambient()   — (re)evaluate ambient layers for weather × wind × time-of-day
     thunder()   — clap + rolling tail, fired on the lightning flash edge
     gears()     — clockwork bed during the open sequence's gears phase
     creak()     — hinge creak during the swing phase
     logoTune()  — the logo motif at the welcome reveal
     stopAll()   — tear everything down (navigate/teardown)
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var A = {};

  var muted = false;
  var muteSubs = [];

  /* ── mute chip (unchanged plumbing, now also drives the master gain) ─────── */
  A.init = function () {
    var WS = root.WS;
    muted = WS && WS.muted ? WS.muted() : false;
    if (WS && WS.onMuteChange) {
      WS.onMuteChange(function (on) {
        muted = on;
        applyMuteGain();
        for (var i = 0; i < muteSubs.length; i++) { try { muteSubs[i](on); } catch (e) {} }
      });
    }
    return muted;
  };

  A.muted = function () { return muted; };

  A.setMuted = function (v) {
    var WS = root.WS;
    if (WS && WS.setMuted) { WS.setMuted(!!v); }
    else {
      muted = !!v;
      applyMuteGain();
      for (var i = 0; i < muteSubs.length; i++) { try { muteSubs[i](muted); } catch (e) {} }
    }
    return muted;
  };

  A.toggle = function () { return A.setMuted(!muted); };
  A.onMuteChange = function (fn) { if (typeof fn === 'function') muteSubs.push(fn); };

  /* ═══════════════════════ WebAudio engine ════════════════════════════════ */

  var ctx = null;          // the live AudioContext
  var master = null;       // the ONE master GainNode — mute forces this to 0
  var MASTER_LEVEL = 0.9;  // unmuted master level (headroom under unity)

  // ambient layer handles (each = { node, src } returned by a Gate.sfx builder,
  // routed through its own sub-bus gain so we can cross-fade independently).
  var amb = {
    rain:  null,   // { stop } + bus
    wind:  null,
  };
  var ambBus = {};         // key -> GainNode sub-bus
  var ambLoopTimers = {};  // key -> setTimeout id (texture re-arm)
  var sparseTimers = {};   // key -> setTimeout id (windchimes / thunderroll / birds)
  var gearsHandle = null;
  var ambientSeed = 1;     // advanced per scheduled event for variety (deterministic-ish)

  function now() { return ctx ? ctx.currentTime : 0; }

  // master gain target: 0 when muted, MASTER_LEVEL otherwise.
  function applyMuteGain() {
    if (!ctx || !master) return;
    var target = muted ? 0 : MASTER_LEVEL;
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.04);
    } catch (e) {
      try { master.gain.value = target; } catch (e2) {}
    }
  }

  // ── current scene context (read live, never cached) ──────────────────────
  function weatherNow() {
    try { return (Gate.weather && Gate.weather.weather) ? Gate.weather.weather() : 'clear'; }
    catch (e) { return 'clear'; }
  }
  function bandNow() {
    try { return (Gate.timeofday && Gate.timeofday.band) ? Gate.timeofday.band() : 'day'; }
    catch (e) { return 'day'; }
  }
  function isDaytime() { return bandNow() === 'day'; }

  // wind STRENGTH per weather: clear < cloudy < storm (matches the visual sway).
  function windStrengthFor(w) {
    if (w === 'storm') return 1.0;
    if (w === 'cloudy') return 0.5;
    return 0.2; // clear
  }
  // rain INTENSITY only exists in storm.
  function rainIntensityFor(w) { return w === 'storm' ? 0.9 : 0; }

  /* ── unlock(): first opening click. Create/resume the ctx, publish it, build
     the master gain, start the ambient bed. Idempotent. ──────────────────── */
  A.unlock = function () {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      // Re-use an estate-shared ctx if one already exists; else create + publish.
      if (root.__wsAudioCtx && root.__wsAudioCtx instanceof AC) {
        ctx = root.__wsAudioCtx;
      } else {
        try { ctx = new AC(); } catch (e) { return; }
        root.__wsAudioCtx = ctx;
      }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_LEVEL;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' && ctx.resume) {
      try { ctx.resume(); } catch (e) {}
    }
    applyMuteGain();
    A.ambient();
  };

  /* ── a sub-bus for an ambient key, created lazily, routed into master. ──── */
  function busFor(key) {
    if (!ambBus[key]) {
      var g = ctx.createGain();
      g.gain.value = 0;          // fade in from silence
      g.connect(master);
      ambBus[key] = g;
    }
    return ambBus[key];
  }
  function fadeBus(key, to, secs) {
    var g = ambBus[key];
    if (!g) return;
    var t = ctx.currentTime;
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(to, t + (secs || 0.8));
    } catch (e) { try { g.gain.value = to; } catch (e2) {} }
  }

  // ── looping TEXTURE (rain / wind): build a dur-second stationary bed into the
  // key's sub-bus, then re-arm slightly before it ends so the bed is continuous.
  // The builder beds are stationary, so back-to-back tiling reads as continuous.
  function startTexture(key, builderName, opts, busLevel) {
    if (!ctx || !Gate.sfx || typeof Gate.sfx[builderName] !== 'function') return;
    var bus = busFor(key);
    var BED = 4.0;     // seconds per bed tile
    var LAP = 0.25;    // re-arm this many seconds before the tile ends

    function arm() {
      var built;
      try {
        built = Gate.sfx[builderName](Object.assign(
          { ctx: ctx, dest: bus, dur: BED, when: 0, seed: (ambientSeed++ & 0x7fffffff) || 1 },
          opts || {}
        ));
      } catch (e) { built = null; }
      amb[key] = built;
      // re-arm before this tile finishes (continuous loop) — cleared by stop.
      ambLoopTimers[key] = root.setTimeout(arm, Math.max(200, (BED - LAP) * 1000));
    }
    // stop any prior tile loop for this key first.
    stopTexture(key);
    arm();
    fadeBus(key, busLevel == null ? 1 : busLevel, 0.9);
  }
  function stopTexture(key) {
    if (ambLoopTimers[key]) { root.clearTimeout(ambLoopTimers[key]); ambLoopTimers[key] = null; }
    if (amb[key] && amb[key].stop) { try { amb[key].stop(now() + 0.05); } catch (e) {} }
    amb[key] = null;
  }
  function killTexture(key, fadeSecs) {
    // cross-fade the bus down, then tear down the source loop.
    if (ambBus[key]) fadeBus(key, 0, fadeSecs || 0.8);
    if (ambLoopTimers[key]) { root.clearTimeout(ambLoopTimers[key]); ambLoopTimers[key] = null; }
    var h = amb[key];
    amb[key] = null;
    root.setTimeout(function () { if (h && h.stop) { try { h.stop(); } catch (e) {} } },
      Math.ceil((fadeSecs || 0.8) * 1000) + 60);
  }

  // ── sparse SCHEDULED one-shots on a seeded long interval (chimes/roll/birds).
  function scheduleSparse(key, minSec, maxSec, fire) {
    clearSparse(key);
    function step() {
      // re-check gating each time it fires; the dispatcher (fire) decides whether
      // to actually play (weather/band may have changed) and returns nothing.
      try { fire(); } catch (e) {}
      var span = minSec + Math.random() * (maxSec - minSec);
      sparseTimers[key] = root.setTimeout(step, span * 1000);
    }
    // first occurrence after an initial delay so it doesn't stack on the open.
    var first = minSec * 0.6 + Math.random() * (maxSec - minSec) * 0.5;
    sparseTimers[key] = root.setTimeout(step, first * 1000);
  }
  function clearSparse(key) {
    if (sparseTimers[key]) { root.clearTimeout(sparseTimers[key]); sparseTimers[key] = null; }
  }

  // play a transient builder once into a short-lived bus under master.
  function playOnce(builderName, opts, busLevel) {
    if (!ctx || !Gate.sfx || typeof Gate.sfx[builderName] !== 'function') return null;
    var g = ctx.createGain();
    g.gain.value = busLevel == null ? 1 : busLevel;
    g.connect(master);
    var h = null;
    try {
      h = Gate.sfx[builderName](Object.assign(
        { ctx: ctx, dest: g, dur: (opts && opts.dur) || 3, when: 0, seed: (ambientSeed++ & 0x7fffffff) || 1 },
        opts || {}
      ));
    } catch (e) { h = null; }
    // self-disconnect after the sound's window (+tail) to avoid node buildup.
    var life = ((opts && opts.dur) || 3) + 2.5;
    root.setTimeout(function () { try { g.disconnect(); } catch (e) {} }, life * 1000);
    return h;
  }

  /* ── ambient(): the live ambient mixer. Re-evaluated on weather change. ──── */
  A.ambient = function () {
    if (!ctx) return;     // nothing until unlock()
    var w = weatherNow();
    var raining = (w === 'storm');

    // RAIN — only in storm, scaled by intensity. Cross-fade in/out.
    if (raining) {
      startTexture('rain', 'rain', { intensity: rainIntensityFor(w) }, 0.85);
    } else {
      killTexture('rain', 0.9);
    }

    // WIND — always present, strength clear < cloudy < storm.
    startTexture('wind', 'wind', { strength: windStrengthFor(w) }, 0.7);

    // WINDCHIMES — occasional, ONLY when NOT raining (clear / cloudy).
    if (!raining) {
      scheduleSparse('chimes', 14, 34, function () {
        if (weatherNow() === 'storm') return;             // re-check at fire time
        playOnce('windchimes', { dur: 6 }, 0.5);
      });
    } else {
      clearSparse('chimes');
    }

    // DISTANT ROLLING THUNDER — occasional, ONLY in storm, at a distant/quiet
    // level (distinct from the loud per-strike thunder() on the lightning edge).
    if (raining) {
      scheduleSparse('roll', 18, 40, function () {
        if (weatherNow() !== 'storm') return;
        playOnce('thunderroll', { dur: 5, distance: 'distant' }, 0.5);
      });
    } else {
      clearSparse('roll');
    }

    // BIRDSONG — ONLY in CLEAR weather during DAYTIME (silent at night/storm/rain).
    if (w === 'clear' && isDaytime()) {
      scheduleSparse('birds', 10, 26, function () {
        if (weatherNow() !== 'clear' || !isDaytime()) return;
        playOnce('birdsong', { dur: 6 }, 0.6);
      });
    } else {
      clearSparse('birds');
    }
  };

  /* ── thunder(): clap NOW + rolling tail. Wired to the lightning flash edge. ─ */
  A.thunder = function () {
    if (!ctx) return;
    // loud, present crack on the strike...
    playOnce('thunderclap', { dur: 2.5 }, 0.9);
    // ...with a close rolling tail underneath it.
    playOnce('thunderroll', { dur: 5, distance: 'close' }, 0.7);
  };

  /* ── gears(): clockwork bed during the gears phase; stop when it ends. ───── */
  A.gears = function () {
    if (!ctx) return;
    if (gearsHandle && gearsHandle.stop) { try { gearsHandle.stop(); } catch (e) {} }
    // a generous bed covering the 2.5s gears phase (+a little); stopGears ends it.
    gearsHandle = playOnce('gears', { dur: 3.0 }, 0.85);
  };
  A.stopGears = function () {
    if (gearsHandle && gearsHandle.stop) { try { gearsHandle.stop(now() + 0.05); } catch (e) {} }
    gearsHandle = null;
  };

  /* ── creak(): the hinge creak during the swing phase. ────────────────────── */
  A.creak = function () {
    if (!ctx) return;
    playOnce('creak', { dur: 2.5 }, 0.9);
  };

  /* ── logoTune(): the logo motif once at the welcome reveal. ──────────────── */
  A.logoTune = function () {
    if (!ctx) return;
    playOnce('logotune', { dur: 4 }, 0.95);
  };

  /* ── stopAll(): stop + disconnect everything (navigate/teardown). ────────── */
  A.stopAll = function () {
    stopTexture('rain');
    stopTexture('wind');
    clearSparse('chimes');
    clearSparse('roll');
    clearSparse('birds');
    A.stopGears();
    var k;
    for (k in ambBus) { if (ambBus[k]) { try { ambBus[k].disconnect(); } catch (e) {} } }
    ambBus = {};
    if (master) {
      try {
        master.gain.cancelScheduledValues(now());
        master.gain.setValueAtTime(0, now());
      } catch (e) {}
    }
    // give scheduled tails a beat, then drop the master.
    var m = master;
    root.setTimeout(function () { if (m) { try { m.disconnect(); } catch (e) {} } }, 200);
  };

  /* ── read-only QA probe: the current master-gain TARGET (mute gate). Returns
     null before unlock(). Lets the e2e harness assert mute forces the master to
     0 and unmute restores it — without reaching into module internals. ─────── */
  A._masterGainValue = function () { return master ? master.gain.value : null; };

  Gate.audio = A;

  if (typeof module !== 'undefined' && module.exports) { module.exports = A; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
