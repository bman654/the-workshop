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

   SELECTION (Phase E): the grounds feature a RANDOM room PER VISIT, drawn from the
   FULL pool of unlocked rooms — every room in the GATE-ROOMS slab PLUS the synthetic
   Cairn fixture (which is not a real slab room). Each page-load lands on a different
   room (a fresh calling card each visit), but the pick is CACHED so it is STABLE
   within a load: the boot's repColors merge and scene.js's draw both call pick() and
   MUST agree, or the rep's custom colors wouldn't match the rep drawn. ?room=<id>
   pins any slab room (dev/sharing); ?seed=<n> makes the random pick reproducible.
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
    } },
    'firmament': { rep: 'firmament-rep', repColors: { DAY: { 'rep.swatch1': '#7e8da0', 'rep.swatch2': '#9fb0c2', 'rep.glow1': '#8fb8dd' }, DUSK: { 'rep.swatch1': '#6a7486', 'rep.swatch2': '#869aae', 'rep.glow1': '#8fb8dd' }, NIGHT: { 'rep.swatch1': '#39424f', 'rep.swatch2': '#4c5868', 'rep.glow1': '#8fb8dd' } } },
    'clockwork': { rep: 'clockwork-rep', repColors: { DAY: { 'rep.swatch1': '#c9a24a', 'rep.swatch2': '#b08a3c', 'rep.swatch3': '#8a6e30', 'rep.glow1': '#7ad0c4', 'rep.glow2': '#9fe3da' }, DUSK: { 'rep.swatch1': '#a98a4a', 'rep.swatch2': '#917640', 'rep.swatch3': '#6f5a30', 'rep.glow1': '#7ad0c4', 'rep.glow2': '#8fdcd2' }, NIGHT: { 'rep.swatch1': '#8a8a7a', 'rep.swatch2': '#73736a', 'rep.swatch3': '#565650', 'rep.glow1': '#7ad0c4', 'rep.glow2': '#a6ece2' } } },
    'gnomon': { rep: 'gnomon-rep', repColors: { DAY: { 'rep.swatch1': '#d8a94f', 'rep.swatch2': '#9a9388', 'rep.glow1': '#ffe2a0' }, DUSK: { 'rep.swatch1': '#bd8a44', 'rep.swatch2': '#867d70', 'rep.glow1': '#ffcf86' }, NIGHT: { 'rep.swatch1': '#6f5d3c', 'rep.swatch2': '#4a4842', 'rep.glow1': '#bcd8ff' } } },
    'lodestone-hall': { rep: 'lodestone-hall-rep', repColors: { DAY: { 'rep.swatch1': '#44505e', 'rep.swatch2': '#6b7a8c', 'rep.glow1': '#7fd4ff' }, DUSK: { 'rep.swatch1': '#3a4654', 'rep.swatch2': '#5a6678', 'rep.glow1': '#7fd4ff' }, NIGHT: { 'rep.swatch1': '#232c38', 'rep.swatch2': '#3a4656', 'rep.glow1': '#9ae0ff' } } }
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

  /* cairnPick(slab): the synthetic Cairn fixture as a rep-pick. The Cairn is a real
     estate landmark (the Tabularium / Cairn Face) that may or may not surface in the
     slab as its own row; we mirror its name/glyph/accent from the slab when present
     (matched by id 'tabularium'/'cairn' or a "cairn" in the room name) and otherwise
     fall back to the synthetic defaults. It always renders the fixed-color 'cairn'
     rep regardless of which slab id (if any) it borrowed its label from. */
  function cairnPick(slab) {
    slab = slab || [];
    var cairn = null;
    for (var i = 0; i < slab.length; i++) {
      if (slab[i].id === 'tabularium' || slab[i].id === 'cairn' ||
          /cairn/i.test(slab[i].room || '')) { cairn = slab[i]; break; }
    }
    return { id: 'cairn', rep: 'cairn', repColors: BESPOKE.cairn.repColors,
      name: cairn ? (cairn.room || 'The Cairn Face') : 'The Cairn Face',
      glyph: cairn ? (cairn.glyph || '🪨') : '🪨',
      accent: cairn ? (cairn.accent || '#9aa0a8') : '#9aa0a8',
      src: cairn || null };
  }

  /* CAIRN_POOL_ID: the sentinel id standing for the synthetic Cairn fixture inside
     the random pool. It is NOT necessarily a real slab id (the Cairn may have no slab
     row), so we use a distinct token to avoid colliding with any slab room. */
  var CAIRN_POOL_ID = ' cairn-fixture';

  /* mulberry32(seed): a tiny deterministic 32-bit PRNG → a function returning a float
     in [0,1). Used to make the ?seed-driven pick reproducible across loads. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* urlSeed(): read ?seed=<n> from the live query string (so a review URL can pin a
     reproducible random pick) — null when absent/blank/non-numeric. We parse it here
     rather than threading it through pick()'s callers, both of which pass only the
     ?room pin; this keeps the per-visit pick stable for a given ?seed without
     touching the boot/scene call sites. */
  function urlSeed() {
    try {
      var search = (root.location && root.location.search) || '';
      var m = /[?&]seed=([^&]+)/.exec(search);
      if (!m) return null;
      var v = +decodeURIComponent(m[1]);
      return isNaN(v) ? null : v;
    } catch (e) { return null; }
  }

  /* _roll: the per-load random draw in [0,1), captured ONCE. If ?seed is present it
     is derived deterministically from the seed (reproducible review); otherwise it is
     a single Math.random() frozen at module init. Freezing here is what makes the two
     pick() calls a load makes agree (the boot repColors merge + scene.js draw). */
  var _roll = (function () {
    var s = urlSeed();
    return s != null ? mulberry32(s)() : Math.random();
  })();

  /* _cachedRandom: the resolved random pick object, memoized after the first
     non-pinned pick() call so every later call in the same load returns the SAME
     room (so its repColors match the drawn rep). Keyed on nothing because the random
     pool is load-stable; a ?room pin bypasses this cache (it is itself deterministic). */
  var _cachedRandom = null;

  /* randomPick(): choose AT RANDOM (per visit, stable within the load) from the pool
     of every slab room ∪ the synthetic Cairn fixture. The Cairn is appended as a
     sentinel so it competes evenly with the real rooms even when it has no slab row. */
  function randomPick() {
    if (_cachedRandom) return _cachedRandom;
    var slab = R.loadSlab();
    var pool = [];
    for (var i = 0; i < slab.length; i++) pool.push(slab[i].id);
    pool.push(CAIRN_POOL_ID);                 // the Cairn fixture is always eligible
    var idx = Math.floor(_roll * pool.length);
    if (idx >= pool.length) idx = pool.length - 1;   // guard _roll === 1 edge
    if (idx < 0) idx = 0;
    var chosenId = pool[idx];
    if (chosenId === CAIRN_POOL_ID) {
      _cachedRandom = cairnPick(slab);
    } else {
      var rec = null;
      for (var j = 0; j < slab.length; j++) {
        if (slab[j].id === chosenId) { rec = slab[j]; break; }
      }
      // a slab row matched its own id by construction; fall back to the Cairn if not.
      _cachedRandom = rec ? projectPick(rec) : cairnPick(slab);
    }
    return _cachedRandom;
  }

  /* pick(pinId): which room to display in the grounds.
     • If pinId (?room=) is given AND present in the slab → pick THAT room (dev override).
     • Otherwise pick AT RANDOM (per visit, stable within a load) from the full pool of
       every unlocked slab room ∪ the synthetic Cairn fixture. Bespoke rooms render
       their rep + repColors; every other room falls back to the Glyph Stand. */
  R.pick = function (pinId) {
    if (pinId) {
      var slab = R.loadSlab();
      for (var p = 0; p < slab.length; p++) {
        if (slab[p].id === pinId) return projectPick(slab[p]);
      }
      // pinId not in the slab → fall through to the per-visit random pick.
    }
    return randomPick();
  };

  /* hasBespoke(id): does this room id have a bespoke rep (vs the Glyph Stand)? */
  R.hasBespoke = function (id) {
    return Object.prototype.hasOwnProperty.call(BESPOKE, id);
  };

  R.BESPOKE = BESPOKE;

  Gate.rooms = R;

  if (typeof module !== 'undefined' && module.exports) { module.exports = R; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
