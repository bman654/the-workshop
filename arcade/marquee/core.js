/* THE HOUSE LIGHTS — pure scoring core (no DOM, no audio).
 *
 * The one place the "is this bulb lit?" math lives, so a Node twin
 * (core.test.mjs) can prove it EXACT and the page can't drift from it.
 * Loaded in the browser via <script src> (sets window.MarqueeCore); also
 * require()-able in Node (module.exports) for the twin. Same code both ways.
 *
 * All 23 cabinets persist a HIGHER-IS-BETTER best (WS.best / *_high are strict
 * max). A skill bulb is lit iff its own persisted best >= its authored par.
 * Pong is the keystone: it carries no par and lights only when all 22 skill
 * bulbs are lit.
 */
(function (root) {
  'use strict';

  var core = {};

  // A cabinet is a "skill" cabinet iff it has a par (pong's par is null).
  core.isSkill = function (cab) {
    return cab && cab.par != null && cab.metric !== 'keystone';
  };

  // Lit test — the single source of truth. par must be a positive number and
  // best must meet or beat it. (best/par are read from localStorage as strings;
  // callers pass numbers.)
  core.isLit = function (best, par) {
    return typeof par === 'number' && par > 0 &&
           typeof best === 'number' && isFinite(best) && best >= par;
  };

  // Fractional progress toward par, clamped to [0,1]. Unplayed (best<=0) -> 0.
  core.progress = function (best, par) {
    if (typeof par !== 'number' || par <= 0) return 0;
    if (typeof best !== 'number' || !isFinite(best) || best <= 0) return 0;
    var p = best / par;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  };

  // How many SKILL cabinets are lit. `read(cab)` returns the persisted best
  // number for a cabinet (0 if absent). Keystone (pong) is excluded — the
  // "X of 23" counter counts 0..22 from skill, and pong is the 23rd.
  core.litSkillCount = function (cabinets, read) {
    var n = 0;
    for (var i = 0; i < cabinets.length; i++) {
      var c = cabinets[i];
      if (!core.isSkill(c)) continue;
      if (core.isLit(read(c), c.par)) n++;
    }
    return n;
  };

  core.skillTotal = function (cabinets) {
    var n = 0;
    for (var i = 0; i < cabinets.length; i++) if (core.isSkill(cabinets[i])) n++;
    return n;
  };

  // The keystone (pong) is lit iff EVERY skill cabinet is lit.
  core.keystoneLit = function (cabinets, read) {
    return core.litSkillCount(cabinets, read) === core.skillTotal(cabinets);
  };

  // The set of lit slugs (skill bulbs that meet par, plus pong when complete).
  core.litSet = function (cabinets, read) {
    var out = [];
    var keystoneOn = core.keystoneLit(cabinets, read);
    for (var i = 0; i < cabinets.length; i++) {
      var c = cabinets[i];
      if (core.isSkill(c)) {
        if (core.isLit(read(c), c.par)) out.push(c.slug);
      } else if (keystoneOn) {
        out.push(c.slug); // pong ignites with the last crossing
      }
    }
    return out;
  };

  // The on-deck cabinet: the single UNLIT, already-played skill bulb closest to
  // par (highest best/par ratio in [ >0, 1 )). Ties -> first in listing order.
  // Returns the cabinet, or null if nothing is played-but-short.
  core.onDeck = function (cabinets, read) {
    var best = null, bestRatio = -1;
    for (var i = 0; i < cabinets.length; i++) {
      var c = cabinets[i];
      if (!core.isSkill(c)) continue;
      var v = read(c);
      if (!(v > 0)) continue;            // must have been played
      if (core.isLit(v, c.par)) continue; // must still be short of par
      var r = v / c.par;
      if (r > bestRatio) { bestRatio = r; best = c; }
    }
    return best;
  };

  root.MarqueeCore = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
