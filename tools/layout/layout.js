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
    horology:    { label: 'HOROLOGY',           accent: '#e6bd6f' }
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
    placeSimpleDistrict('observatory', byDistrict.observatory || [], solution);
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

  /* a SIMPLE district (observatory/outbuilding/cavern): pack into its own region.
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
    wingAccent: wingAccent
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Layout; }
