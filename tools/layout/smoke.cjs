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

// the declarative PLACES (content stripped; only spatial declarations matter here)
const PLACES = [
  { id:'verse', district:'manor', tier:2, wing:'studies', footprint:'house-wing', order:10 },
  { id:'compositor', district:'manor', tier:2, wing:'studies', footprint:'house-wing', order:20 },
  { id:'cartographer', district:'manor', tier:2, wing:'studies', footprint:'house-wing', order:30 },
  { id:'sound-garden', district:'manor', tier:2, wing:'east', footprint:'house-wing', order:10 },
  { id:'threshold', district:'manor', tier:2, wing:'east', footprint:'east-wing', order:20 },
  { id:'clockwork', district:'manor', tier:2, wing:'maker', footprint:'clockwork' },
  { id:'aerodrome', district:'grounds', tier:1, wing:'aerospace', footprint:'launch-rail', prefer:'top' },
  { id:'strange-garden', district:'grounds', tier:1, wing:'glasshouses', footprint:'glasshouse' },
  { id:'kirigami', district:'grounds', tier:2, wing:'glasshouses', footprint:'glasshouse' },
  { id:'conservatory', district:'grounds', tier:2, wing:'conservatory', footprint:'glasshouse-wing' },
  { id:'hall-of-mirrors', district:'grounds', tier:1, wing:'optics', footprint:'hall' },
  { id:'refraction-run', district:'grounds', tier:1, wing:'optics', footprint:'tank', prefer:['bottom','right'] },
  { id:'numbers-room', district:'grounds', tier:2, wing:'number', footprint:'numbers-room' },
  { id:'benford-mill', district:'grounds', tier:2, wing:'number', footprint:'benford-mill', prefer:['bottom','right'] },
  { id:'hexapawn', district:'grounds', tier:2, wing:'number', footprint:'hexapawn', prefer:['bottom','right'] },
  { id:'quiet-room', district:'grounds', tier:2, wing:'number', footprint:'quiet-room', prefer:['bottom','right'] },
  { id:'the-coin-that-lies', district:'grounds', tier:2, wing:'number', footprint:'coin-balance', prefer:['bottom','right'] },
  { id:'belief-beam', district:'grounds', tier:2, wing:'number', footprint:'belief-beam', prefer:['bottom','right'] },
  { id:'midway', district:'grounds', tier:1, wing:'amusements', footprint:'coaster', order:5 },
  { id:'daedalus', district:'grounds', tier:1, wing:'amusements', footprint:'maze', order:20 },
  { id:'arcade', district:'grounds', tier:1, wing:'amusements', footprint:'arcade', order:10 },
  { id:'puzzle-pavilion', district:'grounds', tier:1, wing:'amusements', footprint:'pavilion', order:15 },
  { id:'warren', district:'grounds', tier:1, wing:'amusements', footprint:'warren', order:25 },
  { id:'engine-room', district:'grounds', tier:2, wing:'works', footprint:'engine', order:10 },
  { id:'alchemy', district:'grounds', tier:2, wing:'works', footprint:'laboratory', order:20 },
  { id:'lodestone-hall', district:'grounds', tier:1, wing:'induction', footprint:'coil', prefer:['right','bottom'] },
  { id:'bootstrap-bench', district:'grounds', tier:2, wing:'induction', footprint:'bootstrap-bench', prefer:['right','bottom'] },
  { id:'firmament', district:'observatory', tier:1, footprint:'tower' },
  { id:'relativity', district:'observatory', tier:1, wing:'moving-frame', footprint:'tower', prefer:'right' },
  { id:'first-light', district:'observatory', tier:1, wing:'cosmology', footprint:'tower', prefer:['left','bottom'] },
  { id:'recombination', district:'observatory', tier:1, wing:'cosmology', footprint:'tower', prefer:['left','bottom'] },
  { id:'breathing-star', district:'observatory', tier:2, wing:'stellar', footprint:'breathing-star', prefer:['right','bottom'] },
  { id:'transit', district:'observatory', tier:1, wing:'exoplanets', footprint:'tower', prefer:['right','bottom'] },
  { id:'equal-area-sweep', district:'observatory', tier:2, wing:'celestial-mechanics', footprint:'tower', prefer:['right','bottom'] },
  { id:'einstein-ring', district:'observatory', tier:2, wing:'celestial-mechanics', footprint:'tower', prefer:['right','bottom'] },
  { id:'workbench', district:'outbuilding', tier:3, footprint:'shed' },
  { id:'physics-lab', district:'cavern', tier:1, footprint:'cave' },
  { id:'undercroft', district:'beneath', tier:3, footprint:'stair', locked:true },
];

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

// footprint-vs-footprint overlap check
const ids = Object.keys(sol.foot);
for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
  const a=bbox(sol.foot[ids[i]]), b=bbox(sol.foot[ids[j]]);
  const ov = a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
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
   PLATES — "More Than One Front Door" (#262). A HARD PASS section (unlike the
   whole-door legibility WARNING below, which stays expected-red as the #103
   record). The front door is now a SET of plates the visitor travels between;
   this asserts the SOLE-authority model is sound. Reads the REAL PLACES out of
   index.src.html (they carry room/piece/tag so the name-only label boxes are
   faithful). Adopts Explorer 2's MEASURED, PASSING construction rule: re-lay each
   plate into a generous open frame + score NAME-ONLY (the at-a-glance label is the
   room name; the "PIECE · tag" sub-line is the reward-on-arrival under the loupe). */
function plateSelfTest() {
  const SRC = path.join(__dirname, '..', '..', 'index.src.html');
  const src = fs.readFileSync(SRC, 'utf8');
  const start = src.indexOf('const PLACES = [');
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) { console.log('  (could not read live PLACES — skipping plate self-test)'); return; }
  // eslint-disable-next-line no-eval
  const LIVE = eval('(' + src.slice(start + 'const PLACES = '.length, end + 2) + ')').filter(p => !p.locked);

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

console.log(fail ? ('\n✗ '+fail+' STRUCTURAL FAILURES') : '\n✓ ALL LAYOUT CHECKS PASS');

/* ── LEGIBILITY (modeled-label crowding PROXY · #103) ──────────────────────────
   Read the REAL 37-POI PLACES straight out of index.src.html (the single source of
   truth — it carries room/piece/tag, so the modeled label boxes are faithful) and
   run the legibility conscience. This is a WARNING section, NOT part of `fail`. */
function liveLegibility() {
  const SRC = path.join(__dirname, '..', '..', 'index.src.html');
  const src = fs.readFileSync(SRC, 'utf8');
  const start = src.indexOf('const PLACES = [');
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) { console.log('  (could not read live PLACES — skipping legibility)'); return; }
  // eslint-disable-next-line no-eval
  const LIVE = eval('(' + src.slice(start + 'const PLACES = '.length, end + 2) + ')').filter(p => !p.locked);
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
