/* ═══════════════════════════════════════════════════════════════════════════
   colormap.js  —  the Gate's PALETTE-SWAP lighting model  (window.Gate.colormap)

   PLAN §3: mood/color comes from a SWAPPED palette, NOT a whole-scene filter.
   The only "filter" is a single brightness scalar B that scales each swappable
   role color's luminance. Emissive GLOW colors are palette-immune & B-immune so
   lamps/windows/the moon glow THROUGH a dark storm night — the payoff.

   Contract (consumed by scene.js + the boot dispatcher):
     • PALETTES.{DAY,DUSK,NIGHT}  — maps of named ROLE → hex color.
     • GLOW                       — emissive roles, full intensity always.
     • resolve(band, B)           — { '--role': 'rgb(...)' , ... } for every role
                                    + every GLOW role, ready to write as CSS vars.
     • apply(rootEl, vars)        — writes the var map onto an element's style.
     • bandBase(band, moonK)      — the brightness floor for a band.
     • B(band, moonK, weather, flash) — the composite brightness scalar.
     • crossfade(rootEl, fromVars, toVars, ms, onDone) — JS-lerps role colors over
                                    ms, writing CSS vars each rAF frame (we do NOT
                                    rely on CSS custom-property transitions).

   Lit-from-above is a DRAW concern (scene.js puts the brightest highlight on each
   object's TOP edge); colormap only supplies the role colors + the dimmer.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var CM = {};

  /* ── color helpers (hex ⇄ rgb ⇄ hsl; luminance scaling in HSL-lightness) ──── */
  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbStr(r, g, b) {
    return 'rgb(' + Math.round(clamp(r, 0, 255)) + ',' +
      Math.round(clamp(g, 0, 255)) + ',' + Math.round(clamp(b, 0, 255)) + ')';
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  /* Scale a role color's LUMINANCE by B. We dim in HSL-lightness (a clean,
     perceptually-reasonable approach: pull L toward 0 by factor B, and bleed a
     touch of saturation out as it darkens so deep night reads desaturated/silvery
     rather than muddy-vivid). Returns an rgb() string. */
  function dim(hex, B) {
    var c = hexToRgb(hex);
    var hsl = rgbToHsl(c.r, c.g, c.b);
    var l = hsl.l * B;
    // as B drops, gently desaturate (night moonlight is low-chroma)
    var s = hsl.s * (0.55 + 0.45 * B);
    var out = hslToRgb(hsl.h, s, clamp(l, 0, 1));
    return rgbStr(out.r, out.g, out.b);
  }

  /* ── THE THREE HAND-AUTHORED PALETTES ──────────────────────────────────────
     Every swappable object reads var(--role). DAY = vivid/saturated; DUSK =
     washed-out rosy/yellow; NIGHT = subdued, silvery, cool moonlit. These are the
     AUTHORED base colors (B is applied at resolve-time, NOT baked in here). */
  var PALETTES = {
    DAY: {
      'sky.top':           '#3f7bd0',
      'sky.horizon':       '#bcd6ef',
      'manor.wall':        '#e9e2d2',
      'manor.roof':        '#7a5240',
      'manor.trim':        '#c9a24a',
      'observatory.dome':  '#5a6472',
      'observatory.body':  '#2b2f38',
      'greenhouse.frame':  '#3a4a44',
      'greenhouse.glass':  '#bfe0dc',
      'gate.iron':         '#2a2d36',
      'brass.stroke':      '#c9a24a',
      'brass.bright':      '#f0d489',
      'grass':             '#6f9b4e',
      'road':              '#c9b58e',
      'hill':              '#5d7e44',
      'tree.foliage':      '#4f7b3a',
      'tree.trunk':        '#5a4630',
      'stone':             '#9aa0a8',
      'mist':              '#dfe8f2',
      'rep.swatch1':       '#9aa0a8',
      'rep.swatch2':       '#9aa0a8',
      'rep.swatch3':       '#9aa0a8'
    },
    DUSK: {
      'sky.top':           '#3b3766',
      'sky.horizon':       '#e8a878',
      'manor.wall':        '#e3cbb0',
      'manor.roof':        '#6a4338',
      'manor.trim':        '#d8af5c',
      'observatory.dome':  '#5c5260',
      'observatory.body':  '#2a2730',
      'greenhouse.frame':  '#3c3a3c',
      'greenhouse.glass':  '#d3b59a',
      'gate.iron':         '#2a2630',
      'brass.stroke':      '#d8af5c',
      'brass.bright':      '#f4d999',
      'grass':             '#6e7a44',
      'road':              '#c6a982',
      'hill':              '#5a5a3c',
      'tree.foliage':      '#586537',
      'tree.trunk':        '#4f3c2c',
      'stone':             '#9a8e8a',
      'mist':              '#e7c6b0',
      'rep.swatch1':       '#9a8e8a',
      'rep.swatch2':       '#9a8e8a',
      'rep.swatch3':       '#9a8e8a'
    },
    NIGHT: {
      'sky.top':           '#0a1326',
      'sky.horizon':       '#2a3a55',
      'manor.wall':        '#aeb6c6',
      'manor.roof':        '#3a4150',
      'manor.trim':        '#8f8466',
      'observatory.dome':  '#3a4250',
      'observatory.body':  '#181c26',
      'greenhouse.frame':  '#222a30',
      'greenhouse.glass':  '#5a7280',
      'gate.iron':         '#14171f',
      'brass.stroke':      '#9c8350',
      'brass.bright':      '#cdb375',
      'grass':             '#3c4a50',
      'road':              '#5a5f6a',
      'hill':              '#2c3742',
      'tree.foliage':      '#2c3a40',
      'tree.trunk':        '#2a2620',
      'stone':             '#6a7079',
      'mist':              '#7c8aa0',
      'rep.swatch1':       '#6a7079',
      'rep.swatch2':       '#6a7079',
      'rep.swatch3':       '#6a7079'
    }
  };

  /* ── THE EMISSIVE SET — palette-IMMUNE, fixed vivid colors. ─────────────────
     Light SOURCES draw these parts from GLOW, so they stay vivid at night (the
     payoff) and naturally recede against a bright day sky. We expose a tiny
     day-recede so emissives don't overpower a bright daytime scene, but they are
     never DIMMED by B (a storm-night lamp still blazes). */
  var GLOW = {
    'lamp.flame':       '#ffd27a',
    'window.lit':       '#ffcf73',
    'moon.disc':        '#f2ead2',
    'sun.disc':         '#ffe9a8',
    'asterism.star':    '#f0d489',
    'asterism.line':    '#c9a24a',
    'cavern.maw':       '#7fd4c0',
    'undercroft.glow':  '#8a123a',
    'arcade.screen':    '#37f7e0',
    'rep.glow1':        '#7fd4c0',
    'rep.glow2':        '#7fd4c0'
  };

  /* roles that are PURE EMISSIVE labels written verbatim (no dimming, ever). */
  CM.PALETTES = PALETTES;
  CM.GLOW = GLOW;

  /* ── brightness ladder (PLAN §3) ───────────────────────────────────────────
     bandBase: day 1.0 · dusk 0.6 · night (0.30 + 0.50·moonK).
     weatherFactor: clear 1.0 · cloudy 0.85 · storm 0.5.
     flash spikes the composite to 1.0. */
  CM.bandBase = function (band, moonK) {
    if (band === 'day') return 1.0;
    if (band === 'dusk') return 0.6;
    var k = clamp(moonK == null ? 0.6 : moonK, 0, 1);
    return 0.30 + 0.50 * k;
  };
  CM.weatherFactor = function (weather) {
    if (weather === 'cloudy') return 0.85;
    if (weather === 'storm') return 0.5;
    return 1.0; // clear
  };
  CM.B = function (band, moonK, weather, flash) {
    if (flash) return 1.0;
    return clamp(CM.bandBase(band, moonK) * CM.weatherFactor(weather), 0, 1);
  };

  /* ── resolve: a full var-map for a band at brightness B ─────────────────────
     Swappable roles are dimmed by B; GLOW roles are written at full intensity
     (with only a light day-recede on a couple so a bright sky doesn't get washed
     by emissives). Returns { '--role': 'rgb(...)', ... }. */
  function dayRecede(role, B) {
    // emissives recede a little in bright light, never go below 0.6 intensity.
    // moon/sun/asterism are the sky payoff — keep them strong. lamp/window/maw
    // recede slightly as the world brightens.
    var fadeable = role === 'lamp.flame' || role === 'window.lit' ||
      role === 'cavern.maw' || role === 'undercroft.glow' || role === 'arcade.screen' ||
      role === 'rep.glow1' || role === 'rep.glow2';
    if (!fadeable) return 1.0;
    // B near 1 (bright day) → 0.6; B low (night) → 1.0
    return clamp(1.0 - 0.4 * B, 0.6, 1.0);
  }

  CM.resolve = function (band, B) {
    var pal = PALETTES[String(band || 'night').toUpperCase()] || PALETTES.NIGHT;
    var out = {};
    for (var role in pal) {
      if (Object.prototype.hasOwnProperty.call(pal, role)) {
        out['--' + role] = dim(pal[role], B);
      }
    }
    for (var grole in GLOW) {
      if (Object.prototype.hasOwnProperty.call(GLOW, grole)) {
        var recede = dayRecede(grole, B);
        out['--' + grole] = recede >= 0.999 ? hexAsRgb(GLOW[grole]) : dim(GLOW[grole], recede);
      }
    }
    return out;
  };

  function hexAsRgb(hex) { var c = hexToRgb(hex); return rgbStr(c.r, c.g, c.b); }

  /* ── applyRepColors: merge ONE rep's per-band color overrides into a resolved
     var-map (§5.8). `out` is the map CM.resolve() returned; `band` is the band
     being painted; `B` is the current brightness; `repColors` is the SELECTED rep's
     override map keyed by band → { 'rep.swatch1':'#..', 'rep.glow1':'#..', ... }.

     For the given band, each override OVERWRITES the matching neutral default in
     `out` (keyed by the DOTTED var name, e.g. '--rep.swatch1'):
       • rep.swatch* (SWAPPABLE) → run through dim(hex, B), exactly like a palette role.
       • rep.glow*   (EMISSIVE)  → run through the SAME dayRecede logic resolve() uses
                                   for GLOW (recede by the role's own dayRecede(B)).
     We write ONLY the dotted var here; S.applyResolved creates the dash -ref alias
     for every key it sees. A null/missing repColors, or one lacking this band, is a
     no-op (the neutral defaults already in `out` are left untouched). Unknown keys
     in the override are ignored (only rep.swatch and rep.glow roles are honored). */
  CM.applyRepColors = function (out, band, B, repColors) {
    if (!out || !repColors) return out;
    var bandKey = String(band || 'night').toUpperCase();
    var over = repColors[bandKey];
    if (!over) return out;
    for (var role in over) {
      if (!Object.prototype.hasOwnProperty.call(over, role)) continue;
      var hex = over[role];
      if (hex == null || hex === '') continue;
      if (role.indexOf('rep.swatch') === 0) {
        // swappable surface — dim by B like any palette role
        out['--' + role] = dim(hex, B);
      } else if (role.indexOf('rep.glow') === 0) {
        // emissive accent — recede in bright light like any fadeable GLOW role
        var recede = dayRecede(role, B);
        out['--' + role] = recede >= 0.999 ? hexAsRgb(hex) : dim(hex, recede);
      }
      // any other key is outside the rep color budget — ignore.
    }
    return out;
  };

  /* ── apply: write a var-map onto an element's inline style ──────────────────── */
  CM.apply = function (el, vars) {
    if (!el || !el.style) return;
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) el.style.setProperty(k, vars[k]);
    }
  };

  /* ── crossfade: JS-lerp from one resolved var-map to another over ms ─────────
     We lerp in RGB space (the maps are already 'rgb(r,g,b)' strings). Writes CSS
     vars every rAF frame; calls onDone at the end. Returns a cancel fn. Honors
     prefers-reduced-motion (snaps instantly). */
  function parseRgb(s) {
    var m = /rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/.exec(s || '');
    return m ? { r: +m[1], g: +m[2], b: +m[3] } : { r: 0, g: 0, b: 0 };
  }
  CM.crossfade = function (el, fromVars, toVars, ms, onDone) {
    if (!el) { if (onDone) onDone(); return function () {}; }
    var reduce = false;
    try { reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var keys = {};
    var k;
    for (k in fromVars) if (Object.prototype.hasOwnProperty.call(fromVars, k)) keys[k] = 1;
    for (k in toVars) if (Object.prototype.hasOwnProperty.call(toVars, k)) keys[k] = 1;
    var from = {}, to = {};
    for (k in keys) {
      from[k] = parseRgb(fromVars[k] || toVars[k]);
      to[k] = parseRgb(toVars[k] || fromVars[k]);
    }
    if (reduce || !ms || ms <= 0) {
      CM.apply(el, toVars);
      if (onDone) onDone();
      return function () {};
    }
    var t0 = (root.performance && root.performance.now) ? root.performance.now() : Date.now();
    var raf = root.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
    var caf = root.cancelAnimationFrame || clearTimeout;
    var id = null, cancelled = false;
    function frame(now) {
      if (cancelled) return;
      var t = clamp((now - t0) / ms, 0, 1);
      // ease (cubic in-out) for a gentle band swap
      var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      var cur = {};
      for (var kk in keys) {
        var a = from[kk], b = to[kk];
        cur[kk] = rgbStr(a.r + (b.r - a.r) * e, a.g + (b.g - a.g) * e, a.b + (b.b - a.b) * e);
      }
      CM.apply(el, cur);
      if (t < 1) { id = raf(frame); }
      else if (onDone) onDone();
    }
    id = raf(frame);
    return function () { cancelled = true; if (id != null) caf(id); };
  };

  Gate.colormap = CM;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = CM; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
