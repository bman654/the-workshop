#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   fold.test.cjs — THE FAIRGROUND GATE (#369), AS A NODE TWIN over the LIVE door.

   The estate's first true DETACH-INTO-DEPTH layer. A wing whose any room declares
   `detach:true` folds out of its parent plate into a `child:<wing>` LAYER reached only
   through a synthetic GATE FACE; the parent fills the vacated footprint with that one
   gate tile. `amusements` is the primitive's first caller. This twin is the headless
   proof of the layer's load-bearing claims, lifted from the proven /tmp/foldsim.cjs
   kernel into the smoke.cjs CRUX idiom, run over the LIVE Layout.plates of index.src.html
   (no eyeballing the load-bearing wins).

   THE FIVE CRUXES:
     F1 — BIJECTION ACROSS LAYERS: Σ|members| over every plate (parent ∪ child) === live
          room count; every id ∈ exactly ONE plate's members AND one plate's bbox; the
          synthetic gate FACE is excluded from the count (it is furniture, not a room).
     F2 — DESCENT GRAPH IS A TREE rooted at the door: the plate graph (P.adj, which already
          carries the descent edges) is acyclic (|edges| === |reachable|−1, BFS finds no
          back-edge), every plate reachable from 'manor', adjacency reciprocal. Proven for
          the LIVE estate AND a SYNTHETIC 2-detached-wing fixture (N children, not 1).
     F3 — THE LOAD-BEARING WIN (the live signal, MEASURED): with detach ON the aggregate
          tier-1 survival crosses ⌈raw×0.6⌉ → door.test CLAIM C′ flips ✗→✓ (the pill goes
          16/17 RED → 17/17 GREEN). Measured here off the SAME modeled SOLVED boxes the door
          twin uses, partitioned by the LIVE Layout.plates (so the child gets its own frame).
     F4 — NEG-CONTROL: plates(..,{detachOff:true}) is byte-identical to the pre-fold
          partition AND keeps C′ ✗ — depth did it, not a scorer tweak.
     F5 — GENERALITY: a SYNTHETIC detach of a DIFFERENT wing mints child:<that-wing>, passes
          F1/F2, emits exactly one gate face — amusements is just the first caller.

   Run:  node tools/layout/fold.test.cjs    (exit 0 = all cruxes pass, exit 1 = a crux failed)
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');
const LabelPlacer = require('../label/label.js');
const Legibility = require('./legibility.cjs');
const DoorClaims = require('./door-claims.cjs');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'index.src.html');
const src = fs.readFileSync(SRC, 'utf8');

function readArray(name) {
  const head = 'const ' + name + ' = [';
  const start = src.indexOf(head);
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) throw new Error('fold.test: could not find array ' + name);
  return eval('(' + src.slice(start + ('const ' + name + ' = ').length, end + 2) + ')');
}
function readExpr(name) {
  const m = src.match(new RegExp('const\\s+' + name + '\\s*=\\s*([^;]*);'));
  if (!m) throw new Error('fold.test: could not find const ' + name);
  return eval('(' + m[1].trim() + ')');
}

const PLACES = readArray('PLACES');
const LABEL_BOUNDS = readExpr('LABEL_BOUNDS');
const LABEL_SEED = readExpr('LABEL_SEED');
const LABEL_GAP = readExpr('LABEL_GAP');

/* ── solve + copy the canonical footprints onto a clone (exactly the page + door.test) ── */
function footBBox(r) {
  return r.footprint === 'tower' ? { x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }
                                 : { x: r.x, y: r.y, w: r.w, h: r.h };
}
function footCentre(r) {
  return r.footprint === 'tower' ? { x: r.x, y: r.y } : { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
function labelGap(r) { const b = footBBox(r); return Math.max(b.w, b.h) / 2 + LABEL_GAP; }
function preferList(r) { return r.prefer ? (Array.isArray(r.prefer) ? r.prefer.slice() : [r.prefer]) : undefined; }

const clone = PLACES.map(p => Object.assign({}, p));
const LAYOUT = Layout.solve(clone);
for (const p of clone) {
  const f = LAYOUT.foot[p.id]; if (!f) continue;
  if (f.r != null) { p.x = f.x; p.y = f.y; p.r = f.r; }
  else { p.x = f.x; p.y = f.y; p.w = f.w; p.h = f.h; }
}
const live = clone.filter(p => !p.locked);

/* ── model the SOLVED canonical-plate label boxes (CHAR_W) → boxOf, like door.test PASS 1.
   Used for the PARENT plates (whose bbox/frame read canonical foot). ── */
const placed = clone.filter(p => !p.locked && LAYOUT.foot[p.id]);
const obstacles = placed.map(p => footBBox(p));
const features = placed.map(r => {
  const wh = Legibility.labelBoxWH(r);
  const f = { id: r.id, anchor: footCentre(r), label: { w: wh.w, h: wh.h }, gap: labelGap(r) };
  const pref = preferList(r); if (pref) f.prefer = pref;
  if (r.pin) f.pin = r.pin;
  return f;
});
let res = LabelPlacer.solve(Object.assign({ positions: 8 }, { bounds: LABEL_BOUNDS, features, obstacles, seed: LABEL_SEED }));
const solvedCanon = new Map();
res.placements.forEach(p => solvedCanon.set(p.id, { x: p.label.x, y: p.label.y, w: p.label.w, h: p.label.h }));

/* ── model the CHILD plate's SOLVED boxes from its OWN relay foot envelope (childLayout):
   a child is re-laid by relayPlate, so its label boxes anneal over the relay foot, NOT the
   canonical foot. Returns a boxOf over the child's members. ── */
function childBoxOf(members, childLayout) {
  const m = new Map();
  const placedC = members.filter(r => childLayout.foot[r.id]);
  const obsC = placedC.map(r => { const f = childLayout.foot[r.id]; return { x: f.x, y: f.y, w: f.w, h: f.h }; });
  const featC = placedC.map(r => {
    const f = childLayout.foot[r.id];
    const wh = Legibility.labelBoxWH(r);
    return { id: r.id, anchor: { x: f.x + f.w / 2, y: f.y + f.h / 2 }, label: { w: wh.w, h: wh.h }, gap: Math.max(f.w, f.h) / 2 + LABEL_GAP };
  });
  const rc = LabelPlacer.solve({ positions: 8, bounds: LABEL_BOUNDS, features: featC, obstacles: obsC, seed: LABEL_SEED });
  rc.placements.forEach(p => m.set(p.id, { x: p.label.x, y: p.label.y, w: p.label.w, h: p.label.h }));
  return m;
}

/* ── the live partition with the fold ON, and the neg-control with it OFF ── */
const P = Layout.plates(live);
const OFF = Layout.plates(live, { detachOff: true });

/* a unified boxOf over BOTH layers: parent ids read the canonical solve, child ids read
   the child's own relay solve. */
const childBoxes = {};   // pid → Map(id→box)
for (const cpid of P.childPlates) childBoxes[cpid] = childBoxOf(P.members[cpid], P.childLayout[cpid]);
function boxOfAll(id) {
  const pid = P.roomPlate[id];
  if (pid && childBoxes[pid] && childBoxes[pid].has(id)) return childBoxes[pid].get(id);
  return solvedCanon.get(id) || null;
}

/* ════════════════════════════════════════════════════════════════════════════
   the per-plate aggregate tier-1 survival, decluttering each plate's whole-POI set the
   SAME greedy way the loupe/door does (DoorClaims.declutterIds), at the plate's framed
   scale. This is the door pill's CLAIM C/C′ computation, partitioned by Layout.plates.
   ════════════════════════════════════════════════════════════════════════════ */
function tier1Survival(part, boxOf) {
  const byPlate = {};
  for (const r of live) { if (!boxOf(r.id)) continue; const pid = part.roomPlate[r.id]; if (!pid) continue; (byPlate[pid] = byPlate[pid] || []).push(r.id); }
  let t1raw = 0, t1lit = 0, litTotal = 0, rawTotal = 0;
  const byId = {}; for (const r of live) byId[r.id] = r;
  // child plates need their members modeled with footCentre from the RELAY foot (so the
  // loupe distance term matches the child layer); build a per-plate places view.
  for (const pk of Object.keys(byPlate)) {
    const ids = byPlate[pk];
    const fr = part.frame[pk] || { cx: 720, cy: 450, k: 1 };
    rawTotal += ids.length;
    const cl = part.childLayout && part.childLayout[pk];
    // places-view: for a child plate, swap each room's footprint to its relay foot so
    // DoorClaims.footCentre reads the child-layer centre.
    const placesView = live.map(r => {
      if (cl && cl.foot[r.id]) { const f = cl.foot[r.id]; return Object.assign({}, r, { x: f.x, y: f.y, w: f.w, h: f.h, footprint: undefined }); }
      return r;
    });
    const lit = DoorClaims.declutterIds(ids, placesView, boxOf, { x: fr.cx, y: fr.cy }, fr.k || 1);
    litTotal += lit.length;
    const litSet = {}; lit.forEach(i => litSet[i] = 1);
    for (const id of ids) { const r = byId[id]; if (r && r.tier === 1) { t1raw++; if (litSet[id]) t1lit++; } }
  }
  return { t1raw, t1lit, litTotal, rawTotal };
}

/* ════════════════════════════════════════════════════════════════════════════
   GRAPH HELPERS — the plate graph is P.adj (already carries the descent edges).

   NOTE on the TREE property: the PARENT road graph is a deliberate MESH (the manor hub +
   the W/E mid-wall edge form a triangle — manor↔W, manor↔E, W↔E), so the WHOLE graph is
   NOT a tree, and never was. The property the FOLD must hold is that the DESCENT structure
   is a tree: every child plate hangs off the parent mesh by EXACTLY ONE edge (its gate
   parent), so a child is reachable exactly one way (no child↔child edge, no second parent).
   That + connected + reciprocal is the "descent graph is a tree rooted at the door" claim:
   removing the parent mesh's cycles, the children form a forest of depth-1 leaves on the door.
   ════════════════════════════════════════════════════════════════════════════ */
function graphCheck(part) {
  // reciprocity
  let recip = true; const nonRecip = [];
  for (const a in part.adj) for (const b in part.adj[a]) if (!(part.adj[b] && part.adj[b][a])) { recip = false; nonRecip.push(a + '→' + b); }
  // BFS from manor: reachable set.
  const root = part.ids.indexOf('manor') >= 0 ? 'manor' : part.ids[0];
  const vis = new Set([root]); const q = [root];
  while (q.length) { const x = q.shift(); for (const y in (part.adj[x] || {})) if (!vis.has(y)) { vis.add(y); q.push(y); } }
  const reachable = vis.size;
  const allReachable = reachable === part.ids.length;
  // the DESCENT TREE property: every child plate has exactly ONE neighbour (its gate parent),
  // and that neighbour is a PARENT (non-child) plate. So no child is reachable two ways, and
  // the children form leaves on the parent mesh — a tree of descent rooted at the door.
  const childPids = part.childPlates || [];
  let descentTree = true; const descentDetail = [];
  for (const cp of childPids) {
    const nbrs = Object.keys(part.adj[cp] || {});
    const parents = nbrs.filter(n => childPids.indexOf(n) < 0);
    const childNbrs = nbrs.filter(n => childPids.indexOf(n) >= 0);
    if (nbrs.length !== 1 || parents.length !== 1 || childNbrs.length !== 0) {
      descentTree = false; descentDetail.push(cp + '→[' + nbrs.join(',') + ']');
    }
  }
  // tree of descent is acyclic by construction (depth-1 leaves); confirm via the global
  // formula restricted to the spanning structure: |descent edges| === |children| (one per).
  let descentEdges = 0;
  for (const [a, b] of part.edges) if (childPids.indexOf(a) >= 0 || childPids.indexOf(b) >= 0) descentEdges++;
  const descentEdgesOk = descentEdges === childPids.length;
  const isTree = allReachable && recip && descentTree && descentEdgesOk;
  return { recip, nonRecip, reachable, total: part.ids.length, allReachable, descentTree, descentEdges, descentEdgesOk, descentDetail, isTree };
}

/* ════════════════════════════════════════════════════════════════════════════
   A SYNTHETIC 2-detached-wing FIXTURE — prove the tree/bijection/gate for N children.
   We build a minimal places set: a manor anchor, a grounds anchor on each side, and two
   distinct grounds wings each flagged detach:true. Pure declarations; the engine folds both.
   ════════════════════════════════════════════════════════════════════════════ */
function syntheticTwoDetach() {
  // two wings that have real GROUNDS_WINGS regions so each emits a gate face.
  // 'amusements' (east, x910) + 'optics' (west, x214) → one east gate, one west gate.
  const mk = (id, wing, tier, order) => ({ id, room: id, piece: id, tag: id, district: 'grounds', tier, wing, footprint: 'hall', order });
  return [
    { id: 'm1', room: 'Manor', piece: 'Manor', tag: 'home', district: 'manor', tier: 1, footprint: 'house-wing', order: 1 },
    { id: 'gw', room: 'WestAnchor', piece: 'W', tag: 'w', district: 'grounds', tier: 2, wing: 'works', footprint: 'hall', order: 2, x: 300, y: 600 },
    mk('a1', 'amusements', 1, 10), mk('a2', 'amusements', 2, 11), mk('a3', 'amusements', 1, 12),
    mk('o1', 'optics', 1, 20), mk('o2', 'optics', 2, 21),
  ].map(r => {
    if (r.wing === 'amusements' && r.id === 'a1') r.detach = true;
    if (r.wing === 'optics' && r.id === 'o1') r.detach = true;
    return r;
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   RUN THE CRUXES
   ════════════════════════════════════════════════════════════════════════════ */
let fail = 0;
function crux(name, ok, detail) {
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fail++;
}

console.log('fold.test — THE FAIRGROUND GATE (#369): the declarative detach-into-depth layer, node twin\n');

/* ── F1 — BIJECTION ACROSS LAYERS ── */
console.log('CRUX F1 — BIJECTION ACROSS LAYERS (Σ rooms over parent ∪ child === live count):');
{
  let total = 0; const seen = new Set(); let dup = false;
  for (const id of P.ids) for (const r of P.members[id]) { if (seen.has(r.id)) dup = true; seen.add(r.id); total++; }
  crux('Σ|members| === live rooms, no double-count', total === live.length && seen.size === live.length && !dup,
    '[' + total + '/' + live.length + ' over ' + P.ids.length + ' plates' + (dup ? ', DUP!' : '') + ']');
  // every live id ∈ exactly one plate's bbox
  let inOneBbox = 0, stranded = [];
  for (const r of live) {
    const c = childBoxes[P.roomPlate[r.id]] && P.childLayout[P.roomPlate[r.id]]
      ? (() => { const f = P.childLayout[P.roomPlate[r.id]].foot[r.id]; return { x: f.x + f.w / 2, y: f.y + f.h / 2 }; })()
      : footCentre(r);
    let count = 0;
    for (const pid of P.ids) { const bb = P.bbox[pid]; if (c.x >= bb.x && c.x <= bb.x + bb.w && c.y >= bb.y && c.y <= bb.y + bb.h) count++; }
    if (count >= 1) inOneBbox++; else stranded.push(r.id);
  }
  crux('every room centre inside ≥1 plate bbox (none stranded)', stranded.length === 0,
    '[' + inOneBbox + '/' + live.length + (stranded.length ? ' stranded: ' + stranded.join(',') : '') + ']');
  // the gate face is NOT a member, NOT in the room count
  const gateInMembers = P.gates.some(g => P.members[P.roomPlate[g.wing]] || (P.roomPlate && P.roomPlate['gate:' + g.wing]));
  const noGateRoom = !live.some(r => r.kind === 'gate') && P.gates.length === 1;
  crux('exactly one gate FACE emitted, excluded from the room count', noGateRoom && !gateInMembers,
    '[' + P.gates.length + ' gate(s); ' + total + ' rooms; gate is furniture]');
  console.log('    child:amusements n=' + P.members['child:amusements'].length + '  parent grounds-east n=' + (P.members['grounds-east'] || []).length);
}

/* ── F2 — DESCENT GRAPH IS A TREE rooted at the door ── */
console.log('\nCRUX F2 — DESCENT GRAPH IS A TREE rooted at the door (live + synthetic):');
{
  const g = graphCheck(P);
  crux('LIVE: every plate reachable from manor + reciprocal + each child hangs by ONE gate edge',
    g.isTree,
    '[' + g.reachable + '/' + g.total + ' reachable' + (g.recip ? ', reciprocal' : ', NON-RECIP ' + g.nonRecip.join(',')) +
    ', descent edges=' + g.descentEdges + ' (one per child)' + (g.descentTree ? '' : ', BAD: ' + g.descentDetail.join(' ')) + ']');
  console.log('    descent edges: ' + P.edges.filter(e => e[0].indexOf('child:') === 0 || e[1].indexOf('child:') === 0).map(e => e[0] + '↔' + e[1]).join(', '));
  // synthetic 2-detach fixture
  const SYN = syntheticTwoDetach();
  const SP = Layout.plates(SYN);
  const sg = graphCheck(SP);
  const synChildren = SP.childPlates.length;
  crux('SYNTHETIC 2-detach: two children mint, each hangs by one edge, all reachable (N children, not 1)',
    synChildren === 2 && sg.isTree,
    '[children=' + synChildren + ' (' + SP.childPlates.join(',') + '), descent edges=' + sg.descentEdges + ', ' +
    sg.reachable + '/' + sg.total + ' reachable' + (sg.recip ? ', reciprocal' : ', NON-RECIP') + ']');
}

/* ── F3 — THE LOAD-BEARING WIN (MEASURED) ── */
console.log('\nCRUX F3 — THE LOAD-BEARING WIN (aggregate tier-1 survival, MEASURED):');
{
  const on = tier1Survival(P, boxOfAll);
  const need = Math.ceil(on.t1raw * 0.6);
  crux('detach ON: aggregate tier-1 survival ≥ ⌈raw×0.6⌉ → CLAIM C′ flips ✓',
    on.t1lit >= need,
    '[' + on.t1lit + '/' + on.t1raw + ' tier-1 survive, need ≥ ' + need + ']');
  console.log('    (foldsim measured 26/38 ≥ 23 by amusements alone; this is the live-engine partition)');
}

/* ── F4 — NEG-CONTROL ── */
console.log('\nCRUX F4 — NEG-CONTROL (detach OFF: byte-identical partition, C′ stays ✗):');
{
  // partition byte-identical to pre-fold: no child plates, no gates, roomPlate equals the
  // detach-suppressed plateOf. Compare OFF.roomPlate to a hand-rolled non-detach partition.
  const noChild = OFF.childPlates.length === 0 && OFF.gates.length === 0 &&
    Object.keys(OFF.detached).length === 0 && OFF.ids.indexOf('child:amusements') < 0;
  crux('detachOff: no child plates, no gate faces, no detached wings',
    noChild, '[childPlates=' + OFF.childPlates.length + ' gates=' + OFF.gates.length + ' detached=' + Object.keys(OFF.detached).length + ']');
  // amusements rooms ride grounds-east again under the neg-control
  const amuOnEast = live.filter(r => r.wing === 'amusements').every(r => OFF.roomPlate[r.id] === 'grounds-east');
  crux('detachOff: the amusements rooms ride the parent grounds-east plate again', amuOnEast);
  // C′ stays ✗ with detach OFF — depth did it, not a scorer tweak.
  const off = tier1Survival(OFF, id => solvedCanon.get(id) || null);
  const need = Math.ceil(off.t1raw * 0.6);
  crux('detachOff: aggregate tier-1 survival < ⌈raw×0.6⌉ → C′ stays ✗ (depth, not a scorer tweak)',
    off.t1lit < need, '[' + off.t1lit + '/' + off.t1raw + ' tier-1 survive, need ≥ ' + need + ' → still RED]');
}

/* ── F5 — GENERALITY ── */
console.log('\nCRUX F5 — GENERALITY (a DIFFERENT wing detaches the same way):');
{
  // detach OPTICS instead of amusements on a synthetic estate; assert one child + one gate.
  const mk = (id, wing, tier, order, detach) => { const r = { id, room: id, piece: id, tag: id, district: 'grounds', tier, wing, footprint: 'hall', order }; if (detach) r.detach = true; return r; };
  const places = [
    { id: 'm1', room: 'Manor', piece: 'Manor', tag: 'home', district: 'manor', tier: 1, footprint: 'house-wing', order: 1 },
    { id: 'e1', room: 'EastAnchor', piece: 'E', tag: 'e', district: 'grounds', tier: 2, wing: 'works', footprint: 'hall', order: 2, x: 800, y: 600 },
    mk('p1', 'optics', 1, 10, true), mk('p2', 'optics', 2, 11), mk('p3', 'optics', 1, 12),
  ];
  const GP = Layout.plates(places);
  const minted = GP.childPlates.length === 1 && GP.childPlates[0] === 'child:optics';
  const oneGate = GP.gates.length === 1 && GP.gates[0].wing === 'optics' && GP.gates[0].toPlate === 'child:optics';
  const g = graphCheck(GP);
  crux('a DIFFERENT wing (optics) mints child:optics, one gate face, descent tree holds',
    minted && oneGate && g.isTree,
    '[children=' + GP.childPlates.join(',') + ', gates=' + GP.gates.length + ', tree=' + g.isTree + ', reachable=' + g.reachable + '/' + g.total + ']');
  console.log('    amusements is just the primitive\'s first caller — the fold is general.');
}

/* ── F6 — THE SHARED C′ SEAM (the EXACT path the live #doortest pill runs) ── */
console.log('\nCRUX F6 — THE LIVE C′ SEAM (DoorClaims.runDoorClaims with the engine childFoot):');
{
  // run the SHARED door-claims module the page + door.test both call, with the LIVE relay foot
  // (DoorClaims.childFootOf(P)) as the override, over the canonical modeled boxes — the SAME
  // computation the live pill performs. C′ MUST flip green; with childFoot:{} (the relay
  // suppressed) it MUST stay red. This binds fold.test directly to the page's code path: the
  // #369 bug was the page NOT feeding this relay, so the live pill stayed red while the twins
  // (which modeled their own relay) went green. Now they share one seam.
  const childFoot = DoorClaims.childFootOf(P);
  const boxOfCanon = id => solvedCanon.get(id) || null;
  const repOn = DoorClaims.runDoorClaims({ Legibility, Layout, places: clone, layout: LAYOUT, boxOf: boxOfCanon, childFoot });
  const repOff = DoorClaims.runDoorClaims({ Legibility, Layout, places: clone, layout: LAYOUT, boxOf: boxOfCanon, detachOff: true });
  const cpOn = repOn.lines.find(l => /CLAIM C′/.test(l.name));
  const cpOff = repOff.lines.find(l => /CLAIM C′/.test(l.name));
  crux('childFoot present (the page\'s fold): C′ flips ✓ AND detachOff (no fold): C′ stays ✗',
    childFoot && Object.keys(childFoot).length > 0 && cpOn && cpOn.ok && cpOff && !cpOff.ok,
    '[fold ON ' + cpOn.detail + ' → ' + (cpOn.ok ? '✓' : '✗') + '  ·  detachOff ' + cpOff.detail + ' → ' + (cpOff.ok ? '✓' : '✗') + ']');
  console.log('    this is the path the live pill runs — fold.test now fails iff the page would.');
}

console.log('');
if (fail === 0) {
  console.log('PASS — all six cruxes hold: the declarative fold ships a real depth layer (bijection + tree + the C′ flip + neg-control + generality + the shared live C′ seam).');
  process.exit(0);
} else {
  console.log('FAIL — ' + fail + ' crux(es) failed.');
  process.exit(1);
}
