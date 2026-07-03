/* ════════════════════════════════════════════════════════════════════════════
   door-claims.cjs — the front door's LEGIBILITY + WELL-FORMEDNESS self-test,
   single-sourced (the #doortest pill + its Node twin door.test.cjs).

   WHAT IT IS: the ONE place the door pill's claims live. Both callers run the SAME
   code over the SAME live data:
     · the PAGE  (index.src.html) — the #doortest pill a visitor/maker sees.
     · the TWIN  (tools/layout/door.test.cjs) — the Node gate a builder runs; it
       reads PLACES straight out of index.src.html and asserts the pill is green.

   THE v2 REWRITE (§9.1/§9.2 — the Grand Reorganization). The v1 pill's 17 claims were
   the FULL-ESTATE LABEL DECLUTTER (a loupe knife-edge that needed a checked-in getBBox
   MIRROR + a CHAR_W calibration to reproduce the browser's font rasterization). Under the
   polar reorg the fit-view estate tier draws ONE engraved STRUCTURE per district — NO room
   labels at rest — and per-plate labels are solved by the same LabelPlacer the legibility
   conscience models. So the declutter knife-edge is GONE, and with it the getBBox mirror:
   EVERY v2 claim is a PURE function of the declarations (PLACES) + the polar solve, identical
   in Node and the browser by construction (no box-source injection, no mirror, no anneal
   noise). The rendered-truth check the mirror used to carry moves to gate-dom.test.mjs, which
   verifies the real DOM with REAL browser input (the house lesson — real input, not a
   synthetic snapshot). Claims LIGHT UP BY WAVE (§9.2): the tally-vs-register claim armed at W2.5
   (manifest-fed, CLAIM 11 — the pill takes the emitted MANIFEST_TALLIES via `args.tallies`); the
   two night-sky claims stay a self-skip (they read the sky slab, not PLACES — freshness is owned
   by `derive-sky --check` + sky.test, not the door pill). Before its wave a claim SELF-SKIPS
   (reported "awaiting …", not counted), so the pill is honest at every wave point. The gate is
   "door pill fully GREEN (N/N)"; N is the count of ARMED claims (not 17).

   The LOUPE (index.src.html) still delegates its declutter to revealedSet/declutterIds here —
   those helpers are unchanged; only runDoorClaims is rewritten.

   Node-pure, zero external deps. Dual-use: `require`d by the twin; forge-inlined into the page
   (the strippable guard at the bottom keeps Node's require working; the IIFE attaches the
   `DoorClaims` global the page reads).
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

var DoorClaims = (function () {
'use strict';

function r01(n) { return Math.round(n * 10) / 10; }

/* ── footprint geometry (mirror index.src.html footCentre) ─────────────────── */
function footCentre(r) {
  if (r.footprint === 'tower') return { cx: r.x, cy: r.y };
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}
/* footprint top-left (towers store centre+r; a box stores x,y). Used by the loupe's relay
   override for detached child tiles (#369) — kept for the loupe (index.src.html). */
function footTopLeft(r) {
  if (r.footprint === 'tower') return { x: r.x - r.r, y: r.y - r.r };
  return { x: r.x, y: r.y };
}
function overlapRect(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/* ── THE LOUPE DECLUTTER (single source — index.src.html's LOUPE delegates here) ──
   Two fixed SCREEN-space constants the loupe shares. UNCHANGED by the v2 rewrite. */
var LOUPE_SCREEN = 300;    // the loupe radius in CSS px (screen space)
var MIN_SCREEN_GAP = 18;   // breathing room demanded between two on-screen labels (CSS px)

/* greedy screen-space admit: tier-first then nearest-focus, admit a candidate only if its
   SOLVED box inflated by `pad` clears every already-admitted box. */
function greedyAdmit(cand, pad) {
  cand.sort(function (a, b) { return a.tier - b.tier || a.d2 - b.d2; });
  var admitted = [];
  for (var i = 0; i < cand.length; i++) {
    var cd = cand[i];
    var inf = { x: cd.box.x - pad, y: cd.box.y - pad, w: cd.box.w + 2 * pad, h: cd.box.h + 2 * pad };
    var ok = true;
    for (var j = 0; j < admitted.length; j++) { if (overlapRect(inf, admitted[j].box)) { ok = false; break; } }
    if (ok) admitted.push(cd);
  }
  return admitted.map(function (a) { return a.id; });
}

/* revealedSet(places, boxOf, focus, k) → [ids] — the loupe's fixed-SCREEN-radius reveal
   + greedy declutter. Identical to index.src.html's loupe revealedSet. UNCHANGED. */
function revealedSet(places, boxOf, focus, k) {
  if (!focus) return [];
  var loupeVB = LOUPE_SCREEN / k, loupeVB2 = loupeVB * loupeVB;
  var padVB = MIN_SCREEN_GAP / k;
  var cand = [];
  for (var i = 0; i < places.length; i++) {
    var p = places[i];
    var box = boxOf(p.id); if (!box) continue;     // only placed labels can light
    var c = footCentre(p);
    var d2 = (c.cx - focus.x) * (c.cx - focus.x) + (c.cy - focus.y) * (c.cy - focus.y);
    if (d2 > loupeVB2) continue;                    // outside the loupe
    cand.push({ id: p.id, box: box, d2: d2, tier: (p.tier || 9) });
  }
  return greedyAdmit(cand, padVB);
}

/* declutterIds(ids, places, boxOf, focus, k) → a non-overlapping subset of an EXPLICIT id
   list, the SAME greedy pass as revealedSet seeded over the given ids. UNCHANGED. */
function declutterIds(ids, places, boxOf, focus, k) {
  var pad = MIN_SCREEN_GAP / Math.max(k, 0.0001);
  var byId = {};
  for (var i = 0; i < places.length; i++) byId[places[i].id] = places[i];
  var cand = [];
  for (var j = 0; j < ids.length; j++) {
    var box = boxOf(ids[j]); if (!box) continue;
    var p = byId[ids[j]];
    var c = p ? footCentre(p) : { cx: box.x, cy: box.y };
    var d2 = focus ? (c.cx - focus.x) * (c.cx - focus.x) + (c.cy - focus.y) * (c.cy - focus.y) : 0;
    cand.push({ id: ids[j], box: box, d2: d2, tier: (p && p.tier) || 9 });
  }
  return greedyAdmit(cand, pad);
}

/* childFootOf(part) → { id: {x,y,w,h} } — the relay foot of every detached child room. Kept
   for the loupe (the descended midway lights child tiles at their relay geometry). */
function childFootOf(part) {
  var out = {};
  if (!part || !part.childPlates) return out;
  for (var i = 0; i < part.childPlates.length; i++) {
    var cpid = part.childPlates[i], cl = part.childLayout && part.childLayout[cpid];
    if (!cl || !cl.foot) continue;
    for (var id in cl.foot) out[id] = cl.foot[id];
  }
  return out;
}

/* ════════════════════════════════ §5.1 THE ESTATE-TIER DRAWN BOXES ═══════════
   The fit-view estate tier draws ONE hit target per district. For the 10 nav districts
   the DRAWN box is the district hull DISPLAY-CLAMPED to [110,260]px centred on the hull
   (structDisplayBox — the page's drawStructures delegates here, single source). The
   FAIRGROUND draws its native gate face (the plates() gate box, un-clamped 96×120). The
   §9.2 collision claim runs against these DRAWN boxes, NOT the solved hulls — a clamped-up
   small hull can exceed its solved envelope, which the "hulls disjoint" polar invariant
   does not cover (§5.1 round 7). ════════════════════════════════════════════════════ */
var STRUCT_CLAMP_MIN = 110, STRUCT_CLAMP_MAX = 260;
// the §2.5 walk order for keyboard/tab (single source — the page reads DoorClaims.STRUCT_WALK):
// up the drive, the great house, then clockwise from the north.
var STRUCT_WALK = ['approach', 'manor', 'promenades', 'fairground', 'works', 'cavern',
                   'number', 'gardens', 'opticks', 'observatory', 'outbuilding'];

function structDisplayBox(box) {
  var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  var dw = Math.max(STRUCT_CLAMP_MIN, Math.min(STRUCT_CLAMP_MAX, box.w));
  var dh = Math.max(STRUCT_CLAMP_MIN, Math.min(STRUCT_CLAMP_MAX, box.h));
  return { x: r01(cx - dw / 2), y: r01(cy - dh / 2), w: r01(dw), h: r01(dh), cx: r01(cx), cy: r01(cy) };
}

/* estateDrawnBoxes(structures, gates) → [{id, district, box}] — the ACTUAL fit-view hit
   targets: every non-fairground district → structDisplayBox(hull); fairground → its native
   gate box. This IS the set drawStructures + the gate-face render draw, so the collision
   check measures exactly what a visitor clicks. */
function estateDrawnBoxes(structures, gates) {
  var byD = {}; (structures || []).forEach(function (s) { byD[s.district] = s; });
  var out = [];
  for (var i = 0; i < STRUCT_WALK.length; i++) {
    var dist = STRUCT_WALK[i];
    if (dist === 'fairground') continue;   // the gate face stands for the fairground
    var s = byD[dist]; if (!s) continue;
    out.push({ id: 'struct:' + dist, district: dist, box: structDisplayBox(s.box) });
  }
  (gates || []).forEach(function (g) { out.push({ id: 'gate:' + g.district, district: g.district, box: g.box }); });
  return out;
}

/* countBoxCollisions(items) → {count, hits[]} — pairwise overlap over [{id, box}]. */
function countBoxCollisions(items) {
  var n = 0, hits = [];
  for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
    if (overlapRect(items[i].box, items[j].box)) { n++; hits.push(items[i].id + '×' + items[j].id); }
  }
  return { count: n, hits: hits };
}

/* footprintsOverlap(a, b) — disc-aware pairwise overlap over RAW solve feet (a foot may be a
   disc {x,y,r} or a box {x,y,w,h}). Disc-vs-disc by CENTRE DISTANCE, otherwise by bbox —
   byte-identical to estate.test.cjs's footOverlaps, so the door pill and the estate gate read
   footprint clearance the SAME way (two adjacent discs whose bboxes kiss at the corner are NOT
   a collision). */
function footBBox(f) { return f.r != null ? { x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 } : { x: f.x, y: f.y, w: f.w, h: f.h }; }
function footprintsOverlap(a, b) {
  if (a.r != null && b.r != null) return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 0.15;
  return overlapRect(footBBox(a), footBBox(b));
}
/* countFootOverlaps(items) → {count, hits[]} over [{id, foot}] with disc-aware semantics. */
function countFootOverlaps(items) {
  var n = 0, hits = [];
  for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
    if (footprintsOverlap(items[i].foot, items[j].foot)) { n++; hits.push(items[i].id + '×' + items[j].id); }
  }
  return { count: n, hits: hits };
}

/* ── THE LEGIBILITY-CONSCIENCE CONTROLS (byte-identical to legibility.test.cjs's, so the
   pill + the conscience's own regression test prove the SAME threshold derivation). ── */
var CLEAN = [
  { id: 'a', room: 'Alpha',   piece: 'Alpha',   tag: 'one',   district: 'manor',       tier: 2, footprint: 'house-wing' },
  { id: 'b', room: 'Beta',    piece: 'Beta',    tag: 'two',   district: 'observatory', tier: 1, footprint: 'tower' },
  { id: 'c', room: 'Gamma',   piece: 'Gamma',   tag: 'three', district: 'gardens',     tier: 2, footprint: 'hall' },
  { id: 'd', room: 'Delta',   piece: 'Delta',   tag: 'four',  district: 'cavern',      tier: 1, footprint: 'cave' },
  { id: 'e', room: 'Epsilon', piece: 'Epsilon', tag: 'five',  district: 'outbuilding', tier: 3, footprint: 'shed' },
  { id: 'f', room: 'Zeta',    piece: 'Zeta',    tag: 'six',   district: 'works',       tier: 2, footprint: 'engine' }
];
// crowded-negative: n footprints HAND-PLACED on a tight grid (never Layout.solve'd — a
// synthetic cluster, not a live §2.1 row, §9.3). Proves the conscience reads density.
function crowdedSolution(n) {
  var foot = {}, footMeta = {}, places = [];
  var cx = 1400, cy = 1400, COLW = 70, ROWH = 52;
  for (var i = 0; i < n; i++) {
    var c = i % 3, r = Math.floor(i / 3);
    foot['x' + i] = { x: cx + c * COLW, y: cy + r * ROWH, w: 44, h: 32 };
    footMeta['x' + i] = { district: 'number', tier: 2 };
    places.push({ id: 'x' + i, room: 'Crowded Room ' + i, piece: 'Crowded Piece ' + i, tag: 'jammed', district: 'number', tier: 2, order: i });
  }
  return { solution: { foot: foot, footMeta: footMeta, graph: null }, places: places };
}

/* ════════════════════════════════════════════════════════════════════════════
   runDoorClaims({ Legibility, Layout, places, [layout], [plates], [tallies] }) → the pill report.

   places  — the live PLACES (declarations, INCLUDING locked rooms). Geometry is read from
             the solve below, never from any x/y baked onto a place, so page + twin agree.
   layout  — Layout.solve(livePlaces) (optional; computed if absent).
   plates  — Layout.plates(livePlaces) (optional; computed if absent).
   tallies — the MANIFEST_TALLIES const (§6.1 shape; the page bakes it, the twin reads
             estate-tallies.json). Present ⇒ CLAIM 11 (tally-vs-register) ARMS; absent ⇒ it
             self-skips (arm-by-wave, §9.2). The page + twin pass the SAME projection.

   Returns { pass, total, passed, armed, skipped, lines:[{name,ok,detail,skip}],
             + summary fields the pill's sub-line reads (structureCount, estateCollisions,
             worstPlate, worstPlateComposite, estateComposite) }.
   total/passed count ARMED claims only; a skipped claim is honest (ok:true, skip:true,
   "awaiting <wave>") and never blocks green. The gate is passed === armed.
   ════════════════════════════════════════════════════════════════════════════ */
function runDoorClaims(args) {
  var Legibility = args.Legibility, Layout = args.Layout;
  var allPlaces = args.places || [];
  var live = allPlaces.filter(function (p) { return !p.locked; });
  var layout = args.layout || Layout.solve(live);
  var part = args.plates || Layout.plates(live);
  var detached = Layout.detachedWings(live);
  var TH = Legibility.THRESHOLD;

  var lines = [];
  function arm(name, cond, detail) { lines.push({ name: name, ok: !!cond, detail: detail || '', skip: false }); }
  function skip(name, wave) { lines.push({ name: name, ok: true, detail: 'awaiting ' + wave, skip: true }); }

  var parentRooms = live.filter(function (r) { return !detached[r.district]; });
  var childRooms = live.filter(function (r) { return detached[r.district]; });
  var parentIdSet = {}; parentRooms.forEach(function (r) { parentIdSet[r.id] = 1; });

  // ── CLAIM 1 — POI bijection. Every non-locked non-detached room seats exactly once
  //    (a solve foot), every foot maps back to such a room, and every detached room relays
  //    into its child plate. No room mapless, no ghost foot. (§9.2 POI count & bijection)
  var footIds = Object.keys(layout.foot);
  var everyParentSeated = parentRooms.every(function (r) { return !!layout.foot[r.id]; });
  var noGhostFoot = footIds.every(function (id) { return parentIdSet[id] === 1; });
  var everyChildRelayed = childRooms.every(function (r) {
    var cl = part.childLayout && part.childLayout['child:' + r.district];
    return cl && cl.foot && cl.foot[r.id];
  });
  var bijection = everyParentSeated && noGhostFoot && footIds.length === parentRooms.length && everyChildRelayed;
  arm('every room seats exactly once — feet ↔ rooms is a bijection, detached rooms relay in their child plate',
    bijection, '[' + parentRooms.length + ' seated + ' + childRooms.length + ' relayed = ' + live.length + ' rooms · ' + footIds.length + ' feet]');

  // ── CLAIM 2 — the estate-tier structures never collide. The DRAWN clamped hit boxes
  //    (10 clamped hulls + the native fairground gate face) are pairwise clear. This is
  //    the §5.1/§9.2 hitbox check AT THE ESTATE LOD — against the drawn box, not the hull.
  var drawn = estateDrawnBoxes(layout.structures, part.gates);
  var estCol = countBoxCollisions(drawn);
  arm('the fit-view structures never collide — the DRAWN clamped hit boxes are pairwise clear (§5.1)',
    estCol.count === 0, '[' + drawn.length + ' structures · ' + estCol.count + ' collisions' + (estCol.hits.length ? ': ' + estCol.hits.join(', ') : '') + ']');

  // ── CLAIM 3 — inside every plate the room footprints are clear (hitbox non-collision at
  //    the DISTRICT LOD): parent plates over the solved feet, child plates over the relay feet.
  var distCol = 0, distWorst = null;
  part.ids.forEach(function (pid) {
    var isChild = pid.indexOf('child:') === 0;
    var feet = part.members[pid].map(function (r) {
      var f = isChild ? (part.childLayout[pid] && part.childLayout[pid].foot[r.id]) : layout.foot[r.id];
      return f ? { id: r.id, foot: f } : null;
    }).filter(Boolean);
    var c = countFootOverlaps(feet);
    if (c.count > 0) { distCol += c.count; distWorst = pid + ' (' + c.hits[0] + ')'; }
  });
  arm('inside every plate the room footprints are clear — no overlap at the district tier',
    distCol === 0, '[' + part.ids.length + ' plates · ' + distCol + ' overlaps' + (distWorst ? ' · worst ' + distWorst : '') + ']');

  // ── CLAIM 4 — every district plate reads clean on its own. Re-lay each plate into the
  //    airy RELAY_FIELD, name-only, and score it against the legibility conscience: the §9.1
  //    HARD per-district-plate gate, re-derived live (labels legible per plate).
  var worst = { id: null, c: -1 };
  part.ids.forEach(function (pid) {
    var relay = Layout.relayPlate(part.members[pid]);
    var placed = part.members[pid].map(function (r) { var o = {}; for (var k in r) o[k] = r[k]; o.relaySide = relay.sideById[r.id]; return o; });
    var rep = Legibility.score({ foot: relay.foot, footMeta: relay.footMeta, graph: null }, placed, { nameOnly: true });
    if (rep.overall.composite > worst.c) { worst.c = rep.overall.composite; worst.id = pid; }
  });
  arm('every district plate reads clean on its own (re-laid, name-only, composite < threshold)',
    worst.c >= 0 && worst.c < TH, '[worst ' + worst.id + ' = ' + worst.c.toFixed(3) + ' < ' + TH + ']');

  // ── CLAIM 5 — the ESTATE plate reads clean. The district-STRUCTURE labels, seated at their
  //    hull centres, score legible as one plate (the fit-view read a visitor lands on).
  var estFoot = {}, estMeta = {}, estPlaced = [];
  (layout.structures || []).forEach(function (s) {
    var id = 'struct:' + s.district;
    estFoot[id] = { x: s.box.x, y: s.box.y, w: s.box.w, h: s.box.h };
    estMeta[id] = { district: s.district };
    estPlaced.push({ id: id, room: s.label, piece: s.label, tag: '', district: s.district });
  });
  var estRep = Legibility.score({ foot: estFoot, footMeta: estMeta, graph: null }, estPlaced, { nameOnly: true });
  arm('the fit-view estate plate reads clean — its ' + estPlaced.length + ' structure labels are legible (composite < threshold)',
    estRep.overall.composite < TH, '[' + estRep.overall.composite.toFixed(3) + ' < ' + TH + ']');

  // ── CLAIM 6 — the sealed rooms stay hidden until found. Every locked room has NO resting
  //    foot (placed only when revealed), and the two reveal slots sit inside the manor plate.
  var locked = allPlaces.filter(function (p) { return p.locked; });
  var noRestFoot = locked.every(function (p) { return !layout.foot[p.id]; });
  var mb = part.bbox.manor, beneath = part.beneath, sealed = part.sealedStudy;
  function enclosed(s) { return mb && s && s.x >= mb.x && s.y >= mb.y && s.x + s.w <= mb.x + mb.w && s.y + s.h <= mb.y + mb.h; }
  arm('the sealed rooms stay hidden until found — no resting foot, revealed into the manor',
    noRestFoot && enclosed(beneath) && enclosed(sealed), '[' + locked.length + ' sealed · slots enclosed]');

  // ── CLAIM 7 — descend & ascend round-trips. The fairground folds to a child layer whose
  //    tiles are exactly its detached rooms, joined reciprocally to the manor hub, reachable
  //    through a gate. (§9.2 descend/ascend round-trip)
  var fairChild = 'child:fairground';
  var childPids = part.childPlates || [];
  var childOfFair = childRooms.filter(function (r) { return r.district === 'fairground'; }).length;
  var hasChild = childPids.indexOf(fairChild) >= 0;
  var membersMatch = hasChild && part.members[fairChild] && part.members[fairChild].length === childOfFair;
  var parentIsManor = part.parentOf && part.parentOf[fairChild] === 'manor';
  var reciprocal = part.adj && part.adj[fairChild] && part.adj[fairChild].manor && part.adj.manor && part.adj.manor[fairChild];
  var gateExists = (part.gates || []).some(function (g) { return g.toPlate === fairChild; });
  arm('descend & ascend round-trip — the fairground folds to a child layer joined to the manor',
    hasChild && membersMatch && parentIsManor && reciprocal && gateExists, '[' + (part.members[fairChild] || []).length + ' tiles · gate ↔ manor]');

  // ── CLAIM 8 — the descent gate stands in clear ground, centred on its district (its whole
  //    face — arch included — is a live target). The negative-space real-click is proven in
  //    gate-dom (real input); here we hold the geometry the render draws it into.
  var fg = (part.gates || []).find(function (g) { return g.district === 'fairground'; });
  var fd = part.world.districts && part.world.districts.fairground;
  var gCentred = fg && fd && Math.abs((fg.box.x + fg.box.w / 2) - fd.x) < 1 && Math.abs((fg.box.y + fg.box.h / 2) - fd.y) < 1;
  var gateItem = drawn.find(function (i) { return i.id === 'gate:fairground'; });
  var gateClear = gateItem && drawn.every(function (i) { return i === gateItem || !overlapRect(i.box, gateItem.box); });
  arm('the descent gate stands in clear ground, centred on its district (its arch is a live target)',
    !!(fg && gCentred && gateClear), fg ? '[gate ' + fg.box.w + '×' + fg.box.h + ' centred, clear]' : '[no gate]');

  // ── CLAIM 9 — the way in reads: the road, the gate lodge, and the gatehouse are all drawn.
  var g = layout.graph;
  var roadOk = !!(g && g.door && g.spine && g.avenues && g.avenues.length > 0);
  var lodge = live.find(function (r) { return r.footprint === 'gate-lodge'; });
  var gatehouse = live.find(function (r) { return r.footprint === 'gatehouse'; });
  var lodgeOk = lodge && layout.foot[lodge.id], ghOk = gatehouse && layout.foot[gatehouse.id];
  arm('the way in reads — the road, the gate lodge, and the gatehouse are all drawn',
    roadOk && lodgeOk && ghOk, '[' + (g && g.avenues ? g.avenues.length : 0) + ' avenues · lodge ' + (lodgeOk ? '✓' : '✗') + ' · gatehouse ' + (ghOk ? '✓' : '✗') + ']');

  // ── CLAIM 10 — every plate is reachable by keyboard: a structure or a gate stands for it in
  //    the estate walk (§4.6 duty 1). Every parent plate is in the walk order + has a structure;
  //    every child plate has a gate.
  var parentPlates = part.ids.filter(function (pid) { return pid.indexOf('child:') !== 0; });
  var walkSet = {}; STRUCT_WALK.forEach(function (d) { walkSet[d] = 1; });
  var structDistricts = {}; (layout.structures || []).forEach(function (s) { structDistricts[s.district] = 1; });
  var everyParentReachable = parentPlates.every(function (pid) { return walkSet[pid] && structDistricts[pid]; });
  var everyChildHasGate = childPids.every(function (cpid) { return (part.gates || []).some(function (gg) { return gg.toPlate === cpid; }); });
  arm('every plate is reachable by keyboard — a structure or gate stands for it in the estate walk (§4.6)',
    everyParentReachable && everyChildHasGate, '[' + parentPlates.length + ' plates + ' + childPids.length + ' gate]');

  // ── CLAIM 11 — the depth tallies are MANIFEST-FED and TRUE (§5.5, arms at W2.5). The drawn
  //    map tally reads MANIFEST_TALLIES (the §6.3 consumer-2 forge-emitted const the page bakes
  //    from tools/manifest/estate-tallies.json); this claim proves that register AGREES with the
  //    live estate: every district's manifest room count equals its declared PLACES rooms —
  //    counted over ALL rows of the district INCLUDING locked basement rooms + detached child
  //    tiles (the manifest's denomination, §6.1), NOT the non-locked plate seat count — and its
  //    WITHIN is internally consistent (within = pieces − rooms). A stale register (PLACES edited
  //    without re-deriving the manifest) turns this red on the visitor-facing pill. SELF-SKIPS
  //    when no tallies are injected (arm-by-wave, §9.2 — a pre-W2.5 caller stays honest).
  var tallies = args.tallies;
  if (tallies && tallies.districts) {
    var roomsByDistrict = {};
    allPlaces.forEach(function (p) { roomsByDistrict[p.district] = (roomsByDistrict[p.district] || 0) + 1; });
    var regOk = true, rBad = null;
    (layout.structures || []).forEach(function (s) {
      var mt = tallies.districts[s.district];
      var declared = roomsByDistrict[s.district] || 0;
      if (!mt) { regOk = false; rBad = s.district + ' has no register tally'; return; }
      if (mt.rooms !== declared) { regOk = false; rBad = s.district + ' register ' + mt.rooms + ' ≠ ' + declared + ' declared'; return; }
      if (mt.within !== mt.pieces - mt.rooms) { regOk = false; rBad = s.district + ' within ' + mt.within + ' ≠ pieces−rooms ' + (mt.pieces - mt.rooms); return; }
    });
    arm('the depth tallies match the estate register — every district reads its manifest room count (within = pieces − rooms)',
      regOk, rBad ? '[' + rBad + ']' : '[all districts agree]');
  } else {
    skip('the depth tallies match the estate register', 'the register wave');
  }

  // ── CLAIM 12 — the conscience that judges legibility is itself sound: the clean/crowded
  //    controls straddle the derived threshold and the weights are the gap-dominant blend.
  var cleanRep = Legibility.score(Layout.solve(CLEAN), CLEAN);
  var cs = crowdedSolution(12), crowdedRep = Legibility.score(cs.solution, cs.places);
  var straddle = cleanRep.overall.composite < TH - 0.05 && crowdedRep.overall.composite > TH + 0.05;
  var W = Legibility.WEIGHTS;
  var weightsOk = W.gap === 0.5 && W.density === 0.3 && W.leader === 0.2 && Math.abs(W.gap + W.density + W.leader - 1) < 1e-9;
  arm('the conscience that judges legibility is itself sound (controls straddle the threshold, weights gap-dominant)',
    straddle && weightsOk, '[clean ' + cleanRep.overall.composite + ' << ' + TH + ' << ' + crowdedRep.overall.composite + ']');

  // ── SELF-SKIP (arm by wave, §9.2) — honest "not yet", never counted against green.
  //    The night-sky claims stay OUT of the door pill: they are functions of the emitted sky
  //    slab (positions/STAR_META), which the pill (a pure PLACES+solve twin) does not read —
  //    their freshness is owned by `derive-sky --check` (STAR_META canonical from W2.5) + sky.test
  //    in the §9.4 gate set. The tally-vs-register claim (CLAIM 11) armed above at W2.5.
  skip('the night sky is current (positions & groups)', 'the sky gate (derive-sky --check)');
  skip('the star catalog is fresh', 'the sky gate (derive-sky --check + STAR_META)');

  var passN = 0, armedN = 0;
  for (var li = 0; li < lines.length; li++) { if (!lines[li].skip) { armedN++; if (lines[li].ok) passN++; } }
  return {
    pass: passN === armedN, total: armedN, passed: passN, armed: armedN,
    skipped: lines.length - armedN, lines: lines,
    structureCount: drawn.length, estateCollisions: estCol.count,
    districtCollisions: distCol, worstPlate: worst.id, worstPlateComposite: worst.c,
    estateComposite: estRep.overall.composite
  };
}

return {
  footCentre: footCentre,
  footTopLeft: footTopLeft,
  overlapRect: overlapRect,
  LOUPE_SCREEN: LOUPE_SCREEN,
  MIN_SCREEN_GAP: MIN_SCREEN_GAP,
  revealedSet: revealedSet,
  declutterIds: declutterIds,
  childFootOf: childFootOf,
  STRUCT_CLAMP_MIN: STRUCT_CLAMP_MIN,
  STRUCT_CLAMP_MAX: STRUCT_CLAMP_MAX,
  STRUCT_WALK: STRUCT_WALK,
  structDisplayBox: structDisplayBox,
  estateDrawnBoxes: estateDrawnBoxes,
  countBoxCollisions: countBoxCollisions,
  CLEAN: CLEAN,
  crowdedSolution: crowdedSolution,
  runDoorClaims: runDoorClaims
};
})();

/* browser global (forge-inlined): attach as `DoorClaims`. */
(function (root) {
  if (root) root.DoorClaims = DoorClaims;
})(typeof globalThis !== 'undefined' ? globalThis : this);

// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = DoorClaims; }
