/* ═══════════════════════════════════════════════════════════════════════════
   weather.js  —  seeded-random weather + brass tri-toggle  (window.Gate.weather)

   HARD HOUSE RULE (PLAN §1): OFFLINE ONLY — NO network, NO geolocation. Weather
   is seeded-random by default (seedable via ?seed=), and the visitor can flip a
   brass tri-toggle (Clear / Cloudy / Storm) — the same interaction family as the
   gnomon. The chosen state drives colormap's weatherFactor → B.

   States: 'clear' | 'cloudy' | 'storm'.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var W = {};

  var STATES = ['clear', 'cloudy', 'storm'];
  var state = { weather: 'clear', manual: false };
  var subs = [];

  /* DRIFT (PLAN §7): when no ?wx= pin is active, weather not only STARTS random
     but slowly CHANGES — every ~DRIFT_MS a ~DRIFT_P chance to shift to a random
     DIFFERENT state. Gentle (4%/s ≈ a change every ~25s), and suppressed under
     prefers-reduced-motion. The timer just calls set(), so the boot's existing
     onChange handler (recolor + weatherfx + audio + wind) runs for free. */
  var DRIFT_MS = 1000;
  var DRIFT_P = 0.04;
  var driftTimer = null;     // setInterval handle (null when not drifting)
  var driftRng = Math.random; // replaced with a seeded PRNG when ?seed= is set

  function notify() {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](state.weather); } catch (e) {}
    }
  }

  /* mulberry32 — a tiny deterministic PRNG so ?seed= gives a stable weather. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* seeded pick — weighted toward clear/cloudy, storm rarer (estate restraint). */
  function pick(rng) {
    var r = rng();
    if (r < 0.45) return 'clear';
    if (r < 0.80) return 'cloudy';
    return 'storm';
  }

  /* reducedMotion(): one source of truth — defer to sequence.js if present
     (it owns the media-query check), else fall back to matchMedia directly. */
  function reducedMotion() {
    try {
      if (Gate.sequence && typeof Gate.sequence.prefersReducedMotion === 'function') {
        return Gate.sequence.prefersReducedMotion();
      }
      return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /* driftStep(): one ~1s tick. With DRIFT_P probability, shift to a random
     state DIFFERENT from the current one, via set() (which fires onChange). */
  function driftStep() {
    if (driftRng() >= DRIFT_P) return;
    // pick uniformly among the two states that aren't the current one
    var others = [];
    for (var i = 0; i < STATES.length; i++) {
      if (STATES[i] !== state.weather) others.push(STATES[i]);
    }
    if (!others.length) return;
    var next = others[Math.floor(driftRng() * others.length) % others.length];
    // drift is an ambient change, not a visitor choice — keep manual=false so a
    // later ?wx-less reload / programmatic logic can still tell it apart if it
    // ever cares. set() flips manual=true, so restore it afterward.
    var wasManual = state.manual;
    W.set(next);
    state.manual = wasManual;
  }

  /* startDrift(): begin the ambient drift (idempotent). */
  function startDrift() {
    stopDrift();
    if (typeof root.setInterval !== 'function') return;
    driftTimer = root.setInterval(driftStep, DRIFT_MS);
  }

  /* stopDrift(): halt the ambient drift cleanly. */
  function stopDrift() {
    if (driftTimer != null && typeof root.clearInterval === 'function') {
      root.clearInterval(driftTimer);
    }
    driftTimer = null;
  }

  /* init(opts): opts.pin (from ?wx=) forces a state; else seed the RNG from
     opts.seed (?seed=) or a time-derived seed and pick one. When unpinned and
     motion is allowed, also begin the ambient drift. */
  W.init = function (opts) {
    opts = opts || {};
    stopDrift(); // re-init is idempotent: never stack two timers
    if (opts.pin && STATES.indexOf(opts.pin) >= 0) {
      state.weather = opts.pin;
      state.manual = true;
      return state.weather; // pinned weather stays put — no drift
    }
    var seeded = (opts.seed != null && !isNaN(+opts.seed));
    var seed = seeded
      ? (+opts.seed >>> 0)
      : ((Date.now() / 60000) | 0); // changes ~once a minute when unseeded
    var rng = mulberry32(seed);
    state.weather = pick(rng);
    state.manual = false;
    // drift RNG: seeded (reproducible with ?seed=) when a seed is given — derived
    // from the seed so it doesn't reproduce the very same stream as the picker —
    // else a fresh per-load Math.random (no shared global other modules depend on).
    driftRng = seeded ? mulberry32(((+opts.seed >>> 0) ^ 0x9E3779B9) | 0) : Math.random;
    // suppress surprise changes under reduced-motion (PLAN §7)
    if (!reducedMotion()) startDrift();
    return state.weather;
  };

  W.weather = function () { return state.weather; };
  W.isStorm = function () { return state.weather === 'storm'; };

  /* set(w): the tri-toggle / programmatic set. Flips into manual mode. */
  W.set = function (w) {
    if (STATES.indexOf(w) < 0) return state.weather;
    state.manual = true;
    state.weather = w;
    notify();
    return state.weather;
  };

  W.STATES = STATES;
  W.onChange = function (fn) { if (typeof fn === 'function') subs.push(fn); };

  /* drift controls — exposed so the drift can be stopped/started cleanly
     (e.g. a settings toggle, or a test). startDrift() is idempotent. */
  W.stopDrift = stopDrift;
  W.startDrift = startDrift;
  W.isDrifting = function () { return driftTimer != null; };

  Gate.weather = W;

  if (typeof module !== 'undefined' && module.exports) { module.exports = W; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
