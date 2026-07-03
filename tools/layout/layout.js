/* ════════════════════════════════════════════════════════════════════════════
   layout.js — THE FACADE (layout engine v2, WS1 §1.9)

   The single global `Layout` the page and the tests call. It WIRES the three pure
   libraries built in W0.1/W0.2 —
     · contract.js   → the polar DEEDS (CONTRACTS + CLUSTER_META + ROAD/LANES + schema)
     · polar.js      → the SOLVER (tier radii, angular law, derived viewBox, freeSlots)
     · formations.js → the PACKERS (one per layoutFn; the generic grid is retired)
   — and translates each district's locally-packed slots to WORLD coordinates about the
   manor pole. It keeps v1's public surface as a STRICT SUPERSET (§1.9):
     Layout.solve(places[,opts])   → { foot, footMeta, wingRects, districtRects,
                                        structures, graph{door,spine,avenues,aisles,stubs},
                                        door, road, world }
     Layout.plates(places[,opts])  → the total/disjoint plate partition (parent ∪ child),
                                        per-plate camera frames, the reciprocal road graph,
                                        the fold (contract-level detach), + world + structures.
     Layout.basementSlot(0|1)      → the two gated ways down (Undercroft/Reliquary), world
                                        coords; beneathSlot/sealedStudySlot alias them (§1.9).
     Layout.freeSlots(tier[,ρ])    → the live petition menu (§1.5), interpolated by the relief.

   THE FOLD (§1.9): `detach` now lives on the district CONTRACT (fairground). A detached
   district's parent plate is JUST its gate face (GATE_W 96 × GATE_H 120, ρ≈77) — its
   layoutFn is DORMANT; the rooms lay out in a `child:<districtId>` plate via relayPlate on
   RELAY_FIELD (1116×668, centred in the derived world). `opts.detachOff` suppresses the fold
   as a NEG-CONTROL — with it, the fairground's 16 tiles are asked to fit its dormant knot and
   the build THROWS loud (the fold is proven load-bearing).

   DETERMINISM (§1.6): the world derives from CONTRACTS alone (never from n×band), so it is
   cached; every iteration is `Object.keys(...).sort()`; all emitted coords round to 0.1;
   solve()+plates() double-run byte-identical (estate.test.cjs). Pure + Node-testable; the
   forge inlines it (the require guard below is stripped, the globals come from the sibling
   includes). Where a room and the spec disagree, the ROOM/REPO wins — flagged, not guessed.
   ════════════════════════════════════════════════════════════════════════════ */

var Layout = (function () {
  'use strict';

  /* ── the three sibling libraries: forge-inlined globals in the browser; require()d in
       Node (the guard block is stripped at forge, leaving the globalThis reads). ── */
  var Contract    = (typeof globalThis !== 'undefined') ? globalThis.Contract : null;
  var Polar       = (typeof globalThis !== 'undefined') ? globalThis.Polar : null;
  var Formations  = (typeof globalThis !== 'undefined') ? globalThis.Formations : null;
  if (typeof module !== 'undefined' && module.exports) {
    Contract   = require('./contract.js');
    Polar      = require('./polar.js');
    Formations = require('./formations.js');
  }

  var r01 = function (v) { return Math.round(v * 10) / 10; };

  /* ── §1.9 constants (lifted; the RELAY/PLATE/GATE families kept). ── */
  var RELAY_FIELD_DIM = { w: 1116, h: 668 };   // the child plate's fan envelope (centred in world)
  var RELAY_VSPREAD   = 0.85;                   // fraction of RELAY_FIELD height the stack uses
  var RELAY_GUTTER    = 6;                       // house slot gutter (the detached-budget denominator)
  var PLATE_PAD       = 1.45;                    // camera bbox padding factor
  var PLATE_MIN_W     = 360, PLATE_MIN_H = 240;  // minimum frame so a narrow plate breathes
  var DISTRICT_PAD    = 8;                        // roadside precinct pad (framed precincts = the frame box)
  var GATE_W = 96, GATE_H = 120;                 // the detached parent gate face

  /* ── tiny geometry helpers (byOrderId + rectUnion lifted from formations, §1.9). ── */
  var byOrderId = Formations.byOrderId;
  function footCentreOf(f) { return f.r != null ? { x: f.x, y: f.y } : { x: f.x + f.w / 2, y: f.y + f.h / 2 }; }
  function footBBoxOf(f)  { return f.r != null ? { x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 } : { x: f.x, y: f.y, w: f.w, h: f.h }; }
  function rectsOverlap(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
  function unionRect(a, b) {
    var x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
    var x1 = Math.max(a.x + a.w, b.x + b.w), y1 = Math.max(a.y + a.h, b.y + b.h);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function titleCase(s) { return String(s).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  /* ── the frame's bounding box + local centre. Box → {w,h}; disc {r} → 2r×2r. ── */
  function frameBox(frame) {
    if (frame.r != null) return { w: 2 * frame.r, h: 2 * frame.r, cx: frame.r, cy: frame.r };
    return { w: frame.w, h: frame.h, cx: frame.w / 2, cy: frame.h / 2 };
  }

  /* ── CLUSTER label/accent (cluster-keyed; §1.9 wingLabel/wingAccent kept). ── */
  function wingLabel(slug) { var m = Contract.CLUSTER_META[slug]; return m ? m.label : titleCase(String(slug).replace(/-/g, ' ')); }
  function wingAccent(slug, fallback) { var m = Contract.CLUSTER_META[slug]; return (m && m.accent) || fallback || '#c9a24a'; }

  /* ── FLATTEN the polar solve ({world, manor, districts}) into one world model the facade
       reads (centre/R/Rgate/… promoted; districts + manor kept). ── */
  function normalizeWorld(s) {
    var w = s.world;
    return {
      viewBox: w.viewBox, W: w.W, H: w.H, centre: w.centre, R: w.R, maxRho: w.maxRho, tiers: w.tiers,
      Rsky: w.Rsky, Rgate: w.Rgate, skyOuter: w.skyOuter, skyBand: w.skyBand, manorRho: w.manorRho,
      K_MIN: w.K_MIN, K_MAX: w.K_MAX, K_LOD: w.K_LOD, manor: s.manor, districts: s.districts
    };
  }

  /* ── the world derives from CONTRACTS alone → cache it (deterministic, never mutated).
       An injected table (opts.contracts, the neg-controls) is solved FRESH, uncached. ── */
  var _world = null;
  function estateWorld() {
    if (!_world) _world = normalizeWorld(Polar.solve(Contract.CONTRACTS, { road: Contract.ROAD, lanes: Contract.LANES }));
    return _world;
  }
  function worldFor(contracts) {
    return (contracts === Contract.CONTRACTS) ? estateWorld()
      : normalizeWorld(Polar.solve(contracts, { road: Contract.ROAD, lanes: Contract.LANES }));
  }

  /* ── the detached DISTRICT set: reads the CONTRACT `detach` flag (§1.9 — detachedWings
       reads contracts now), restricted to districts with ≥1 live room; suppressed entirely
       under the detachOff neg-control. ── */
  function detachedWings(places, opts, contracts) {
    opts = opts || {}; contracts = contracts || Contract.CONTRACTS;
    if (opts.detachOff) return {};
    var have = {};
    (places || []).forEach(function (r) { if (!r.locked) have[r.district] = true; });
    var det = {};
    Object.keys(contracts).sort().forEach(function (id) { if (contracts[id].detach && have[id]) det[id] = true; });
    return det;
  }

  /* ── §1.8 the detached child-tile budget (the relayPlate feasibility formula, pinned). ── */
  function maxCapacityDetached() {
    return 2 * Math.floor(RELAY_FIELD_DIM.h * RELAY_VSPREAD / (Formations.SIZE_BAND[3].h + RELAY_GUTTER));
  }

  /* ── §1.8 capacity FEASIBILITY per contract (detached → child budget, else the packer's
       honest ceiling). A config promising seats it cannot legibly deliver is a build error. ── */
  function assertFeasible(contracts, opts) {
    var FORMS = Formations.FORMATIONS;
    Object.keys(contracts).sort().forEach(function (id) {
      var c = contracts[id];
      var detached = !!c.detach && !(opts && opts.detachOff);
      var max = detached ? maxCapacityDetached() : FORMS[c.layoutFn].maxCapacity(c.frame);
      if (c.capacity > max) {
        throw new Error('Layout: district "' + id + '" declares capacity ' + c.capacity + ' but formation "' +
          c.layoutFn + '" seats at most ' + max + ' in frame ' +
          (c.frame.r != null ? 'r' + c.frame.r : c.frame.w + '×' + c.frame.h) +
          (detached ? ' (detached child budget)' : '') +
          '. A config that promises seats it cannot legibly deliver is a build error (§1.8) — ' +
          'shrink the capacity, GROW the frame, or FOLD.');
      }
    });
  }

  /* ── the §1.8 relief error (verbatim template); the PETITION menu interpolates freeSlots LIVE. ── */
  function fmtRange(r) { return '[' + r[0] + '°..' + (((r[1] % 360) + 360) % 360) + '°]'; }
  function reliefError(id, c, n, contracts) {
    var tier = (c.tier != null) ? c.tier : 2;
    var fs = freeSlotsFor(contracts, tier, 140);
    var menu = fs.ranges.length ? fs.ranges.map(fmtRange).join(' · ')
      : 'none at orbit ' + tier + ' — the menu is honestly empty; petition an outer orbit';
    return new Error('Layout: district "' + id + '" is AT CAPACITY (' + n + '/' + c.capacity + '). ' +
      'More breadth here would crush legibility —\nthe plate refuses. Four honest reliefs:\n' +
      '  GATHER — fold kin leaves into a themed room (the §2.6 pattern; the cheapest depth);\n' +
      '  GROW — petition a FRAME increase (re-runs every span assert; the wedge law may refuse —\n' +
      '         then the answer is depth, not width);\n' +
      '  FOLD — the district becomes a child world (contract detach:true; the fairground is the template);\n' +
      '  PETITION — split the family / found a district at a free slot: ' + menu + '\n' +
      'Never: nudging capacity upward without re-running the feasibility check.');
  }

  /* ════════════════════════════════ SOLVE ════════════════════════════════ */

  function setFoot(solution, r, slot) {
    solution.footMeta[r.id] = { tier: r.tier, district: r.district, wing: r.wing || null, footprint: r.footprint || null };
    // a DISC footprint carries the v1 tower convention: x,y ARE the centre + r (footCentreOf/
    // footBBoxOf read it that way). A RECT footprint is {x,y,w,h} top-left.
    if (slot.disc) solution.foot[r.id] = { x: slot.cx, y: slot.cy, r: slot.r };
    else solution.foot[r.id] = { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
  }

  function translateSlot(slot, ox, oy) {
    if (slot.disc) return { id: slot.id, x: r01(slot.x + ox), y: r01(slot.y + oy), w: slot.w, h: slot.h, cx: r01(slot.cx + ox), cy: r01(slot.cy + oy), r: slot.r, disc: true };
    return { id: slot.id, x: r01(slot.x + ox), y: r01(slot.y + oy), w: slot.w, h: slot.h };
  }

  /* where a district's frame centre lands in the world: the manor pole, the south gate
     (the road-special approach), or the district's solved polar centre. */
  function centreOf(id, contracts, world) {
    if (id === 'manor') return { x: world.centre.x, y: world.centre.y };
    if (contracts[id].road) return { x: world.centre.x, y: r01(world.centre.y + world.Rgate) };  // the approach, south on the road
    var d = world.districts[id];
    return { x: d.x, y: d.y };
  }

  /* pack ONE non-detached district's live rooms + translate to the world; emit foot,
     wing (cluster) rects, and a district precinct hull. */
  function packDistrict(id, c, live, contracts, world, solution) {
    var centre = centreOf(id, contracts, world);
    var fn = Formations.FORMATIONS[c.layoutFn];
    var roadside = (c.layoutFn === 'roadside');
    if (!live.length) {                                  // an empty district still owns a precinct
      var fb0 = frameBox(c.frame);
      pushDistrictRect(solution, id, c, { x: r01(centre.x - fb0.w / 2), y: r01(centre.y - fb0.h / 2), w: fb0.w, h: fb0.h });
      return;
    }
    var packed = fn.pack(live, c.frame, undefined);      // slots at the local frame origin
    var ox, oy, hull;
    if (roadside) {
      // the roadside frame is nominal (the stops table is the budget); centre its HULL at the gate.
      hull = packed.hull;
      ox = r01(centre.x - hull.w / 2); oy = r01(centre.y - hull.h / 2);
    } else {
      var fb = frameBox(c.frame);
      ox = r01(centre.x - fb.cx); oy = r01(centre.y - fb.cy);
    }
    // footprints
    var roomOf = {}; live.forEach(function (r) { roomOf[r.id] = r; });
    packed.slots.forEach(function (s) { setFoot(solution, roomOf[s.id], translateSlot(s, ox, oy)); });
    // cluster (wing) tint rects → world
    packed.clusterRects.forEach(function (cr) {
      solution.wingRects.push({
        district: id, wing: cr.cluster, label: wingLabel(cr.cluster), accent: wingAccent(cr.cluster, c.theme.hue),
        x: r01(cr.x + ox), y: r01(cr.y + oy), w: cr.w, h: cr.h
      });
    });
    // the precinct hull: framed → the frame box (inscribed in the ρ-disc, disjoint by the
    // polar clearance law); roadside → the packed hull + a small pad (isolated at the gate).
    var rect;
    if (roadside) rect = { x: r01(centre.x - hull.w / 2 - DISTRICT_PAD), y: r01(centre.y - hull.h / 2 - DISTRICT_PAD), w: r01(hull.w + 2 * DISTRICT_PAD), h: r01(hull.h + 2 * DISTRICT_PAD) };
    else { var fb2 = frameBox(c.frame); rect = { x: r01(centre.x - fb2.w / 2), y: r01(centre.y - fb2.h / 2), w: fb2.w, h: fb2.h }; }
    pushDistrictRect(solution, id, c, rect);
  }

  /* the detached parent: just the gate face (its whole parent-plate extent), centred on the
     district's polar centre; its rooms lay out in the child (plates()). */
  function packDetached(id, c, world, solution) {
    var d = world.districts[id];
    pushDistrictRect(solution, id, c, { x: r01(d.x - GATE_W / 2), y: r01(d.y - GATE_H / 2), w: GATE_W, h: GATE_H });
  }

  function pushDistrictRect(solution, id, c, rect) {
    solution.districtRects.push({
      district: id, label: c.theme.label, hue: c.theme.hue, tint: c.theme.tint, style: c.theme.style,
      detached: !!c.detach, x: rect.x, y: rect.y, w: rect.w, h: rect.h
    });
  }

  /* §5.1 stub: one structure per precinct (the central "green" a §5 build later fills).
     tallies provisional (room count) until the manifest feeds them (W2.5). */
  function buildStructures(solution, memberCount) {
    solution.districtRects.forEach(function (dr) {
      var w = Math.max(24, Math.min(dr.w, dr.h) * 0.42), h = w * 0.62;
      solution.structures.push({
        district: dr.district, label: dr.label,
        box: { x: r01(dr.x + dr.w / 2 - w / 2), y: r01(dr.y + dr.h / 2 - h / 2), w: r01(w), h: r01(h) },
        tallies: { rooms: memberCount[dr.district] || 0, provisional: true }
      });
    });
  }

  /* the circulation graph (§4.1 re-derives geometry; the {door,spine,avenues,aisles,stubs}
     CONTRACT is kept). Plus a straight south ROAD polyline (θ=180, door → gate) for the
     in-wedge invariant. */
  function buildGraph(solution, world) {
    var centre = world.centre, manorRho = world.manorRho;
    var door = { x: r01(centre.x), y: r01(centre.y + manorRho) };
    solution.door = door; solution.graph.door = door;
    solution.graph.spine = { x0: door.x, y0: door.y, x1: door.x, y1: r01(centre.y + manorRho * 0.2) };
    solution.districtRects.forEach(function (dr) {
      if (dr.district === 'manor') return;
      var gx = dr.x + dr.w / 2, gy = dr.y + dr.h / 2;
      solution.graph.avenues.push({ district: dr.district, label: 'to ' + titleCase(dr.label), x0: door.x, y0: door.y, x1: r01(gx), y1: r01(gy) });
    });
    solution.wingRects.forEach(function (wr) {
      var wc = { x: wr.x + wr.w / 2, y: wr.y + wr.h / 2 };
      var gx = Math.max(wr.x, Math.min(door.x, wr.x + wr.w));
      var gy = Math.max(wr.y, Math.min(door.y, wr.y + wr.h));
      solution.graph.aisles.push({ district: wr.district, wing: wr.wing, x0: r01(gx), y0: r01(gy), x1: r01(wc.x), y1: r01(wc.y) });
    });
    Object.keys(solution.foot).sort().forEach(function (id) {
      var f = solution.foot[id], c = footCentreOf(f), meta = solution.footMeta[id], target = door;
      if (meta && meta.wing) {
        for (var i = 0; i < solution.wingRects.length; i++) {
          var w = solution.wingRects[i];
          if (w.district === meta.district && w.wing === meta.wing) { target = { x: w.x + w.w / 2, y: w.y + w.h / 2 }; break; }
        }
      }
      solution.graph.stubs.push({ id: id, x0: r01(c.x), y0: r01(c.y), x1: r01(target.x), y1: r01(target.y) });
    });
    solution.road = [door, { x: r01(centre.x), y: r01(centre.y + world.Rgate) }];
  }

  function worldModel(w, contracts) {
    var maxTier = w.tiers[w.tiers.length - 1];
    var Rarr = []; for (var t = 0; t <= maxTier; t++) Rarr[t] = (w.R[t] != null) ? w.R[t] : null;
    var fs = {}; for (var ti = 1; ti <= maxTier + 1; ti++) fs[ti] = freeSlotsFor(contracts, ti, 140).ranges;
    return {
      viewBox: w.viewBox, W: w.W, H: w.H, centre: { x: w.centre.x, y: w.centre.y },
      R: Rarr, tiers: w.tiers.slice(), maxRho: w.maxRho,
      Rsky: w.Rsky, Rgate: w.Rgate, skyOuter: w.skyOuter, skyBand: w.skyBand,
      manorRho: w.manorRho, K_MIN: w.K_MIN, K_MAX: w.K_MAX, K_LOD: w.K_LOD,
      freeSlots: fs, districts: w.districts
    };
  }

  function solve(places, opts) {
    opts = opts || {};
    var contracts = opts.contracts || Contract.CONTRACTS;
    var FORMS = Formations.FORMATIONS;

    // 1. schema + formation-membership validation (unknown district/cluster/formation → throw)
    Contract.validate(contracts, FORMS);
    // 2. §1.8 capacity feasibility per contract
    assertFeasible(contracts, opts);
    // 3. the polar world (throws on any §1.4/§1.5 angular/clearance violation)
    var world = worldFor(contracts);

    var solution = {
      foot: {}, footMeta: {}, wingRects: [], districtRects: [], structures: [],
      graph: { door: null, spine: null, avenues: [], aisles: [], stubs: [] },
      door: null, road: null, world: null
    };

    // 4. group + validate rooms (unknown district / cluster → throw)
    var byDistrict = {};
    (places || []).forEach(function (r) {
      var c = contracts[r.district];
      if (!c) throw new Error('Layout: room "' + r.id + '" declares unknown district "' + r.district +
        '". Add a CONTRACT for it (contract.js) or fix the declaration.');
      if (r.wing && (c.clusters || []).indexOf(r.wing) === -1)
        throw new Error('Layout: room "' + r.id + '" declares cluster "' + r.wing + '" not legal in district "' +
          r.district + '" (allowed: ' + ((c.clusters || []).join(', ') || 'none') + '). A wing slug is never silent (§1.2).');
      (byDistrict[r.district] = byDistrict[r.district] || []).push(r);
    });

    var detached = detachedWings(places, opts, contracts);
    var memberCount = {};

    // 5/6. per-district capacity + pack (sorted iteration, §1.6)
    Object.keys(contracts).sort().forEach(function (id) {
      var c = contracts[id];
      var all = byDistrict[id] || [];
      if (all.length > c.capacity) throw reliefError(id, c, all.length, contracts);
      if (detached[id]) {
        memberCount[id] = all.filter(function (r) { return !r.locked; }).length;   // child tiles
        packDetached(id, c, world, solution);
        return;
      }
      var live = all.filter(function (r) { return !r.locked; });
      memberCount[id] = live.length;
      packDistrict(id, c, live, contracts, world, solution);
    });

    // 7. graph + 8. structures + 9. world
    buildGraph(solution, world);
    buildStructures(solution, memberCount);
    solution.world = worldModel(world, contracts);
    return solution;
  }

  /* ════════════════════════════════ PLATES ════════════════════════════════ */

  function relayField(world) {
    return { x: r01(world.centre.x - RELAY_FIELD_DIM.w / 2), y: r01(world.centre.y - RELAY_FIELD_DIM.h / 2), w: RELAY_FIELD_DIM.w, h: RELAY_FIELD_DIM.h };
  }

  /* relayPlate(rooms, world) → a plate-LOCAL two-column outward fan in RELAY_FIELD (centred
     in the derived world); folly footprints so name-only labels never collide. Never written
     back onto solution.foot (§1.9). */
  function relayPlate(rooms, world) {
    world = world || estateWorld();
    var RF = relayField(world);
    var list = rooms.slice().sort(byOrderId), n = list.length;
    var band = Formations.SIZE_BAND[3];
    var half = Math.ceil(n / 2);
    var fh = RF.h * RELAY_VSPREAD, fy = RF.y + (RF.h - fh) / 2;
    var rowH = half > 0 ? fh / half : fh;
    var cxL = RF.x + RF.w * 0.40, cxR = RF.x + RF.w * 0.60;
    var foot = {}, footMeta = {}, sideById = {};
    for (var i = 0; i < n; i++) {
      var r = list[i], col = i % 2, rr = Math.floor(i / 2);
      var cy = fy + (rr + 0.5) * rowH, cx = (col === 0 ? cxL : cxR);
      foot[r.id] = { x: r01(cx - band.w / 2), y: r01(cy - band.h / 2), w: band.w, h: band.h };
      footMeta[r.id] = { tier: r.tier, district: r.district, wing: r.wing || null };
      sideById[r.id] = (col === 0 ? 'left' : 'right');
    }
    return { foot: foot, footMeta: footMeta, sideById: sideById };
  }

  function basementSlotLocal(half) { return Formations.FORMATIONS.greathouse.basementSlot(Contract.CONTRACTS.manor.frame, half); }
  function basementSlot(half) {
    var world = estateWorld(), frame = Contract.CONTRACTS.manor.frame, s = basementSlotLocal(half);
    var ox = world.centre.x - frame.w / 2, oy = world.centre.y - frame.h / 2;
    return { x: r01(s.x + ox), y: r01(s.y + oy), w: r01(s.w), h: r01(s.h) };
  }
  function beneathSlot() { return basementSlot(0); }        // the Undercroft (west) — alias (§1.9)
  function sealedStudySlot() { return basementSlot(1); }    // the Reliquary (east) — alias (§1.9)
  function basementUnion() { return unionRect(basementSlot(0), basementSlot(1)); }

  function plates(places, opts) {
    opts = opts || {};
    var contracts = opts.contracts || Contract.CONTRACTS;
    var live = (places || []).filter(function (p) { return !p.locked; });
    var solution = solve(live, opts);        // detachOff propagates → THROWS (the neg-control)
    var world = worldFor(contracts);

    var detached = detachedWings(live, opts, contracts);

    // 1. PARTITION (total + disjoint): a detached district's rooms → child:<districtId>
    var members = {}, roomPlate = {};
    live.forEach(function (r) {
      var pid = detached[r.district] ? 'child:' + r.district : r.district;
      (members[pid] = members[pid] || []).push(r); roomPlate[r.id] = pid;
    });

    // 2. CHILD LAYOUT via relayPlate (plate-local; never written to solution.foot)
    var childPlates = [], childLayout = {}, childDistrictOf = {};
    Object.keys(detached).sort().forEach(function (d) {
      var cpid = 'child:' + d; if (!members[cpid]) return;
      var relay = relayPlate(members[cpid], world);
      childLayout[cpid] = { foot: relay.foot, sideById: relay.sideById };
      childDistrictOf[cpid] = d; childPlates.push(cpid);
    });
    childPlates.sort();

    // 3. per-plate bbox (parent → solution.foot; child → its relay foot)
    var bbox = {}, pids = Object.keys(members).sort();
    pids.forEach(function (p) {
      var cl = childLayout[p], x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      members[p].forEach(function (r) {
        var b = cl ? cl.foot[r.id] : footBBoxOf(solution.foot[r.id]); if (!b) return;
        if (b.x < x0) x0 = b.x; if (b.y < y0) y0 = b.y; if (b.x + b.w > x1) x1 = b.x + b.w; if (b.y + b.h > y1) y1 = b.y + b.h;
      });
      bbox[p] = { x: r01(x0), y: r01(y0), w: r01(x1 - x0), h: r01(y1 - y0) };
    });
    if (bbox.manor) bbox.manor = rectR01(unionRect(bbox.manor, basementUnion()));   // enclose the basement band

    // 4. camera frame per plate (against the derived viewBox; K_MAX derived, §1.7)
    var VB = { w: world.W, h: world.H }, frame = {};
    pids.forEach(function (pp) {
      var box = bbox[pp], cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      var fw = Math.max(box.w * PLATE_PAD, PLATE_MIN_W), fh = Math.max(box.h * PLATE_PAD, PLATE_MIN_H);
      var k = Math.min(VB.w / fw, VB.h / fh, world.K_MAX);
      frame[pp] = { k: r01(k), tx: r01(VB.w / 2 - cx * k), ty: r01(VB.h / 2 - cy * k), cx: r01(cx), cy: r01(cy), fw: r01(fw), fh: r01(fh) };
    });

    // 5. the gate faces + descent edges (child ← the manor hub; the gate sits at the polar centre)
    var gates = [], parentOf = {};
    childPlates.forEach(function (cpid) {
      var d = childDistrictOf[cpid], dc = world.districts[d], c = contracts[d];
      gates.push({
        district: d, kind: 'gate', toPlate: cpid,
        box: { x: r01(dc.x - GATE_W / 2), y: r01(dc.y - GATE_H / 2), w: GATE_W, h: GATE_H },
        accent: c.theme.hue, label: c.theme.label
      });
      parentOf[cpid] = 'manor';
    });

    // 6. the reciprocal inter-plate road graph (manor is the hub; children join via the gate edge)
    var adj = {};
    function link(a, b) { if (!members[a] || !members[b] || a === b) return; (adj[a] = adj[a] || {})[b] = true; (adj[b] = adj[b] || {})[a] = true; }
    pids.forEach(function (p) { if (p === 'manor' || childDistrictOf[p]) return; link('manor', p); });
    childPlates.forEach(function (cpid) { link(cpid, parentOf[cpid]); });
    var edges = [];
    for (var a in adj) for (var b in adj[a]) if (a < b) edges.push([a, b]);
    edges.sort(function (e, f) { return e[0] < f[0] ? -1 : e[0] > f[0] ? 1 : (e[1] < f[1] ? -1 : 1); });

    return {
      ids: pids, members: members, roomPlate: roomPlate, bbox: bbox, frame: frame,
      adj: adj, edges: edges, world: solution.world, structures: solution.structures,
      beneath: basementSlot(0), sealedStudy: basementSlot(1), solution: solution,
      detached: detached, childPlates: childPlates, childLayout: childLayout, parentOf: parentOf, gates: gates
    };
  }
  function rectR01(r) { return { x: r01(r.x), y: r01(r.y), w: r01(r.w), h: r01(r.h) }; }

  /* ── §1.5 the live petition menu, interpolated by the relief error + the map process. ── */
  function freeSlotsFor(contracts, tier, rhoEstimate) {
    var world = worldFor(contracts);
    var districts = Polar.tieredDistricts(contracts);
    return Polar.freeSlots(districts, world.R, world.maxRho, tier, rhoEstimate != null ? rhoEstimate : 140, Contract.ROAD, Contract.LANES);
  }
  function freeSlots(tier, rhoEstimate) { return freeSlotsFor(Contract.CONTRACTS, tier, rhoEstimate); }

  return {
    solve: solve,
    plates: plates,
    freeSlots: freeSlots,
    relayPlate: relayPlate,
    detachedWings: detachedWings,
    basementSlot: basementSlot,
    beneathSlot: beneathSlot,
    sealedStudySlot: sealedStudySlot,
    basementUnion: basementUnion,
    wingLabel: wingLabel,
    wingAccent: wingAccent,
    maxCapacityDetached: maxCapacityDetached,
    rectsOverlap: rectsOverlap,
    footCentreOf: footCentreOf,
    footBBoxOf: footBBoxOf,
    // the wired libraries, re-exported for consumers/tests (single source of truth)
    CONTRACTS: Contract.CONTRACTS,
    CLUSTER_META: Contract.CLUSTER_META,
    ROAD: Contract.ROAD,
    LANES: Contract.LANES,
    FORMATIONS: Formations.FORMATIONS,
    SIZE_BAND: Formations.SIZE_BAND,
    RELAY_FIELD: RELAY_FIELD_DIM,
    world: null   // populated on first solve for page reads; see below
  };
})();

/* attach the derived world eagerly so a page read (viewBox at build) needs no solve call. */
if (typeof Layout !== 'undefined' && Layout && !Layout.world) {
  try { Layout.world = Layout.solve([]).world; } catch (e) { /* an empty estate is still a valid world */ }
}

if (typeof module !== 'undefined' && module.exports) { module.exports = Layout; }
