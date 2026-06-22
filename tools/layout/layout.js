/* ════════════════════════════════════════════════════════════════════════════
   layout.js — the Workshop estate plan's DECLARATIVE PLACEMENT engine (Layout).

   The map's rooms DECLARE intent (district + tier + optional wing); this module
   DERIVES every coordinate, size, boundary, route, and zone label from those
   declarations plus two closed config tables (DISTRICTS, WING_META). No room
   carries a pixel. Adding a room = appending {district, tier, wing?, +content}.

   THE PIPELINE (Layout.solve(places, opts) → a frozen solution):
     1. validate    — an unknown district id is a HARD BUILD ERROR (assert).
     2. group        — rooms → districts → wings (stable-sorted by order,id).
     3. pack wings   — densest-first interior grid per wing → a wing AABB.
     4. shelf wings   — first-fit-decreasing wing AABBs into the district frame.
     5. fit district  — scale/centre each district's packed content into its frame.
     6. footprints    — every room gets {x,y,w,h} (or {x,y,r} for a tower) by tier.
     7. graph         — door → spine → district avenues → wing aisles → room stubs.

   The whole solve is DETERMINISTIC (seeded; no RNG, no resize re-solve) and
   coordinate-pure (no DOM) so it runs identically in Node for tests. In a browser
   this attaches a `Layout` global; under forge it is inlined as the 4th include.

   All coordinates are raw viewBox units in the 1440×900 plate. The plate's dark
   margins are RESERVED for the Survey-of-Heaven stars; every district frame is
   confined to the star-clear interior envelope so a footprint can never collide
   with a catalog star (verified: all 35 stars lie outside FIELD).
   ════════════════════════════════════════════════════════════════════════════ */

var Layout = (function () {
  'use strict';

  /* ── the star-clear interior envelope. Every catalog star lies outside this
     rectangle (min star inside-x 318 y34; the envelope stops short of all of
     them), so a generated footprint constrained here never touches a star. ── */
  var FIELD = { x: 162, y: 150, w: 1116, h: 668 };   // x 162..1278, y 150..818

  /* ── SIZE_BAND[tier]: footprint w×h by rank. tier-1 grand, tier-2 standard,
     tier-3 folly. A 'tower' footprint uses r = min(w,h)/2 of its band.        */
  var SIZE_BAND = {
    1: { w: 168, h: 116 },
    2: { w: 122, h: 86 },
    3: { w: 92, h: 64 }
  };
  /* a district may carry a `lotScale` < 1 — interior rooms (the manor's wing cells)
     are naturally smaller than free-standing grounds buildings, so the manor packs
     its six rooms inside its pinned shell at a tighter lot without scale-crushing. */
  function bandFor(tier, district) {
    var b = SIZE_BAND[tier] || SIZE_BAND[2];
    var ls = (district && DISTRICTS[district] && DISTRICTS[district].lotScale) || 1;
    if (ls === 1) return b;
    return { w: Math.round(b.w * ls), h: Math.round(b.h * ls) };
  }

  var GUTTER = 16;        // gap between slots in a wing grid and between wing blocks
  var WING_PAD = 14;      // pad from a wing's slot-union to its tinted boundary
  var DISTRICT_PAD = 16;  // pad from a district's wing-union to its frame boundary

  /* the manor packs tightly inside its small pinned shell (interior cells, small
     gutters) so six rooms read at a legible size rather than scale-crushing. */
  function gutterFor(district) { return district === 'manor' ? 9 : GUTTER; }
  function wingPadFor(district) { return district === 'manor' ? 7 : WING_PAD; }
  function districtPadFor(district) { return district === 'manor' ? 8 : DISTRICT_PAD; }

  /* ── DISTRICTS: the closed config table. Each district owns a fixed rectangular
     REGION budget in the plate (the packer fills within it; it is NOT a room
     position). `inside` is derived here, never declared per-room. An unknown
     district id passed to solve() is a HARD BUILD ERROR. ──

     The MANOR region is PINNED to the historic static shell box (x586 y296
     270×208) so the candle-pool (x421 y150 600×600) and the frozen coordinate
     envelope stay sky-valid. Other regions tile the interior, manor-central. */
  var DISTRICTS = {
    manor: {
      region: { x: 586, y: 296, w: 270, h: 208 },
      inside: true, anchor: true, style: 'party-wall', lotScale: 0.74,
      label: 'THE MANOR HOUSE', hue: '#c9a24a', tint: 0.045
    },
    grounds: {
      // the grounds wrap the manor; its wings get their own sub-regions placed by
      // the district-frame table below, so the grounds REGION is the whole field
      // envelope and wings are distributed by their declared sub-anchors.
      region: { x: 162, y: 150, w: 1116, h: 668 },
      inside: false, style: 'park-line',
      label: 'THE GROUNDS', hue: '#86b39a', tint: 0.03
    },
    observatory: {
      region: { x: 175, y: 175, w: 250, h: 180 },
      inside: false, tier: 1, style: 'rise-line',
      label: 'THE OBSERVATORY RISE', hue: '#9db4ff', tint: 0.035
    },
    outbuilding: {
      region: { x: 470, y: 560, w: 188, h: 120 },
      inside: false, tier: 3, style: 'shed-line',
      label: 'THE OUTBUILDING', hue: '#c9a24a', tint: 0.03
    },
    cavern: {
      region: { x: 980, y: 660, w: 230, h: 150 },
      inside: false, style: 'hatch',
      label: 'THE OUTSKIRTS', hue: '#7fd4c0', tint: 0.04
    },
    beneath: {
      region: { x: 686, y: 514, w: 70, h: 70 },
      inside: true, gated: true, style: 'stipple',
      label: 'BENEATH', hue: '#c9a24a', tint: 0.05
    }
  };

  /* WING sub-regions inside the GROUNDS — declarative anchors for each grounds
     wing block, spread to kill the dead upper-right quadrant. The packer fills
     a wing's rooms inside its sub-region; the balance is hand-budgeted here once
     (it is the district-tiling table, not a per-room position). */
  var GROUNDS_WINGS = {
    optics:      { x: 214, y: 392, w: 196, h: 132 },   // west park (Hall of Mirrors) — pulled E off the far wall
    number:      { x: 470, y: 664, w: 224, h: 120 },   // lower-left park (Numbers Room) — lifted off the bottom margin
    works:       { x: 700, y: 540, w: 300, h: 222 },   // working edge, south of the house — lifted, tightened
    glasshouses: { x: 240, y: 560, w: 230, h: 130 },   // living systems (Strange Garden) west-low
    amusements:  { x: 910, y: 240, w: 280, h: 280 }    // upper-right court (arcade + maze) — pulled toward the house, de-streaked
  };
  /* the Conservatory (living-systems wing, glasshouse-wing footprint) sits on the
     east grounds; give it its own east-band sub-region distinct from the western
     glasshouses so the two glass wings don't fight for one block. */
  GROUNDS_WINGS.conservatory_band = { x: 1006, y: 548, w: 212, h: 150 };  // pulled W off the SE corner toward the working core
  /* HOROLOGY — the estate's timekeeping garden (The Hours' master sundial). Set in
     the OPEN upper-right park band along the east edge, where the sun sweeps the
     whole day across an unobstructed sky — a sundial wants open ground. Its own
     sub-region (verified star/footprint/furniture/pool-clear by hours.test.cjs's
     live Layout.solve) so the gnomon never crowds amusements or a catalog star. */
  GROUNDS_WINGS.horology = { x: 1100, y: 152, w: 178, h: 200 };
  /* AEROSPACE — The Aerodrome, where you push off and AUTHOR an orbit by hand
     (sibling to the Observatory's Orrery, which wheels the orbits already chosen).
     Set in the OPEN upper-LEFT sky court, left of the candle-pool decoration
     (x421+) — a launch needs clear sky up-and-right. Its own sub-region keeps the
     launch-rail footprint just to the RIGHT of the Observatory's firmament tower
     (x242-358) in the upper sky band — adjacent sibling, collision-free. Verified
     clear of every footprint + catalog star (FINALIZED via smoke.cjs's live
     Layout.solve: the brief's x214 region overlapped firmament's tower, so the
     court is nudged right to seat the rail clear in the open upper court). */
  GROUNDS_WINGS.aerospace = { x: 366, y: 156, w: 200, h: 140 };
  /* CURVED COUNTRY — The Holonomy Walk, where you carry a gold spear around a loop
     on a court you can BEND and it comes home pointing wrong (the curvature you
     enclosed). A curved LANDSCAPE you traverse OUTSIDE → the open WEST PARK, set in
     the clear band BELOW the Hall of Mirrors (its optics footprint ends ~y507) and
     LEFT of the western glasshouses cluster (kirigami/strange-garden anchor ~x322),
     clear of the manor candle-pool (x421+). Sized for GROWTH: the seed promises
     siblings (a Gauss-Bonnet polygon, a cone's deficit angle, a curvature-cancelling
     torus). Verified clear of every footprint + catalog star via smoke.cjs's live
     Layout.solve (a wider region collides the glasshouses; this band seats it clean). */
  GROUNDS_WINGS['curved-country'] = { x: 170, y: 520, w: 150, h: 160 };
  /* INDUCTION — The Lodestone Hall, the estate's first ELECTROMAGNETISM wing: a
     working generator/alternator bench where the only current is the one you make
     by MOVING (no battery). Seated as a KIN PILLAR beside thermo: in the working
     south band just LEFT of The Works (x700,y540), so EM sits adjacent to the
     Engine Room as a fellow power-house. Its own sub-region, sized for ≥4 growth
     lots (the obvious siblings: an LC tank, a transformer, an eddy brake, a
     betatron). Builder finalises exact x/y via smoke.cjs's live Layout.solve —
     verified clear of every footprint + catalog star (the works block ends ~x1000,
     amusements begins ~x910 upper-right; this lower-mid band is open). */
  GROUNDS_WINGS.induction = { x: 600, y: 690, w: 210, h: 120 };
  /* DRAWING-ENGINES — The Drawing Room, the estate's COMPUTE-BY-DRAWING wing (a
     Scheiner pantograph that copies your hand at a dialed scale). Kin to the other
     brass drawing-engines (linkage's exact line, the trammel's ellipse, the
     spirograph's rosette). Seated in the open west-central park BELOW the optics /
     waves column (optics ends ~y524, waves ~y542) and LEFT of the number wing
     (x470+): a clear lower-west band. Sized for ≥4 growth lots (the named-dark
     siblings: Hart's inversor, a conchoidograph — plus room for two more). Builder
     FINALISED exact x/y via smoke.cjs's live Layout.solve, verified clear of every
     footprint + catalog star + the legibility conscience. */
  GROUNDS_WINGS['drawing-engines'] = { x: 166, y: 540, w: 150, h: 150 };
  /* WAVES — the wave-INTERFERENCE family (Ripple, the silent tank, + The Loud and the
     Quiet Walk, the same field sung to your ear). Kin to OPTICS (both are "what light/
     waves DO"), but a distinct family: interference & superposition, not geometric
     bending. Seated as OPTICS' downstairs neighbour in the open west-central park —
     directly RIGHT of the optics block (x269–354,y398–458) and ABOVE the lower-west
     glasshouse cluster — so the two wave wings read as a column down the west grounds.
     Sized for ≥2 lots now with room to grow (a beat/standing-wave bench, a diffraction
     grating). Builder verified clear of every footprint + catalog star via smoke.cjs's
     live Layout.solve (the fallback crammed it into the curved-country/glasshouse band;
     this west-central band seats both tank footprints clean). */
  GROUNDS_WINGS.waves = { x: 398, y: 392, w: 168, h: 150 };

  /* ── WING_META: display label, representative accent (for tint + engraved
     label), and optional grows:N reserved-lot count. An unknown wing is allowed
     (it just gets a default label derived from the slug). ── */
  var WING_META = {
    studies:     { label: 'THE STUDIES',        accent: '#cba15a' },
    east:        { label: 'THE EAST WING',      accent: '#74b0a6' },
    maker:       { label: "THE MAKER'S WING",   accent: '#7ad0c4' },
    archive:     { label: 'THE ARCHIVE',        accent: '#c9a44e' },
    reckoning:   { label: 'THE RECKONING CABINET', accent: '#c9a24a' },
    glasshouses: { label: 'THE GLASSHOUSES',    accent: '#7fd1c7' },
    optics:      { label: 'OPTICS',             accent: '#8fd9ff' },
    number:      { label: 'THE NUMBER WING',    accent: '#c9a24a' },
    amusements:  { label: 'AMUSEMENTS',         accent: '#37f7e0' },
    works:       { label: 'THE WORKS',          accent: '#d9a441' },
    conservatory:{ label: 'LIVING-SYSTEMS WING', accent: '#86d39a' },
    horology:    { label: 'HOROLOGY',           accent: '#e6bd6f' },
    aerospace:   { label: 'THE AERODROME',      accent: '#cdd6e0' },
    sewing:      { label: 'THE SEWING ROOM',    accent: '#d9b873' },
    stellar:     { label: 'THE STELLAR WING',   accent: '#9db4ff' },
    vantages:    { label: 'SCENES YOU WALK INTO', accent: '#9db4ff' },
    'moving-frame': { label: 'THE MOVING FRAME', accent: '#9db4ff' },
    cosmology:   { label: 'COSMOLOGY',          accent: '#9db4ff' },
    arrow:       { label: 'THE ARROW WING',     accent: '#c9a24a' },
    'curved-country': { label: 'CURVED COUNTRY', accent: '#caa15a' },
    induction:   { label: 'ELECTROMAGNETISM', accent: '#7fd4ff' },
    'drawing-engines': { label: 'DRAWING ENGINES', accent: '#c9a24a' },
    'kinetics-sound': { label: 'KINETICS & SOUND', accent: '#d8a94a' },
    waves:       { label: 'WAVES',              accent: '#54d6d0' }
  };
  function wingLabel(slug) {
    if (WING_META[slug] && WING_META[slug].label) return WING_META[slug].label;
    return ('THE ' + String(slug).replace(/[-_]/g, ' ') + ' WING').toUpperCase();
  }
  function wingAccent(slug, fallback) {
    if (WING_META[slug] && WING_META[slug].accent) return WING_META[slug].accent;
    return fallback || '#b29a64';
  }

  /* ── stable comparator: (order asc, then id asc) ── */
  function byOrderId(a, b) {
    var oa = a.order == null ? 1e9 : a.order, ob = b.order == null ? 1e9 : b.order;
    if (oa !== ob) return oa - ob;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }

  /* ── pack n slots (each w×h) densest-first into a grid bounded by maxW.
     cols = min(ceil(sqrt(n)), floor((maxW+G)/(w+G))), at least 1. Returns slot
     top-lefts (origin 0,0) + the union AABB {w,h}. Deterministic. ── */
  function packGrid(n, sw, sh, maxW, gut) {
    gut = gut == null ? GUTTER : gut;
    var colsByWidth = Math.max(1, Math.floor((maxW + gut) / (sw + gut)));
    var cols = Math.min(Math.max(1, Math.ceil(Math.sqrt(n))), colsByWidth);
    var slots = [];
    for (var i = 0; i < n; i++) {
      var c = i % cols, rr = Math.floor(i / cols);
      slots.push({ x: c * (sw + gut), y: rr * (sh + gut), w: sw, h: sh });
    }
    var rows = Math.ceil(n / cols);
    var usedCols = Math.min(cols, n);
    return {
      slots: slots,
      w: usedCols * sw + (usedCols - 1) * gut,
      h: rows * sh + (rows - 1) * gut
    };
  }

  /* ── THE COLUMN-COLLAPSE GUARD (general principle, #275). A district's POI
     placement must NEVER let a crowded room set collapse into one tall column that
     scale-crushes every footprint (and its label) into a single illegible stack.
     packGrid() picks cols = min(ceil√n, colsByWidth); when colsByWidth forces ONE
     column for n rooms that don't fit the region HEIGHT, the grid is a tall stack
     that fitInto() then crushes. This guard asserts the failure LOUD: a future
     crowded district trips a build error pointing at the fix (widen the region, or
     give the district a 2-D formation like the observatory's rings), rather than
     silently overlapping. It is a no-op for every district that packs ≥ 2 columns
     or whose single column genuinely fits its region. ── */
  function assertNoColumnCollapse(district, n, band, region, gut, pad) {
    if (n < 2) return;
    var innerW = region.w - 2 * pad;
    var colsByWidth = Math.max(1, Math.floor((innerW + gut) / (band.w + gut)));
    if (colsByWidth >= 2) return;                         // packs ≥ 2 columns → fine
    var colH = n * band.h + (n - 1) * gut;                // height of the 1-col stack
    var innerH = region.h - 2 * pad;
    if (colH <= innerH + 0.5) return;                     // the single column genuinely fits
    throw new Error('Layout: district "' + district + '" would collapse ' + n +
      ' rooms into ONE crushed column (region ' + region.w + '×' + region.h +
      ' fits only 1 column of ' + band.w + 'px lots, but the stack is ' +
      Math.round(colH) + 'px tall > ' + Math.round(innerH) + 'px). Widen the ' +
      'region or give the district a 2-D formation (see placeObservatoryRings).');
  }

  /* ── CONCENTRIC-RING formation (#275) — the observatory's contour-map look from
     above. n rooms become: ONE at the centre; an inner ring of up to 8 (so the
     band reads as one contour); then outer rings holding the remainder, one
     POI-width further out each. Ring radii + a UNIFORM backing radius `b` are SIZED
     to the slot so (1) every pair of foot-circle backings is disjoint with a gutter,
     and (2) the whole formation fits inside a disc of radius `halfMin` centred in
     the region (so nothing spills past the plate frame). Deterministic; pure. ── */
  function ringCounts(n) {
    var rings = [], rem = n;
    if (rem > 0) { rings.push(1); rem -= 1; }             // the centre
    if (rem > 0) { var c = Math.min(8, rem); rings.push(c); rem -= c; }  // inner ring ≤ 8
    var cap = 12;
    while (rem > 0) { var k = Math.min(cap, rem); rings.push(k); rem -= k; cap += 4; }
    return rings;                                          // [centre, inner, outer, …]
  }
  /* solve equal ring spacing S + the largest uniform backing radius b that keeps
     every backing pairwise-disjoint (within-ring chord, radial spacing, centre↔ring1)
     AND fits the outermost ring + b inside halfMin. Returns {radii, b}. */
  function solveRingRadii(counts, halfMin, gut) {
    var nRings = counts.length - 1;                       // outer rings (excl. centre)
    if (nRings === 0) return { radii: [0], b: Math.max(4, Math.min(halfMin * 0.5, 18)) };
    var best = null;
    for (var S = 4; S <= halfMin; S += 0.25) {
      var radii = [0];
      for (var k = 1; k <= nRings; k++) radii.push(k * S);
      var b = (S - gut) / 2;                               // radial spacing (centre↔r1 + r_k↔r_{k+1})
      for (var j = 1; j <= nRings; j++) {
        var nk = counts[j];
        if (nk >= 2) {                                     // within-ring chord ≥ 2b+gut
          var chordB = radii[j] * Math.sin(Math.PI / nk) - gut / 2;
          if (chordB < b) b = chordB;
        }
      }
      var fitB = halfMin - radii[nRings];                 // outermost ring + b ≤ halfMin
      if (fitB < b) b = fitB;
      if (b > 0 && (!best || b > best.b)) best = { radii: radii.slice(), b: b };
    }
    return best || { radii: [0], b: Math.max(4, halfMin * 0.4) };
  }

  /* place one observatory district's rooms as concentric rings. Emits a circular
     foot for every room (towers stay circular; a non-tower footprint gets a centred
     square whose inscribed circle == the backing) and the per-wing tint rects.
     Supersedes wing-shelving for THIS district (the rise has no room to shelf wings
     side by side); wing membership still drives breadcrumbs/links elsewhere. */
  function placeObservatoryRings(rooms, solution) {
    if (!rooms.length) return null;
    var conf = DISTRICTS.observatory, region = conf.region;
    var pad = DISTRICT_PAD, gut = 6;
    var list = rooms.slice().sort(byOrderId);
    var n = list.length;
    var cx = region.x + region.w / 2, cy = region.y + region.h / 2;
    var halfMin = Math.min(region.w - 2 * pad, region.h - 2 * pad) / 2;
    var counts = ringCounts(n);
    var sol = solveRingRadii(counts, halfMin, gut);
    var b = sol.b, radii = sol.radii;

    // assign each room to a (ring, slot-within-ring); centre first, then rings.
    var idx = 0;
    var allCircles = [];
    for (var ri = 0; ri < counts.length; ri++) {
      var cnt = counts[ri], R = radii[ri];
      // offset each ring's start bearing by half a step from the previous so a
      // cardinal POI sits beside its neighbour's diagonal — keeps backings clear
      // even when two sub-rings are close (the design's alternating-bearing note).
      var base = (ri % 2 === 0) ? -Math.PI / 2 : (-Math.PI / 2 + Math.PI / Math.max(1, cnt));
      for (var s = 0; s < cnt && idx < n; s++) {
        var ang = base + (cnt > 1 ? (2 * Math.PI * s / cnt) : 0);
        var px = cx + (R === 0 ? 0 : R * Math.cos(ang));
        var py = cy + (R === 0 ? 0 : R * Math.sin(ang));
        var room = list[idx++];
        // a 2b×2b slot CENTRED on (px,py). setFoot derives both a tower's circle
        // (centre = slot.x+slot.w/2 = px, r = b) and a non-tower's square (inscribed
        // circle = b) from the SAME top-left origin, so every backing is centred on
        // its ring point regardless of footprint.
        var slot = { x: px - b, y: py - b, w: 2 * b, h: 2 * b };
        setFoot(solution, room, slot);
        allCircles.push({ cx: px, cy: py, r: b, room: room });
      }
    }

    // emit per-wing tint rects (a bounded tint over each wing's members), so wing
    // membership still reads on the plate even under the ring formation.
    var wingGroups = {};
    for (var w = 0; w < allCircles.length; w++) {
      var wid = allCircles[w].room.wing || '';
      if (wid === '') continue;
      (wingGroups[wid] = wingGroups[wid] || []).push(allCircles[w]);
    }
    var wkeys = Object.keys(wingGroups).sort();
    for (var wk = 0; wk < wkeys.length; wk++) {
      var grp = wingGroups[wkeys[wk]];
      var rects = grp.map(function (c) { return { x: c.cx - c.r, y: c.cy - c.r, w: 2 * c.r, h: 2 * c.r }; });
      var wu = rectUnion(rects);
      solution.wingRects.push({
        district: 'observatory', wing: wkeys[wk],
        label: wingLabel(wkeys[wk]), accent: wingAccent(wkeys[wk], conf.hue),
        x: wu.x - 3, y: wu.y - 3, w: wu.w + 6, h: wu.h + 6
      });
    }

    // the district union = the bounding box of every backing circle.
    var du = rectUnion(allCircles.map(function (c) {
      return { x: c.cx - c.r, y: c.cy - c.r, w: 2 * c.r, h: 2 * c.r };
    }));
    return du;
  }

  /* ── shelf-pack a list of {w,h} blocks into a frame of inner width fw, first-fit
     by row (skyline), top-left origin, GUTTER between. Returns block offsets +
     the union AABB. Used to lay wing blocks side by side in a district. ── */
  function shelfPack(blocks, fw, gut) {
    gut = gut == null ? GUTTER : gut;
    var offs = [], cx = 0, cy = 0, rowH = 0, unionW = 0, unionH = 0;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (cx > 0 && cx + b.w > fw) { cx = 0; cy += rowH + gut; rowH = 0; }
      offs.push({ x: cx, y: cy, w: b.w, h: b.h });
      cx += b.w + gut;
      if (b.h > rowH) rowH = b.h;
      if (offs[i].x + b.w > unionW) unionW = offs[i].x + b.w;
      if (cy + b.h > unionH) unionH = cy + b.h;
    }
    return { offs: offs, w: unionW, h: unionH };
  }

  /* fit a packed content AABB (w,h at origin) into a target region, returning a
     transform {ox,oy,s} that centres + uniformly scales DOWN (never up past 1)
     so the content sits inside region with DISTRICT_PAD breathing room. */
  function fitInto(contentW, contentH, region, pad) {
    pad = pad == null ? DISTRICT_PAD : pad;
    var availW = region.w - 2 * pad, availH = region.h - 2 * pad;
    var s = 1;
    if (contentW > availW) s = Math.min(s, availW / contentW);
    if (contentH > availH) s = Math.min(s, availH / contentH);
    var ox = region.x + pad + (availW - contentW * s) / 2;
    var oy = region.y + pad + (availH - contentH * s) / 2;
    return { ox: ox, oy: oy, s: s };
  }

  function clampToField(box) {
    var x = Math.max(FIELD.x, Math.min(box.x, FIELD.x + FIELD.w - box.w));
    var y = Math.max(FIELD.y, Math.min(box.y, FIELD.y + FIELD.h - box.h));
    return { x: x, y: y, w: box.w, h: box.h };
  }

  function rectUnion(rects) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.x < x0) x0 = r.x; if (r.y < y0) y0 = r.y;
      if (r.x + r.w > x1) x1 = r.x + r.w; if (r.y + r.h > y1) y1 = r.y + r.h;
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ── the core solve ──────────────────────────────────────────────────────── */
  function solve(places, opts) {
    opts = opts || {};
    var solution = {
      foot: {},        // id → {x,y,w,h} or {x,y,r} (tower)
      footMeta: {},    // id → {tier, district, wing, footprint}
      wingRects: [],   // [{district, wing, label, accent, x,y,w,h}]
      districtRects: [], // [{district, label, hue, tint, style, x,y,w,h, anchor}]
      graph: { door: null, spine: null, avenues: [], aisles: [], stubs: [] },
      door: null
    };

    // ── 1. validate + group ──
    var byDistrict = {};
    for (var i = 0; i < places.length; i++) {
      var r = places[i];
      if (!DISTRICTS[r.district]) {
        throw new Error('Layout: room "' + r.id + '" declares unknown district "' +
          r.district + '". Add it to DISTRICTS or fix the declaration.');
      }
      if (r.locked) continue;   // beneath/undercroft is placed by revealUndercroft
      (byDistrict[r.district] = byDistrict[r.district] || []).push(r);
    }

    // ── 2..6: place each district's rooms ──
    placeManor(byDistrict.manor || [], solution);
    placeGrounds(byDistrict.grounds || [], solution);
    placeObservatory(byDistrict.observatory || [], solution);
    placeSimpleDistrict('outbuilding', byDistrict.outbuilding || [], solution);
    placeSimpleDistrict('cavern', byDistrict.cavern || [], solution);

    // ── 7: the circulation graph ──
    buildGraph(solution);

    return solution;
  }

  /* assign footprint geometry for one room into a slot rect (already absolute) */
  function setFoot(solution, r, slot) {
    var meta = { tier: r.tier, district: r.district, wing: r.wing || null,
                 footprint: r.footprint || null };
    solution.footMeta[r.id] = meta;
    if (r.footprint === 'tower') {
      var rad = Math.min(slot.w, slot.h) / 2;
      solution.foot[r.id] = { x: slot.x + slot.w / 2, y: slot.y + slot.h / 2, r: rad };
    } else {
      solution.foot[r.id] = { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    }
  }

  /* group rooms of one district by wing, pack each wing, shelf the wing blocks,
     fit the content into `region`, emit footprints + wing rects + a district rect.
     `regionOverride` lets the grounds place wings into their own sub-regions. */
  function packDistrictInto(district, rooms, region, solution, opts) {
    opts = opts || {};
    if (!rooms.length) return null;
    var conf = DISTRICTS[district];
    var GUT = gutterFor(district), WPAD = wingPadFor(district), DPAD = districtPadFor(district);

    // group by wing (undefined wing → '' remainder bucket)
    var wings = {};
    for (var i = 0; i < rooms.length; i++) {
      var w = rooms[i].wing || '';
      (wings[w] = wings[w] || []).push(rooms[i]);
    }
    var wingIds = Object.keys(wings).sort();

    // GENERAL PRINCIPLE (#275): a district whose rooms can't fit a single column's
    // width must overflow into a SECOND dimension, never stack one crushed column.
    // Assert loud here so a future crowded district fails at build time pointing at
    // the fix (the observatory escapes this via its concentric-ring formation).
    var tierBand = bandFor((rooms[0] && rooms[0].tier) || 2, district);
    assertNoColumnCollapse(district, rooms.length, tierBand, region, GUT, DPAD);

    // pack each wing into a local grid; collect its block size + per-room slots
    var blocks = [];
    var wingPacks = {};
    var frameInnerW = region.w - 2 * DPAD;
    for (var wi = 0; wi < wingIds.length; wi++) {
      var wid = wingIds[wi];
      var list = wings[wid].slice().sort(byOrderId);
      // all rooms in a wing share a tier (kin look alike); use the first room's band
      var band = bandFor(list[0].tier, district);
      var pk = packGrid(list.length, band.w, band.h, frameInnerW - 2 * WPAD, GUT);
      wingPacks[wid] = { list: list, pack: pk };
      // a wing block is its slot-union + WPAD all around
      blocks.push({ wid: wid, w: pk.w + 2 * WPAD, h: pk.h + 2 * WPAD });
    }
    // shelf-pack the wing blocks (first-fit-decreasing by area for tighter packing)
    var order = blocks.slice().sort(function (a, b) { return b.w * b.h - a.w * a.h; });
    var sp = shelfPack(order, frameInnerW, GUT);
    // map back: order[k] sits at sp.offs[k]
    var blockOff = {};
    for (var k = 0; k < order.length; k++) blockOff[order[k].wid] = sp.offs[k];

    // fit the packed content into the region
    var ft = fitInto(sp.w, sp.h, region, DPAD);

    // emit absolute footprints + wing rects
    var allSlots = [];
    for (var wj = 0; wj < wingIds.length; wj++) {
      var wid2 = wingIds[wj];
      var bo = blockOff[wid2];
      var wp = wingPacks[wid2];
      var wingSlotRects = [];
      for (var si = 0; si < wp.list.length; si++) {
        var s = wp.pack.slots[si];
        // local: blockOff + WPAD + slot, then scale+offset
        var lx = bo.x + WPAD + s.x, ly = bo.y + WPAD + s.y;
        var abs = {
          x: ft.ox + lx * ft.s,
          y: ft.oy + ly * ft.s,
          w: s.w * ft.s,
          h: s.h * ft.s
        };
        setFoot(solution, wp.list[si], abs);
        wingSlotRects.push(abs);
        allSlots.push(abs);
      }
      // a wing rect (even a solo wing gets a bounded tint) — only if the wing is named
      if (wid2 !== '') {
        var wu = rectUnion(wingSlotRects);
        solution.wingRects.push({
          district: district, wing: wid2,
          label: wingLabel(wid2), accent: wingAccent(wid2, conf.hue),
          x: wu.x - WPAD * ft.s, y: wu.y - WPAD * ft.s,
          w: wu.w + 2 * WPAD * ft.s, h: wu.h + 2 * WPAD * ft.s
        });
      }
    }
    var du = rectUnion(allSlots);
    return du;
  }

  /* the MANOR: pinned region, three wings (studies/east/maker). */
  function placeManor(rooms, solution) {
    if (!rooms.length) return;
    var conf = DISTRICTS.manor;
    var du = packDistrictInto('manor', rooms, conf.region, solution);
    emitDistrictRect('manor', du, solution);
  }

  /* the GROUNDS: each wing goes to its own sub-region (GROUNDS_WINGS), so the
     grounds spread across the field instead of crowding one block. */
  function placeGrounds(rooms, solution) {
    if (!rooms.length) return;
    var conf = DISTRICTS.grounds;
    // bucket rooms by wing → sub-region
    var wings = {};
    for (var i = 0; i < rooms.length; i++) {
      var w = rooms[i].wing || '_remainder';
      (wings[w] = wings[w] || []).push(rooms[i]);
    }
    var allDU = [];
    var wingIds = Object.keys(wings).sort();
    for (var wj = 0; wj < wingIds.length; wj++) {
      var wid = wingIds[wj];
      var list = wings[wid].slice().sort(byOrderId);
      // pick a sub-region: conservatory-wing rooms use the east band
      var sub = GROUNDS_WINGS[wid];
      if (!sub && wid === 'conservatory') sub = GROUNDS_WINGS.conservatory_band;
      if (!sub) sub = GROUNDS_WINGS[wid] || { x: FIELD.x, y: FIELD.y + 480, w: 240, h: 130 };
      var band = bandFor(list[0].tier, 'grounds');
      var pk = packGrid(list.length, band.w, band.h, sub.w - 2 * WING_PAD);
      var ft = fitInto(pk.w + 2 * WING_PAD, pk.h + 2 * WING_PAD, sub, 6);
      var slotRects = [];
      for (var si = 0; si < list.length; si++) {
        var s = pk.slots[si];
        var lx = WING_PAD + s.x, ly = WING_PAD + s.y;
        var abs = clampToField({
          x: ft.ox + lx * ft.s, y: ft.oy + ly * ft.s,
          w: s.w * ft.s, h: s.h * ft.s
        });
        setFoot(solution, list[si], abs);
        slotRects.push(abs);
        allDU.push(abs);
      }
      if (wid !== '_remainder') {
        var wu = rectUnion(slotRects);
        var pad = WING_PAD * ft.s;
        solution.wingRects.push({
          district: 'grounds', wing: wid,
          label: wingLabel(wid), accent: wingAccent(wid, conf.hue),
          x: wu.x - pad, y: wu.y - pad, w: wu.w + 2 * pad, h: wu.h + 2 * pad
        });
      }
    }
    var du = rectUnion(allDU);
    emitDistrictRect('grounds', du, solution);
  }

  /* the OBSERVATORY: a concentric-ring formation (the rise's contour-map look),
     NOT a packed grid (#275 — the grid collapsed its ~13 rooms into one crushed,
     overlapping column). See placeObservatoryRings. */
  function placeObservatory(rooms, solution) {
    if (!rooms.length) return;
    var du = placeObservatoryRings(rooms, solution);
    emitDistrictRect('observatory', du, solution);
  }

  /* a SIMPLE district (outbuilding/cavern): pack into its own region.
     These have no named wings — one bounded precinct. */
  function placeSimpleDistrict(district, rooms, solution) {
    if (!rooms.length) return;
    var conf = DISTRICTS[district];
    var du = packDistrictInto(district, rooms, conf.region, solution);
    emitDistrictRect(district, du, solution);
  }

  function emitDistrictRect(district, du, solution) {
    if (!du) return;
    var conf = DISTRICTS[district];
    var pad = districtPadFor(district);
    solution.districtRects.push({
      district: district, label: conf.label, hue: conf.hue, tint: conf.tint,
      style: conf.style, anchor: !!conf.anchor,
      x: du.x - pad, y: du.y - pad, w: du.w + 2 * pad, h: du.h + 2 * pad
    });
  }

  /* a district rect's south-centre gate point (where its avenue terminates) */
  function gateOf(dr) {
    if (dr.district === 'observatory') return { x: dr.x + dr.w / 2, y: dr.y + dr.h }; // gate at base of rise
    return { x: dr.x + dr.w / 2, y: dr.y };  // gate at the north (manor-facing) edge
  }

  /* build the circulation graph: door → spine → district avenues → wing aisles
     → room stubs. Coordinates from the solved district/wing/footprint rects. */
  function buildGraph(solution) {
    var manorRect = null;
    for (var i = 0; i < solution.districtRects.length; i++)
      if (solution.districtRects[i].district === 'manor') manorRect = solution.districtRects[i];
    var manorRegion = DISTRICTS.manor.region;
    // the FRONT DOOR: south-centre of the manor region (historic ~x721 y504)
    var door = { x: manorRegion.x + manorRegion.w / 2, y: manorRegion.y + manorRegion.h };
    solution.door = door;
    solution.graph.door = door;

    // the SPINE: a short heavy avenue rising up the manor centre from the door
    var spineTop = { x: door.x, y: manorRegion.y + manorRegion.h * 0.18 };
    solution.graph.spine = { x0: door.x, y0: door.y, x1: spineTop.x, y1: spineTop.y };

    // DISTRICT AVENUES: from the door to each non-manor district gate
    for (var d = 0; d < solution.districtRects.length; d++) {
      var dr = solution.districtRects[d];
      if (dr.district === 'manor') continue;
      var gate = gateOf(dr);
      solution.graph.avenues.push({
        district: dr.district, label: 'to ' + titleCase(dr.label),
        x0: door.x, y0: door.y, x1: gate.x, y1: gate.y
      });
    }

    // WING AISLES: from each wing rect's nearest edge toward the door, + a stub
    // to each room footprint edge (kin connectors). Manor wings get short stubs.
    for (var w2 = 0; w2 < solution.wingRects.length; w2++) {
      var wr = solution.wingRects[w2];
      var wc = { x: wr.x + wr.w / 2, y: wr.y + wr.h / 2 };
      // the wing's gate: the point on its boundary nearest the door
      var gx = Math.max(wr.x, Math.min(door.x, wr.x + wr.w));
      var gy = Math.max(wr.y, Math.min(door.y, wr.y + wr.h));
      solution.graph.aisles.push({
        district: wr.district, wing: wr.wing,
        x0: gx, y0: gy, x1: wc.x, y1: wc.y
      });
    }

    // ROOM STUBS: short connector from each footprint edge toward its wing centre
    for (var id in solution.foot) {
      var f = solution.foot[id];
      var c = f.r != null ? { x: f.x, y: f.y } : { x: f.x + f.w / 2, y: f.y + f.h / 2 };
      var meta = solution.footMeta[id];
      // find the wing rect this room belongs to (for a short kin stub)
      var target = null;
      if (meta && meta.wing) {
        for (var wk = 0; wk < solution.wingRects.length; wk++) {
          var w3 = solution.wingRects[wk];
          if (w3.district === meta.district && w3.wing === meta.wing) {
            target = { x: w3.x + w3.w / 2, y: w3.y + w3.h / 2 }; break;
          }
        }
      }
      if (!target) target = door;
      solution.graph.stubs.push({ id: id, x0: c.x, y0: c.y, x1: target.x, y1: target.y });
    }
  }

  function titleCase(s) {
    return String(s).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ════════════════════════════════════════════════════════════════════════════
     PLATES — "More Than One Front Door" (#262). The front door is no longer one
     crowded plate; it is a SET of plates the visitor TRAVELS between. This pure,
     deterministic, Node-testable partition is the SOLE authority's model.

     THE PARTITION (total + disjoint): every live room resolves to EXACTLY one plate.
     District is the default plate grain; the GROUNDS split West/East at the field
     x-midline (the biggest district → two walkable plates); cavern + outbuilding
     pool into "outskirts". A room landing exactly on the W/E midline tiebreaks by
     district-region order (deterministic), not raw x.

     Each plate's CAMERA target = its rooms' bbox padded ×1.45, k clamped ≤ ~3.2,
     with a minimum frame so a narrow plate does not over-zoom. The MANOR plate's
     bbox is EXTENDED to enclose the gated BENEATH slot so the Undercroft rides the
     manor plate and is never stranded (crux: beneath ∈ exactly one plate's bbox).

     THE ROAD GRAPH (reciprocal): manor is the hub (the front door lives in the
     manor), so every plate links to manor; the two grounds halves share the mid
     wall; the observatory rise shares the NW corner with grounds-west. Every edge
     is reciprocal (A↔B ⇔ B↔A) and every plate is reachable from the door. ── */
  var PLATE_PAD = 1.45;          // bbox padding factor for the camera frame
  var PLATE_K_MAX = 3.2;         // max zoom so a tiny plate never over-magnifies
  var PLATE_MIN_W = 360, PLATE_MIN_H = 240;  // minimum frame so narrow plates breathe

  var PLATE_META = {
    'manor':        { label: 'THE MANOR HOUSE',     hue: '#c9a24a' },
    'grounds-west': { label: 'THE WEST GROUNDS',    hue: '#86b39a' },
    'grounds-east': { label: 'THE EAST GROUNDS',    hue: '#37c9b0' },
    'observatory':  { label: 'THE OBSERVATORY RISE', hue: '#9db4ff' },
    'outskirts':    { label: 'THE OUTSKIRTS',       hue: '#7fd4c0' }
  };

  function footCentreOf(f) {
    return f.r != null ? { x: f.x, y: f.y } : { x: f.x + f.w / 2, y: f.y + f.h / 2 };
  }
  function footBBoxOf(f) {
    return f.r != null ? { x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 }
                       : { x: f.x, y: f.y, w: f.w, h: f.h };
  }

  /* which plate a room belongs to, given the solved solution (for the W/E split). */
  function plateOf(r, solution) {
    if (r.district === 'grounds') {
      var c = footCentreOf(solution.foot[r.id]);
      var mid = FIELD.x + FIELD.w / 2;
      // tiebreak a room exactly on the midline by id order → 'grounds-west' (lower x bias)
      return c.x < mid ? 'grounds-west' : (c.x > mid ? 'grounds-east' : 'grounds-west');
    }
    if (r.district === 'outbuilding' || r.district === 'cavern') return 'outskirts';
    return r.district; // manor, observatory
  }

  /* Layout.plates(places) → the total/disjoint partition + per-plate camera bbox +
     the reciprocal inter-plate road graph. Pure & deterministic (solves once). */
  function plates(places) {
    var live = places.filter(function (p) { return !p.locked; });
    var solution = solve(live);

    // 1. PARTITION (total + disjoint)
    var members = {};   // plateId → [room,...]
    var roomPlate = {}; // roomId → plateId
    for (var i = 0; i < live.length; i++) {
      var pid = plateOf(live[i], solution);
      (members[pid] = members[pid] || []).push(live[i]);
      roomPlate[live[i].id] = pid;
    }

    // 2. per-plate bbox over member footprints + camera frame
    var bbox = {};
    var pids = Object.keys(members).sort();
    for (var pi = 0; pi < pids.length; pi++) {
      var p = pids[pi], rooms = members[p];
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (var ri = 0; ri < rooms.length; ri++) {
        var b = footBBoxOf(solution.foot[rooms[ri].id]);
        if (b.x < x0) x0 = b.x; if (b.y < y0) y0 = b.y;
        if (b.x + b.w > x1) x1 = b.x + b.w; if (b.y + b.h > y1) y1 = b.y + b.h;
      }
      bbox[p] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    // EXTEND the manor plate to enclose the gated BENEATH slot (the Undercroft rides
    // the manor plate, never stranded). beneath ∈ exactly the manor plate's bbox.
    if (bbox.manor) {
      var bs = beneathSlot();
      var mx0 = Math.min(bbox.manor.x, bs.x);
      var my0 = Math.min(bbox.manor.y, bs.y);
      var mx1 = Math.max(bbox.manor.x + bbox.manor.w, bs.x + bs.w);
      var my1 = Math.max(bbox.manor.y + bbox.manor.h, bs.y + bs.h);
      bbox.manor = { x: mx0, y: my0, w: mx1 - mx0, h: my1 - my0 };
    }

    // 3. CAMERA FRAME per plate: bbox padded ×PLATE_PAD, min-framed, centred, k clamped.
    var VB = { w: 1440, h: 900 };
    var frame = {};
    for (var fi = 0; fi < pids.length; fi++) {
      var pp = pids[fi], box = bbox[pp];
      var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      var fw = Math.max(box.w * PLATE_PAD, PLATE_MIN_W);
      var fh = Math.max(box.h * PLATE_PAD, PLATE_MIN_H);
      var k = Math.min(VB.w / fw, VB.h / fh, PLATE_K_MAX);
      frame[pp] = {
        k: k,
        tx: VB.w / 2 - cx * k,
        ty: VB.h / 2 - cy * k,
        cx: cx, cy: cy, fw: fw, fh: fh
      };
    }

    // 4. the RECIPROCAL inter-plate ROAD GRAPH (manor is the hub; W/E share the mid
    //    wall; observatory shares the NW corner with grounds-west)
    var adj = {};
    function link(a, b) {
      if (!members[a] || !members[b] || a === b) return;
      (adj[a] = adj[a] || {})[b] = true;
      (adj[b] = adj[b] || {})[a] = true;
    }
    for (var li = 0; li < pids.length; li++) if (pids[li] !== 'manor') link('manor', pids[li]);
    link('grounds-west', 'grounds-east');
    link('observatory', 'grounds-west');
    // emit a stable edge list (each undirected pair once, a<b)
    var edges = [];
    for (var a in adj) for (var b in adj[a]) if (a < b) edges.push([a, b]);
    edges.sort(function (e, f) { return e[0] < f[0] ? -1 : e[0] > f[0] ? 1 : (e[1] < f[1] ? -1 : 1); });

    return {
      ids: pids,
      members: members,    // plateId → [room,...]  (total + disjoint over live rooms)
      roomPlate: roomPlate,// roomId → plateId
      bbox: bbox,          // plateId → {x,y,w,h} (manor extended to enclose beneath)
      frame: frame,        // plateId → {k,tx,ty,cx,cy,fw,fh}  the camera target
      adj: adj,            // plateId → {neighbourId:true}
      edges: edges,        // [[a,b],...] each undirected pair once (a<b), sorted
      meta: PLATE_META,
      beneath: beneathSlot(),
      solution: solution
    };
  }

  /* Layout.relayPlate(rooms) → a plate-LOCAL re-lay: spread JUST this plate's rooms
     into a generous open frame (a two-column outward fan over ~85% of FIELD height,
     footprints in the centre band, labels fanning to the margins) so that NAME-ONLY
     labels never collide. This is the construction the legibility twin scores with
     {nameOnly:true} to prove each plate clears the floor ALONE. It returns a sol-like
     {foot, footMeta} for ONLY these rooms PLUS a `relaySide` per room (the L/R fan).
     It is a RingView/plate-LOCAL transform ONLY — NEVER written back onto the
     canonical Layout.foot (else emit-mirror.cjs / sky.test.cjs would false-fail). */
  var RELAY_VSPREAD = 0.85;  // fraction of FIELD height the column stack uses
  function relayPlate(rooms) {
    var n = rooms.length;
    var band = SIZE_BAND[3];  // folly size — small footprints so the label leads
    var half = Math.ceil(n / 2);
    var fh = FIELD.h * RELAY_VSPREAD, fy = FIELD.y + (FIELD.h - fh) / 2;
    var rowH = half > 0 ? fh / half : fh;
    var cxL = FIELD.x + FIELD.w * 0.40, cxR = FIELD.x + FIELD.w * 0.60;
    var foot = {}, footMeta = {}, sideById = {}, places = [];
    for (var i = 0; i < n; i++) {
      var r = rooms[i];
      var col = i % 2, rr = Math.floor(i / 2);
      var cy = fy + (rr + 0.5) * rowH;
      var cx = col === 0 ? cxL : cxR;
      foot[r.id] = { x: cx - band.w / 2, y: cy - band.h / 2, w: band.w, h: band.h };
      footMeta[r.id] = { tier: r.tier, district: r.district, wing: r.wing || null };
      var side = col === 0 ? 'left' : 'right';
      sideById[r.id] = side;
      // a places copy carrying relaySide (Legibility reads r.relaySide for the seat side)
      var copy = {}; for (var k in r) copy[k] = r[k]; copy.relaySide = side;
      places.push(copy);
    }
    return { foot: foot, footMeta: footMeta, graph: null, sideById: sideById, places: places };
  }

  /* the gated BENEATH slot (a reserved cellar slot at the manor south foundation) —
     revealUndercroft asks for it by id. Returns {x,y,w,h} for the stair footprint. */
  function beneathSlot() {
    var reg = DISTRICTS.beneath.region;
    var band = bandFor(3);
    var w = Math.min(band.w * 0.5, reg.w), h = Math.min(band.h, reg.h);
    return { x: reg.x + (reg.w - w) / 2, y: reg.y + (reg.h - h) / 2, w: w, h: h };
  }

  return {
    solve: solve,
    DISTRICTS: DISTRICTS,
    WING_META: WING_META,
    GROUNDS_WINGS: GROUNDS_WINGS,
    SIZE_BAND: SIZE_BAND,
    FIELD: FIELD,
    beneathSlot: beneathSlot,
    bandFor: bandFor,
    wingLabel: wingLabel,
    wingAccent: wingAccent,
    plates: plates,
    relayPlate: relayPlate,
    PLATE_META: PLATE_META
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Layout; }
