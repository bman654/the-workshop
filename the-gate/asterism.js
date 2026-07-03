/* ═══════════════════════════════════════════════════════════════════════════
   asterism.js  —  the labeled brass asterism in the sky  (window.Gate.asterism)

   PLAN §1: EARNED-ONLY, estate mythology — no invented eagle. The reference image
   shows an eagle; that figure does NOT exist in the estate's Survey of Heaven and
   we are NOT inventing it.

   Phase D (this file): AST.current() returns the visitor's OWN earned figure —
   one of their UNLOCKED Survey-of-Heaven constellations, picked at random per
   VISIT (cached for the page load), affine-fit from Sky's polar catalog into
   the 0..100 local box scene.js drawAsterism expects. Cold-start (nothing
   unlocked, or Sky/WS absent) → null, and drawAsterism draws the bare starfield.

   The pick is CACHED in a module var so repeated AST.current() calls in one page
   load agree (scene.js may call it more than once). Dev pins for reproducible
   review (read from location.search, degrade gracefully without a DOM):
       ?asterism=<id>   pin a specific unlocked asterism by id (wing/feat id);
                        ignored if that id isn't currently unlocked.
       ?seed=<n>        make the random pick deterministic (same n → same figure).

   Emissive: stars var(--asterism-star-ref), lines var(--asterism-line-ref) —
   handled by scene.js; here we only supply geometry + labels.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var AST = {};

  /* The placeholder figure: a small 5-star bent line + a name, authored in a
     local 0..100 unit box that the scene affine-fits into the sky's asterism slot.
     Kept as the documented shape contract + a fallback only when explicitly asked
     for (AST.PLACEHOLDER); current() never returns it in Phase D. */
  var PLACEHOLDER = {
    name: 'Asterism',
    myth: '(placeholder)',
    stars: [
      { x: 18, y: 30, mag: 1 },
      { x: 42, y: 16, mag: 2 },
      { x: 64, y: 34, mag: 1 },
      { x: 50, y: 58, mag: 2 },
      { x: 30, y: 70, mag: 2 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
  };

  /* ── the 0..100 destination box (with a small inset so a figure never crowds the
     slot edges / the label below) ──────────────────────────────────────────────
     drawAsterism does sc=size/100; px=ox+p.x*sc, and prints the label at y≈92, so
     we keep stars inside roughly [PAD, 100-PAD] × [PAD, 78] to leave label room. */
  var PAD = 8;
  var BOX_MIN = PAD, BOX_MAX = 100 - PAD;   // x span and (top of) y span
  var BOX_Y_MAX = 76;                       // keep figures above the label band

  /* ── a tiny seedable PRNG (mulberry32) so ?seed gives a reproducible pick ───── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── read dev pins from location.search WITHOUT depending on sequence.js ──────
     (asterism.js is a leaf module; reuse the same param names but parse locally so
     it works in isolation / in a Node harness where there is no DOM). */
  function readPins() {
    var search = '';
    try {
      if (root && root.location && typeof root.location.search === 'string') {
        search = root.location.search;
      }
    } catch (e) { /* no DOM → no pins */ }
    var q = {};
    search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i);
      var v = i < 0 ? '' : kv.slice(i + 1);
      try { v = decodeURIComponent(v); } catch (e2) {}
      q[k] = v;
    });
    return {
      asterism: (q.asterism != null && q.asterism !== '') ? q.asterism : null,
      seed: (q.seed != null && q.seed !== '' && !isNaN(+q.seed)) ? (+q.seed) : null
    };
  }

  /* ── affine-fit a chosen Survey asterism into the local 0..100 box ────────────
     `ast` is a Sky asterisms[] entry ({id,name,myth,members,complete}); we read each
     member's {x,y,mag} from Sky.CATALOG (positions hang on the derived polar world,
     §3.1 — the fit reads the figure's OWN bbox, so it is coord-frame-agnostic) and
     maps the figure's
     bounding box into [PAD,100-PAD] × [PAD,BOX_Y_MAX], preserving aspect (uniform
     scale = min of the two axis scales) and centering. Lines thread members in their
     listed order (the same polyline Sky draws). Returns the {stars,lines,name,myth}
     shape drawAsterism expects, or null if fewer than 1 member resolves. */
  function fitFigure(ast, catalog) {
    var members = ast.members || [];
    var raw = [];
    for (var i = 0; i < members.length; i++) {
      var c = catalog[members[i]];
      if (c) raw.push({ x: c.x, y: c.y, mag: c.mag || 2 });
    }
    if (!raw.length) return null;

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var j = 0; j < raw.length; j++) {
      if (raw[j].x < minX) minX = raw[j].x;
      if (raw[j].x > maxX) maxX = raw[j].x;
      if (raw[j].y < minY) minY = raw[j].y;
      if (raw[j].y > maxY) maxY = raw[j].y;
    }
    var srcW = maxX - minX, srcH = maxY - minY;
    var dstW = BOX_MAX - BOX_MIN, dstH = BOX_Y_MAX - BOX_MIN;

    // uniform scale preserving aspect; a degenerate (single point / flat line) axis
    // contributes no constraint (Infinity), so the other axis governs.
    var sx = srcW > 0 ? dstW / srcW : Infinity;
    var sy = srcH > 0 ? dstH / srcH : Infinity;
    var s = Math.min(sx, sy);
    if (!isFinite(s)) s = 1;   // single point: arbitrary scale, will be centered

    // center the scaled figure within the destination box
    var fitW = srcW * s, fitH = srcH * s;
    var offX = BOX_MIN + (dstW - fitW) / 2;
    var offY = BOX_MIN + (dstH - fitH) / 2;

    var stars = [];
    for (var k = 0; k < raw.length; k++) {
      stars.push({
        x: +(offX + (raw[k].x - minX) * s).toFixed(2),
        y: +(offY + (raw[k].y - minY) * s).toFixed(2),
        mag: raw[k].mag
      });
    }

    // Lone-star polish: a single resolved star would otherwise center at the
    // vertical midpoint (~y42), leaving a yawning gap above the label band
    // (label prints ~y92). Drop it lower/closer to its label (x50, y56) so it
    // reads intentionally as "this star, named below," not a stray dot.
    if (stars.length === 1) {
      stars[0].x = 50;
      stars[0].y = 56;
    }

    // polyline through members in listed order (consecutive index pairs)
    var lines = [];
    for (var L = 0; L + 1 < stars.length; L++) lines.push([L, L + 1]);

    return { name: ast.name, myth: ast.myth, stars: stars, lines: lines };
  }

  /* ── pick the earned figure (uncached) ──────────────────────────────────────── */
  function pickEarned() {
    var Sky = root.Sky, WS = root.WS;
    if (!Sky || !WS || typeof Sky.state !== 'function'
        || typeof Sky.visitedFromStore !== 'function' || typeof WS.store !== 'function') {
      return null;   // libs absent → degrade to bare starfield
    }

    var store;
    try { store = WS.store(); } catch (e) { return null; }

    var st;
    try {
      st = Sky.state(Sky.visitedFromStore(store), Sky.CATALOG, Sky.WINGS, Sky.FEATS);
    } catch (e2) { return null; }
    if (!st || !st.asterisms) return null;

    var unlocked = st.asterisms.filter(function (a) { return a && a.complete; });
    if (!unlocked.length) return null;   // authentic cold-start: draw nothing

    var pins = readPins();

    // dev pin: ?asterism=<id> — honor ANY unlocked id (explicit dev choice, even a
    // single-star one); ignore only if that id isn't genuinely unlocked.
    if (pins.asterism) {
      for (var p = 0; p < unlocked.length; p++) {
        if (unlocked[p].id === pins.asterism) return fitFigure(unlocked[p], Sky.CATALOG);
      }
      // pinned id not unlocked → fall through to the random pick (no fakery)
    }

    // PREFER FIGURES: a real constellation needs >=2 stars to draw a connecting
    // line. Some Survey asterisms are single-room feat-leads (The Surveyor, etc.)
    // and resolve to one lone star — a grand label over a stray dot reads as
    // broken. Build a pool of those whose RESOLVED star count is >=2 (counting
    // only members present in Sky.CATALOG, since a 2-member asterism missing a
    // catalog entry resolves to a single star). Pick from figures when any exist;
    // fall back to the full unlocked set (lone stars included) only when the
    // visitor has NOTHING but single-room feat-leads — then their one star shows.
    function resolvedStarCount(a) {
      var m = a.members || [], n = 0;
      for (var i = 0; i < m.length; i++) if (Sky.CATALOG[m[i]]) n++;
      return n;
    }
    var figures = unlocked.filter(function (a) { return resolvedStarCount(a) >= 2; });
    var pool = figures.length ? figures : unlocked;

    // pick one at random; ?seed makes it reproducible, else per-visit random
    var r = (pins.seed != null) ? mulberry32(pins.seed)() : Math.random();
    var idx = Math.floor(r * pool.length);
    if (idx >= pool.length) idx = pool.length - 1;   // guard r===1
    return fitFigure(pool[idx], Sky.CATALOG);
  }

  /* ── current(): the figure to draw, CACHED for the page load ──────────────────
     scene.js may call this more than once per render; the pick (and its random
     choice) MUST be stable within a load, so we memoize. `_cached === undefined`
     means "not yet computed"; a computed null (cold-start) is cached too. */
  var _cached;   // undefined until first call; then a figure object OR null
  AST.current = function () {
    if (_cached === undefined) _cached = pickEarned();
    return _cached;
  };

  /* test seam: drop the memo (used only by the node self-test to re-pick under a
     changed store/pins; never called by the scene). */
  AST._reset = function () { _cached = undefined; };

  /* test seams: read/write the live memo so a self-test that must temporarily stub
     the pick (the asterism negative-control) can SAVE the live figure before the stub
     and RESTORE it after — leaving AST.current() returning the EXACT figure drawn at
     boot. Without this, _reset() after a stub re-rolls a different random figure on the
     next current() call (the first weather change), corrupting the showcased pick.
     Never called by the scene. */
  AST._peek = function () { return _cached; };
  AST._poke = function (f) { _cached = f; };

  AST.PLACEHOLDER = PLACEHOLDER;

  Gate.asterism = AST;

  if (typeof module !== 'undefined' && module.exports) { module.exports = AST; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
