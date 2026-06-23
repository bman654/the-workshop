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

  /* init(opts): opts.pin (from ?wx=) forces a state; else seed the RNG from
     opts.seed (?seed=) or a time-derived seed and pick one. */
  W.init = function (opts) {
    opts = opts || {};
    if (opts.pin && STATES.indexOf(opts.pin) >= 0) {
      state.weather = opts.pin;
      state.manual = true;
      return state.weather;
    }
    var seed = (opts.seed != null && !isNaN(+opts.seed))
      ? (+opts.seed >>> 0)
      : ((Date.now() / 60000) | 0); // changes ~once a minute when unseeded
    var rng = mulberry32(seed);
    state.weather = pick(rng);
    state.manual = false;
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

  Gate.weather = W;

  if (typeof module !== 'undefined' && module.exports) { module.exports = W; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
