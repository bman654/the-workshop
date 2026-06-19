/* smoke test: run Layout.solve over the declarative PLACES and verify every
   footprint stays inside FIELD and clear of all catalog stars. Node-only. */
const Layout = require('./layout.js');
const Sky = require('../sky/sky.js');
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
  { id:'numbers-room', district:'grounds', tier:2, wing:'number', footprint:'numbers-room' },
  { id:'midway', district:'grounds', tier:1, wing:'amusements', footprint:'coaster', order:5 },
  { id:'daedalus', district:'grounds', tier:1, wing:'amusements', footprint:'maze', order:20 },
  { id:'arcade', district:'grounds', tier:1, wing:'amusements', footprint:'arcade', order:10 },
  { id:'puzzle-pavilion', district:'grounds', tier:1, wing:'amusements', footprint:'pavilion', order:15 },
  { id:'warren', district:'grounds', tier:1, wing:'amusements', footprint:'warren', order:25 },
  { id:'engine-room', district:'grounds', tier:2, wing:'works', footprint:'engine', order:10 },
  { id:'alchemy', district:'grounds', tier:2, wing:'works', footprint:'laboratory', order:20 },
  { id:'firmament', district:'observatory', tier:1, footprint:'tower' },
  { id:'relativity', district:'observatory', tier:1, wing:'moving-frame', footprint:'tower', prefer:'right' },
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

console.log(fail ? ('\n✗ '+fail+' FAILURES') : '\n✓ ALL LAYOUT CHECKS PASS');
process.exit(fail?1:0);
