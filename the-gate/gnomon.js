/* ═══════════════════════════════════════════════════════════════════════════
   gnomon.js  —  the small brass gnomon on the gate face  (window.Gate.gnomon)

   A tiny copy of The Hours' gnomon sits amongst the gate's clockwork gears.
   Tapping it CYCLES the time-of-day: it advances Gate.timeofday (day→dusk→night)
   and asks the scene to crossfade the palette via colormap.

   Phase A: a real, clickable SVG element with a generous hit-target + a hover
   cue. The real cast shadow (via Hours.gnomonShadow) is a Phase-D nice-to-have;
   for now we draw a simple static placeholder shadow that the scene supplies.

   This module owns only the BEHAVIOR (binding the tap → timeofday.advance and
   notifying a callback the boot dispatcher gives it). The gnomon's GEOMETRY is
   drawn by scene-gate.js (so asset agents can restyle it without touching this).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var G = {};

  var onCycleCb = null;

  /* bind(el, onCycle): wire a DOM/SVG element so clicking it advances the band.
     onCycle(newBand) fires AFTER timeofday.advance so the dispatcher can kick the
     colormap crossfade. Keyboard-accessible (Enter/Space). */
  G.bind = function (el, onCycle) {
    if (!el) return;
    onCycleCb = typeof onCycle === 'function' ? onCycle : null;
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Wind the gnomon — change the time of day');

    function fire(ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      var band = Gate.timeofday ? Gate.timeofday.advance() : null;
      if (onCycleCb) onCycleCb(band);
    }
    el.addEventListener('click', fire);
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') fire(ev);
    });
  };

  /* shadowFor(now, styleLen): the gnomon's cast-shadow vector via Hours (Phase-D
     polish hook). Returns {dx,dy,len} or null. Scene may ignore for greybox. */
  G.shadowFor = function (now, styleLen) {
    now = now || new Date();
    var Hours = root.Hours;
    if (!Hours || !Hours.gnomonShadow || !Hours.ESTATE) return null;
    try {
      var doy = (function (d) {
        var s = new Date(d.getFullYear(), 0, 0);
        return Math.floor((d - s) / 86400000);
      })(now);
      var civilMin = now.getHours() * 60 + now.getMinutes();
      return Hours.gnomonShadow(Hours.ESTATE.latDeg, doy, civilMin, styleLen || 20);
    } catch (e) { return null; }
  };

  Gate.gnomon = G;

  if (typeof module !== 'undefined' && module.exports) { module.exports = G; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
