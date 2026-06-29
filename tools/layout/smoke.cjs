/* smoke test: run Layout.solve over the declarative PLACES and verify every
   footprint stays inside FIELD and clear of all catalog stars. Node-only.

   After the STRUCTURAL suite, this also runs the LEGIBILITY CONSCIENCE
   (legibility.cjs) over the LIVE 37-POI door as a separate, clearly-labelled
   section. EXIT-CODE POLICY: the legibility verdict is a WARNING, never a hard
   exit-1. The live door is EXPECTED to FAIL the legibility threshold — that red
   is the intended confirmation of #103 (modeled label-box crowding) and the
   concrete target for a pending [map] re-draw. If it tripped the structural exit
   code, every unrelated cycle's CI would break on a known-open issue. So the
   structural `fail` counter (which drives process.exit) NEVER counts the
   legibility verdict; legibility's own regression guard is legibility.test.cjs. */
const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');
const Sky = require('../sky/sky.js');
const Leg = require('./legibility.cjs');
const C = Sky.CATALOG;
const STAR_PAD = 12;

/* THE STRUCTURAL CORPUS IS THE LIVE DOOR (#328). This suite used to solve a HAND-
   MAINTAINED fixture of the PLACES — but it drifted stale (it carried only 6 of the
   number wing's 9 rooms, 1 of drawing-engines' 2, and was missing ~35 live rooms),
   so the geometry it tested no longer matched the door it ships. That staleness is a
   landmine: the #328 Pascal-triangle re-budget passed the LIVE solve but tripped the
   fixture's phantom drawing-engines sprawl. The fix is to test REALITY — read the
   single source of truth (index.src.html's PLACES) the same way the observatory /
   plate / crowding / legibility sub-tests below already do. One loader, reused. */
function loadLive() {
  const SRC = path.join(__dirname, '..', '..', 'index.src.html');
  const src = fs.readFileSync(SRC, 'utf8');
  const a = src.indexOf('const PLACES = ['), b = src.indexOf('\n];', a);
  if (a < 0 || b < 0) throw new Error('smoke.cjs: could not read live PLACES from index.src.html');
  // eslint-disable-next-line no-eval
  return eval('(' + src.slice(a + 'const PLACES = '.length, b + 2) + ')').filter(p => !p.locked);
}
const PLACES = loadLive();

let fail = 0;
const sol = Layout.solve(PLACES);

function bbox(f){ return f.r!=null ? {x:f.x-f.r,y:f.y-f.r,w:f.r*2,h:f.r*2} : f; }
function starHit(s,b){ return s.x+STAR_PAD>b.x && s.x-STAR_PAD<b.x+b.w && s.y+STAR_PAD>b.y && s.y-STAR_PAD<b.y+b.h; }

const F = Layout.FIELD;
console.log('=== FOOTPRINTS ===');
for(const id in sol.foot){
  const b = bbox(sol.foot[id]);
  const inField = b.x>=F.x-0.5 && b.y>=F.y-0.5 && b.x+b.w<=F.x+F.w+0.5 && b.y+b.h<=F.y+F.h+0.5;
  let starCollide = [];
  for(const sid in C) if(starHit(C[sid], b)) starCollide.push(sid);
  if(!inField){ console.log('  OUT-OF-FIELD', id, JSON.stringify(b)); fail++; }
  if(starCollide.length){ console.log('  STAR-COLLISION', id, '→', starCollide.join(',')); fail++; }
  console.log('  ', id.padEnd(16), `x${Math.round(b.x)} y${Math.round(b.y)} ${Math.round(b.w)}x${Math.round(b.h)}`, sol.footMeta[id].wing||'(none)');
}

// footprint-vs-footprint overlap check. A circular footprint (a tower) draws its
// backing as the INSCRIBED CIRCLE, so two towers whose square bboxes merely touch at
// a corner do NOT visually overlap — test them disc-vs-disc (centre-distance ≥ r_i+r_j),
// which is the right geometry for the observatory's concentric rings (#275). Any pair
// involving a rectangular footprint keeps the conservative bbox test.
const ids = Object.keys(sol.foot);
for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
  const fi=sol.foot[ids[i]], fj=sol.foot[ids[j]];
  let ov;
  if(fi.r!=null && fj.r!=null){
    const d=Math.hypot(fi.x-fj.x, fi.y-fj.y);
    ov = d < fi.r + fj.r - 1e-6;                 // two discs intersect
  } else {
    const a=bbox(fi), b=bbox(fj);
    ov = a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
  }
  if(ov){ console.log('  FOOT-OVERLAP', ids[i], '×', ids[j]); fail++; }
}

console.log('\n=== DISTRICT RECTS ===');
sol.districtRects.forEach(d=> console.log('  ', d.district.padEnd(12), `x${Math.round(d.x)} y${Math.round(d.y)} ${Math.round(d.w)}x${Math.round(d.h)}`, d.label));
console.log('\n=== WING RECTS ===');
sol.wingRects.forEach(w=> console.log('  ', (w.district+'/'+w.wing).padEnd(24), `x${Math.round(w.x)} y${Math.round(w.y)} ${Math.round(w.w)}x${Math.round(w.h)}`, w.label));
console.log('\n=== DOOR ===', JSON.stringify(sol.door));
console.log('=== GRAPH ===', 'avenues', sol.graph.avenues.length, 'aisles', sol.graph.aisles.length, 'stubs', sol.graph.stubs.length);

// beneath slot
console.log('=== BENEATH SLOT ===', JSON.stringify(Layout.beneathSlot()));

// unknown-district assertion
try { Layout.solve([{id:'x', district:'nowhere', tier:1}]); console.log('  ASSERT FAILED: unknown district did not throw'); fail++; }
catch(e){ console.log('  ✓ unknown district throws:', e.message.slice(0,60)); }

/* ════════════════════════════════════════════════════════════════════════════
   OBSERVATORY RINGS — HARD PASS (#275). The Observatory Rise lays out as a
   concentric-ring (contour-map) formation, NOT a packed grid: the grid collapsed
   its ~13 rooms into one crushed column whose circular icon-backings + labels
   overlapped illegibly. This asserts the CLAIM over the LIVE observatory PLACES:
   (A) every PAIR of observatory foot circles (the backings) is pairwise NON-
       OVERLAPPING — centre-distance ≥ r_i + r_j, no two discs intersect;
   (B) the whole formation stays INSIDE the observatory district frame (no spill
       past the plate); and (C) the GENERAL column-collapse GUARD fires LOUD when a
       crowded district would otherwise stack one crushed column. ── */
function observatoryRingsSelfTest() {
  const LIVE = loadLive();
  const obs = LIVE.filter(p => p.district === 'observatory');
  const s = Layout.solve(LIVE);
  console.log('\n=== OBSERVATORY RINGS (the rise as a contour-map · #275) — HARD PASS ===');

  // the foot CIRCLE (backing) of each observatory room: a tower draws its inscribed
  // circle directly; a non-tower's backing is the inscribed circle of its square.
  function circ(f) {
    return f.r != null ? { cx: f.x, cy: f.y, r: f.r }
      : { cx: f.x + f.w / 2, cy: f.y + f.h / 2, r: Math.min(f.w, f.h) / 2 };
  }
  const circles = obs.map(o => ({ id: o.id, ...circ(s.foot[o.id]) }));

  // (A) PAIRWISE-DISJOINT backings: every centre-distance ≥ r_i + r_j.
  let minSlack = Infinity, worstPair = null, disjoint = true;
  for (let i = 0; i < circles.length; i++) for (let j = i + 1; j < circles.length; j++) {
    const ci = circles[i], cj = circles[j];
    const d = Math.hypot(ci.cx - cj.cx, ci.cy - cj.cy);
    const slack = d - (ci.r + cj.r);                 // ≥ 0 ⇔ discs don't intersect
    if (slack < minSlack) { minSlack = slack; worstPair = ci.id + '×' + cj.id; }
    if (slack < -1e-6) { disjoint = false; console.log('    BACKING-OVERLAP', ci.id, '×', cj.id, 'slack=' + slack.toFixed(2)); }
  }
  if (!disjoint) fail++;
  console.log('  (A) pairwise-disjoint backings (' + obs.length + ' rooms, ' +
    (obs.length * (obs.length - 1) / 2) + ' pairs): ' +
    (disjoint ? '✓ NO two foot circles intersect' : '✗ SEE OVERLAPS') +
    '  [tightest gap ' + minSlack.toFixed(2) + 'px @ ' + worstPair + ']');

  // (B) INSIDE THE DISTRICT FRAME: every backing circle is enclosed by the
  //     observatory district rect (no spill past the plate frame).
  const dr = s.districtRects.find(d => d.district === 'observatory');
  let inFrame = true;
  for (const c of circles) {
    const ok = c.cx - c.r >= dr.x - 0.5 && c.cx + c.r <= dr.x + dr.w + 0.5 &&
               c.cy - c.r >= dr.y - 0.5 && c.cy + c.r <= dr.y + dr.h + 0.5;
    if (!ok) { inFrame = false; console.log('    SPILL', c.id, 'circle escapes the frame'); }
  }
  // and the district frame itself stays inside the declared region (no plate spill).
  const reg = Layout.DISTRICTS.observatory.region;
  const frameInRegion = dr.x >= reg.x - 0.5 && dr.y >= reg.y - 0.5 &&
    dr.x + dr.w <= reg.x + reg.w + 0.5 && dr.y + dr.h <= reg.y + reg.h + 0.5;
  if (!inFrame || !frameInRegion) fail++;
  console.log('  (B) formation inside the district frame: ' +
    (inFrame ? '✓ every backing ⊆ frame' : '✗ a backing spills') + ', ' +
    (frameInRegion ? '✓ frame ⊆ region (no plate spill)' : '✗ frame spills past the region'));

  // (C) the COLUMN-COLLAPSE GUARD: a crowded grid district (NOT the observatory)
  //     with rooms that can't fit one column's width fails LOUD at build time.
  let guardFired = false;
  try {
    Layout.solve([
      ...Array.from({ length: 9 }, (_, i) => ({ id: 'g' + i, district: 'outbuilding', tier: 1, footprint: 'shed', order: i }))
    ]);
  } catch (e) { guardFired = /collapse|column/.test(e.message); }
  if (!guardFired) fail++;
  console.log('  (C) column-collapse guard fires for a crowded grid district: ' +
    (guardFired ? '✓ build-error LOUD (no silent overlap)' : '✗ guard did NOT fire'));

  console.log('  ── OBSERVATORY RINGS: ' +
    (disjoint && inFrame && frameInRegion && guardFired ? '✓ ALL CLAIMS PASS' : '✗ SEE FAILURES ABOVE') + ' ──');
}
observatoryRingsSelfTest();

/* ════════════════════════════════════════════════════════════════════════════
   PLATES — "More Than One Front Door" (#262). A HARD PASS section (unlike the
   whole-door legibility WARNING below, which stays expected-red as the #103
   record). The front door is now a SET of plates the visitor travels between;
   this asserts the SOLE-authority model is sound. Reads the REAL PLACES out of
   index.src.html (they carry room/piece/tag so the name-only label boxes are
   faithful). Adopts Explorer 2's MEASURED, PASSING construction rule: re-lay each
   plate into a generous open frame + score NAME-ONLY (the at-a-glance label is the
   room name; the "PIECE · tag" sub-line is the reward-on-arrival under the loupe). */
function plateSelfTest() {
  const LIVE = loadLive();

  console.log('\n=== PLATES (More Than One Front Door · #262) — HARD PASS ===');
  const P = Layout.plates(LIVE);

  // CRUX 1 — TOTAL + DISJOINT cover: every room resolves to exactly one plate.
  let total = 0; const seen = new Set(); let dup = false;
  for (const id of P.ids) for (const r of P.members[id]) {
    if (seen.has(r.id)) { dup = true; console.log('    DUP', r.id); }
    seen.add(r.id); total++;
  }
  const cover = (total === LIVE.length && seen.size === LIVE.length && !dup);
  if (!cover) fail++;
  console.log('  CRUX 1 cover: ' + total + '/' + LIVE.length + ' rooms → exactly one of ' +
    P.ids.length + ' plates ' + (cover ? '✓ TOTAL+DISJOINT' : '✗'));
  console.log('    plates: ' + P.ids.join(', '));

  // CRUX 2 — PER-PLATE FLOOR (the load-bearing assertion): every room-bearing plate,
  // re-laid + NAME-ONLY scored, composites < THRESHOLD (LEGIBLE) ALONE.
  let allFloor = true;
  for (const id of P.ids) {
    const rooms = P.members[id];
    const relay = Layout.relayPlate(rooms);
    const rep = Leg.score({ foot: relay.foot, footMeta: relay.footMeta, graph: null }, relay.places, { nameOnly: true });
    const ok = rep.overall.composite < Leg.THRESHOLD;
    if (!ok) { allFloor = false; fail++; }
    console.log('    ' + id.padEnd(14) + ' n=' + String(rooms.length).padStart(2) +
      ' name-only-relay=' + rep.overall.composite.toFixed(3) + (ok ? ' ✓ LEGIBLE' : ' ✗ CROWDED'));
  }
  console.log('  CRUX 2 per-plate floor (re-lay + name-only < ' + Leg.THRESHOLD + '): ' + (allFloor ? '✓ ALL plates LEGIBLE alone' : '✗'));
  // the MID/ROOT resting layer (captions only, zero room labels) is also LEGIBLE
  const restRep = Leg.score(P.solution, []);
  if (!restRep.pass) fail++;
  console.log('    resting layer score(sol,[]) = ' + restRep.overall.composite +
    ' ' + (restRep.pass ? '✓ LEGIBLE (zero room labels)' : '✗'));

  // CRUX 3 — TWO NEG-CONTROLS proving it is the split+name-only that carries it.
  // NC1: all rooms forced onto ONE plate, FULL labels → CROWDED.
  const allRelay = Layout.relayPlate(LIVE);
  const nc1 = Leg.score({ foot: allRelay.foot, footMeta: allRelay.footMeta, graph: null }, LIVE);
  const nc1ok = nc1.overall.composite >= Leg.THRESHOLD;
  if (!nc1ok) fail++;
  console.log('  CRUX 3 NC1 (all ' + LIVE.length + ' on one plate, FULL labels): ' +
    nc1.overall.composite.toFixed(3) + ' ' + nc1.overall.verdict +
    (nc1ok ? ' ✓ CROWDED (the split carries legibility, not the camera)' : ' ✗ expected CROWDED'));
  // NC2: a re-laid plate WITH full sub-lines reads CROWDED where name-only PASSES
  // → name-only is load-bearing (it is split+name-only, not the zoom alone).
  let nc2plate = null;
  for (const id of P.ids) {
    const rooms = P.members[id]; const relay = Layout.relayPlate(rooms);
    const full = Leg.score({ foot: relay.foot, footMeta: relay.footMeta, graph: null }, relay.places);
    const name = Leg.score({ foot: relay.foot, footMeta: relay.footMeta, graph: null }, relay.places, { nameOnly: true });
    if (full.overall.composite >= Leg.THRESHOLD && name.overall.composite < Leg.THRESHOLD) {
      nc2plate = { id, full: full.overall.composite, name: name.overall.composite }; break;
    }
  }
  if (!nc2plate) fail++;
  console.log('  CRUX 3 NC2 (name-only is load-bearing): ' +
    (nc2plate ? ('plate ' + nc2plate.id + ' FULL=' + nc2plate.full.toFixed(3) + ' CROWDED vs name-only=' +
      nc2plate.name.toFixed(3) + ' LEGIBLE ✓') : '✗ no plate where full FAILS + name-only PASSES'));

  // CRUX 4 — ROAD GRAPH: every threshold link resolves + reciprocates, all reachable.
  let recip = true;
  for (const a in P.adj) for (const b in P.adj[a]) if (!(P.adj[b] && P.adj[b][a])) { recip = false; console.log('    NON-RECIP', a, b); }
  const q = ['manor'], vis = new Set(q);
  while (q.length) { const x = q.shift(); for (const y in (P.adj[x] || {})) if (!vis.has(y)) { vis.add(y); q.push(y); } }
  const connected = vis.size === P.ids.length;
  if (!recip || !connected) fail++;
  console.log('  CRUX 4 road graph: ' + P.edges.length + ' edges, ' +
    (recip ? '✓ reciprocal (A↔B ⇔ B↔A)' : '✗ non-reciprocal') + ', ' +
    (connected ? '✓ all ' + vis.size + '/' + P.ids.length + ' reachable from the door' : '✗ ' + vis.size + '/' + P.ids.length + ' reachable'));
  console.log('    ' + P.edges.map(e => e[0] + '↔' + e[1]).join(', '));

  // CRUX 5 — the BENEATH slot rides the MANOR plate (never stranded). The manor
  // plate's bbox is EXTENDED to enclose the gated cellar slot; without the
  // extension the slot would fall outside (the extension is load-bearing).
  const bs = P.beneath, mb = P.bbox.manor;
  const enclosed = bs.x >= mb.x && bs.y >= mb.y && bs.x + bs.w <= mb.x + mb.w && bs.y + bs.h <= mb.y + mb.h;
  // re-derive the un-extended manor bbox from its member footprints
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of P.members.manor) {
    const f = P.solution.foot[r.id];
    const b = f.r != null ? { x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 } : f;
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
  }
  const bc = { x: bs.x + bs.w / 2, y: bs.y + bs.h / 2 };
  const inRaw = bc.x >= x0 && bc.x <= x1 && bc.y >= y0 && bc.y <= y1;
  const loadBearing = enclosed && !inRaw;  // enclosed only because of the extension
  if (!loadBearing) fail++;
  console.log('  CRUX 5 beneath rides the manor plate: ' +
    (enclosed ? '✓ slot ⊆ manor bbox' : '✗ slot NOT enclosed') + ', ' +
    (!inRaw ? '✓ extension is load-bearing (un-extended bbox ends y=' + Math.round(y1) + ' < slot)' : '✗ extension not needed'));

  console.log('  ── PLATE SELF-TEST: ' + (cover && allFloor && restRep.pass && nc1ok && nc2plate && recip && connected && loadBearing
    ? '✓ ALL CRUXES PASS' : '✗ SEE FAILURES ABOVE') + ' ──');
}
plateSelfTest();

/* ════════════════════════════════════════════════════════════════════════════
   WING-ON-WING DISJOINTNESS — HARD PASS (#283). Two parts.

   PART A — THE GUARD IS LIVE (not dead code): the live solve already proved every
   pair of GROUNDS wing rects is disjoint (✓ ALL LAYOUT CHECKS PASS above runs the
   in-solve assertGroundsWingsDisjoint over the real content). Here we prove the
   guard FIRES: collide drawing-engines back onto curved-country's old patch and
   confirm solve() throws naming BOTH wings — so we KNOW the assertion is wired, not
   inert. (We mutate a copy of GROUNDS_WINGS, then restore it.)

   PART B — generalise the disjointness to ALL drawn ground (the forward ratchet's
   first half): assert that no two GROUNDS wing rects AND no two room FOOTPRINTS share
   ground in the live solve. (Footprint overlap is already counted above; this names
   it as the same #283 invariant so the intent reads in one place.) ── */
function wingDisjointSelfTest() {
  console.log('\n=== WING-ON-WING DISJOINTNESS (#283) — HARD PASS ===');

  // PART A — the guard fires on a deliberate collision. Two grounds wings, each with
  // one room, budgeted onto the SAME lower-west patch (exactly the original #283 bug):
  // their solved tint rects overlap and solve() must throw naming BOTH wings.
  const saved = { ...Layout.GROUNDS_WINGS };
  const collide = [
    { id: 'scratch-holonomy', district: 'grounds', tier: 1, wing: 'curved-country', footprint: 'hall' },
    { id: 'scratch-pantograph', district: 'grounds', tier: 1, wing: 'drawing-engines', footprint: 'drawing-table' }
  ];
  let fired = false, msg = '';
  try {
    Layout.GROUNDS_WINGS['curved-country']  = { x: 170, y: 520, w: 150, h: 160 };
    Layout.GROUNDS_WINGS['drawing-engines'] = { x: 166, y: 540, w: 150, h: 150 };   // back onto the bug patch
    Layout.solve(collide);
  } catch (e) {
    fired = /GROUNDS wings share DRAWN ground/.test(e.message);
    msg = e.message.split('.')[0];
  } finally {
    Layout.GROUNDS_WINGS['curved-country']  = saved['curved-country'];
    Layout.GROUNDS_WINGS['drawing-engines'] = saved['drawing-engines'];
  }
  if (!fired) fail++;
  console.log('  (A) guard FIRES on two wings re-collided onto one patch: ' +
    (fired ? '✓ build-error LOUD — "' + msg + '"' : '✗ guard did NOT fire (dead code!)'));
  // and the canonical PLACES solve again CLEAN now that the budgets are restored (live, not stuck)
  let cleanAgain = true;
  try { Layout.solve(PLACES); } catch (e) { cleanAgain = false; }
  if (!cleanAgain) fail++;
  console.log('  (A) and the restored layout solves CLEAN: ' +
    (cleanAgain ? '✓ guard passes the real content' : '✗ still throwing after restore'));

  // PART B — no two GROUNDS wing rects, no two room footprints, share ground (live).
  const gw = sol.wingRects.filter(w => w.district === 'grounds');
  let wingPairs = 0, wingBad = 0;
  for (let i = 0; i < gw.length; i++) for (let j = i + 1; j < gw.length; j++) {
    wingPairs++;
    if (Layout.rectsOverlap(gw[i], gw[j])) { wingBad++; console.log('    WING-OVERLAP', gw[i].wing, '×', gw[j].wing); }
  }
  if (wingBad) fail++;
  console.log('  (B) ' + gw.length + ' grounds wing rects, ' + wingPairs + ' pairs: ' +
    (wingBad ? '✗ ' + wingBad + ' overlap' : '✓ ALL mutually disjoint (no label stacks on label)'));

  console.log('  ── WING-ON-WING DISJOINTNESS: ' +
    (fired && cleanAgain && !wingBad ? '✓ ALL CLAIMS PASS' : '✗ SEE FAILURES ABOVE') + ' ──');
}
wingDisjointSelfTest();

/* ════════════════════════════════════════════════════════════════════════════
   THE NUMBER WING'S PASCAL TRIANGLE — HARD PASS (#328). The grounds-side echo of
   the observatory-rings check (#275). The number wing's rooms used to pack through
   the shared grid, which forced ONE crushed column (its tight sub-region fits only 1
   column of tier-2 lots) and fitInto then crushed that tall stack into 14×10px specks.
   placeNumberPascal now lays the wing as a centred Pascal's TRIANGLE. Over the LIVE
   number-wing solve this asserts:
   (A) EVERY number-room footprint ≥ a MIN-LEGIBLE size — no specks, on par with the
       sibling grounds wings (the 14×10 crush is gone);
   (B) the rows STRICTLY widen toward the base — a real triangle (apex of 1, each row
       wider than the one above), not a column and not a square; and
   (C) a NEG-CONTROL proving the bespoke formation is load-bearing: the shared GRID
       would still collapse these rooms into 1 column in this region (colsByWidth==1),
       so it is the triangle — not a roomier budget — that rescues legibility. ── */
function numberPascalSelfTest() {
  console.log('\n=== THE NUMBER WING — PASCAL TRIANGLE (the grounds-side rings · #328) — HARD PASS ===');
  const MIN_W = 30, MIN_H = 20;                            // the "no speck" floor (crowded siblings sit ~28-31px; the crush was 14×10)
  const numIds = PLACES.filter(p => p.wing === 'number').map(p => p.id);
  if (!numIds.length) { console.log('  (no number-wing rooms in the live PLACES — skipping)'); fail++; return; }
  const feet = numIds.map(id => sol.foot[id]);

  // (A) MIN-LEGIBLE — no footprint is a speck.
  let smallest = Infinity, smallId = null, legible = true;
  for (const id of numIds) {
    const f = sol.foot[id]; const w = f.r != null ? f.r * 2 : f.w, h = f.r != null ? f.r * 2 : f.h;
    if (Math.min(w, h) < smallest) { smallest = Math.min(w, h); smallId = id; }
    if (w < MIN_W - 0.5 || h < MIN_H - 0.5) { legible = false; console.log('    SPECK', id, Math.round(w) + '×' + Math.round(h)); }
  }
  if (!legible) fail++;
  const minW = Math.round(Math.min(...feet.map(f => f.w))), minH = Math.round(Math.min(...feet.map(f => f.h)));
  console.log('  (A) min-legible (≥ ' + MIN_W + '×' + MIN_H + '): smallest lot ' + minW + '×' + minH +
    ' @ ' + smallId + ' — ' + (legible ? '✓ no specks (the 14×10 crush is gone)' : '✗ SEE SPECKS'));

  // (B) group rooms into rows by Y; the rows must STRICTLY widen toward the base.
  const rowsMap = {};
  for (const id of numIds) { const f = sol.foot[id]; const key = Math.round(f.y); (rowsMap[key] = rowsMap[key] || []).push(f); }
  const ys = Object.keys(rowsMap).map(Number).sort((p, q) => p - q);
  const rowW = ys.map(y => { const a = rowsMap[y]; return Math.max(...a.map(f => f.x + f.w)) - Math.min(...a.map(f => f.x)); });
  const rowN = ys.map(y => rowsMap[y].length);
  let strict = ys.length >= 3 && rowN[0] === 1;           // a real triangle: ≥3 rows, apex of 1
  for (let i = 1; i < rowW.length; i++) if (rowW[i] <= rowW[i - 1] + 1e-6) strict = false;
  if (!strict) fail++;
  console.log('  (B) rows strictly widen toward the base: ' + ys.length + ' rows ' +
    rowN.map((n, i) => n + ':' + Math.round(rowW[i]) + 'px').join(' → ') + ' — ' +
    (strict ? '✓ a real triangle (apex of 1, each row wider)' : '✗ NOT strictly widening'));

  // (C) NEG-CONTROL: the shared grid would STILL collapse this wing into 1 column in
  //     its region, so the bespoke triangle is what carries legibility (not the budget).
  const reg = Layout.GROUNDS_WINGS.number;
  const band = Layout.bandFor(2, 'grounds');               // the wing's tier-2 lot
  const WING_PAD = 14, GUTTER = 16;                         // the grid's pad + gutter (placeGrounds path)
  const maxW = reg.w - 2 * WING_PAD;
  const colsByWidth = Math.max(1, Math.floor((maxW + GUTTER) / (band.w + GUTTER)));
  const gridWouldCollapse = colsByWidth === 1;
  if (!gridWouldCollapse) fail++;
  console.log('  (C) neg-control — the shared grid still forces 1 column here (' + band.w +
    'px lots in a ' + reg.w + 'px region → colsByWidth=' + colsByWidth + '): ' +
    (gridWouldCollapse ? '✓ the triangle is load-bearing, not the budget' : '✗ grid would NOT collapse (NC void)'));

  console.log('  ── NUMBER WING PASCAL TRIANGLE: ' +
    (legible && strict && gridWouldCollapse ? '✓ ALL CLAIMS PASS' : '✗ SEE FAILURES ABOVE') + ' ──');
}
numberPascalSelfTest();

/* ════════════════════════════════════════════════════════════════════════════
   #103 CROWDING-REGRESSION RATCHET (#283, second half of the forward ratchet).
   The FULL-plate label-crowding (every room's label drawn at once) is DELIBERATELY
   tolerated — the door draws ZERO room labels at rest and the visitor TRAVELS between
   plates rather than reading every label simultaneously (#103 / #212). So we do NOT
   flip the #103 WARNING to a hard fail. Instead we PIN the post-#283-fix CLEAN full-
   plate composite as a BASELINE and FAIL the build only if a LATER addition pushes
   crowding MEASURABLY above it. The #103 "intended" warning keeps its rationale; this
   just stops the next room from quietly re-crowding the plate past where we left it. ── */
const CROWDING_BASELINE = 0.929;   // re-baselined #358: The Standing Stones joined the amusements wing (its
                                   //   herding-puzzle kin, a sibling of The Shepherd under the Drover roof — an
                                   //   intentional room-add, the documented "if intentional, re-baseline" path).
                                   //   The grounds full-plate composite rose 0.919→0.929 as the new bench packed
                                   //   into the densest district; pinned here so the next add is measured against
                                   //   today's truth. The door draws ZERO room labels at rest (#212), so the
                                   //   full-plate crowding stays an intended WARNING, not a defect. (was 0.919:)
                                   // re-baselined #328: the number wing's Pascal triangle (placeNumberPascal)
                                   //   spreads its 9 labels out of one crushed column, so the full-plate
                                   //   composite DROPPED 0.955→0.919 (a genuine de-crowding) — re-pinned per
                                   //   the ratchet's own ≥0.02-drop guidance so the next add is measured
                                   //   against today's truth, not stale slack. (was 0.955, the #295 value:)
                                   // re-baselined #295 when The Cartouche joined drawing-engines (an
                                   //   intentional room-add — the documented "if intentional, re-baseline"
                                   //   path). NOTE: the ratchet was ALREADY tripped at HEAD before #295
                                   //   (composite had drifted to 0.949 > the old 0.938 ceiling as rooms
                                   //   accreted without a re-baseline); this pins the new clean full-plate
                                   //   composite WITH the cartouche so the next add is measured against
                                   //   today's truth. The door draws ZERO room labels at rest (#212), so
                                   //   the full-plate crowding remains an intended WARNING, not a defect.
                                   //   (was 0.934, the #283 West-Grounds-fix value.)
const CROWDING_TOL = 0.004;        // a hair of slack for harmless reorderings (≈0.4%)
function crowdingRatchet() {
  const LIVE = loadLive();
  const rep = Leg.score(Layout.solve(LIVE), LIVE);
  const c = rep.overall.composite;
  const ceiling = CROWDING_BASELINE + CROWDING_TOL;
  console.log('\n=== #103 CROWDING-REGRESSION RATCHET (#283) — HARD PASS ===');
  const ok = c <= ceiling + 1e-9;
  if (!ok) fail++;
  console.log('  full-plate composite ' + c.toFixed(3) + ' vs baseline ' + CROWDING_BASELINE.toFixed(3) +
    ' (+tol ' + CROWDING_TOL + ' → ceiling ' + ceiling.toFixed(3) + '): ' +
    (ok ? '✓ NO regression past the #283 baseline' :
      '✗ CROWDING REGRESSED — a recent addition pushed the plate past where #283 left it. ' +
      'Re-budget / re-home the new room (or, if intentional, re-baseline CROWDING_BASELINE here).'));
  if (c + 0.02 < CROWDING_BASELINE) {
    console.log('  NOTE: composite dropped ≥0.02 below the baseline — the plate got LESS crowded; ' +
      'consider lowering CROWDING_BASELINE to ' + c.toFixed(3) + ' so the ratchet stays tight.');
  }
}
crowdingRatchet();

console.log(fail ? ('\n✗ '+fail+' STRUCTURAL FAILURES') : '\n✓ ALL LAYOUT CHECKS PASS');

/* ── LEGIBILITY (modeled-label crowding PROXY · #103) ──────────────────────────
   Read the REAL 37-POI PLACES straight out of index.src.html (the single source of
   truth — it carries room/piece/tag, so the modeled label boxes are faithful) and
   run the legibility conscience. This is a WARNING section, NOT part of `fail`. */
function liveLegibility() {
  const LIVE = loadLive();
  const sol = Layout.solve(LIVE);
  const rep = Leg.score(sol, LIVE);
  console.log('\n=== LEGIBILITY (modeled-label crowding PROXY · #103) ===');
  console.log(Leg.renderAscii(rep));

  // ── THE RESTING FIT-VIEW LAYER (#212 — the front door, made passable) ──────────
  //    The live door now draws ZERO per-room labels at fit-view — only the engraved
  //    district/wing captions. The layer a visitor READS is the EMPTY label set, so
  //    score it directly: Legibility.score(sol, []) → LEGIBLE. A room names itself in
  //    full only under the loupe (hover / tab-focus / zoom); the revealed declutter is
  //    proven overlap-free in-browser (the door pill's Claim B). The FULL-plate score
  //    above is kept as the honest #103 record — the pressure the layer would have if
  //    it were all drawn at once — never DEFINED AWAY, just no longer DRAWN at rest.
  const restRep = Leg.score(sol, []);
  console.log('\n  RESTING fit-view layer (zero per-room labels — only district captions):');
  if (restRep.pass) {
    console.log('    ✓ LEGIBLE (composite ' + restRep.overall.composite + ' < ' + restRep.threshold +
      ') — the door is passable at the layer a visitor reads (#212).');
  } else {
    console.log('    ✗ unexpectedly CROWDED (composite ' + restRep.overall.composite + ') — the resting ' +
      'layer should be empty-set LEGIBLE; investigate.');
  }
  if (rep.pass) {
    console.log('\n  ✓ full plate is LEGIBLE (composite ' + rep.overall.composite + ' < ' + rep.threshold + ')');
  } else {
    const o = rep.overall;
    console.log('\n  ⚠ WARNING (intended · #103): the FULL plate (all labels at once) is CROWDED — composite ' +
      o.composite + ' > threshold ' + rep.threshold + '.');
    console.log('    pressure-hottest = ' + o.pressureHottest.district +
      ' (composite ' + o.pressureHottest.composite + ', what a viewer sees);' +
      ' count-hottest = ' + o.countHottest.district + ' (n=' + o.countHottest.n + ', raw rooms).');
    console.log('    This is the layer the door NO LONGER DRAWS at rest (#212): the fit-view shows only the' +
      ' district captions (LEGIBLE above); rooms name themselves under the loupe.' +
      ' This WARNING does NOT fail the structural smoke (exit-code policy: see legibility.cjs header).');
  }
}
liveLegibility();

process.exit(fail?1:0);
