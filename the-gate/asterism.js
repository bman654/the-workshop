/* ═══════════════════════════════════════════════════════════════════════════
   asterism.js  —  the labeled brass asterism in the sky  (window.Gate.asterism)

   PLAN §1: EARNED-ONLY, estate mythology — no invented eagle. The reference image
   shows an eagle; that figure does NOT exist in the estate's Survey of Heaven and
   we are NOT inventing it.

   Phase A (this file): draw a PLACEHOLDER labeled brass asterism (a few GLOW stars
   + connecting lines + an italic name) to the LEFT of the moon/sun, so the
   composition has the right shape and the emissive read can be judged.

   ── TODO Phase D — the REAL earned-constellation logic ──────────────────────
   Replace pickPlaceholder() with a runtime pick from the visitor's UNLOCKED
   Survey-of-Heaven constellations:
       var st = Sky.state(Sky.visitedFromStore(WS.store()), Sky.CATALOG,
                          Sky.WINGS, Sky.FEATS);
       var unlocked = st.asterisms.filter(a => a.complete);
       if (!unlocked.length) → draw NOTHING (authentic cold-start: stars, no figure)
       else pick one at random → .name = label, .myth = sub-label, .members map
            through Sky.CATALOG {x,y} (a 1440×900 viewBox — affine-fit into the
            gate's sky box, never blit raw).
   Emissive: stars var(--asterism.star), lines var(--asterism.line) — identical at
   all bands (most brilliant at night). Match the front door's charted-star CSS.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var AST = {};

  /* The placeholder figure: a small 5-star bent line + a name, authored in a
     local 0..100 unit box that the scene affine-fits into the sky's asterism slot.
     (Deliberately NOT the eagle — a neutral "surveyor's kite" so nobody mistakes
     the greybox for a shipped invented constellation.) */
  var PLACEHOLDER = {
    name: 'Asterism',           // Phase D: real .name from a complete Survey wing
    myth: '(placeholder)',      // Phase D: real .myth sub-label
    stars: [
      { x: 18, y: 30, mag: 1 },
      { x: 42, y: 16, mag: 2 },
      { x: 64, y: 34, mag: 1 },
      { x: 50, y: 58, mag: 2 },
      { x: 30, y: 70, mag: 2 }
    ],
    // connecting lines as index pairs into stars[]
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
  };

  /* current(): the figure to draw. Phase A → always the placeholder.
     Phase D → the randomly-picked unlocked Survey asterism, or null (draw nothing). */
  AST.current = function () {
    // TODO Phase D: read Sky + WS here; return null when nothing is unlocked.
    return PLACEHOLDER;
  };

  AST.PLACEHOLDER = PLACEHOLDER;

  Gate.asterism = AST;

  if (typeof module !== 'undefined' && module.exports) { module.exports = AST; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
