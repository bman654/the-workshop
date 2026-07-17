/* calendar-gate.js - THE GATE'S SEASONS (E1-E8, DESIGN 9.2/9.3/9.5/9.6).
   Extends the Calendar object calendar.js already made with the gate-only
   curves: foliage turn, cool cast, bare-winter ramp, precip phase, wildlife.
   PURE (1.1): no Date.now / Math.random / storage / DOM. A SEPARATE IIFE -
   the helpers are local verbatim PORTS; under Node the require cache hands
   back calendar.js's own instance, so twin and page share one object. */

(function (root) {
  'use strict';
  var Calendar = (typeof module !== 'undefined' && module.exports)
                   ? require('./calendar.js')     // Node: the SAME instance the twin has
                   : root.Calendar;               // browser: the inlined global
  Calendar.gate = Calendar.gate || {};

  // local helper PORTS of calendar.js's private idioms (gate r2 impl-m1):
  var TAU = Math.PI * 2;
  function wrap(p){ return ((p % 1) + 1) % 1; }
  function S(a, b, x){ x = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return x * x * (3 - 2 * x); }
  function mix(a, b, t){ return a + (b - a) * t; }
  function bell(p, c, w){ var d = Math.abs(p - c); d = Math.min(d, 1 - d);
    return d >= w ? 0 : 0.5 * (1 + Math.cos(Math.PI * d / w)); }
  function dz(v){ return v < 0.004 ? 0 : v; }               // the identity dead-zone
  function trip(hex){ hex = String(hex).replace('#','');    // '#rrggbb' -> [r,g,b]
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16),
            parseInt(hex.slice(4,6),16)]; }

  var COOL_CAST = '#aebfd8', GRASS_STRAW = '#9a8a5c';       // authored ONCE, here

  // the 9.3 anchor table, trip()'d once at load - hex lives only here:
  var FOLIAGE = [
    [0.000,'#5e5444',.80],[0.060,'#7d9052',.45],[0.125,'#66984c',.15],
    [0.250,'#4f7b3a',.00],[0.375,'#74853f',.18],[0.500,'#a87c3e',.45],
    [0.625,'#a2582c',.78],[0.750,'#6b5a42',.85],[0.875,'#575046',.85]
  ].map(function (r) { return { p: r[0], rgb: trip(r[1]), mix: r[2] }; });

  // the walk (2.3 family): one smoothstep leg between adjacent anchors, shared
  // endpoints, wrapped (0.875 -> 0.000 across p = 1). UNROUNDED float triples.
  function foliageWalk(p) {
    p = wrap(p);
    var n = FOLIAGE.length, i = 0;
    while (i < n - 1 && FOLIAGE[i + 1].p <= p) i++;    
    var a = FOLIAGE[i], b = FOLIAGE[(i + 1) % n];
    var span = (i === n - 1) ? (1 - a.p) : (b.p - a.p);
    var t = S(0, 1, (p - a.p) / span);
    return { rgb: [ mix(a.rgb[0], b.rgb[0], t), mix(a.rgb[1], b.rgb[1], t),
                    mix(a.rgb[2], b.rgb[2], t) ],
             mix: mix(a.mix, b.mix, t) };
  }

  // 9.3's literal bare ramp - the fall / bare / leaf-out ramps:
  function bareK(p){ p = wrap(p);
    if (p >= 0.66 && p < 0.82) return S(0.66, 0.82, p);     // the fall
    if (p >= 0.82 || p < 0.02) return 1;                    // bare
    if (p < 0.10) return 1 - S(0.02, 0.10, p);              // leaf-out
    return 0;                                               // in leaf (dz-snapped)
  }

  Calendar.gate.season = function (phase) {
    var p = wrap(phase);
    var f = foliageWalk(p);
    var fmix = dz(f.mix);
    return {
      foliage:  { rgb: f.rgb, mix: fmix },
      grassMix: dz(0.45 * fmix),
      cool:     dz((1 - Math.sin(TAU * p)) / 2),
      bare:     dz(bareK(p)),
      snow:     dz(Calendar.dressing(p).snow),
      cast:     trip(COOL_CAST),
      straw:    trip(GRASS_STRAW)
    };
  };

  // 9.5 - precip phase from the shared winter (r19 bell, center .80, width .16):
  // the solstice lands SNOW (bell(0.75) ~ 0.77); sleet at the cold edges.
  Calendar.gate.precipKind = function (phase) {
    var s = Calendar.dressing(phase).snow;
    return s >= 0.5 ? 'snow' : s >= 0.04 ? 'sleet' : 'rain';
  };

  // 9.6 - the wildlife register (E5): crickets window + winter birdsong thin.
  Calendar.gate.wildlife = function (phase) {
    var p = wrap(phase);
    return {
      crickets: (p > 0.21 && p < 0.60),
      birdK: 1 + 1.4 * bell(p, 0.86, 0.20)
    };
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = Calendar; }
}(this));
