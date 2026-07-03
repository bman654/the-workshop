#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   fold.test.cjs — THE FAIRGROUND FOLD, a pure-Node twin over the v2 polar engine.

   The estate's one true DETACH-INTO-DEPTH layer. In v2 the `detach` lever lives on the
   district CONTRACT (fairground): its layoutFn goes DORMANT, its rooms lay out in a
   `child:fairground` LAYER via relayPlate on RELAY_FIELD, and the parent plate collapses
   to a single synthetic GATE FACE at the district's polar centre. This twin is the
   headless proof of the fold's four KEPT load-bearing claims (§9.1) — bijection, descent
   tree, generality, the detachOff neg-control — computed straight off Layout.solve /
   Layout.plates, so it reads identically in Node and the browser (no getBBox mirror, no
   font raster; the v1 label-declutter cruxes F3/F6 retired with the door-pill rewrite §9.2).

   THE FOUR CRUXES (§9.1 "kept: bijection · descent tree · generality · detachOff neg-control"):
     F1 — BIJECTION ACROSS LAYERS: Σ|members| over every plate (parent ∪ child) === live
          room count, no double-count; every room centre sits inside its OWN plate bbox;
          the gate FACE is furniture, excluded from the room count.
     F2 — DESCENT GRAPH IS A TREE rooted at the manor: reachable + reciprocal, each child
          plate hangs off the parent mesh by EXACTLY ONE gate edge (no child↔child edge,
          no second parent). Proven for the LIVE estate AND a SYNTHETIC 2-detach table.
     F3 — GENERALITY: the fold is a CONTRACT primitive — a DIFFERENT district flagged
          detach:true mints child:<that-district> + one gate the same way. The fairground
          is just the §2.1 caller.
     F4 — DETACHOFF NEG-CONTROL (the fold is LOAD-BEARING): plates(PLACES,{detachOff:true})
          THROWS — with the fold suppressed the fairground cannot fit its dormant knot, so
          the config is infeasible. Depth did it, not a scorer tweak.

   Run:  node tools/layout/fold.test.cjs    (exit 0 = all cruxes pass, exit 1 = a crux failed)
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');

const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'index.src.html'), 'utf8');

function readArray(name) {
  const head = 'const ' + name + ' = [';
  const start = src.indexOf(head);
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) throw new Error('fold.test: could not find array ' + name);
  return eval('(' + src.slice(start + ('const ' + name + ' = ').length, end + 2) + ')');
}

const PLACES = readArray('PLACES');
const live = PLACES.filter(p => !p.locked);

/* ── the live solve + partition (exactly the page's own calls) ── */
const SOL = Layout.solve(PLACES.map(p => Object.assign({}, p)));
const P = Layout.plates(PLACES);

/* the centre of a room IN ITS OWN PLATE'S coordinate layer: a child room reads its relay
   foot (childLayout), a parent room reads the canonical solve foot. A tower foot is {x,y,r}
   (centre already), a box foot is {x,y,w,h}. */
function footCentre(f) { return f.r != null ? { x: f.x, y: f.y } : { x: f.x + f.w / 2, y: f.y + f.h / 2 }; }
function roomCentre(part, id) {
  const pid = part.roomPlate[id];
  const cl = part.childLayout && part.childLayout[pid];
  if (cl && cl.foot[id]) return footCentre(cl.foot[id]);
  const f = (part.solution && part.solution.foot[id]) || SOL.foot[id];
  return f ? footCentre(f) : null;
}
function inBox(c, b) { return !!(c && b && c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h); }

/* ════════════════════════════════════════════════════════════════════════════
   the DESCENT-TREE check over a plates() partition. The plate graph is part.adj (the
   reciprocal inter-plate road graph); part.edges / part.childPlates are the v2 keys.

   NOTE on the TREE property: the PARENT road graph is a hub (manor ↔ every parent plate),
   so the WHOLE graph is a star, not a chain. The property the FOLD must hold is that the
   DESCENT structure is a tree: every child plate hangs off the parent mesh by EXACTLY ONE
   edge (its gate parent), so a child is reachable exactly one way — no child↔child edge,
   no second parent. That + connected + reciprocal is "the descent graph is a tree rooted
   at the door": the children are depth-1 leaves on the manor hub.
   ════════════════════════════════════════════════════════════════════════════ */
function graphCheck(part) {
  let recip = true; const nonRecip = [];
  for (const a in part.adj) for (const b in part.adj[a]) if (!(part.adj[b] && part.adj[b][a])) { recip = false; nonRecip.push(a + '→' + b); }
  const root = part.ids.indexOf('manor') >= 0 ? 'manor' : part.ids[0];
  const vis = new Set([root]); const q = [root];
  while (q.length) { const x = q.shift(); for (const y in (part.adj[x] || {})) if (!vis.has(y)) { vis.add(y); q.push(y); } }
  const reachable = vis.size, allReachable = reachable === part.ids.length;
  const childPids = part.childPlates || [];
  let descentTree = true; const bad = [];
  for (const cp of childPids) {
    const nbrs = Object.keys(part.adj[cp] || {});
    const parents = nbrs.filter(n => childPids.indexOf(n) < 0);
    const childNbrs = nbrs.filter(n => childPids.indexOf(n) >= 0);
    if (nbrs.length !== 1 || parents.length !== 1 || childNbrs.length !== 0) { descentTree = false; bad.push(cp + '→[' + nbrs.join(',') + ']'); }
  }
  let descentEdges = 0;
  for (const [a, b] of part.edges) if (childPids.indexOf(a) >= 0 || childPids.indexOf(b) >= 0) descentEdges++;
  const descentEdgesOk = descentEdges === childPids.length;
  return {
    recip, nonRecip, reachable, total: part.ids.length, allReachable, descentTree, descentEdges, descentEdgesOk, bad,
    isTree: allReachable && recip && descentTree && descentEdgesOk
  };
}

/* ── synthetic contract tables (v2: `detach` is a CONTRACT flag; angles 30/130 clear the
   road wedge [168,192] and both sky lanes [82,94]/[246,258] AND sit ≥90° apart, the orbit-1
   angular-separation law π/(t+1); the base is proven to solve). ── */
function synthManor() { return { tier: 0, theme: { label: 'M', hue: '#111', tint: 0.04, style: 'x' }, layoutFn: 'greathouse', frame: { w: 280, h: 200 }, capacity: 23, clusters: [] }; }
function synthDistrict(angle, label, detach) {
  const c = { tier: 1, angle, theme: { label, hue: '#222', tint: 0.04, style: 'x' }, layoutFn: 'court', frame: { w: 240, h: 180 }, capacity: 6, clusters: [] };
  if (detach) c.detach = true;
  return c;
}
const districtRooms = (d, n) => Array.from({ length: n }, (_, i) => ({ id: d + i, district: d, tier: 2, order: i }));
const manorAnchor = () => ({ id: 'm0', district: 'manor', tier: 1, order: 0 });   // members['manor'] must exist so the gate edges link

/* ════════════════════════════════════════════════════════════════════════════
   RUN THE CRUXES
   ════════════════════════════════════════════════════════════════════════════ */
let fail = 0;
function crux(name, ok, detail) { console.log('  ' + (ok ? '✓' : '✗') + ' ' + name + (detail ? '  ' + detail : '')); if (!ok) fail++; }
function throwsCrux(name, fn, detail) {
  let threw = false, msg = '';
  try { fn(); } catch (e) { threw = true; msg = String((e && e.message) || e); }
  crux(name, threw, detail || (threw ? '[threw: ' + msg.slice(0, 90) + ']' : '[DID NOT THROW]'));
}

console.log('fold.test — THE FAIRGROUND FOLD (v2 polar): the contract-level detach-into-depth layer, node twin\n');

/* ── F1 — BIJECTION ACROSS LAYERS ── */
console.log('CRUX F1 — BIJECTION ACROSS LAYERS (Σ rooms over parent ∪ child === live count):');
{
  let total = 0; const seen = new Set(); let dup = false;
  for (const id of P.ids) for (const r of P.members[id]) { if (seen.has(r.id)) dup = true; seen.add(r.id); total++; }
  crux('Σ|members| === live rooms, no double-count', total === live.length && seen.size === live.length && !dup,
    '[' + total + '/' + live.length + ' over ' + P.ids.length + ' plates' + (dup ? ', DUP!' : '') + ']');
  let inOwn = 0; const stranded = [];
  for (const r of live) { if (inBox(roomCentre(P, r.id), P.bbox[P.roomPlate[r.id]])) inOwn++; else stranded.push(r.id); }
  crux('every room centre inside its OWN plate bbox (none stranded)', stranded.length === 0,
    '[' + inOwn + '/' + live.length + (stranded.length ? ' stranded: ' + stranded.join(',') : '') + ']');
  const noGateRoom = !live.some(r => r.kind === 'gate');
  crux('exactly one gate FACE emitted, excluded from the room count', P.gates.length === 1 && noGateRoom,
    '[' + P.gates.length + ' gate(s), ' + total + ' rooms; the gate is furniture]');
  console.log('    child:fairground n=' + (P.members['child:fairground'] || []).length + '  (the detached fairground tiles)');
}

/* ── F2 — DESCENT GRAPH IS A TREE rooted at the manor ── */
console.log('\nCRUX F2 — DESCENT GRAPH IS A TREE rooted at the manor (live + synthetic 2-detach):');
{
  const g = graphCheck(P);
  crux('LIVE: every plate reachable from manor + reciprocal + each child hangs by ONE gate edge',
    g.isTree,
    '[' + g.reachable + '/' + g.total + ' reachable' + (g.recip ? ', reciprocal' : ', NON-RECIP ' + g.nonRecip.join(',')) +
    ', descent edges=' + g.descentEdges + ' (one per child)' + (g.descentTree ? '' : ', BAD: ' + g.bad.join(' ')) + ']');
  console.log('    descent edges: ' + P.edges.filter(e => e[0].indexOf('child:') === 0 || e[1].indexOf('child:') === 0).map(e => e[0] + '↔' + e[1]).join(', '));
  // SYNTHETIC two-detach table: a manor anchor + two tier-1 districts, both contract-detached.
  const C = { manor: synthManor(), alpha: synthDistrict(30, 'A', true), beta: synthDistrict(130, 'B', true) };
  const rooms = [manorAnchor()].concat(districtRooms('alpha', 3)).concat(districtRooms('beta', 2));
  const SP = Layout.plates(rooms, { contracts: C });
  const sg = graphCheck(SP);
  crux('SYNTHETIC 2-detach: two children mint, each hangs by one edge, all reachable (N children, not 1)',
    SP.childPlates.length === 2 && sg.isTree,
    '[children=[' + SP.childPlates.join(',') + '], descent edges=' + sg.descentEdges + ', ' +
    sg.reachable + '/' + sg.total + ' reachable' + (sg.recip ? ', reciprocal' : ', NON-RECIP') + ']');
}

/* ── F3 — GENERALITY (a DIFFERENT district folds the same way) ── */
console.log('\nCRUX F3 — GENERALITY (a contract-flagged district ≠ fairground folds identically):');
{
  const C = { manor: synthManor(), alpha: synthDistrict(30, 'A', true) };
  const rooms = [manorAnchor()].concat(districtRooms('alpha', 3));
  const GP = Layout.plates(rooms, { contracts: C });
  const g = graphCheck(GP);
  const minted = JSON.stringify(Object.keys(GP.detached).sort()) === '["alpha"]' &&
    GP.childPlates.length === 1 && GP.childPlates[0] === 'child:alpha';
  const oneGate = GP.gates.length === 1 && GP.gates[0].district === 'alpha' && GP.gates[0].toPlate === 'child:alpha' &&
    GP.gates[0].box.w === 96 && GP.gates[0].box.h === 120;
  crux('a DIFFERENT district (alpha) mints child:alpha, one 96×120 gate face, descent tree holds',
    minted && oneGate && GP.parentOf['child:alpha'] === 'manor' && g.isTree,
    '[detached=' + Object.keys(GP.detached).join(',') + ', children=' + GP.childPlates.join(',') + ', gates=' + GP.gates.length + ', tree=' + g.isTree + ']');
  console.log('    the fairground is just the §2.1 caller — the fold is a general contract primitive.');
}

/* ── F4 — DETACHOFF NEG-CONTROL (the fold is load-bearing) ── */
console.log('\nCRUX F4 — DETACHOFF NEG-CONTROL (suppress the fold → the fairground is infeasible):');
{
  // with the fold ON: exactly {fairground} detaches, one gate, the child carries every fairground tile.
  const fairRooms = live.filter(r => r.district === 'fairground');
  crux('the fold detaches exactly {fairground}; child:fairground carries all ' + fairRooms.length + ' tiles; one gate',
    JSON.stringify(Object.keys(P.detached).sort()) === '["fairground"]' &&
    (P.members['child:fairground'] || []).length === fairRooms.length &&
    P.gates.length === 1 && P.gates[0].district === 'fairground',
    '[detached=' + Object.keys(P.detached).join(',') + ', child tiles=' + (P.members['child:fairground'] || []).length + '/' + fairRooms.length + ', gates=' + P.gates.length + ']');
  // with the fold OFF: the dormant knot cannot seat the fairground → plates() THROWS.
  throwsCrux('detachOff: plates(PLACES,{detachOff:true}) THROWS — depth is load-bearing, not a scorer tweak',
    () => Layout.plates(PLACES, { detachOff: true }));
}

console.log('');
if (fail === 0) {
  console.log('PASS — all four cruxes hold: the contract-level fold ships a real depth layer (bijection + descent tree + generality + the load-bearing detachOff neg-control).');
  process.exit(0);
} else {
  console.log('FAIL — ' + fail + ' crux(es) failed.');
  process.exit(1);
}
