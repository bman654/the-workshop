/* ═══════════════════════════════════════════════════════════════════════════
   rooms.js  —  the grounds room-rep + label  (window.Gate.rooms)

   In the grounds in front of the Observatory Rise we display ONE room's
   front-elevation representation, with the room's name below it. The pool of
   rooms comes from the GATE-ROOMS slab (re-pinned each cycle by reclaim.mjs from
   the live front-door PLACES).

   Four bespoke reps are built (drawn by scene.js, keyed in REP_DRAW): the CAIRN
   (polished black brass-rimmed stones), the CAVERN (rocky mound + glowing maw), the
   RIPPLE TANK (water tray + emanating rings), and the MUSIC ROOM (brass organ pipes).
   Every other room falls back to the estate-quality GLYPH STAND (a brass cartouche
   plinth holding the room's glyph — no bare floating glyphs). rooms.js owns the
   SELECTION (which rep to show) + feeds the rep its accent/glyph/name from the slab.

   SELECTION (Phase D): the grounds feature the day's rotating bespoke room
   (R.featuredId, daily), so the front door showcases a different calling card each
   day rather than always the Cairn. ?room=<id> pins any slab room (dev/sharing).
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
    cairn: { rep: 'cairn', repColors: undefined },
    // ── the 3 essence-survey reps (Keystone's slate; draw fns added by the foundry,
    //    keyed in scene.js REP_DRAW). Each brings its own colors via the rep.* slots. ──
    'physics-lab': { rep: 'cavern-mound', repColors: {        // The Cavern — rocky MOUND + glowing maw
      DAY:   { 'rep.swatch1': '#6e7680', 'rep.swatch2': '#878f99', 'rep.glow1': '#7fd4c0' },
      DUSK:  { 'rep.swatch1': '#6a6470', 'rep.swatch2': '#827a86', 'rep.glow1': '#7fd4c0' },
      NIGHT: { 'rep.swatch1': '#3a4048', 'rep.swatch2': '#4c535d', 'rep.glow1': '#7fd4c0' }
    } },
    ripple: { rep: 'ripple-tank', repColors: {                // The Ripple Tank — HORIZONTAL water tray
      DAY:   { 'rep.swatch1': '#4fb8c8', 'rep.swatch2': '#8fdde6', 'rep.glow1': '#7fe0e8' },
      DUSK:  { 'rep.swatch1': '#3f8a9a', 'rep.swatch2': '#6fb6c0', 'rep.glow1': '#7fe0e8' },
      NIGHT: { 'rep.swatch1': '#2a5560', 'rep.swatch2': '#3f7a86', 'rep.glow1': '#7fe0e8' }
    } },
    'sound-garden': { rep: 'organ-pipes', repColors: {        // The Music Room — VERTICAL brass organ pipes
      DAY:   { 'rep.swatch1': '#6a5640', 'rep.glow1': '#cf7bff' },
      DUSK:  { 'rep.swatch1': '#5a4632', 'rep.glow1': '#cf7bff' },
      NIGHT: { 'rep.swatch1': '#2e261c', 'rep.glow1': '#cf7bff' }
    } }
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

  /* featuredId(slab): the PRODUCTION "featured room" — rotates DAILY among the
     bespoke reps present in the slab (the estate-quality calling cards: Cairn,
     Cavern, Ripple Tank, Music Room — and any future reps, since the pool is derived
     from BESPOKE). The front door showcases a different room each day instead of
     always the Cairn. Deterministic from the date by design: it must be STABLE within
     a page-load so the two pick() calls a load makes — the boot's repColors merge and
     scene.js's draw — agree, or the rep's custom colors wouldn't match the rep drawn.
     Glyph-Stand rooms are deliberately EXCLUDED here (they stay the fallback for a
     ?room= pin of an un-built room); the feature only ever shows hand-built reps. */
  function featuredId(slab) {
    slab = slab || [];
    var inSlab = {};
    for (var i = 0; i < slab.length; i++) inSlab[slab[i].id] = true;
    var pool = [];
    for (var id in BESPOKE) {
      if (!Object.prototype.hasOwnProperty.call(BESPOKE, id)) continue;
      // the Cairn is a synthetic estate fixture (not necessarily in the slab) → always
      // eligible; every other bespoke rep must actually appear (unlocked) in the slab.
      if (id === 'cairn' || inSlab[id]) pool.push(id);
    }
    if (!pool.length) return 'cairn';
    var day = 0;
    try {
      var d = new Date();
      day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); // 1..366
    } catch (e) { day = 0; }
    return pool[((day % pool.length) + pool.length) % pool.length];
  }
  R.featuredId = featuredId;

  /* pick(pinId): which room to display in the grounds.
     • If pinId is given AND present in the slab → pick THAT room (dev override, ?room=).
     • Otherwise FEATURE the day's rotating bespoke room (featuredId). The Cairn is the
       anchor — shown when it's the day's pick or when the featured room can't resolve. */
  R.pick = function (pinId) {
    var slab = R.loadSlab();

    if (pinId) {
      for (var p = 0; p < slab.length; p++) {
        if (slab[p].id === pinId) return projectPick(slab[p]);
      }
      // pinId not in the slab → fall through to the featured pick.
    }

    // PRODUCTION: feature the day's rotating bespoke room (was: always the Cairn).
    var featId = featuredId(slab);
    if (featId && featId !== 'cairn') {
      for (var f = 0; f < slab.length; f++) {
        if (slab[f].id === featId) return projectPick(slab[f]);
      }
      // featured room vanished from the slab → fall through to the Cairn anchor.
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
