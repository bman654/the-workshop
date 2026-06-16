/* ═══════════════════════════════════════════════════════════════════════════
   sky.js — "The Survey of Heaven": the front door's personal night sky.

   A cross-page metagame whose visible surface IS the estate map. The dark
   margins of the surveyor's plate are a night sky that RECORDS WHERE YOU HAVE
   BEEN. First visit to any room kindles a star over the dark band beside it;
   rooms in the same WING are joined by a faint asterism line; visiting ALL of a
   wing's members COMPLETES its asterism (lines brighten to brass; an engraved
   name + a one-line myth appear in the margin); completing every wing fires an
   all-skies capstone.

   It reads the `ws:seen:<id>` breadcrumb that EVERY page already drops, so it
   needs NO per-page instrumentation. Always-visible, MONOTONE (visiting more
   only ever ADDS — never removes a star/line/completion), never gated,
   cosmetics-only. It never confers access and touches NO existing predicate.

   The workshop's celestial vein, third register: Firmament invents skies, the
   Orrery shows the real one, the Almanac reads real ephemeris — and the Survey
   of Heaven maps YOUR visits onto a personal sky.

   Vanilla, ES5-ish, zero-dependency. A pure, DOM-free core (state/CATALOG/WINGS)
   + a thin DOM renderer (renderInto/bootstrap). Reads cross-page state from the
   SAME `ws:` bucket via the existing WS global; writes ONLY new cosmetic
   namespaced flags (`ws:flag:sky-<id>-named`, `ws:flag:sky-bootstrap`,
   `ws:flag:firmament-survey`) — additive, affecting no existing predicate.

   Inlined into the front door VIA forge (`<!-- forge:include tools/sky/sky.js
   -->`); forge strips the module guard at the bottom. In a browser this attaches
   a `Sky` global; in Node it exports the same object for the self-test.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Sky = {};

  /* ── DATA: the star catalog ────────────────────────────────────────────────
     One star per front-door-visitable id (front-door POIs + their companions).
     Positions are HAND-PLACED in the DARK MARGINS of the 1440×900 viewBox —
     outer bands & corners — AWAY from the manor candle-pool (x421 y150 600×600)
     and clear of every footprint + plan-furniture bbox (proven by the self-test).
     `mag` is a visual magnitude 1..3 (1 = brightest/biggest): wing "lead" stars
     read a touch brighter than their companions, so an asterism has structure. */
  var CATALOG = {
    // celestial — the Observatory tower sits upper-left; its stars hug that corner
    'firmament':      { x: 120,  y: 250, mag: 1 },
    'orrery':         { x: 120,  y: 400, mag: 2 },
    // letters — the Study reads upper-left-of-centre; stars ride the top band
    'verse':          { x: 520,  y: 96,  mag: 1 },
    'scriptorium':    { x: 610,  y: 120, mag: 2 },
    // design — the Print Room upper-right-of-centre; stars ride the top band, right
    'compositor':     { x: 880,  y: 96,  mag: 1 },
    'blazon':         { x: 980,  y: 120, mag: 2 },
    // realm — the Map Room left-of-centre; stars in the left margin band, lower
    'cartographer':   { x: 130,  y: 560, mag: 1 },
    'bastion':        { x: 62,   y: 620, mag: 2 },
    // garden — the Glasshouse lower-left; stars ride the bottom band, left-of-centre
    'strange-garden': { x: 560,  y: 850, mag: 1 },
    'tessellarium':   { x: 660,  y: 858, mag: 2 },
    // labyrinth — the Hedge Maze lower-right; stars hug the lower-right corner
    'daedalus':       { x: 1300, y: 600, mag: 1 },
    'ariadne':        { x: 1320, y: 720, mag: 2 },
    // ── field stars: kindled rooms not (yet) paired into an asterism ──
    'sound-garden':   { x: 1330, y: 450, mag: 2 },
    'threshold':      { x: 1340, y: 330, mag: 1 },
    'theogony':       { x: 1000, y: 840, mag: 2 },
    'arcade':         { x: 1330, y: 220, mag: 1 },
    'workbench':      { x: 780,  y: 860, mag: 1 },
    'undercroft':     { x: 880,  y: 850, mag: 2 },
    // the manor's archive annal — a field star in the upper-right band, lit on first
    // visit to the Tabularium (additive; never feeds the wings-only capstone).
    'tabularium':     { x: 1180, y: 150, mag: 1 },
    // ── the feats constellation: nine "Feats of Light" earned in the Hall of Mirrors,
    //    laid out as a vertical LENS (a pointed oval) threading the WEST GROUNDS left
    //    margin beside the Hall footprint (x124 y430 w148 h74). These are PSEUDO-ids
    //    (no room/POI of their own); each kindles iff its `ws:flag:earned-<X>` is set.
    //    Positioned to clear every footprint/furniture box, the manor pool, and every
    //    existing catalog star (proven by the self-test). The lens RIM goes clockwise
    //    from the top apex (rainbow); anamorphosis is the lens axis/centre. mag1 = the
    //    two apices (the lens points), mag2 = the rim & axis. ──
    'feat-rainbow':      { x: 60,  y: 338, mag: 1 }, // top apex
    'feat-iridescence':  { x: 96,  y: 388, mag: 2 }, // upper-right flank
    'feat-spyglass':     { x: 98,  y: 462, mag: 2 }, // mid-right flank
    'feat-spectroscope': { x: 98,  y: 588, mag: 2 }, // lower-right flank
    'feat-maze':         { x: 62,  y: 648, mag: 1 }, // bottom apex (the focus)
    'feat-polariser':    { x: 26,  y: 580, mag: 2 }, // lower-left flank
    'feat-camera':       { x: 20,  y: 470, mag: 2 }, // mid-left flank
    'feat-halo':         { x: 22,  y: 398, mag: 2 }, // upper-left flank
    'feat-anamorphosis': { x: 60,  y: 520, mag: 2 }, // lens centre / optical axis
    // ── The Automaton — Clockwork's 4 bench crumbs, a standing-figure in the north
    //    grounds (above the Clockwork POI). These are PLAIN room ids (each kindles iff
    //    its `ws:seen:<id>` breadcrumb is set — the Clockwork benches drop them). Coords
    //    verified clear of every footprint/furniture box, the manor pool, and every
    //    other catalog star (re-runnable /tmp/place_verify.cjs). mag1 = the head apex. ──
    'context-window':   { x: 418, y: 34,  mag: 1 }, // head (top apex, brightest)
    'temperature-dial': { x: 392, y: 78,  mag: 2 }, // core
    'the-turn':         { x: 452, y: 118, mag: 2 }, // right limb
    'partition':        { x: 318, y: 122, mag: 2 }, // left limb
    // ── The Furnace — Engine-Room's 4 bench crumbs, a rising flame in the far-right
    //    margin. PLAIN room ids (`ws:seen:<id>` from the Engine-Room benches). mag1 = the
    //    apex (η = 1 − Tc/Th, the Carnot ceiling — brightest). ──
    'carnot':   { x: 1398, y: 548, mag: 1 }, // apex (eta=1-Tc/Th — brightest)
    'demon':    { x: 1372, y: 632, mag: 2 },
    'brownian': { x: 1402, y: 712, mag: 2 },
    'stirling': { x: 1376, y: 836, mag: 2 }  // base
  };

  /* ── DATA: the six wings (companion-pairs), each an asterism ────────────────
     `members` are catalog ids; the line threads them in listed order. `name` is
     the engraved label that appears in the margin once complete; `myth` is its
     one-line Oracle-flavoured legend. Order of members is the polyline order. */
  var WINGS = [
    { id: 'celestial', name: 'The Astronomer',   members: ['firmament', 'orrery'],
      myth: 'Invents a sky; reads the true one.' },
    { id: 'design',    name: 'The Compositor',   members: ['compositor', 'blazon'],
      myth: 'Letter and shield, one measure.' },
    { id: 'labyrinth', name: 'The Maze & Thread', members: ['daedalus', 'ariadne'],
      myth: 'Builds the turning; keeps the way back.' },
    { id: 'realm',     name: 'The Cartographer', members: ['cartographer', 'bastion'],
      myth: 'Draws the coast; raises the keep.' },
    { id: 'letters',   name: 'The Scribe',       members: ['verse', 'scriptorium'],
      myth: 'Speaks the verse; copies it fair.' },
    { id: 'garden',    name: 'The Gardener',     members: ['strange-garden', 'tessellarium'],
      myth: 'Tends the tile till the pattern comes true.' }
  ];

  /* ── DATA: the feats constellation (a BONUS asterism, NOT a wing) ───────────────
     The Hall of Mirrors' nine "Feats of Light" form their OWN charted constellation,
     drawn + named by the SAME asterism machinery as the six wings — but kept SEPARATE
     so the all-skies capstone (allComplete) stays the original six companion-wings
     ONLY. Earning all nine completes this constellation (brass lines + an engraved
     name + a one-line myth) without ever gating the capstone. Each member is a
     `feat-<X>` pseudo-id, "visited" iff the store holds `ws:flag:earned-<X>`. */
  /* FEATS is an ARRAY of feat-GROUPS (each drawn + named like a wing, but ADDITIVE —
     none ever feeds the all-skies capstone). The Optician (the Hall's nine Feats of
     Light) is unchanged; two new groups reward the orphaned-wing visit trails:
       • The Automaton — Clockwork's 4 benches (plain `ws:seen:<id>` room crumbs)
       • The Furnace   — the Engine Room's 4 benches (plain room crumbs)
     Member order = polyline order; the SET is what gates completion (order-free). */
  var FEATS = [
    { id: 'feats', name: 'The Optician', myth: 'Bends every ray to its purpose.',
      members: ['feat-rainbow', 'feat-iridescence', 'feat-spyglass', 'feat-spectroscope',
                'feat-maze', 'feat-polariser', 'feat-camera', 'feat-halo', 'feat-anamorphosis'] },
    { id: 'automaton', name: 'The Automaton', myth: 'Models its own making; keeps none of it.',
      members: ['context-window', 'temperature-dial', 'the-turn', 'partition'] },
    { id: 'furnace', name: 'The Furnace', myth: 'Turns heat to work; never quite all of it.',
      members: ['carnot', 'demon', 'brownian', 'stirling'] }
  ];

  Sky.CATALOG = CATALOG;
  Sky.WINGS = WINGS;
  Sky.FEATS = FEATS;

  /* ── PURE CORE ──────────────────────────────────────────────────────────────
     Sky.state(visited, catalog, wings) — deterministic, ORDER-INDEPENDENT,
     MONOTONE. Given a set/array/map of visited ids it returns:
       stars      [ {id, x, y, mag} ]  — every lit catalog entry (visited)
       lines      [ {wing, points:[[x,y],…], complete} ] — per-wing polyline through
                  the VISITED members (partial allowed; >=2 points to draw a line)
       asterisms  [ {…wing, members, complete: members.every(visited)} ]
       allComplete  true iff every wing is complete
     Visiting more visits only ever turns features ON, never off (monotonicity is
     structural: a superset of `visited` ⊇ the prior lit stars/line points, and
     `complete` is a monotone AND over membership). */
  function toSet(visited) {
    if (!visited) return {};
    var set = {};
    if (typeof visited.has === 'function' && typeof visited.forEach === 'function'
        && typeof visited.size === 'number') {
      // a real Set
      visited.forEach(function (id) { set[id] = true; });
      return set;
    }
    if (Object.prototype.toString.call(visited) === '[object Array]') {
      for (var i = 0; i < visited.length; i++) set[visited[i]] = true;
      return set;
    }
    // a plain object map { id: truthy }
    for (var k in visited) if (Object.prototype.hasOwnProperty.call(visited, k) && visited[k]) set[k] = true;
    return set;
  }

  Sky.state = function (visited, catalog, wings, feats) {
    catalog = catalog || CATALOG;
    wings = wings || WINGS;
    // `feats` may be a single group object, an array of groups, or omitted. It draws
    // + names exactly like a wing, but is kept SEPARATE so it NEVER feeds allComplete.
    if (feats === undefined) feats = FEATS;
    var featGroups = !feats ? [] :
      (Object.prototype.toString.call(feats) === '[object Array]' ? feats : [feats]);
    var vset = toSet(visited);
    var has = function (id) { return !!vset[id]; };

    // lit stars — iterate the catalog in a STABLE key order (insertion order of a
    // plain object is preserved for string keys in every engine we target), so the
    // output is deterministic regardless of the order ids were visited.
    var stars = [];
    var id;
    for (id in catalog) {
      if (!Object.prototype.hasOwnProperty.call(catalog, id)) continue;
      if (!has(id)) continue;
      var c = catalog[id];
      stars.push({ id: id, x: c.x, y: c.y, mag: c.mag });
    }

    // compute one group's line + asterism record (shared by wings and feats)
    function group(g) {
      var members = g.members || [];
      var complete = members.length > 0;
      var pts = [];
      for (var m = 0; m < members.length; m++) {
        var mid = members[m];
        if (!has(mid)) { complete = false; continue; }
        var mc = catalog[mid];
        if (mc) pts.push([mc.x, mc.y]);
      }
      var line = (pts.length >= 2)
        ? { wing: g.id, points: pts, complete: complete } : null;
      var ast = { id: g.id, name: g.name, myth: g.myth, members: members, complete: complete };
      return { line: line, ast: ast, complete: complete };
    }

    var lines = [];
    var asterisms = [];
    // ── the six wings: these (and ONLY these) feed the all-skies capstone ──
    var allComplete = wings.length > 0;
    for (var w = 0; w < wings.length; w++) {
      var gw = group(wings[w]);
      if (!gw.complete) allComplete = false;
      if (gw.line) lines.push(gw.line);
      asterisms.push(gw.ast);
    }
    // ── the feats constellation(s): drawn + named the SAME way, but ADDITIVE — they
    //    do NOT touch allComplete, so the original capstone is unchanged. ──
    for (var f = 0; f < featGroups.length; f++) {
      var gf = group(featGroups[f]);
      if (gf.line) lines.push(gf.line);
      asterisms.push(gf.ast);
    }

    return { stars: stars, lines: lines, asterisms: asterisms, allComplete: allComplete };
  };

  /* ── helpers shared by the DOM layer ──────────────────────────────────────── */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(name, attrs) {
    var e = root.document.createElementNS(SVGNS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function lsGet(store, k) { return store && store.has(k) ? store.get(k) : null; }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* Build the visited set from a WS store snapshot. Room stars come from the
     `ws:seen:<id>` breadcrumb every page drops; the feats constellation's `feat-<X>`
     pseudo-stars come from the raise-only `ws:flag:earned-<X>` Hall-of-Mirrors flags
     (e.g. `ws:flag:earned-rainbow` → `feat-rainbow`). Both are additive. */
  Sky.visitedFromStore = function (store) {
    var v = {};
    if (!store || !store.ok || !store.all) return v;
    var SEEN = 'ws:seen:', EARNED = 'ws:flag:earned-';
    for (var k in store.all) {
      if (!Object.prototype.hasOwnProperty.call(store.all, k)) continue;
      if (k.indexOf(SEEN) === 0) v[k.slice(SEEN.length)] = true;
      else if (k.indexOf(EARNED) === 0) v['feat-' + k.slice(EARNED.length)] = true;
    }
    return v;
  };

  /* ── Sky.bootstrap(store) ────────────────────────────────────────────────────
     On the FIRST ever run on this origin (ws:flag:sky-bootstrap absent), silently
     mark every ALREADY-complete asterism's `ws:flag:sky-<id>-named` flag — so a
     returning visitor who already completed wings before this feature existed gets
     NO retroactive name-in animation. Then set ws:flag:sky-bootstrap. Idempotent.
     Mirrors WS.bootstrap. */
  Sky.bootstrap = function (store) {
    if (!store) { try { store = root.WS && root.WS.store(); } catch (e) { store = null; } }
    if (!store || !store.ok) return;
    if (lsGet(store, 'ws:flag:sky-bootstrap') != null) return;
    var st = Sky.state(Sky.visitedFromStore(store), CATALOG, WINGS);
    for (var i = 0; i < st.asterisms.length; i++) {
      var a = st.asterisms[i];
      if (a.complete) lsSet('ws:flag:sky-' + a.id + '-named', '1');
    }
    lsSet('ws:flag:sky-bootstrap', '1');
  };

  /* ── Sky.renderInto(sheet, PLACES, store) ────────────────────────────────────
     Draw a `<g class="sky">` as the FIRST child of #sheet (stars sit "in the
     paper", behind the grid/footprints). PLACES is accepted for parity with the
     map's render signature (the sky reads from the ws: store, not PLACES). */
  Sky.renderInto = function (sheet, PLACES, store) {
    if (!root || !root.document || !sheet) return null;
    if (!store) { try { store = root.WS && root.WS.store(); } catch (e) { store = null; } }
    if (!store || !store.ok) return null;   // storage off → no sky (degrade to nothing)

    var reduce = false;
    try { reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var st = Sky.state(Sky.visitedFromStore(store), CATALOG, WINGS);

    // remove a prior render (idempotent re-render)
    var old = sheet.querySelector('g.sky');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var g = svg('g', { 'class': 'sky', 'aria-hidden': 'true' });

    // ── asterism lines (under the stars) ──
    var i, j;
    for (i = 0; i < st.lines.length; i++) {
      var ln = st.lines[i];
      var d = '';
      for (j = 0; j < ln.points.length; j++) {
        d += (j === 0 ? 'M' : 'L') + ln.points[j][0] + ' ' + ln.points[j][1] + ' ';
      }
      var pl = svg('path', {
        'class': 'asterism-line' + (ln.complete ? ' complete' : ''),
        d: d.trim(), 'data-wing': ln.wing
      });
      g.appendChild(pl);
    }

    // member ids of every COMPLETED asterism — drawn as brighter "anchor" stars so a
    // charted constellation reads as a NAMED LINE JOINING TWO VISIBLE STARS, not a
    // hairline trailing off to faint points (the legibility fix of 2026-06-13).
    var chartedIds = {};
    for (i = 0; i < st.asterisms.length; i++) {
      if (!st.asterisms[i].complete) continue;
      var mm = st.asterisms[i].members || [];
      for (j = 0; j < mm.length; j++) chartedIds[mm[j]] = true;
    }

    // ── stars (twinkling circles; static under reduced-motion) ──
    for (i = 0; i < st.stars.length; i++) {
      var s = st.stars[i];
      var charted = !!chartedIds[s.id];
      var rad = (s.mag === 1 ? 2.6 : (s.mag === 2 ? 2.0 : 1.6)) + (charted ? 0.8 : 0);
      var star = svg('circle', {
        cx: s.x, cy: s.y, r: rad,
        'class': 'sky-star mag' + s.mag + (charted ? ' charted' : ''), 'data-id': s.id
      });
      if (!reduce) {
        // stagger the twinkle so the field shimmers rather than pulsing in unison
        star.style.animationDelay = ((s.x * 7 + s.y * 13) % 4000) / 1000 + 's';
      }
      g.appendChild(star);
    }

    // ── engraved asterism names + myths (in the margin), routed via the map's
    //    label solver upstream; here we just draw the text the caller positioned.
    //    Each complete asterism gets a name once; the FIRST time it becomes
    //    complete (its -named flag absent) we animate it in, then set the flag. ──
    var named = [];
    for (i = 0; i < st.asterisms.length; i++) {
      var a = st.asterisms[i];
      if (!a.complete) continue;
      var flagK = 'ws:flag:sky-' + a.id + '-named';
      var firstTime = lsGet(store, flagK) == null;
      named.push({ ast: a, firstTime: firstTime });
      if (firstTime) lsSet(flagK, '1');
    }

    // expose what was computed so the map's label pass can place the name boxes
    g.__skyNamed = named;
    g.__skyState = st;

    // ── the margin tally: "Survey of Heaven — N/6 skies charted". The denominator is
    //    the SIX companion-wings only; EVERY feat-group (the Optician + the Automaton +
    //    the Furnace) is a separate bonus and is excluded from the /6 count (each gets
    //    its own sub-tally below). Derive the exclude-set from the SAME FEATS array so a
    //    new feat-group can never be miscounted into the wing tally. ──
    var wingIds = {};
    for (i = 0; i < WINGS.length; i++) wingIds[WINGS[i].id] = true;
    var featGroupIds = {};
    for (i = 0; i < FEATS.length; i++) featGroupIds[FEATS[i].id] = true;
    var charted = 0, wingTotal = WINGS.length;
    for (i = 0; i < st.asterisms.length; i++) {
      var ai = st.asterisms[i];
      if (featGroupIds[ai.id]) continue;                 // a feat-group never counts toward /6
      if (wingIds[ai.id] && ai.complete) charted++;
    }
    var tally = svg('text', {
      x: 1414, y: 862, 'text-anchor': 'end', 'class': 'sky-tally'
    });
    tally.textContent = 'Survey of Heaven — ' + charted + '/' + wingTotal + ' skies charted';
    g.appendChild(tally);

    // ── the feat-group sub-tallies: each COMPLETED feat-group earns one right-anchored
    //    brass line, stacking UP from the main tally (y862) at -14px per line, tinted by
    //    its class. Data-driven off st.asterisms so adding a feat-group needs no edit
    //    here — only an entry in SUBTALLY. A line is emitted ONLY when genuinely
    //    complete (honest). Stack order follows FEATS array order:
    //      Optician  (y848) · Automaton (y834) · Furnace (y820). ──
    var SUBTALLY = {
      feats:     { text: 'Feats of Light — the Optician charted',        cls: 'sky-tally-feats' },
      automaton: { text: "The Maker's Wing — the Automaton charted",     cls: 'sky-tally-automaton' },
      furnace:   { text: 'The Engine Room — the Furnace charted',        cls: 'sky-tally-furnace' }
    };
    var subY = 848;
    for (i = 0; i < FEATS.length; i++) {
      var fg = FEATS[i];
      var meta = SUBTALLY[fg.id];
      if (!meta) continue;
      var fast = null;
      for (j = 0; j < st.asterisms.length; j++) {
        if (st.asterisms[j].id === fg.id) { fast = st.asterisms[j]; break; }
      }
      if (!fast || !fast.complete) continue;             // honest: only when truly charted
      var ftally = svg('text', {
        x: 1414, y: subY, 'text-anchor': 'end', 'class': 'sky-tally ' + meta.cls
      });
      ftally.textContent = meta.text;
      g.appendChild(ftally);
      subY -= 14;
    }

    // ── capstone: when ALL SIX WINGS are complete, set the firmament-survey flag once
    //    and add a faint all-skies glow band. This is the ORIGINAL capstone, unaffected
    //    by the feats constellation (allComplete is wings-only). ──
    if (st.allComplete) {
      if (lsGet(store, 'ws:flag:firmament-survey') == null) lsSet('ws:flag:firmament-survey', '1');
      g.classList.add('all-charted');
    }

    // insert as the FIRST child of #sheet (behind every painted layer)
    if (sheet.firstChild) sheet.insertBefore(g, sheet.firstChild);
    else sheet.appendChild(g);

    return g;
  };

  // browser global
  if (root && root.document) root.Sky = Sky;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Sky; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
