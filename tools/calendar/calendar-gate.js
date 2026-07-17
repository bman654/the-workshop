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
    [0.625,'#a2582c',.78],[0.750,'#7a5f3e',.85],[0.875,'#6f5f46',.85]
  ].map(function (r) { return { p: r[0], rgb: trip(r[1]), mix: r[2] }; });
  // r24: the two deep-winter anchors re-aimed WARM (0.750 #6b5a42->#7a5f3e spent
  // copper-tan, 0.875 #575046->#6f5f46 weathered held-leaf). In deep winter every
  // tree canopy is OFF (9.3 r24 binary law), so these anchors are worn only by the
  // bushes, the tufts, and the marc-leaf marks - they must read as dead LEAF/twig,
  // brown/tan, never grey-green. Touched legs peak <= ~1.4/channel/day, far under
  // the s9b caps; the budbreak leg (4.09) remains the sweep maximum.

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

  // r24 - the two NEW pure curves (twin-tested like every other, 9.8):
  // groundSnowCover: how much of the ground is WHITE (9.4). A smoothstep of the
  // shared snow bell - 0 at snow <= .04 (exactly where precipKind leaves 'rain', so
  // white ground never lies under plain rain), saturating to 1.0 at snow >= .62
  // (both deep-winter cells - Jan-30 snow .672, solstice .769 - land FULL cover;
  // Dec-5's .343 lands ~.53, a half-covered shoulder). dz keeps midsummer exact.
  Calendar.gate.groundSnowCover = function (snow) {
    return dz(S(0.04, 0.62, +snow || 0));
  };
  // springK: the flowering bell (9.4-spring) - center .09 (~ Apr 22), width .085,
  // nonzero on (0.005, 0.175) ~ Mar 22 - May 24. Disjoint from the snow envelope
  // (0.64, 0.96) by construction - snow and bloom can never co-occur - and its
  // upper edge sits ~27 days clear of the midsummer pin (phase 0.25040).
  function springK(p){ return dz(bell(p, 0.09, 0.085)); }

  Calendar.gate.season = function (phase) {
    var p = wrap(phase);
    var f = foliageWalk(p);
    var fmix = dz(f.mix);        // NOT named `mix` - that name is the lerp helper above
    var sn = dz(Calendar.dressing(p).snow);        // 2.3's bell - echoed, never re-derived
    return {
      foliage:  { rgb: f.rgb, mix: fmix },
      grassMix: dz(0.45 * fmix),
      cool:     dz((1 - Math.sin(TAU * p)) / 2),
      bare:     dz(bareK(p)),
      snow:     sn,
      snowCover: Calendar.gate.groundSnowCover(sn),// r24 - the ground-whitening driver
      spring:   springK(p),                        // r24 - the flowering driver
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
