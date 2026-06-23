/* ═══════════════════════════════════════════════════════════════════════════
   timeofday.js  —  local-clock → day/dusk/night band  (window.Gate.timeofday)

   Two sources of "what band are we in?":
     1. AUTOMATIC — the visitor's local clock, run through Hours.solarAltitudeDeg
        (the estate's real solar geometry at Hours.ESTATE.latDeg). Classifier:
          alt ≥  6°  → 'day'
          -6° ≤ alt < 6° → 'dusk'   (civil-twilight band)
          alt <  -6° → 'night'
     2. MANUAL OVERRIDE — once the visitor taps the gnomon (or a ?t= URL pin is
        set), we stop reading the clock and step a manual state machine that
        cycles day → dusk → night → day on each advance().

   We DO use Hours for the classification + (later) the gnomon shadow, but NOT
   Hours.skyColor / Hours.brightness (the rejected whole-scene filter; floors at
   6%). Color = colormap palette-swap; brightness = colormap's own ladder.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var T = {};

  var BANDS = ['day', 'dusk', 'night'];

  // state: { band, manual } — manual===true means the clock is ignored.
  var state = { band: 'night', manual: false };
  var subs = [];

  function notify() {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](state.band, state.manual); } catch (e) {}
    }
  }

  /* dayOfYear (1..366) for a Date. */
  function dayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000;
    return Math.floor(diff / 86400000);
  }

  /* classify the visitor's local clock into a band via Hours' solar geometry. */
  T.classifyNow = function (now) {
    now = now || new Date();
    var Hours = root.Hours;
    if (!Hours || !Hours.solarAltitudeDeg || !Hours.ESTATE) {
      // Hours not present (shouldn't happen post-forge) → safe default by hour.
      var h = now.getHours();
      if (h >= 8 && h < 17) return 'day';
      if ((h >= 6 && h < 8) || (h >= 17 && h < 20)) return 'dusk';
      return 'night';
    }
    var doy = dayOfYear(now);
    var civilMin = now.getHours() * 60 + now.getMinutes();
    var alt = Hours.solarAltitudeDeg(Hours.ESTATE.latDeg, doy, civilMin);
    if (alt >= 6) return 'day';
    if (alt >= -6) return 'dusk';
    return 'night';
  };

  /* init(opts): opts.pin (a band string from ?t=) forces manual at that band;
     otherwise classify the local clock. Does NOT crossfade — the boot dispatcher
     reads T.band() and renders the first frame. */
  T.init = function (opts) {
    opts = opts || {};
    if (opts.pin && BANDS.indexOf(opts.pin) >= 0) {
      state.band = opts.pin;
      state.manual = true;       // a URL pin behaves like an override (skip clock)
    } else {
      state.band = T.classifyNow();
      state.manual = false;
    }
    return state.band;
  };

  T.band = function () { return state.band; };
  T.isManual = function () { return state.manual; };

  /* advance(): the gnomon-tap cycle. Flips into manual mode and steps to the next
     band (day→dusk→night→day). Returns the new band. Subscribers fire. */
  T.advance = function () {
    state.manual = true;
    var i = BANDS.indexOf(state.band);
    state.band = BANDS[(i + 1) % BANDS.length];
    notify();
    return state.band;
  };

  /* set(band): jump to a band manually (used by dev pins / programmatic control). */
  T.set = function (band) {
    if (BANDS.indexOf(band) < 0) return state.band;
    state.manual = true;
    state.band = band;
    notify();
    return state.band;
  };

  /* resume(): drop back to clock-driven mode (re-classify now). Not wired to UI
     yet but available; the gnomon only ever cycles forward. */
  T.resume = function () {
    state.manual = false;
    state.band = T.classifyNow();
    notify();
    return state.band;
  };

  /* onChange(fn): fn(band, manual) on every advance/set/resume. */
  T.onChange = function (fn) { if (typeof fn === 'function') subs.push(fn); };

  Gate.timeofday = T;

  if (typeof module !== 'undefined' && module.exports) { module.exports = T; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
