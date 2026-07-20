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

  // Storm-bed sub-bus levels (the duck in thunder() ramps these around).
  var RAIN_BUS = 0.78;     // the dominant masker — sits a touch under its old 0.85
  var WIND_BUS = 0.70;
  // Sidechain duck: how far the bed drops UNDER a strike so the clap+roll punch
  // a hole in the rain (the way real thunder does), then recovers. Verified
  // offline (layered storm render): clap peak ≈ +8.6 dB over the ducked-bed
  // peak, roll body ≈ +2.8 dB over the ducked bed, summed peak < 0 dBFS.
  var DUCK_RAIN_TO = 0.30; // rain ducks to ~38% (-8.3 dB) under the strike
  var DUCK_WIND_TO = 0.34; // wind ducks to ~49% (-6.3 dB)
  var DUCK_ATTACK  = 0.03; // fast drop so the bed is down by the time the clap body lands
  var DUCK_HOLD    = 0.70; // held under the crack + early roll
  var DUCK_RELEASE = 1.7;  // bed eases back up over the rolling tail

  // r25.2 (THE DUCK SURVIVES THE STRIKE): the level the rain bus was actually
  // STARTED at — the SINGLE AUTHORITY duckBed restores to (never the hardcoded
  // RAIN_BUS), so a strike can't shove a ducked sleet floor back up. Reset to the
  // safe shipped default on kill; also the initial value.
  A._rainLvl = RAIN_BUS;

  // ambient layer handles (each = { node, src } returned by a Gate.sfx builder,
  // routed through its own sub-bus gain so we can cross-fade independently).
  var amb = {
    rain:     null,   // { stop } + bus
    wind:     null,
    crickets: null,   // dusk creature texture
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

  // wind STRENGTH per weather: clear < cloudy < storm (matches the visual sway).
  function windStrengthFor(w) {
    if (w === 'storm') return 1.0;
    if (w === 'cloudy') return 0.5;
    return 0.2; // clear
  }
  // rain INTENSITY only exists in storm.
  function rainIntensityFor(w) { return w === 'storm' ? 0.9 : 0; }

  // the SEASON, read live (null off the calendar, like weatherNow/bandNow).
  function seasonNow() { try { return Gate.season || null; } catch (e) { return null; } }

  /* A.plan(band, w, season): ONE pure gating policy the selftest table-checks
     (§9.6). Numbers in, a truth-row out; every branch routes through it. */
  A.plan = function (band, w, season) {
    var storming = (w === 'storm');                        // the CLOUD
    var snowing  = storming && !!season && season.kind === 'snow';
    var sleeting = storming && !!season && season.kind === 'sleet';   // r24
    var wl = (season && season.wildlife) || { crickets: true, birdK: 1 };
    return {
      rain:   storming && !snowing,      // rain loop — snow-hush gate (E4)
      rainLvl: sleeting ? 0.15 : RAIN_BUS, // r25: the rain BUS LEVEL — DUCKED under
                                         // sleet (0.15) so the ticks read; plain rain
                                         // keeps the shipped RAIN_BUS (= 0.78) exactly
                                         // — SYMBOLIC (r25.1/#14) so the plan can never
                                         // drift from the code (§9.6, THE DUCK)
      sleet:  sleeting,                  // r24: the ice-tick bed RIDES ON the rain loop
      roll:   storming && !snowing,      // distant rolling thunder rides with it
      chimes: !storming,                 // chimes gate on the CLOUD, as shipped
      wind:   snowing ? 0.35             // snowfall STILLS the air (E4/B7): below
              : windStrengthFor(w),      // even cloudy .5 — quiet in FACT
      creature: storming ? null          // creatures gate on the CLOUD
              : band === 'day'  ? 'birds'
              : band === 'dusk' ? (wl.crickets ? 'crickets' : null)   // winter dusk silent
              : 'owl',                   // owls call year-round
      birdMin: Math.round(10 * wl.birdK),  // birdsong THINS: interval widens
      birdMax: Math.round(26 * wl.birdK),  //   (10–26 s → 24–62 s deep winter)
      thunder: !snowing                  // ENFORCED upstream at the strike (§9.5)
    };
  };

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
    // ONE plan per call (§9.6): every branch routes through it, so the
    // season/weather gating is a single table-checkable policy.
    var P = A.plan(bandNow(), weatherNow(), seasonNow());

    // RAIN — the storm loop, and NEVER under snowfall (the snow-hush gate, E4).
    // Started at the plan's bus level (r25: P.rainLvl — 0.15 ducked under sleet,
    // RAIN_BUS otherwise); record it so duckBed restores to THIS, not the constant
    // (r25.2 — THE DUCK SURVIVES THE STRIKE).
    if (P.rain) {
      A._rainLvl = P.rainLvl;
      startTexture('rain', 'rain', { intensity: rainIntensityFor(weatherNow()) }, P.rainLvl);
    } else {
      A._rainLvl = RAIN_BUS;
      killTexture('rain', 0.9);
    }

    // SLEET — the ice-tick bed (r24) rides OVER the ducked rain loop; storm-sleet
    // only. Bus 0.6 (r25 — was 0.5) so the ticks DOMINATE the barely-there wet floor.
    if (P.sleet) {
      startTexture('sleet', 'sleet', {}, 0.6);
    } else {
      killTexture('sleet', 0.8);
    }

    // WIND — always present; snowfall stills it to a low breath (P.wind, E4).
    startTexture('wind', 'wind', { strength: P.wind }, WIND_BUS);

    // WINDCHIMES — occasional, ONLY off the storm CLOUD.
    if (P.chimes) {
      scheduleSparse('chimes', 14, 34, function () {
        if (weatherNow() === 'storm') return;             // re-check at fire time
        playOnce('windchimes', { dur: 6 }, 0.5);
      });
    } else {
      clearSparse('chimes');
    }

    // DISTANT ROLLING THUNDER — with the rain family (P.roll); silent under snow.
    if (P.roll) {
      scheduleSparse('roll', 18, 40, function () {
        if (weatherNow() !== 'storm') return;
        playOnce('thunderroll', { dur: 5, distance: 'distant' }, 0.5);
      });
    } else {
      clearSparse('roll');
    }

    // CREATURE ROTATION — one voice, picked by band + gated on the CLOUD/season
    // (P.creature: 'birds'/'crickets'/'owl' or null — winter dusk silent). Each
    // fire re-checks weather+band verbatim.
    var creature = P.creature;

    // birdsong (day): the interval widens as winter thins the song (P.birdMin/Max).
    if (creature === 'birds') {
      scheduleSparse('birds', P.birdMin, P.birdMax, function () {
        if (weatherNow() === 'storm' || bandNow() !== 'day') return;
        playOnce('birdsong', { dur: 6 }, 0.6);
      });
    } else {
      clearSparse('birds');
    }

    // crickets (dusk): a quiet stationary bed, looped like rain/wind.
    if (creature === 'crickets') {
      startTexture('crickets', 'crickets', {}, 0.85);
    } else {
      killTexture('crickets', 0.9);
    }

    // owl (night): a sparse phrase of hoots on a long seeded interval.
    if (creature === 'owl') {
      scheduleSparse('owl', 16, 38, function () {
        if (weatherNow() === 'storm' || bandNow() !== 'night') return;
        playOnce('owl', { dur: 6 }, 0.7);
      });
    } else {
      clearSparse('owl');
    }
  };

  /* ── duckBed(): sidechain-duck the rain+wind beds under a strike, then release.
     This is the heart of the thunder mix: a clap's sustained energy is tiny next
     to the rain wash (energetic masking), so rather than push the clap into
     clipping we briefly drop the bed so the strike "punches a hole" in the rain
     and the rolling tail is heard as the body. The bus is ramped from its CURRENT
     value (so overlapping strikes don't fight) down to a fraction of its BASE
     level, held, then eased back to base. Only ducks a bed that is actually up. */
  function duckOne(key, baseLevel, duckTo) {
    var g = ambBus[key];
    if (!g) return;                  // bed not playing (e.g. not a storm) → skip
    var t = ctx.currentTime;
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(duckTo, t + DUCK_ATTACK);
      g.gain.setValueAtTime(duckTo, t + DUCK_ATTACK + DUCK_HOLD);
      g.gain.linearRampToValueAtTime(baseLevel, t + DUCK_ATTACK + DUCK_HOLD + DUCK_RELEASE);
    } catch (e) { try { g.gain.value = baseLevel; } catch (e2) {} }
  }
  function duckBed() {
    // r25.2: restore to the level the rain bus was STARTED at (A._rainLvl), never the
    // hardcoded RAIN_BUS, and duck TO the min so a strike can NEVER LIFT an already-
    // ducked floor (sleet: min(0.30, 0.15) = 0.15 — the bus holds FLAT through the
    // flash; plain rain: 0.78/0.30, bit-identical to the shipped surface). The duck is
    // down-only, by law (THE DUCK SURVIVES THE STRIKE, §9.6).
    duckOne('rain', A._rainLvl, Math.min(DUCK_RAIN_TO, A._rainLvl));
    duckOne('wind', WIND_BUS, DUCK_WIND_TO);
  }

  /* ── thunder(): clap NOW + rolling tail, with the bed ducked under it. Wired
     to the lightning flash edge. The clap punches through a hole ducked into the
     rain/wind; the boosted close roll follows as the strike's body. ─────────── */
  A.thunder = function () {
    if (!ctx) return;
    // duck the storm bed FIRST so the hole is opening as the clap lands...
    duckBed();
    // loud, present crack on the strike...
    playOnce('thunderclap', { dur: 2.5 }, 0.95);
    // ...with a close rolling tail (now boosted in its builder) as the body.
    playOnce('thunderroll', { dur: 5, distance: 'close' }, 0.95);
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
    stopTexture('crickets');
    clearSparse('chimes');
    clearSparse('roll');
    clearSparse('birds');
    clearSparse('owl');
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

  /* ── read-only QA probe: the current gain of ONE ambient sub-bus (or null if
     never built / faded out). The master hook can't tell rain from wind, so the
     snow-hush probe (§9.6) reads BUS truth: under snow rain null-or-≈0, wind > 0.
     No new bus, no new ws: key. ─────────────────────────────────────────────── */
  A._busGainValue = function (key) {
    return (ambBus[key] && ambBus[key].gain) ? ambBus[key].gain.value : null;
  };

  Gate.audio = A;

  if (typeof module !== 'undefined' && module.exports) { module.exports = A; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
