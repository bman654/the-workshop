/* ═══════════════════════════════════════════════════════════════════════════
   rooms.js  —  the grounds room-rep + label  (window.Gate.rooms)

   In the grounds in front of the Observatory Rise we display ONE room's
   front-elevation representation, with the room's name below it. The pool of
   rooms comes from the GATE-ROOMS slab (re-pinned each cycle by reclaim.mjs from
   the live front-door PLACES).

   Phase A (this file): only the CAIRN rep is bespoke (a stack of polished black
   brass-rimmed stones — drawn by scene.js). rooms.js supplies the SELECTION + the
   LABEL text from the slab.

   ── TODO Phase C — the rest of the reps ────────────────────────────────────
   • 3 essence-survey reps (Orrery armillary? Physics Cavern maw? Ripple Tank
     pond? — chosen by a blind survey, not hardcoded here) + the GLYPH STAND
     (a designed plinth that HOLDS a room's glyph for every unbuilt room — NO bare
     floating glyphs). Each rep is a draw fn in scene.js keyed by room id; rooms.js
     picks which rep to show and feeds it the room's accent/glyph/name.
   • Selection becomes "random unlocked-or-any room from the slab"; for greybox we
     pin the Cairn so the composition is stable.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var R = {};

  // The bespoke-rep REGISTRY: room id → { rep:'<repKey>', repColors }.
  //   • rep       — the bespoke repKey scene.js dispatches on (drawFn lookup).
  //   • repColors — the rep's per-band custom-color overrides (§5.8), shape
  //                 { DAY:{'rep.swatch1':'#..','rep.glow1':'#..'}, DUSK:{…}, NIGHT:{…} },
  //                 or undefined when the rep uses only fixed estate colors.
  // Phase A: only the Cairn, which uses fixed colors (polished black + brass) so it
  // declares no repColors. Future reps add an entry here (and a draw fn in scene.js).
  var BESPOKE = {
    cairn: { rep: 'cairn', repColors: undefined }
  };

  /* loadSlab(): parse the GATE-ROOMS JSON slab inlined by forge. Returns an array
     of {id,room,glyph,accent,district,href,locked} (locked already filtered out by
     reclaim). The slab's textContent wraps the JSON in <!-- GATE-ROOMS BEGIN/END -->
     sentinel comments (the re-pin anchors), so we slice from the first '[' to the
     last ']' before parsing. Degrades to [] if the slab is absent/garbled. */
  R.loadSlab = function () {
    if (!root.document) return [];
    var el = root.document.getElementById('gate-rooms');
    if (!el) return [];
    var raw = el.textContent || '';
    var a = raw.indexOf('[');
    var b = raw.lastIndexOf(']');
    if (a < 0 || b < a) return [];
    try {
      var arr = JSON.parse(raw.slice(a, b + 1));
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  };

  /* projectPick(record): shape a slab record into the rep-pick object the scene
     draws from. A room with a bespoke rep carries its repKey + repColors; every
     other room falls back to the Glyph Stand (rep:'glyph-stand', no repColors). */
  function projectPick(rec) {
    var id = rec.id;
    var be = R.hasBespoke(id) ? BESPOKE[id] : null;
    return {
      id: id,
      rep: be ? be.rep : 'glyph-stand',
      repColors: be ? be.repColors : undefined,
      name: rec.room || id,
      glyph: rec.glyph || '◆',
      accent: rec.accent || '#9aa0a8',
      src: rec
    };
  }

  /* pick(pinId): which room to display in the grounds.
     • If pinId is given AND present in the slab → pick THAT room (dev override).
     • Otherwise keep the Cairn-default behavior (the greybox's stable composition):
       the Cairn if present in the slab, else a synthetic Cairn record. */
  R.pick = function (pinId) {
    var slab = R.loadSlab();

    if (pinId) {
      for (var p = 0; p < slab.length; p++) {
        if (slab[p].id === pinId) return projectPick(slab[p]);
      }
      // pinId not in the slab → fall through to the Cairn default.
    }

    var cairn = null;
    for (var i = 0; i < slab.length; i++) {
      if (slab[i].id === 'tabularium' || slab[i].id === 'cairn' ||
          /cairn/i.test(slab[i].room || '')) { cairn = slab[i]; break; }
    }
    if (cairn) {
      // The Cairn is a bespoke fixed-color rep regardless of its slab id.
      return { id: 'cairn', rep: 'cairn', repColors: BESPOKE.cairn.repColors,
        name: cairn.room || 'The Cairn Face', glyph: cairn.glyph || '🪨',
        accent: cairn.accent || '#9aa0a8', src: cairn };
    }
    // synthetic fallback — the Cairn is a real estate fixture (Tabularium / Cairn Face)
    return { id: 'cairn', rep: 'cairn', repColors: BESPOKE.cairn.repColors,
      name: 'The Cairn Face', glyph: '🪨', accent: '#9aa0a8', src: null };
  };

  /* hasBespoke(id): does this room id have a bespoke rep (vs the Glyph Stand)? */
  R.hasBespoke = function (id) {
    return Object.prototype.hasOwnProperty.call(BESPOKE, id);
  };

  R.BESPOKE = BESPOKE;

  Gate.rooms = R;

  if (typeof module !== 'undefined' && module.exports) { module.exports = R; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
